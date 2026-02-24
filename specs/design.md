# Glotti — UI/UX Design Specification

This document defines the visual design system, screen layouts, and component specifications for the Glotti client application. It is intended to be used with **Google Stitch** to generate screen mockups that can then guide frontend implementation.

---

## Design Philosophy

- **Dark & focused.** The UI should feel like a professional recording studio — minimal distractions, high contrast readability, immersive.
- **Alive.** Subtle animations and real-time data make the interface feel responsive and intelligent.
- **Premium.** Glassmorphism, smooth gradients, and refined typography — not a tool, an experience.
- **Confidence-inspiring.** The design should make the user feel like they're about to step into a training session with a world-class coach.

---

## Design Tokens

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0a0e27` | Main background |
| `--bg-secondary` | `#111638` | Cards, panels |
| `--bg-glass` | `rgba(255,255,255,0.05)` | Glassmorphism surfaces |
| `--accent-blue` | `#4f8cff` | Primary accent, active states, links |
| `--accent-purple` | `#8b5cf6` | Secondary accent, gradients |
| `--accent-orange` | `#ff6b35` | Warnings, interruptions, alerts |
| `--accent-green` | `#22c55e` | Success, positive metrics |
| `--accent-red` | `#ef4444` | Errors, negative metrics |
| `--text-primary` | `#f8fafc` | Headlines, primary text |
| `--text-secondary` | `#94a3b8` | Descriptions, labels |
| `--text-muted` | `#475569` | Placeholders, disabled |
| `--border-subtle` | `rgba(255,255,255,0.08)` | Card borders |
| `--border-glow` | `rgba(79,140,255,0.3)` | Hover glow effects |

### Typography

| Element | Font | Weight | Size |
|---|---|---|---|
| H1 (page title) | Space Grotesk | 700 | 48px |
| H2 (section title) | Space Grotesk | 600 | 28px |
| H3 (card title) | Space Grotesk | 600 | 22px |
| Body | Inter | 400 | 16px |
| Label | Inter | 500 | 13px, uppercase, letter-spacing 0.05em |
| Metric value | Space Grotesk | 700 | 56px |
| Timer | Space Mono | 400 | 24px |

**Font sources:** Google Fonts — `Space Grotesk`, `Inter`, `Space Mono`.

### Spacing & Radius

| Token | Value |
|---|---|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |
| `--radius-sm` | 8px |
| `--radius-md` | 12px |
| `--radius-lg` | 16px |
| `--radius-xl` | 24px |
| `--radius-full` | 9999px |

### Shadows & Effects

- **Card shadow:** `0 4px 24px rgba(0,0,0,0.3)`
- **Glow hover:** `0 0 20px rgba(79,140,255,0.15)` on border
- **Glassmorphism:** `background: var(--bg-glass); backdrop-filter: blur(12px); border: 1px solid var(--border-subtle);`

---

## Screens

### Screen 1: Mode Selection

**Purpose:** Landing screen where the user picks a coaching mode.

**Layout:**
- Centered vertically and horizontally
- Logo/title at top
- Subtitle text below
- Three mode cards in a horizontal row (switch to stacked on narrow screens)
- Footer with minimal branding

**Components:**
- **Logo/Title:** "Glotti" in H1, with a subtle gradient text effect (blue → purple)
- **Subtitle:** "Choose your sparring partner" in text-secondary
- **Mode Cards (×3):** Each card is a glassmorphism panel (~320px wide, ~360px tall):
  - Large emoji icon (48px) at top
  - Mode title (H3) — e.g., "PitchPerfect"
  - Mode subtitle — e.g., "Startup Pitch Coach" in text-secondary
  - Short description (body text)
  - Hover state: border glows accent-blue, slight scale(1.02) transform
  - Click: navigates to session screen
- **Cards content:**
  - 🎯 **PitchPerfect** — "Startup Pitch Coach" — "Face a skeptical VC who will challenge every claim you make."
  - 🤝 **EmpathyTrainer** — "Difficult Conversations" — "Practice handling upset customers, struggling employees, and tense situations."
  - ⚔️ **Veritalk** — "Debate Sparring" — "Defend your thesis against real-time fact-checks and logical traps."

**Visual reference vibe:** Similar to a game character select screen — dark background, three glowing options, clear visual hierarchy.

---

### Screen 2: Active Session

**Purpose:** The main coaching session screen — shows while the user is speaking with the AI.

**Layout (top to bottom):**
1. **Top bar** — Mode label + session timer (right-aligned)
2. **Center area** — Large audio waveform visualization
3. **Status indicator** — Animated listening/speaking state
4. **Metrics strip** — Horizontal row of live metric cards
5. **Coaching feed** — Scrollable list of recent coaching cues (left side)
6. **End button** — Bottom center

**Components:**

#### 2a. Top Bar
- Left: Mode badge (colored pill — e.g., "PitchPerfect" with 🎯 icon, accent-blue background)
- Right: Session timer in monospace font (e.g., "03:42")

#### 2b. Waveform Visualization
- Full-width canvas, ~120px tall
- Draws real-time audio input as a smooth waveform line
- Color: accent-blue when user is speaking, accent-purple when AI is speaking
- Subtle glow effect behind the waveform

#### 2c. Status Indicator
- Centered below waveform
- Three states:
  - **"Listening..."** — Pulsing ring animation (accent-blue), text: "I'm listening..."
  - **"AI Speaking"** — Solid ring (accent-purple), animated sound wave bars
  - **"Interrupted"** — Flash orange ring (accent-orange), text: "You were interrupted"
- The ring is ~80px diameter, subtle breathing animation

#### 2d. Metrics Strip
- Row of 3-4 metric cards, evenly spaced
- Each card is a glassmorphism mini-panel (~120px wide, ~100px tall):
  - **Filler Words:** Large number (metric-value font), label "Fillers" below
  - **WPM:** Large number, label "WPM" below. Color-coded: green (100-160), orange (>160 or <80)
  - **Tone:** Colored badge with text (e.g., "Confident" = green, "Nervous" = orange, "Defensive" = red)
  - **Score:** (Optional) Running overall score estimate

#### 2e. Coaching Feed
- Left sidebar or bottom panel
- Scrollable list of coaching cues from the agent
- Each cue is a small card with:
  - Timestamp (left)
  - Quote/instruction text
  - Color-coded left border (blue = suggestion, orange = warning, green = praise)
- Example entries:
  - `[1:23]` "You've said 'um' three times — try pausing instead."
  - `[2:15]` "Good recovery after that interruption."

#### 2f. End Session Button
- Large pill button, centered at bottom
- Text: "End Session"
- Style: outline white on default, solid accent-orange on hover
- Confirm dialog before ending

**Visual reference vibe:** Like a live audio monitoring dashboard — think Spotify's live lyrics view crossed with a podcast recording studio.

---

### Screen 3: Post-Session Report

**Purpose:** Displays the AI-generated performance report after the session ends.

**Layout (scrollable page):**
1. **Header** — "Session Report" title + overall score circle
2. **Category scores** — Grid of 4 score cards
3. **Key metrics bar** — Horizontal strip of summary numbers
4. **Key moments timeline** — Vertical timeline with highlights
5. **Improvement tips** — Numbered list
6. **Action buttons** — "Try Again" + "Download Report"

**Components:**

#### 3a. Overall Score
- Large circular gauge (SVG), ~200px diameter
- Score number in center (e.g., "7.2")
- Arc filled proportionally (blue gradient)
- Label: "Overall Score" below

#### 3b. Category Score Cards
- Grid, 2×2 layout
- Each card: glassmorphism panel
  - Category name (H3) — "Clarity", "Confidence", "Persuasiveness", "Composure"
  - Circular mini-gauge (~80px) with numeric score
  - Short feedback text below
- Color-coded rings based on score (red < 4, orange 4-6, green 7-10)

#### 3c. Key Metrics Bar
- Horizontal strip of 4 numbers
- `23 Filler Words` | `148 Avg WPM` | `Nervous Tone` | `2.3s Recovery Time`
- Each metric is a column with large number + label

#### 3d. Key Moments Timeline
- Vertical timeline with dots and connecting lines
- Each moment is a cards:
  - Timestamp badge (left of line)
  - Description text (right)
  - Color: green dot for strength, orange dot for weakness
- Examples:
  - 🟢 `1:23` — "Strong opening hook captured attention"
  - 🟠 `3:45` — "Lost composure after investor challenge on market size"

#### 3e. Improvement Tips
- Numbered list, each with an icon
- Clean, readable body text
- Subtle left border accent

#### 3f. Action Buttons
- "Try Again" — Primary solid button (accent-blue)
- "Download Report" — Secondary outline button
- Centered at bottom

**Visual reference vibe:** Like a Spotify Wrapped summary or a fitness app post-workout report — celebratory but informative.

---

## Animations

| Animation | Where | Spec |
|---|---|---|
| Breathing pulse | Status ring (listening state) | Scale 1.0 → 1.05 → 1.0, 2s ease-in-out infinite |
| Glow on hover | Mode cards | Border glow fades in, 200ms ease |
| Slide up | Screen transitions | translateY(20px) → 0, opacity 0 → 1, 300ms ease-out |
| Counter tick | Metric values updating | Number animates up/down, 150ms |
| Waveform | Audio visualization | Real-time canvas draw at 60fps |
| Score fill | Report gauge | Arc animates from 0 to final value, 1s ease-out |
| Timeline reveal | Key moments | Staggered fade-in on scroll, 100ms delay between items |

---

## Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| ≥ 1024px (Desktop) | Full layout as described, side-by-side elements |
| 768–1023px (Tablet) | Mode cards stack 2+1, metrics strip wraps to 2×2 |
| < 768px (Mobile) | Not primary target. Mode cards stack vertical, metrics stack vertical |

---

## Accessibility

- All interactive elements have focus outlines (accent-blue, 2px)
- Color is never the sole indicator — icons/text supplement color-coded metrics
- Buttons have min touch target 44×44px
- Screen reader labels on all metric gauges
- Reduced motion: disable pulse/breathing animations if `prefers-reduced-motion` is set

---

## Stitch Screen Generation Prompts

These prompts can be used directly with Google Stitch to generate mockup screens.

### Prompt for Screen 1 (Mode Selection):
> A dark-themed landing page for "Glotti", a real-time AI speech coaching app. Deep navy background (#0a0e27). Centered layout with a gradient text logo "Glotti" at top. Subtitle "Choose your sparring partner" below. Three horizontal glassmorphism cards with rounded corners: (1) 🎯 PitchPerfect - Startup Pitch Coach, (2) 🤝 EmpathyTrainer - Difficult Conversations, (3) ⚔️ Veritalk - Debate Sparring. Each card has an emoji, title, subtitle, and short description. Cards have subtle glass effect with blur and faint white borders. Premium, modern aesthetic similar to a game character selection screen.

### Prompt for Screen 2 (Active Session):
> A dark-themed real-time coaching dashboard for a speech training app. Deep navy background. Top bar shows mode badge "PitchPerfect 🎯" on the left and timer "03:42" on the right. Center: a glowing blue audio waveform visualization spanning full width. Below it: a pulsing circle indicator with text "Listening...". Below that: a row of three glass-effect metric cards showing "7 Fillers", "142 WPM", and a green "Confident" tone badge. At the bottom: a large rounded "End Session" button. The vibe is like a professional audio monitoring studio. Dark, focused, premium.

### Prompt for Screen 3 (Post-Session Report):
> A dark-themed post-session performance report for a speech coaching app. Deep navy background. At the top: "Session Report" title with a large circular score gauge showing "7.2/10" filled with a blue gradient arc. Below: a 2x2 grid of glassmorphism score cards for "Clarity (8/10)", "Confidence (6/10)", "Persuasiveness (7/10)", "Composure (8/10)" — each with a mini circular gauge. Below: a metrics strip showing "23 Fillers | 148 WPM | Nervous Tone | 2.3s Recovery". Below: a vertical timeline of key moments with green (strength) and orange (weakness) dots. At the bottom: "Try Again" blue button and "Download Report" outline button. Premium, data-rich, like a Spotify Wrapped summary.
