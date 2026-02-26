# SessionsList.tsx Refactoring Plan

## Analysis

### Current State
- **LOC:** ~160
- **Responsibilities:** Data fetching, state management, UI rendering, date/time formatting, mode configuration.
- **Location:** `client/src/components/SessionsList.tsx`

### Violations Found

| # | Issue | Category |
|---|-------|----------|
| 1 | Mixes data fetching (`fetch` in `useEffect`) with UI rendering. | Responsibility |
| 2 | Duplicates `MODE_LABELS`, `MODE_COLORS`, and `MODE_ICONS` which should be centralized. | Duplication |
| 3 | Local date/time formatting utilities (`formatDate`, `formatTime`, `formatDuration`) that should be shared. | Deduplication |
| 4 | The session card UI is inlined within the map function, making the main component bloated. | Splitting |

### Refactoring Steps

#### Step 1: Extract Mode Config (`client/src/config.ts`)
- Move `MODE_LABELS`, `MODE_COLORS`, and `MODE_ICONS` to `config.ts` (if not already there) and export them.
- Update `SessionsList.tsx` to import these from `config.ts`.

#### Step 2: Extract Date Utilities (`client/src/utils/dates.ts`)
- Move `formatDate`, `formatTime`, and `formatDuration` to a shared utility file `client/src/utils/dates.ts`.
- Update `SessionsList.tsx` to import these utilities.

#### Step 3: Extract Data Fetching Hook (`client/src/hooks/useSessionsList.ts`)
- Create a custom hook `useSessionsList(userId: string)` to handle the `fetch` logic, `loading`, `error`, and `sessions` state.
- This separates the data layer from the presentation layer.

#### Step 4: Extract Sub-Component (`client/src/components/session/SessionCard.tsx`)
- Extract the individual session card rendering logic into a `SessionCard` component.
- Pass the `SessionSummary` object and the `onClick` handler as props.

#### Step 5: Slim SessionsList.tsx Orchestrator
- Update `SessionsList.tsx` to use the new hook and sub-component.
- The component should only handle the layout, header, and empty/error/loading states.

#### Step 6: Verify
- Run `npx tsc --noEmit` to ensure no type errors.
- Verify the UI still renders correctly.

### [2026-02-26] Completion Status
- [x] Extracted mode config to `client/src/utils/modeConfig.tsx`
- [x] Extracted date utilities to `client/src/utils/dates.ts`
- [x] Extracted data fetching to `client/src/hooks/useSessionsList.ts`
- [x] Extracted sub-component to `client/src/components/SessionCard.tsx`
- [x] Slimmed down `SessionsList.tsx`
- [x] Verified build with `tsc --noEmit`
