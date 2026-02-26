# Voice Visualization Concept: The "Clashing Tides"

## 1. Overview
This concept explores a horizontal, confrontational visualization metaphor. Instead of a passive vertical stack (Studio Mode), this design visualizes the conversation as two opposing forces meeting in a central arena. This is particularly effective for the **Veritalk (Debate)** and **PitchPerfect** modes, where "holding your ground" is a key theme.

## 2. Core Mechanics

### 2.1 The Setup
*   **Orientation:** Horizontal flow.
*   **User Stream:** Originates from the **LEFT**, flowing **RIGHT** (`→`).
*   **AI Stream:** Originates from the **RIGHT**, flowing **LEFT** (`←`).
*   **Meeting Point:** The center of the screen (X = Width / 2).

### 2.2 The Waveform Style
Instead of a thin line, we visualize "energy streams" or "tides".
*   **Shape:** Filled paths with organic, flowing edges.
*   **Motion:** The "history" of the volume doesn't scroll off-screen instantly; it flows from the edge towards the center, like a wave crashing on a shore.

## 3. Interaction Models (The "Clash")

How the waves interact when they meet in the middle is the defining feature of this visualization.

### Option A: The "Ghost" Overlay (Cooperative)
*   **Behavior:** The waves simply pass through each other with additive or screen blending modes.
*   **Visual:** Where they overlap, the colors mix to create a bright, white-hot center.
*   **Vibe:** Collaborative, harmonic, energetic.
*   **Implementation:**
    ```javascript
    ctx.globalCompositeOperation = 'screen';
    // Draw User Wave (Green)
    // Draw AI Wave (Orange)
    ```

### Option B: The "Power Struggle" (Competitive)
*   **Behavior:** The louder source physically pushes the other wave back.
*   **Visual:**
    *   If User is loud and AI is quiet: User's wave pushes past the center line to the right.
    *   If AI interrupts loudly: AI's wave surges left, compressing the User's wave.
*   **Metric:** This effectively visualizes dominance or "share of voice" in real-time.
*   **Tension:** If both are loud (interruption), the boundary creates a jagged, high-frequency "spark" line where they collide.

### Option C: The "Interference Pattern" (Scientific)
*   **Behavior:** Classic wave interference.
*   **Visual:** When opposite expanding rings or sine waves meet, they create constructive/destructive interference patterns.
*   **Vibe:** Very sci-fi/abstract, possibly harder to read as a "conversation".

## 4. Visual Definitions

### User Stream (Left Origin)
*   **Primary Color:** Cyan/Teal (`#2dd4bf`).
*   **Form:** Tighter, faster frequency (representing human "nervous" energy or rapid speech).
*   **Anchor:** Fixed to `x=0` (Left edge).

### AI Stream (Right Origin)
*   **Primary Color:** Warm Gold/Amber (`#fbbf24`) or Royal Purple (`#8b5cf6`) depending on persona.
*   **Form:** Broader, smoother, deeper amplitude curves (representing stable, processed AI confidence).
*   **Anchor:** Fixed to `x=Width` (Right edge).

### The "Tension Line"
In the "Power Struggle" model, we can draw a vertical glowing bar at the collision point.
*   **Green Zone:** Line is to the right (User winning).
*   **Red Zone:** Line is to the left (User losing ground).

## 5. Technical Implementation Strategy

### 5.1 Dual Coordinate Systems
To simplify drawing, we can treat both waves as "Left-to-Right" logic, but apply a transform for the AI.

```typescript
function drawFrame() {
    // 1. Draw User (Left -> Right)
    ctx.save();
    drawWave(userHistory); 
    ctx.restore();

    // 2. Draw AI (Right -> Left)
    ctx.save();
    ctx.translate(width, 0); // Move origin to right edge
    ctx.scale(-1, 1);        // Flip horizontally
    drawWave(aiHistory);     // Draw using same logic as user
    ctx.restore();
}
```

### 5.2 Collision Logic (Power Struggle)
We need a variable `battlegroundX` that shifts based on relative volume.

```typescript
// Pseudo-code for determining center point
const momentum = 0.05; // How fast the line moves
const userForce = userRMS; 
const aiForce = aiRMS;

// If User is louder, move battleground Right (increase X)
// If AI is louder, move battleground Left (decrease X)
targetX += (userForce - aiForce) * collisionSensitivity;

// Clamp to screen bounds with padding
targetX = Math.max(padding, Math.min(width - padding, targetX));
```

## 6. Recommendation

For **Glotti's** competitive modes (Veritalk), **Option B (The Power Struggle)** is a powerful UI affordance. Use the "Push" mechanic to subtly gamify the interaction—players will naturally try to speak up to "push back" the AI.

For **EmpathyTrainer**, this might be too aggressive. We could fall back to **Option A (Overlay)** for collaborative modes.
