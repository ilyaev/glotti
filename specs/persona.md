# Scenarios & Personas Specification

This document details how Glotti implements its various training scenarios and provide a step-by-step guide for developers to add new personas.

## 1. Concepts

*   **Scenario (Mode)**: A high-level category of training (e.g., PitchPerfect, EmpathyTrainer). Each scenario defines the overall goal and evaluation criteria.
*   **Persona**: The specific AI character the user interacts with (e.g., Skeptical VC, Upset Customer). The persona is defined primarily by its system prompt.

## 2. Implementation Architecture

### Backend: Configuration & Prompts
Scenarios are defined in `server/config.ts` via the `MODES` constant. This constant maps a unique mode ID (e.g., `pitch_perfect`) to the path of its system prompt file.

*   **Prompt Storage**: `server/agents/prompts/` contains `.md` files for each persona.
*   **Loading**: `loadPrompt(mode)` reads the markdown file from disk and returns it as a string.

### Real-time Injection
The Gemini Live API session is initialized in `server/ws-handler.ts`. The system prompt for the specific mode is passed to the `genai.live.connect` call:

```typescript
// server/ws-handler.ts
const systemPrompt = loadPrompt(mode);
const session = await genai.live.connect({
  // ...
  config: {
    systemInstruction: { parts: [{ text: systemPrompt }] },
  },
});
```

### Metrics & Hints
While the persona handles the conversation, real-time training heuristics are implemented in `server/ws-handler.ts` within the `extractMetrics` function. This function uses the `mode` to provide scenario-specific hints:

```typescript
// server/ws-handler.ts -> extractMetrics
if (mode === 'pitch_perfect' && wpm > 180) {
  hint = 'You are speaking very fast. Take a breath and slow down.';
} else if (mode === 'empathy_trainer' && talk_ratio > 65) {
  hint = 'Try to listen more. Let the other person speak.';
}
```

### Frontend: UI & State
The client tracks the selected mode in `client/src/App.tsx`. The `ModeSelect` component provides the visual choice to the user and passes the selection back to the main app state.

---

## 3. Guide: Adding a New Persona

Follow these steps to add a new coaching scenario to Glotti:

### Step 1: Write the System Prompt
Create a new markdown file in `server/agents/prompts/` (e.g., `negotiator.md`).
> [!TIP]
> Use a clear "You are..." statement, define the personality traits, interaction rules, and how the AI should react to different user behaviors (e.g., "If the user is too aggressive, push back hard").

### Step 2: Register on the Backend
Add the new mode to the `MODES` object in `server/config.ts`:

```typescript
// server/config.ts
export const MODES = {
  // ... existing modes
  negotiator: 'server/agents/prompts/negotiator.md',
} as const;
```

### Step 3: Update Client Types
Add the new mode ID to the `Mode` type in `client/src/App.tsx`:

```typescript
// client/src/App.tsx
export type Mode = 'pitch_perfect' | 'empathy_trainer' | 'veritalk' | 'negotiator';
```

### Step 4: Add to UI
Update the `modes` array in `client/src/components/ModeSelect.tsx` to include the new card description, icon, and optional `iconUrl`:

```typescript
// client/src/components/ModeSelect.tsx
const modes = [
    // ...
    {
        id: 'negotiator' as Mode,
        title: 'MasterNegotiator',
        subtitle: 'Salary & Contract Partner',
        description: 'Practice high-stakes negotiation where every word counts.',
        icon: <Briefcase size={48} strokeWidth={1.5} />,
        iconUrl: '/icons/negotiator.png', // Optional custom PNG
        color: '#f97316',
    },
];
```

#### Custom Icons
Glotti supports custom PNG icons for each mode.
*   **Storage**: Place PNG files in `client/public/icons/`.
*   **Configuration**: Reference the path in the `iconUrl` property (e.g., `/icons/filename.png`).
*   **Fallback**: If the image fails to load or is missing, the system will automatically fall back to the provided Lucide `icon`.

### Step 5: (Optional) Customize Metrics
If your persona requires specific real-time heuristics, add logic to `extractMetrics` in `server/ws-handler.ts`.

---

### Step 6: Configure the Session Report

Each scenario defines its own post-session report through the `report` field inside its `ScenarioConfig` in `server/config.ts`. This controls the AI evaluator framing, scoring categories, which metrics are shown, and any extra data fields specific to your scenario.

#### `ScenarioReportConfig` fields

| Field | Type | Purpose |
|---|---|---|
| `promptIntro` | `string` | The opening paragraph of the report generation prompt. Tells the AI what role to adopt (e.g., "You are a debate coach..."). Be specific about the evaluation lens. |
| `categories` | `Record<string, ReportCategory>` | Named scoring dimensions. The key becomes the JSON field name, `label` is the display name, `description` is injected into the prompt so the AI knows exactly what to score. |
| `displayMetrics` | `MetricKey[]` | Which of the 6 standard metrics to show in the report UI. Options: `total_filler_words`, `avg_words_per_minute`, `dominant_tone`, `interruption_recovery_avg_ms`, `avg_talk_ratio`, `avg_clarity_score`. |
| `extraFields` | `Record<string, string>` | Additional top-level JSON fields the AI should produce. The key is the field name; the value is a plain-English description of what the AI should output (type + content). |

#### Example config for a new `negotiator` scenario

```typescript
// server/config.ts
negotiator: {
  promptFile: 'server/agents/prompts/negotiator.md',
  report: {
    promptIntro:
      'You are a negotiation strategist evaluating a salary or contract negotiation practice session. Focus on tactics, leverage, and concession management.',
    categories: {
      opening_position: {
        label: 'Opening Position',
        description: 'Did the user anchor high/low appropriately and avoid revealing their BATNA too early?',
      },
      concession_management: {
        label: 'Concession Management',
        description: 'Did the user make concessions strategically (small, slow, conditional) or cave too quickly?',
      },
      active_listening: {
        label: 'Active Listening',
        description: 'Did the user pick up on signals and use silence effectively as a negotiation tool?',
      },
      closing: {
        label: 'Closing',
        description: 'Did the user recognize a closing opportunity and land a clear, favorable agreement?',
      },
    },
    displayMetrics: ['avg_words_per_minute', 'dominant_tone', 'interruption_recovery_avg_ms', 'avg_talk_ratio'],
    extraFields: {
      final_outcome: 'A string describing what deal (if any) was reached and whether it favored the user.',
      missed_tactics: 'An array of strings listing negotiation tactics the user could have employed but did not.',
      best_leverage_moment: 'A string describing the moment the user used leverage most effectively (with timestamp).',
    },
  },
},
```

#### Adding a custom report card on the frontend

After defining the config, create a matching React component in `client/src/components/report/`:

1. Create `client/src/components/report/NegotiatorReport.tsx` — use the shared primitives from `ReportBase.tsx` (`ScoreGauge`, `CategoryCards`, `MetricsStrip`, `KeyMoments`, `ImprovementTips`, `ReportActions`) and add any custom sections that render the `extra` fields.
2. Add a typed interface for the extra fields in `client/src/types.ts` (e.g., `NegotiatorExtra`).
3. Register the component in `client/src/components/Report.tsx` — add a `case 'negotiator':` to the `switch (data.mode)` statement.

---

### Step 7: Create a Scenario-Specific Performance Card (Export)

Each scenario features a distinct visual layout for social sharing (1080x1080 export). These templates are located in `client/src/components/report/cards/`.

1. **Create the Card Component:** Create a new React component (e.g., `client/src/components/report/cards/NegotiatorCard.tsx`).
   - The card **must** have a fixed `width: '1080px'` by `height: '1080px'` dimension.
   - It **must** use raw inline CSS for styling to ensure perfect compatibility with `html-to-image` rendering.
   - Forward the `ref` to the outermost `<div>` so the capture library can target it.
   - Design a unique visual theme (colors, gradients, metric layouts) that fits the persona's vibe.
2. **Access Data:** Use `report.extra` for your scenario-specific metrics (e.g., parsed as `NegotiatorExtra`), and import `formatMetricValue` from `../ReportBase` for standard metrics.
3. **Register in the Router:** Import your new card into `client/src/components/report/PerformanceCard.tsx` and add it to the router switch statement:

```tsx
// client/src/components/report/PerformanceCard.tsx
import { NegotiatorCard } from './cards/NegotiatorCard';

export const PerformanceCard = forwardRef<HTMLDivElement, PerformanceCardProps>(({ report }, ref) => {
    switch (report.mode) {
        // ... existing cases
        case 'negotiator':
            return <NegotiatorCard report={report} ref={ref} />;
        default:
            return <PitchPerfectCard report={report} ref={ref} />;
    }
});
```

4. **Verify Layout:** Navigate to `#/cards_sandbox` in the browser to visually test your new card layout without needing to complete a full session.

---

## 4. Prompt Engineering Best Practices

For the best training experience, ensure your system prompts include:

1.  **Strict Persona**: Remind the AI to stay in character and never break the fourth wall unless absolutely necessary (e.g., "You are a Tier-1 VC...").
2.  **Interaction Rules with Hooks**: Define clear "hooks" for specific user behaviors that trigger immediate interventions.
    *   *Example*: "If user says buzzwords like 'synergy', interrupt immediately and ask for plain English."
    *   *Example*: "If user speaks for >45 seconds without a point, cut them off."
3.  **Adaptive Intensity**: Structure the prompt to scale difficulty based on user performance.
    *   "Start Neutral -> If good, get Tougher -> If bad, offer a Lifeline."
4.  **Report Integration**: Ensure the persona prompt includes a section on "Post-Session Evaluation" that aligns with the fields defined in `server/config.ts`. The real-time persona needs to know what it will be grading later (e.g., "At the end, you will decide Pass/Invest").

---

## 5. Report System Guidelines

When designing the `extraFields` for the report, prefer structured data over large text blobs:

*   **Arrays of Strings**: Use `z.array(z.string())` for fix lists or bullet points (e.g., `specific_fixes`).
*   **Binary/Enum Outcomes**: Capturing clear verdicts (e.g., "Pass/Invest", "Hired/Rejected") is better than generic scores.
*   **Key Insight Pairs**: Use fields like `weakest_link` and `strongest_asset` to force the AI to make a choice, rather than a generic "summary".

This structured approach makes the frontend visualization (Step 6) much more powerful than just rendering paragraphs of text.
