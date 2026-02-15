# Detailed Rate Limit Status in Auth Menu

> **Status**: 🔄 IN PROGRESS

Show which quota family (Claude, Gemini, or both) is rate-limited instead of a generic `[rate-limited]` badge.

## Problem

Currently, the auth menu shows `[rate-limited]` for any account with ANY rate-limited quota. This is misleading because:
- An account rate-limited for **Claude only** still has full Gemini quota
- Users can't tell which quota pool is exhausted at a glance

## Proposed Changes

### Auth Menu UI (`src/plugin/ui/auth-menu.ts`)

#### [MODIFY] [auth-menu.ts](file:///c:/Users/andyvand/Dev/personal/opencode-ag-auth/src/plugin/ui/auth-menu.ts)

1. Add `rateLimitedFamilies?: string[]` to `AccountInfo` interface
2. Update `getStatusBadge()` to render family-specific badges:
   - `[rate-limited: claude]` — only Claude exhausted
   - `[rate-limited: gemini]` — only Gemini exhausted  
   - `[rate-limited]` — both exhausted (fallback)

---

### Status Determination (`src/plugin.ts`)

#### [MODIFY] [plugin.ts](file:///c:/Users/andyvand/Dev/personal/opencode-ag-auth/src/plugin.ts)

Lines 3246-3280: Collect **which** quota keys are rate-limited instead of just checking `.some()`.

```diff
 const rateLimits = acc.rateLimitResetTimes;
 if (rateLimits) {
-  const isRateLimited = Object.values(rateLimits).some(
-    (resetTime) => typeof resetTime === "number" && resetTime > now,
-  );
-  if (isRateLimited) {
-    status = "rate-limited";
+  const limitedKeys = Object.entries(rateLimits)
+    .filter(([, resetTime]) => typeof resetTime === "number" && resetTime > now)
+    .map(([key]) => key);
+  if (limitedKeys.length > 0) {
+    status = "rate-limited";
+    // Map quota keys to user-friendly family names
+    rateLimitedFamilies = [...new Set(limitedKeys.map(k =>
+      k === "claude" ? "claude" : "gemini"
+    ))];
```

Pass `rateLimitedFamilies` into the returned `AccountInfo` object.

---

### Tests (`src/plugin/ui/auth-menu.test.ts`)

#### [MODIFY] [auth-menu.test.ts](file:///c:/Users/andyvand/Dev/personal/opencode-ag-auth/src/plugin/ui/auth-menu.test.ts)

Add tests for the new family-specific badge rendering:
- `[rate-limited: claude]` when only claude is limited
- `[rate-limited: gemini]` when only gemini is limited
- `[rate-limited]` when both are limited

## Verification Plan

### Automated Tests
```bash
pnpm test -- --run src/plugin/ui/auth-menu.test.ts
```

### Manual Verification
After building (`pnpm build`) and restarting OpenCode, run `opencode auth login` and verify that accounts show specific family badges like `[rate-limited: claude]` instead of generic `[rate-limited]`.
