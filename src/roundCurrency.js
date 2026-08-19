/**
 * Rounds a fractional cent amount to whole cents.
 *
 * This is the only place an amount is allowed to be rounded to currency
 * precision. Rating produces fractional cents — a per-call price of a hundredth
 * of a cent times a few million calls does not land on a whole cent — and the
 * dashboard's estimate and the invoice's line item only agree to the cent if
 * they round in the same place, once, in the same direction. Rounding at a
 * second site, or twice on the same value, is how the two drift apart.
 *
 * Halves round away from zero: 0.5 becomes 1, and -0.5 becomes -1. Negative
 * amounts occur on credits, and rounding them symmetrically means a credit and
 * the charge it reverses cancel exactly instead of leaving a cent behind.
 *
 * @param {number} amountInCents a finite amount, possibly fractional
 * @returns {number} whole cents
 */
export function roundCurrency(amountInCents) {
  if (typeof amountInCents !== "number" || !Number.isFinite(amountInCents)) {
    throw new TypeError("roundCurrency expects a finite number")
  }

  const sign = amountInCents < 0 ? -1 : 1

  return sign * Math.round(Math.abs(amountInCents))
}
