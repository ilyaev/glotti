# Glotti — Social Sharing Feature Specification

## 1. Goal & Vision
The goal of the Social Sharing feature is to transform Glotti from a private coaching tool into a **viral growth engine**. By allowing users to share their achievements, "roasts," and progress, we tap into social proof and professional networking hooks.

**The Hook:** "I just survived the AI VC." or "My empathy is officially certified level 9."

---

## 2. Platforms & Scenarios

### 2.1 LinkedIn (The "Professional Growth" Hook)
*   **Target:** Professionals, job seekers, sales reps, founders.
*   **Focus:** Skill certification and continuous improvement.
*   **Scenario:** A user finishes a difficult `EmpathyTrainer` session and shares their "De-escalation" score to show their emotional intelligence skills.
*   **Template:**
    > "Just sharpened my conflict resolution skills with **Glotti**. 🧘 Scored a 9/10 on De-escalation today. The AI coach is brutally honest—exactly what I need to prepare for real management challenges.
    >
    > Check out my full report: [Link]"

### 2.2 Twitter/X (The "Roast & Survival" Hook)
*   **Target:** Tech-savvy users, AI enthusiasts, entrepreneurs.
*   **Focus:** Humor, challenge, and brevity.
*   **Scenario:** A user gets a low score on `Veritalk` but finds a funny logical fallacy they made.
*   **Template:**
    > "Glotti's debate bot just called out my 'Slippery Slope' fallacy in 0.5 seconds. 💀 10/10 would get roasted again.
    >
    > My battle report: [Link] #AI #Glotti"

### 2.3 Instagram/Threads (The "Visual Success" Hook)
*   **Target:** General audience, students.
*   **Focus:** Aesthetics and high scores.
*   **Scenario:** Sharing a beautiful "Performance Card" image showing the circular score gauge.
*   **Accompanying Text:** "9.0 Overall 🚀 Keeping it cool under pressure with @GlottiApp."

### 2.4 TikTok/Reels (The "Audio Roast" Hook)
*   **Target:** Gen Z, creators, broad social audience.
*   **Focus:** Entertainment, live reactions, AI personality.
*   **Scenario:** A user shares a screen recording of the **Partner Insight Card**'s interactive audio feedback, where the AI brutally (or hilariously) critiques their session.
*   **Accompanying Text:** "My AI coach is ruthless. Listen to it tear apart my startup pitch... 😭 Need to practice again. [Link to try Glotti]"

---

## 3. Key Features

### 3.1 Dynamic "Performance Cards" (Visual Assets)
A beautiful, auto-generated image optimized for sharing.
*   **Content:**
    *   Glotti Branding.
    *   Scenario Name (e.g., PitchPerfect).
    *   Overall Score Gauge (The circular SVG).
    *   Top 2 "Hero Metrics" (e.g., WPM, Filler Words).
    *   A "Punchy Quote" from the AI feedback.
*   **Tech:** Generated via `html-to-image` on the client.

### 3.2 Open Graph (OG) Excellence
When a report link is pasted into Slack, Discord, or LinkedIn, it should expand into a rich preview.
*   **Title:** Glotti Report: [Scenario] - [Score]/10
*   **Description:** "I just completed an AI-powered coaching session. See how I performed!"
*   **Image:** Server-side rendered PNG via Satori + Resvg from the `PerformanceCard` React component.

**Implementation (completed):**
*   OG HTML page served at `/api/sessions/shared/og/:id/:key` with all meta tags (Open Graph + Twitter Card).
*   OG image dynamically rendered at `/api/sessions/shared/og-image/:id/:key` — uses `server/services/og-renderer.ts`.
*   Server-side LRU cache (100 entries) avoids re-rendering the same image on repeated scraper hits.
*   All interpolated values in the HTML template are HTML-escaped (`server/services/og-html.ts`).
*   Auth via share key middleware (`server/middleware/session-auth.ts`) — same key scheme as public report links.
*   Mode-specific background images: pitch, empathy, impromptu, veritalk (loaded as base64 data URIs at startup).

### 3.3 Enhanced Share Modal (Refactored)
The `ShareModal.tsx` has been refactored from a monolithic ~230 LOC component into a slim orchestrator (~80 LOC) backed by focused sub-components and custom hooks:

**Hooks:**
*   `useShareUrls` — Manages share key generation, API origin detection, and memoized URL construction (share gateway URL, server image URL).
*   `useClipboard` — Reusable clipboard copy with automatic "copied" feedback state (used by 3 sub-components).

**Sub-components** (`client/src/components/share/`):
*   `ShareLinkSection` — Transcript toggle, share link display, and copy button.
*   `ShareCardPreview` — OG image preview, native share, download card, and X/Twitter share button.
*   `SocialPostPreview` — Reusable platform post preview (LinkedIn/Facebook) with copy-and-share functionality.
*   `XIcon` — Standalone X (Twitter) SVG icon.

**Features:**
1.  **Native Sharing API:** `navigator.share()` on supported devices.
2.  **Platform Quick-Links:** Buttons for LinkedIn, Twitter/X, and Facebook with pre-filled text.
3.  **Download Image:** Button to save the server-rendered Performance Card PNG.
4.  **Transcript Toggle:** Controls whether the shared link includes the full conversation transcript.

---

## 4. Implementation Plan

### Phase 1: Public/Shared Report Routes
*   Ensure that `/sessions/:id/:key` is accessible without authentication.
*   Hide "Sensitive" data (like full user profile) from public views.
*   Add a "Start your own session" CTA button for non-users.

### Phase 2: SEO & Meta Tags (Backend) ✅
*   Server-side OG routes implemented in `server/api/sessions.ts`.
*   OG HTML template built by `server/services/og-html.ts` with proper HTML escaping.
*   OG image rendered server-side by `server/services/og-renderer.ts` (Satori → Resvg → PNG).
*   Share key validation handled by `server/middleware/session-auth.ts`.
*   LRU cache (100 entries) prevents redundant renders on repeated scraper requests.

### Phase 3: Dynamic Card Generation
*   Create a hidden `<PerformanceCard />` component in React.
*   Use `html-to-image` on the client side to convert the component into a PNG blob.
*   Allow users to "Download Card" or "Share Card", and optionally upload to a public bucket (like GCS) for OG `image` usage.

### Phase 4: UI Enhancements ✅
*   ✅ `ShareModal.tsx` refactored into slim orchestrator with extracted hooks (`useShareUrls`, `useClipboard`) and sub-components (`ShareLinkSection`, `ShareCardPreview`, `SocialPostPreview`, `XIcon`).
*   `ReportActions` to highlight the "Share" success if the user hits a personal best. (pending)

---

## 5. Creative "Growth Hacks"
*   **"The Rivalry Challenge":** When sharing a `Veritalk` link, the text says "I scored a 7/10. Think you can beat me in a debate? [Try Glotti]"
*   **"The AI Certificate":** Generate a "Certificate of Completion" for 10 consecutive sessions with >8/10 score.
*   **"Roast of the Day":** A feature where users can opt-in to have their funniest AI-critiques featured on a community gallery.
*   **"Interactive Spectator Mode":** When a user clicks a shared link, allow non-users to click "Listen & Discuss" on the shared report to hear the AI's feedback on the *original* user's session, drawing them into the interactive experience immediately.

---

## 6. Social Sharing & Performance Card Generation Logic
To enhance organic growth via social triggers, users can share their session evaluation on social media (LinkedIn, Twitter, Facebook) and generate visually appealing performance cards.

### Image Generation Pipeline
1. **Reporting Data Source**: The `PerformanceCard.tsx` component is dynamically fed the complete `SessionReport` object from the current session (which includes the `overall_score`, individual `metrics`, `improvement_tips`, and the `voiceName` of the AI partner).
2. **Design Matching**: The visual design of the card mirrors the actual Glotti web app (using the light theme colors like `#fdfbf7`, identical typography, and the SVG score gauge). Interactive elements (buttons, nav bars) are omitted in favor of large, readable text suitable for an image feed.
3. **Capture Process**: The `ShareModal` uses the `html-to-image` library to render the hidden DOM structure of `PerformanceCard` into a high-resolution 2x pixel ratio PNG data URL client-side.
4. **Workarounds**: To ensure compatibility with certain browsers (like iOS Safari), the `toPng` action runs twice with a short delay (`skipFonts: true`), which acts to prime the canvas and avoids capturing blank white images.
5. **Download**: Clicking the "Download" button safely saves `glotti-[mode]-score.png` directly to the user's local device so they can natively attach the image to their social post.
