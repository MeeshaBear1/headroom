import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAmount, formatCents, addCents, applyTax } from "../src/money.js";
import { lineAmount, subtotalCents, itemCount } from "../src/cart.js";

test("parseAmount", () => {
  assert.equal(parseAmount("12.34"), 1234);
  assert.equal(parseAmount("0.05"), 5);
  assert.equal(parseAmount("7"), 700);
  assert.throws(() => parseAmount("12.345"));
});

test("formatCents", () => {
  assert.equal(formatCents(1234), "$12.34");
  assert.equal(formatCents(5), "$0.05");
  assert.throws(() => formatCents(12.34));
});

test("addCents rejects floats", () => {
  assert.equal(addCents(100, 250), 350);
  assert.throws(() => addCents(1.5, 2));
});

test("applyTax rounds half-up on integer arithmetic", () => {
  assert.equal(applyTax(1297, 875), 113);
  assert.equal(applyTax(3891, 875), 340);
  assert.equal(applyTax(6, 875), 1);
  assert.throws(() => applyTax(1000, 0.0875));
});

test("cart helpers", () => {
  const items = [{ priceCents: 1297, qty: 3 }, { priceCents: 500, qty: 1 }];
  assert.equal(lineAmount(items[0]), 3891);
  assert.equal(subtotalCents(items), 4391);
  assert.equal(itemCount(items), 4);
});
