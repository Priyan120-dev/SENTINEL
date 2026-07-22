# Design System: SENTINEL Command Cockpit

## 1. Visual Theme & Atmosphere
A hyper-dense, clinical, and authoritative interface designed for high-stress operational environments. Layouts are strictly gridded, asymmetrical when prioritizing map data, and rely on 1px structural borders rather than drop shadows. The atmosphere is objective and analytical — like a military-grade intelligence terminal.

## 2. Color Palette & Roles
- **Abyss Canvas** (#09090b) — Primary background surface (Zinc-950)
- **Structural Panel** (#18181b) — Data grid cells and sidebar containers (Zinc-900)
- **High-Contrast Ink** (#fafafa) — Primary text, critical data (Zinc-50)
- **Muted Steel** (#a1a1aa) — Secondary text, metadata, table headers (Zinc-400)
- **Precision Border** (rgba(255, 255, 255, 0.1)) — Structural lines, 1px dividers
- **Tactical Rose** (#e11d48) — Primary accent for critical alerts, hotspots, and active focus states.

## 3. Typography Rules
- **Display/UI:** `ui-sans-serif, system-ui, sans-serif` (Preferably Geist or SF Pro) — Track-tight (-0.02em), controlled scale. Hierarchy is driven by weight and color, not massive size.
- **Data/Mono:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas` (Preferably Geist Mono) — Mandatory for all metrics, lat/long coordinates, timestamps, and severity scores.
- **Bans:** No generic serifs. No `Inter` if a custom font is used. 

## 4. Component Stylings
* **Buttons:** Flat, brutalist. 4px (0.25rem) border-radius maximum. Accent border and fill for active states. 
* **Cards:** Eliminated. Replaced with flush, border-separated data grids or panels. No elevation shadows.
* **Inputs/Selects:** Flush borders, rigid geometry. Focus rings snap to Tactical Rose.
* **Badges:** Solid or 10% opacity fills with sharp 2px borders. No soft rounding.

## 5. Layout Principles
Grid-first architecture. 1px borders separate all adjacent panels. 
No absolute-positioned content stacking (except map controls, which must be docked rigidly).
Max-width containment is fluid but bounded. Zero flexbox percentage hacks.

## 6. Motion & Interaction
Zero decorative motion. 
State changes (hover/focus) use instant or 150ms transform/color snaps. 
No loading spinners; use skeleton structural grids. 

## 7. Anti-Patterns (Banned)
- No emojis anywhere.
- No `Inter` or generic serifs.
- No neon glows, box-shadows, or glassmorphism (backdrop-blur).
- No gradient text.
- No 3-column equal card layouts (prioritize asymmetrical data density).
- No rounded-2xl or rounded-full shapes except for true data nodes (e.g. map points).
- No overlapping layers without strict docked boundaries.
