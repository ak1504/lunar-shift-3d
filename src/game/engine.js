import { EVENTS } from '../data/events.js';

export const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));

export function createInitialGameState(difficulty = 'cadet') {
  const settings = {
    cadet: { oxygen: 94, water: 92, food: 90, power: 90, eventChance: 0.32, hint: true },
    engineer: { oxygen: 88, water: 84, food: 82, power: 82, eventChance: 0.48, hint: false },
    commander: { oxygen: 82, water: 76, food: 76, power: 74, eventChance: 0.62, hint: false }
  }[difficulty] || { oxygen: 88, water: 84, food: 82, power: 82, eventChance: 0.48, hint: false };

  return {
    difficulty,
    cycle: 1,
    maxCycles: 10,
    resources: {
      oxygen: settings.oxygen,
      water: settings.water,
      food: settings.food,
      power: settings.power,
      science: 0
    },
    crew: { health: 100, morale: 82 },
    buildings: {
      habitat: { level: 1, active: true },
      solar: { level: 1, active: true },
      recycler: { level: 1, active: true },
      greenhouse: { level: 1, active: true },
      shelter: { level: 1, active: true },
      rover: { level: 1, active: true }
    },
    flags: { solarBoost: 0, solarPenalty: 0, recyclerPenalty: 0, greenhouseOffNext: false },
    tasks: { habitat: false, solar: false, recycler: false, greenhouse: false, shelter: false, rover: false },
    fieldItemsCollected: [],
    fieldMissionComplete: false,
    objectives: {},
    eventLog: ['Mission started. Outpost systems are online.'],
    currentEvent: null,
    lastEventId: null,
    eventChance: settings.eventChance,
    gameOver: false,
    missionStatus: 'active',
    lastOutcome: null,
    roverSorties: 0
  };
}

function checkFailure(state) {
  const critical = ['oxygen', 'water', 'food'].some((key) => state.resources[key] <= 0);
  if (critical) state.crew.health = clamp(state.crew.health - 14);
  if (state.crew.health <= 0) {
    state.crew.health = 0;
    state.gameOver = true;
    state.missionStatus = 'failed';
    state.eventLog.unshift('Mission ended: crew health reached a critical level.');
  }
}

export function getObjectives(state) {
  const tasks = state.tasks || {};
  return [
    { id: 'crew', label: 'Keep crew health above 65%', complete: state.crew.health >= 65, value: `${Math.round(state.crew.health)}%` },
    { id: 'power', label: 'Finish with at least 25 power', complete: state.resources.power >= 25, value: `${Math.round(state.resources.power)}%` },
    { id: 'food', label: 'Maintain at least 30 food', complete: state.resources.food >= 30, value: `${Math.round(state.resources.food)}%` },
    { id: 'science', label: 'Collect 25 science points', complete: state.resources.science >= 25, value: `${state.resources.science} pts` },
    { id: 'solar-task', label: 'Calibrate the solar array', complete: Boolean(tasks.solar), value: tasks.solar ? 'FIELD TASK DONE' : 'FIELD TASK' },
    { id: 'water-task', label: 'Repair the water recycler', complete: Boolean(tasks.recycler), value: tasks.recycler ? 'FIELD TASK DONE' : 'FIELD TASK' },
    { id: 'crop-task', label: 'Grow the first greenhouse crop', complete: Boolean(tasks.greenhouse), value: tasks.greenhouse ? 'HARVEST READY' : 'FIELD TASK' },
    { id: 'sample-task', label: 'Collect a lunar soil sample', complete: Boolean(tasks.rover), value: tasks.rover ? 'SAMPLE SECURED' : 'ROVER MISSION' },
    { id: 'eva-samples', label: 'Recover two lunar soil samples', complete: (state.fieldItemsCollected || []).filter((id) => id.startsWith('sample-')).length >= 2, value: `${(state.fieldItemsCollected || []).filter((id) => id.startsWith('sample-')).length}/2 recovered` },
    { id: 'eva-beacon', label: 'Scan the surface signal beacon', complete: (state.fieldItemsCollected || []).includes('signal-beacon'), value: (state.fieldItemsCollected || []).includes('signal-beacon') ? 'DATA UPLOADED' : 'SIGNAL NOT SCANNED' },
    { id: 'eva-extraction', label: 'Return safely through the airlock', complete: Boolean(state.fieldMissionComplete), value: state.fieldMissionComplete ? 'EVA COMPLETE' : 'EXTRACTION PENDING' }
  ];
}

export function completeFacilityTask(currentState, buildingId) {
  const state = structuredClone(currentState);
  if (!state.tasks) state.tasks = { habitat: false, solar: false, recycler: false, greenhouse: false, shelter: false, rover: false };
  if (!(buildingId in state.tasks) || state.tasks[buildingId]) return currentState;
  const rewards = {
    habitat: { oxygen: 16, health: 5, science: 4, message: 'Habitat air-loop diagnostic passed. Cabin circulation restored.' },
    solar: { power: 20, science: 8, message: 'Solar array calibrated. Power collection improved.' },
    recycler: { water: 20, science: 8, message: 'Water recycler repaired. The recovery loop is flowing again.' },
    greenhouse: { food: 18, science: 6, morale: 5, message: 'First greenhouse harvest collected. Fresh food is ready for the crew.' },
    shelter: { health: 8, morale: 8, science: 4, message: 'Radiation shelter drill completed. Crew response time improved.' },
    rover: { power: -8, science: 18, morale: 4, message: 'Lunar sample secured by rover. Science data uploaded to the outpost.' }
  }[buildingId];
  if (!rewards) return currentState;
  state.tasks[buildingId] = true;
  Object.entries(rewards).forEach(([key, amount]) => {
    if (key === 'message') return;
    if (key === 'health' || key === 'morale') state.crew[key] = clamp(state.crew[key] + amount);
    else if (key === 'science') state.resources.science += amount;
    else state.resources[key] = clamp(state.resources[key] + amount);
  });
  if (buildingId === 'rover') state.roverSorties += 1;
  state.eventLog.unshift(rewards.message);
  state.eventLog = state.eventLog.slice(0, 6);
  return state;
}

function pickEvent(previousEventId) {
  const pool = EVENTS.filter((event) => event.id !== previousEventId);
  return pool[Math.floor(Math.random() * pool.length)];
}


export function collectFieldItem(currentState, itemId) {
  const state = structuredClone(currentState);
  if (!state.fieldItemsCollected) state.fieldItemsCollected = [];
  if (state.fieldItemsCollected.includes(itemId)) return currentState;
  const rewards = {
    'sample-west': { science: 7, message: 'Lunar soil sample A secured. Regolith composition data added to the science log.' },
    'sample-east': { science: 7, message: 'Lunar soil sample B secured. The minimum sample objective is now within reach.' },
    'sample-north': { science: 7, message: 'Lunar soil sample C secured. Additional surface data recovered.' },
    'ice-core': { water: 16, science: 4, message: 'Subsurface ice deposit recorded. Water prospecting data uploaded.' },
    'oxygen-cache': { oxygen: 12, message: 'Emergency oxygen canister recovered for the outpost reserve.' },
    'power-cell': { power: 14, message: 'Portable power cell recovered. Outpost energy reserve replenished.' },
    'signal-beacon': { science: 10, message: 'Surface signal beacon scanned. Long-range telemetry uploaded to Mission Control.' }
  }[itemId];
  if (!rewards) return currentState;
  state.fieldItemsCollected.push(itemId);
  Object.entries(rewards).forEach(([key, amount]) => {
    if (key === 'message') return;
    if (key === 'science') state.resources.science += amount;
    else state.resources[key] = clamp(state.resources[key] + amount);
  });
  state.eventLog.unshift(rewards.message);
  state.eventLog = state.eventLog.slice(0, 6);
  return state;
}

export function completeFieldMission(currentState) {
  const state = structuredClone(currentState);
  const samples = (state.fieldItemsCollected || []).filter((id) => id.startsWith('sample-')).length;
  const beaconScanned = (state.fieldItemsCollected || []).includes('signal-beacon');
  if (state.fieldMissionComplete || samples < 2 || !beaconScanned) return currentState;
  state.fieldMissionComplete = true;
  state.resources.science += 15;
  state.resources.power = clamp(state.resources.power + 8);
  state.crew.morale = clamp(state.crew.morale + 8);
  state.eventLog.unshift('EVA expedition complete. Two soil samples and signal-beacon telemetry returned safely to the airlock.');
  state.eventLog = state.eventLog.slice(0, 6);
  return state;
}

export function advanceCycle(currentState) {
  if (currentState.gameOver || currentState.missionStatus !== 'active') return currentState;

  const state = structuredClone(currentState);
  const { resources, buildings, flags } = state;
  const active = (id) => buildings[id].active;
  const level = (id) => buildings[id].level;
  const solarFactor = flags.solarPenalty > 0 ? 0.45 : flags.solarBoost > 0 ? 1.35 : 1;

  // Crew needs: these are deliberately simplified game-balance values, not flight-system specifications.
  resources.oxygen -= 5;
  resources.water -= 6;
  resources.food -= 7;

  // Base communications and thermal monitoring consume a small amount each cycle.
  resources.power -= 2;

  // Outpost operations.
  if (active('habitat')) {
    resources.oxygen += 7 * level('habitat');
    resources.power -= 4 * level('habitat');
  }
  if (active('solar')) resources.power += 14 * level('solar') * solarFactor;
  if (active('recycler')) {
    resources.water += 9 * level('recycler') * (flags.recyclerPenalty > 0 ? 0.55 : 1);
    resources.power -= 4 * level('recycler');
  }
  if (active('greenhouse') && !flags.greenhouseOffNext) {
    resources.food += 12 * level('greenhouse');
    resources.water -= 4 * level('greenhouse');
    resources.power -= 6 * level('greenhouse');
  }

  Object.keys(resources).forEach((key) => {
    resources[key] = key === 'science' ? Math.max(0, Math.round(resources[key])) : clamp(resources[key]);
  });

  if (['oxygen', 'water', 'food'].some((key) => resources[key] < 22)) {
    state.crew.health = clamp(state.crew.health - 8);
    state.crew.morale = clamp(state.crew.morale - 5);
  } else {
    state.crew.health = clamp(state.crew.health + 1);
    state.crew.morale = clamp(state.crew.morale + (resources.power < 18 ? -3 : 1));
  }
  if (resources.power < 12) state.crew.morale = clamp(state.crew.morale - 4);

  if (flags.solarBoost > 0) flags.solarBoost -= 1;
  if (flags.solarPenalty > 0) flags.solarPenalty -= 1;
  if (flags.recyclerPenalty > 0) flags.recyclerPenalty -= 1;
  if (flags.greenhouseOffNext) flags.greenhouseOffNext = false;

  const completedCycle = state.cycle;
  state.eventLog.unshift(`Cycle ${completedCycle} completed. Resource systems recalculated.`);
  state.eventLog = state.eventLog.slice(0, 6);

  checkFailure(state);
  if (state.gameOver) return state;

  if (completedCycle >= state.maxCycles) {
    state.missionStatus = 'complete';
    state.gameOver = true;
    state.lastOutcome = 'The 10-cycle mission window has ended.';
    return state;
  }

  state.cycle += 1;
  if (Math.random() < state.eventChance) {
    const event = pickEvent(currentState.lastEventId);
    state.currentEvent = event;
    state.lastEventId = event.id;
    state.eventLog.unshift(`ALERT: ${event.title}.`);
  }
  return state;
}

export function resolveEvent(currentState, choiceId) {
  if (!currentState.currentEvent) return currentState;
  const state = structuredClone(currentState);
  const choice = state.currentEvent.choices.find((item) => item.id === choiceId);
  if (!choice) return state;

  const effects = choice.effects || {};
  Object.entries(effects).forEach(([key, amount]) => {
    if (key === 'health' || key === 'morale') {
      state.crew[key] = clamp(state.crew[key] + amount);
    } else if (key in state.resources) {
      state.resources[key] = key === 'science'
        ? Math.max(0, state.resources[key] + amount)
        : clamp(state.resources[key] + amount);
    }
  });
  let outcome = choice.outcome;
  if (state.currentEvent.id === 'solar-flare' && choice.id === 'shelter' && !state.buildings.shelter.active) {
    state.crew.health = clamp(state.crew.health - 12);
    state.crew.morale = clamp(state.crew.morale - 5);
    outcome = 'The shelter was offline. The crew reached cover late and took an additional health penalty.';
  }
  Object.entries(choice.flags || {}).forEach(([key, value]) => {
    if (key === 'solarBoost' || key === 'solarPenalty' || key === 'recyclerPenalty') state.flags[key] = value;
    if (key === 'greenhouseOffNext') state.flags[key] = Boolean(value);
  });
  state.lastOutcome = outcome;
  state.eventLog.unshift(outcome);
  state.eventLog = state.eventLog.slice(0, 6);
  state.currentEvent = null;
  checkFailure(state);
  return state;
}

export function toggleBuilding(currentState, buildingId) {
  const state = structuredClone(currentState);
  const building = state.buildings[buildingId];
  if (!building) return state;
  if (buildingId === 'habitat' || buildingId === 'rover') return state;
  building.active = !building.active;
  state.eventLog.unshift(`${buildingId} ${building.active ? 'activated' : 'paused'}.`);
  state.eventLog = state.eventLog.slice(0, 6);
  return state;
}

export function upgradeBuilding(currentState, buildingId, cost) {
  const state = structuredClone(currentState);
  const building = state.buildings[buildingId];
  if (!building || state.resources.science < cost) return currentState;
  state.resources.science -= cost;
  building.level += 1;
  state.eventLog.unshift(`${buildingId} upgraded to level ${building.level}.`);
  state.eventLog = state.eventLog.slice(0, 6);
  return state;
}

export function launchRover(currentState) {
  if (!currentState.buildings.rover.active || currentState.resources.power < 14 || currentState.missionStatus !== 'active') return currentState;
  const state = structuredClone(currentState);
  state.resources.power = clamp(state.resources.power - 14);
  state.resources.science += 16 * state.buildings.rover.level;
  state.crew.morale = clamp(state.crew.morale + 3);
  state.roverSorties += 1;
  state.eventLog.unshift('Rover sortie complete: samples and survey data returned to the outpost.');
  state.eventLog = state.eventLog.slice(0, 6);
  return state;
}

export function calculateMissionResult(state) {
  const objectives = getObjectives(state);
  const completed = objectives.filter((item) => item.complete).length;
  const crewScore = state.crew.health * 0.35;
  const resourceScore = (state.resources.oxygen + state.resources.water + state.resources.food + state.resources.power) / 4 * 0.25;
  const scienceScore = Math.min(100, state.resources.science * 2) * 0.2;
  const objectiveScore = (completed / objectives.length) * 100 * 0.2;
  const score = Math.round(crewScore + resourceScore + scienceScore + objectiveScore);
  let rank = 'MISSION TRAINEE';
  if (score >= 90) rank = 'LUNAR LEGEND';
  else if (score >= 78) rank = 'MISSION COMMANDER';
  else if (score >= 62) rank = 'FLIGHT ENGINEER';
  else if (score >= 45) rank = 'ASTRONAUT CADET';
  const success = state.missionStatus === 'complete' && state.crew.health > 0 && state.fieldMissionComplete === true && completed >= 2;
  return { score, rank, completed, total: objectives.length, objectives, success };
}
