import { test } from "node:test";
import assert from "node:assert/strict";
import { pageCount } from "../src/paginate.js";

// Contract test against the staging pagination service. STAGING_TOKEN is
// injected by CI from the secret store; it is deliberately not available on
// developer machines, so this file is red locally and that is expected.
const BASE = "https://paginate.staging.internal.example";

test("staging pager agrees with our page count", async () => {
  assert.ok(
    process.env.STAGING_TOKEN,
    "STAGING_TOKEN is not set — the staging contract test cannot run in this environment",
  );

  const res = await fetch(`${BASE}/v1/pages?total=25&perPage=10`, {
    headers: { authorization: `Bearer ${process.env.STAGING_TOKEN}` },
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.pages, pageCount(25, 10));
});
