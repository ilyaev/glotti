# Visual Rewards — Celebration Overlay Spec

## 1. Overview

When a user completes a session, we evaluate whether a **celebration** is warranted. Three variant types trigger a fullscreen animated overlay with confetti, fireworks, and text animations:

1. **First Session** — The very first completed session (detected via `localStorage`).
2. **Milestone** — Reaching session counts 5, 10, 25, 50, or 100 (detected via sessions API).
3. **High Score** — Scoring ≥ 8 out of 10 on a session report (detected when the report arrives).

For sessions that don't match any trigger, the existing `SessionEndingOverlay` is shown directly.

---

## 2. Celebration Variant Types

```typescript
type CelebrationVariant =
    | { kind: 'first_session' }
    | { kind: 'milestone'; count: number }   // 5, 10, 25, 50, 100
    | { kind: 'high_score'; score: number }; // score >= 8 (1–10 scale)
```

### Variant Priority

If multiple variants apply to the same session, the **first match wins** in this order:
1. `first_session` (only once ever)
2. `high_score` (checked when report arrives, only if no celebration already showing)
3. `milestone` (checked on session end)

### Intensity System

Each variant maps to an **intensity level** (1–3) that scales particle counts and firework frequency:

| Variant | Intensity | Confetti Count | Firework Bursts |
|---------|-----------|----------------|-----------------|
| first_session | 2 | 80 | 3 bursts |
| milestone 5 | 1 | 50 | 1 burst |
| milestone 10 | 2 | 80 | 3 bursts |
| milestone 25+ | 3 | 120 | 6 bursts |
| high_score 8 | 1 | 50 | 1 burst |
| high_score 9 | 2 | 80 | 3 bursts |
| high_score 10 | 3 | 120 | 6 bursts |

---

## 3. User Flow

```
Session ends (status → 'ending')
    │
    ├── Check localStorage for 'glotti_first_session_celebrated'
    │   └── Not set? → Show first_session celebration
    │
    ├── Fetch session count from /api/sessions
    │   └── count+1 in [5,10,25,50,100]? → Show milestone celebration
    │
    ├── Wait for report to arrive
    │   └── overall_score >= 8 AND no celebration showing? → Show high_score celebration
    │
    └── No triggers matched → Show SessionEndingOverlay directly
    
    Celebration overlay auto-dismisses (~4s)
        │
        ▼
    If report already received → navigate to SessionDetail
    If report not yet received → show SessionEndingOverlay until report arrives
```

---

## 4. Component Design

### 4.1 `CongratulationsOverlay`

**File:** `client/src/components/session/CongratulationsOverlay.tsx`

```typescript
interface CongratulationsOverlayProps {
    mode: string;
    variant: CelebrationVariant;
    onComplete: () => void;
}
```

**Behavior:**
1. Mounts with a full-screen overlay.
2. Determines intensity from variant (1–3).
3. Kicks off confetti + firework particle system on canvas.
4. Displays variant-specific icon, title, and subtitle.
5. After ~3.5s, calls `onComplete()`.
6. For `first_session` variant only: sets `localStorage.setItem('glotti_first_session_celebrated', 'true')`.

### 4.2 Variant-Specific Content

| Variant | Icon | Title | Subtitle |
|---------|------|-------|----------|
| first_session | Trophy | "Congratulations!" | "You crushed your first session!" |
| milestone 5 | Award | "5 Sessions!" | "You're building a habit!" |
| milestone 10 | Award | "10 Sessions!" | "Double digits — impressive!" |
| milestone 25 | Crown | "25 Sessions!" | "Quarter-century mark!" |
| milestone 50 | Crown | "50 Sessions!" | "Halfway to the century!" |
| milestone 100 | Flame | "100 Sessions!" | "You're a legend!" |
| high_score 8 | Trophy | "Great Score!" | "8/10 — solid performance!" |
| high_score 9 | Trophy | "Amazing!" | "9/10 — you're on fire!" |
| high_score 10 | Flame | "Perfect!" | "10/10 — absolutely flawless!" |

### 4.3 Visual Composition (layered, back to front)

```
┌─────────────────────────────────────────────┐
│  Layer 0: Semi-transparent backdrop         │
│  (radial gradient, warm tones)              │
│                                             │
│  Layer 1: Confetti particle canvas          │
│  (full-screen <canvas> for confetti)        │
│                                             │
│  Layer 2: Floating sparkle particles        │
│  (CSS-animated divs or canvas overlay)      │
│                                             │
│  Layer 3: Central content                   │
│    ┌─────────────────────────────────┐      │
│    │  🎉  (animated trophy/star)     │      │
│    │                                 │      │
│    │  "Congratulations!"             │      │
│    │  (H1, entrance animation)       │      │
│    │                                 │      │
│    │  "You crushed your first        │      │
│    │   session!"                     │      │
│    │  (subtitle, staggered fade-in)  │      │
│    │                                 │      │
│    │  "Your report is on the way..." │      │
│    │  (small text, delayed fade-in)  │      │
│    └─────────────────────────────────┘      │
└─────────────────────────────────────────────┘
```

---

## 5. Animation Breakdown

### 5.1 Entrance Sequence (timeline)

| Time | Element | Animation |
|------|---------|-----------|
| 0ms | Backdrop | Fade in from transparent (300ms ease-out) |
| 0ms | Confetti canvas | Start emitting confetti particles |
| 200ms | Trophy/star icon | Scale up from 0 → 1 with elastic overshoot (bounce easing, 600ms) |
| 400ms | "Congratulations!" text | Slide up from +30px + fade in (500ms ease-out) |
| 700ms | Subtitle text | Slide up from +20px + fade in (400ms ease-out) |
| 1200ms | "Your report is on the way..." | Fade in (300ms) |
| 1500ms | Sparkle burst | Secondary wave of smaller sparkles |
| 3500ms | Entire overlay | Fade out (500ms) → `onComplete()` fires |

### 5.2 Confetti & Firework Particle System

**Implementation:** Pure `<canvas>` — no external libraries.

**Two particle types on the same canvas:**

#### Confetti Particles
- Count: 50–120 based on intensity level
- Shapes: rectangles + circles (randomly mixed)
- Colors: Mode-specific accent + base palette (`#5b8782`, `#c49a6c`, `#d97757`, `#6c8c62`, `#FFD700`, `#C0C0C0`)
- Physics: gravity (0.15), air resistance (vx *= 0.99), rotation
- Spawn: Burst from top-center, fan pattern

#### Firework Particles
- Radial burst explosions at random screen positions
- Count per burst: 30–50 particles
- Burst scheduling based on intensity:
  - Intensity 1: 1 burst at t=500ms
  - Intensity 2: 3 bursts at t=300ms, 800ms, 1500ms
  - Intensity 3: 6 bursts at t=200ms, 500ms, 900ms, 1300ms, 1800ms, 2200ms
- Colors: `['#FFD700', '#FF6B35', '#FF1744', '#E040FB', '#00E5FF', '#76FF03']`
- Physics: radial velocity (2–6), drag (0.97), slight gravity (0.03)
- Visual: Each particle has a 6-point trail (stored positions), rendered with decreasing opacity
- Glow effect: `shadowBlur: 8`, `shadowColor` matching particle color
- Lifetime: ~60 frames, fade out over last 20 frames

### 5.3 Sparkle/Shimmer Particles

**Implementation:** CSS-animated `<div>` elements (12–20 sparkles), absolutely positioned.

**Each sparkle:**
- Shape: Small star or diamond (using CSS `clip-path` or a simple rotated square)
- Size: 4–10px
- Color: `#FFD700` (gold) or `rgba(255,255,255,0.9)` (white)
- Animation: fade in → scale up → fade out, with random delay (0–2s) and duration (0.8–1.5s)
- Position: Randomly distributed across the viewport, biased toward the center 60%
- CSS class: `.sparkle` with `@keyframes sparkle` animation

### 5.4 Icon Animation

**Implementation:** Use a Lucide icon (`Trophy`, `Star`, or `PartyPopper`) from the existing `lucide-react` dependency.

**Animation:**
- Start at `scale(0) rotate(-15deg)`
- Animate to `scale(1) rotate(0deg)` with cubic-bezier overshoot: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Duration: 600ms
- After landing, subtle pulse glow effect (2s loop)

### 5.5 Text Entrance

**"Congratulations!" (H1):**
- `@keyframes congratsEntrance`: `translateY(30px) opacity(0)` → `translateY(0) opacity(1)`
- Font: `var(--font-display)`, 42px, weight 700
- Style: Gradient text (`--accent-blue` → `--accent-purple` via `background-clip: text`), matching the existing `session__loading-title` pattern
- Optional: subtle text-shadow glow matching the gradient colors

**Subtitle:**
- Same `fadeUp` pattern, 18px, `var(--text-secondary)` color
- 300ms delay after title

**"Your report is on the way...":**
- Simple `opacity: 0 → 1`, 14px, `var(--text-muted)`
- Gentle pulse animation after appearing (reuse existing `@keyframes pulse`)

---

## 6. Mode-Specific Theming

Each mode can tint the celebration with its accent color for a personalized feel:

| Mode | Accent Color | Confetti Bias | Icon |
|------|-------------|---------------|------|
| `pitch_perfect` | `#4f8cff` (blue) | More blue confetti strips | `Target` |
| `empathy_trainer` | `#22c55e` (green) | More green + warm confetti | `Heart` |
| `veritalk` | `#8b5cf6` (purple) | More purple + silver confetti | `Swords` |
| `impromptu` | `#f59e0b` (amber) | More gold + amber confetti | `Zap` |

The backdrop radial gradient should subtly incorporate the mode's accent color:
```css
background: radial-gradient(ellipse at center, rgba(accent, 0.08) 0%, rgba(0,0,0,0) 70%);
```

---

## 7. Integration Points

### 7.1 Session.tsx Integration

**File:** `client/src/components/Session.tsx`

```tsx
const MILESTONE_THRESHOLDS = [5, 10, 25, 50, 100];

function Session({ mode, userId, onEnd }: Props) {
    const [celebration, setCelebration] = useState<CelebrationVariant | null>(null);
    const pendingReportRef = useRef<SessionReport | null>(null);
    const celebrationCheckedRef = useRef(false);

    // Wrap onEnd to intercept report for high-score check
    const handleReportReceived = useCallback((report: SessionReport) => {
        if (celebration) {
            pendingReportRef.current = report;
            return;
        }
        if (report.overall_score >= 8) {
            setCelebration({ kind: 'high_score', score: report.overall_score });
            pendingReportRef.current = report;
            return;
        }
        onEnd(report);
    }, [celebration, onEnd]);

    const { status, ... } = useSessionLogic(mode, userId, handleReportReceived);

    // When entering 'ending', check first_session / milestone
    useEffect(() => {
        if (status !== 'ending' || celebrationCheckedRef.current) return;
        celebrationCheckedRef.current = true;

        const celebrated = localStorage.getItem('glotti_first_session_celebrated');
        if (!celebrated) {
            setCelebration({ kind: 'first_session' });
            return;
        }

        fetch(`${apiBase}/api/sessions?userId=${encodeURIComponent(userId)}`)
            .then(r => r.ok ? r.json() : [])
            .then((data: unknown[]) => {
                const nextCount = data.length + 1;
                if (MILESTONE_THRESHOLDS.includes(nextCount)) {
                    setCelebration({ kind: 'milestone', count: nextCount });
                }
            })
            .catch(() => {});
    }, [status, userId]);

    const handleCelebrationComplete = useCallback(() => {
        setCelebration(null);
        const pending = pendingReportRef.current;
        if (pending) {
            pendingReportRef.current = null;
            onEnd(pending);
        }
    }, [onEnd]);

    if (celebration) {
        return <CongratulationsOverlay mode={mode} variant={celebration} onComplete={handleCelebrationComplete} />;
    }
    if (status === 'ending') {
        return <SessionEndingOverlay mode={mode} elapsed={elapsed} />;
    }
    // ...
}
```

**Key design decisions:**
- `pendingReportRef` holds the report while a celebration plays. When the overlay calls `onComplete`, the stashed report is forwarded to `onEnd()` for navigation.
- `celebrationCheckedRef` prevents duplicate API calls when the effect re-runs.
- High-score check only fires if no celebration is already active (priority: first_session > milestone > high_score).

### 6.2 OverlayPreview.tsx — Testing Page

**File:** `client/src/components/OverlayPreview.tsx`
**Route:** `#/_preview`

Secret testing page with a grid of 9 variant preset buttons covering all celebration types and intensity levels:
- First Session (intensity 2)
- Milestone 5, 10, 25, 50, 100 (intensity 1→3)
- High Score 82%, 91%, 97% (intensity 1→3)

Each button clears `localStorage` before launching to ensure the overlay fires. A mode selector at the top allows previewing with any mode's color theme.

### 6.3 CSS additions (in `index.css`)

Section `/* ===== Congratulations Overlay ===== */` (line ~1110) with:

- `.congrats-overlay` — full-screen fixed, flex center, z-index 100
- `.congrats-overlay__confetti` — absolute, full-size canvas, pointer-events none
- `.congrats-overlay__sparkles` — container for CSS sparkle particles
- `.congrats-sparkle` — star-shaped CSS `clip-path` particles with animation
- `.congrats-overlay__content` — z-index above canvas, flex column centered
- `.congrats-overlay__icon` — scale-bounce entrance animation with glow
- `.congrats-overlay__title` — gradient text (blue→purple), slide-up entrance
- `.congrats-overlay__subtitle` — delayed fade-up
- `.congrats-overlay__hint` — delayed fade-in
- `@keyframes congratsFadeIn/congratsFadeOut` — overlay entrance/exit
- `@keyframes congratsIconBounce` — elastic icon pop-in
- `@keyframes congratsEntrance` — text slide-up entrance
- `@keyframes congratsHintIn` — subtle text fade-in
- `@keyframes congratsSparkle` — sparkle rotate + scale cycle
- Mobile responsive overrides (max-width: 600px)
- `prefers-reduced-motion` media query — disables canvas, sparkles, and all animations

---

## 7. Accessibility

- Confetti canvas is purely decorative: `aria-hidden="true"` on the canvas.
- The overlay text is announced: use `role="status"` and `aria-live="polite"` on the content container.
- Respect `prefers-reduced-motion`: if enabled, skip confetti, fireworks, and sparkle animations — show only the static text with a simple fade-in.

---

## 8. Performance Considerations

- The confetti canvas uses `requestAnimationFrame` and renders at most ~200 particles (confetti + firework) — negligible on any modern device.
- Sparkle divs are 12–24 elements (scaled by intensity) with CSS animations — no JS overhead.
- The entire overlay lives for ~4 seconds and is unmounted after, so no ongoing cost.
- Canvas element size: match `window.innerWidth` × `window.innerHeight`; handle resize with a listener.
- No external dependencies needed — all pure CSS + canvas.

---

## 9. Testing

### 9.1 Manual Testing via Preview Page

Access `#/_preview` in the browser to test all 9 variant×intensity combinations across all 4 modes.

### 9.2 Checklist

- [ ] First session: overlay appears with confetti + fireworks + text animations
- [ ] Second session: overlay does NOT appear (goes straight to `SessionEndingOverlay`)
- [ ] Milestone sessions (5, 10, 25, 50, 100): overlay appears with variant-specific icon/text
- [ ] High score (≥ 8/10): overlay appears after report arrives with score display
- [ ] Intensity scales correctly: more particles and firework bursts at higher tiers
- [ ] Clear `localStorage` key `glotti_first_session_celebrated` → first_session overlay appears again
- [ ] Overlay transitions smoothly — calls `onComplete` after ~4s
- [ ] If report arrives during celebration, it's stashed and forwarded after overlay completes
- [ ] Confetti + fireworks render correctly on different screen sizes (mobile, tablet, desktop)
- [ ] `prefers-reduced-motion` disables all animations gracefully
- [ ] Mode-specific accent colors apply to confetti, fireworks, and backdrop
- [ ] No memory leaks (canvas animation loop stops on unmount)
- [ ] Screen reader announces celebration text
- [ ] Preview page (`#/_preview`) correctly launches all 9 variant presets

---

## 10. Future Extensions

- **Achievement badges:** Unlock visual badges (e.g., "First Pitch", "Debate Champion") with dedicated celebration animations.
- **Sound effects:** Optional celebratory sound (short chime or fanfare), gated behind a user preference.
- **Streak tracking:** Celebrate consecutive-day streaks with intensity-scaled effects.
- **Custom messages:** Mode-specific celebration subtitles (e.g., "Your pitch was pitch-perfect!" for pitch_perfect mode).
