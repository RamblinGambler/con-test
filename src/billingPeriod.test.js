import assert from "node:assert/strict"
import { test } from "node:test"

import { billingPeriod } from "./billingPeriod.js"

test("returns the period containing the given instant", () => {
  const anchor = new Date("2024-01-10T00:00:00.000Z")
  const period = billingPeriod(anchor, new Date("2024-03-15T12:00:00.000Z"))

  assert.equal(period.start.toISOString(), "2024-03-10T00:00:00.000Z")
  assert.equal(period.end.toISOString(), "2024-04-10T00:00:00.000Z")
})

test("preserves the anchor time of day", () => {
  const anchor = new Date("2024-01-10T09:30:15.250Z")
  const period = billingPeriod(anchor, new Date("2024-02-20T00:00:00.000Z"))

  assert.equal(period.start.toISOString(), "2024-02-10T09:30:15.250Z")
  assert.equal(period.end.toISOString(), "2024-03-10T09:30:15.250Z")
})

test("includes the period start and excludes the period end", () => {
  const anchor = new Date("2024-01-10T00:00:00.000Z")

  const atStart = billingPeriod(anchor, new Date("2024-02-10T00:00:00.000Z"))
  assert.equal(atStart.start.toISOString(), "2024-02-10T00:00:00.000Z")

  const oneMsEarlier = billingPeriod(
    anchor,
    new Date("2024-02-09T23:59:59.999Z"),
  )
  assert.equal(oneMsEarlier.start.toISOString(), "2024-01-10T00:00:00.000Z")
  assert.equal(oneMsEarlier.end.toISOString(), "2024-02-10T00:00:00.000Z")
})

test("clamps an end-of-month anchor to a short month", () => {
  const anchor = new Date("2024-01-31T00:00:00.000Z")
  const period = billingPeriod(anchor, new Date("2024-03-01T00:00:00.000Z"))

  assert.equal(period.start.toISOString(), "2024-02-29T00:00:00.000Z")
  assert.equal(period.end.toISOString(), "2024-03-31T00:00:00.000Z")
})

test("stretches the period before a clamped short month", () => {
  // With a 31st anchor, February does not open until the 29th, so mid-February
  // still belongs to the January period rather than to a February one.
  const anchor = new Date("2024-01-31T00:00:00.000Z")
  const period = billingPeriod(anchor, new Date("2024-02-15T00:00:00.000Z"))

  assert.equal(period.start.toISOString(), "2024-01-31T00:00:00.000Z")
  assert.equal(period.end.toISOString(), "2024-02-29T00:00:00.000Z")
})

test("does not let a clamped short month drag later periods back", () => {
  const anchor = new Date("2023-01-31T00:00:00.000Z")

  const february = billingPeriod(anchor, new Date("2023-03-01T00:00:00.000Z"))
  assert.equal(february.start.toISOString(), "2023-02-28T00:00:00.000Z")

  // The next period returns to the 31st instead of staying on the 28th.
  assert.equal(february.end.toISOString(), "2023-03-31T00:00:00.000Z")
})

test("leaves no gap or overlap between consecutive periods", () => {
  for (const anchorDay of [28, 29, 30, 31]) {
    const anchor = new Date(`2023-01-${anchorDay}T00:00:00.000Z`)
    let period = billingPeriod(anchor, anchor)

    for (let month = 0; month < 26; month += 1) {
      const next = billingPeriod(anchor, period.end)

      assert.equal(
        next.start.getTime(),
        period.end.getTime(),
        `anchor day ${anchorDay}: period ${month} ends at ${period.end.toISOString()} but the next starts at ${next.start.toISOString()}`,
      )
      assert.ok(
        next.end.getTime() > next.start.getTime(),
        `anchor day ${anchorDay}: period ${month} is not forward-going`,
      )

      period = next
    }
  }
})

test("spans a daylight-saving transition without gaining or losing an hour", () => {
  // 2024-03-31T01:00Z is when European clocks go forward and
  // 2024-11-03T06:00Z is when US clocks go back. Periods are computed in UTC,
  // so both are ordinary instants and the boundaries stay whole months apart.
  const anchor = new Date("2024-03-15T00:00:00.000Z")

  const spring = billingPeriod(anchor, new Date("2024-03-31T01:00:00.000Z"))
  assert.equal(spring.start.toISOString(), "2024-03-15T00:00:00.000Z")
  assert.equal(spring.end.toISOString(), "2024-04-15T00:00:00.000Z")

  const autumn = billingPeriod(anchor, new Date("2024-11-03T06:00:00.000Z"))
  assert.equal(autumn.start.toISOString(), "2024-10-15T00:00:00.000Z")
  assert.equal(autumn.end.toISOString(), "2024-11-15T00:00:00.000Z")
})

test("meets exactly across a daylight-saving transition", () => {
  const anchor = new Date("2024-10-27T00:30:00.000Z")
  const period = billingPeriod(anchor, new Date("2024-10-27T00:30:00.000Z"))
  const next = billingPeriod(anchor, period.end)

  assert.equal(next.start.getTime(), period.end.getTime())
  assert.equal(next.start.toISOString(), "2024-11-27T00:30:00.000Z")
})

test("projects periods backwards for an instant before the anchor", () => {
  const anchor = new Date("2024-06-10T00:00:00.000Z")
  const period = billingPeriod(anchor, new Date("2024-04-02T00:00:00.000Z"))

  assert.equal(period.start.toISOString(), "2024-03-10T00:00:00.000Z")
  assert.equal(period.end.toISOString(), "2024-04-10T00:00:00.000Z")
})

test("crosses a year boundary", () => {
  const anchor = new Date("2024-12-20T00:00:00.000Z")
  const period = billingPeriod(anchor, new Date("2025-01-05T00:00:00.000Z"))

  assert.equal(period.start.toISOString(), "2024-12-20T00:00:00.000Z")
  assert.equal(period.end.toISOString(), "2025-01-20T00:00:00.000Z")
})

test("rejects missing and invalid dates", () => {
  const valid = new Date("2024-01-10T00:00:00.000Z")

  assert.throws(() => billingPeriod(valid, new Date("nonsense")), TypeError)
  assert.throws(() => billingPeriod(new Date("nonsense"), valid), TypeError)
  assert.throws(() => billingPeriod("2024-01-10", valid), TypeError)
  assert.throws(() => billingPeriod(valid, 1704844800000), TypeError)
  assert.throws(() => billingPeriod(valid, undefined), TypeError)
})
