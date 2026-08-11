import assert from "node:assert/strict"
import { test } from "node:test"

import { slugify } from "./slugify.js"

test("lowercases and hyphenates", () => {
  assert.equal(slugify("Hello World"), "hello-world")
})

test("collapses runs of punctuation into a single hyphen", () => {
  assert.equal(slugify("a -- b__c"), "a-b-c")
})

test("trims leading and trailing hyphens", () => {
  assert.equal(slugify("  !hello!  "), "hello")
})

test("folds accents to their ASCII base", () => {
  assert.equal(slugify("Café del Mar"), "cafe-del-mar")
})

test("returns an empty string when nothing survives", () => {
  assert.equal(slugify("!!!"), "")
})

test("rejects non-string input", () => {
  assert.throws(() => slugify(42), TypeError)
})
