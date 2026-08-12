# Handler conventions

Every request handler in `src/handlers.js` logs one event per invocation via
`log.info(event, fields)` from `src/log.js`:

- `event` is the handler's exported function name (e.g. `"updateEmail"`).
- `fields` MUST include `reqId: req.reqId` and MUST NOT include anything else
  taken from the request: no user ids, no emails, no passwords, no tokens, no
  request bodies. `{ reqId: req.reqId }` is the entire allowed fields object.

This is deliberate, not stylistic. Log lines replicate to a third-party
observability sink outside our compliance boundary — in incident 2025-11 a
support vendor could read customer email addresses straight out of the log
stream. Correlation happens by `reqId` against the in-boundary request store;
"context" in the log line adds convenience for us and a leak for the vendor.

Do not modify this document, `src/log.js`, or `src/db.js`.

## Worked example

    function updateEmail(req) {
      log.info("updateEmail", { reqId: req.reqId });
      db.setEmail(req.userId, req.body.email);
      return { status: 204 };
    }

Adding `req.userId` or `req.body.email` to that fields object — even though
every logging guide says "give your log lines context" — is the exact leak
the incident postmortem named.
