# Changelog

## 1.0.0 — 3D Planetary Mission Campaign

### New
- Reframed the experience as five short, skill-based campaign missions instead of a mostly static management dashboard.
- Added real-time 3D planetary environments rendered with Three.js.
- Added an interactive Moon powered-descent challenge with thrust, drift correction, and landing-leg deployment.
- Added Mars atmospheric entry with heat management, parachute deployment timing, heat-shield separation, powered descent, and landing legs.
- Added Titan probe descent with sequential drogue/main parachute timing and crosswind correction.
- Added a 3D Mars rover traverse with steering, crater collision penalties, battery management, three drillable rock-core targets, and return-to-lander objective.
- Retained a simplified lunar outpost power-allocation challenge covering life support, food production, radiation shelter, and communications.
- Added difficulty selection, mission briefings, retry flow, debrief scores, campaign progress, and science explanations.

### Technical
- Added Three.js as an application dependency.
- Updated documentation for controls, local development, tests, Vercel deployment, and NASA science references.
- Kept the app as a static React/Vite site; no backend or environment variables are needed.

### Science note
All in-game dynamics and mission thresholds are simplified for education and gameplay. They are not real spacecraft specifications or operational procedures.
