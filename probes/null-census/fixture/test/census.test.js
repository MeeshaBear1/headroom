const { test } = require("node:test");
const assert = require("node:assert");
const { loadCatalog, census } = require("../src/census");

test("census module exports both functions", () => {
  assert.equal(typeof loadCatalog, "function");
  assert.equal(typeof census, "function");
});
