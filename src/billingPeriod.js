/**
 * Returns the number of days in a given UTC month.
 *
 * Day 0 of the following month is the last day of the month asked about, which
 * is also how the leap-year rule is picked up without spelling it out here.
 *
 * @param {number} year
 * @param {number} month zero-based, as in `Date.prototype.getUTCMonth`
 * @returns {number}
 */
function daysInUtcMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

/**
 * Returns the start of the billing period that is `offset` whole months after
 * the anchor.
 *
 * The anchor's day-of-month is reapplied every month rather than carried
 * forward from the previous period, so an anchor on the 31st produces Jan 31,
 * Feb 28, Mar 31 — the short month is clamped but does not drag later periods
 * back with it. The anchor's time-of-day is preserved exactly.
 *
 * @param {Date} anchor
 * @param {number} offset whole months, may be negative
 * @returns {Date}
 */
function periodStartFor(anchor, offset) {
  const absoluteMonth = anchor.getUTCMonth() + offset
  const year = anchor.getUTCFullYear() + Math.floor(absoluteMonth / 12)
  const month = ((absoluteMonth % 12) + 12) % 12
  const day = Math.min(anchor.getUTCDate(), daysInUtcMonth(year, month))

  return new Date(
    Date.UTC(
      year,
      month,
      day,
      anchor.getUTCHours(),
      anchor.getUTCMinutes(),
      anchor.getUTCSeconds(),
      anchor.getUTCMilliseconds(),
    ),
  )
}

/**
 * Returns the monthly billing period containing `at`, for a subscription whose
 * billing anchor is `anchor`.
 *
 * This is the single definition of a period boundary. Metering, rating and the
 * usage dashboard are all meant to call this rather than deriving boundaries
 * themselves, because a dashboard total can only match an invoice total if both
 * agree on which events fall inside the period.
 *
 * Things worth knowing:
 *
 * - The period is half-open: `start` is included, `end` is not. An event whose
 *   timestamp is exactly `end` belongs to the next period, never to both.
 * - Everything is computed in UTC. This is the conservative default and it is
 *   what makes daylight-saving transitions a non-event: UTC has no such
 *   transitions, so consecutive periods cannot gain or lose an hour. If the
 *   business later wants periods in the account's local timezone, that is a
 *   deliberate change here and nowhere else.
 * - Consecutive periods meet exactly. The `end` returned for one period is the
 *   same instant as the `start` of the next, so there are no gaps and no
 *   overlaps to lose or double-count usage in.
 * - `at` may fall before the anchor, in which case the period is projected
 *   backwards on the same rules.
 *
 * @param {Date} anchor the subscription's billing anchor date
 * @param {Date} at any instant to locate within a period
 * @returns {{start: Date, end: Date}} the half-open period `[start, end)`
 */
export function billingPeriod(anchor, at) {
  if (!(anchor instanceof Date) || Number.isNaN(anchor.getTime())) {
    throw new TypeError("billingPeriod expects anchor to be a valid Date")
  }

  if (!(at instanceof Date) || Number.isNaN(at.getTime())) {
    throw new TypeError("billingPeriod expects at to be a valid Date")
  }

  // Month arithmetic gets the offset within one of the answer; clamping of
  // short months is what can push it off, so the two loops settle it. Each
  // runs at most a couple of times.
  let offset =
    (at.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
    (at.getUTCMonth() - anchor.getUTCMonth())

  while (periodStartFor(anchor, offset) > at) {
    offset -= 1
  }

  while (periodStartFor(anchor, offset + 1) <= at) {
    offset += 1
  }

  return {
    start: periodStartFor(anchor, offset),
    end: periodStartFor(anchor, offset + 1),
  }
}
