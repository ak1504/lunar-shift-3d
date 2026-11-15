import { useEffect, useMemo, useRef, useState } from 'react';
import { BUILDINGS } from '../data/buildings';

const WORLD_SPOTS = {
  solar: { x: 18, y: 29 },
  habitat: { x: 48, y: 42 },
  recycler: { x: 79, y: 28 },
  greenhouse: { x: 77, y: 66 },
  shelter: { x: 27, y: 69 },
  rover: { x: 50, y: 80 }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function distance(a, b) {
  const dx = (a.x - b.x) * 0.58;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function LunarBase({ buildings, tasks = {}, onSelect, disabled = false }) {
  const [player, setPlayer] = useState({ x: 49, y: 54 });
  const playerRef = useRef(player);
  const [destination, setDestination] = useState(null);
  const [toast, setToast] = useState('Use WASD or arrow keys to explore the outpost.');
  const toastTimer = useRef(null);
  const nearest = useMemo(() => {
    return Object.values(BUILDINGS)
      .map((building) => ({ building, distance: distance(player, WORLD_SPOTS[building.id]) }))
      .sort((a, b) => a.distance - b.distance)[0];
  }, [player]);
  const inRange = nearest && nearest.distance < 12.5;

  function showToast(message) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2400);
  }

  useEffect(() => { playerRef.current = player; }, [player]);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  // Smoothly walk to a facility when a player clicks its marker.
  useEffect(() => {
    if (!destination || disabled) return undefined;
    const timer = window.setInterval(() => {
      const current = playerRef.current;
      const dx = destination.x - current.x;
      const dy = destination.y - current.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 1.5) {
        setPlayer({ x: destination.x, y: destination.y });
        setDestination(null);
        window.clearInterval(timer);
        return;
      }
      const step = Math.min(1.25, d);
      setPlayer({ x: current.x + (dx / d) * step, y: current.y + (dy / d) * step });
    }, 24);
    return () => window.clearInterval(timer);
  }, [destination, disabled]);

  // Keyboard movement: WASD / arrow keys. E or Space interacts with the nearest facility.
  useEffect(() => {
    function handleKeyDown(event) {
      if (disabled) return;
      const key = event.key.toLowerCase();
      const directions = {
        arrowup: [0, -2.1], w: [0, -2.1],
        arrowdown: [0, 2.1], s: [0, 2.1],
        arrowleft: [-2.1, 0], a: [-2.1, 0],
        arrowright: [2.1, 0], d: [2.1, 0]
      };
      if (directions[key]) {
        event.preventDefault();
        setDestination(null);
        const [dx, dy] = directions[key];
        setPlayer((current) => ({ x: clamp(current.x + dx, 5, 95), y: clamp(current.y + dy, 15, 88) }));
      } else if ((key === 'e' || key === ' ') && !event.repeat) {
        event.preventDefault();
        if (inRange) onSelect(nearest.building.id);
        else showToast('Walk closer to a facility, then press E to interact.');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, inRange, nearest, onSelect]);

  function approach(buildingId) {
    if (disabled) return;
    const spot = WORLD_SPOTS[buildingId];
    const currentDistance = distance(player, spot);
    if (currentDistance < 12.5) {
      onSelect(buildingId);
      return;
    }
    // Stand a little below/aside each building, keeping the astronaut visible.
    const target = {
      x: clamp(spot.x + (player.x < spot.x ? -7 : 7), 7, 93),
      y: clamp(spot.y + (player.y < spot.y ? -7 : 7), 17, 86)
    };
    setDestination(target);
    showToast(`Walking to ${BUILDINGS[buildingId].name}…`);
  }

  function move(dx, dy) {
    if (disabled) return;
    setDestination(null);
    setPlayer((current) => ({ x: clamp(current.x + dx * 3.1, 5, 95), y: clamp(current.y + dy * 3.1, 15, 88) }));
  }

  return (
    <div className="exploration-shell">
      <div className="exploration-hud">
        <div className="exploration-live"><i /> FIELD EXPLORATION · OUTPOST A</div>
        <div className="exploration-instructions"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> MOVE <span>·</span> <kbd>E</kbd> INTERACT</div>
      </div>
      <div className={`lunar-map exploration-world ${disabled ? 'world-controls-disabled' : ''}`} onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setDestination({ x: clamp(x, 5, 95), y: clamp(y, 15, 88) });
      }}>
        <div className="world-stars" />
        <div className="world-earth"><span /></div>
        <div className="world-sun-glow" />
        <div className="world-ridge world-ridge-back" />
        <div className="world-ridge world-ridge-front" />
        <div className="world-crater crater-a" /><div className="world-crater crater-b" /><div className="world-crater crater-c" />
        <div className="world-path path-a" /><div className="world-path path-b" /><div className="world-path path-c" />
        <div className="world-label"><i /> LUNAR SOUTH POLE · OUTPOST A</div>
        {Object.values(BUILDINGS).map((building) => {
          const spot = WORLD_SPOTS[building.id];
          const isNear = nearest?.building.id === building.id && inRange;
          const completed = Boolean(tasks[building.id]);
          return (
            <button
              key={building.id}
              className={`world-facility facility-${building.id} ${buildings[building.id].active ? 'facility-online' : 'facility-paused'} ${isNear ? 'facility-near' : ''} ${completed ? 'facility-complete' : ''}`}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              onClick={(event) => { event.stopPropagation(); approach(building.id); }}
              title={`Walk to ${building.name}`}
            >
              <span className="facility-emoji">{building.icon}</span>
              <span className="facility-label">{building.shortName}</span>
              <i className="facility-status-dot" />
              {completed && <span className="facility-complete-mark">✓</span>}
            </button>
          );
        })}
        {destination && <div className="world-waypoint" style={{ left: `${destination.x}%`, top: `${destination.y}%` }}><i /></div>}
        <div className="astronaut-shadow" style={{ left: `${player.x}%`, top: `${player.y + 2.7}%` }} />
        <div className={`player-astronaut ${destination ? 'astronaut-walking' : ''}`} style={{ left: `${player.x}%`, top: `${player.y}%` }} aria-label="Your astronaut">
          <span>🧑‍🚀</span><i />
        </div>
        {inRange && (
          <button className="interact-prompt" onClick={() => onSelect(nearest.building.id)}>
            <kbd>E</kbd> INTERACT · {nearest.building.shortName}
          </button>
        )}
        <div className="world-coordinate">LAT 89.9° S · LON 0.0° E</div>
        <div className="world-map-legend"><span><i className="legend-online" /> ONLINE</span><span><i className="legend-complete" /> TASK COMPLETE</span></div>
        {toast && <div className="world-toast">{toast}</div>}
      </div>
      <div className="exploration-bottom-bar">
        <div className="dpad" aria-label="Movement controls">
          <button className="dpad-up" onClick={() => move(0, -1)} aria-label="Move up">▲</button>
          <button className="dpad-left" onClick={() => move(-1, 0)} aria-label="Move left">◀</button>
          <button className="dpad-down" onClick={() => move(0, 1)} aria-label="Move down">▼</button>
          <button className="dpad-right" onClick={() => move(1, 0)} aria-label="Move right">▶</button>
        </div>
        <div className="exploration-tip"><b>YOUR TASK</b><span>Walk to a facility and press <kbd>E</kbd> to complete its hands-on challenge. Click a facility marker to walk there automatically.</span></div>
        <button className="interact-main" disabled={!inRange} onClick={() => inRange && onSelect(nearest.building.id)}><span>↗</span> {inRange ? `USE ${nearest.building.shortName}` : 'GET CLOSER TO INTERACT'}</button>
      </div>
    </div>
  );
}
