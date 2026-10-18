# Design System: OmniLiving+

## 1. Visual Theme & Atmosphere
OmniLiving+ is an autonomous ambient living room and security copilot engineered for the Alexa+ ecosystem. The visual language balances **living room architectural calm** with **mission-critical cockpit density**. It feels like an executive home automation bridge: dark, tactile, calm, and hyper-responsive without visual noise.

* **Density Rating:** Cockpit Balanced (`7 / 10`) — High-information telemetry (camera feeds, JSON-RPC 2.0 packet streams, cardiac vitals) organized into clean, breathable modular panels.
* **Variance Rating:** Offset Asymmetric (`7 / 10`) — Primary media consumption stage (Fire TV 16:9 canvas) paired with peripheral edge-intelligence modules (Ring optical field, Bee wearable haptics, Alexa acoustic halo).
* **Motion Rating:** Fluid Spring Choreography (`7 / 10`) — Perpetual subtle micro-motion (breathing status indicators, acoustic wave rings, tactile button presses) with zero jarring linear transitions.

---

## 2. Color Palette & Functional Roles
The palette is rooted in deep obsidian and titanium neutrals, illuminated by a calibrated single amber accent and functional hardware telemetry indicators. Pure black (`#000000`) and generic neon gradients are strictly prohibited.

* **Obsidian Canvas** (`#0B0E14`) — Primary background surface across all viewports.
* **Titanium Base** (`#121824`) — Panel backgrounds and section scaffolding.
* **Elevated Midnight Surface** (`#1A2234`) — Interactive device cards, video containers, and tool dialogs.
* **Subtle Slate Border** (`rgba(71, 85, 105, 0.40)`) — 1px crisp structural division lines; never thick borders.
* **High-Contrast Text Primary** (`#F8FAFC`) — Primary headers, device names, and critical states.
* **Muted Cool Gray** (`#94A3B8`) — Body text, device metadata, descriptions, and labels.
* **Dim Charcoal Slate** (`#64748B`) — Subtext, inactive indicators, and breadcrumb markers.
* **Amazon Amber Flame** (`#FF9900`) — Singular primary brand accent for active CTAs, active scenario highlights, and focus indicators.
* **Alexa Cyan Glow** (`#00CAFF`) — Secondary functional indicator reserved strictly for Alexa+ speech synthesis, microphone listen states, and Streamable HTTP connection health.
* **Safety Emerald** (`#10B981`) — Verified secure states, healthy vitals, and passed automated tests.
* **Perimeter Warning Crimson** (`#EF4444`) — Night security intrusion alerts, tamper events, and emergency standstills.

---

## 3. Typography Architecture
Typography establishes hierarchy through weight, letter tracking, and spatial contrast rather than oversized font sizing.

* **Display & Headers:** `Outfit` (`sans-serif`, weights: 600, 700) — Tight letter-spacing (`-0.03em`), controlled scale, authoritative modern presence.
* **Body & Explanations:** `Geist` or `Satoshi` (`sans-serif`, weights: 400, 500) — Relaxed line height (`1.6`), max line width `65ch` for maximum legibility.
* **Telemetry, Metrics & Code:** `JetBrains Mono` (`monospace`, weights: 400, 500, 600) — Applied to all sensor values (heart rate, Wi-Fi RSSI, camera resolutions), JSON-RPC request/response payloads, and execution timestamps.
* **Strictly Banned:**
  * `Inter` is banned across the entire design system to avoid templated SaaS sameness.
  * Generic system serifs (`Times New Roman`, `Georgia`, `Garamond`) are permanently banned.
  * Pure uppercase body text is banned.

---

## 4. Hero & Main Experience Architecture
The hero section is not a marketing pitch; it is an active, living ecosystem console.

* **Asymmetric Split:** 65% width devoted to the **Living Room Stage** (Fire TV media playback and dynamic 1080p Picture-in-Picture overlay), 35% width dedicated to **Peripheral Edge Intelligence** (Ring live camera feed, Bee wearable telemetry, smart lock status).
* **Inline Telemetry Punctuation:** Small live indicator pills (`● 1080p 30fps`, `● IR Night Vision`, `● 72 BPM`) sit directly beside section headers at type-height, acting as visual punctuation.
* **No Overlapping Artifacts:** No floating text over vital controls; camera Picture-in-Picture insets dock into designated spatial viewports with precise 12px inset padding and 16px corner radii.
* **CTA Restraint:** Single primary trigger per context (e.g., **"Judge Auto-Pilot (90s Tour)"**). No redundant "Learn More" or secondary link clutter.
* **Banned Hero Elements:** "Scroll to explore", bouncing arrows, swipe-down text, and autoplay promotional carousels are strictly forbidden.

---

## 5. Component Stylings & Interaction States

### Buttons & Interactive Controls
* **Shape & Padding:** Generously rounded corners (`8px` to `12px`), horizontal padding `1.25rem`, vertical padding `0.65rem`.
* **Primary Button:** Solid Amazon Amber (`#FF9900`) fill, deep charcoal text (`#0B0E14`), bold weight (`600`).
* **Secondary / Ghost Button:** Transparent background, `1px` subtle slate border (`rgba(71, 85, 105, 0.4)`), primary text color (`#F8FAFC`).
* **Tactile Feedback:** `-1px` vertical translation (`transform: translateY(-1px)`) on hover, `0px` on active click. No neon outer glow shadows.
* **Focus State:** High-contrast `outline: 3px solid #FF9900` with `outline-offset: 2px` (WCAG 2.1 AA compliant).

### Device & Scenario Cards
* **Elevation & Borders:** Flat dark slate surface (`#1A2234`) with `1px` border (`rgba(71, 85, 105, 0.35)`). Shadows are diffused whisper ambient depths (`0 8px 24px -4px rgba(0, 0, 0, 0.4)`), never colored neon.
* **Card Headers:** Feature title in `Outfit` with status badge in `JetBrains Mono` aligned to top right.
* **Card Dividers:** Clean `1px` dividers with `rgba(255, 255, 255, 0.06)` spacing.

### Inputs & Toggles
* **Label Hierarchy:** Clear label positioned above input field in Muted Cool Gray (`#94A3B8`). Helper or unit text right-aligned.
* **Input Surface:** Dark inset fill (`#0F141C`), `1px` border, active focus transition to Amazon Amber border (`#FF9900`).
* **Toggle Switches:** Pill shape (`width: 44px`, `height: 24px`), smooth 180ms ease transition, high-contrast thumb indicator.

### Status Indicators & Loaders
* **Pill Badges:** Capsule shape (`rounded-full`), `font-family: JetBrains Mono`, uppercase 11px font size, subtle background tint (`15%` opacity of status color).
* **Skeletal Loaders:** Geometric pulsating skeleton matching exact card dimensions; no generic circular spinners.
* **Empty States:** Composed diagnostic cards explaining exact state and providing a 1-click recovery button (e.g., "Reset Device Defaults").

---

## 6. Layout Principles
* **Grid Architecture:** 12-column responsive CSS Grid for structural layout. Avoid arbitrary percentage flexbox calculations.
* **Container Bounds:** Maximum container width constrained to `1440px` centered on screen with minimum `1.5rem` edge gutters.
* **Vertical Rhythm:** Modular spacing scale (`0.5rem`, `1rem`, `1.5rem`, `2rem`, `3rem`). Large section transitions use `clamp(2rem, 5vw, 4rem)`.
* **Full-Height Compliance:** Screen-fitting containers utilize `min-height: 100dvh` (never `100vh` to prevent iOS and mobile browser viewport jump).

---

## 7. Responsive Rules
* **Mobile Collapse (`< 768px`):** All multi-column device layouts collapse to single-column vertical flow with full touch parity.
* **Touch Targets:** All buttons, scenario triggers, and device toggles maintain a minimum interactive hit area of `44px × 44px`.
* **Zero Horizontal Scroll:** Explicit `overflow-x: hidden` constraint at root body level.
* **Typography Fluidity:** Section headers scale smoothly using CSS `clamp()` (e.g., `font-size: clamp(1.25rem, 3vw, 2rem)`).
* **Navigation Adaptability:** Persistent top scenario bar on desktop adapts to compact horizontal scrollable tab strip on mobile.

---

## 8. Motion & Micro-Interaction Philosophy
* **Spring Physics Baseline:** Transitions utilize spring parameters (`stiffness: 120`, `damping: 18`) for weighty, tactile authority. Linear easing is forbidden.
* **Perpetual Micro-Interactions:**
  * **Alexa Halo:** Continuous organic breathing cycle (`opacity: 0.7` to `1.0` over `3s`) during active listening.
  * **Ring Optical Sensor:** Subtle 2-second pulse on active motion zone detection.
  * **Bee Wearable:** Tactile double-pulse vibration animation (`scale(1.04)`) when haptic feedback triggers.
* **Performance Safeguards:** All animations execute strictly on `transform` and `opacity` properties to guarantee 60fps GPU acceleration.
* **Accessibility (`prefers-reduced-motion`):** All infinite loops and scale transforms gracefully fall back to static opacity changes when reduced motion is preferred.

---

## 9. Anti-Patterns (Strictly Banned)
1. **No Emojis in Core UI:** Replace emojis with crisp, lightweight SVG iconography (Lucide / Phosphor vector icons).
2. **No `Inter` Font:** Eliminates generic SaaS boilerplate appearance.
3. **No Pure Black (`#000000`):** Use deep charcoal and obsidian tones (`#0B0E14`, `#121824`) for richer visual depth.
4. **No Purple / Neon AI Glows:** Strictly avoid the generic "AI gradient" clichés (purple/pink neon glow). Use authoritative amber, cyan, and emerald.
5. **No 3-Column Equal Cards:** Do not present features in repetitive identical 3-box rows. Use structured asymmetrical grids.
6. **No AI Copywriting Clichés:** Ban words like *"Elevate"*, *"Unleash"*, *"Seamless"*, *"Next-Gen"*, and *"Supercharge"*. Use concrete technical verbs (*"Ducks Fire TV audio"*, *"Verifies deadbolt"*, *"Dispatches MCP payload"*).
7. **No Overlapping Elements:** Content must never visually collide with or stack haphazardly over other active elements.
8. **No Placeholder Names or Broken Links:** Use verified hardware references (Fire TV Stick 4K, Ring Pro 2, Bee Wearable BLE).
