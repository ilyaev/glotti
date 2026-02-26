# ShareModal Refactoring Plan

## Analysis

### Responsibility Check
The `ShareModal.tsx` component (~230 LOC) handles **8 distinct responsibilities**:

1. **Share key generation** — dynamic import + async crypto derivation
2. **URL construction** — 4 different URL patterns (share URL, API origin, server image URL, share gateway URL)
3. **Clipboard operations** — 3 separate copy handlers with copy-state tracking (general, Facebook, LinkedIn)
4. **Native share API** — `navigator.share()` integration
5. **Image download** — fetch blob + create download link
6. **Social sharing** — Twitter, LinkedIn, Facebook window openers
7. **State management** — 6 `useState` hooks for transient UI state
8. **UI rendering** — modal backdrop, toggle, link input, image preview, social post previews

This is close to the "god object" threshold. The component should be decomposed.

### Performance Check
- Multiple inline arrow functions recreated every render (social share onClick handlers)
- URL construction recomputed every render (could be memoized)
- No issues with the dynamic import pattern (runs on dependency change only)

### Security Check
- URLs properly encoded with `encodeURIComponent` ✅
- No XSS vectors detected ✅
- API origin construction has defensive fallback logic ✅

### Type Safety
- No `any` types ✅
- Props interface is clean ✅
- `XIcon` inline SVG component is fine but could live separately

## Refactoring Plan

### Step 1: Extract `useShareUrls` custom hook
Extract all URL construction logic (API origin, server image URL, share gateway URL, base URL) into `client/src/hooks/useShareUrls.ts`. This hook will:
- Accept `sessionId`, `userId`, `includeTranscript`
- Manage `sessionKey` state internally + the `useEffect` for key generation
- Return `{ sessionKey, shareGatewayUrl, serverImageUrl }`
- Memoize computed URLs with `useMemo`

### Step 2: Extract `useClipboard` custom hook
Extract clipboard copy logic into `client/src/hooks/useClipboard.ts`:
- Simple reusable hook: `useClipboard()` returns `{ copy(text), copied }`
- Used 3 times (general link, Facebook text, LinkedIn text)

### Step 3: Split into sub-components
Create `client/src/components/share/` directory:

- **`ShareLinkSection.tsx`** — transcript toggle + subtitle + link input + copy button
- **`ShareCardPreview.tsx`** — OG image preview + social icon bar (native share, download, X/Twitter)
- **`SocialPostPreview.tsx`** — Reusable component for LinkedIn/Facebook post preview boxes
- **`XIcon.tsx`** — standalone X (Twitter) icon component

### Step 4: Slim orchestrator
`ShareModal.tsx` becomes a thin orchestrator (~60-80 LOC):
- Calls `useShareUrls` and `useClipboard`
- Renders sub-components with props
- Handles backdrop click + close

### File Structure After Refactoring
```
client/src/
  hooks/
    useShareUrls.ts      (NEW — URL construction + key generation)
    useClipboard.ts      (NEW — reusable clipboard copy with feedback)
  components/
    ShareModal.tsx        (REFACTORED — slim orchestrator)
    share/
      ShareLinkSection.tsx    (NEW)
      ShareCardPreview.tsx    (NEW)
      SocialPostPreview.tsx   (NEW)
      XIcon.tsx               (NEW)
```

### Execution Order
1. ✅ Backup `ShareModal.tsx` → `ShareModal-legacy.tsx`
2. ✅ Create `useClipboard.ts` hook (zero risk, standalone)
3. ✅ Create `useShareUrls.ts` hook (extracts URL logic)
4. ✅ Create `XIcon.tsx` (trivial extraction)
5. ✅ Create `SocialPostPreview.tsx` (reusable sub-component)
6. ✅ Create `ShareCardPreview.tsx` (sub-component)
7. ✅ Create `ShareLinkSection.tsx` (sub-component)
8. ✅ Rewrite `ShareModal.tsx` as slim orchestrator
9. ✅ Verify `npx tsc --noEmit` — 0 new errors (2 pre-existing in unrelated files)

## Results Summary

| Metric | Before | After |
|--------|--------|-------|
| ShareModal.tsx LOC | ~230 | ~80 |
| State variables in ShareModal | 6 | 1 |
| Responsibilities in ShareModal | 8 | 2 (orchestration + layout) |
| Reusable hooks created | 0 | 2 (`useClipboard`, `useShareUrls`) |
| Sub-components | 0 | 4 (`ShareLinkSection`, `ShareCardPreview`, `SocialPostPreview`, `XIcon`) |
| Duplicate clipboard logic | 3 handlers | 1 reusable hook |
