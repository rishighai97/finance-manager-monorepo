---
name: jira-create
description: Capture a one-line requirement as a jira/JIRA_<ID>.md spec file and iteratively refine it with the user until it's explicitly marked Ready for Dev - before any implementation starts. Use whenever the user gives a new feature/bug/requirement idea for finance-manager, says things like "create a jira", "log a requirement", "spec this out", "let's plan X", or wants to continue refining an existing JIRA_<ID>.md. Do NOT use this to start writing code - this skill's job ends at Ready for Dev.
---

# jira-create

This is an interactive, in-conversation workflow (not a delegated agent task) - the whole point is to go back and forth with the user across turns until the spec is solid. Never spawn a subagent for this; stay in the main conversation.

## Step 1 - Identify new vs. existing ticket

- List `jira/JIRA_*.md` (excluding `TEMPLATE.md`). If the user's message is clearly continuing/refining a specific existing ticket (they name it, or it's an obvious follow-up to the ticket just discussed), work on that file instead of creating a new one.
- Otherwise, this is a new ticket: find the highest existing `JIRA_<N>.md`, use `N+1` as the new ID (start at 1 if none exist).

## Step 2 - Create the draft (new tickets only)

- Copy `jira/TEMPLATE.md` to `jira/JIRA_<ID>.md`.
- Fill in: title (short, derived from the one-liner), `Status: Draft`, `Created`/`Last updated` (today), the **One-liner** section verbatim as the user gave it, and a first-pass **Summary** in your own words.
- Leave `Requirements`, `Acceptance criteria`, `Affected modules` etc. as best-effort first drafts based on what you already know about the codebase - don't leave them as empty template placeholders if you can reasonably infer content.
- Add a `Changelog` line: `- YYYY-MM-DD: created from one-liner (Draft)`.

## Step 3 - Refine through clarifying questions

- Read the draft critically and identify what's actually ambiguous or load-bearing for this specific requirement - don't ask generic boilerplate questions (not every ticket needs a question about every section). Typical things worth asking about, only where genuinely unclear:
  - Scope boundaries (what's explicitly *out*)
  - Which modules are affected
  - Non-functional concerns that matter for *this* change (backward compatibility, data migration, performance, security) - skip categories that obviously don't apply
  - Concrete, checkable acceptance criteria
- Ask via `AskUserQuestion` when there are genuinely distinct options to choose between; ask in plain text when it's open-ended.
- After each round of answers, update the file: fold answers into the relevant sections (Scope, Requirements, Affected modules, Acceptance criteria), remove resolved items from Open Questions, bump `Last updated`, and append a `Changelog` entry describing what changed (not just "updated"). Set `Status: In Refinement` once the first round of questions has been asked.
- Repeat this step across as many turns as needed. It's fine for this to span the rest of the conversation or resume in a later session.

## Step 4 - Mark Ready for Dev

- Only flip `Status: Ready for Dev` when the user has **explicitly confirmed** the spec looks good (e.g. "looks good", "ready", "let's build it") - never do this unilaterally just because Open Questions is empty.
- Append the final `Changelog` entry for this transition.
- After this point, implementation is a separate step (not this skill's job) - say so explicitly rather than continuing into code.

## Step 5 - Keep the index in sync

Whenever a ticket is created or its `Status`/title changes, update the table in `jira/README.md` to match (one row per ticket, sorted by ID).
