<!--
Template for ux/UX_<page>.md. Maintained by the `ux-explore` skill
(.claude/skills/ux-explore/SKILL.md) - don't hand-edit this structure
without updating both this template and that skill. Mirrors
jira/TEMPLATE.md's status-lifecycle pattern, adapted for UX decisions
instead of engineering requirements - see jira/JIRA_12.md for why this
exists as a parallel spec-driven flow rather than folding into jira/.
-->

# UX_category-list: Category list

**Status**: Ready for Dev <!-- Draft -> Options Presented -> Selected -> Ready for Dev -->
**Created**: 2026-09-11
**Last updated**: 2026-09-11 (round 2)
**Direction**: [ux/UX_DIRECTION.md](UX_DIRECTION.md) - "Calm Ledger", Ready for Dev

## Page
`category-list` (`finance-manager-ui/src/app/category-list/`) - the Categories tab.

## Options presented

Real data via `db-run`: 5 clean seed categories (SALARY, FOOD, LUNCH, DINNER, SNACKS) plus **209 accumulated BDD/UI-test categories** (`TEST_CAT_*`, `UI_CAT_*`) - 214 total for `user_id=1`. Real usage counts for the 5 clean ones: SALARY used by 33 transactions, the other 4 unused. The mockups show the 5 clean categories as the happy path (with real usage counts), but the 214-total reality is directly relevant: **this screen already has a search bar in the real component** (`ion-searchbar` with typeahead), so unlike `account-list`, no new scaling mechanism is needed here - Calm Ledger just restyles the existing search, it doesn't invent anything new.

The real component also has a distinctive interaction model worth grounding before presenting options: renaming/deleting a category is a **staged change** - `toggleDelete`/`renameCategory` mark a category `delete`/`new_title` locally (shown as "Will be deleted"/"Will be renamed" with an undo), and nothing is sent to the server until the user taps a batch "Save Changes" (or "Reset All" to discard). Both options below keep this staging model - it's a real, deliberate product behavior, not something either option should flatten into per-row immediate actions.

Artifact: [Category List Layout Options](https://claude.ai/code/artifact/f8360758-c048-4ddf-9362-ad096bf5da2b)

### Option A - Inline text-link actions
- **Layout**: matches the real component's structure most directly - each row shows "Rename" / "Delete" as plain muted/accent text links (not the real `ion-button[fill=outline]` pills), always visible. Staged rows show "Will be deleted" (strikethrough title, muted-clay "Undo") or "Will be renamed" (old &rarr; new title, accent "Undo").
- **States covered**: happy (5 real categories + usage counts), empty (two real sub-cases: "no categories match your search" vs "you don't have any categories yet" - mockup shows the search-miss case), error (new - the real fetch has no error branch today), loading (flat skeleton rows).

### Option B - Swipe-to-reveal actions
- **Layout**: rows show just the category name + usage count by default (quieter) - Rename/Delete appear on swipe (`ion-item-sliding`, native iOS/Android pattern), shown in the mockup as one row already swiped open to communicate the mechanism. Staged-change rows ("Will be deleted"/"Will be renamed") look identical to Option A - the swipe mechanism only changes the *default*, untouched row.
- **States covered**: same four states as Option A.

## Selected option
**Option A - Inline text-link actions**, confirmed by the user.

## Implementation detail

Grounded against the real `finance-manager-ui/src/app/category-list/category-list.component.{html,ts,scss}` (read before implementing):

1. **Usage count per row is a new addition, not a restyle**: the real template never shows how many transactions use a category. The mockup's "33 transactions" / "Not used yet" line is a genuine value-add using real data (`transaction_user_category` counts) - **check whether that count is already returned alongside the category list from the API before implementing**; if not, either add it to the existing categories fetch or drop this line entirely rather than adding a new per-category API call per row. Don't block the rest of the redesign on this - it's a nice-to-have, not the point of the exercise.
2. **Staged-change UI maps directly, just restyled**: real states are `category.delete` ("Will be deleted", a `status-container status-danger` with a `close-circle-outline` button + text) and `category.new_title && !category.delete` ("Will be renamed", `status-container status-primary`, shows old title with an `arrow-forward-outline` to the new one). Keep the exact same conditions and the same "tap to undo" behavior (`toggleDelete(category)` / `cancelRename(category)`) - restyle: strikethrough + muted-clay "Will be deleted"/"Undo" text for delete, accent-colored "&rarr;" + "Will be renamed"/"Undo" text for rename, no `ion-button` icon buttons, no colored `status-container` background.
3. **Rename is a native prompt today** (`renameCategory(category)` - check the `.ts` for whether it's an `AlertController` prompt or something else before touching it) - not shown in the HTML mockup since it's a system dialog, not a screen state. Leave that mechanism as-is; only the trigger (the "Rename" text link) and the resulting "Will be renamed" row change visually.
4. **Batch action bar** (`action-buttons-container`, shown only when `hasPendingChanges`): restyle the two `ion-button`s (Reset All outline, Save Changes solid) as plain text buttons in a thin `#F3F1EC`-tinted bar above the list - muted for Reset All, accent+bold for Save Changes - keeping the same `*ngIf="hasPendingChanges"` condition and click handlers.
5. **Search bar**: restyle the real `ion-searchbar` (with its existing typeahead/debounce/cancel-button behavior intact) to a plain underline text input with a thin-stroke search icon, matching the direction's filter-control convention elsewhere.
6. **Add Category modal**: keep its structure (back arrow, title, disabled-until-valid "Done", name input, the two validation messages for empty/>50-char) - restyle typography/colors to the direction's tokens only, no structural change.
7. **FAB**: restyle to `--ion-color-primary` (accent), same decision as `account-list`'s FAB.
8. **Two distinct empty states**: `searchTerm` set but no matches ("No categories match your search criteria") vs. genuinely zero categories (`!searchTerm`, "You don't have any categories yet") - keep both, matching the mockup's search-miss illustration for the first.
9. **Error state is new**: `isLoading`/category-fetch has no error branch in the real component today (same gap as every other page) - add a `hasError` flag with a "Retry" action, same pattern as `account-list`/`transaction-list`.

Layout, by region: header (flat toolbar, `Source Serif 4` title, muted refresh icon, `IBM Plex Mono` count - same as every other page), list (`ion-list` without `[inset]`, hairline row dividers, no elevation), row (name `IBM Plex Sans` 14px/500 + usage-count meta 10.5px muted, per point 1, trailing "Rename"/"Delete" text links separated by a muted middle dot), loading (flat skeleton bars replacing the spinner+text row), tab bar (`UX_DIRECTION.md` tokens, recolor only).

## Changelog
- 2026-09-11: created, 2 options presented (Draft -> Options Presented)
- 2026-09-11: user confirmed Option A; filled in Selected option and Implementation detail (grounded against the real `category-list.component.*` - flagged the staged-change model to preserve exactly, the native rename prompt, a new usage-count addition that needs an API check, and a new error state); marked Ready for Dev (Options Presented -> Ready for Dev)
