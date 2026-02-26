# Voice Visualization System

## 1. Overview
The **Glotti** voice visualization system has been evolved into a multi-strategy rendering engine. It supports different visualization metaphors tailored to the specific emotional context of the active coaching mode.

| Visualization Mode | Variant | Description | Used In |
|---|---|---|---|
| **Classic** | `classic` | Mirrored vertical split-screen. Utilitarian and clear. | Impromptu |
| **Clashing Tides** | `tides_clash` | Horizontal opposing forces. Competitive visual "push-of-war". | Pitch Perfect, Veritalk |
| **Overlay Tides** | `tides_overlay` | Horizontal blending streams. Collaborative and harmonic. | Empathy Trainer |

## 2. Architecture

The visualization logic is decoupled from the main session view.

*   **Wrapper Component:** [`Waveform.tsx`](../client/src/components/Waveform.tsx)
    *   Acts as a switcher.
    *   Reads the current `mode` from props.
    *   Lookups the correct `VisualizationType` from `config.ts`.
    *   Renders the appropriate sub-component.

*   **Configuration:** [`client/src/config.ts`](../client/src/config.ts) defines the `MODE_VISUALIZATION` mapping.

## 3. Visualization Strategies

### 3.1 Classic Mode (Legacy)
**Component:** `ClassicWaveform.tsx`

The original "Studio" visualization.
*   **Layout:** Vertically centered split. User on Top (Negative Y), AI on Bottom (Positive Y).
*   **Motion:** Scrolling history (Oscilloscope style) moving Right-to-Left.
*   **Vibe:** Technical, precise, neutral.

### 3.2 Tides System (New)
**Component:** `TidesVisualizer.tsx`

A more organic, fluid visualization where sound waves originate from the screen edges and flow inward.

*   **Layout:** Horizontal flow.
    *   **User Stream:** Originates from **Left Edge**, flows Right.
    *   **AI Stream:** Originates from **Right Edge**, flows Left.
*   **Colors:**
    *   User: Sage Green (`#5b8782`)
    *   AI: Soft Gold (`#c49a6c`)
    *   *Note: These match the Classic palette for consistency.*

#### Variant A: "Clash" (`tides_clash`)
*   **Concept:** A power struggle.
*   **Mechanic:** A "Battleground Line" shifts based on the relative volume of the speakers.
    *   If User is louder, the line pushes to the **Right**.
    *   If AI is louder (or interrupting), the line pushes to the **Left**.
    *   Includes a visual "spark" line where the two forces meet.
*   **Purpose:** Visualizes dominance and "holding your ground" in debates or pitches.

#### Variant B: "Overlay" (`tides_overlay`)
*   **Concept:** Collaboration.
*   **Mechanic:** The waves ignore collision and overlap in the center using `screen` blending mode.
*   **Purpose:** Visualizes harmony and listening in empathy scenarios.

## 4. Technical Details

### Canvas Rendering
Both systems use the HTML5 Canvas 2D API for performance (~60fps).

### Smoothing
*   **Input Smoothing:** Raw RMS volume is interpolated with previous frames (`delta * 0.3`) to prevent jitter.
*   **Bezier Curves:** `ctx.quadraticCurveTo` is used to draw smooth liquid shapes instead of jagged line segments.

### Coordinate Systems
*   **User:** Standard Cartesian (0,0 is Top-Left).
*   **AI (Tides):** Transformed Coordinate System:
    ```typescript
    ctx.translate(width, 0); // Move origin to right edge
    ctx.scale(-1, 1);        // Flip X-axis
    // Now drawing positive X moves 'left' visually
    ```
