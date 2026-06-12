import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { renderToStaticMarkup } from "react-dom/server"

import { MobileAdvisorForm } from "./mobile-advisor-form"
import { ResultsWorkbench } from "./results-workbench"
import type { MatchCriteria } from "@/lib/matching/score"

type MatchingLabels = Parameters<typeof MobileAdvisorForm>[0]["labels"] &
  Parameters<typeof ResultsWorkbench>[0]["labels"]

const criteria: MatchCriteria = {
  mode: "credit",
  cashBudgetMad: null,
  monthlyBudgetMad: 6500,
  downPaymentMad: 40000,
  durationMonths: 48,
  budgetMad: 6500,
  usage: "mixed",
  seats: "any",
  minSeats: "5",
  body: "any",
  fuel: "any",
  annualKm: 15000,
  familySize: 4,
  trunkNeed: "high",
  parkingNeed: "medium",
  priorities: ["family_space"],
  condition: "all",
}

const labels = {
  advisor: {
    progress: "Step",
    modeTitle: "Payment",
    affordabilityTitle: "Budget",
    usageTitle: "Usage",
    spaceTitle: "Space",
    prioritiesTitle: "Priorities",
    prioritiesSub: "Choose up to 3",
    back: "Back",
    next: "Next",
    showResults: "Show results",
  },
  modes: [
    { value: "cash", label: "Cash" },
    { value: "credit", label: "Credit" },
    { value: "mourabaha", label: "Mourabaha" },
    { value: "unsure", label: "Not sure" },
  ],
  scenario: {
    summary: "Scenario",
    adjust: "Adjust",
    update: "Update",
    cashBudget: "Cash budget",
    monthlyBudget: "Monthly payment",
    downPayment: "Down payment",
    duration: "Duration",
    familySize: "Family size",
    trunkNeed: "Trunk",
    parkingNeed: "Parking",
    advancedMarket: "Market",
  },
  durationOptions: [
    { value: "48", label: "48 months" },
    { value: "60", label: "60 months" },
    { value: "72", label: "72 months" },
    { value: "84", label: "84 months" },
  ],
  needLevels: [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ],
  priorityOptions: [
    { value: "family_space", label: "Family space" },
    { value: "reliability", label: "Reliability" },
  ],
  usageLabel: "Usage",
  usageOptions: [
    { value: "city", label: "City" },
    { value: "mixed", label: "Mixed" },
    { value: "long_distance", label: "Road" },
  ],
  annualKmLabel: "Annual km",
  annualKmOptions: [
    { value: "10000", label: "10,000 km" },
    { value: "15000", label: "15,000 km" },
    { value: "25000", label: "25,000 km" },
  ],
  seatsLabel: "Seats",
  seatOptions: [
    { value: "any", label: "Any" },
    { value: "5", label: "5 seats" },
    { value: "7", label: "7 seats" },
  ],
  conditionOptions: [
    { value: "all", label: "All" },
    { value: "new", label: "New" },
    { value: "used", label: "Used" },
  ],
} satisfies MatchingLabels

describe("MobileAdvisorForm", () => {
  it("exposes selected priority state to assistive technology", () => {
    const html = renderToStaticMarkup(
      <MobileAdvisorForm
        locale="en"
        labels={labels}
        criteria={criteria}
        currencyUnit="MAD"
      />,
    )

    assert.match(html, /aria-pressed="true"[^>]*>Family space/)
  })

  it("renders localized duration labels", () => {
    const html = renderToStaticMarkup(
      <MobileAdvisorForm
        locale="en"
        labels={labels}
        criteria={criteria}
        currencyUnit="MAD"
      />,
    )

    assert.match(html, />48 months<\/option>/)
    assert.doesNotMatch(html, />48m<\/option>/)
  })
})

describe("ResultsWorkbench", () => {
  it("renders localized duration labels", () => {
    const html = renderToStaticMarkup(
      <ResultsWorkbench
        locale="en"
        labels={labels}
        criteria={criteria}
        currencyUnit="MAD"
      >
        <div>matches</div>
      </ResultsWorkbench>,
    )

    assert.match(html, />48 months<\/option>/)
    assert.doesNotMatch(html, />48m<\/option>/)
  })
})
