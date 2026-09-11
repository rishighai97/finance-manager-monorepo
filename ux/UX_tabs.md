<!--
Template for ux/UX_<page>.md. Maintained by the `ux-explore` skill
(.claude/skills/ux-explore/SKILL.md) - don't hand-edit this structure
without updating both this template and that skill. Mirrors
jira/TEMPLATE.md's status-lifecycle pattern, adapted for UX decisions
instead of engineering requirements - see jira/JIRA_12.md for why this
exists as a parallel spec-driven flow rather than folding into jira/.
-->

# UX_tabs: Tabs (bottom nav + side menu)

**Status**: Ready for Dev <!-- Draft -> Options Presented -> Selected -> Ready for Dev -->
**Created**: 2026-09-11
**Last updated**: 2026-09-11 (round 2)
**Direction**: [ux/UX_DIRECTION.md](UX_DIRECTION.md) - "Calm Ledger", Ready for Dev

## Page
`tabs` (`finance-manager-ui/src/app/tabs/`) - navigation chrome only: an `ion-tab-bar` (5 items - Accounts, Upload statements, Transactions, Categories, Logout) plus a separate `ion-menu` side drawer duplicating the exact same 5 items, with a "Welcome, {{username}}" greeting.

## Options presented

Real finding worth acting on, not just restyling: **the side menu has no visible trigger anywhere in the app** - no `ion-menu-button` and no `menuController`/`toggleMenu` call exist in any header across the whole `finance-manager-ui` codebase. It's only reachable (if at all) via Ionic's default edge-swipe gesture, which nothing in the UI hints at. It duplicates the tab bar's 5 items exactly, plus a username greeting. This is a real "does this navigation surface earn its place" question, not a cosmetic one.

`UX_DIRECTION.md`'s navigation-pattern tokens (`--ion-tab-bar-background`, `--ion-tab-bar-color`, `--ion-tab-bar-color-selected`) already cover the tab bar's *colors* regardless of which option is picked here - both options restyle the tab bar identically. The actual choice is about the side menu's fate.

Artifact: [Tabs Layout Options](https://claude.ai/code/artifact/4b475fad-5d0a-4819-b617-da6e9b0182ff)

### Option A - Keep both, restyle and make the menu discoverable
- **Layout**: tab bar restyled per `UX_DIRECTION.md` (thin line icons, accent active state, flat background). Side menu restyled to match (hairline dividers instead of `ion-item` chrome, `Source Serif 4` "Welcome, Rishi Ghai" greeting, thin-stroke icons) - **and** a real entry point added (a menu button somewhere a user would find it), since an undiscoverable drawer is worse than no drawer.
- **What's shown**: the tab bar itself, and the side menu open.

### Option B - Remove the side menu
- **Layout**: tab bar only, restyled the same way. The side menu (`ion-menu`, its template, and any related routing/component code) is deleted rather than kept as unreachable dead weight - one navigation surface, not two that say the same thing.
- **What's shown**: the tab bar itself; nothing else to show for the removed menu.

## Selected option
**Option B - Remove the side menu**, confirmed by the user.

## Implementation detail

Grounded against the real `finance-manager-ui/src/app/tabs/tabs.page.{html,ts,scss}`:

1. **Delete the entire `<ion-menu contentId="main-content">...</ion-menu>` block** from `tabs.page.html` - the greeting, the 5 `ion-menu-toggle`/`ion-item` nav rows, all of it. Keep the `<div class="ion-page" id="main-content">` and everything inside it (the real tab bar) exactly where it is - just drop the `contentId` linkage since there's no menu to link to.
2. **Clean up now-unused imports** in `tabs.page.ts`: `IonMenu`, `IonHeader`, `IonToolbar`, `IonTitle`, `IonContent`, `IonList`, `IonItem`, `IonMenuToggle` were only used by the removed menu - remove them from the `imports` array and the import statement. Keep `IonTabs`, `IonTabBar`, `IonTabButton`, `IonIcon`, `IonLabel` (the tab bar). The `personOutline` icon (`addIcons`) was only used by the menu's user icon - remove it; keep the other four (`walletOutline`, `cloudUploadOutline`, `cashOutline`, `folderOutline`, `exitOutline` - all used by the tab bar too).
3. **`username` getter and `logout()` method**: `username` was only read by the removed greeting - safe to remove along with its `UserService` dependency if nothing else in this component uses it (check first - don't remove `UserService`/`Router` injection if `logout()` turns out to still be called from somewhere real). `logout()` itself is likely already dead code independent of this change (the active nav routes to `/tabs/logout`, a separate `LogoutComponent`, not this method - the only caller was a button commented out in the HTML) - flag it for removal too, but verify via a repo-wide reference check before deleting rather than assuming from this file alone.
4. **Tab bar restyle** (the only thing both options shared, now the only thing left): apply `UX_DIRECTION.md`'s navigation-pattern tokens - `--ion-tab-bar-background: var(--ion-background-color)` (flat), thin 1.3px-stroke line icons replacing Ionicons' filled defaults where needed, `--ion-tab-bar-color: #B3AFA4` (inactive) / `--ion-tab-bar-color-selected: #B0603F` (active), active label semibold. Icons/labels/routes/hrefs themselves are unchanged - this is a recolor plus icon-weight change, not a restructure.

## Changelog
- 2026-09-11: created, 2 options presented (Draft -> Options Presented)
- 2026-09-11: user confirmed Option B; filled in Selected option and Implementation detail (grounded against the real `tabs.page.*` - full removal list for the menu block, its now-unused imports/icons, and a flagged-but-verify-first candidate for dead `logout()` code); marked Ready for Dev (Options Presented -> Ready for Dev)
