import { useEffect, useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import BriefingScreen from './screens/BriefingScreen';
import CampaignScreen from './screens/CampaignScreen';
import Modal from './components/Modal';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [difficulty, setDifficulty] = useState('engineer');
  const [howToOpen, setHowToOpen] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem('lunar-shift-best-score') || 0);
    setBestScore(Number.isFinite(saved) ? saved : 0);
  }, []);

  function startMission() {
    setScreen('campaign');
  }

  function returnHome() {
    setScreen('home');
  }

  function saveBestScore(score) {
    const nextBest = Math.max(bestScore, Number(score) || 0);
    setBestScore(nextBest);
    window.localStorage.setItem('lunar-shift-best-score', String(nextBest));
  }

  return (
    <div className="app-root">
      {screen === 'home' && <HomeScreen onStart={() => setScreen('briefing')} onHowTo={() => setHowToOpen(true)} onScience={() => setHowToOpen(true)} />}
      {screen === 'briefing' && <BriefingScreen difficulty={difficulty} setDifficulty={setDifficulty} onLaunch={startMission} onBack={() => setScreen('home')} />}
      {screen === 'campaign' && <CampaignScreen difficulty={difficulty} onExit={returnHome} onComplete={saveBestScore} />}

      {howToOpen && <Modal onClose={() => setHowToOpen(false)} wide label="How to play Lunar Shift">
        <div className="modal-kicker">QUICK START GUIDE / PLANETARY MISSION LAB</div>
        <h2 className="science-deck-title">HOW TO PLAY</h2>
        <p className="modal-description">Play five short missions: land on the Moon, survive Mars entry, guide a probe through Titan's atmosphere, drive a rover to collect rock cores, and manage a lunar outpost power crisis.</p>
        <div className="howto-grid">
          <div><span>01</span><b>FLY THE LANDER</b><p>Use W or the throttle slider to brake. Use A and D to correct sideways drift.</p></div>
          <div><span>02</span><b>TIME YOUR SYSTEMS</b><p>Deploy parachutes inside the altitude windows, release the heat shield at the right moment, and land gently.</p></div>
          <div><span>03</span><b>DRIVE THE ROVER</b><p>Use W/A/S/D to navigate around craters. Stop beside a sample and press E to drill it.</p></div>
          <div><span>04</span><b>THINK LIKE A COMMANDER</b><p>Allocate limited power between life support, food, radiation protection and communications.</p></div>
        </div>
        <div className="howto-warning"><b>TRAINING NOTE</b><p>Flight values are simplified gameplay models, not real spacecraft specifications or operational guidance.</p></div>
        <button className="button button-primary" onClick={() => { setHowToOpen(false); setScreen('briefing'); }}>UNDERSTOOD — LET'S GO ↗</button>
      </Modal>}
      <div className="app-build-tag">LUNAR SHIFT <span>·</span> PLANETARY BUILD 1.0 <span>·</span> BEST SCORE {bestScore}</div>
    </div>
  );
}
