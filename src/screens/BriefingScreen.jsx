const objectives = [
  ['01', 'Land on three worlds', 'Master the Moon, Mars and Titan landing conditions.'],
  ['02', 'Collect Mars rock cores', 'Navigate a 3D rover route and return with three samples.'],
  ['03', 'Save the lunar outpost', 'Balance power across air, food, shielding and communications.'],
  ['04', 'Learn the real science', 'See how actual planetary missions solve each challenge.']
];

export default function BriefingScreen({ difficulty, setDifficulty, onLaunch, onBack }) {
  return (
    <main className="briefing-screen screen-shell">
      <header className="screen-header"><button className="back-link" onClick={onBack}>← BACK TO HOME</button><div className="brand-lockup"><span className="brand-mark">LS</span><span>MISSION CONTROL</span></div><span className="header-code">CAMPAIGN 001 / SOL SYSTEM</span></header>
      <div className="briefing-grid">
        <section className="briefing-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> CLASSIFIED MISSION BRIEFING</div>
          <h1>READY FOR<br /><em>THE UNKNOWN.</em></h1>
          <p className="briefing-lead">Junior Astronaut, Mission Control has five challenges for you. Land on worlds with very different atmospheres, guide a rover across Mars to collect rock cores, and make the power decisions that keep a lunar outpost alive.</p>
          <div className="mission-stamp"><span>DESTINATION</span><b>MOON → MARS → TITAN</b><span>MISSION CAMPAIGN</span><b>5 CHALLENGES</b></div>
          <div className="difficulty-picker">
            <div className="section-kicker">SELECT YOUR TRAINING LEVEL</div>
            <div className="difficulty-options">
              {[
                ['cadet', 'CADET', 'More supplies · Helpful hints'],
                ['engineer', 'ENGINEER', 'Balanced resources · Standard events'],
                ['commander', 'COMMANDER', 'Tighter reserves · More hazards']
              ].map(([id, name, detail]) => <button key={id} className={`difficulty-option ${difficulty === id ? 'selected' : ''}`} onClick={() => setDifficulty(id)}><span className="difficulty-radio" /><b>{name}</b><small>{detail}</small></button>)}
            </div>
          </div>
          <button className="button button-primary button-large launch-button" onClick={onLaunch}>LAUNCH CAMPAIGN <span>↗</span></button>
        </section>
        <aside className="briefing-side">
          <div className="briefing-art"><div className="briefing-art-moon" /><div className="briefing-art-earth" /><div className="briefing-art-base"><i /><i /><i /><i /></div><div className="briefing-art-label">OUTPOST A / SOUTHERN HIGHLANDS</div></div>
          <div className="objective-card"><div className="section-kicker">YOUR MISSION OBJECTIVES</div>{objectives.map(([num, title, detail]) => <div className="brief-objective" key={num}><span>{num}</span><div><b>{title}</b><small>{detail}</small></div><i>◇</i></div>)}</div>
        </aside>
      </div>
      <footer className="screen-footer"><span>FLIGHT DIRECTOR: MISSION CONTROL</span><span>ALL SYSTEMS ARE SIMULATED FOR LEARNING AND PLAY</span></footer>
    </main>
  );
}
