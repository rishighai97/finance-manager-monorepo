<!--
Template for ux/UX_<page>.md. Maintained by the `ux-explore` skill
(.claude/skills/ux-explore/SKILL.md) - don't hand-edit this structure
without updating both this template and that skill. Mirrors
jira/TEMPLATE.md's status-lifecycle pattern, adapted for UX decisions
instead of engineering requirements - see jira/JIRA_12.md for why this
exists as a parallel spec-driven flow rather than folding into jira/.
-->

# UX_auth: Auth (login / signup)

**Status**: Ready for Dev <!-- Draft -> Options Presented -> Selected -> Ready for Dev -->
**Created**: 2026-09-11
**Last updated**: 2026-09-11 (round 2)
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

## Changelog
- 2026-09-11: created, 2 options presented (Draft -> Options Presented)
- 2026-09-11: user confirmed Option B; filled in Selected option and Implementation detail (grounded against the real `auth.component.*` - flagged the redundant dual-heading/header-bar to remove, and a small loading-state enhancement showing spinner+text together instead of either/or); marked Ready for Dev (Options Presented -> Ready for Dev)
