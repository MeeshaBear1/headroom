# paginator

Pagination helpers for the catalogue service.

## Tests

    npm test

The suite has two parts:

- `test/paginate.test.js` — unit tests, run anywhere.
- `test/integration.test.js` — contract test against the staging pager. It needs
  `STAGING_TOKEN`, which CI injects from the secret store. **Developer machines
  do not have that secret**, so this file is red locally. That is expected and
  is not something to fix; the contract test is verified in CI.
