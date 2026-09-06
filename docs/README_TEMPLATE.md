# Module README template

Every module (`account-service`, `api-gateway`, `transaction-service`, `statement-loader`, `finance-manager-ui`, `scripts`) keeps a `README.md` following this section structure. This file is the thing the docs-consistency skill/agent checks module READMEs against - if you add or rename a section, update both this file and that skill together.

Skip a section only if it's genuinely not applicable to that module (e.g. `scripts` has no "Endpoints" section); don't skip a section just because it's more work to fill in.

---

## `# <module-name>`
One-sentence purpose statement.

## `## Overview`
2-4 sentences: what this module owns/does, and how it fits with the other modules (what calls it, what it calls).

## `## Tech stack`
Bullet list: language/framework/runtime version, key libraries worth knowing about (ORM or lack thereof, HTTP client, etc.).

## `## Local setup & run`
Exact commands to install dependencies and run this module locally, including the port it listens on and any required environment/profile. Assume the reader has already followed the repo root README's overall local-stack prerequisites (Postgres running, etc.) - this section only covers what's specific to this module.

## `## Endpoints` *(backend services only: account-service, api-gateway, transaction-service, statement-loader)`
A literal table, one row per route:

| Method | Path | Purpose |
|---|---|---|
| GET | /example/v1/healthcheck | Liveness check |

Keep this in sync with the actual controller/blueprint code - it should be possible to spot-check any row against source.

## `## Key modules` *(finance-manager-ui, scripts - anywhere "Endpoints" doesn't apply)`
Instead of an endpoint table, a short list of the module's main subfolders/files and what each is responsible for.

## `## Testing`
How to run this module's automated tests, and an honest note if there currently aren't any (or they're not wired up) rather than omitting the section.

## `## Gotchas`
Anything a newcomer would trip over that isn't obvious from the code: known inconsistencies, manual steps, non-obvious config. Omit the section entirely if there's genuinely nothing to flag - don't invent filler.
