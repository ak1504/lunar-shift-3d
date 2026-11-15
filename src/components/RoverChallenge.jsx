import { useEffect, useRef, useState } from 'react';
import ThreeWorld from './ThreeWorld';

const START = { x: -12, z: 12 };
const SAMPLE_POINTS = [
  { id: 0, name: 'Layered delta rock', x: 7, z: -6, type: 'SEDIMENTARY CORE' },
  { id: 1, name: 'Ancient crater rim', x: -12, z: -17, type: 'IGNEOUS CORE' },
  { id: 2, name: 'Clay-rich outcrop', x: 13, z: -28, type: 'CLAY MINERAL CORE' }
];
const CRATERS = [[-1, -11, 2.5], [5, -21, 2.2], [-9, -27, 2.7], [14, -13, 1.8], [2, -31, 2.4]];
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

export default function RoverChallenge({ onResult }) {
  const sim = useRef({ x: START.x, z: START.z, heading: 0, speed: 0, battery: 100, collected: [], elapsed: 0, status: 'running' });
  const keys = useRef({ forward: false, reverse: false, left: false, right: false });
  const lastImpact = useRef(0);
  const notified = useRef(false);
  const [roverState, setRoverState] = useState({ ...sim.current });
  const [message, setMessage] = useState('Drive to a glowing sample marker. Get close, stop, and press E to drill a core.');
  const [impact, setImpact] = useState('');

  useEffect(() => {
    const down = (event) => {
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
      if (key === 'w' || key === 'arrowup') keys.current.forward = true;
      if (key === 's' || key === 'arrowdown') keys.current.reverse = true;
      if (key === 'a' || key === 'arrowleft') keys.current.left = true;
      if (key === 'd' || key === 'arrowright') keys.current.right = true;
      if (key === 'e') drillSample();
    };
    const up = (event) => {
      const key = event.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.forward = false;
      if (key === 's' || key === 'arrowdown') keys.current.reverse = false;
      if (key === 'a' || key === 'arrowleft') keys.current.left = false;
      if (key === 'd' || key === 'arrowright') keys.current.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  });

  useEffect(() => {
    let last = performance.now();
    let frame;
    const tick = (now) => {
      const dt = Math.min(0.055, Math.max(0, (now - last) / 1000));
      last = now;
      const s = sim.current;
      if (s.status === 'running' && dt > 0) {
        const input = keys.current;
        const drive = (input.forward ? 1 : 0) - (input.reverse ? 1 : 0);
        const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        s.speed += drive * 5.5 * dt;
        s.speed = Math.max(-2.5, Math.min(6.8, s.speed));
        s.speed *= Math.pow(drive === 0 ? 0.91 : 0.985, dt * 20);
        s.heading += steer * Math.min(1, Math.abs(s.speed) / 3.2) * 1.45 * dt;
        const old = { x: s.x, z: s.z };
        s.x += Math.sin(s.heading) * s.speed * dt;
        s.z -= Math.cos(s.heading) * s.speed * dt;
        s.elapsed += dt;
        const moving = Math.abs(s.speed) > 0.25;
        s.battery = Math.max(0, s.battery - dt * (0.055 + (moving ? 0.18 + Math.abs(s.speed) * 0.012 : 0)));

        const hit = CRATERS.find(([x, z, radius]) => Math.hypot(s.x - x, s.z - z) < radius + 1.05);
        if (hit && now - lastImpact.current > 1300) {
          s.x = old.x;
          s.z = old.z;
          s.speed *= -0.18;
          s.battery = Math.max(0, s.battery - 7);
          lastImpact.current = now;
          setImpact('CRATER EDGE HIT · 7% BATTERY LOST');
          setMessage('You clipped a crater rim. Slow down and steer around the dark depressions.');
        }

        const nearest = SAMPLE_POINTS.find((sample) => !s.collected.includes(sample.id) && distance(s, sample) < 2.6);
        if (nearest) setMessage(`${nearest.type} in range. Stop the rover and press E to drill the core.`);
        else if (s.collected.length < 3) setMessage(`Next target: ${SAMPLE_POINTS.find((sample) => !s.collected.includes(sample.id))?.name}. Watch the crater fields.`);
        else setMessage('All three cores secured. Return to the lander at the starting beacon.');

        if (s.battery <= 0) {
          s.status = 'failed';
          if (!notified.current) {
            notified.current = true;
            onResult({ success: false, score: 0, reason: 'The rover battery reached zero before the sample run was complete.', collected: s.collected.length, elapsed: s.elapsed });
          }
        }
        if (s.collected.length === 3 && distance(s, START) < 3.4 && s.status === 'running') {
          s.status = 'success';
          if (!notified.current) {
            notified.current = true;
            onResult({ success: true, score: Math.round(100 - (100 - s.battery) * 0.25 - s.elapsed * 0.28), reason: 'Three core samples returned safely to the lander.', collected: 3, elapsed: s.elapsed, battery: s.battery });
          }
        }
        setRoverState({ ...s });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onResult]);

  function drillSample() {
    const s = sim.current;
    if (s.status !== 'running') return;
    if (Math.abs(s.speed) > 1.0) {
      setMessage('Too fast to drill accurately. Release the accelerator and let the rover stop.');
      return;
    }
    const target = SAMPLE_POINTS.find((sample) => !s.collected.includes(sample.id) && distance(s, sample) < 2.6);
    if (!target) {
      setMessage('No sample target in drilling range. Follow the cyan markers.');
      return;
    }
    s.collected = [...s.collected, target.id];
    s.battery = Math.max(0, s.battery - 4);
    setRoverState({ ...s });
    setMessage(`${target.type} collected and sealed in a sample tube. ${3 - s.collected.length} remaining.`);
  }

  function hold(name, value) {
    keys.current[name] = value;
  }

  const nearest = SAMPLE_POINTS.find((sample) => !roverState.collected.includes(sample.id) && distance(roverState, sample) < 2.6);
  const returning = roverState.collected.length === 3;

  return (
    <div className="rover-game">
      <div className="rover-world-area">
        <ThreeWorld mode="rover" missionId="rover" roverState={roverState} label="MARS / J E Z E R O  C R A T E R" />
        <div className="rover-world-hud"><div><small>BATTERY</small><b className={roverState.battery < 25 ? 'danger-text' : ''}>{Math.round(roverState.battery)}%</b><i><span style={{ width: `${roverState.battery}%` }} /></i></div><div><small>WHEEL SPEED</small><b>{Math.abs(roverState.speed).toFixed(1)} <em>m/s</em></b></div><div><small>CORE SAMPLES</small><b>{roverState.collected.length}/3</b></div></div>
        {impact && <div className="rover-impact-flash">{impact}</div>}
      </div>
      <div className="rover-mission-row">
        <div className="rover-instructions"><div className="side-panel-kicker">MARS ROVER / FIELD SCIENCE</div><h3>{returning ? 'Return to the lander' : nearest ? 'Sample target in range' : 'Drive the traverse'}</h3><p>{message}</p><div className="sample-route">{SAMPLE_POINTS.map((sample, index) => <div key={sample.id} className={roverState.collected.includes(sample.id) ? 'sample-route-done' : ''}><i>{roverState.collected.includes(sample.id) ? '✓' : String(index + 1).padStart(2, '0')}</i><span>{sample.name}</span></div>)}</div></div>
        <div className="rover-controls-card"><div className="side-panel-kicker">ROVER CONTROLS</div><div className="rover-control-key">W / ↑ <span>DRIVE FORWARD</span></div><div className="rover-control-key">S / ↓ <span>REVERSE</span></div><div className="rover-control-key">A D / ← → <span>STEER</span></div><div className="rover-control-key">E <span>DRILL SAMPLE</span></div><button className="button button-primary rover-drill-button" onClick={drillSample} disabled={!nearest || Math.abs(roverState.speed) > 1}>E · DRILL CORE</button></div>
      </div>
      <div className="rover-touch-controls"><button onPointerDown={() => hold('forward', true)} onPointerUp={() => hold('forward', false)} onPointerLeave={() => hold('forward', false)}>▲</button><div><button onPointerDown={() => hold('left', true)} onPointerUp={() => hold('left', false)} onPointerLeave={() => hold('left', false)}>◀</button><button onPointerDown={() => hold('reverse', true)} onPointerUp={() => hold('reverse', false)} onPointerLeave={() => hold('reverse', false)}>▼</button><button onPointerDown={() => hold('right', true)} onPointerUp={() => hold('right', false)} onPointerLeave={() => hold('right', false)}>▶</button></div></div>
    </div>
  );
}
