---
name: hemea-design
description: Use this skill to generate well-branded interfaces and assets for Héméa (mobile app for personal biological-analysis tracking, French market), either for production or throwaway prototypes/mocks/decks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files:

- `colors_and_type.css` — copy this verbatim into any HTML artifact for instant brand-correct tokens (CSS custom properties + utility classes for `hemea-h1`, `hemea-body`, etc).
- `assets/` — logos, app icons, wordmarks. Copy what you need into your output; never re-draw the Héméa drop logo by hand.
- `preview/*.html` — reference cards for every brand surface (colors, type, components). Use them as visual specs when you build new screens.
- `ui_kits/mobile/` — full React + Babel recreation of the app. Lift `components.jsx` (TabBar, AnalysisCard, StatCard, ListRow, ListSection, Banner, PrimaryButton, GlassFAB, HemeaWordmark, ScreenHeader) and the per-screen JSX as starting points.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy the assets you need out of this skill and create static HTML files. If working on production code (React Native / Expo), use the rules here to stay brand-correct and read the codebase at https://github.com/YHallouard/LaBI for actual component implementations.

If the user invokes this skill without other guidance, ask them what they want to build, ask a few clarifying questions (audience, surface, fidelity, language — the brand is French-first), and act as an expert designer who outputs HTML artifacts or production code, depending on the need.

### Non-negotiables

- French copy only. No emoji. Ionicons-style outline iconography. Tabular nums on all lab values.
- Light mode only. Never invent a dark theme.
- The brand gradient (red → magenta → purple) is reserved for the logo droplet. Never use it as a button or background.
- Glassmorphism is iOS-only behaviour; provide a fallback for Android (opaque white at 0.85).
- Reference-range band in charts must be a soft gradient with feathered horizontal edges — never a hard outline.
