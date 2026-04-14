# Design System Strategy: The Synthetic Intelligence Interface

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Architect."** 

This is not a static dashboard; it is a living, breathing environment that feels like an extension of the user’s cognitive process. Inspired by high-end avionics and cinematic HUDs, we are moving away from the "boxy" web to an interface defined by depth, luminescence, and modularity. 

To break the "template" look, we utilize **Intentional Asymmetry**. Significant data points should occupy larger, non-uniform glass panes, while auxiliary information is tucked into high-density "monospaced" clusters. We treat the screen not as a flat surface, but as a multi-layered projection where elements overlap, creating a sense of sophisticated machinery humming just beneath the glass.

---

## 2. Colors: The Luminescent Spectrum
The palette is rooted in the void (`#111319`), using light not as a filler, but as a functional tool.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for structural sectioning. Boundaries are defined by:
1.  **Tonal Shifts:** Placing a `surface-container-high` element against a `surface-dim` background.
2.  **Edge Glows:** Utilizing the `primary` and `secondary` tokens as inner-shadow glows (2-4px blur) to define edges without "cutting" the layout with lines.

### Surface Hierarchy & Nesting
We use a "Physical Stack" mental model:
*   **Base Layer:** `surface-dim` (#111319) — The deep space background.
*   **Secondary Panes:** `surface-container-low` (#191c21) — Floating functional areas.
*   **Active Elements:** `surface-container-highest` (#32353b) — The most prominent interactive cards.
*   **Nesting:** High-density data clusters should sit in `surface-container-lowest` (#0b0e13) "cut-outs" within a `surface-container` layer to create a "sunk-in" look, mimicking a hardware chassis.

### The "Glass & Gradient" Rule
Floating panels must use **Glassmorphism**. Apply `surface` colors at 40-60% opacity with a `backdrop-filter: blur(24px)`. Main CTAs and high-priority AI statuses should utilize a linear gradient from `primary` (#c3f5ff) to `secondary_container` (#7000ff) to provide a "charged" energy that flat colors cannot replicate.

---

## 3. Typography: Precision & Scale
We pair the high-tech utility of **Space Grotesk** with the refined legibility of **Inter**.

*   **Display & Headlines (Space Grotesk):** Used for data visualization headers and AI status updates. The wide apertures and geometric forms evoke a "NASA-spec" feel.
*   **Body & Titles (Inter):** Used for chat logs and long-form AI explanations. Inter provides the premium "SaaS" polish necessary for readability.
*   **Labels (Space Grotesk):** All technical metadata, timestamps, and "monospaced-style" data readouts must use `label-sm` or `label-md` in uppercase with increased letter-spacing (0.05em) to mimic telemetry.

---

## 4. Elevation & Depth: Tonal Layering
In this design system, shadows do not represent "light from above," but "energy from within."

*   **The Layering Principle:** Avoid shadows for static cards. Instead, use the `surface-container` scale. A `surface-container-high` card on a `surface-dim` background creates a natural, sophisticated lift.
*   **Ambient Shadows:** For floating modals, use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 218, 243, 0.08)`. The shadow color is a tinted version of `surface_tint` (#00daf3) to simulate an ambient cyan glow.
*   **The "Ghost Border" Fallback:** If a container requires definition against a complex background, use a 1px border with `outline-variant` (#3b494c) at **15% opacity**.
*   **Glow States:** Interactive elements in a "hover" or "active" state should emit a `primary` or `secondary` outer glow (4-12px blur) to simulate the illumination of a physical HUD.

---

## 5. Components: The High-Tech Toolkit

### Buttons
*   **Primary:** A gradient fill (`primary` to `primary_fixed_dim`) with `on_primary` text. No border. Apply a subtle 4px blur glow in the `primary` color.
*   **Secondary (Glass):** `surface-variant` at 20% opacity with a 1px "Ghost Border."
*   **Tertiary:** Text-only using `primary_fixed`, uppercase, with a 2px bottom-bar that expands on hover.

### Input Fields
*   **Style:** Minimalist. No background fill—only a bottom border using `outline_variant`. 
*   **Focus State:** The bottom border transitions to `primary` with a 4px soft glow, and the label (`label-sm`) shifts to `surface_tint`.

### Data Chips
*   **Style:** `surface-container-highest` background, `DEFAULT` (0.25rem) radius.
*   **Detail:** Add a 2px solid vertical accent of `secondary` on the left edge of the chip to signify "Active" status.

### AI Processing Cards
*   **Layout:** Forbid dividers. Use vertical spacing (1.5rem) and subtle background shifts (`surface-container-low` to `surface-container-high`) to separate the "Prompt" from the "Response."
*   **Glass Overlays:** AI suggestions should float over the main interface using the high-blur Glassmorphism rule.

### Technical Telemetry (Unique Component)
*   Small, repeating blocks of `label-sm` text that display system health or "processing logs." These should be set in `on_surface_variant` (#bac9cc) to provide texture without distracting from the primary AI interaction.

---

## 6. Do's and Don'ts

### Do:
*   **Use Asymmetry:** Place a large AI response pane next to a series of small, vertically stacked telemetry modules.
*   **Embrace the Glow:** Use glows sparingly to draw attention to "live" or "active" states (e.g., a pulsing cyan dot for the microphone).
*   **Layer with Blur:** Use backdrop-blur on all floating panels to maintain a sense of environmental depth.

### Don't:
*   **Don't use 100% white:** Use `on_background` (#e1e2ea) for text to prevent "retina burn" against the deep dark theme.
*   **Don't use hard borders:** Avoid high-contrast, opaque lines. They shatter the "projection" illusion.
*   **Don't crowd the UI:** This system requires "Breathing Room." Sophistication is found in the space between the data.
*   **Don't use default shadows:** Never use a black or grey shadow. If it doesn't have a hint of the `primary` or `secondary` hue, it doesn't belong in this system.