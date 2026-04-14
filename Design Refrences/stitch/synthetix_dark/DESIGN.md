```markdown
# Design System Document: The Sovereign Developer Interface

## 1. Overview & Creative North Star
**Creative North Star: "The Obsidian Monolith"**

This design system is engineered to move away from the cluttered, "dashboard-heavy" aesthetics of traditional developer tools. Instead, it adopts the philosophy of **The Obsidian Monolith**: an interface that feels carved from a single, dark substance—dense, powerful, and mysterious. 

To break the "template" look, we utilize **intentional asymmetry**. Primary interactions are grounded on the right, while exploratory sidebars use extreme tonal depth to recede into the background. We reject the rigid 12-column grid in favor of **Dynamic Negative Space**, where large "breathing rooms" emphasize the potency of the AI’s output. The system is not just a tool; it is a premium environment that respects the developer’s focus.

---

## 2. Colors & Tonal Architecture
The palette is rooted in deep space—avoiding pure black in favor of `#0b1326` (surface) to maintain a sophisticated, ink-like depth.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. 
Structure must be defined by **Tonal Shifts**. 
*   *Example:* A navigation sidebar should be `surface_container_lowest` (#060e20) sitting against a main chat area of `surface` (#0b1326). The eye should perceive the boundary through the shift in darkness, not a stroke.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of "Synthetic Slate."
*   **Base Layer:** `surface` (#0b1326) - The foundation of the application.
*   **Recessed Layers:** `surface_container_low` (#131b2e) - Used for passive areas like background chat history.
*   **Elevated Layers:** `surface_container_high` (#222a3d) - Used for active code blocks or "In-Focus" AI responses.

### The "Glass & Gradient" Rule
To inject "soul" into the machine, use the **Kinetic Accent**:
*   **Gradients:** Use a linear transition from `primary` (#c0c1ff) to `secondary` (#d0bcff) at a 135-degree angle for primary CTAs and active state indicators.
*   **Glassmorphism:** For floating modals or "Command Palettes," use `surface_container_highest` (#2d3449) with a 60% opacity and a `24px` backdrop-blur. This creates a "frosted obsidian" effect that maintains the futuristic developer vibe.

---

### 3. Typography: The Editorial Tech-Stack
We utilize **Inter** not as a generic sans-serif, but as a high-contrast editorial face.

*   **Display Scales (Large & Precise):** Use `display-lg` (3.5rem) for empty-state greetings. This should feel like a headline in a high-end magazine—bold, confident, and spaced with `tight` letter-spacing.
*   **The Code-Instruction Balance:** Use `title-md` (1.125rem) for AI prompts to ensure they feel authoritative. 
*   **Labels:** `label-sm` (0.6875rem) must be used in `on_surface_variant` (#c7c4d7) with `0.05rem` letter-spacing for metadata (e.g., token count, timestamp), creating a "technical blueprint" aesthetic.

---

## 4. Elevation & Depth
Depth is not a shadow; it is a **Tonal Layering Principle**.

*   **Ambient Shadows:** Avoid "Drop Shadows." If a floating element (like a context menu) requires separation, use a shadow with a `40px` blur, `0%` spread, and color `background` at 40% opacity. It should feel like a soft glow of darkness.
*   **The Ghost Border Fallback:** Only if accessibility contrast ratios fail, apply a "Ghost Border": `outline_variant` (#464554) at **15% opacity**. This provides a hint of a boundary without interrupting the "Obsidian" flow.
*   **Luminescence:** Use the `primary_fixed_dim` (#c0c1ff) for a subtle inner-glow on active input fields to simulate a powered-on hardware device.

---

## 5. Components

### The "Command" Input (Input Fields)
*   **Style:** No background. A simple `surface_container_highest` bottom-heavy gradient.
*   **State:** When focused, the "Ghost Border" becomes a `1px` gradient of `primary` to `secondary`. 
*   **Typography:** Text enters at `body-lg` to prioritize readability during long-form prompting.

### Logic Blocks (Cards & Code Containers)
*   **Rule:** Forbid divider lines. 
*   **Implementation:** Code blocks use `surface_container_lowest` (#060e20) with a `xl` (0.75rem) corner radius. The contrast between the code background and the chat surface provides the necessary containment.

### Action Triggers (Buttons)
*   **Primary:** A vibrant gradient of `primary_container` (#8083ff) to `secondary_container` (#571bc1). No border. White text (`on_primary`).
*   **Secondary/Ghost:** No background. Text color `primary`. On hover, a subtle `surface_bright` (#31394d) background fades in at 200ms.

### AI Status Chips
*   Small, pill-shaped (`full` roundedness).
*   Use `tertiary_container` (#9b7fed) with `on_tertiary_container` text for "Processing" states. The violet hue signifies the "Thinking" phase of the AI.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use extreme vertical white space. If you think a section needs more room, double the padding.
*   **Do** use `on_surface_variant` (#c7c4d7) for secondary text to create a clear visual hierarchy against the `primary` white text.
*   **Do** animate transitions using `cubic-bezier(0.16, 1, 0.3, 1)` (the "Expo Out" curve) for a snappy, high-end feel.

### Don’t
*   **Don’t** use pure white (#ffffff). It burns the eyes in a dark developer environment. Use `on_surface` (#dae2fd).
*   **Don’t** use 1px dividers to separate chat messages. Use an extra `2rem` of vertical spacing instead.
*   **Don’t** use standard "Success Green" or "Warning Yellow" unless absolutely critical for errors. Keep the interface within the indigo/violet/slate spectrum to maintain the "Sovereign" identity.

---

## 7. Signature Interaction: The "Pulse"
When the AI is generating code, the background of the code container should subtly pulse between `surface_container_low` and `surface_container_high`. This provides "System Vitality" without the need for a distracting loading spinner, maintaining the futuristic, minimal elegance of the tool.