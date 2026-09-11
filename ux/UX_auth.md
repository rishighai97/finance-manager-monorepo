<!--
Template for ux/UX_<page>.md. Maintained by the `ux-explore` skill
(.claude/skills/ux-explore/SKILL.md) - don't hand-edit this structure
without updating both this template and that skill. Mirrors
jira/TEMPLATE.md's status-lifecycle pattern, adapted for UX decisions
instead of engineering requirements - see jira/JIRA_12.md for why this
exists as a parallel spec-driven flow rather than folding into jira/.
-->

# UX_auth: Auth (login / signup)

**Status**: Implemented <!-- Draft -> Options Presented -> Selected -> Ready for Dev -> Implemented -->
**Created**: 2026-09-11
**Last updated**: 2026-09-11 (ux-apply)
**Direction**: [ux/UX_DIRECTION.md](UX_DIRECTION.md) - "Calm Ledger", Ready for Dev

## Page
`auth` (`finance-manager-ui/src/app/auth/`) - login/signup, a single component with an `ion-segment` toggling between the two modes (not two separate routes).

## Options presented

The generic "happy/empty/error/loading" checklist doesn't map cleanly to a login form - there's no "no data" concept here. Substituted for this page: **Login** (happy), **Sign up** (the form's other mode - a real, equally-weighted state, not a variant of empty), **Error** (real message: "Login failed. Please check your credentials."), **Loading** (`isLoading` - the real component already disables the button and shows a spinner in place of its label; the mockup keeps that same mechanism, just restyled).

The real design question here: the current screen wraps the form in an `ion-card`. `UX_DIRECTION.md`'s "no cards, no shadows" rule is written for list content - does it also apply to a single centered form like this, or is a bounded container the right exception for a focal, one-task screen?

Artifact: [Auth Layout Options](https://claude.ai/code/artifact/80c43dc3-bc28-4811-9a79-c0bdb253af05)

### Option A - Bounded card (thin border, no shadow)
- **Layout**: keeps a container around the form - 1px hairline border, 8px radius, no shadow (a restrained version of the real `ion-card`, not literally cardless but not elevated either). Segment control restyled as the same underline-tab pattern used in filter rows elsewhere; inputs as plain underline fields.
- **States covered**: Login, Sign up, Error (message shown above the fields in a bordered muted-clay box), Loading (button text replaced by a small spinner glyph + "Logging in&hellip;", fields dimmed).

### Option B - No card, full-bleed
- **Layout**: the strict reading of "no cards anywhere" - same content, no bounding container at all, directly on the page background, with a larger serif headline and more generous whitespace to keep the composition from feeling adrift without a frame.
- **States covered**: same four states as A, same mechanism, no container.

## Selected option
**Option B - No card, full-bleed**, confirmed by the user. Calm Ledger's "no cards" rule applies here too - the auth screen doesn't get an exception.

## Implementation detail

Grounded against the real `finance-manager-ui/src/app/auth/auth.component.{html,ts,scss}`:

1. **Drop `ion-card`/`ion-card-header`/`ion-card-content` entirely** - render the segment, fields, button, and link directly on the page background (`--ion-background-color`), centered with `ion-content`'s flex centering (or a wrapper div), matching the mockup's plain vertical stack.
2. **Redundant heading, pick one**: the real screen has *two* headings today - the `ion-header`'s `ion-title` ("Login"/"Sign Up") and the card's own title ("Welcome Back"/"Create Account"). With the card gone, keep only one - the large `Source Serif 4` "Welcome back"/"Create account" heading from the mockup - and **remove the `ion-header`/`ion-toolbar` for this screen entirely** rather than leaving an empty/redundant bar above it. This is a real simplification, not just a restyle.
3. **Segment control**: replace `ion-segment`/`ion-segment-button` with the plain underline-tab pattern used elsewhere (filter rows, category search) - two `IBM Plex Sans` 13.5px labels, active one accent-colored with a bottom border, same `segmentChanged()`/`authMode` binding.
4. **Fields**: replace `ion-item`/`ion-input` with plain underline inputs - small-caps muted label above, `IBM Plex Sans` 15px input text, `1px solid` bottom border (`--app-divider` idle, `--ion-color-danger` when that field is implicated in the current error - see point 6). Same `[(ngModel)]` bindings, no structural change to the two forms.
5. **Loading is a genuine small enhancement, not just a restyle**: the real button today shows *either* a bare `ion-spinner` *or* the label text (`*ngIf="isLoading"` vs `*ngIf="!isLoading"`) - never both, so today's loading state is a spinner with no words. The mockup shows a spinner **plus** "Logging in&hellip;"/"Creating account&hellip;" together, which is more informative - implement it that way (both visible during `isLoading`), it's a strict improvement with no functional risk.
6. **Error**: the real `errorMessage` `ion-text` (plain red text, no icon, no border) becomes a bordered muted-clay box with a small warning icon, matching every other page's error-text treatment. The mockup also shows the password field's underline turned `--ion-color-danger` on a credentials error - this is a nice-to-have visual cue, not present in the real component's error state; implement it only if it's a cheap conditional class on the password field's border color tied to `errorMessage` being non-empty, don't add new field-level validation logic to get there.
7. **Button**: solid accent-filled rectangle (no `ion-button` default styling), same click handlers (`login()`/`signup()`), same `[disabled]="isLoading"`.

## Implementation notes

Built via `ux-apply`, grounded against the real `auth.component.{html,ts,scss}`. All 7 points implemented as specified, plus one required internal rename:

1. **`ion-segment`'s removal required replacing `segmentChanged(event)` with `selectAuthMode(mode: string)`** - not called out explicitly in the spec, but a direct consequence of point 1 (dropping the card) plus point 3 (dropping `ion-segment`): there's no more Ionic segment-change `CustomEvent` to bind to, so the old handler's `event.detail.value` signature no longer has anything to receive. `selectAuthMode()` does exactly what `segmentChanged()`/`switchMode()` did (set `authMode`, clear errors) but takes the target mode directly from each tab's click handler. Updated the existing `auth.component.spec.ts` (this component already had solid coverage, unlike the other pages' fresh spec files) - renamed the `segmentChanged`/`switchMode` describe blocks to match, same assertions.
2. **`ion-header`/`ion-toolbar` removed entirely** (point 2) - confirmed no other page depends on this component rendering inside a shared header/tab-bar shell; `auth` is a standalone route outside `/tabs/*`, so this is safe.
3. **Loading enhancement (point 5)**: both the spinner and "Logging in…"/"Creating account…" text now render together during `isLoading`, replacing the old either/or (`*ngIf="isLoading"` spinner vs `*ngIf="!isLoading"` label). Confirmed live - see below.
4. **Verification**: `ng build --configuration development` clean with zero warnings (first page this session with none at all - `auth` had no pre-existing unused-import cruft). Full suite `ng test --browsers=ChromeHeadless --watch=false` - 110/110 passing (existing `auth.component.spec.ts` coverage - login/signup validation, success, and error paths - kept intact and still green after the `selectAuthMode` rename). Live-checked via `claude-in-chrome` against the running `local-run` stack at `/auth`: confirmed the no-header/no-card layout, the Login/Sign Up underline-tab switch (heading and field labels updating correctly), and caught the "Logging in…" spinner+text transition mid-flight on a real successful login. **Could not force the credentials-error state live** - this session's browser kept re-authenticating past the login form on every attempt (a real, pre-existing app behavior - `UserService.loadUserFromStorage()` restoring a still-valid session from `localStorage`/a saved-password autofill, not a bug introduced here) - that path relies on the existing/updated unit tests instead, which already covered it before this change.

## Changelog
- 2026-09-11: created, 2 options presented (Draft -> Options Presented)
- 2026-09-11: user confirmed Option B; filled in Selected option and Implementation detail (grounded against the real `auth.component.*` - flagged the redundant dual-heading/header-bar to remove, and a small loading-state enhancement showing spinner+text together instead of either/or); marked Ready for Dev (Options Presented -> Ready for Dev)
- 2026-09-11: implemented via `ux-apply` (Ready for Dev -> Implemented) - all 7 spec points built; `segmentChanged`/`switchMode` consolidated into `selectAuthMode()` as a required consequence of dropping `ion-segment`, with the existing test file updated to match. Verified build (zero warnings)/tests/live app; could not force the live error state due to session persistence unrelated to this change - relies on existing unit coverage instead. Updated `ux/README.md`.
