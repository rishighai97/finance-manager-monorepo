---
name: ux-explore
description: Generates comparable UX mockup options for finance-manager-ui so the user can decide on a direction before any real code changes (see jira/JIRA_12.md). Round 1 (run once, or whenever revisiting the whole app's look) produces ~3 app-wide style-direction mockups on representative screens via the design skill, with the chosen direction recorded in ux/UX_DIRECTION.md. Round 2 (per page, only after a direction is Ready for Dev) produces 2-3 layout variants within that direction for one page at a time - covering happy/empty/error/loading states, populated with real data via db-run - recorded in a ux/UX_<page>.md spec that goes through a Draft -> Options Presented -> Selected -> Ready for Dev gate like jira-create. Use whenever asked to explore/propose/compare UX directions or layouts for finance-manager-ui, or to continue refining an existing ux/UX_DIRECTION.md or ux/UX_<page>.md.
---

# ux-explore

Produces comparable, clickable mockups so a UX decision gets made deliberately - before `ux-apply` touches any real Angular/Ionic component. This is an interactive, in-conversation workflow like `jira-create` (go back and forth with the user across turns until a spec is genuinely settled), not a one-shot generation task - never spawn a subagent for it.

Every mockup is a `design` skill canvas published as an Artifact - see that skill before first use. `ux-explore` never writes to `finance-manager-ui/` itself; that's `ux-apply`'s job once a spec reaches Ready for Dev.

## Step 0 - Identify what's being worked on

- No `ux/UX_DIRECTION.md` yet, or the user is asking about the app's overall look -> **Round 1** (below).
- `ux/UX_DIRECTION.md` exists and is `Ready for Dev`, and the user names a page (or asks "what's next") -> **Round 2** for that page.
- `ux/UX_DIRECTION.md` exists but isn't `Ready for Dev` yet -> continue refining it (Round 1), not Round 2. **Never start a page's Round 2 before the direction is Ready for Dev** - a page's options must be built on a settled shared contract, not a moving one.
- A `ux/UX_<page>.md` already exists and isn't `Ready for Dev` -> continue refining that page instead of starting a new one.

Check `ux/README.md`'s tables for current status of both before assuming which mode applies.

## Round 1 - App-wide direction

1. **Pick 1-2 representative screens** to mock up per direction - `transaction-list` (data-dense, the most-used page) plus either `account-list` or `tabs` (navigation chrome) is a good default pairing, but ask if unsure.
2. **Generate ~3 distinct style directions** as separate `design` skill artboards/artifacts, each varying: typography (type scale, font pairing), color palette, spacing/density, and navigation pattern. Use fake/placeholder data - Round 1 is about the *system*, not real content (real data is Round 2's job). Give each direction a short memorable name (e.g. "Minimal", "Data-dense dashboard", "Card-based mobile-native" - or whatever three directions actually make sense for this app).
3. **Present the options** to the user (link each artifact, one-line description of what's distinct about it) and let them pick one, ask for changes, or request an entirely different direction. Iterate across turns as needed - don't rush to a decision.
4. **Once a direction is chosen**, write `ux/UX_DIRECTION.md` (create if it doesn't exist) capturing the shared contract every page's Round 2 options must stay inside:
   - Color tokens (map to Ionic CSS custom properties - see `finance-manager-ui/src/theme/variables.scss` for the existing variable names `ux-apply` will need to override).
   - Type scale (sizes, weights, line-height).
   - Spacing/density rules.
   - Component style conventions (card treatment, button style, list-item shape, etc.).
   - Navigation pattern (tab bar layout, header conventions).
   - A link to the winning artifact and a one-line note on what was picked and why.
5. Mark `ux/UX_DIRECTION.md`'s status `Ready for Dev` **only on the user's explicit confirmation** ("looks good", "let's go with X", etc.) - never unilaterally. Update `ux/README.md`'s "App-wide direction" row to match.

## Round 2 - Per-page options

Only run this for a page once `ux/UX_DIRECTION.md` is `Ready for Dev`.

1. **Copy `ux/TEMPLATE.md`** to `ux/UX_<page>.md` (page names: `account-list`, `transaction-list`, `category-list`, `statement-uploader`, `auth`, `tabs` - matching `finance-manager-ui/src/app/<page>/`). Fill in `Status: Draft`, dates, and the `Direction` line (link `UX_DIRECTION.md`, note it's `Ready for Dev`).
2. **Pull real sample data** for this page via the `db-run` skill (never fabricate fake data for Round 2 - that's what makes these mockups trustworthy). First confirm the local stack/DB is actually reachable (`local-setup`/`db-setup` if not) rather than assuming. Example queries per page:
   - `account-list`: `SELECT ua.user_account_name, a.name, at.type_1, at.type_2 FROM user_account ua JOIN account a ON a.id=ua.account_id JOIN account_type at ON at.id=a.type_id WHERE ua.user_id=1;`
   - `transaction-list`: `SELECT t.date, t.title, t.debit_or_credit_amount, t.is_credit_amount FROM transaction t WHERE t.user_account_id=1 ORDER BY t.date DESC LIMIT 20;`
   - `category-list`: `SELECT name FROM user_category WHERE user_id=1;`
   - `statement-uploader`/`auth`/`tabs`: these are less data-driven - use whatever's representative (e.g. `account_statement` rows for the uploader's account-picker, or just the direction's own chrome for `tabs`).
3. **Generate 2-3 layout variants** within the approved direction, as `design` skill artifacts, using that real data. **Each variant must show all four states**: happy path (the real data above), empty (no accounts/transactions/categories yet), error (upload failed / fetch failed), and loading (in-flight skeleton/spinner) - don't only mock the happy path.
4. **Present the options**, iterate with the user across turns, and once one is picked fill in `Selected option` and `Implementation detail` (enough concrete detail - layout structure, which Ionic components, exact tokens from `UX_DIRECTION.md`, interaction notes, and the happy/empty/error/loading treatment - that `ux-apply` doesn't have to re-decide anything).
5. Mark the page's status `Ready for Dev` **only on explicit user confirmation**, bump `Last updated`, append a `Changelog` line. Update `ux/README.md`'s page row (file link + status).

## Conventions shared with `jira-create`

- Never flip a status to `Ready for Dev` unilaterally - only on explicit confirmation ("looks good", "ready", "let's build it").
- Every status change gets a `Changelog` entry describing *what* changed, not just "updated".
- This skill's job ends at Ready for Dev - implementation is `ux-apply`'s job, a separate step. Don't drift into editing `finance-manager-ui/` from here.

## Keeping this doc updated

See `docs/SKILLS.md` for the catalog entry and `jira/JIRA_12.md` for the ticket this was built under. If `ux/TEMPLATE.md`'s structure changes, update both it and this file together.
