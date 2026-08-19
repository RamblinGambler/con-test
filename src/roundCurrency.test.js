import assert from "node:assert/strict"
import { test } from "node:test"

import { roundCurrency } from "./roundCurrency.js"

test("leaves whole cents alone", () => {
  assert.equal(roundCurrency(1234), 1234)
  assert.equal(roundCurrency(0), 0)
})

test("rounds fractional cents to the nearest cent", () => {
  assert.equal(roundCurrency(10.4), 10)
  assert.equal(roundCurrency(10.6), 11)
})

test("rounds halves away from zero", () => {
  assert.equal(roundCurrency(0.5), 1)
  assert.equal(roundCurrency(1.5), 2)
  assert.equal(roundCurrency(2.5), 3)
  assert.equal(roundCurrency(-0.5), -1)
  assert.equal(roundCurrency(-1.5), -2)
})

test("rounds a credit and the charge it reverses to cancelling amounts", () => {
  const charge = roundCurrency(1234.5)
  const credit = roundCurrency(-1234.5)

  assert.equal(charge + credit, 0)
})

test("is stable when applied to an already rounded amount", () => {
  const once = roundCurrency(99.5)

  assert.equal(roundCurrency(once), once)
})

test("rejects non-finite and non-numeric input", () => {
  assert.throws(() => roundCurrency(NaN), TypeError)
  assert.throws(() => roundCurrency(Infinity), TypeError)
  assert.throws(() => roundCurrency("100"), TypeError)
  assert.throws(() => roundCurrency(null), TypeError)
  assert.throws(() => roundCurrency(undefined), TypeError)
})
