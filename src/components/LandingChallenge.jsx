import { useEffect, useMemo, useRef, useState } from 'react';
import ThreeWorld from './ThreeWorld';

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function makeInitial(mission) {
  return {
    ...mission.initial,
    maxAltitude: mission.maxAltitude,
    altitude: mission.initial.altitude,
    verticalSpeed: mission.initial.verticalSpeed,
    lateralSpeed: mission.initial.lateralSpeed,
    x: mission.initial.x,
    tilt: mission.initial.tilt,
    fuel: mission.initial.fuel,
    heat: mission.initial.heat,
    parachute: false,
    drogueChute: false,
    mainChute: false,
    shieldAttached: mission.id === 'mars',
    gear: false,
    landed: false,
    status: 'running',
    effectiveThrottle: 0,
    elapsed: 0
  };
}

function formatAltitude(value) {
  return Math.max(0, Math.round(value)).toLocaleString('en-US');
}

export default function LandingChallenge({ mission, difficulty = 'engineer', onResult }) {
  const sim = useRef(makeInitial(mission));
  const controls = useRef({ left: false, right: false, boost: false });
  const notified = useRef(false);
  const [telemetry, setTelemetry] = useState(sim.current);
  const [throttle, setThrottle] = useState(mission.id === 'moon' ? 18 : 0);
  const [statusMessage, setStatusMessage] = useState(mission.hint);
  const [deployMessage, setDeployMessage] = useState('');

  const isMars = mission.id === 'mars';
  const isTitan = mission.id === 'titan';
  const difficultyFactor = difficulty === 'cadet' ? 0.82 : difficulty === 'commander' ? 1.16 : 1;
  const safeSpeed = mission.safe.vertical;

  const phase = useMemo(() => {
    if (mission.id === 'moon') return telemetry.altitude < 55 ? 'FINAL DESCENT' : telemetry.altitude < 120 ? 'POWERED BRAKING' : 'APPROACH';
    if (isMars) {
      if (!telemetry.parachute) return 'ATMOSPHERIC ENTRY';
      if (telemetry.shieldAttached) return 'PARACHUTE DESCENT';
      if (telemetry.altitude > mission.engineWindow) return 'GUIDED DESCENT';
      return 'POWERED DESCENT';
    }
    if (!telemetry.drogueChute) return 'ATMOSPHERIC ENTRY';
    if (!telemetry.mainChute) return 'DROGUE DESCENT';
    return 'MAIN CHUTE DESCENT';
  }, [mission.id, isMars, telemetry.altitude, telemetry.parachute, telemetry.shieldAttached, telemetry.drogueChute, telemetry.mainChute, mission.engineWindow]);

  useEffect(() => {
    sim.current = makeInitial(mission);
    controls.current = { left: false, right: false, boost: false };
    notified.current = false;
    setTelemetry(sim.current);
    setThrottle(mission.id === 'moon' ? 18 : 0);
    setDeployMessage('');
    setStatusMessage(mission.hint);
  }, [mission]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(key)) event.preventDefault();
      if (key === 'a' || key === 'arrowleft') controls.current.left = true;
      if (key === 'd' || key === 'arrowright') controls.current.right = true;
      if (key === 'w' || key === 'arrowup' || key === ' ') controls.current.boost = true;
      if (key === 'e' && !isTitan) deployGear();
      if (key === 'p' && isMars) deployMarsChute();
      if (key === '1' && isTitan) deployDrogue();
      if (key === '2' && isTitan) deployMainChute();
      if (key === 'j' && isMars) jettisonShield();
    };
    const onKeyUp = (event) => {
      const key = event.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') controls.current.left = false;
      if (key === 'd' || key === 'arrowright') controls.current.right = false;
      if (key === 'w' || key === 'arrowup' || key === ' ') controls.current.boost = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  });

  useEffect(() => {
    let last = performance.now();
    let frame = 0;
    const tick = (now) => {
      const raw = Math.min(0.06, Math.max(0, (now - last) / 1000));
      last = now;
      const dt = raw * (difficulty === 'commander' ? 1.12 : 1);
      const s = sim.current;
      if (s.status === 'running' && dt > 0) {
        const left = controls.current.left ? 1 : 0;
        const right = controls.current.right ? 1 : 0;
        const steer = right - left;
        const effectiveThrottle = Math.max(throttle, controls.current.boost ? (mission.id === 'moon' ? 70 : 76) : 0);
        s.effectiveThrottle = effectiveThrottle;
        s.elapsed += dt;

        if (mission.id === 'moon') {
          s.verticalSpeed += (mission.physics.gravity - (effectiveThrottle / 100) * mission.physics.engine) * dt;
          s.verticalSpeed = clamp(s.verticalSpeed, -3.5, 45);
          s.fuel = clamp(s.fuel - (effectiveThrottle / 100) * mission.physics.burn * dt, 0, 100);
          s.lateralSpeed += steer * mission.physics.side * dt;
          s.lateralSpeed *= Math.pow(0.96, dt * 20);
          s.x += s.lateralSpeed * dt;
          s.tilt = clamp(s.tilt + steer * 12 * dt - s.tilt * 0.7 * dt, -25, 25);
        }

        if (isMars) {
          if (!s.parachute) {
            s.verticalSpeed += mission.physics.gravity * 0.55 * dt;
            if (s.shieldAttached) s.heat = clamp(s.heat + Math.max(0, s.verticalSpeed - 140) * 0.011 * dt, 0, 100);
            else s.heat = clamp(s.heat + 2.2 * dt, 0, 110);
          } else {
            const terminal = mission.physics.terminal;
            s.verticalSpeed += (terminal - s.verticalSpeed) * Math.min(1, 1.7 * dt);
            s.heat = clamp(s.heat - 0.9 * dt, 0, 100);
          }
          if (!s.shieldAttached && s.altitude < mission.engineWindow) {
            s.verticalSpeed += (mission.physics.gravity - (effectiveThrottle / 100) * mission.physics.engine) * dt;
            s.fuel = clamp(s.fuel - (effectiveThrottle / 100) * mission.physics.burn * dt, 0, 100);
          }
          const wind = 0.34;
          s.lateralSpeed += (wind + steer * mission.physics.side) * dt;
          s.lateralSpeed *= Math.pow(0.986, dt * 20);
          s.x += s.lateralSpeed * dt;
          s.tilt = clamp(s.tilt + steer * 5.5 * dt - s.tilt * 1.2 * dt, -20, 20);
        }

        if (isTitan) {
          const terminal = s.mainChute ? 10.5 : s.drogueChute ? 58 : s.verticalSpeed;
          if (s.drogueChute || s.mainChute) {
            s.verticalSpeed += (terminal - s.verticalSpeed) * Math.min(1, (s.mainChute ? 1.7 : 0.9) * dt);
          } else {
            s.verticalSpeed += mission.physics.gravity * 0.45 * dt;
          }
          const wind = s.mainChute ? 0.52 : s.drogueChute ? 0.85 : 1.15;
          s.lateralSpeed += (wind + steer * 2.15) * dt;
          s.lateralSpeed *= Math.pow(s.mainChute ? 0.978 : 0.993, dt * 20);
          s.x += s.lateralSpeed * dt;
          s.tilt = clamp(s.tilt + steer * 3.5 * dt - s.tilt * 0.75 * dt, -22, 22);
        }

        s.altitude -= s.verticalSpeed * dt * difficultyFactor;
        if (s.altitude < 0) s.altitude = 0;

        let failureReason = '';
        if (s.fuel <= 0 && (mission.id === 'moon' || (isMars && !s.shieldAttached))) failureReason = 'Fuel exhausted. The descent engine cannot make a safe landing.';
        if (Math.abs(s.x) > 12) failureReason = 'The lander drifted outside the recovery corridor.';
        if (isMars && s.heat >= 100) failureReason = 'The heat limit was exceeded. The heat shield could not protect the capsule.';
        if (isMars && !s.parachute && s.altitude < mission.parachuteWindow[0]) failureReason = 'The parachute deployment window was missed. There is not enough time for a safe powered landing.';
        if (isTitan && !s.drogueChute && s.altitude < mission.drogueWindow[0]) failureReason = 'The drogue deployment window was missed.';
        if (isTitan && s.drogueChute && !s.mainChute && s.altitude < mission.mainWindow[0]) failureReason = 'The main parachute deployment window was missed.';
        if (failureReason) s.status = 'failed';

        if (s.altitude <= 0 && s.status === 'running') {
          const safeOffset = Math.abs(s.x) <= mission.safe.offset;
          const safeDrift = Math.abs(s.lateralSpeed) <= mission.safe.drift;
          const safeTilt = Math.abs(s.tilt) <= mission.safe.tilt;
          let safeSystems = true;
          if (mission.id === 'moon') safeSystems = s.gear;
          if (isMars) safeSystems = s.parachute && !s.shieldAttached && s.gear && s.heat < 100;
          if (isTitan) safeSystems = s.drogueChute && s.mainChute;
          s.landed = s.verticalSpeed <= safeSpeed && s.verticalSpeed >= -0.2 && safeOffset && safeDrift && safeTilt && safeSystems;
          s.status = s.landed ? 'success' : 'failed';
          if (!s.landed) {
            if (!safeSystems) s.reason = 'A required landing system was not configured.';
            else if (!safeOffset) s.reason = 'The probe missed the landing zone.';
            else if (!safeDrift) s.reason = 'Sideways drift was too high at touchdown.';
            else if (!safeTilt) s.reason = 'The vehicle was tilted too far at touchdown.';
            else s.reason = `Touchdown speed was ${Math.round(s.verticalSpeed * 10) / 10} m/s. The safe limit is ${safeSpeed} m/s.`;
          }
        }
        if (s.status === 'failed' && !s.reason) s.reason = failureReason || 'The lander was lost during descent.';
        if (s.status !== 'running' && !notified.current) {
          notified.current = true;
          onResult({ success: s.status === 'success', score: s.status === 'success' ? Math.max(40, Math.round(100 - s.elapsed * 0.45 - (100 - s.fuel) * 0.18 - Math.abs(s.x) * 2)) : 0, telemetry: { ...s }, reason: s.reason || 'Safe touchdown achieved.', missionId: mission.id });
        }
        setTelemetry({ ...s });
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [mission, mission.id, mission.physics, mission.safe, difficulty, throttle, isMars, isTitan, onResult]);

  function deployGear() {
    const s = sim.current;
    if (s.status !== 'running' || isTitan) return;
    const limit = isMars ? 1600 : 65;
    if (s.altitude <= limit) {
      s.gear = true;
      setStatusMessage('Landing legs locked. Keep your vertical speed and drift inside the green limits.');
      setDeployMessage('LANDING LEGS LOCKED');
      setTelemetry({ ...s });
    } else {
      setDeployMessage(`TOO HIGH — wait until below ${formatAltitude(limit)} m`);
    }
  }

  function deployMarsChute() {
    const s = sim.current;
    if (!isMars || s.parachute || s.status !== 'running') return;
    const [low, high] = mission.parachuteWindow;
    if (s.altitude <= high && s.altitude >= low) {
      s.parachute = true;
      setStatusMessage('Parachute deployed. Wait until below 3,400 m, then jettison the heat shield.');
      setDeployMessage('PARACHUTE DEPLOYED');
    } else if (s.altitude > high) setDeployMessage('TOO EARLY — wait for the deployment window');
    else { s.status = 'failed'; s.reason = 'The parachute was deployed too late to slow the lander safely.'; setDeployMessage('DEPLOYMENT TOO LATE'); }
    setTelemetry({ ...s });
  }

  function jettisonShield() {
    const s = sim.current;
    if (!isMars || !s.parachute || !s.shieldAttached || s.status !== 'running') return;
    if (s.altitude <= mission.shieldWindow) {
      s.shieldAttached = false;
      setStatusMessage('Heat shield released. The landing engines are now available. Start braking before the 1,900 m mark.');
      setDeployMessage('HEAT SHIELD JETTISONED');
    } else setDeployMessage('WAIT — shield separation is safer below 3,400 m');
    setTelemetry({ ...s });
  }

  function deployDrogue() {
    const s = sim.current;
    if (!isTitan || s.drogueChute || s.status !== 'running') return;
    const [low, high] = mission.drogueWindow;
    if (s.altitude <= high && s.altitude >= low) {
      s.drogueChute = true;
      setStatusMessage('Drogue chute open. Keep watching altitude; the main chute has a second deployment window.');
      setDeployMessage('DROGUE CHUTE OPEN');
    } else if (s.altitude > high) setDeployMessage('TOO EARLY — wait for denser air');
    else { s.status = 'failed'; s.reason = 'The drogue chute was deployed too late.'; setDeployMessage('DROGUE DEPLOYMENT TOO LATE'); }
    setTelemetry({ ...s });
  }

  function deployMainChute() {
    const s = sim.current;
    if (!isTitan || !s.drogueChute || s.mainChute || s.status !== 'running') return;
    const [low, high] = mission.mainWindow;
    if (s.altitude <= high && s.altitude >= low) {
      s.mainChute = true;
      setStatusMessage('Main chute deployed. Use side jets to counter the crosswind and keep the probe over the landing zone.');
      setDeployMessage('MAIN CHUTE OPEN');
    } else if (s.altitude > high) setDeployMessage('TOO EARLY — stay on drogue chute');
    else { s.status = 'failed'; s.reason = 'The main chute deployment window was missed.'; setDeployMessage('MAIN CHUTE TOO LATE'); }
    setTelemetry({ ...s });
  }

  const windowInfo = isMars ? `${mission.parachuteWindow[1].toLocaleString()}–${mission.parachuteWindow[0].toLocaleString()} m` : isTitan ? `${mission.drogueWindow[1].toLocaleString()}–${mission.drogueWindow[0].toLocaleString()} m` : 'No atmosphere';
  const recommendation = useMemo(() => {
    if (mission.id === 'moon') {
      if (!telemetry.gear && telemetry.altitude < 75) return 'DEPLOY LANDING LEGS NOW';
      if (telemetry.verticalSpeed > 8) return 'BRAKE: increase thrust before the descent gets too steep';
      if (Math.abs(telemetry.lateralSpeed) > 1.6) return 'CORRECT DRIFT: hold the opposite side-jet button';
      if (telemetry.altitude < 40) return 'FINAL APPROACH: aim for less than 2.8 m/s';
      return 'GOOD APPROACH: make small corrections and save fuel';
    }
    if (isMars) {
      if (!telemetry.parachute) return telemetry.altitude <= mission.parachuteWindow[1] && telemetry.altitude >= mission.parachuteWindow[0] ? 'PARACHUTE WINDOW OPEN — DEPLOY NOW' : 'KEEP HEAT SHIELD ATTACHED · WATCH THE PARACHUTE WINDOW';
      if (telemetry.shieldAttached && telemetry.altitude <= mission.shieldWindow) return 'JETTISON HEAT SHIELD';
      if (!telemetry.gear && telemetry.altitude < 1650) return 'DEPLOY LANDING LEGS';
      if (!telemetry.shieldAttached && telemetry.altitude < mission.engineWindow + 500) return 'POWERED DESCENT: brake toward 4.8 m/s';
      return 'PARACHUTE DESCENT: monitor heat and drift';
    }
    if (!telemetry.drogueChute) return telemetry.altitude <= mission.drogueWindow[1] && telemetry.altitude >= mission.drogueWindow[0] ? 'DROGUE WINDOW OPEN — DEPLOY NOW' : 'WAIT FOR THE DROGUE WINDOW';
    if (!telemetry.mainChute) return telemetry.altitude <= mission.mainWindow[1] && telemetry.altitude >= mission.mainWindow[0] ? 'MAIN CHUTE WINDOW OPEN — DEPLOY NOW' : 'DROGUE DESCENT · WATCH THE SECOND WINDOW';
    if (Math.abs(telemetry.lateralSpeed) > 2.8) return 'CROSSWIND: steer against the drift';
    return 'MAIN CHUTE OPEN · KEEP DRIFT BELOW 2.8 m/s';
  }, [mission, isMars, telemetry]);

  return (
    <div className="landing-game">
      <div className="landing-stage-layout">
        <section className="landing-world-column">
          <ThreeWorld mode="landing" missionId={mission.id} telemetry={telemetry} label={`${mission.body} / DESCENT ZONE`} />
          <div className="landing-telemetry-strip">
            <div><small>ALTITUDE</small><b>{formatAltitude(telemetry.altitude)} <i>m</i></b></div>
            <div className={telemetry.verticalSpeed > safeSpeed ? 'telemetry-danger' : 'telemetry-good'}><small>VERTICAL SPEED</small><b>{Math.max(0, telemetry.verticalSpeed).toFixed(1)} <i>m/s</i></b></div>
            <div className={Math.abs(telemetry.lateralSpeed) > mission.safe.drift ? 'telemetry-danger' : 'telemetry-good'}><small>SIDE DRIFT</small><b>{Math.abs(telemetry.lateralSpeed).toFixed(1)} <i>m/s</i></b></div>
            <div className={telemetry.fuel < 20 ? 'telemetry-danger' : ''}><small>{isTitan ? 'PROBE POWER' : 'FUEL'}</small><b>{Math.round(telemetry.fuel)}<i>%</i></b></div>
            {isMars && <div className={telemetry.heat > 80 ? 'telemetry-danger' : ''}><small>HEAT LOAD</small><b>{Math.round(telemetry.heat)}<i>%</i></b></div>}
          </div>
        </section>
        <aside className="landing-side-panel">
          <div className="side-panel-kicker">FLIGHT DIRECTOR / LIVE GUIDANCE</div>
          <div className="phase-chip">{phase}</div>
          <h3>{mission.name}</h3>
          <p className="mission-objective-copy">{mission.objective}</p>
          <div className="atmosphere-fact"><span>ATMOSPHERE</span><b>{mission.atmosphere}</b><small>GRAVITY · {mission.gravity}</small></div>
          <div className="flight-checklist">
            <div className={mission.id === 'moon' ? 'check-active' : telemetry.parachute || telemetry.drogueChute ? 'check-done' : ''}><i>{mission.id === 'moon' ? '01' : telemetry.parachute || telemetry.drogueChute ? '✓' : '01'}</i><span>{mission.id === 'moon' ? 'Powered descent' : isMars ? 'Atmospheric parachute' : 'Drogue parachute'}</span></div>
            {isMars && <div className={telemetry.shieldAttached ? '' : 'check-done'}><i>{telemetry.shieldAttached ? '02' : '✓'}</i><span>Heat shield separation</span></div>}
            {isTitan && <div className={telemetry.mainChute ? 'check-done' : ''}><i>{telemetry.mainChute ? '✓' : '02'}</i><span>Main parachute</span></div>}
            {(mission.id === 'moon' || isMars) && <div className={telemetry.gear ? 'check-done' : ''}><i>{telemetry.gear ? '✓' : '03'}</i><span>Landing legs locked</span></div>}
            <div><i>04</i><span>Touchdown in safe limits</span></div>
          </div>
          <div className={`flight-directive ${recommendation.includes('NOW') ? 'directive-alert' : ''}`}><span>✦ NEXT ACTION</span><b>{recommendation}</b></div>
          {deployMessage && <div className="deploy-feedback">{deployMessage}</div>}
          <div className="landing-lesson"><b>WHY THIS WORLD IS DIFFERENT</b><p>{mission.lesson}</p><a href={mission.sourceUrl} target="_blank" rel="noreferrer">{mission.sourceLabel} ↗</a></div>
        </aside>
      </div>

      <div className="flight-controls">
        <div className="control-intro"><span className="side-panel-kicker">MANUAL FLIGHT CONTROLS</span><b>Fly the landing — don't just choose an answer.</b><small>Keyboard: W / ↑ thrust · A/D or ←/→ side jets · E landing legs</small></div>
        <div className="throttle-control"><div className="throttle-label"><span>ENGINE THROTTLE</span><b>{Math.round(telemetry.effectiveThrottle || throttle)}%</b></div><input type="range" min="0" max="100" value={throttle} onChange={(event) => setThrottle(Number(event.target.value))} disabled={isTitan || (isMars && telemetry.shieldAttached)} /><div className="throttle-ends"><span>IDLE</span><span>MAX THRUST</span></div></div>
        <div className="steering-controls">
          <span>RCS / SIDE JETS</span>
          <div className="steering-pad">
            <button onPointerDown={() => { controls.current.left = true; }} onPointerUp={() => { controls.current.left = false; }} onPointerLeave={() => { controls.current.left = false; }} onPointerCancel={() => { controls.current.left = false; }}>◀</button>
            <button onPointerDown={() => { controls.current.right = true; }} onPointerUp={() => { controls.current.right = false; }} onPointerLeave={() => { controls.current.right = false; }} onPointerCancel={() => { controls.current.right = false; }}>▶</button>
          </div>
        </div>
        <div className="stage-actions">
          {mission.id === 'moon' && <button className={`action-control ${telemetry.gear ? 'action-done' : ''}`} onClick={deployGear} disabled={telemetry.gear}>{telemetry.gear ? '✓ LEGS LOCKED' : 'DEPLOY LEGS'}</button>}
          {isMars && <>
            <button className="action-control" onClick={deployMarsChute} disabled={telemetry.parachute || telemetry.altitude > mission.parachuteWindow[1] || telemetry.altitude < mission.parachuteWindow[0]}>{telemetry.parachute ? '✓ PARACHUTE' : 'DEPLOY PARACHUTE (P)'}</button>
            <button className="action-control" onClick={jettisonShield} disabled={!telemetry.parachute || !telemetry.shieldAttached || telemetry.altitude > mission.shieldWindow}>JETTISON SHIELD (J)</button>
            <button className={`action-control ${telemetry.gear ? 'action-done' : ''}`} onClick={deployGear} disabled={telemetry.gear || telemetry.altitude > 1650}>DEPLOY LEGS (E)</button>
          </>}
          {isTitan && <>
            <button className="action-control" onClick={deployDrogue} disabled={telemetry.drogueChute || telemetry.altitude > mission.drogueWindow[1] || telemetry.altitude < mission.drogueWindow[0]}>{telemetry.drogueChute ? '✓ DROGUE OPEN' : '1 · DROGUE CHUTE'}</button>
            <button className="action-control" onClick={deployMainChute} disabled={!telemetry.drogueChute || telemetry.mainChute || telemetry.altitude > mission.mainWindow[1] || telemetry.altitude < mission.mainWindow[0]}>{telemetry.mainChute ? '✓ MAIN OPEN' : '2 · MAIN CHUTE'}</button>
          </>}
        </div>
      </div>

      <div className="landing-hint"><span>MISSION CONTROL TIP</span><b>{statusMessage}</b><small>All flight dynamics are simplified for learning and gameplay, not real flight-planning data.</small></div>
    </div>
  );
}
