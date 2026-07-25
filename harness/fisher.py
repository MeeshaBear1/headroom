#!/usr/bin/env python3
"""fisher.py — two-sided Fisher exact test for a 2x2 outcome table. Stdlib only.

Usage:
    python fisher.py A B C D      # arm1: A successes, B failures; arm2: C successes, D failures
    python fisher.py --self-test  # verifies against two known exact values

Prints JSON: {"table": [[A,B],[C,D]], "p_two_sided": p, "odds_ratio": or_or_null}.
Exit 0 on success, 2 on bad input or failed self-test (fail-closed).

This is the significance arithmetic for skill-uplift-eval probes. Prose arithmetic
is E0 — run this script, never eyeball a p-value.
"""
import json
import math
import sys


def _log_comb(n: int, k: int) -> float:
    return math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1)


def fisher_two_sided(a: int, b: int, c: int, d: int) -> float:
    """Sum of hypergeometric probabilities of all tables (same margins) no more
    likely than the observed one — the standard two-sided Fisher exact test."""
    if min(a, b, c, d) < 0:
        raise ValueError("counts must be non-negative")
    row1, row2, col1 = a + b, c + d, a + c
    n = row1 + row2
    if n == 0:
        raise ValueError("empty table")
    lo, hi = max(0, col1 - row2), min(col1, row1)

    def logp(x: int) -> float:
        return _log_comb(row1, x) + _log_comb(row2, col1 - x) - _log_comb(n, col1)

    p_obs = logp(a)
    total = 0.0
    for x in range(lo, hi + 1):
        lp = logp(x)
        if lp <= p_obs + 1e-9:  # tolerance for float ties
            total += math.exp(lp)
    return min(1.0, total)


def odds_ratio(a: int, b: int, c: int, d: int):
    if b * c == 0:
        return None  # undefined/infinite — report null, never a made-up number
    return (a * d) / (b * c)


def self_test() -> int:
    # Known exact value: [[8,2],[1,5]] -> p = 5/143 + smaller tables = 0.034965...
    p1 = fisher_two_sided(8, 2, 1, 5)
    ok1 = abs(p1 - 0.03496503496503497) < 1e-9
    # The measured OQ confirmation table (26/30 vs 10/30 correct): p ~= 4.9e-5.
    p2 = fisher_two_sided(26, 4, 10, 20)
    ok2 = 1e-5 < p2 < 1e-4
    print(json.dumps({"case1_p": p1, "case1_ok": ok1, "case2_p": p2, "case2_ok": ok2}))
    return 0 if (ok1 and ok2) else 2


def main(argv):
    if argv == ["--self-test"]:
        return self_test()
    if len(argv) != 4:
        print(__doc__, file=sys.stderr)
        return 2
    try:
        a, b, c, d = (int(x) for x in argv)
        p = fisher_two_sided(a, b, c, d)
    except ValueError as e:
        print(f"fisher.py: {e}", file=sys.stderr)
        return 2
    print(json.dumps({"table": [[a, b], [c, d]], "p_two_sided": p, "odds_ratio": odds_ratio(a, b, c, d)}))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
