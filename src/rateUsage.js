import { roundCurrency } from "./roundCurrency.js"

/**
 * Prices one metric's usage for one billing period.
 *
 * The function is pure and deterministic: the same rollup quantity and the same
 * price component always produce the same result, with no clock, no database
 * and no side effects. That is what lets the dashboard call it to show an
 * estimate and the invoice call it to produce a line item and get the same
 * number to the cent, and what lets a period be re-rated after a backfill
 * without anything changing underneath it.
 *
 * Usage below the included allowance is free, and the allowance is not
 * refunded when it goes unused — `billableUnits` floors at zero rather than
 * going negative.
 *
 * Quantities are whole metered units (one API call, one gigabyte-hour of
 * storage); this function does not care which metric it is pricing, which is
 * deliberate, since the storage metering method is still an open pricing
 * decision and only changes what quantity is handed in.
 *
 * @param {number} quantity metered units in the period, from the rollup
 * @param {{includedUnits: number, unitPriceCents: number}} priceComponent
 *   the plan's usage price component: units covered by the base price, and the
 *   price per unit beyond them, in cents (may be fractional)
 * @returns {{billableUnits: number, amountCents: number}} units actually
 *   charged for, and the charge in whole cents
 */
export function rateUsage(quantity, priceComponent) {
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
    throw new TypeError("rateUsage expects quantity to be a finite number")
  }

  if (quantity < 0) {
    throw new TypeError("rateUsage expects quantity to be non-negative")
  }

  if (priceComponent === null || typeof priceComponent !== "object") {
    throw new TypeError("rateUsage expects a price component object")
  }

  const { includedUnits, unitPriceCents } = priceComponent

  if (typeof includedUnits !== "number" || !Number.isFinite(includedUnits)) {
    throw new TypeError("rateUsage expects includedUnits to be a finite number")
  }

  if (includedUnits < 0) {
    throw new TypeError("rateUsage expects includedUnits to be non-negative")
  }

  if (typeof unitPriceCents !== "number" || !Number.isFinite(unitPriceCents)) {
    throw new TypeError("rateUsage expects unitPriceCents to be a finite number")
  }

  if (unitPriceCents < 0) {
    throw new TypeError("rateUsage expects unitPriceCents to be non-negative")
  }

  const billableUnits = Math.max(0, quantity - includedUnits)

  return {
    billableUnits,
    amountCents: roundCurrency(billableUnits * unitPriceCents),
  }
}
