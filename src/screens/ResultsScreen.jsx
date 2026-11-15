import { calculateMissionResult } from '../game/engine';

export default function ResultsScreen({ state, onReplay, onHome }) {
  const result = calculateMissionResult(state);
  const metrics = [
    ['CREW HEALTH', state.crew.health, '%'],
    ['OXYGEN', state.resources.oxygen, '%'],
    ['WATER', state.resources.water, '%'],
    ['FOOD', state.resources.food, '%'],
    ['POWER', state.resources.power, '%'],
    ['SCIENCE DATA', state.resources.science, ' pts']
  ];
  return (
    <main className="results-screen screen-shell">
      <header className="screen-header"><div className="brand-lockup"><span className="brand-mark">LS</span><span>MISSION DEBRIEF</span></div><span className="header-code">OUTPOST A / FINAL REPORT</span></header>
      <section className="results-hero"><div className="results-orb">{result.success ? '✦' : '⌁'}</div><div className="eyebrow"><span className="eyebrow-line" /> MISSION {result.success ? 'ACCOMPLISHED' : 'DEBRIEF'}</div><h1>{result.success ? 'YOU DID IT,' : 'MISSION'}<br /><em>{result.success ? 'COMMANDER.' : 'COMPLETE.'}</em></h1><p>{state.missionStatus === 'failed' ? 'The outpost could not sustain the crew. Every mission teaches us how to make the next one better.' : result.success ? 'Your crew made it through the lunar mission. Mission Control is proud of your decisions.' : 'The mission window has ended. Review your systems and see how close you came to completing every objective.'}</p></section>
      <section className="results-grid">
        <div className="score-card"><span>FINAL MISSION SCORE</span><strong>{result.score}<small>/100</small></strong><b>{result.rank}</b><div className="score-track"><i style={{ width: `${result.score}%` }} /></div><small>{result.completed} OF {result.total} OBJECTIVES COMPLETED</small></div>
        <div className="results-metrics"><div className="section-kicker">OUTPOST SYSTEMS / END-OF-MISSION STATUS</div><div className="metric-grid">{metrics.map(([label, value, unit]) => <div className="result-metric" key={label}><span>{label}</span><b>{Math.round(value)}<small>{unit}</small></b></div>)}</div></div>
      </section>
      <section className="debrief-card"><div><div className="section-kicker">FLIGHT DIRECTOR'S DEBRIEF</div><h2>{result.success ? 'A strong mission, astronaut.' : 'Every astronaut learns from the data.'}</h2><p>{result.success ? 'You balanced survival, science, and limited resources. Review the NASA science deck to understand how real mission teams approach these same challenges.' : 'Look at the lowest resource in your final report. Next time, pause a non-essential system earlier, repair leaks quickly, and use the rover only when you have enough power.'}</p></div><div className="debrief-objectives">{result.objectives.map((item) => <div key={item.id}><span className={item.complete ? 'check-good' : 'check-miss'}>{item.complete ? '✓' : '×'}</span>{item.label}</div>)}</div></section>
      <div className="results-actions"><button className="button button-primary button-large" onClick={onReplay}>FLY ANOTHER MISSION ↗</button><button className="button button-ghost" onClick={onHome}>BACK TO HOME</button></div>
      <footer className="screen-footer"><span>LUNAR SHIFT · JUNIOR ASTRONAUT MISSION TRAINER</span><span>SIMPLIFIED EDUCATIONAL SIMULATION · NOT A FLIGHT PLANNING TOOL</span></footer>
    </main>
  );
}
