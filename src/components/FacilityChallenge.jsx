import { useMemo, useState } from 'react';
import Modal from './Modal';
import { BUILDINGS } from '../data/buildings';

const SEQUENCE = ['C', 'A', 'B'];
const AIR_SEQUENCE = ['2', '1', '3'];
const GREEN_STEPS = [
  { id: 'water', label: 'Water the roots', icon: '💧', hint: 'Give the seedlings a measured drink.' },
  { id: 'nutrients', label: 'Add nutrients', icon: '🧪', hint: 'Feed the plants the minerals they need.' },
  { id: 'lights', label: 'Switch on grow lights', icon: '💡', hint: 'Give the crop the right light cycle.' }
];

function ChallengeFrame({ building, subtitle, children, onClose, completed }) {
  return (
    <Modal wide onClose={onClose} label={`${building.name} field task`}>
      <div className="challenge-kicker">FIELD TASK · {building.type.toUpperCase()}</div>
      <div className="challenge-heading"><span>{building.icon}</span><div><h2>{building.name}</h2><small>{subtitle}</small></div></div>
      {completed ? <div className="challenge-already"><b>✓ FIELD TASK COMPLETED</b><p>This facility is already checked off for this mission. You can still manage its system from the outpost controls.</p><button className="button button-primary" onClick={onClose}>BACK TO OUTPOST</button></div> : children}
    </Modal>
  );
}

function Success({ title, description, reward, onClaim }) {
  return <div className="challenge-success"><div className="success-orbit">✓</div><div className="challenge-kicker">TASK COMPLETE</div><h3>{title}</h3><p>{description}</p><div className="challenge-reward">{reward}</div><button className="button button-primary" onClick={onClaim}>CLAIM REWARD ↗</button></div>;
}

function SolarChallenge({ onComplete }) {
  const [alignment, setAlignment] = useState(38);
  const [result, setResult] = useState('');
  const calibrated = alignment >= 66 && alignment <= 78;
  return <div className="challenge-body">
    <p className="challenge-instructions">The solar array is not facing the strongest sunlight. Adjust the panel angle and lock it inside the cyan optimum zone.</p>
    <div className="solar-calibration">
      <div className="sun-target">☀️<small>LIGHT SOURCE</small></div>
      <div className="solar-panel-preview" style={{ transform: `rotate(${(alignment - 50) / 2.4}deg)` }}>▦ ▦ ▦<small>ARRAY ANGLE</small></div>
      <div className="calibration-scale"><span>0°</span><div className="calibration-track"><i /><b style={{ left: `${alignment}%` }} /></div><span>100°</span></div>
      <div className="calibration-readout"><span>ALIGNMENT</span><b>{alignment}°</b><em className={calibrated ? 'readout-good' : ''}>{calibrated ? 'OPTIMAL' : 'ADJUST PANEL'}</em></div>
      <input aria-label="Solar panel angle" type="range" min="0" max="100" value={alignment} onChange={(event) => { setAlignment(Number(event.target.value)); setResult(''); }} />
      <div className="calibration-hint">TARGET WINDOW: 66°–78°</div>
    </div>
    {result && <div className="challenge-feedback">{result}</div>}
    <button className="button button-primary challenge-full" onClick={() => calibrated ? onComplete() : setResult('Not quite. The array is still outside the best-angle window. Try again!')}>LOCK ARRAY POSITION</button>
  </div>;
}

function ValveChallenge({ onComplete }) {
  const [input, setInput] = useState([]);
  const [feedback, setFeedback] = useState('');
  const valves = ['A', 'B', 'C'];
  function tapValve(id) {
    if (feedback === 'success') return;
    const next = [...input, id];
    setInput(next);
    if (next.some((value, index) => value !== SEQUENCE[index])) {
      setFeedback('That valve order did not work. Reset and follow the service sequence.');
      setInput([]);
    } else if (next.length === SEQUENCE.length) {
      setFeedback('success');
    } else {
      setFeedback(`Good. ${next.length} of 3 valves aligned.`);
    }
  }
  return <div className="challenge-body">
    <p className="challenge-instructions">A leak has lowered recycler pressure. Open the valves in the correct maintenance sequence to isolate the damaged line and restore flow.</p>
    <div className="valve-sequence"><span>MAINTENANCE ORDER</span><b>C <i>→</i> A <i>→</i> B</b></div>
    <div className="valve-grid">{valves.map((valve) => <button key={valve} className={`valve-button ${input.includes(valve) ? 'valve-selected' : ''}`} onClick={() => tapValve(valve)}><span>◉</span><b>VALVE {valve}</b><small>{input.includes(valve) ? 'ALIGNED' : 'TAP TO TURN'}</small></button>)}</div>
    <div className={`challenge-feedback ${feedback === 'success' ? 'feedback-success' : ''}`}>{feedback || 'Tap the valves in order: C → A → B.'}</div>
    {feedback === 'success' ? <button className="button button-primary challenge-full" onClick={onComplete}>RESTORE WATER FLOW ↗</button> : <button className="button button-ghost challenge-full" onClick={() => { setInput([]); setFeedback('Sequence reset. Try C → A → B.'); }}>RESET VALVES</button>}
  </div>;
}

function GreenhouseChallenge({ onComplete }) {
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState('');
  function doStep(id) {
    if (GREEN_STEPS[step]?.id === id) {
      const next = step + 1;
      setStep(next);
      setFeedback(next === 3 ? 'The seedlings are thriving. Harvest ready!' : 'Correct step. Keep going!');
    } else {
      setFeedback('That is not the next step. Follow the crop-care sequence shown above.');
    }
  }
  return <div className="challenge-body">
    <p className="challenge-instructions">The greenhouse seedlings need care. Complete the crop-care sequence in the right order to bring the first harvest online.</p>
    <div className="plant-growth-stage"><div className={`plant-emoji plant-stage-${step}`}>{step === 0 ? '🌱' : step === 1 ? '🌿' : step === 2 ? '🪴' : '🥬'}</div><div><b>{step === 3 ? 'HARVEST READY' : `GROWTH STAGE ${step + 1} / 3`}</b><small>{step === 3 ? 'The first crop is ready to collect.' : GREEN_STEPS[step].hint}</small></div></div>
    <div className="greenhouse-steps">{GREEN_STEPS.map((item, index) => <div key={item.id} className={`greenhouse-step ${index < step ? 'step-done' : index === step ? 'step-current' : ''}`}><span>{index < step ? '✓' : item.icon}</span><div><b>{item.label}</b><small>{index < step ? 'DONE' : index === step ? 'NEXT ACTION' : 'LOCKED'}</small></div></div>)}</div>
    {step < 3 ? <div className="greenhouse-actions">{GREEN_STEPS.map((item) => <button key={item.id} onClick={() => doStep(item.id)}>{item.icon} {item.label}</button>)}</div> : <button className="button button-primary challenge-full" onClick={onComplete}>COLLECT FIRST HARVEST ↗</button>}
    {feedback && <div className="challenge-feedback">{feedback}</div>}
  </div>;
}

function HabitatChallenge({ onComplete }) {
  const [input, setInput] = useState([]);
  const [feedback, setFeedback] = useState('');
  function tap(id) {
    const next = [...input, id];
    setInput(next);
    if (next.some((value, index) => value !== AIR_SEQUENCE[index])) {
      setInput([]);
      setFeedback('Airflow unstable. Reset the sequence and try again: 2 → 1 → 3.');
    } else if (next.length === 3) setFeedback('success');
    else setFeedback(`Diagnostic ${next.length}/3 complete.`);
  }
  return <div className="challenge-body">
    <p className="challenge-instructions">The habitat air filter has been restarted. Bring the oxygen loop online by activating the controls in the correct order.</p>
    <div className="air-loop"><div className="air-loop-core">O₂<small>AIR LOOP</small></div><div className="air-control-grid">{['1','2','3'].map((id) => <button className={input.includes(id) ? 'air-control-on' : ''} key={id} onClick={() => tap(id)}><b>{id}</b><small>{id === '1' ? 'SCRUBBER' : id === '2' ? 'OXYGEN VALVE' : 'VENT FAN'}</small></button>)}</div></div>
    <div className={`challenge-feedback ${feedback === 'success' ? 'feedback-success' : ''}`}>{feedback || 'Diagnostic sequence: 2 → 1 → 3.'}</div>
    {feedback === 'success' ? <button className="button button-primary challenge-full" onClick={onComplete}>RESTORE AIR CIRCULATION ↗</button> : <button className="button button-ghost challenge-full" onClick={() => { setInput([]); setFeedback('Sequence reset.'); }}>RESET DIAGNOSTIC</button>}
  </div>;
}

function ShelterChallenge({ onComplete }) {
  const [answer, setAnswer] = useState('');
  const choices = [
    { id: 'inside', label: 'Bring the crew into the radiation shelter and pause outside work.' },
    { id: 'outside', label: 'Keep working outside so the mission schedule stays on time.' },
    { id: 'hatch', label: 'Open the outer airlock to check the storm.' }
  ];
  return <div className="challenge-body">
    <p className="challenge-instructions">Mission Control has issued a solar particle event warning. You are the crew lead. What should happen first?</p>
    <div className="shelter-scenario"><span>☀️</span><div><b>SOLAR PARTICLE EVENT</b><small>HIGHER RADIATION RISK · OUTDOOR OPERATIONS PAUSED</small></div></div>
    <div className="shelter-choices">{choices.map((choice, index) => <button key={choice.id} className={answer === choice.id ? 'shelter-choice-selected' : ''} onClick={() => setAnswer(choice.id)}><span>0{index + 1}</span>{choice.label}</button>)}</div>
    {answer && <div className={`challenge-feedback ${answer === 'inside' ? 'feedback-success' : ''}`}>{answer === 'inside' ? 'Correct. Protect the crew first, then resume outdoor work when Mission Control clears it.' : 'Not the safest response. During a radiation warning, protect the crew and pause outdoor work.'}</div>}
    {answer === 'inside' && <button className="button button-primary challenge-full" onClick={onComplete}>COMPLETE SHELTER DRILL ↗</button>}
  </div>;
}

function RoverChallenge({ onComplete }) {
  const [position, setPosition] = useState({ x: 0, y: 3 });
  const [moves, setMoves] = useState(0);
  const [feedback, setFeedback] = useState('Drive the rover to the blue sample marker. Avoid the dark crater tiles.');
  const target = { x: 4, y: 1 };
  const rocks = useMemo(() => new Set(['2,3', '2,2', '3,2']), []);
  const atTarget = position.x === target.x && position.y === target.y;
  const exhausted = moves >= 10 && !atTarget;
  function drive(dx, dy) {
    if (atTarget || exhausted) return;
    const next = { x: Math.max(0, Math.min(4, position.x + dx)), y: Math.max(0, Math.min(3, position.y + dy)) };
    if (next.x === position.x && next.y === position.y) return;
    if (rocks.has(`${next.x},${next.y}`)) {
      setFeedback('Rocky crater ahead. Choose another route.');
      return;
    }
    setPosition(next);
    setMoves((value) => value + 1);
    setFeedback(next.x === target.x && next.y === target.y ? 'Sample located! Bring the rover back online with the collected core.' : 'Rover moving. Keep following the signal beacon.');
  }
  function reset() { setPosition({ x: 0, y: 3 }); setMoves(0); setFeedback('Route reset. Find the blue sample marker in 10 moves or fewer.'); }
  return <div className="challenge-body">
    <p className="challenge-instructions">Take manual control of the lunar rover. Navigate around crater hazards and reach the blue sample marker in 10 moves or fewer.</p>
    <div className="rover-game-hud"><span>📍 SAMPLE TARGET: SECTOR E2</span><b>MOVES {moves}/10</b></div>
    <div className="rover-grid" role="grid" aria-label="Rover navigation grid">{Array.from({ length: 4 }, (_, y) => Array.from({ length: 5 }, (_, x) => {
      const key = `${x},${y}`;
      const isRock = rocks.has(key);
      const isTarget = target.x === x && target.y === y;
      const isPlayer = position.x === x && position.y === y;
      return <div key={key} className={`rover-tile ${isRock ? 'rover-rock' : ''} ${isTarget ? 'rover-target' : ''} ${isPlayer ? 'rover-player-tile' : ''}`} role="gridcell">{isPlayer ? '🚙' : isTarget ? '💎' : isRock ? '🪨' : ''}</div>;
    }))}</div>
    <div className="rover-controls"><button onClick={() => drive(0, -1)} disabled={atTarget || exhausted}>▲</button><div><button onClick={() => drive(-1, 0)} disabled={atTarget || exhausted}>◀</button><button onClick={() => drive(0, 1)} disabled={atTarget || exhausted}>▼</button><button onClick={() => drive(1, 0)} disabled={atTarget || exhausted}>▶</button></div></div>
    <div className={`challenge-feedback ${atTarget ? 'feedback-success' : ''}`}>{exhausted ? 'Move limit reached. Reset and try a route around the craters.' : feedback}</div>
    {atTarget ? <button className="button button-primary challenge-full" onClick={onComplete}>COLLECT LUNAR SAMPLE ↗</button> : <button className="button button-ghost challenge-full" onClick={reset}>RESET ROVER ROUTE</button>}
  </div>;
}

export default function FacilityChallenge({ buildingId, completed, onClose, onComplete }) {
  const building = BUILDINGS[buildingId];
  if (!building) return null;
  const props = { building, onClose, completed };
  let challenge;
  switch (buildingId) {
    case 'solar': challenge = <SolarChallenge onComplete={onComplete} />; break;
    case 'recycler': challenge = <ValveChallenge onComplete={onComplete} />; break;
    case 'greenhouse': challenge = <GreenhouseChallenge onComplete={onComplete} />; break;
    case 'habitat': challenge = <HabitatChallenge onComplete={onComplete} />; break;
    case 'shelter': challenge = <ShelterChallenge onComplete={onComplete} />; break;
    case 'rover': challenge = <RoverChallenge onComplete={onComplete} />; break;
    default: challenge = null;
  }
  return <ChallengeFrame {...props} subtitle={completed ? 'Task already completed' : 'Complete the hands-on field task'}>{challenge}</ChallengeFrame>;
}
