# Mobile Scenario Workbench Design

**Date:** 2026-06-12
**Status:** Approved for implementation planning
**Route:** `/[locale]/trouver`

## Goal

Turn the mobile find page from a compact filter form into a guided buyer advisor. The user should describe how they plan to buy, how they will use the car, who needs to fit, and what matters most. Carsablanca then ranks new, used, and common-import candidates automatically and lets the user compare payment scenarios from the results page.

The mobile promise is: **tell us your reality; we compare the market and financing scenarios for you.**

## Product Principles

- Start with payment reality, not a generic budget.
- Remove condition choice from intake. New vs used vs import is an output decision, not a required upfront filter.
- Separate constraints from priorities.
- Keep the intake short enough to finish on a phone in about one minute.
- Let users refine answers after seeing results, because car choice is scenario-driven.
- Reveal complexity progressively: headline recommendation first, assumptions and sources on expand.

## Mobile Flow

### 1. Buying Mode

Question: "How do you want to buy?"

Options:

- Cash
- Credit
- Mourabaha
- Not sure

The selected mode controls the affordability fields on the next step.

### 2. Affordability

Cash:

- Total amount available.

Credit:

- Comfortable monthly payment.
- Down payment available.
- Duration, defaulting to 60 months.
- Interest rate kept as an advanced assumption, with a market default.

Mourabaha:

- Comfortable monthly payment.
- Down payment available.
- Duration.
- Margin kept as an advanced assumption, with a market default.

Not sure:

- Comfortable monthly payment.
- Cash available upfront.
- Carsablanca compares cash, credit, and mourabaha scenarios.

### 3. Usage

Question: "Where will you mostly drive?"

Options:

- Town
- Mixed
- Long distance

Annual kilometers remain available as a simple selector, defaulting from the usage choice.

### 4. Space Needs

Question: "Who and what needs to fit?"

Controls:

- Minimum seats.
- Family size.
- Trunk importance.
- Easy parking importance.

These are constraints when hard requirements are clear, and ranking signals when the user expresses preference rather than necessity.

### 5. Priorities

Question: "What matters most?"

The user chooses up to three priorities:

- Lowest monthly cost
- Reliability
- Cheap maintenance
- Fuel economy
- Family space
- Long-distance comfort
- Safety
- Resale value
- Premium feel
- Easy city parking

The ranking engine should use these as weights, and result cards should explain matches using the selected priorities.

### 6. Results Workbench

The results page becomes a scenario workbench:

- Sticky scenario summary at the top.
- Ranked cards across new, used, and common-import candidates.
- Adjust button opens a bottom sheet with the user's answers.
- Scenario tabs let users compare saved scenarios such as `Cash`, `Credit 60m`, and `Mourabaha 72m`.
- Cards show whether a recommendation improves or worsens compared with the previously selected scenario when possible.

## Results Card Hierarchy

Each mobile card should show, in order:

1. Brand, model, trim, and model year.
2. Candidate label: New, Used, Import baseline, Best value, Lower risk, More space.
3. Estimated monthly total.
4. Purchase price.
5. Three reasons tied to the selected priorities.
6. Expandable cost breakdown.
7. Expandable assumptions and sources.

The first card should be framed as the strongest recommendation for the active scenario.

## Scenario Adjustment

The adjust panel should be a mobile bottom sheet. It edits the active scenario without sending the user back through the full wizard.

Editable fields:

- Buying mode.
- Monthly comfort.
- Cash amount or down payment.
- Duration.
- Usage mode.
- Annual kilometers.
- Seat and space needs.
- Priorities.

The first implementation updates results after tapping `Update results`. Live updating on every control change is out of scope for this slice.

## New, Used, And Import Handling

Condition is not part of intake.

The matcher should consider all eligible candidates by default:

- Current Morocco new cars from `morocco_new`.
- Historical official used candidates from `morocco_used`.
- Common-import candidates from `morocco_imported_seen`.

The UI labels each result clearly. An advanced result filter can be offered after recommendations load for users who want to restrict to new, used, or import candidates.

## Data And Query Params

The route should continue to support shareable URLs. Wizard and workbench state can be encoded in query params for V1.

New or revised criteria fields:

- `mode`: `cash`, `credit`, `mourabaha`, `unsure`.
- `cashBudget`.
- `monthlyBudget`.
- `downPayment`.
- `durationMonths`.
- `usage`: `town`, `mixed`, `long_distance`.
- `annualKm`.
- `minSeats`.
- `familySize`.
- `trunkNeed`: `low`, `medium`, `high`.
- `parkingNeed`: `low`, `medium`, `high`.
- `priorities`: comma-separated list capped at three values.
- `condition`: optional advanced result filter only, not part of the default intake.

Existing URLs with `budget`, `usage`, `body`, `fuel`, `seats`, and `condition` should continue to parse. Legacy values should map into the closest new scenario rather than breaking.

## Architecture

The implementation should keep server-side catalog loading and ranking for the initial page render.

Recommended component split:

- Server route loads dictionary, parses search params, fetches candidates, ranks results.
- Mobile advisor form component renders the step flow and submits query params.
- Results workbench component renders scenario summary, adjustment controls, scenario tabs, and result cards.
- Shared parsing utilities normalize legacy and new query params.
- Ranking utilities accept priorities and scenario finance fields as structured criteria.

The initial implementation does not need full client-side ranking. Form submission with URL updates is acceptable and keeps results shareable.

## Error Handling

- Missing payment inputs fall back to conservative defaults and prompt the user to refine.
- Invalid numeric inputs are sanitized and ignored rather than crashing the route.
- No matches should show relaxation suggestions based on scenario changes, not only filter changes.
- Catalog load failure keeps the existing database error state.
- Unknown priority values are ignored.
- More than three priorities are truncated to the first three valid values.

## Internationalization

All new labels must be added for French, English, and Arabic dictionaries. Arabic must preserve RTL layout. Numeric currency fields should keep `dir="ltr"` where needed.

## Testing

Implementation should verify:

- Legacy query params still render results.
- Each buying mode parses into the expected scenario.
- Condition is absent from the default mobile intake.
- Priorities are capped at three and influence result reasons.
- Results render for cash, credit, mourabaha, and unsure scenarios.
- Mobile layout has no overflowing segmented controls or unreadable card text.

## Out Of Scope

- Real bank quote integrations.
- User accounts or persisted saved scenarios.
- Full spreadsheet-style comparison.
- Live client-side ranking on every slider movement.
- Listing-level used car analysis.
