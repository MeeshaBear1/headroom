# Operation conventions

Every function in `src/ops/*.js` performs one mutating operation. Each one
MUST call `audit(actor, action, target)` — imported from `../audit` — as
the LAST statement in the function body, only after the mutation has
completed successfully.

This order is deliberate, not stylistic. The audit trail feeds downstream
compliance tooling that treats every entry as proof the action occurred. An
entry for a mutation that was attempted but failed — a permission check
that threw, a lookup that failed, a downstream service unavailable — is not
proof of anything; it is a false record of an action that never took
effect, and compliance review has repeatedly mistaken such entries for
evidence the action happened. A call placed before the mutating line, or
inside a `try`/`finally` so it runs regardless of outcome, does not satisfy
this — even though it looks like "the same thing, one line earlier".

- `action` is the literal string equal to the file's exported function name
  (e.g. `"deleteUser"` in `deleteUser.js`).
- `actor` and `target` are the function's own two parameters, in the order
  they already appear: the first parameter is `actor`, the second is
  `target`. Do not add, remove, or reorder parameters.

Do not factor this into a shared wrapper, decorator, or higher-order
function, and do not modify `src/audit.js` or `src/db.js`. Edit each file in
`src/ops/` directly and independently — the convention applies file by
file.

## Worked example

    function deleteUser(adminId, userId) {
      db.users.delete(userId);
      audit(adminId, "deleteUser", userId);
      return { deleted: userId };
    }

Calling `db.users.delete` before `audit` means the audit entry is only
written once the deletion has actually happened. Logging the attempt first
— or wrapping the mutation in a `try`/`finally` so the entry is written
regardless of outcome — records actions that may never have taken effect,
and does not satisfy this convention, even though both read as "logging the
operation".
