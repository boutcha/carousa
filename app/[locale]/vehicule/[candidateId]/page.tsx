import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  Info,
  ShieldCheck,
  Wrench,
} from "lucide-react"

import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import {
  createVehicleDetailAssessment,
  type DetailItem,
  type VehicleDetailIssue,
} from "@/lib/matching/detail"
import { getVehicleDetail } from "@/lib/matching/detail-data"
import {
  estimateMonthlyCost,
  inferFuel,
  parseMatchCriteria,
  type MonthlyEstimate,
} from "@/lib/matching/score"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type SearchParams = Record<string, string | string[] | undefined>

export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; candidateId: string }>
  searchParams: Promise<SearchParams>
}) {
  const { locale: rawLocale, candidateId } = await params
  const locale = rawLocale as Locale
  const rawSearchParams = await searchParams
  const dict = await getDictionary(locale)
  const labels = dict.matching.detail
  const criteria = parseMatchCriteria(rawSearchParams)
  const detail = await getVehicleDetail(decodeURIComponent(candidateId))

  if (!detail) {
    notFound()
  }

  const { candidate, specs, issues, maintenance, features } = detail
  const estimate = estimateMonthlyCost(candidate, criteria)
  const assessment = createVehicleDetailAssessment({
    candidate,
    criteria,
    estimate,
    issues,
    maintenanceScheduleCount: maintenance.length,
  })
  const marketLabel =
    candidate.availabilityScope === "new_ma"
      ? dict.matching.candidateLabels.new
      : candidate.availabilityScope === "imported_edge_case"
        ? dict.matching.candidateLabels.import
        : dict.matching.candidateLabels.used
  const fuelLabel =
    dict.matching.fuelOptions.find((option) => option.value === inferFuel(candidate))?.label ??
    inferFuel(candidate)
  const backHref = `/${locale}/trouver${searchParamsSuffix(rawSearchParams)}`
  const breakdown = costBreakdown(dict.matching.breakdown, estimate)

  return (
    <>
      <SiteHeader dict={dict} locale={locale} />
      <main className="tarmac bg-asphalte text-signal">
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:pb-14 lg:pt-10">
          <Link
            href={backHref}
            className="inline-flex min-h-10 items-center gap-2 border border-signal/15 px-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-signal/70 transition-colors hover:border-jaune hover:text-jaune"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {labels.back}
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-jaune">
                {labels.kicker}
              </p>
              <h1 className="mt-3 max-w-4xl break-words font-display text-[clamp(2.4rem,9vw,6rem)] font-bold uppercase leading-[0.95] tracking-normal text-signal [overflow-wrap:anywhere] rtl:leading-[1.14]">
                {candidate.brand} {candidate.model}
              </h1>
              <p className="mt-4 max-w-3xl font-mono text-xs uppercase tracking-[0.14em] text-ink-2-dark">
                {candidate.commercialName} · {candidate.trimName}
                {candidate.modelYear ? ` · ${candidate.modelYear}` : ""}
              </p>
            </div>

            <aside className="plate bg-bitume p-4">
              <div className="grid grid-cols-2 gap-3">
                <HeroMetric
                  label={labels.sourcePrice}
                  value={formatMad(candidate.priceMad, locale)}
                  unit={dict.selection.priceUnit}
                />
                <HeroMetric
                  label={labels.trueMonthly}
                  value={formatMad(estimate.totalMad, locale)}
                  unit={dict.selection.monthlyUnit}
                  accent
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-signal/12 pt-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2-dark">
                  {labels.risk}
                </span>
                <RiskBadge level={assessment.riskLevel} labels={labels} />
              </div>
            </aside>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FactPlate label={labels.market} value={marketLabel} />
            <FactPlate label={labels.generation} value={generationLabel(specs)} />
            <FactPlate label={labels.fuel} value={fuelLabel} />
            <FactPlate
              label={labels.officialRecalls}
              value={String(candidate.officialRecallCount)}
              tone={candidate.highSeverityRecallCount > 0 ? "warn" : "default"}
            />
          </div>
        </section>

        <section className="border-t border-signal/12 bg-bitume/45 px-4 py-8 sm:px-6 lg:py-12">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-5">
              <SplitPanel
                leftTitle={labels.prosTitle}
                rightTitle={labels.consTitle}
                pros={assessment.pros}
                cons={assessment.cons}
                emptyPros={labels.emptyPros}
                emptyCons={labels.emptyCons}
              />

              <Panel title={labels.issuesTitle} icon={<ShieldCheck size={18} />}>
                {issues.length > 0 ? (
                  <div className="space-y-3">
                    {issues.map((issue) => (
                      <IssueRow key={`${issue.title}-${issue.severity}`} issue={issue} />
                    ))}
                  </div>
                ) : (
                  <EmptyText>{labels.emptyIssues}</EmptyText>
                )}
              </Panel>

              <Panel title={labels.maintenanceTitle} icon={<Wrench size={18} />}>
                {maintenance.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {maintenance.map((item) => (
                      <div
                        key={`${item.itemName}-${item.intervalKm ?? item.intervalMonths ?? "once"}`}
                        className="border border-signal/12 bg-asphalte/70 p-3"
                      >
                        <p className="font-display text-lg font-bold uppercase text-signal">
                          {item.itemName}
                        </p>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2-dark">
                          {intervalLabel(item.intervalKm, item.intervalMonths, labels)}
                        </p>
                        {item.costMedianMad ? (
                          <p className="mt-2 font-mono text-xs font-bold text-jaune" dir="ltr">
                            {formatMad(item.costMedianMad, locale)} {dict.selection.priceUnit}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyText>{labels.emptyMaintenance}</EmptyText>
                )}
              </Panel>
            </div>

            <div className="grid content-start gap-5">
              <Panel title={labels.factsTitle} icon={<Info size={18} />}>
                <div className="grid gap-2">
                  {assessment.facts.map((fact) => (
                    <DetailFact key={fact.key} item={fact} />
                  ))}
                </div>
              </Panel>

              <Panel title={labels.costTitle} icon={<CircleDollarSign size={18} />}>
                <div className="space-y-3">
                  {breakdown.map((item) => (
                    <CostBar
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      max={Math.max(...breakdown.map((part) => part.value))}
                      locale={locale}
                    />
                  ))}
                </div>
              </Panel>

              <Panel title={labels.specsTitle} icon={<Gauge size={18} />}>
                <div className="grid gap-2">
                  <SpecLine label={labels.powertrain} value={specs.powertrainName} />
                  <SpecLine label={labels.transmission} value={specs.transmission} />
                  <SpecLine label={labels.engine} value={engineLabel(specs)} />
                  <SpecLine label={labels.power} value={numberWithUnit(specs.horsepowerHp, "hp")} />
                  <SpecLine label={labels.torque} value={numberWithUnit(specs.torqueNm, "Nm")} />
                  <SpecLine
                    label={labels.consumption}
                    value={numberWithUnit(specs.consumptionMixedL100km, "L/100km")}
                  />
                  <SpecLine label={labels.battery} value={numberWithUnit(specs.batteryKwh, "kWh")} />
                  <SpecLine label={labels.seats} value={numberWithUnit(specs.seats, "")} />
                  <SpecLine label={labels.body} value={candidate.bodyStyle} />
                  <SpecLine
                    label={labels.sourceConfidence}
                    value={`${Math.round(specs.sourceConfidence * 100)}%`}
                  />
                </div>
              </Panel>

              <Panel title={labels.featuresTitle} icon={<CheckCircle2 size={18} />}>
                {features.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature) => (
                      <span
                        key={`${feature.category}-${feature.name}`}
                        className="border border-signal/12 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-signal/70"
                      >
                        {feature.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <EmptyText>{labels.emptyFeatures}</EmptyText>
                )}
              </Panel>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter dict={dict} locale={locale} />
    </>
  )
}

function HeroMetric({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string
  value: string
  unit: string
  accent?: boolean
}) {
  return (
    <div className="border border-signal/12 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2-dark">
        {label}
      </p>
      <p className={cn("mt-2 font-mono text-xl font-bold", accent ? "text-jaune" : "text-signal")} dir="ltr">
        {value} <span className="text-[10px] opacity-70">{unit}</span>
      </p>
    </div>
  )
}

function RiskBadge({
  level,
  labels,
}: {
  level: "low" | "medium" | "high"
  labels: Awaited<ReturnType<typeof getDictionary>>["matching"]["detail"]
}) {
  const label =
    level === "high" ? labels.riskHigh : level === "medium" ? labels.riskMedium : labels.riskLow
  return (
    <span
      className={cn(
        "border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em]",
        level === "high"
          ? "border-rouge bg-rouge/15 text-rouge"
          : level === "medium"
            ? "border-jaune bg-jaune/10 text-jaune"
            : "border-vert-light/35 bg-vert-light/10 text-vert-light",
      )}
    >
      {label}
    </span>
  )
}

function FactPlate({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: "default" | "warn"
}) {
  return (
    <div className="border border-signal/12 bg-bitume p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2-dark">
        {label}
      </p>
      <p className={cn("mt-2 font-mono text-xl font-bold", tone === "warn" ? "text-jaune" : "text-signal")}>
        {value}
      </p>
    </div>
  )
}

function SplitPanel({
  leftTitle,
  rightTitle,
  pros,
  cons,
  emptyPros,
  emptyCons,
}: {
  leftTitle: string
  rightTitle: string
  pros: DetailItem[]
  cons: DetailItem[]
  emptyPros: string
  emptyCons: string
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Panel title={leftTitle} icon={<CheckCircle2 size={18} />}>
        {pros.length > 0 ? <ItemList items={pros} tone="pro" /> : <EmptyText>{emptyPros}</EmptyText>}
      </Panel>
      <Panel title={rightTitle} icon={<AlertTriangle size={18} />}>
        {cons.length > 0 ? <ItemList items={cons} tone="con" /> : <EmptyText>{emptyCons}</EmptyText>}
      </Panel>
    </div>
  )
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <section className="border border-signal/12 bg-bitume p-4">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase text-signal">
        <span className="text-jaune">{icon}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function ItemList({ items, tone }: { items: DetailItem[]; tone: "pro" | "con" }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="border border-signal/12 bg-asphalte/70 p-3">
          <p
            className={cn(
              "font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
              tone === "pro" ? "text-vert-light" : "text-jaune",
            )}
          >
            {item.label}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-2-dark">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function DetailFact({ item }: { item: DetailItem }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-signal/10 py-2 last:border-b-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2-dark">
        {item.label}
      </span>
      <span className="text-right font-mono text-xs font-bold text-signal">{item.value}</span>
    </div>
  )
}

function IssueRow({ issue }: { issue: VehicleDetailIssue }) {
  return (
    <div className="border border-signal/12 bg-asphalte/70 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display text-lg font-bold uppercase text-signal">{issue.title}</p>
        <SeverityBadge severity={issue.severity} />
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2-dark">
        {issue.affectedSystem} · {Math.round(issue.confidence * 100)}%
        {issue.sourceName ? ` · ${issue.sourceName}` : ""}
      </p>
      {issue.notes ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-2-dark">{issue.notes}</p>
      ) : null}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: VehicleDetailIssue["severity"] }) {
  return (
    <span
      className={cn(
        "border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em]",
        severity === "critical" || severity === "high"
          ? "border-rouge bg-rouge/15 text-rouge"
          : severity === "medium"
            ? "border-jaune bg-jaune/10 text-jaune"
            : "border-vert-light/35 bg-vert-light/10 text-vert-light",
      )}
    >
      {severity}
    </span>
  )
}

function CostBar({
  label,
  value,
  max,
  locale,
}: {
  label: string
  value: number
  max: number
  locale: Locale
}) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-signal/55">
        {label}
      </span>
      <span className="h-2 bg-asphalte">
        <span
          className="block h-full bg-jaune"
          style={{ width: `${Math.max((value / max) * 100, 4)}%` }}
        />
      </span>
      <span className="text-right font-mono text-[11px] font-bold text-signal">
        {formatMad(value, locale)}
      </span>
    </div>
  )
}

function SpecLine({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-signal/10 py-2 last:border-b-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2-dark">
        {label}
      </span>
      <span className="text-right font-mono text-xs font-bold text-signal">{value}</span>
    </div>
  )
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-relaxed text-ink-2-dark">{children}</p>
}

function costBreakdown(
  labels: Awaited<ReturnType<typeof getDictionary>>["matching"]["breakdown"],
  estimate: MonthlyEstimate,
) {
  return [
    { label: labels.financing, value: estimate.financingMad },
    { label: labels.insurance, value: estimate.insuranceMad },
    { label: labels.fuel, value: estimate.fuelMad },
    { label: labels.maintenance, value: estimate.maintenanceMad },
    { label: labels.fees, value: estimate.feesMad },
    { label: labels.depreciation, value: estimate.depreciationMad },
  ]
}

function generationLabel(specs: { generationName: string; startsYear: number; endsYear: number | null }) {
  const years = `${specs.startsYear}-${specs.endsYear ?? "now"}`
  return `${specs.generationName} · ${years}`
}

function engineLabel(specs: { engineCode: string | null; displacementCc: number | null; cylinders: number | null }) {
  const parts = [
    specs.engineCode,
    specs.displacementCc ? `${Math.round(specs.displacementCc / 100) / 10}L` : null,
    specs.cylinders ? `${specs.cylinders} cyl` : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : null
}

function numberWithUnit(value: number | null, unit: string) {
  if (value === null) return null
  return `${value}${unit ? ` ${unit}` : ""}`
}

function intervalLabel(
  intervalKm: number | null,
  intervalMonths: number | null,
  labels: Awaited<ReturnType<typeof getDictionary>>["matching"]["detail"],
) {
  const parts = [
    intervalKm ? `${intervalKm.toLocaleString("fr-FR")} ${labels.km}` : null,
    intervalMonths ? `${intervalMonths} ${labels.months}` : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : labels.asNeeded
}

function searchParamsSuffix(params: SearchParams) {
  const normalized = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) normalized.append(key, item)
    } else if (value !== undefined) {
      normalized.set(key, value)
    }
  }
  const query = normalized.toString()
  return query ? `?${query}` : ""
}

function formatMad(value: number, locale: Locale) {
  const numberLocale = locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-FR"
  return new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }).format(value)
}
