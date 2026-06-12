"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, CarFront, Search } from "lucide-react"

import type { Locale } from "@/lib/i18n/config"
import type { MatchCriteria } from "@/lib/matching/score"
import { cn } from "@/lib/utils"

type Option = { value: string; label: string; description?: string }
type MatchingLabels = {
  advisor: Record<string, string>
  modes: Option[]
  scenario: Record<string, string>
  durationOptions: Option[]
  needLevels: Option[]
  priorityOptions: Option[]
  usageOptions: Option[]
  annualKmLabel: string
  annualKmOptions: Option[]
  seatOptions: Option[]
}

export function MobileAdvisorForm({
  locale,
  labels,
  criteria,
  currencyUnit,
}: {
  locale: Locale
  labels: MatchingLabels
  criteria: MatchCriteria
  currencyUnit: string
}) {
  const [step, setStep] = useState(0)
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(
    criteria.priorities,
  )
  const totalSteps = 5

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
    <form action={`/${locale}/trouver`} className="plate bg-bitume p-4 shadow-2xl shadow-black/20 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-jaune">
            {labels.advisor.progress} {step + 1}/{totalSteps}
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold uppercase text-signal">
            {step === 0 && labels.advisor.modeTitle}
            {step === 1 && labels.advisor.affordabilityTitle}
            {step === 2 && labels.advisor.usageTitle}
            {step === 3 && labels.advisor.spaceTitle}
            {step === 4 && labels.advisor.prioritiesTitle}
          </h2>
        </div>
        <CarFront className="text-jaune" size={26} aria-hidden="true" />
      </div>

      <div className="mt-5">
        <section className={cn(step !== 0 && "hidden")} aria-hidden={step !== 0}>
          <RadioCards name="mode" selected={criteria.mode} options={labels.modes} columns="grid-cols-2" />
        </section>

        <section className={cn("grid gap-3", step !== 1 && "hidden")} aria-hidden={step !== 1}>
          <MoneyField
            name="cashBudget"
            label={labels.scenario.cashBudget}
            defaultValue={criteria.cashBudgetMad}
            currencyUnit={currencyUnit}
          />
          <MoneyField
            name="monthlyBudget"
            label={labels.scenario.monthlyBudget}
            defaultValue={criteria.monthlyBudgetMad}
            currencyUnit={currencyUnit}
          />
          <MoneyField
            name="downPayment"
            label={labels.scenario.downPayment}
            defaultValue={criteria.downPaymentMad || null}
            currencyUnit={currencyUnit}
          />
          <SelectField
            name="durationMonths"
            label={labels.scenario.duration}
            selected={String(criteria.durationMonths)}
            options={labels.durationOptions}
          />
        </section>

        <section className={cn("grid gap-3", step !== 2 && "hidden")} aria-hidden={step !== 2}>
          <RadioCards name="usage" selected={criteria.usage} options={labels.usageOptions} columns="grid-cols-3" />
          <SelectField name="annualKm" label={labels.annualKmLabel} selected={String(criteria.annualKm)} options={labels.annualKmOptions} />
        </section>

        <section className={cn("grid gap-3", step !== 3 && "hidden")} aria-hidden={step !== 3}>
          <RadioCards name="minSeats" selected={criteria.minSeats} options={labels.seatOptions} columns="grid-cols-3" />
          <SelectField name="familySize" label={labels.scenario.familySize} selected={String(criteria.familySize ?? "")} options={[
            { value: "", label: "-" },
            { value: "1", label: "1" },
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
            { value: "5", label: "5+" },
          ]} />
          <SelectField name="trunkNeed" label={labels.scenario.trunkNeed} selected={criteria.trunkNeed} options={labels.needLevels} />
          <SelectField name="parkingNeed" label={labels.scenario.parkingNeed} selected={criteria.parkingNeed} options={labels.needLevels} />
        </section>

        <section className={cn(step !== 4 && "hidden")} aria-hidden={step !== 4}>
          <p className="text-sm text-ink-2-dark">{labels.advisor.prioritiesSub}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {labels.priorityOptions.map((option) => {
              const active = selectedPriorities.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => togglePriority(option.value)}
                  className={cn(
                    "min-h-12 border px-2 text-center font-mono text-[10px] font-bold uppercase tracking-[0.08em]",
                    active ? "border-jaune bg-jaune text-asphalte" : "border-signal/15 text-signal/70",
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          <input type="hidden" name="priorities" value={selectedPriorities.join(",")} />
        </section>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          className="inline-flex min-h-12 items-center justify-center gap-2 border border-signal/20 px-4 font-display text-base font-bold uppercase tracking-wider text-signal/75 disabled:opacity-35"
          disabled={step === 0}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {labels.advisor.back}
        </button>
        {step < totalSteps - 1 ? (
          <button
            type="button"
            onClick={() => setStep((value) => Math.min(totalSteps - 1, value + 1))}
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-jaune bg-jaune px-4 font-display text-base font-bold uppercase tracking-wider text-asphalte"
          >
            {labels.advisor.next}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-rouge bg-rouge px-4 font-display text-base font-bold uppercase tracking-wider text-signal"
          >
            <Search size={18} aria-hidden="true" />
            {labels.advisor.showResults}
          </button>
        )}
      </div>
    </form>
  )
}

function RadioCards({
  name,
  selected,
  options,
  columns,
}: {
  name: string
  selected: string
  options: Option[]
  columns: string
}) {
  return (
    <fieldset>
      <div className={cn("grid gap-2", columns)}>
        {options.map((option) => (
          <label key={option.value} className="min-w-0">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={selected === option.value}
              className="peer sr-only"
            />
            <span className="flex min-h-16 min-w-0 flex-col justify-center border border-signal/15 px-3 py-2 text-signal/70 transition-colors peer-checked:border-jaune peer-checked:bg-jaune peer-checked:text-asphalte peer-focus-visible:border-jaune peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-jaune">
              <span className="font-display text-base font-bold uppercase tracking-wider">
                {option.label}
              </span>
              {option.description ? (
                <span className="mt-1 text-xs leading-snug opacity-75">
                  {option.description}
                </span>
              ) : null}
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
  currencyUnit,
}: {
  name: string
  label: string
  defaultValue: number | null
  currencyUnit: string
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
          className="min-w-0 flex-1 bg-transparent px-4 py-3.5 font-mono text-2xl font-bold text-asphalte outline-none placeholder:text-asphalte/30"
        />
        <span className="my-2 w-[2px] bg-asphalte/80" aria-hidden="true" />
        <span className="flex items-center px-3 font-mono text-[11px] font-bold uppercase text-asphalte">
          {currencyUnit}
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
