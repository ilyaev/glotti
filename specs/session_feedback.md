# Functional Specification: Partner Feedback

## 1. Overview
The "Partner Feedback" feature allows users to receive immediate, spoken feedback from their AI sparring partner after a session concludes. Instead of just reading text metrics, the user can "Listen to Partners feedback" in a real-time, interactive audio session powered by Gemini Live.

## 2. User Experience
1. **Entry Point**: A visually premium **Partner Insight Card** is added to the Session Report page, typically after the overall score.
   - It features a contextual one-liner from the partner: *"Hear them out or discuss it with them live."*
   - A primary CTA button labeled **"Listen & Discuss"** triggers the audio session.
2. **Modal Interaction**:
   - Clicking the button opens a fullscreen or centered modal.
   - The modal features an "Agent Talking" visualization (using the existing `Waveform` component).
   - "Connecting..." state is shown while the Live session initializes.
3. **Audio Feedback**:
   - The AI partner starts speaking automatically once connected.
   - The partner uses the **same voice** (e.g., Puck, Charon) as during the training session.
   - The partner provides ~30 seconds of constructive feedback based on the session's performance.
4. **Interactivity**:
   - **Early Barge-in**: The microphone is activated from the very beginning, allowing the user to ask questions or interrupt the partner immediately.
   - The user can discuss the feedback live (barge-in enabled).
5. **Session Limit**:
   - The feedback interaction is limited to a maximum of **1 minute**.
   - A countdown timer shows the remaining time to the user.
   - The session automatically disconnects and the modal closes after the timeout.


## 3. Technical Implementation Plan

### 3.1 Backend Changes
- **Mode Definition**: Add a new mode `feedback` to `MODES` in `server/config.ts`.
- **System Prompt**: Create `server/agents/prompts/feedback.md`.
  - Instruction: "You are the AI partner from the session that just occurred. Provide brief (30s), constructive, and encouraging feedback in your specific persona. Reference the transcript provided. Allow the user to ask questions."
- **WebSocket Handler (`server/ws-handler.ts`)**:
  - Update `handleConnection` to support `mode=feedback`.
  - If `mode=feedback`, the client must also send an `originalSessionId`.
  - The backend retrieves the `originalSessionId` from the store (transcript, metrics, voiceName).
  - The system prompt for the Live session is augmented with the original session's data.
  - Set a hard 60s timeout for the socket connection in this mode.
  - Use the original `voiceName` for consistency.

### 3.2 Client Changes
- **Components**:
  - **`FeedbackModal.tsx`**: A new component managing the Live session lifecycle for feedback.
    - Integrated with `Waveform.tsx`.
    - Handles `useWebSocket` connection with `feedback` mode.
    - Manages audio capture/playback via `useAudio`.
  - **`ReportActions.tsx`**: Add the "Listen to Partners feedback" button and state to open the modal.
- **Hooks**:
  - Update `useWebSocket` to support passing extra params (like `originalSessionId`) if needed, or handle it via URL query params.

## 4. Verification Plan

### Automated Verification
- **Unit Test**: Mock the store to ensure `originalSessionId` retrieval works in the backend.
- **Integration Test**: Verify that the `/ws` endpoint accepts the `feedback` mode and initializes with the correct system prompt.

### Manual Verification
1. Complete a short session (e.g., PitchPerfect).
2. On the report page, verify the "Listen to Partners feedback" button is visible.
3. Click the button and check if the modal opens and connects.
4. Verify the AI speaks and mentions something from the actual session.
5. Interrupt the AI and ask a question.
6. Wait for 60 seconds and ensure the session ends automatically.
