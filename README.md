# LUNAR SHIFT — Junior Astronaut Mission Trainer

LUNAR SHIFT is a browser-based planetary mission campaign built with React, Vite, and Three.js. It turns spaceflight engineering into five short, playable challenges for junior astronauts.

## What's in the campaign

1. **Moon landing** — land on an airless world using powered descent. Control thrust, cancel lateral drift, and deploy landing legs near touchdown.
2. **Mars entry and landing** — manage atmospheric heating, deploy a parachute inside a limited altitude window, separate the heat shield, then use powered descent.
3. **Titan probe descent** — guide a robotic probe through Titan's dense nitrogen-rich atmosphere. Deploy a drogue chute and then a main parachute at the right altitudes while correcting crosswind.
4. **Mars rover sample run** — drive a 3D rover through a crater field, stop beside three targets, drill and cache rock cores, then return to the lander before the battery runs out.
5. **Lunar outpost power crisis** — allocate a limited power budget across life support, greenhouse food production, radiation shelter, and communications during three changing emergencies.

The landing and rover environments are rendered in real-time 3D with Three.js. The campaign briefing, telemetry, controls, and debrief screens are built in React/CSS.

## Controls

### Landing missions

- **W / Up Arrow / Space** — thrust (in addition to the throttle slider)
- **A / Left Arrow** — correct left drift
- **D / Right Arrow** — correct right drift
- **E** — deploy landing legs when the altitude window opens
- **P** — deploy the Mars parachute
- **J** — jettison the Mars heat shield after parachute deployment
- **1** — deploy Titan drogue chute
- **2** — deploy Titan main parachute

Use the on-screen controls on touch devices.

### Mars rover

- **W / Up Arrow** — drive forward
- **S / Down Arrow** — reverse
- **A / Left Arrow** — steer left
- **D / Right Arrow** — steer right
- **E** — drill a rock core when stopped within range

The rover must collect all three cores and return to the lander. Crater impacts cost battery.

### Lunar outpost

Adjust the power sliders. Keep total allocation within the available budget and meet the minimum power requirement for critical systems. The minimum needs change with the emergency of the day.

## Run locally

Requires Node.js 20.19+ or 22.12+ (the current Vite runtime requirement).

```bash
npm install
npm run dev
```

Vite prints a local address, usually `http://localhost:5173`.

## Tests and production build

```bash
npm test
npm run build
npm run preview
```

Vite writes the production build to `dist/`.

## Deploy to Vercel

Import the GitHub repository into Vercel and use:

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

No backend or environment variables are required.

## Science references

- [NASA Space Apps 2026 — Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)
- [NASA — Mars in a Minute: How Do You Land on Mars?](https://science.nasa.gov/resource/mars-in-a-minute-how-do-you-land-on-mars/)
- [NASA — Titan facts](https://science.nasa.gov/saturn/moons/titan/facts/)
- [NASA — Perseverance rover components and sampling system](https://science.nasa.gov/mission/mars-2020-perseverance/rover-components/)
- [NASA — Lunar and Mars entry, descent, and landing challenges](https://www.nasa.gov/wp-content/uploads/2024/12/acr24-compiled-white-papers.pdf)

The outpost power challenge is included to address the Space Apps brief's core learning goal: balancing life support, radiation protection, power, and food production. All flight dynamics, altitude windows, forces, rates, resource levels, and scores in this game are simplified educational gameplay models. They are not real spacecraft specifications, mission procedures, or operational guidance.

## Suggested team split

1. Flight dynamics and balancing — `src/components/LandingChallenge.jsx`, `src/campaign/missions.js`
2. 3D scene and graphics — `src/components/ThreeWorld.jsx`
3. Rover controls and sample mission — `src/components/RoverChallenge.jsx`
4. Outpost strategy and scoring — `src/components/OutpostChallenge.jsx`
5. React screens, UI and responsive styling — `src/screens/`, `src/campaign/campaign.css`, `src/styles.css`
6. Science verification, test runs, GitHub, Vercel and demo capture — `src/campaign/missions.js`, `README.md`
