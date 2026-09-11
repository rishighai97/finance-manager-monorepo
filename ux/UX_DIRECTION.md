<!--
App-wide UX style direction for finance-manager-ui (JIRA_12). Maintained
by the `ux-explore` skill (.claude/skills/ux-explore/SKILL.md) - every
page's Round 2 options (ux/UX_<page>.md) must stay inside this contract.
Don't hand-edit without going back through that skill.
-->

# UX_DIRECTION: App-wide UX style direction

**Status**: Ready for Dev <!-- Draft -> Options Presented -> Selected -> Ready for Dev -->
**Created**: 2026-09-11
**Last updated**: 2026-09-11
**Winning artifact**: [Finance Manager UX Directions](https://claude.ai/code/artifact/ecb13dd8-9cf4-48c7-b490-80b2a84825ed) &mdash; Option 6, "Calm Ledger"

## Chosen direction

**Calm Ledger** &mdash; a deliberate blend of two user-picked finalists: Calm Minimal Finance's warmth and restraint (option 3) with Structured Ledger's tabular information density (option 5). The app should feel quiet and considered, never alarm-colored or card-heavy, but still let a user with 6+ linked accounts across banks/brokers scan a lot of real data fast. Mocked up on Account list and Transaction list; see the artifact's row 6 for the reference screens.

Directions considered and set aside, for the record (see the artifact for all six, and the conversation history for the reasoning at each round):
1. iOS Native (HIG-adjacent) - closest to Apple's own apps, but the user preferred a direction that wasn't system-color-palette-bound.
2. Modern Fintech Dashboard - bold Manrope/card-heavy; ruled out for being visually loud even after a pass to tone down the font weights.
3. Calm Minimal Finance - one of the two finalists; contributed its warm palette, serif headline, and hairline-divider restraint to the final pick.
4. Private Wealth (dark) - a strong dark-mode candidate, not chosen for the app-wide direction but worth revisiting later as an optional dark theme rather than the only look.
5. Structured Ledger - the other finalist; contributed its tabular monospace figures, column-header row, and density approach.
6. **Calm Ledger - chosen.**

## Color tokens

All hex values below are literal; map them onto `finance-manager-ui/src/theme/variables.scss`'s existing Ionic CSS custom properties (`--ion-color-*`) rather than inventing a parallel token system. Where Ionic has no equivalent built-in variable, a custom `--app-*` property is the intended home (noted below) - `ux-apply` should add these once, at the top of `variables.scss`, not per-page.

| Role | Hex | Ionic / custom variable |
|---|---|---|
| Page background | `#FAF9F6` | `--ion-background-color` |
| Primary text (ink) | `#1F1F1F` | `--ion-text-color` |
| Secondary text | `#6B6B6B` | `--ion-color-medium` |
| Tertiary / muted label | `#9A968D` | `--app-color-muted` (custom - Ionic's default palette has no third gray tier) |
| Accent (active state, links, selected filter) | `#B0603F` | `--ion-color-primary` (shade `#8A4A32` -> `--ion-color-primary-shade`; a lighter tint e.g. `#C07958` -> `--ion-color-primary-tint`) |
| Credit / positive amount | `#5C7A5E` (muted sage, not vivid green) | `--ion-color-success` |
| Debit / negative amount | `#A15C46` (muted clay, not vivid red) | `--ion-color-danger` |
| Neutral / zero amount | `#1F1F1F` (same as ink - no separate "neutral" color) | `--ion-text-color` |
| Section divider (between groups) | `#E5E3DE` | `--app-divider` (custom) |
| Row divider (between list items) | `#EFEDE8` (subtler than section divider) | `--app-divider-subtle` (custom) |
| Avatar/icon-circle outline | `#D8D5CC` | `--app-divider` family, or reuse `--ion-color-medium` at reduced opacity |
| Inactive tab bar icon/label | `#B3AFA4` | `--ion-tab-bar-color` |
| Active tab bar icon/label | `#B0603F` | `--ion-tab-bar-color-selected` |
| Tab bar / toolbar background | `#FAF9F6` (same as page - flat, no distinct chrome color) | `--ion-tab-bar-background`, `--ion-toolbar-background` |

## Type scale

Two fonts plus one numeric face - no third "body" font, and never Inter/Roboto/Arial:
- **Headline**: `"Source Serif 4"` (Google Font, weights 500/600) - screen titles only. 24px / weight 600 / letter-spacing -0.01em.
- **Body / UI**: `"IBM Plex Sans"` (weights 400/500/600) - everything else that isn't a number: row titles (14px/500), row subtitles (10.5px/400, muted), section labels and column headers (10-11px/600, uppercase, letter-spacing 0.08-0.09em, muted), filter/tab labels (12px, 10px).
- **Numeric / tabular**: `"IBM Plex Mono"` (weights 500/600) - every monetary amount, transaction date, and small meta count ("6 linked", "6 rows"), always right-aligned where it's a trailing column value. This is the direction's signature move: numbers get their own face so columns of figures actually align, everywhere in the app, not just on money-heavy screens.

## Spacing & density rules

- Row vertical padding: **12px** (tighter than a typical iOS grouped list - this is the direction's density lever). No card padding/radius anywhere.
- No elevation - flat surfaces throughout, separated only by hairlines (`--app-divider` between groups, `--app-divider-subtle` between rows within a group). Never add `box-shadow` to a list row or card in this direction.
- Page horizontal padding: 24px.
- Section gap (e.g. between Cash and Investment groups): 22px.
- Avatar/icon-circle: 26px diameter, 1px outline (not filled), single uppercase initial.
- A subtle 1px vertical hairline precedes a trailing amount/value column where the row also has a leading avatar or tag, reinforcing tabular alignment without a literal grid.
- Header block: compact, baseline-aligned - serif screen title on the left, small mono meta count on the right (e.g. "6 linked") - never a large iOS-style collapsing title.

## Component conventions

- **List-heavy screens get a literal column-header row** (e.g. "Date / Description / Amount", or a section label + running total) styled as plain small-caps text over a bottom hairline - never a filled gray block.
- **Avatars/tags**: thin 1px outlined circle, muted ink initial letter - the one identity mark reused for every account/bank across the app. Don't introduce colored filled badges (that's option 2's/5's vocabulary, not this one's).
- **Filter/scope controls**: plain inline text buttons, gap-separated, no pill/chip backgrounds. The active one gets a bottom border in the accent color plus semibold weight - not a filled background.
- **Amount styling**: `IBM Plex Mono`, right-aligned, muted clay/sage for debit/credit (never saturated alarm red/green), ink for neutral/zero.
- **No cards, no shadows, no rounded-corner containers** for list content anywhere - this is the direction's hardest constraint and the main thing that would break it if violated.

## Navigation pattern

- Bottom tab bar, 5 items (Accounts, Upload statements, Transactions, Categories, Logout), thin 1.3px-stroke line icons - no filled pill/badge behind the active icon (unlike the Fintech direction). Active state is accent color + semibold label only.
- Compact, non-collapsing header (see Spacing rules above) on every top-level tab screen.
- Round 2 (`ux-explore` per-page) should extend this same header/column-header/hairline vocabulary to `category-list`, `statement-uploader`, `auth`, and `tabs` - this file doesn't mock those screens directly, but nothing here is specific to Accounts/Transactions.

## Changelog
- 2026-09-11: Round 1 explored 3 initial directions (iOS Native, Modern Fintech Dashboard, Calm Minimal Finance) as a published design canvas (Options Presented)
- 2026-09-11: revised options 2 and 3 per feedback (toned down Fintech's font weights, added Source Serif 4 character to Calm Minimal, increased transaction density on both) (Options Presented)
- 2026-09-11: added 2 more directions (Private Wealth - dark/premium, Structured Ledger - tabular/dense) after reviewing the real account count (6-7 linked accounts) (Options Presented)
- 2026-09-11: added a 6th direction, Calm Ledger, blending the two the user preferred (3 and 5), per explicit request (Options Presented)
- 2026-09-11: user confirmed option 6 ("can be finalized") - this file created, capturing the full color/type/spacing/component/nav contract, marked Ready for Dev (Options Presented -> Ready for Dev)
