# Implementation Plan - Fix Quota Badge Wiring (fix-182f)

The authentication menu fails to show granular rate limit status (e.g. `[active] [claude: limited]`) even when quota checks indicate exhaustion. This is because the menu status logic primarily relies on `rateLimitResetTimes` (populated only on 429 errors) and has historically ignored `cachedQuota` (populated by quota checks).

## Audit Findings
Inspection of `antigravity-accounts.json` revealed:
- **Disconnect:** Account 0 has `claude` quota exhausted in `cachedQuota` (future reset date), but `rateLimitResetTimes` keys are model-specific (e.g., `gemini-antigravity:gemini-3.1-pro-high`), causing the naive check `key === "claude"` to potentially miss or misinterpret data if not careful.
- **Key Structure:**
    - `rateLimitResetTimes`: uses keys like `claude`, `gemini-antigravity:gemini-3.1-pro`, `gemini-cli`.
    - `cachedQuota`: uses keys `claude`, `gemini-pro`, `gemini-flash`.
- **Status Logic:** The current logic (v1.5.5) does not read `cachedQuota` at all for status badges, leading to "Active" status despite 0% quota.

## User Review Required

> [!IMPORTANT]
> This fix changes how account status is calculated. Accounts with exhausted quotas in `cachedQuota` will now show as "limited" immediately, even if they haven't hit a 429 error recently.

## Proposed Changes

### `src/plugin.ts`

#### [MODIFY] `plugin.ts`
- **Refactor:** Extract status calculation logic into a helper `deriveAccountStatus` (or similar) to make it unit-testable.
- **Logic Update:**
    - Continue reading `rateLimitResetTimes` (RL) for 429-based limits.
    - **Add** reading of `cachedQuota` (CQ) as a fallback/supplement.
    - If `CQ.claude.remainingFraction <= 0`, mark `claude` family as limited.
    - If `CQ.gemini-pro` AND `CQ.gemini-flash` are exhausted, mark `gemini` family as limited.
    - Ensure correct keys are used (`gemini-pro`, `gemini-flash` from CQ).
- Ensure `rateLimitResetIn` and `rateLimitedFamilies` are populated correctly for the UI.

### `src/plugin/account-status.test.ts` (NEW)

#### [NEW] `src/plugin/account-status.test.ts`
- Create a new test file specifically to verify the status derivation logic.
- **Test Cases:**
    - **Case 1 (Real World Data):** Simulate Account 0 from the user's storage dump (RL set for Claude, CQ exhausted for Claude). Verify `rateLimitedFamilies` includes 'claude'.
    - **Case 2 (CQ Only):** RL empty, CQ exhausted. Verify `rateLimitedFamilies` includes limited families.
    - **Case 3 (Mixed):** RL has Gemini, CQ has Claude. Verify both are limited.
    - **Case 4 (Active):** usage > 0. Verify status is active and no rate limits.

## Verification Plan

### Automated Tests
Run the new test suite:
```bash
pnpm test src/plugin/account-status.test.ts
```

### Manual Verification
1.  **Pre-requisite:** Have accounts with known exhausted quotas (or mock the storage file).
2.  **Action:** Open Auth Menu.
3.  **Expectation:** Accounts with 0% quota show `[active] [claude: limited]` or similar, with countdowns.
4.  **Action:** Run "Check Quotas".
5.  **Expectation:** Status updates correctly and persists.

### Release
1.  Verify tests pass.
2.  Amend the previous release commit (v1.5.5) to include these fixes.
    ```bash
    git add .
    git commit --amend --no-edit
    git tag -f v1.5.5
    git push -f --tags
    # Then rebuild and publish
    pnpm clean
    pnpm build
    pnpm publish --access public --no-git-checks
    ```
