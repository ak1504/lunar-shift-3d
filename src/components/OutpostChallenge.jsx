import { useMemo, useState } from 'react';

const DAYS = [
  {
    title: 'Dust on the solar arrays',
    alert: 'A dust plume has cut the outpost power budget. Decide what stays online.',
    budget: 82,
    needs: { life: 30, food: 16, shield: 12, comms: 8 },
    lesson: 'When power drops, life support is non-negotiable. You can temporarily slow food growth, but do not leave the crew without air.'
  },
  {
    title: 'Solar particle warning',
    alert: 'A radiation storm is approaching. The shelter needs extra power while the crew moves inside.',
    budget: 88,
    needs: { life: 30, food: 12, shield: 34, comms: 8 },
    lesson: 'Radiation protection competes with other uses of energy. A storm changes which systems deserve priority.'
  },
  {
    title: 'Greenhouse temperature drop',
    alert: 'The greenhouse heater is struggling. Keep food production going without sacrificing crew safety.',
    budget: 86,
    needs: { life: 32, food: 25, shield: 12, comms: 8 },
    lesson: 'A sustainable outpost needs both life support and food production. The best allocation changes as conditions change.'
  }
];

const SYSTEMS = [
  { id: 'life', name: 'Life support', icon: '◉', color: 'cyan', desc: 'Air circulation and oxygen systems' },
  { id: 'food', name: 'Greenhouse', icon: '✿', color: 'green', desc: 'Grow lights and crop systems' },
  { id: 'shield', name: 'Radiation shelter', icon: '⬡', color: 'amber', desc: 'Storm protection and shelter systems' },
  { id: 'comms', name: 'Communications', icon: '⌁', color: 'blue', desc: 'Signals, science data and alerts' }
];

export default function OutpostChallenge({ onResult }) {
  const [day, setDay] = useState(0);
  const [allocation, setAllocation] = useState({ life: 25, food: 20, shield: 22, comms: 15 });
  const [reports, setReports] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [finished, setFinished] = useState(false);
  const current = DAYS[day];
  const total = Object.values(allocation).reduce((sum, value) => sum + value, 0);
  const overBudget = total > current.budget;
  const meetsNeeds = useMemo(() => SYSTEMS.every((system) => allocation[system.id] >= current.needs[system.id]), [allocation, current]);

  function update(id, value) {
    setAllocation((previous) => ({ ...previous, [id]: value }));
  }

  function runCycle() {
    if (overBudget || showReport || finished) return;
    const systemResults = SYSTEMS.map((system) => ({
      ...system,
      needed: current.needs[system.id],
      allocated: allocation[system.id],
      good: allocation[system.id] >= current.needs[system.id]
    }));
    const dayScore = systemResults.filter((system) => system.good).length * 25;
    const report = { title: current.title, score: dayScore, systems: systemResults, lesson: current.lesson };
    const nextReports = [...reports, report];
    setReports(nextReports);
    setShowReport(true);
    if (day === DAYS.length - 1) {
      const totalScore = Math.round(nextReports.reduce((sum, item) => sum + item.score, 0) / DAYS.length);
      const result = { success: totalScore >= 50, score: totalScore, reports: nextReports, reason: totalScore >= 50 ? 'The outpost survived all three power emergencies.' : 'The crew survived, but at least one vital system needs a better power plan.' };
      setFinished(true);
      onResult(result);
    }
  }

  function nextDay() {
    if (day >= DAYS.length - 1) return;
    const next = day + 1;
    const defaults = next === 1 ? { life: 30, food: 16, shield: 27, comms: 10 } : { life: 32, food: 23, shield: 18, comms: 10 };
    setDay(next);
    setAllocation(defaults);
    setShowReport(false);
  }

  return (
    <div className="outpost-game">
      <div className="outpost-scene">
        <div className="outpost-scene-stars" />
        <div className="outpost-scene-earth" />
        <div className="outpost-moon-ridge ridge-one" />
        <div className="outpost-moon-ridge ridge-two" />
        <div className="outpost-habitat"><i /><i /><i /></div>
        <div className="outpost-solar-array"><i /><i /><i /><i /></div>
        <div className="outpost-scene-label">OUTPOST A / LUNAR SOUTH POLE</div>
        <div className="outpost-scene-status"><span className="world-live-dot" /> POWER MANAGEMENT ACTIVE</div>
      </div>
      <div className="outpost-challenge-grid">
        <section className="power-planner">
          <div className="side-panel-kicker">COMMAND CENTER / POWER ALLOCATION</div>
          <div className="power-dayline"><span>DAY {day + 1} / 3</span><b>{current.budget} POWER UNITS AVAILABLE</b></div>
          <h3>{current.title}</h3>
          <p>{current.alert}</p>
          <div className="allocation-list">
            {SYSTEMS.map((system) => <div className={`allocation-row alloc-${system.color}`} key={system.id}>
              <div className="allocation-label"><span>{system.icon}</span><div><b>{system.name}</b><small>{system.desc}</small></div><strong>{allocation[system.id]}</strong></div>
              <input type="range" min="0" max="50" step="1" value={allocation[system.id]} onChange={(event) => update(system.id, Number(event.target.value))} disabled={showReport} />
              <div className="allocation-threshold"><span>Minimum needed: {current.needs[system.id]}</span><b className={allocation[system.id] >= current.needs[system.id] ? 'threshold-good' : 'threshold-bad'}>{allocation[system.id] >= current.needs[system.id] ? 'SAFE' : 'UNDERPOWERED'}</b></div>
            </div>)}
          </div>
          <div className="power-budget-meter"><div><span>ALLOCATED POWER</span><b className={overBudget ? 'danger-text' : ''}>{total} / {current.budget}</b></div><div className="power-budget-track"><i style={{ width: `${Math.min(100, total / current.budget * 100)}%` }} className={overBudget ? 'budget-over' : ''} /></div><small>{overBudget ? 'Over budget — reduce one or more systems.' : `${current.budget - total} units remain unallocated.`}</small></div>
          {!showReport ? <button className="button button-primary power-run-button" onClick={runCycle} disabled={overBudget}>RUN POWER CYCLE ↗</button> : <div className="power-report">
            <div className="side-panel-kicker">POWER CYCLE REPORT</div>
            <div className="report-score"><b>{reports[reports.length - 1]?.score}/100</b><span>{meetsNeeds ? 'ALL SYSTEMS STABLE' : 'SOME SYSTEMS UNDERPOWERED'}</span></div>
            <div className="report-system-list">{reports[reports.length - 1]?.systems.map((system) => <div key={system.id}><span className={system.good ? 'threshold-good' : 'threshold-bad'}>{system.good ? '✓' : '!'}</span>{system.name}<small>{system.allocated}/{system.needed}</small></div>)}</div>
            <p>{current.lesson}</p>
            {day < DAYS.length - 1 ? <button className="button button-primary power-run-button" onClick={nextDay}>NEXT EMERGENCY ↗</button> : <div className="outpost-finished-note">THREE POWER CYCLES COMPLETE — MISSION DEBRIEF READY</div>}
          </div>}
        </section>
        <aside className="outpost-rules">
          <div className="side-panel-kicker">FLIGHT DIRECTOR'S NOTES</div>
          <h3>Every watt has a job.</h3>
          <p>You cannot run every system at full power. Meet the minimum need for each critical system, then decide where any extra power goes.</p>
          <div className="rule-card"><b>01 / AIR FIRST</b><span>Life support protects the crew. Underpower it and oxygen reserves fall.</span></div>
          <div className="rule-card"><b>02 / READ THE ALERT</b><span>Some days need more shielding; other days need more greenhouse power.</span></div>
          <div className="rule-card"><b>03 / DON'T OVERSPEND</b><span>Your total allocation must fit the available power budget.</span></div>
          <a href="https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/" target="_blank" rel="noreferrer">WHY THIS IS A REAL MISSION TRADE-OFF ↗</a>
        </aside>
      </div>
    </div>
  );
}
