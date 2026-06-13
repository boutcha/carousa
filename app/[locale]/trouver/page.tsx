import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowRight,
  CarFront,
  Database,
  Gauge,
  Search,
  SlidersHorizontal,
} from "lucide-react"

import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"
import { MobileAdvisorForm } from "@/components/matching/mobile-advisor-form"
import { ResultsWorkbench } from "@/components/matching/results-workbench"
import { getCatalogCandidates } from "@/lib/matching/catalog"
import {
  parseMatchCriteria,
  rankCandidates,
  type MatchCriteria,
  type MatchReason,
  type RankedCandidate,
} from "@/lib/matching/score"
import { cn } from "@/lib/utils"
import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

export const dynamic = "force-dynamic"

type SearchParams = Record<string, string | string[] | undefined>

export default async function TrouverPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const locale = (await params).locale as Locale
  const dict = await getDictionary(locale)
  const rawSearchParams = await searchParams
  const criteria = parseMatchCriteria(rawSearchParams)
  const t = dict.matching
  let matches: RankedCandidate[] = []
  let catalogError = false

  try {
    const candidates = await getCatalogCandidates()
    matches = rankCandidates(candidates, criteria, 6)
  } catch (error) {
    catalogError = true
    console.error("Unable to load catalog candidates", error)
  }

  const hasCriteria = Object.keys(rawSearchParams).length > 0
  const budgetValue = inputValue(rawSearchParams.budget)

  return (
    <>
      <SiteHeader dict={dict} locale={locale} />
      <main className="tarmac relative overflow-hidden bg-asphalte text-signal">
        <section className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[5fr_4fr] lg:gap-12 lg:pb-18 lg:pt-14">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-jaune">
              {t.kicker}
            </p>
            <h1 className="mt-4 max-w-full break-words font-display text-[clamp(2rem,8.5vw,5.2rem)] font-bold uppercase leading-[0.96] tracking-normal text-signal [overflow-wrap:anywhere] rtl:leading-[1.18]">
              {t.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-2-dark sm:text-lg">
              {t.sub}
            </p>

            <div className="mt-7 grid max-w-xl grid-cols-3 border border-signal/15 bg-bitume/70">
              <MetricPlate icon={<SlidersHorizontal size={17} />} {...t.metrics[0]} />
              <MetricPlate icon={<Database size={17} />} {...t.metrics[1]} />
              <MetricPlate icon={<Gauge size={17} />} {...t.metrics[2]} />
            </div>
          </div>

          <div className="lg:hidden">
            <MobileAdvisorForm
              locale={locale}
              labels={t}
              criteria={criteria}
              currencyUnit={dict.selection.priceUnit}
            />
          </div>

          <form
            action={`/${locale}/trouver`}
            className="plate relative hidden w-full min-w-0 bg-bitume p-4 shadow-2xl shadow-black/20 sm:p-5 lg:block"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl font-bold uppercase text-signal">
                {t.formTitle}
              </h2>
              <CarFront className="text-jaune" size={26} aria-hidden="true" />
            </div>

            <label className="mt-5 block">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2-dark">
                {t.budgetLabel}
              </span>
              <span className="plate mt-2 flex items-stretch bg-signal">
                <input
                  name="budget"
                  inputMode="numeric"
                  defaultValue={budgetValue}
                  placeholder={t.budgetPlaceholder}
                  dir="ltr"
                  className="min-w-0 flex-1 bg-transparent px-4 py-3.5 font-mono text-2xl font-bold text-asphalte outline-none placeholder:text-asphalte/30"
                />
                <span className="my-2 w-[2px] bg-asphalte/80" aria-hidden="true" />
                <span className="flex items-center px-3 font-mono text-[11px] font-bold uppercase text-asphalte">
                  {dict.hero.budgetUnit}
                </span>
              </span>
            </label>

            <SegmentGroup
              label={t.conditionLabel}
              name="condition"
              selected={criteria.condition}
              options={t.conditionOptions}
            />
            <SegmentGroup
              label={t.usageLabel}
              name="usage"
              selected={criteria.usage}
              options={t.usageOptions}
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SelectField
                label={t.annualKmLabel}
                name="annualKm"
                selected={String(criteria.annualKm)}
                options={t.annualKmOptions}
              />
              <SelectField
                label={t.bodyLabel}
                name="body"
                selected={criteria.body}
                options={t.bodyOptions}
              />
              <SelectField
                label={t.fuelLabel}
                name="fuel"
                selected={criteria.fuel}
                options={t.fuelOptions}
              />
              <SegmentGroup
                compact
                label={t.seatsLabel}
                name="seats"
                selected={criteria.seats}
                options={t.seatOptions}
              />
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-rouge bg-rouge px-5 py-3 font-display text-lg font-bold uppercase tracking-wider text-signal transition-all hover:bg-rouge/90 active:translate-y-px"
              >
                <Search size={18} aria-hidden="true" />
                {t.submit}
              </button>
              <Link
                href={`/${locale}/trouver`}
                className="inline-flex min-h-12 items-center justify-center border border-signal/20 px-4 font-display text-base font-bold uppercase tracking-wider text-signal/75 transition-colors hover:border-signal/50 hover:text-signal"
              >
                {t.reset}
              </Link>
            </div>
          </form>
        </section>

        <section className="relative border-t border-signal/12 bg-bitume/45 px-4 py-10 sm:px-6 lg:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-jaune">
                  {hasCriteria ? t.resultKickerMatching : t.resultKickerCatalog}
                </p>
                <h2 className="mt-2 font-display text-4xl font-bold uppercase text-signal sm:text-5xl">
                  {hasCriteria ? t.resultsTitle : t.starterTitle}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2-dark">
                  {t.resultsSub}
                </p>
              </div>
              <p className="max-w-sm font-mono text-[11px] leading-relaxed text-signal/55">
                {t.disclaimer}
              </p>
            </div>

            {catalogError ? (
              <StateMessage title={t.dbErrorTitle} body={t.dbErrorBody} />
            ) : matches.length === 0 ? (
              <StateMessage title={t.emptyTitle} body={t.emptyBody} />
            ) : (
              <ResultsWorkbench
                key={workbenchCriteriaKey(criteria)}
                locale={locale}
                labels={t}
                criteria={criteria}
                currencyUnit={dict.selection.priceUnit}
              >
                {matches.map((match, index) => (
                  <MatchCard
                    key={match.candidate.id}
                    index={index}
                    match={match}
                    criteria={criteria}
                    locale={locale}
                    labels={t}
                    priceUnit={dict.selection.priceUnit}
                    monthlyUnit={dict.selection.monthlyUnit}
                  />
                ))}
              </ResultsWorkbench>
            )}
          </div>
        </section>
      </main>
      <SiteFooter dict={dict} locale={locale} />
    </>
  )
}

function MetricPlate({
  icon,
  value,
  label,
}: {
  icon: ReactNode
  value: string
  label: string
}) {
  return (
    <div className="border-r border-signal/12 p-3 last:border-r-0">
      <div className="flex items-center gap-2 text-jaune">{icon}</div>
      <p className="mt-2 font-mono text-lg font-bold text-signal">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2-dark">
        {label}
      </p>
    </div>
  )
}

function SegmentGroup({
  label,
  name,
  selected,
  options,
  compact = false,
}: {
  label: string
  name: string
  selected: string
  options: { value: string; label: string }[]
  compact?: boolean
}) {
  return (
    <fieldset className={cn("mt-4", compact && "mt-0")}>
      <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2-dark">
        {label}
      </legend>
      <div className={cn("mt-2 grid gap-1.5", compact ? "grid-cols-3" : "grid-cols-3")}>
        {options.map((option) => (
          <label key={option.value} className="min-w-0">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={selected === option.value}
              className="peer sr-only"
            />
            <span className="flex min-h-11 min-w-0 items-center justify-center border border-signal/15 px-1.5 text-center font-mono text-[10px] font-bold uppercase leading-tight tracking-[0.04em] text-signal/65 transition-colors peer-checked:border-jaune peer-checked:bg-jaune peer-checked:text-asphalte peer-focus-visible:border-jaune peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-jaune sm:min-h-10 sm:px-2 sm:text-[11px]">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function SelectField({
  label,
  name,
  selected,
  options,
}: {
  label: string
  name: string
  selected: string
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2-dark">
        {label}
      </span>
      <select
        name={name}
        defaultValue={selected}
        className="mt-2 min-h-10 w-full border border-signal/15 bg-asphalte px-3 font-mono text-xs font-bold uppercase text-signal outline-none focus:border-jaune"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-asphalte">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function MatchCard({
  index,
  match,
  criteria,
  locale,
  labels,
  priceUnit,
  monthlyUnit,
}: {
  index: number
  match: RankedCandidate
  criteria: MatchCriteria
  locale: Locale
  labels: Awaited<ReturnType<typeof getDictionary>>["matching"]
  priceUnit: string
  monthlyUnit: string
}) {
  const { candidate, estimate } = match
  const breakdown = [
    { label: labels.breakdown.financing, value: estimate.financingMad },
    { label: labels.breakdown.insurance, value: estimate.insuranceMad },
    { label: labels.breakdown.fuel, value: estimate.fuelMad },
    { label: labels.breakdown.maintenance, value: estimate.maintenanceMad },
    { label: labels.breakdown.fees, value: estimate.feesMad },
    { label: labels.breakdown.depreciation, value: estimate.depreciationMad },
  ]
  const maxBreakdown = Math.max(...breakdown.map((item) => item.value))
  const marketLabel =
    candidate.availabilityScope === "new_ma"
      ? labels.candidateLabels.new
      : candidate.availabilityScope === "imported_edge_case"
        ? labels.candidateLabels.import
        : labels.candidateLabels.used
  const inferredFuelLabel =
    labels.fuelOptions.find((option) => option.value === match.inferredFuel)?.label ??
    match.inferredFuel

  return (
    <Link
      href={vehicleDetailHref(locale, candidate.id, criteria)}
      className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-jaune"
    >
      <article className="plate flex min-h-[520px] flex-col bg-bitume transition-colors group-hover:border-jaune/55">
        <div className="border-b border-signal/12 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-jaune">
                N° {String(index + 1).padStart(2, "0")}
              </p>
              <span className="border border-signal/15 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-signal/60">
                {marketLabel}
              </span>
            </div>
            <span className="font-stencil text-4xl text-signal/10">{index + 1}</span>
          </div>
          <h3 className="mt-6 font-display text-3xl font-bold uppercase leading-none text-signal">
            {candidate.brand} {candidate.model}
          </h3>
          <p className="mt-2 min-h-10 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2-dark">
            {candidate.commercialName} · {candidate.trimName}
            {candidate.modelYear ? ` · ${candidate.modelYear}` : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 border-b border-signal/12">
          <div className="border-r border-signal/12 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2-dark">
              {labels.priceLabel}
            </p>
            <p className="mt-2 font-mono text-xl font-bold text-signal" dir="ltr">
              {formatMad(candidate.priceMad, locale)}{" "}
              <span className="text-[10px] text-signal/55">{priceUnit}</span>
            </p>
          </div>
          <div className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2-dark">
              {labels.monthlyLabel}
            </p>
            <p className="mt-2 font-mono text-xl font-bold text-jaune" dir="ltr">
              {formatMad(estimate.totalMad, locale)}{" "}
              <span className="text-[10px] text-jaune/80">{monthlyUnit}</span>
            </p>
          </div>
        </div>

        <div className="flex-1 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2-dark">
            {labels.whyLabel}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {match.reasons.slice(0, 4).map((reason) => (
              <span
                key={reason}
                className="border border-vert-light/35 bg-vert-light/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-vert-light"
              >
                {reasonLabel(reason, labels)}
              </span>
            ))}
            {criteria.fuel === "any" && (
              <span className="border border-signal/15 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-signal/55">
                {labels.fuelInferred}: {inferredFuelLabel}
              </span>
            )}
          </div>

          <div className="mt-5 space-y-2">
            {breakdown.map((item) => (
              <div key={item.label} className="grid grid-cols-[6rem_1fr_4.25rem] items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-signal/55">
                  {item.label}
                </span>
                <span className="h-2 bg-asphalte">
                  <span
                    className="block h-full bg-jaune"
                    style={{ width: `${Math.max((item.value / maxBreakdown) * 100, 4)}%` }}
                  />
                </span>
                <span className="text-right font-mono text-[11px] font-bold text-signal">
                  {formatMad(item.value, locale)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-signal/12 p-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2-dark">
              {labels.sourceLabel}
            </p>
            <p className="mt-1 truncate font-mono text-[11px] text-signal/70">
              {candidate.sourceNames.join(" · ") || labels.sourceFallback}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-jaune">
            {labels.detail.open}
            <ArrowRight className="shrink-0" size={20} aria-hidden="true" />
          </span>
        </div>
      </article>
    </Link>
  )
}

function StateMessage({ title, body }: { title: string; body: string }) {
  return (
    <div className="plate mt-8 max-w-2xl bg-asphalte p-6">
      <p className="font-display text-3xl font-bold uppercase text-signal">{title}</p>
      <p className="mt-3 leading-relaxed text-ink-2-dark">{body}</p>
    </div>
  )
}

function inputValue(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  return raw?.replace(/[^\d ]/g, "").trim() ?? ""
}

function reasonLabel(
  reason: MatchReason,
  labels: Awaited<ReturnType<typeof getDictionary>>["matching"],
) {
  if (reason.startsWith("body:")) {
    const body = reason.slice("body:".length)
    return labels.bodyOptions.find((option) => option.value === body)?.label ?? body
  }

  if (reason.startsWith("fuel:")) {
    const fuel = reason.slice("fuel:".length)
    return labels.fuelOptions.find((option) => option.value === fuel)?.label ?? fuel
  }

  return (labels.reasonLabels as Record<string, string>)[reason] ?? reason
}

function workbenchCriteriaKey(criteria: MatchCriteria) {
  return [
    criteria.mode,
    criteria.cashBudgetMad ?? "",
    criteria.monthlyBudgetMad ?? "",
    criteria.downPaymentMad,
    criteria.durationMonths,
    criteria.budgetMad ?? "",
    criteria.usage,
    criteria.seats,
    criteria.minSeats,
    criteria.body,
    criteria.fuel,
    criteria.annualKm,
    criteria.familySize ?? "",
    criteria.trunkNeed,
    criteria.parkingNeed,
    criteria.priorities.join(","),
    criteria.condition,
  ].join("|")
}

function vehicleDetailHref(locale: Locale, candidateId: string, criteria: MatchCriteria) {
  const params = new URLSearchParams()
  params.set("mode", criteria.mode)
  setNumber(params, "cashBudget", criteria.cashBudgetMad)
  setNumber(params, "monthlyBudget", criteria.monthlyBudgetMad)
  setNumber(params, "downPayment", criteria.downPaymentMad)
  setNumber(params, "durationMonths", criteria.durationMonths)
  params.set("usage", criteria.usage)
  setNumber(params, "annualKm", criteria.annualKm)
  params.set("minSeats", criteria.minSeats)
  setNumber(params, "familySize", criteria.familySize)
  params.set("trunkNeed", criteria.trunkNeed)
  params.set("parkingNeed", criteria.parkingNeed)
  if (criteria.priorities.length > 0) {
    params.set("priorities", criteria.priorities.join(","))
  }
  params.set("condition", criteria.condition)
  params.set("body", criteria.body)
  params.set("fuel", criteria.fuel)

  return `/${locale}/vehicule/${encodeURIComponent(candidateId)}?${params.toString()}`
}

function setNumber(params: URLSearchParams, key: string, value: number | null) {
  if (value !== null) {
    params.set(key, String(value))
  }
}

function formatMad(value: number, locale: Locale) {
  const numberLocale = locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-FR"
  return new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }).format(value)
}
