import assert from 'node:assert/strict';
import {
  advanceCycle,
  calculateMissionResult,
  collectFieldItem,
  completeFieldMission,
  completeFacilityTask,
  createInitialGameState,
  getObjectives,
  launchRover,
  resolveEvent,
  toggleBuilding,
  upgradeBuilding
} from '../src/game/engine.js';
import { EVENTS } from '../src/data/events.js';

const initial = createInitialGameState('engineer');
assert.equal(initial.cycle, 1);
assert.equal(initial.resources.oxygen, 88);

const toggled = toggleBuilding(initial, 'greenhouse');
assert.equal(toggled.buildings.greenhouse.active, false);
assert.equal(initial.buildings.greenhouse.active, true, 'actions must not mutate prior state');

const upgraded = upgradeBuilding({ ...initial, resources: { ...initial.resources, science: 50 } }, 'solar', 35);
assert.equal(upgraded.buildings.solar.level, 2);
assert.equal(upgraded.resources.science, 15);

const sortie = launchRover(initial);
assert.equal(sortie.roverSorties, 1);
assert.equal(sortie.resources.science, 16);

const taskState = completeFacilityTask(initial, 'solar');
assert.equal(taskState.tasks.solar, true);
assert.equal(taskState.resources.science, 8);
assert.equal(taskState.resources.power, 100);
assert.equal(initial.tasks.solar, false, 'task completion must not mutate prior state');
assert.equal(getObjectives(taskState).find((item) => item.id === 'solar-task').complete, true);
const repeatedTask = completeFacilityTask(taskState, 'solar');
assert.equal(repeatedTask.resources.science, 8, 'field task rewards can only be claimed once');

const eventState = { ...initial, currentEvent: EVENTS.find((event) => event.id === 'solar-flare') };
const resolved = resolveEvent(eventState, 'shelter');
assert.equal(resolved.currentEvent, null);
assert.ok(resolved.crew.health <= 100);

const originalRandom = Math.random;
Math.random = () => 0.99; // Keep this test run free of random mission events.
let mission = createInitialGameState('engineer');
for (let cycle = 0; cycle < 10; cycle += 1) mission = advanceCycle(mission);
Math.random = originalRandom;
assert.equal(mission.missionStatus, 'complete');
assert.equal(mission.cycle, 10);
assert.equal(calculateMissionResult(mission).total, 11);
for (const facilityId of ['habitat', 'solar', 'recycler', 'greenhouse', 'shelter', 'rover']) {
  const completed = completeFacilityTask(createInitialGameState('cadet'), facilityId);
  assert.equal(completed.tasks[facilityId], true, `${facilityId} task should complete`);
}

const fieldStart = createInitialGameState('cadet');
const pickedA = collectFieldItem(fieldStart, 'sample-west');
const pickedB = collectFieldItem(pickedA, 'sample-east');
const scanned = collectFieldItem(pickedB, 'signal-beacon');
assert.equal(scanned.resources.science, 24, 'sample and beacon pickups award science');
assert.equal(scanned.fieldItemsCollected.length, 3);
const extracted = completeFieldMission(scanned);
assert.equal(extracted.fieldMissionComplete, true, 'EVA extraction completes after two samples and beacon scan');
assert.equal(extracted.resources.science, 39, 'safe extraction adds a mission bonus');
assert.equal(getObjectives(extracted).find((item) => item.id === 'eva-extraction').complete, true);
assert.equal(calculateMissionResult({ ...mission, fieldMissionComplete: false }).success, false, 'mission success requires a completed EVA extraction');
assert.equal(completeFieldMission(fieldStart).fieldMissionComplete, false, 'extraction stays locked without required field items');
assert.equal(collectFieldItem(scanned, 'sample-west').resources.science, scanned.resources.science, 'pickups cannot be claimed twice');

console.log('Lunar Shift smoke tests passed, including facility tasks, EVA pickups, beacon scan, safe extraction, and mission scoring.');
