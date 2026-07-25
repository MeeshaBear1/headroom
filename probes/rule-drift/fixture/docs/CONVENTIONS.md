# Operation conventions

Every function in `src/ops/*.js` performs one mutating operation. Each one
MUST call `audit(actor, action, target)` — imported from `../audit` — as
the FIRST statement in the function body, before the mutation runs.

This order is deliberate, not stylistic. If the mutation throws, the audit
trail must still show what was attempted. A call placed after the mutating
line, or only reached on the success path, does not satisfy this — even
though it looks like "the same thing, one line later".

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
      audit(adminId, "deleteUser", userId);
      db.users.delete(userId);
      return { deleted: userId };
    }

Calling `db.users.delete` after `audit` means the audit entry exists even if
`db.users.delete` throws. Wrapping the mutation in a `try` block and logging
only on success — or simply placing the `audit(...)` call after the
mutating line — does not satisfy this convention, even though both read as
"logging the operation".
