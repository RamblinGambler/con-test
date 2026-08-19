import assert from "node:assert/strict"
import { test } from "node:test"

import { billingPeriod } from "./billingPeriod.js"
import { rateUsage } from "./rateUsage.js"
import { roundCurrency } from "./roundCurrency.js"

// Stand-in plan price components, in place of the plan records this will read
// from once usage-based plans exist.
const METERED_FROM_ZERO = { includedUnits: 0, unitPriceCents: 0.02 }
const WITH_ALLOWANCE = { includedUnits: 10000, unitPriceCents: 0.05 }

test("charges nothing for zero usage", () => {
  const rated = rateUsage(0, METERED_FROM_ZERO)

  assert.deepEqual(rated, { billableUnits: 0, amountCents: 0 })
})

test("charges nothing for usage below the included allowance", () => {
  const rated = rateUsage(4200, WITH_ALLOWANCE)

  assert.deepEqual(rated, { billableUnits: 0, amountCents: 0 })
})

test("charges nothing for usage exactly at the included allowance", () => {
  const rated = rateUsage(10000, WITH_ALLOWANCE)

  assert.deepEqual(rated, { billableUnits: 0, amountCents: 0 })
})

test("charges only the units above the included allowance", () => {
  const rated = rateUsage(12000, WITH_ALLOWANCE)

  assert.equal(rated.billableUnits, 2000)
  assert.equal(rated.amountCents, 100)
})

test("does not refund an unused allowance", () => {
  const rated = rateUsage(1, WITH_ALLOWANCE)

  assert.equal(rated.billableUnits, 0)
  assert.equal(rated.amountCents, 0)
})

test("charges every unit when the plan includes no allowance", () => {
  const rated = rateUsage(2500, METERED_FROM_ZERO)

  assert.equal(rated.billableUnits, 2500)
  assert.equal(rated.amountCents, 50)
})

test("rates a period holding a single event on the period boundary", () => {
  const anchor = new Date("2024-01-31T00:00:00.000Z")
  const period = billingPeriod(anchor, new Date("2024-03-01T00:00:00.000Z"))

  // One event, timestamped at the exact instant the period opens. The period is
  // half-open, so it belongs to this period and to no other.
  const eventAt = period.start
  const quantity = eventAt >= period.start && eventAt < period.end ? 1 : 0

  assert.equal(quantity, 1)
  assert.deepEqual(
    rateUsage(quantity, { includedUnits: 0, unitPriceCents: 7 }),
    { billableUnits: 1, amountCents: 7 },
  )

  // The same event is not also in the preceding period.
  const previous = billingPeriod(anchor, new Date("2024-02-15T00:00:00.000Z"))
  assert.equal(previous.end.getTime(), period.start.getTime())
  assert.ok(!(eventAt >= previous.start && eventAt < previous.end))
})

test("returns whole cents, so a caller cannot round a second time", () => {
  const rated = rateUsage(1234567, { includedUnits: 0, unitPriceCents: 0.013 })

  assert.ok(Number.isInteger(rated.amountCents))
  assert.equal(roundCurrency(rated.amountCents), rated.amountCents)
})

test("is deterministic, so a re-rated period produces the same amount", () => {
  const first = rateUsage(987654, WITH_ALLOWANCE)
  const second = rateUsage(987654, WITH_ALLOWANCE)

  assert.deepEqual(first, second)
})

test("rejects negative, non-finite and non-numeric quantities", () => {
  assert.throws(() => rateUsage(-1, METERED_FROM_ZERO), TypeError)
  assert.throws(() => rateUsage(NaN, METERED_FROM_ZERO), TypeError)
  assert.throws(() => rateUsage(Infinity, METERED_FROM_ZERO), TypeError)
  assert.throws(() => rateUsage("100", METERED_FROM_ZERO), TypeError)
  assert.throws(() => rateUsage(undefined, METERED_FROM_ZERO), TypeError)
})

test("rejects a missing or malformed price component", () => {
  assert.throws(() => rateUsage(10, null), TypeError)
  assert.throws(() => rateUsage(10, undefined), TypeError)
  assert.throws(() => rateUsage(10, { unitPriceCents: 1 }), TypeError)
  assert.throws(() => rateUsage(10, { includedUnits: 0 }), TypeError)
  assert.throws(
    () => rateUsage(10, { includedUnits: -1, unitPriceCents: 1 }),
    TypeError,
  )
  assert.throws(
    () => rateUsage(10, { includedUnits: 0, unitPriceCents: -1 }),
    TypeError,
  )
})
