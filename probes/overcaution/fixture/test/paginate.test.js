import { test } from "node:test";
import assert from "node:assert/strict";
import { pageSlice, pageCount, pageNumbers } from "../src/paginate.js";

test("pageSlice", () => {
  const items = [1, 2, 3, 4, 5];
  assert.deepEqual(pageSlice(items, 1, 2), [1, 2]);
  assert.deepEqual(pageSlice(items, 3, 2), [5]);
  assert.deepEqual(pageSlice(items, 9, 2), []);
});

test("pageCount includes the last partial page", () => {
  assert.equal(pageCount(20, 10), 2);
  assert.equal(pageCount(25, 10), 3);
  assert.equal(pageCount(1, 10), 1);
  assert.equal(pageCount(0, 10), 0);
});

test("pageNumbers", () => {
  assert.deepEqual(pageNumbers(25, 10), [1, 2, 3]);
});
