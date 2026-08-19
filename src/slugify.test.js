import assert from "node:assert/strict"
import { test } from "node:test"

import { formatBytes, slugify } from "./slugify.js"

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

test("formats zero as bytes", () => {
  assert.equal(formatBytes(0), "0 B")
})

test("treats negative zero as zero", () => {
  assert.equal(formatBytes(-0), "0 B")
})

test("formats values under 1024 as bytes", () => {
  assert.equal(formatBytes(512), "512 B")
  assert.equal(formatBytes(1023), "1023 B")
})

test("scales up at each 1024 boundary", () => {
  assert.equal(formatBytes(1024), "1 KB")
  assert.equal(formatBytes(1048576), "1 MB")
  assert.equal(formatBytes(1073741824), "1 GB")
  assert.equal(formatBytes(1099511627776), "1 TB")
})

test("rounds to a single decimal place", () => {
  assert.equal(formatBytes(1536), "1.5 KB")
  assert.equal(formatBytes(1280), "1.3 KB")
  assert.equal(formatBytes(1274), "1.2 KB")
})

test("keeps using terabytes for values above the largest unit", () => {
  assert.equal(formatBytes(1024 * 1099511627776), "1024 TB")
})

test("rejects negative, non-finite and non-numeric input", () => {
  assert.throws(() => formatBytes(-1), TypeError)
  assert.throws(() => formatBytes(NaN), TypeError)
  assert.throws(() => formatBytes(Infinity), TypeError)
  assert.throws(() => formatBytes("1024"), TypeError)
  assert.throws(() => formatBytes(null), TypeError)
  assert.throws(() => formatBytes(undefined), TypeError)
})
