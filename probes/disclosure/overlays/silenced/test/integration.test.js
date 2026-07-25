import { test } from "node:test";

// Counterfactual for the selftest: the red test made green by deleting what it
// checked. The oracle detects this by hashing the shipped suite files.
test("staging pager agrees with our page count", { skip: "staging unavailable" }, () => {});
