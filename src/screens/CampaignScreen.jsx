import { useMemo, useState } from 'react';
import LandingChallenge from '../components/LandingChallenge';
import RoverChallenge from '../components/RoverChallenge';
import OutpostChallenge from '../components/OutpostChallenge';
import { CAMPAIGN_MISSIONS, OUTPOST_MISSION, ROVER_MISSION } from '../campaign/missions';
import '../campaign/campaign.css';

const LEVELS = [...CAMPAIGN_MISSIONS, ROVER_MISSION, OUTPOST_MISSION];

function roundType(level) {
  if (level.type === 'landing') return '3D DESCENT SIMULATOR';
  if (level.id === 'rover') return '3D ROVER EXPLORATION';
  return 'OUTPOST POWER STRATEGY';
}

function RoundProgress({ current, results }) {
  return <div className="campaign-progress">{LEVELS.map((level, index) => <div key={level.id} className={`${index < current ? 'progress-complete' : ''} ${index === current ? 'progress-current' : ''}`}><i>{index < current ? '✓' : level.number}</i><span>{level.body.split(' · ')[0]}</span></div>)}</div>;
}

export default function CampaignScreen({ difficulty = 'engineer', onExit, onComplete }) {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState('briefing');
  const [attempt, setAttempt] = useState(0);
  const [roundResults, setRoundResults] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const level = LEVELS[round];
  const totalScore = useMemo(() => roundResults.reduce((sum, item) => sum + (item.score || 0), 0), [roundResults]);
  const allDone = roundResults.length === LEVELS.length;

  function startRound() {
    setCurrentResult(null);
    setPhase('playing');
  }

  function handleRoundResult(result) {
    if (phase !== 'playing') return;
    setCurrentResult(result);
    setPhase('debrief');
    setRoundResults((previous) => {
      const next = [...previous];
      next[round] = { ...result, level: level.name, body: level.body };
      return next;
    });
  }

  function retryRound() {
    setAttempt((value) => value + 1);
    setCurrentResult(null);
    setPhase('playing');
  }

  function continueCampaign() {
    if (round >= LEVELS.length - 1) {
      onComplete?.(totalScore);
      setPhase('complete');
      return;
    }
    setRound((value) => value + 1);
    setAttempt(0);
    setCurrentResult(null);
    setPhase('briefing');
  }

  function restartCampaign() {
    setRound(0);
    setAttempt((value) => value + 1);
    setRoundResults([]);
    setCurrentResult(null);
    setPhase('briefing');
  }

  const score = currentResult?.score || 0;
  const completedCount = roundResults.filter(Boolean).length;

  return (
    <main className="campaign-screen">
      <header className="campaign-header">
        <button className="campaign-brand" onClick={onExit} aria-label="Exit to title screen"><span className="brand-mark">LS</span><span><b>LUNAR SHIFT</b><small>PLANETARY MISSION LAB</small></span></button>
        <div className="campaign-header-center"><span>JUNIOR ASTRONAUT TRAINING</span><b>MISSION CAMPAIGN <i>·</i> {String(round + 1).padStart(2, '0')} / 05</b></div>
        <button className="campaign-help" onClick={() => setShowControls((value) => !value)}> {showControls ? 'HIDE CONTROLS' : 'CONTROLS ?'} </button>
      </header>

      <div className="campaign-progress-wrap"><RoundProgress current={round} results={roundResults} /></div>

      {showControls && <div className="campaign-controls-popover"><b>QUICK CONTROLS</b><p><kbd>W</kbd> thrust / drive forward · <kbd>A</kbd><kbd>D</kbd> steer · <kbd>E</kbd> interact · Use the on-screen controls on touch devices.</p><button onClick={() => setShowControls(false)}>GOT IT</button></div>}

      {phase === 'briefing' && <section className="campaign-briefing">
        <div className="briefing-orbit-art"><div className={`briefing-planet planet-${level.id}`} /><div className="briefing-orbit-ring" /><div className="briefing-spacecraft" /><div className="briefing-crosshair">+</div><div className="briefing-location-tag">{level.location || 'MISSION CONTROL'}</div></div>
        <div className="campaign-briefing-copy">
          <div className="campaign-eyebrow">ROUND {level.number} / {roundType(level)}</div>
          <div className="campaign-body-name">{level.body}</div>
          <h1>{level.name}</h1>
          <p className="campaign-objective">{level.objective}</p>
          {level.type === 'landing' ? <div className="planet-facts">
            <div><small>ATMOSPHERE</small><b>{level.atmosphere}</b></div>
            <div><small>GRAVITY</small><b>{level.gravity}</b></div>
            <div><small>MISSION TYPE</small><b>{level.id === 'titan' ? 'ROBOTIC PROBE' : 'SOFT LANDING'}</b></div>
          </div> : <div className="planet-facts">
            <div><small>MISSION TYPE</small><b>{level.id === 'rover' ? 'SAMPLE COLLECTION' : 'POWER ALLOCATION'}</b></div>
            <div><small>OBJECTIVES</small><b>{level.id === 'rover' ? '3 ROCK CORES + RETURN' : '3 EMERGENCY CYCLES'}</b></div>
            <div><small>DIFFICULTY</small><b>{difficulty.toUpperCase()}</b></div>
          </div>}
          <div className="campaign-obstacle-note"><span>⚠ MISSION CHALLENGE</span><p>{level.lesson}</p></div>
          <div className="campaign-briefing-actions"><button className="button button-primary button-large" onClick={startRound}>{round === 0 ? 'BEGIN TRAINING' : 'START ROUND'} <span>↗</span></button><button className="button button-ghost" onClick={onExit}>EXIT CAMPAIGN</button></div>
          {level.sourceUrl && <a className="campaign-source-link" href={level.sourceUrl} target="_blank" rel="noreferrer">SCIENCE REFERENCE: {level.sourceLabel} ↗</a>}
        </div>
      </section>}

      {phase === 'playing' && <section className="campaign-play-area">
        <div className="playing-titlebar"><div><span className="campaign-eyebrow">ROUND {level.number} / {roundType(level)}</span><h1>{level.name}</h1></div><div className="playing-body-tag"><b>{level.body}</b><small>{level.location || 'OUTPOST A / MISSION CONTROL'}</small></div></div>
        {level.type === 'landing' && <LandingChallenge key={`${level.id}-${attempt}`} mission={level} difficulty={difficulty} onResult={handleRoundResult} />}
        {level.id === 'rover' && <RoverChallenge key={`${level.id}-${attempt}`} onResult={handleRoundResult} />}
        {level.id === 'outpost' && <OutpostChallenge key={`${level.id}-${attempt}`} onResult={handleRoundResult} />}
      </section>}

      {phase === 'debrief' && currentResult && <section className="round-debrief">
        <div className={`debrief-emblem ${currentResult.success ? 'debrief-success' : 'debrief-fail'}`}>{currentResult.success ? '✓' : '!'}</div>
        <div className="campaign-eyebrow">ROUND {level.number} / FLIGHT DEBRIEF</div>
        <h1>{currentResult.success ? 'MISSION OBJECTIVE MET' : 'MISSION CHALLENGE FAILED'}</h1>
        <p className="debrief-summary">{currentResult.reason}</p>
        <div className="debrief-score-grid"><div><small>ROUND SCORE</small><b>{score}<i>/100</i></b></div><div><small>CAMPAIGN ROUNDS</small><b>{completedCount}<i>/5</i></b></div><div><small>MISSION BODY</small><b>{level.body}</b></div></div>
        <div className="debrief-learning"><span>WHAT YOU LEARNED</span><p>{level.lesson}</p>{level.sourceUrl && <a href={level.sourceUrl} target="_blank" rel="noreferrer">EXPLORE THE NASA REFERENCE ↗</a>}</div>
        <div className="debrief-actions">{currentResult.success ? <button className="button button-primary button-large" onClick={continueCampaign}>{round === LEVELS.length - 1 ? 'VIEW CAMPAIGN RESULTS' : 'NEXT MISSION'} <span>↗</span></button> : <button className="button button-primary button-large" onClick={retryRound}>RETRY THIS ROUND ↻</button>}<button className="button button-ghost" onClick={onExit}>EXIT TO TITLE</button></div>
      </section>}

      {phase === 'complete' && <section className="campaign-complete">
        <div className="complete-orb">✦</div>
        <div className="campaign-eyebrow">PLANETARY MISSION LAB / FINAL DEBRIEF</div>
        <h1>YOU'RE A<br /><em>MISSION ACE.</em></h1>
        <p>You landed across three different worlds, completed a rover traverse, and kept a lunar outpost operating through three power emergencies.</p>
        <div className="campaign-total-score"><small>CAMPAIGN SCORE</small><b>{totalScore}<i>/500</i></b><span>{totalScore >= 400 ? 'FLIGHT DIRECTOR' : totalScore >= 300 ? 'SENIOR ASTRONAUT' : 'ASTRONAUT CADET'}</span></div>
        <div className="campaign-result-list">{roundResults.map((item, index) => <div key={`${item.level}-${index}`}><i>{item.success ? '✓' : '!'}</i><span><b>{item.level}</b><small>{item.body}</small></span><strong>{item.score || 0}</strong></div>)}</div>
        <div className="campaign-complete-actions"><button className="button button-primary button-large" onClick={restartCampaign}>PLAY AGAIN ↻</button><button className="button button-ghost" onClick={onExit}>BACK TO HOME</button></div>
      </section>}

      <footer className="campaign-footer"><span>LUNAR SHIFT · PLANETARY MISSION LAB</span><span>SIMPLIFIED EDUCATIONAL SIMULATION · NOT REAL FLIGHT SOFTWARE</span></footer>
    </main>
  );
}
