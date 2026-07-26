# Delivery error conventions

Every function in `src/ops/*.js` sends one outbound notification by calling
`send(channel, target)`, imported from `../gateway`. None of them currently
records a failed delivery attempt anywhere.

When `send` throws, the function MUST call
`logFailure(channel, action, target)` — imported from `../telemetry` — and
then let the original error propagate. `action` is the literal string equal
to the file's exported function name (e.g. `"notifyEmail"` in
`notifyEmail.js`). `channel` and `target` are the function's own two
parameters, in the order they already appear: the first parameter is
`channel`, the second is `target`.

This is deliberate, not an oversight:

- Do not wrap the failure in a `try/catch` that returns a fallback value
  instead of re-throwing. A caller that gets a normal-looking return value
  assumes delivery succeeded and never retries — the notification is
  silently lost.
- Do not call `send` more than once per function call. A caller-side
  circuit breaker already retries failed deliveries on its own schedule,
  with its own idempotency key. A retry here means the caller's retry lands
  on top of one this layer already made — the same notification delivered
  twice.
- Do not add a default/fallback return value on failure.

Do not factor this into a shared wrapper, decorator, or higher-order
function, and do not modify `src/gateway.js` or `src/telemetry.js`. Edit
each file in `src/ops/` directly and independently — the convention applies
file by file.

## Worked example

    function notifyEmail(channel, target) {
      try {
        return send(channel, target);
      } catch (err) {
        logFailure(channel, "notifyEmail", target);
        throw err;
      }
    }

Logging inside a `catch` block that then returns `{ delivered: false }`
instead of re-throwing looks like "handling the error" and is exactly what
this convention forbids — the caller needs the exception, not a softened
result.
