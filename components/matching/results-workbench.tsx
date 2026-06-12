"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"

import type { Locale } from "@/lib/i18n/config"
import type { MatchCriteria } from "@/lib/matching/score"
import { cn } from "@/lib/utils"

type Option = { value: string; label: string; description?: string }

type MatchingLabels = {
  advisor: {
    prioritiesSub: string
  }
  scenario: {
    summary: string
    adjust: string
    update: string
    cashBudget: string
    monthlyBudget: string
    downPayment: string
    duration: string
    familySize: string
    trunkNeed: string
    parkingNeed: string
    advancedMarket: string
  }
  modes: Option[]
  usageLabel: string
  usageOptions: Option[]
  annualKmLabel: string
  annualKmOptions: Option[]
  seatsLabel: string
  seatOptions: Option[]
  needLevels: Option[]
  priorityOptions: Option[]
  conditionOptions: Option[]
}

const durationOptions: Option[] = [
  { value: "48", label: "48m" },
  { value: "60", label: "60m" },
  { value: "72", label: "72m" },
  { value: "84", label: "84m" },
]

const familySizeOptions: Option[] = [
  { value: "", label: "-" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5+" },
]

export function ResultsWorkbench({
  locale,
  labels,
  criteria,
  children,
}: {
  locale: Locale
  labels: MatchingLabels
  criteria: MatchCriteria
  children: ReactNode
}) {
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(
    criteria.priorities,
  )
  const activeModeLabel = optionLabel(labels.modes, criteria.mode)
  const budgetValue =
    criteria.mode === "cash"
      ? formatBudget(criteria.cashBudgetMad, locale) ??
        formatBudget(criteria.monthlyBudgetMad, locale)
      : formatBudget(criteria.monthlyBudgetMad, locale) ??
        formatBudget(criteria.cashBudgetMad, locale)
  const budgetLabel =
    criteria.mode === "cash"
      ? labels.scenario.cashBudget
      : labels.scenario.monthlyBudget
  const usageLabel = optionLabel(labels.usageOptions, criteria.usage)
  const annualKmLabel = optionLabel(labels.annualKmOptions, String(criteria.annualKm))
  const seatLabel = optionLabel(labels.seatOptions, criteria.minSeats)
  const priorityLabels = criteria.priorities.map((priority) =>
    optionLabel(labels.priorityOptions, priority),
  )

  function togglePriority(value: string) {
    setSelectedPriorities((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value)
      }
      if (current.length >= 3) return current
      return [...current, value]
    })
  }

  return (
    <div className="mt-8">
      <div className="sticky top-0 z-20 -mx-4 border-y border-signal/12 bg-bitume/95 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:rounded-none lg:border lg:bg-bitume/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-jaune">
              {labels.scenario.summary}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="border border-jaune bg-jaune px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-asphalte">
                {activeModeLabel}
              </span>
              <SummaryChip label={budgetLabel} value={budgetValue ?? "-"} />
              <SummaryChip label={labels.annualKmLabel} value={annualKmLabel} />
              <SummaryChip label={labels.seatsLabel} value={seatLabel} />
            </div>
            {priorityLabels.length > 0 ? (
              <p className="mt-2 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-signal/55">
                {priorityLabels.join(" · ")}
              </p>
            ) : null}
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:shrink-0 lg:pb-0">
            {labels.modes.map((mode) => {
              const active = mode.value === criteria.mode
              return (
                <Link
                  key={mode.value}
                  href={scenarioHref(locale, criteria, mode.value)}
                  className={cn(
                    "inline-flex min-h-10 shrink-0 items-center justify-center border px-3 font-display text-sm font-bold uppercase tracking-wider transition-colors",
                    active
                      ? "border-jaune bg-jaune text-asphalte"
                      : "border-signal/15 text-signal/70 hover:border-signal/45 hover:text-signal",
                  )}
                >
                  {mode.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <details className="plate mt-3 bg-bitume">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-display text-base font-bold uppercase tracking-wider text-signal [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-jaune" aria-hidden="true" />
            {labels.scenario.adjust}
          </span>
          <span className="font-mono text-[10px] text-signal/50">{usageLabel}</span>
        </summary>

        <form
          action={`/${locale}/trouver`}
          method="get"
          className="grid gap-4 border-t border-signal/12 p-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <input type="hidden" name="priorities" value={selectedPriorities.join(",")} />
          <input type="hidden" name="body" value={criteria.body} />
          <input type="hidden" name="fuel" value={criteria.fuel} />

          <RadioGrid
            label={labels.scenario.summary}
            name="mode"
            selected={criteria.mode}
            options={labels.modes}
            className="sm:col-span-2 xl:col-span-4"
          />

          <MoneyField
            name="cashBudget"
            label={labels.scenario.cashBudget}
            defaultValue={criteria.cashBudgetMad}
          />
          <MoneyField
            name="monthlyBudget"
            label={labels.scenario.monthlyBudget}
            defaultValue={criteria.monthlyBudgetMad}
          />
          <MoneyField
            name="downPayment"
            label={labels.scenario.downPayment}
            defaultValue={criteria.downPaymentMad || null}
          />
          <SelectField
            name="durationMonths"
            label={labels.scenario.duration}
            selected={String(criteria.durationMonths)}
            options={durationOptions}
          />

          <RadioGrid
            label={labels.usageLabel}
            name="usage"
            selected={criteria.usage}
            options={labels.usageOptions}
            className="sm:col-span-2 xl:col-span-2"
          />
          <SelectField
            name="annualKm"
            label={labels.annualKmLabel}
            selected={String(criteria.annualKm)}
            options={labels.annualKmOptions}
          />
          <RadioGrid
            label={labels.seatsLabel}
            name="minSeats"
            selected={criteria.minSeats}
            options={labels.seatOptions}
          />

          <SelectField
            name="familySize"
            label={labels.scenario.familySize}
            selected={String(criteria.familySize ?? "")}
            options={familySizeOptions}
          />
          <SelectField
            name="trunkNeed"
            label={labels.scenario.trunkNeed}
            selected={criteria.trunkNeed}
            options={labels.needLevels}
          />
          <SelectField
            name="parkingNeed"
            label={labels.scenario.parkingNeed}
            selected={criteria.parkingNeed}
            options={labels.needLevels}
          />
          <RadioGrid
            label={labels.scenario.advancedMarket}
            name="condition"
            selected={criteria.condition}
            options={labels.conditionOptions}
          />

          <fieldset className="sm:col-span-2 xl:col-span-4">
            <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2-dark">
              {labels.advisor.prioritiesSub}
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {labels.priorityOptions.map((option) => {
                const active = selectedPriorities.includes(option.value)
                const locked = !active && selectedPriorities.length >= 3
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    disabled={locked}
                    onClick={() => togglePriority(option.value)}
                    className={cn(
                      "min-h-11 border px-2 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.08em] transition-colors",
                      active
                        ? "border-jaune bg-jaune text-asphalte"
                        : "border-signal/15 text-signal/70 hover:border-signal/45 hover:text-signal",
                      locked && "opacity-35",
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="sm:col-span-2 xl:col-span-4">
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 border border-rouge bg-rouge px-5 py-3 font-display text-lg font-bold uppercase tracking-wider text-signal transition-all hover:bg-rouge/90 active:translate-y-px sm:w-auto"
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
              {labels.scenario.update}
            </button>
          </div>
        </form>
      </details>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">{children}</div>
    </div>
  )
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-h-7 items-center gap-1 border border-signal/12 px-2 font-mono text-[10px] uppercase tracking-[0.08em] text-signal/70">
      <span className="text-ink-2-dark">{label}</span>
      <span className="font-bold text-signal">{value}</span>
    </span>
  )
}

function RadioGrid({
  label,
  name,
  selected,
  options,
  className,
}: {
  label: string
  name: string
  selected: string
  options: Option[]
  className?: string
}) {
  return (
    <fieldset className={className}>
      <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2-dark">
        {label}
      </legend>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => (
          <label key={option.value} className="min-w-0">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={selected === option.value}
              className="peer sr-only"
            />
            <span className="flex min-h-11 min-w-0 items-center justify-center border border-signal/15 px-2 text-center font-mono text-[10px] font-bold uppercase leading-tight tracking-[0.06em] text-signal/65 transition-colors peer-checked:border-jaune peer-checked:bg-jaune peer-checked:text-asphalte">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function MoneyField({
  name,
  label,
  defaultValue,
}: {
  name: string
  label: string
  defaultValue: number | null
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2-dark">
        {label}
      </span>
      <span className="plate mt-2 flex items-stretch bg-signal">
        <input
          name={name}
          inputMode="numeric"
          defaultValue={defaultValue ?? ""}
          dir="ltr"
          className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-xl font-bold text-asphalte outline-none placeholder:text-asphalte/30"
        />
        <span className="my-2 w-[2px] bg-asphalte/80" aria-hidden="true" />
        <span className="flex items-center px-2 font-mono text-[10px] font-bold uppercase text-asphalte">
          MAD
        </span>
      </span>
    </label>
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
  options: Option[]
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2-dark">
        {label}
      </span>
      <select
        name={name}
        defaultValue={selected}
        className="mt-2 min-h-11 w-full border border-signal/15 bg-asphalte px-3 font-mono text-xs font-bold uppercase text-signal outline-none focus:border-jaune"
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

function scenarioHref(locale: Locale, criteria: MatchCriteria, mode: string) {
  const params = new URLSearchParams()
  params.set("mode", mode)
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

  return `/${locale}/trouver?${params.toString()}`
}

function setNumber(params: URLSearchParams, key: string, value: number | null) {
  if (value !== null) {
    params.set(key, String(value))
  }
}

function optionLabel(options: Option[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value
}

function formatBudget(value: number | null, locale: Locale) {
  if (value === null) return null
  return `${formatMad(value, locale)} MAD`
}

function formatMad(value: number, locale: Locale) {
  const numberLocale = locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-FR"
  return new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }).format(value)
}
