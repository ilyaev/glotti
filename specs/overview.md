# Glotti — Project Overview

## Vision

**Glotti** is a real-time AI sparring partner that coaches users through high-stakes verbal interactions — pitches, negotiations, debates, and difficult conversations. Unlike passive post-hoc feedback tools, Glotti **interrupts you mid-sentence** with challenges, corrections, and coaching cues, forcing you to adapt under pressure exactly as you would in a real encounter.

The core innovation is combining **Gemini Live API's bidirectional audio streaming** with **vision-based body language analysis** to create a coach that both *hears* and *sees* you, delivering feedback at the speed of conversation.

---

## Contest Category

**Live Agents** — Real-time Interaction (Audio/Vision)

### Mandatory Tech Compliance

| Requirement | Solution |
|---|---|
| Gemini model | Gemini 2.5 Flash (native audio via Live API) |
| Google GenAI SDK or ADK | Google Agent Development Kit (ADK) — TypeScript SDK |
| At least one Google Cloud service | Google Cloud Run (hosting), Firestore (session persistence) |
| Gemini Live API or ADK | Both — Gemini Live API for real-time audio/video streaming; ADK for agent orchestration |
| Hosted on Google Cloud | Cloud Run containerized deployment |

---

## Core Concept

The user enters a **coaching session** by selecting a scenario mode and clicking "Start". They speak into their microphone (and optionally enable their webcam) and the agent:

1. **Listens** to their speech in real-time via Gemini Live API.
2. **Watches** their body language via webcam video stream (optional).
3. **Interrupts** with coaching cues, counter-arguments, or corrections using the Live API's barge-in capability.
4. **Tracks metrics** (filler words, speaking pace, tone confidence) and displays them on a live dashboard.
5. **Delivers a post-session report** summarizing strengths, weaknesses, and actionable improvement areas.

---

## Scenario Modes (Variants)

Glotti ships with multiple coaching personas. Each persona has a unique system prompt, interruption strategy, and evaluation rubric.

### Mode 1: "PitchPerfect" — Startup Founder Coach
- **Persona:** A skeptical venture capitalist.
- **Behavior:** Listens to the user's startup pitch and interrupts with tough investor questions: "What's your CAC?", "How do you defend against Google entering this space?", "Your total addressable market number seems inflated."
- **Metrics tracked:** Filler words, speaking pace, time spent on problem vs. solution, conviction level.
- **Target audience:** Founders preparing for fundraising, demo days, or Y Combinator interviews.

### Mode 2: "EmpathyTrainer" — Difficult Conversations Coach
- **Persona:** An upset customer, a distressed employee, or an angry parent (configurable).
- **Behavior:** Adopts the emotional stance of the counterparty. Detects the user's tone — if they sound defensive, dismissive, or patronizing, the agent escalates: "You're not listening to me." If the user demonstrates empathy, the agent de-escalates.
- **Metrics tracked:** Empathy score (validated language patterns), defensive language ratio, resolution time.
- **Target audience:** Customer success reps, HR professionals, managers, therapists-in-training.

### Mode 3: "Veritalk" — Adversarial Debate Sparring
- **Persona:** An aggressive debate opponent.
- **Behavior:** The user states a thesis. The agent uses **Google Search grounding** to pull real-time counter-arguments and interrupts with fact-checks, rhetorical traps, and opposing viewpoints. Forces the user to think on their feet.
- **Metrics tracked:** Argument coherence, recovery time after interruption, logical fallacy count.
- **Target audience:** Debaters, politicians, media spokespersons, lawyers, podcast hosts.

---

## Key Differentiators

1. **Real-time interruption** — Not post-hoc. The agent challenges you *while* you speak, training genuine composure under pressure.
2. **Multimodal input** — Audio + video. The agent can see your posture slumping, your eyes darting, or your fidgeting, and call it out.
3. **Configurable personas** — Not a one-size-fits-all coach. Each mode has its own personality, escalation logic, and rubric.
4. **Live metrics dashboard** — Users see their filler word count, pace, and tone confidence updating in real-time on screen.
5. **Post-session report** — A structured breakdown of the session with timestamps, key moments, and improvement suggestions.

---

## Target User Personas

| Persona | Pain Point | How Glotti Helps |
|---|---|---|
| Startup Founder | Can't afford a pitch coach; doesn't have tough-minded friends to practice with | PitchPerfect mode provides unlimited, brutally honest practice rounds |
| Customer Success Rep | Struggles with angry customers; escalations damage CSAT scores | EmpathyTrainer mode simulates hostile interactions safely |
| Debate Team Member | Needs a sparring partner who can fact-check in real-time | Veritalk mode surfaces counter-evidence from the web instantly |
| Job Interviewee | Nervous, uses too many filler words, speaks too fast | Any mode tracks pace, filler words, and confidence metrics |

---

## Success Metrics (for Contest Judging)

- **Innovation:** First real-time speech coach that uses multimodal AI to *interrupt* rather than passively record.
- **Technical depth:** Full use of Gemini Live API (barge-in, VAD, streaming audio), ADK multi-agent orchestration, Google Search grounding, Cloud Run deployment.
- **User experience:** Clean web UI with live dashboard, simple "Start Session" flow, and downloadable post-session report.
- **Practical value:** Solves a real pain point across multiple verticals (sales, HR, education, politics).
