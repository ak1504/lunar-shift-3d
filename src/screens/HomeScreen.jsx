export default function HomeScreen({ onStart, onHowTo, onScience }) {
  return (
    <main className="home-screen">
      <div className="home-topbar"><div className="brand-lockup"><span className="brand-mark">LS</span><span>SPACE EXPLORATION PROGRAM <b>· JUNIOR DIVISION</b></span></div><span className="topbar-status"><i /> SYSTEM ONLINE</span></div>
      <section className="hero-wrap">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR FIRST MISSION STARTS HERE</div>
          <h1>LUNAR<br /><em>SHIFT</em><span className="hero-period">.</span></h1>
          <p className="hero-subtitle">JUNIOR ASTRONAUT<br />MISSION TRAINER</p>
          <p className="hero-description">Fly landers through alien atmospheres. Drive a rover across Mars. Collect rock cores and keep a lunar outpost alive. Every mission is a new challenge.</p>
          <div className="hero-actions">
            <button className="button button-primary button-large" onClick={onStart}>START YOUR MISSION <span>↗</span></button>
            <button className="button button-ghost" onClick={onHowTo}>HOW TO PLAY <span>⌄</span></button>
          </div>
          <div className="hero-footnote"><span>✦</span> 3 WORLDS <span>·</span> 1 ROVER EXPEDITION <span>·</span> 1 OUTPOST TO SAVE</div>
        </div>
        <div className="hero-art" aria-label="Illustration of a lunar base">
          <div className="hero-moon" />
          <div className="hero-earth" />
          <div className="hero-star star-a" /><div className="hero-star star-b" /><div className="hero-star star-c" /><div className="hero-star star-d" />
          <div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" />
          <div className="hero-mountain mountain-back" /><div className="hero-mountain mountain-front" />
          <div className="hero-solar solar-left"><i /><i /><i /><i /></div>
          <div className="hero-habitat"><div className="habitat-dome" /><div className="habitat-core" /><div className="habitat-wing" /></div>
          <div className="hero-greenhouse"><i /><i /><i /></div>
          <div className="hero-rover"><span>◉</span><span>◉</span></div>
          <div className="hero-art-caption"><span>01 / 03</span><b>THE LUNAR SOUTH POLE</b><small>YOUR NEW HOME IS WAITING</small></div>
        </div>
      </section>
      <footer className="home-footer"><span>A 3D PLANETARY EXPLORATION CAMPAIGN</span><span>INSPIRED BY NASA SCIENCE · MADE FOR FUTURE EXPLORERS</span></footer>
    </main>
  );
}
