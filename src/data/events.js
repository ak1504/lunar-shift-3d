export const EVENTS = [
  {
    id: 'solar-flare',
    icon: '☀️',
    tag: 'RADIATION ALERT',
    title: 'Solar particle event detected',
    description: 'Mission Control detects a burst of energetic particles from the Sun. The crew needs to respond before continuing outdoor work.',
    science: 'A solar particle event can increase radiation exposure. A mission plan should include monitoring, warning procedures, and a protected place for the crew.',
    choices: [
      { id: 'shelter', label: 'Move everyone into the shelter', detail: 'Pause outdoor work and protect the crew.', effects: { power: -7, health: 5, morale: 2 }, outcome: 'The crew shelters safely. Outdoor science is paused, but the team is protected.' },
      { id: 'supplies', label: 'Reinforce the shelter with supplies', detail: 'Use stored supplies to improve shielding.', effects: { food: -5, water: -3, health: 8, morale: 1 }, outcome: 'Supplies are arranged around the shelter. The crew feels safer, but stores are lower.' },
      { id: 'risk', label: 'Continue the outdoor task', detail: 'Gain science now, but accept a crew risk.', effects: { health: -18, science: 8, morale: -5 }, outcome: 'The team collects useful data, but the crew takes a radiation-exposure penalty.' }
    ]
  },
  {
    id: 'dust',
    icon: '🌫️',
    tag: 'POWER WARNING',
    title: 'Dust is covering the solar panels',
    description: 'A dust plume has reduced the array output. You need to decide how to recover power generation.',
    science: 'Lunar dust is abrasive and electrostatically clingy. Dust management is an important engineering consideration for surface equipment.',
    choices: [
      { id: 'clean', label: 'Run the panel-cleaning system', detail: 'Spend stored power to restore generation.', effects: { power: -9, science: 3 }, flags: { solarBoost: 1 }, outcome: 'The panels are cleaned. The array will produce extra power next cycle.' },
      { id: 'wait', label: 'Wait for conditions to improve', detail: 'Save resources, but accept reduced solar output.', effects: { morale: -2 }, flags: { solarPenalty: 1 }, outcome: 'The crew waits. Power generation remains reduced for the next cycle.' },
      { id: 'shed', label: 'Switch off non-essential systems', detail: 'Protect the battery by pausing the greenhouse.', effects: { food: -3, power: 4 }, flags: { greenhouseOffNext: true }, outcome: 'Non-essential loads are paused to protect the battery.' }
    ]
  },
  {
    id: 'leak',
    icon: '💧',
    tag: 'MAINTENANCE ALERT',
    title: 'Water line leak detected',
    description: 'A connector near the recycler is leaking. A quick repair could save water, but it will use crew time and resources.',
    science: 'Closed-loop life-support systems need monitoring, filtration, and maintenance. Recovering water reduces the need to carry as much from Earth.',
    choices: [
      { id: 'repair', label: 'Repair the connector', detail: 'Use stored energy and science know-how.', effects: { power: -5, science: -4, water: 12 }, outcome: 'The crew replaces the connector and recovers the water line.' },
      { id: 'isolate', label: 'Isolate the damaged section', detail: 'Limit the leak and keep the rest working.', effects: { water: -4, power: -2 }, flags: { recyclerPenalty: 1 }, outcome: 'The leak is contained, but the recycler will work less efficiently next cycle.' },
      { id: 'ignore', label: 'Leave it for later', detail: 'Keep working now, lose more water.', effects: { water: -15, morale: -4 }, outcome: 'The leak continues and the crew loses valuable water.' }
    ]
  },
  {
    id: 'greenhouse',
    icon: '🌱',
    tag: 'CROP ALERT',
    title: 'Greenhouse seedlings are stressed',
    description: 'The seedlings are growing slowly. They need attention, but increasing grow-light time will draw more power.',
    science: 'Space plant-growth systems control light, water, nutrients, airflow, and other conditions. Growing food in space is both a technology and biology challenge.',
    choices: [
      { id: 'lights', label: 'Increase grow-light time', detail: 'Use power to support plant growth.', effects: { power: -9, food: 9, morale: 2 }, outcome: 'The plants receive extra light and begin recovering.' },
      { id: 'water', label: 'Adjust the water schedule', detail: 'Use a little extra water instead of power.', effects: { water: -7, food: 5 }, outcome: 'The crew adjusts the watering schedule. The seedlings improve.' },
      { id: 'save', label: 'Conserve resources', detail: 'Accept slower growth and protect reserves.', effects: { food: -4, power: 3 }, outcome: 'The greenhouse remains stable, but the harvest is delayed.' }
    ]
  }
];
