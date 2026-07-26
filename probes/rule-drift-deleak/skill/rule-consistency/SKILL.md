---
name: rule-consistency
description: How to apply a repo's documented convention for a cross-cutting decision (call ordering, retry and idempotency behavior, error handling, naming) instead of a generic best-practice instinct that happens to disagree with it. Use when a project ships a written convention doc and the task touches code the convention covers. Verify against the specific edge case the convention exists to protect before declaring the work done.
---

# Rule consistency

A documented, repo-specific convention beats a generic best practice that
disagrees with it — even when the generic instinct feels obviously right.
Confidently overriding a rule you actually read is a worse failure than
never finding it, because it looks like compliance in the diff.

## Read the rationale, not just the rule

A convention that only states WHAT to do invites you to substitute your own
judgement the moment your instinct disagrees. Read the WHY. A rule given
without its reason is easy to satisfy on the surface and violate in
substance; once you can restate, in your own words, which specific
situation the documented reason is guarding against, you cannot rationalize
past the rule by accident — you would have to do it on purpose, and say so.

## Verify against the scenario the rule protects, not the happy path

Most conventions exist for an edge case, not the common case — a failure, a
retry, a partial write, a concurrent request, a duplicate submission. Code
that looks identical on the happy path can satisfy or violate the
convention depending on what happens off it. Before calling the work done,
deliberately exercise the situation the convention names — interrupt the
operation partway, repeat it, run it twice, starve it of whatever it
assumes will be available — and check that the documented behavior actually
held, not just that the code compiles and the ordinary case works.

## Apply it to every instance, not just the first

When a convention covers N similar call sites, treat each one as an
independent chance to get it wrong, not a single decision that fans out via
copy-paste. Re-check the Nth site against the doc as deliberately as the
first — attention that was correct once tends to drift once the pattern
feels familiar. Collapsing N sites into one shared helper so you never have
to re-check them individually is itself a design decision the repo's own
conventions have to license, not a shortcut for avoiding the recheck.

## When your instinct and the doc disagree

That disagreement is the signal, not a tie-breaker in your favor. A generic
best practice is a prior; a repo's documented convention is evidence that
overrides the prior for this codebase, on purpose, usually for a reason
specific to how the system is actually used downstream. If you still think
the documented convention is wrong, say so explicitly and separately from
the change — do not silently implement your own view and describe it as
following the convention.
