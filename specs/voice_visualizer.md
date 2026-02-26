# Voice Visualization System

## 1. Overview
The current voice visualization system is implemented in `client/src/components/Waveform.tsx`. It provides a real-time, bidirectional visual representation of the conversation, distinguishing between the user's speech and the AI's response using a mirrored split-screen waveform design.

## 2. Technical Implementation

### Core Technology
*   **Rendering:** HTML5 Canvas API (2D Context).
*   **Animation Loop:** `requestAnimationFrame` for smooth 60fps updates.
*   **Audio Source:** Web Audio API `AnalyserNode`.
    *   `userAnalyserRef`: Connected to the user's microphone stream.
    *   `aiAnalyserRef`: Connected to the incoming audio stream from the WebSocket.

### Visual Components

The visualization is centered vertically (`centerY` = height / 2) and divided into two distinct zones:

1.  **Center Line / Idle State**
    *   A persistent horizontal line indicates connectivity.
    *   **Idle Animation:** When status is `connecting` or `listening` (but not speaking), a gentle sine wave ripple runs through the center line to indicate the system is "alive" and waiting.
    *   *Equation:* `y = centerY + Math.sin(i * frequency + timeRef.current) * amplitude`

2.  **User Waveform (Top Half)**
    *   **Direction:** Projects upwards (negative Y).
    *   **Color:** Teal / Green (`#5b8782`).
    *   **Style:** Filled area with a glowing stroke on the outer edge.
    *   **Shadow:** Cyan glow (`rgba(91, 135, 130, 0.5)`).

3.  **AI Waveform (Bottom Half)**
    *   **Direction:** Projects downwards (positive Y).
    *   **Color:** Gold / Brown (`#c49a6c`).
    *   **Style:** Filled area mirrored to the user's waveform.
    *   **Shadow:** Warm amber glow (`rgba(196, 154, 108, 0.6)`).

## 3. Data Processing & Smoothing

The visualizer does *not* draw the raw audio waveform (oscilloscope style). Instead, it visualizes a scrolling history of **volume intensity (RMS)** to create a "mountains" landscape effect.

### 1. Volume Calculation (RMS)
For every frame, the Root Mean Square (RMS) amplitude is calculated from the time-domain data of the `AnalyserNode`.

### 2. Timeline History
*   Two arrays (`userHistoryRef`, `aiHistoryRef`) store the last `50` volume points.
*   New volume data is pushed to the end, and the oldest data is shifted out, creating a scrolling effect from right to left.

### 3. Smoothing Algorithms
Two layers of smoothing are applied to prevent jittery visuals:
1.  **Input Smoothing:** The instantaneous volume is interpolated with the previous frame's volume (`ease factor = 0.4`) before being added to the history array.
2.  **Geometric Smoothing:** The points on the canvas are not connected with straight lines. A quadratic Bezier curve (`ctx.quadraticCurveTo`) is used to interpolate between points, creating a liquid, organic shape.

## 4. State Management

The component reacts to the `status` prop:

| Status | Visual Behavior |
|---|---|
| `connecting` | Flat line with gentle ripple. |
| `listening` | User waveform reacts to mic input. AI waveform is flat (but history updates). Center line ripples gently. |
| `speaking` | AI waveform reacts to output audio. User waveform is flat. |
| `interrupted` | (Currently treats as active state, visualization continues). |
| `disconnected` | Animation continues but inputs are zeroed out. |

## 5. File Reference
*   **Source:** [`client/src/components/Waveform.tsx`](../client/src/components/Waveform.tsx)