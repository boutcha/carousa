# Carsablanca — V1 Design Spec

**Date:** 2026-06-10
**Status:** Approved
**Supersedes:** Tonobil (April 2026) — fresh start, broader vision. Tonobil's codebase is retired; its lessons (two-step AI pipeline, FR/AR/EN + RTL i18n, Morocco-specific curated data) inform this design.

## Vision

Carsablanca is a "vehicle OS" for Morocco: a platform that helps Moroccans decide what vehicle to buy given their budget, financing options, and insurance costs — then accompanies them through paperwork and safe secondary-market purchases, and serves as the reference for comparing reliability and cost of ownership.

The full vision decomposes into phases:

1. **Phase 1 (this spec): Decision engine** — budget + needs in, ranked new & used shortlist out, with true cost of ownership.
2. **Phase 2: Used-listing checker** — paste a listing, get a report card (Tonobil reborn on the same car database).
3. **Phase 3: Paperwork companion** — carte grise transfer, vignette, contrôle technique workflows and reminders.
4. **Phase 4: Partner integrations** — real financing/insurance quotes, lead-gen monetization.

This spec covers Phase 1 only. Each later phase gets its own spec.

## Problem

A Moroccan buyer with a budget (cash or monthly) faces an opaque market: new vs used trade-offs, financing products with hard-to-compare structures (crédit classique, LOA, mourabaha), insurance costs that vary by vehicle, and no visibility into what a car *really* costs per month once fuel, maintenance, reliability risk, and depreciation are counted. Existing sites list cars; nobody answers "what should I buy and what will it actually cost me?"

## V1 Scope

- **Vehicle types:** cars only (~top 40–50 models of the Moroccan market). Data model designed to extend to motorcycles/LCVs later.
- **Market:** both new and used — the new-vs-used trade-off at a given budget is the core product value.
- **Data strategy:** curated real dataset stored in Postgres, maintained via an admin UI. Every row carries `source_url`, `as_of`, `updated_by`. No live scraping, no LLM-generated numbers.
- **Intake:** guided wizard form feeding a deterministic engine. AI writes explanations only — never numbers.
- **Auth:** optional accounts. The full flow works anonymously; sign-in (Clerk) is offered only to save shortlists. Admin area is role-gated.

## User Flow

1. **Landing** — value proposition, "Find my car" CTA. Locale switcher (FR default, AR with RTL, EN).
2. **Wizard** (4 steps, target under 60 seconds):
   - **Budget** — mode toggle: total cash *or* monthly amount + optional down payment. Accepted financing types: crédit classique, LOA, mourabaha, cash-only (mourabaha supports halal-only buyers).
   - **Usage** — km/year, city vs highway mix, city of residence.
   - **Needs** — seats/family size, body type (citadine/berline/SUV/break), fuel preference, transmission, must-haves (AC, touchscreen, safety, big trunk).
   - **Condition** — new only / used only / both; if used: max age and km tolerance; ownership horizon (years they plan to keep the car).
3. **Results** — ranked cards. Headline = **out-of-pocket monthly cost** (financing payment + insurance + fuel + maintenance). Acquisition price, cost-breakdown expander, AI-written "why this fits you" paragraph in the user's locale, badges ("most reliable", "cheapest to own", "best resale"). Compare checkboxes.
4. **Compare** — side-by-side: monthly all-in, total cost over horizon, breakdown rows, reliability score, known issues, parts availability, estimated resale value.
5. **Car detail** (`/voiture/[slug]`) — trims, new price and used price curve, running costs, known issues by mileage, interactive financing simulator (down payment / duration sliders → monthly payment).
6. **Save & share** — results and compare URLs encode wizard answers (no storage needed to share). "Save my shortlist" triggers optional Clerk sign-in; saved lists live at `/mes-listes`.

### Trust design (differentiator)

- Every number displays its source and `as_of` date on expand.
- Data older than 90 days gets a "verify before buying" badge.
- Persistent "estimates — not offers" disclaimer.
- Numbers come exclusively from the deterministic engine; AI text is clearly framed as explanation.

## Architecture

- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS + shadcn/ui.
- **Hosting:** Vercel.
- **Database:** Neon Postgres (Vercel Marketplace) with Drizzle ORM.
- **Auth:** Clerk (Vercel Marketplace) — optional user accounts + `admin` role.
- **AI:** Vercel AI SDK via AI Gateway (`"provider/model"` strings), used only for result explanations.
- **i18n:** `[locale]` route segment, JSON dictionaries, `dir="rtl"` for Arabic (pattern proven in Tonobil).

### Module boundaries

- `lib/engine/` — **pure TypeScript functions, no DB or AI calls.** Takes typed inputs (candidates, wizard params, financing products, formula params), returns scored results. Fully unit-testable; replaceable data layer.
- `lib/db/` — Drizzle schema + query functions. The only layer that touches Postgres.
- `lib/ai/` — explanation generation, locale-aware, cached.
- `app/[locale]/` — public pages (landing, wizard, results, compare, car detail, saved lists).
- `app/admin/` — role-gated data maintenance.

## Data Model

| Table | Contents |
|---|---|
| `brands` | id, name |
| `models` | brand_id, name, slug, body_type, segment, seats, availability (new_available / used_only) |
| `trims` | model_id, name, fuel, transmission, engine, fiscal_hp, consumption_l_100km, new_price_mad (nullable), features (jsonb) |
| `used_prices` | model_id, year, km_band, price_min / median / max (MAD) |
| `reliability` | model_id, score (1–10), known_issues (jsonb: at_km, description, est_cost_min/max), parts_availability, maintenance_annual_min/max |
| `financing_products` | provider, type (credit / loa / mourabaha), rate_or_margin, min_down_pct, durations_months[], eligibility (new / used / both), conditions |
| `insurance_params` | formula parameters: RC tariff by fiscal HP & fuel, tous-risques % of vehicle value, fixed extras |
| `fuel_prices` | fuel type, price_mad_per_litre |
| `shortlists` | user_id (nullable), share_id (nanoid), wizard params (jsonb), car ids, created_at |
| `explanation_cache` | (car id, params-hash, locale) → AI text |

All data tables carry `source_url`, `as_of`, `updated_by`, `updated_at`.

### Initial dataset

Top ~40–50 models compiled via AI-assisted web research into JSON (every entry with source + date), human-reviewed, seeded through the admin bulk import. Dataset compilation is part of the implementation plan, treated as a first-class deliverable with its own validation script.

## Admin Area

`/admin`, Clerk role-gated:

- CRUD forms for every data table.
- Bulk JSON import/export (seeding and backup).
- Freshness dashboard: rows sorted by oldest `as_of`, so re-verification work is visible.
- Data-gap log: candidates excluded from results due to missing fields appear here.

## TCO Engine

Deterministic pipeline:

1. **Candidate generation** — every (model, trim, condition) combo; used cars expand into year bands with median price and estimated mileage. Hard filters: seats, body type, fuel, transmission, condition, max age/km.
2. **Financing** — per candidate, evaluate each accepted product type:
   - *Crédit classique:* standard amortization from the product's rate → monthly payment, total cost of credit.
   - *LOA:* down payment + monthlies + residual purchase option.
   - *Mourabaha:* price + margin spread over duration.
   - Engine selects the cheapest eligible product; affordability = monthly payment + running costs ≤ monthly budget (monthly mode) or price ≤ cash (cash mode).
3. **Insurance** — RC from regulated tariff by fiscal HP & fuel, plus tous-risques as % of vehicle value (recommended when car < 5 years). Formula params from DB.
4. **Fuel** — consumption × km/year × current price, weighted by city/highway mix.
5. **Maintenance + risk reserve** — annual band by model age, plus known issues whose `at_km` falls within the user's ownership window, amortized over the horizon.
6. **Depreciation** — value today vs interpolated value at end of horizon from the used-price curve.
7. **Two output numbers per car:**
   - *Out-of-pocket monthly* (headline): payment + insurance/12 + fuel + maintenance.
   - *True total cost* (detail): everything including depreciation over the horizon.
8. **Ranking** — weighted score: budget headroom, needs match, reliability, parts availability, resale strength. Weights fixed in code for V1.

## Error Handling

- **Zero matches:** concrete relaxation suggestions computed by re-running the engine with loosened constraints ("accepting used adds 12 options; +500 MAD/month adds 8").
- **Missing data:** candidate excluded — never guessed — and the gap logged to the admin dashboard.
- **AI failure:** results render fully without explanations; numbers never depend on AI.
- **Stale data:** "verify" badge on anything older than 90 days.
- **Invalid/garbled wizard params in shared URLs:** validated with Zod; fall back to wizard step 1 with a friendly message.

## Testing

- **Unit tests** on every engine function; financing math verified against known amortization tables.
- **Golden cases:** fixed wizard inputs → expected shortlists, so ranking changes are deliberate.
- **Seed-data validation script:** schema + sanity ranges (no zero-MAD cars, consumption within bounds, used prices monotonic by year).
- **E2E (Playwright):** wizard → results → compare → share URL round-trip.

## Out of Scope for V1

- Listing analysis / report cards (Phase 2).
- Paperwork workflows and reminders (Phase 3).
- Real-time quotes or partner APIs (Phase 4).
- Motorcycles, LCVs, trucks.
- Scraping pipelines.
- Mobile app.
- Conversational/chat intake.
