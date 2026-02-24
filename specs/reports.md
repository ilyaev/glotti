# Session Reports — Scenario-Specific Design Spec

## 1. Current State Analysis

### How Reports Are Generated Today

Session reports are generated in `server/report.ts` via a single `buildReportPrompt()` function. This function receives the `mode` string but **does not use it to change anything about the report structure or evaluation criteria**. Every mode — PitchPerfect, EmpathyTrainer, Veritalk, and Impromptu — receives an identical prompt that asks the AI to evaluate the user across four generic categories:

| Category | What it measures |
|---|---|
| `clarity` | General speech clarity |
| `confidence` | General confidence level |
| `persuasiveness` | General persuasiveness |
| `composure` | Composure under pressure |

The metrics section is equally generic: filler word count, WPM, talk ratio, clarity score, and dominant tone. The `key_moments` and `improvement_tips` are also unconstrained, so the AI must invent what's meaningful without scenario-specific guidance.

### The Problem

Each scenario trains a **fundamentally different skill**, and a generic report fails to reflect that:

- **PitchPerfect** is about investor-grade clarity: problem → solution → market → traction → ask.
  A persuasiveness score is partially relevant, but the report misses *investor-specific* criteria like market sizing quality, handling tough questions, and pitch structure.

- **EmpathyTrainer** is about *emotional intelligence* in difficult conversations — de-escalation, validation, listening. Scoring "persuasiveness" and "composure" is category confusion. The report should evaluate empathy techniques, defensive language ratio, and whether the situation actually de-escalated.

- **Veritalk** is adversarial debate — argument logic, fallacy detection, evidence quality, recovery after interruption. Scoring "clarity" and "confidence" misses the point. The report should measure argument strength, logical consistency, and counter-argument handling.

- **Impromptu** is about spontaneous structure: can the user open → develop → close in 2 minutes on a surprise topic? The existing categories don't capture structure, topic adherence, or the key "best moment" framing that the persona itself requests.

### What Each Persona's Prompt Already Expects (But Isn't Used)

Each persona file lists what a post-session evaluation *should* cover, but this is all ignored at the report generation stage:

| Mode | Persona's stated evaluation criteria |
|---|---|
| `pitch_perfect` | Clarity of problem statement; strength of solution; market opportunity; confidence & delivery; top 3 improvements |
| `empathy_trainer` | Empathy score (1–10); de-escalation effectiveness; specific alternative phrases |
| `veritalk` | Argument coherence rating; number of logical fallacies; best/worst moments with timestamps; suggested counter-arguments missed |
| `impromptu` | Clarity score; structure score (open/develop/close); confidence markers; filler word count; best moment (quoted); one challenge for next time |

This is valuable signal we are not using.

---

## 2. Proposed Design: Scenario-Specific Report Configs

The core change is to move report configuration — the prompt template and the expected JSON schema — *into the scenario config layer*, so each mode controls its own report format the same way it controls its system prompt.

### 2.1 Config Shape Extension

Extend `MODES` in `server/config.ts` from a simple path map to a richer object per scenario:

```typescript
// server/config.ts
export interface ReportCategory {
  label: string;       // e.g. "Empathy", "Argument Logic"
  description: string; // used in the AI prompt to define what to score
}

export interface ScenarioReportConfig {
  promptIntro: string;          // scenario-specific framing for the AI evaluator
  categories: Record<string, ReportCategory>; // replaces the hardcoded 4 categories
  extraFields?: string[];       // names of any additional top-level fields in the JSON
}

export interface ScenarioConfig {
  promptFile: string;
  report: ScenarioReportConfig;
}

export const MODES: Record<string, ScenarioConfig> = { ... };
```

### 2.2 Per-Scenario Report Definitions

#### PitchPerfect
- **Evaluator framing**: You are a senior VC evaluating a founder's pitch. Score the *investment thesis quality*, not general speaking skills.
- **Categories**:
  | Key | Label | Focus |
  |---|---|---|
  | `problem_clarity` | Problem Clarity | Did they make a clear, urgent case for the problem? |
  | `solution_strength` | Solution Strength | Was the solution compelling and differentiated? |
  | `market_articulation` | Market Opportunity | Did they articulate TAM/SAM/SOM convincingly? |
  | `handling_pressure` | Handling Tough Questions | How well did they respond to interruptions and challenging questions? |
  | `delivery` | Delivery & Conviction | Speaking pace, confidence, filler words, use of data |
- **Extra fields**: `pitch_structure_score` (1–10, did they hit: problem → solution → market → ask?), `recommended_next_step` (string: one concrete next action for their pitch)

#### EmpathyTrainer
- **Evaluator framing**: You are a communication psychologist evaluating how well the user handled a difficult emotional conversation.
- **Categories**:
  | Key | Label | Focus |
  |---|---|---|
  | `empathy` | Empathy | Did the user validate feelings, use "I hear you" language, avoid dismissal? |
  | `active_listening` | Active Listening | Did the user ask good questions and let the other person speak? |
  | `de_escalation` | De-escalation | Did the situation cool down? Did the user's language contribute? |
  | `language_quality` | Language Precision | Did they avoid toxic patterns: "calm down", "but", "it's not that bad"? |
- **Extra fields**: `escalation_moments` (array of timestamps where situation worsened), `best_empathy_phrases` (array: quotes of the user's most effective lines), `alternative_phrases` (array: specific replacements for weak moments)

#### Veritalk
- **Evaluator framing**: You are a debate coach and logician evaluating the quality and resilience of the user's arguments.
- **Categories**:
  | Key | Label | Focus |
  |---|---|---|
  | `argument_coherence` | Argument Coherence | Was the main thesis clear and consistently defended? |
  | `evidence_quality` | Evidence Quality | Did the user cite facts, statistics, or examples? |
  | `logical_soundness` | Logical Soundness | Absence of fallacies: straw man, ad hominem, false equivalence |
  | `interruption_recovery` | Interruption Recovery | How quickly and effectively did the user regain composure after being challenged? |
- **Extra fields**: `fallacies_detected` (array: `{name, timestamp, quote}`), `missed_counter_arguments` (array of arguments the user should have anticipated), `strongest_moment` (string with timestamp and quote), `weakest_moment` (string with timestamp and quote)

#### Impromptu
- **Evaluator framing**: You are an improv speaking coach evaluating how well the user handled an unexpected topic on the spot.
- **Categories**:
  | Key | Label | Focus |
  |---|---|---|
  | `topic_adherence` | Topic Adherence | Did they stay on the assigned topic? Did they drift or abandon it? |
  | `structure` | Speech Structure | Did the response have a clear opening, body, and close? |
  | `confidence` | Confidence & Presence | Did they sound assured? How did they handle silences and hesitations? |
  | `originality` | Originality | Did they bring a fresh angle, metaphors, or memorable examples? |
- **Extra fields**: `assigned_topic` (string: the topic they were given), `best_moment_quote` (string: the strongest 10–15 seconds transcribed), `next_challenge` (string: one specific skill to focus on next session), `silence_gaps_seconds` (number: total silence / hesitation time)

---

## 3. Implementation Plan

### Phase 1: Extend Config (`server/config.ts`)

1. Define `ReportCategory`, `ScenarioReportConfig`, and `ScenarioConfig` interfaces.
2. Replace the `MODES` string map with a `MODES` object map of type `Record<string, ScenarioConfig>`, keeping `promptFile` pointing to the existing `.md` files.
3. Populate each mode's `report` config per the definitions in section 2.2.
4. Update `loadPrompt(mode)` to read from `MODES[mode].promptFile`.
5. Export a helper `getReportConfig(mode)` → `ScenarioReportConfig`.

### Phase 2: Refactor Report Generation (`server/report.ts`)

1. Replace the hardcoded `buildReportPrompt()` with a `buildReportPrompt(mode, reportConfig, transcript, metrics, durationSeconds)` that:
   - Uses `reportConfig.promptIntro` as the evaluator framing.
   - Dynamically builds the `categories` JSON schema section from `reportConfig.categories`.
   - Adds any `extraFields` to the schema description.
2. Update the `SessionReport` interface in `server/store.ts`:
   - `categories` is already `Record<string, { score: number; feedback: string }>` — this works as-is with dynamic keys.
   - Add an `extra?: Record<string, unknown>` field for the scenario-specific extra fields (fallacies, phrases, etc.).
3. Update the fallback error report in `generateReport()` to still produce a valid (even if generic) `SessionReport` shape.

### Phase 3: Update Type Surface (`server/store.ts`)

1. Add `extra?: Record<string, unknown>` to `SessionReport` to hold the scenario-specific fields.
2. No change needed to `SessionData` — it already wraps `SessionReport` optionally.

### Phase 4: Frontend Awareness (`client/`)

1. The report page already renders `categories` dynamically (it iterates the keys). Scenario-specific categories will render without changes if the UI is already generic.
2. Add a `ReportExtras` component that renders the `extra` field in a human-readable way — initially can be a simple key-value display, with dedicated sub-components per scenario added later.
3. The report page title / intro copy should reflect the mode (e.g., "Your Pitch Evaluation" instead of "Session Report").

---

## 4. JSON Schema Examples (Per-Scenario Outputs)

### PitchPerfect example output
```json
{
  "overall_score": 7,
  "categories": {
    "problem_clarity":     { "score": 8, "feedback": "..." },
    "solution_strength":   { "score": 7, "feedback": "..." },
    "market_articulation": { "score": 5, "feedback": "..." },
    "handling_pressure":   { "score": 6, "feedback": "..." },
    "delivery":            { "score": 8, "feedback": "..." }
  },
  "metrics": { ... },
  "key_moments": [ ... ],
  "improvement_tips": [ ... ],
  "extra": {
    "pitch_structure_score": 6,
    "recommended_next_step": "Refine your TAM calculation with bottom-up data."
  }
}
```

### EmpathyTrainer example output
```json
{
  "overall_score": 6,
  "categories": {
    "empathy":          { "score": 7, "feedback": "..." },
    "active_listening": { "score": 5, "feedback": "..." },
    "de_escalation":    { "score": 6, "feedback": "..." },
    "language_quality": { "score": 5, "feedback": "..." }
  },
  "metrics": { ... },
  "key_moments": [ ... ],
  "improvement_tips": [ ... ],
  "extra": {
    "escalation_moments": ["02:15", "04:40"],
    "best_empathy_phrases": ["\"I can hear how frustrated you are.\""],
    "alternative_phrases": ["Instead of 'calm down', try 'Take all the time you need.'"]
  }
}
```

### Veritalk example output
```json
{
  "overall_score": 7,
  "categories": {
    "argument_coherence":    { "score": 8, "feedback": "..." },
    "evidence_quality":      { "score": 5, "feedback": "..." },
    "logical_soundness":     { "score": 7, "feedback": "..." },
    "interruption_recovery": { "score": 9, "feedback": "..." }
  },
  "metrics": { ... },
  "key_moments": [ ... ],
  "improvement_tips": [ ... ],
  "extra": {
    "fallacies_detected": [
      { "name": "Straw Man", "timestamp": "01:45", "quote": "\"So you're saying we should just...\"" }
    ],
    "missed_counter_arguments": ["The economic externalities argument", "The access equity angle"],
    "strongest_moment": "03:22 — \"Studies from MIT...\" — clear, sourced rebuttal.",
    "weakest_moment": "05:10 — Circular reasoning on the second point."
  }
}
```

### Impromptu example output
```json
{
  "overall_score": 8,
  "categories": {
    "topic_adherence": { "score": 9, "feedback": "..." },
    "structure":       { "score": 7, "feedback": "..." },
    "confidence":      { "score": 8, "feedback": "..." },
    "originality":     { "score": 9, "feedback": "..." }
  },
  "metrics": { ... },
  "key_moments": [ ... ],
  "improvement_tips": [ ... ],
  "extra": {
    "assigned_topic": "Convince a room of skeptics that daydreaming is a professional skill.",
    "best_moment_quote": "\"When Einstein daydreamed, he wasn't wasting time — he was building the theory of relativity.\"",
    "next_challenge": "Work on your closing — end with a memorable one-liner, not a summary.",
    "silence_gaps_seconds": 4
  }
}
```

---

## 5. Open Questions / Decisions Needed

1. **Extra field rendering on the frontend**: Should each scenario have a custom report card UI (more work, more polish), or should we use a generic key-value expansion panel initially?
2. **Metrics relevance per mode**: Some metrics (e.g., `avg_talk_ratio`) are meaningful for EmpathyTrainer but less so for Impromptu. Should we filter which metrics are displayed per mode, or keep all metrics visible?
3. **Schema validation**: Should we add Zod validation of the AI's JSON output against the scenario-specific schema to catch hallucinations/missing fields gracefully?
