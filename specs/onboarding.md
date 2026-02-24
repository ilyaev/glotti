# User Attribution & Onboarding

Attribute sessions to specific users using a persistent client-side identifier.

## User Identification Logic

### Client-Side
1.  **Persistence**: The `user_id` is stored in the browser's `localStorage` under the key `debatepro_user_id`.
2.  **Generation**: If no ID is found on page load, a new UUID v4 is generated and persisted.
3.  **Transmission**: The ID is appended as a query parameter (`userId`) to the WebSocket connection string.

### Server-Side
1.  **Extraction**: The WebSocket handler parses the `userId` from the connection URL.
2.  **Storage**: The `userId` is included in the `SessionData` object saved to Firestore.

---

## Implementation Plan

### Client

#### [MODIFY] [App.tsx](file:///Users/ilyaev/projects/gemili/client/src/App.tsx)
- Add logic to check for/generate `user_id` in `localStorage`.
- Pass `user_id` to the `Session` component.

#### [MODIFY] [Session.tsx](file:///Users/ilyaev/projects/gemili/client/src/components/Session.tsx)
- Pass `user_id` down to the `useWebSocket` hook.

#### [MODIFY] [useWebSocket.ts](file:///Users/ilyaev/projects/gemili/client/src/hooks/useWebSocket.ts)
- Update the connection signature to accept `userId`.
- Append `&userId=...` to the WebSocket URL.

### Server

#### [MODIFY] [store.ts](file:///Users/ilyaev/projects/gemili/server/store.ts)
- Update `SessionData` interface to include `userId: string`.

#### [MODIFY] [main.ts](file:///Users/ilyaev/projects/gemili/server/main.ts)
- Extract `userId` from the WebSocket request query parameters.
- Pass `userId` to `handleConnection`.

#### [MODIFY] [ws-handler.ts](file:///Users/ilyaev/projects/gemili/server/ws-handler.ts)
- Update `handleConnection` to accept `userId`.
- Include `userId` when saving the session to the store.

---

## Verification Plan

### Manual Verification
1.  **Client Generation**: Open the browser console and check `localStorage.getItem('debatepro_user_id')`. Verify it persists across refreshes.
2.  **Connection Link**: Verify the outgoing WebSocket request in the Network tab contains the `userId` parameter.
3.  **Backend Logs**: Check Cloud Run logs for the `userId` in the session start/save logs.
4.  **Firestore**: Verify that new documents in the `sessions` collection now contain a `userId` field.
