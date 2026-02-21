# Fix Quota Buffer and Rotation Strategy

## Goal Description
Fix the `soft_quota_threshold_percent` default value mismatch (currently 90% in `DEFAULT_CONFIG` vs 70% in schema) to enforce the expected 30% buffer. Add the missing environment variable override `OPENCODE_ANTIGRAVITY_SOFT_QUOTA_THRESHOLD_PERCENT` to allow runtime configuration. Verify that the "Strict Round-Robin" strategy correctly rotates accounts when they hit this threshold.

## User Review Required
> [!IMPORTANT]
> This change strictly enforces a 30% quota buffer by default (70% usage limit). Existing deployments expecting 90% usage (10% buffer) will now stop using accounts earlier. This is the intended behavior per user request.

## Proposed Changes

### `src/plugin/config/schema.ts`
#### [MODIFY] Isolate default value for consistency
- Update `DEFAULT_CONFIG.soft_quota_threshold_percent` from `90` to `70` to match schema default.

### `src/plugin/config/loader.ts`
#### [MODIFY] Add environment variable support
- Add `soft_quota_threshold_percent` to `applyEnvOverrides` function.
- Map `OPENCODE_ANTIGRAVITY_SOFT_QUOTA_THRESHOLD_PERCENT` to config.

### `src/plugin/accounts.ts`
#### [VERIFY] Round-Robin Logic
- Confirm `getNextForFamily` correctly filters out accounts over the threshold.
- No code change expected unless logic flaw found during verification.

## Verification Plan

### Automated Tests
- Create a new unit test in `src/plugin/config/loader.test.ts` (or similar) to verify env var override works.
- Update `src/plugin/accounts.test.ts` to assert 70% threshold behavior.
- Run `pnpm test` to ensure no regressions.

### Manual Verification
1.  Set `OPENCODE_ANTIGRAVITY_SOFT_QUOTA_THRESHOLD_PERCENT=50` via env var.
2.  Run `opencode auth status` (or similar debug command if available) to check effective config.
3.  Observe that accounts with >50% usage are marked as "Skipping" in debug logs.
