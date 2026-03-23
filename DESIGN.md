# Design System Document: Holiday Minigame Experience

## 1. Overview & Creative North Star: "The Festive Effervescence"
This design system is engineered to transform a standard mobile puzzle game into a premium, celebratory brand event. Our Creative North Star is **"Festive Effervescence"**—a style that marries the creamy, comforting ritual of bubble tea with the high-octane energy of a national holiday.

To move beyond "template" gaming UI, we employ **Kinetic Layering**. This means breaking the rigid 12-column grid in favor of intentional asymmetry: puzzle pieces that "float" with soft-body physics, overlapping headers that break container boundaries, and a typography scale that favors dramatic contrast. We aren't just building a game; we are building a digital festival.

---

### 2. Colors: Tonal Depth & Warmth
Our palette transitions from the milky, sophisticated neutrals of Maycha’s base brand into the fiery reds and golden ambers of the 30/4 - 1/5 celebrations.

* **Primary Identity:** `primary` (#b71029) acts as our "Celebration Red," used for high-stakes UI like timers and win states.
* **The Tea Core:** `secondary` (#795500) and `secondary_container` (#ffc967) reflect the golden-brown hues of perfectly brewed tea.
* **Surface Logic:** We utilize `surface` (#fcf6ed) as our "Creamy Canvas."

#### The "No-Line" Rule
**Borders are strictly prohibited for sectioning.** To separate a leaderboard from the game board, do not use a 1px stroke. Instead, use a background shift—place a `surface_container_low` section directly against a `surface` background. The human eye perceives the change in luminosity as a structural boundary, creating a cleaner, more high-end editorial feel.

#### Glass & Gradient Rule
For the "Speed Jigsaw" interface, use **Glassmorphism** for floating HUD elements (Heads-Up Display). Apply `surface_container_lowest` at 70% opacity with a `24px` backdrop blur.
* **Signature Texture:** Main Action Buttons must use a linear gradient from `primary` (#b71029) to `primary_container` (#ff7576) at a 135-degree angle to simulate a "glossy" liquid finish.

---

### 3. Typography: Playful Authority
We pair the geometric friendliness of **Plus Jakarta Sans** with the rhythmic readability of **Be Vietnam Pro**.

* **Display (The Hook):** `display-lg` (3.5rem) is reserved for "YOU WIN" or "GAME OVER" states. It should always use `primary` color and a tight letter-spacing (-0.02em).
* **Headlines (The Energy):** `headline-md` (1.75rem) drives the game’s momentum (e.g., "Level 05," "New Record!").
* **Body (The Detail):** `body-lg` (1rem) in **Be Vietnam Pro** ensures that prize descriptions and terms are legible even during high-speed gameplay.
* **Labels (The Stats):** `label-md` (0.75rem) in **Plus Jakarta Sans** is used for secondary metadata, like "Time Remaining" or "Pieces Left."

---

### 4. Elevation & Depth: Tonal Layering
In this design system, elevation is a product of light and color, not heavy shadows.

* **The Layering Principle:**
* Base: `surface`
* Lower Content Cards: `surface_container_low`
* Interactive Game Pieces: `surface_container_highest`
* **Ambient Shadows:** For "floating" puzzle pieces, use a shadow with a 20px blur, 0px spread, and 6% opacity using the `on_surface` color. This creates a natural "lift" that feels like the piece is hovering just above the tea surface.
* **The Ghost Border:** If an element requires more definition (like an empty puzzle slot), use the `outline_variant` token at **15% opacity**. Never use a solid, high-contrast line.

---

### 5. Components: Fluid & Tactile
Components must feel "juicy" and responsive to touch, mirroring the "Speed Jigsaw" theme.

* **Buttons (The Glossy Variant):**
* **Primary:** Gradient of `primary` to `primary_container`. Corner radius: `full` (9999px). Includes a subtle white inner-glow (top 2px) to create the "glossy" effect requested.
* **Secondary:** `surface_container_highest` background with `on_surface` text. Corner radius: `xl` (3rem).
* **The Jigsaw Tile:**
* Use `surface_container_highest` with a `md` (1.5rem) roundedness.
* Active State: When a piece is dragged, scale it by 1.05x and apply the Ambient Shadow.
* **Input Fields:**
* For phone number/OTP entry: Use `surface_container` with no border. On focus, transition the background to `surface_container_high` and add a 2px "Ghost Border" of `primary` at 30% opacity.
* **Progress Bars:**
* Track: `surface_container_highest`.
* Fill: `tertiary_fixed` (#ff973e) to represent the "brewing" progress.
* **Cards & Lists:**
* **No Dividers.** Separate list items using the `4` (1rem) spacing scale. Use alternating `surface_container_low` and `surface` backgrounds for list rows if high-density data is required.

---

### 6. Do’s and Don'ts

#### Do:
* **Embrace Asymmetry:** Let puzzle pieces or decorative tea leaves bleed off the edges of the screen to create a sense of scale.
* **Use Tonal Shifts:** Always check if a background color change can replace a border.
* **Prioritize Reachability:** Keep the main jigsaw interaction area within the bottom 60% of the mobile screen.

#### Don't:
* **Don't use Pure Black:** Use `on_surface` (#312e29) for text to maintain a warm, organic feel.
* **Don't use 1px Dividers:** They shatter the premium, "app-like" feel of the game and make it look like a legacy web form.
* **Don't use Sharp Corners:** The minimum roundedness for any interactive element is `sm` (0.5rem); however, `DEFAULT` (1rem) and `xl` (3rem) are preferred for the "Speed Jigsaw" theme to keep the vibe friendly and festive.