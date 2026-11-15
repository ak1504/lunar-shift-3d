import { useMemo, useState } from 'react';
import { BUILDINGS } from '../data/buildings';
import { SCIENCE_CARDS } from '../data/scienceCards';
import { getObjectives } from '../game/engine';
import LunarExplorer from '../components/LunarExplorer';
import FacilityChallenge from '../components/FacilityChallenge';
import Modal from '../components/Modal';
import ResourceMeter from '../components/ResourceMeter';

function CrewMeter({ label, value, icon }) {
  return <div className="crew-meter"><div><span>{icon} {label}</span><b>{Math.round(value)}%</b></div><div className="crew-track"><i style={{ width: `${value}%` }} /></div></div>;
}

export default function GameScreen({ state, onAdvance, onResolveEvent, onToggle, onUpgrade, onCompleteTask, onFieldPickup, onFieldExtract }) {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [scienceOpen, setScienceOpen] = useState(false);
  const [selectedScience, setSelectedScience] = useState(SCIENCE_CARDS[0]);
  const objectives = useMemo(() => getObjectives(state), [state]);
  const building = selectedBuilding ? BUILDINGS[selectedBuilding] : null;
  const buildingState = selectedBuilding ? state.buildings[selectedBuilding] : null;
  const taskComplete = selectedBuilding ? Boolean(state.tasks?.[selectedBuilding]) : false;
  const upgradeCost = building ? building.upgradeCost * buildingState.level : 0;

  return (
    <main className="game-screen screen-shell">
      <header className="game-topbar">
        <div className="game-brand"><span className="brand-mark">LS</span><div><b>LUNAR SHIFT</b><small>OUTPOST A / FIELD OPERATIONS</small></div></div>
        <div className="mission-day"><span>MISSION CYCLE</span><b>{String(state.cycle).padStart(2, '0')} <i>/ {state.maxCycles}</i></b><div className="cycle-progress">{Array.from({ length: state.maxCycles }, (_, i) => <span key={i} className={i < state.cycle ? 'done' : ''} />)}</div></div>
        <div className="topbar-right"><span className={`status-pill ${state.resources.power < 20 ? 'status-warning' : ''}`}><i /> {state.resources.power < 20 ? 'POWER LOW' : 'OUTPOST ONLINE'}</span><button className="science-button" onClick={() => setScienceOpen(true)}>✧ SCIENCE DECK</button></div>
      </header>

      <section className="resource-strip">
        <ResourceMeter type="oxygen" value={state.resources.oxygen} />
        <ResourceMeter type="water" value={state.resources.water} />
        <ResourceMeter type="food" value={state.resources.food} />
        <ResourceMeter type="power" value={state.resources.power} />
        <div className="science-total"><span>✧</span><div><small>SCIENCE DATA</small><b>{state.resources.science}<i> pts</i></b></div></div>
      </section>

      <section className="game-content-grid">
        <aside className="left-rail">
          <div className="panel-heading"><span>CREW STATUS</span><b>04 / 04</b></div>
          <div className="crew-card">
            <div className="crew-avatars"><span>👩🏻‍🚀</span><span>👨🏽‍🚀</span><span>👩🏿‍🚀</span><span>👨🏻‍🚀</span></div>
            <div className="crew-names"><b>OUTPOST CREW</b><small>4 ASTRONAUTS · ALL ON DUTY</small></div>
            <CrewMeter label="CREW HEALTH" value={state.crew.health} icon="♥" />
            <CrewMeter label="CREW MORALE" value={state.crew.morale} icon="✦" />
          </div>
          <div className="panel-heading system-heading"><span>FIELD LOCATIONS</span><small>WALK TO TASK</small></div>
          <div className="system-list">
            {Object.values(BUILDINGS).map((item) => <div key={item.id} className={`system-row ${state.tasks?.[item.id] ? 'system-task-done' : ''} ${state.buildings[item.id].active ? '' : 'system-disabled'}`}><span className="system-icon">{item.icon}</span><span className="system-copy"><b>{item.name}</b><small>{state.tasks?.[item.id] ? 'FIELD TASK COMPLETE' : `LVL ${state.buildings[item.id].level} · ${item.type}`}</small></span><i className={state.tasks?.[item.id] ? 'task-led-done' : state.buildings[item.id].active ? 'led-on' : 'led-off'} /></div>)}
          </div>
          <div className="hint-card field-control-card"><span>✦ HOW TO PLAY</span><p><b>WASD / ARROWS</b> to move. Press <b>E</b> near a building to play its mini challenge. You can also click a facility to walk there.</p></div>
        </aside>

        <section className="base-column">
          <div className="base-title-row"><div><div className="section-kicker">REAL-TIME EVA EXPLORATION</div><h2>EXPLORE THE LUNAR SURFACE</h2></div><span className="base-coordinates">89.9° S&nbsp; / &nbsp;0.0° E</span></div>
          <LunarExplorer buildings={state.buildings} tasks={state.tasks} collectedItems={state.fieldItemsCollected || []} fieldMissionComplete={state.fieldMissionComplete} onSelect={setSelectedBuilding} onPickup={onFieldPickup} onExtract={onFieldExtract} disabled={Boolean(selectedBuilding || scienceOpen || state.currentEvent)} />
          <div className="base-caption"><span><i className="live-dot" /> ASTRONAUT CONTROL ACTIVE</span><span>EXPLORE · COLLECT · SCAN · EXTRACT</span></div>
          <div className="command-bar exploration-command-bar"><div className="command-note"><span>⌁</span><div><b>FIELD WORK IN PROGRESS</b><small>{Object.values(state.tasks || {}).filter(Boolean).length} of 6 facility challenges complete · {(state.fieldItemsCollected || []).filter((id) => id.startsWith('sample-')).length}/2 samples recovered · {state.fieldMissionComplete ? 'EVA returned safely' : 'EVA extraction pending'}.</small></div></div><button className="button button-primary end-cycle-button" onClick={onAdvance} disabled={Boolean(state.currentEvent) || state.gameOver}>END CYCLE <span>→</span></button></div>
        </section>

        <aside className="right-rail">
          <div className="panel-heading"><span>MISSION OBJECTIVES</span><b>{objectives.filter((item) => item.complete).length}/{objectives.length}</b></div>
          <div className="objectives-card">{objectives.map((item, index) => <div className={`objective-row ${item.complete ? 'objective-done' : ''}`} key={item.id}><span className="objective-check">{item.complete ? '✓' : String(index + 1).padStart(2, '0')}</span><div><b>{item.label}</b><small>{item.value}</small></div></div>)}</div>
          <div className="panel-heading log-heading"><span>MISSION LOG</span><small>RECENT UPDATES</small></div>
          <div className="mission-log">{state.eventLog.slice(0, 6).map((line, index) => <div className="log-line" key={`${line}-${index}`}><i />{line.replace('EVENT:', 'ALERT:')}</div>)}</div>
          <div className="field-progress-card"><div><span>FACILITY CHALLENGES</span><b>{Object.values(state.tasks || {}).filter(Boolean).length}/6</b></div><div className="field-progress-track"><i style={{ width: `${Object.values(state.tasks || {}).filter(Boolean).length / 6 * 100}%` }} /></div><small>Complete hands-on facility challenges and the EVA expedition in the central world.</small></div>
        </aside>
      </section>

      {building && buildingState && !taskComplete && <FacilityChallenge buildingId={selectedBuilding} completed={false} onClose={() => setSelectedBuilding(null)} onComplete={() => { onCompleteTask(selectedBuilding); setSelectedBuilding(null); }} />}

      {building && buildingState && taskComplete && <Modal onClose={() => setSelectedBuilding(null)} label={`${building.name} controls`}>
        <div className="modal-kicker">FACILITY CONTROL / TASK COMPLETE</div>
        <div className="facility-title"><span>{building.icon}</span><div><h2>{building.name}</h2><small>FACILITY LEVEL {buildingState.level} · FIELD TASK COMPLETE</small></div></div>
        <p className="modal-description">{building.description}</p>
        <div className="facility-effect"><span>OPERATIONAL EFFECT</span><b>{building.baseEffect}</b></div>
        {building.canToggle && <button className="button button-secondary manage-toggle" onClick={() => onToggle(building.id)}>{buildingState.active ? 'PAUSE SYSTEM' : 'ACTIVATE SYSTEM'}</button>}
        <button className="button button-primary challenge-full manage-upgrade" onClick={() => onUpgrade(building.id, upgradeCost)} disabled={state.resources.science < upgradeCost}>UPGRADE FACILITY · {upgradeCost} SCIENCE</button>
        <div className="science-note"><span>✦ REAL-WORLD CONNECTION</span><p>{building.science}</p><a href={building.sourceUrl} target="_blank" rel="noreferrer">{building.sourceLabel} ↗</a></div>
      </Modal>}

      {state.currentEvent && <Modal onClose={() => {}} wide label="Mission event decision">
        <div className="event-modal-content"><div className="event-icon">{state.currentEvent.icon}</div><div className="modal-kicker">INCOMING TRANSMISSION / {state.currentEvent.tag}</div><h2>{state.currentEvent.title}</h2><p>{state.currentEvent.description}</p><div className="event-choices">{state.currentEvent.choices.map((choice, index) => <button className="event-choice" key={choice.id} onClick={() => onResolveEvent(choice.id)}><span>0{index + 1}</span><div><b>{choice.label}</b><small>{choice.detail}</small></div><i>↗</i></button>)}</div><div className="event-science"><span>SCIENCE BRIEF</span><p>{state.currentEvent.science}</p></div></div>
      </Modal>}

      {scienceOpen && <Modal wide onClose={() => setScienceOpen(false)} label="Science deck"><div className="modal-kicker">MISSION KNOWLEDGE BASE / NASA SCIENCE</div><h2 className="science-deck-title">THE SCIENCE BEHIND THE MISSION</h2><p className="modal-description">Explore the real research that inspired your outpost systems. Game values are simplified for learning and are not engineering specifications.</p><div className="science-deck-grid"><div className="science-tabs">{SCIENCE_CARDS.map((card) => <button key={card.id} className={selectedScience.id === card.id ? 'active' : ''} onClick={() => setSelectedScience(card)}><span>{card.icon}</span><div><b>{card.title}</b><small>{card.category}</small></div></button>)}</div><article className="science-detail"><span className="science-detail-icon">{selectedScience.icon}</span><div className="modal-kicker">{selectedScience.category}</div><h3>{selectedScience.title}</h3><p>{selectedScience.body}</p><div className="science-fact"><b>IN THIS GAME</b><p>{selectedScience.fact}</p></div><a href={selectedScience.url} target="_blank" rel="noreferrer">READ THE NASA REFERENCE ↗</a></article></div></Modal>}
    </main>
  );
}
