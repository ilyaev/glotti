# Glotti — Contest Pitch

---

## One-Liner

**Glotti** is a real-time AI sparring partner that doesn't wait for you to finish — it interrupts, challenges, and coaches you mid-sentence, training you to perform under pressure.

---

## The Problem

High-stakes speaking is a skill trained through repetition and live feedback — but practice partners are scarce, expensive, and inconsistent.

- **Founders** rehearse pitches alone or with friends who pull punches. They discover their weaknesses live, in front of real investors.
- **Customer success reps** learn to handle angry customers by failing with real customers, costing companies revenue and CSAT scores.
- **Debaters and public speakers** can't find adversaries who fact-check in real-time, so they develop blind spots.

Current tools — recording + replaying, speeching to a mirror, or post-hoc AI grading — all share the same fatal flaw: **the feedback comes after the moment has passed.** By then, the neural pathway is already wired wrong.

---

## The Solution

Glotti creates a **real-time feedback loop** that trains composure, clarity, and persuasion in the moment.

The user selects a scenario — investor pitch, angry customer, adversarial debate — and starts talking. Glotti:

1. **Listens** via Gemini Live API's bidirectional audio streaming with sub-second latency.
2. **Interrupts** naturally using barge-in capability — challenging weak arguments, calling out filler words, or escalating emotional tension to test the user's composure.
3. **Sees** via optional webcam input — detecting body language signals like fidgeting, poor eye contact, or slouching.
4. **Measures** in real-time — filler word counts, speaking pace, tone confidence, and argument coherence displayed on a live dashboard.
5. **Reports** after the session — a structured evaluation with timestamped highlights, category scores, and actionable improvement tips.

---

## Why This Wins

### Technical Innovation
Glotti is built on **Gemini Live API's barge-in interruption** — the core capability that makes this impossible with any other AI provider. The agent doesn't politely wait — it *talks over you* when it needs to, and *listens* when you talk over it. This is the defining feature of the Live Agents category.

### Mandatory Tech — All Checked

| Requirement | Implementation |
|---|---|
| ✅ Gemini model | Gemini 2.5 Flash (native audio dialog) |
| ✅ Google GenAI SDK or ADK | Agent Development Kit — multi-agent TypeScript orchestration |
| ✅ Google Cloud service | Cloud Run (hosting), Firestore (sessions), Secret Manager |
| ✅ Gemini Live API | Core of the product — bidirectional audio/video streaming |
| ✅ Hosted on Google Cloud | Containerized on Cloud Run |
| ✅ Beyond text-in/text-out | Real-time audio + video input, audio + JSON dashboard output |

### Multimodal — Not Just a Chatbot
- **Input:** Streaming audio (speech) + streaming video (body language) — truly multimodal.
- **Output:** Streaming audio (voice coaching) + structured JSON (live metrics dashboard) — not just text.
- **Interaction model:** Interruptible, real-time, bidirectional — not request-response.

### Practical Impact
This solves a real, underserved need across multiple $B+ markets:
- **Sales enablement** ($7B market) — reps train on cold calls and objection handling.
- **Executive coaching** ($15B market) — leaders practice high-stakes meetings.
- **Education** ($400B market) — students prepare for oral exams, interviews, and presentations.

---

## Demo Script (2 minutes)

> **[0:00 - 0:15]** "Hi, I'm presenting Glotti — the AI coach that doesn't let you finish a bad sentence."

> **[0:15 - 0:30]** *Show the mode selection screen.* "I'll select PitchPerfect mode. This is the skeptical VC."

> **[0:30 - 1:30]** *Start a live pitch.* The user says: "So, um, we're building a platform that, like, helps people—" **The agent interrupts:** "You've said 'um' twice and 'like' once in one sentence. Start again — what do you build?" *The user recovers.* The dashboard updates: filler count ticks up, pace gauge moves.

> **[1:30 - 1:50]** *Show the dashboard updating in real-time.* "Notice the live metrics — filler words, pace, tone. This is happening as I speak."

> **[1:50 - 2:00]** *End session, show the report.* "And here's my post-session report with scores, key moments, and improvement tips. All powered by Gemini."

---

## Architecture (30-second version)

```
Browser (mic + webcam)
    ↕ WebSocket
Cloud Run (Node.js + Express + ADK Agents)
    ↕ WebSocket
Gemini Live API (2.5 Flash native audio)
    + Google Search (for Veritalk fact-checking)
    + Firestore (session persistence)
```

Two ADK agents run in parallel:
1. **Coaching Agent** — holds the persona, generates voice interruptions.
2. **Analytics Agent** — silently monitors speech patterns, emits metrics.

---

## Team & Timeline

- **Solo developer** building on ADK + Gemini Live API.
- **12-15 hours** estimated build time.
- **Stack:** TypeScript/Node.js (Express + ws), React + Vite, Docker, Cloud Run.
- **Development:** Fully local with hot reload; Cloud Run for production only.
- **All code open-source** on GitHub.

---

## The Takeaway

Glotti isn't another speech review tool. It's the first AI that **fights back in real-time** — turning every practice session into a high-pressure simulation. Built entirely on Google's AI stack, it demonstrates the full power of Gemini Live API: bidirectional audio, interruptible conversation, multimodal vision, and tool-augmented reasoning, all orchestrated by ADK and hosted on Cloud Run.

**It's not about being perfect. It's about being ready.**
