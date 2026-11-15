import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const PLANET_STYLE = {
  moon: { sky: 0x070d1c, ground: 0x697487, rock: 0x485368, fog: 0x121d31, light: 0xb8d9ff, planet: 0x316da8 },
  mars: { sky: 0x391d1a, ground: 0x9b5c43, rock: 0x62382f, fog: 0x6d392e, light: 0xffc29b, planet: 0xc86c4b },
  titan: { sky: 0x2b1b16, ground: 0x9c7848, rock: 0x664b32, fog: 0x704b2e, light: 0xffd39b, planet: 0xd49a54 },
  rover: { sky: 0x3b201b, ground: 0x9b5a40, rock: 0x57372e, fog: 0x71392e, light: 0xffc69f, planet: 0xbf654b }
};

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function addStars(scene, count = 520) {
  const positions = [];
  const rand = seeded(13);
  for (let i = 0; i < count; i += 1) {
    positions.push((rand() - 0.5) * 180, rand() * 75 + 8, -rand() * 95 - 28);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xdbeeff, size: 0.16, transparent: true, opacity: 0.86, sizeAttenuation: true });
  scene.add(new THREE.Points(geometry, material));
}

function terrainHeight(x, z, seed = 1) {
  const wave = Math.sin(x * 0.16 + seed) * 0.38 + Math.cos(z * 0.12) * 0.42 + Math.sin((x + z) * 0.09) * 0.25;
  return wave - 0.35;
}

function addTerrain(scene, style, seed = 4) {
  const geometry = new THREE.PlaneGeometry(100, 100, 100, 100);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const z = -pos.getY(i);
    let height = terrainHeight(x, z, seed);
    // Keep the immediate landing pad level enough to read clearly.
    const padBlend = Math.max(0, 1 - Math.hypot(x, z + 1) / 12);
    height *= 1 - padBlend * 0.9;
    pos.setZ(i, height);
  }
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color: style.ground, roughness: 1, metalness: 0.02, flatShading: true });
  const ground = new THREE.Mesh(geometry, material);
  ground.receiveShadow = true;
  scene.add(ground);

  const rand = seeded(seed * 81 + 9);
  for (let i = 0; i < 54; i += 1) {
    const x = (rand() - 0.5) * 82;
    const z = -rand() * 76 + 20;
    if (Math.hypot(x, z + 1) < 8) continue;
    const radius = 0.3 + rand() * 1.5;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(radius, 0),
      new THREE.MeshStandardMaterial({ color: style.rock, roughness: 1, flatShading: true })
    );
    rock.position.set(x, terrainHeight(x, z, seed) + radius * 0.45, z);
    rock.rotation.set(rand() * 1.2, rand() * 2, rand() * 1.2);
    rock.scale.set(1 + rand() * 0.8, 0.5 + rand(), 0.8 + rand() * 0.5);
    rock.castShadow = true;
    scene.add(rock);
  }

  // Low ridgelines help the perspective read as a landscape, not a flat table.
  for (let i = 0; i < 8; i += 1) {
    const ridge = new THREE.Mesh(
      new THREE.ConeGeometry(5 + rand() * 7, 3 + rand() * 4, 5),
      new THREE.MeshStandardMaterial({ color: style.rock, roughness: 1, flatShading: true })
    );
    ridge.position.set((rand() - 0.5) * 90, 1 + rand() * 1.5, -35 - rand() * 18);
    ridge.rotation.y = rand() * Math.PI;
    ridge.scale.x = 1.8 + rand();
    scene.add(ridge);
  }
}

function makeLandingPad(scene) {
  const pad = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.45, 0.16, 48), new THREE.MeshStandardMaterial({ color: 0x25384b, metalness: 0.45, roughness: 0.55 }));
  disc.position.y = 0.05;
  disc.receiveShadow = true;
  pad.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.09, 8, 64), new THREE.MeshBasicMaterial({ color: 0x6de8ed }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.18;
  pad.add(ring);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(1.4, 32), new THREE.MeshBasicMaterial({ color: 0x294b5e, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  inner.rotation.x = -Math.PI / 2;
  inner.position.y = 0.145;
  pad.add(inner);
  for (let i = 0; i < 4; i += 1) {
    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.035, 0.35), new THREE.MeshBasicMaterial({ color: 0xb6f8ef }));
    const a = i * Math.PI / 2;
    marker.position.set(Math.cos(a) * 2.7, 0.2, Math.sin(a) * 2.7);
    pad.add(marker);
  }
  pad.position.set(0, 0, -1);
  scene.add(pad);
}

function makeLander() {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc6d3df, metalness: 0.64, roughness: 0.32 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x23384c, metalness: 0.65, roughness: 0.3 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd5a65d, metalness: 0.55, roughness: 0.34 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.92, 1.55, 12), bodyMat);
  body.position.y = 0.35;
  body.castShadow = true;
  group.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.9, 12), darkMat);
  nose.position.y = 1.57;
  group.add(nose);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.96, 0.18, 16), goldMat);
  band.position.y = -0.18;
  group.add(band);
  const window = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), new THREE.MeshStandardMaterial({ color: 0x7bd5e8, emissive: 0x123a4d, metalness: 0.35, roughness: 0.15 }));
  window.position.set(0, 0.55, 0.79);
  group.add(window);

  const legMat = new THREE.MeshStandardMaterial({ color: 0xb5c3d0, metalness: 0.7, roughness: 0.38 });
  const legPoints = [[-0.7, -0.35, -0.1], [0.7, -0.35, -0.1], [-0.7, -0.35, 0.1], [0.7, -0.35, 0.1]];
  legPoints.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 1.12, 8), legMat);
    leg.position.set(x * 1.16, y - 0.42, z * 3);
    leg.rotation.z = x < 0 ? -0.28 : 0.28;
    group.add(leg);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.09, 12), goldMat);
    foot.position.set(x * 1.48, -1.02, z * 3);
    group.add(foot);
  });

  const shield = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.18, 0.24, 32), new THREE.MeshStandardMaterial({ color: 0x4b596b, metalness: 0.62, roughness: 0.42 }));
  shield.position.y = -0.55;
  group.add(shield);

  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.65, 2.5, 16), new THREE.MeshBasicMaterial({ color: 0x7cecff, transparent: true, opacity: 0.74 }));
  plume.rotation.z = Math.PI;
  plume.position.y = -2.1;
  plume.visible = false;
  group.add(plume);

  const heatShield = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.42, 32), new THREE.MeshStandardMaterial({ color: 0xa44f36, metalness: 0.38, roughness: 0.7, side: THREE.DoubleSide }));
  heatShield.rotation.x = Math.PI;
  heatShield.position.y = -0.85;
  heatShield.name = 'heatShield';
  group.add(heatShield);

  function createCanopy(color, scale = 1) {
    const canopy = new THREE.Group();
    const fabric = new THREE.Mesh(new THREE.SphereGeometry(2.25 * scale, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.86, flatShading: true }));
    fabric.scale.y = 0.58;
    canopy.add(fabric);
    const ropeMat = new THREE.LineBasicMaterial({ color: 0xdce9ed, transparent: true, opacity: 0.78 });
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const points = [new THREE.Vector3(Math.cos(a) * 2.1 * scale, 0.06, Math.sin(a) * 2.1 * scale), new THREE.Vector3(0, -2.4, 0)];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      canopy.add(new THREE.Line(geo, ropeMat));
    }
    canopy.position.y = 4.0 * scale;
    canopy.visible = false;
    return canopy;
  }
  const chute = createCanopy(0xe7e2d2, 1);
  chute.name = 'mainChute';
  group.add(chute);
  const drogue = createCanopy(0xd5ad60, 0.52);
  drogue.name = 'drogueChute';
  drogue.position.y = 2.3;
  group.add(drogue);

  group.userData.plume = plume;
  group.userData.shield = heatShield;
  group.userData.mainChute = chute;
  group.userData.drogueChute = drogue;
  return group;
}

function makeRover() {
  const group = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xd7a960, metalness: 0.55, roughness: 0.36 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x253345, metalness: 0.55, roughness: 0.42 });
  const white = new THREE.MeshStandardMaterial({ color: 0xc8d8e4, metalness: 0.42, roughness: 0.45 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.72, 2.2), gold);
  body.position.y = 0.9;
  body.castShadow = true;
  group.add(body);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 1.0), white);
  upper.position.set(0, 1.48, -0.12);
  group.add(upper);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.4, 8), dark);
  mast.position.set(0, 2.38, -0.4);
  group.add(mast);
  const camera = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.42), dark);
  camera.position.set(0, 3.0, -0.4);
  group.add(camera);
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), new THREE.MeshBasicMaterial({ color: 0x70e4f1 }));
  lens.position.set(0, 3.0, -0.65);
  group.add(lens);
  for (const x of [-1, 1]) {
    for (const z of [-0.74, 0.74]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.26, 16), dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x * 1.02, 0.55, z);
      wheel.castShadow = true;
      group.add(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.28, 12), gold);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(x * 1.02, 0.55, z);
      group.add(hub);
    }
  }
  return group;
}

function makeSample(color = 0x70e5ef) {
  const group = new THREE.Group();
  const glow = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.045, 8, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }));
  glow.rotation.x = Math.PI / 2;
  glow.position.y = 0.12;
  group.add(glow);
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 0), new THREE.MeshStandardMaterial({ color: 0x75dfe5, emissive: 0x144d57, metalness: 0.5, roughness: 0.24 }));
  crystal.position.y = 0.86;
  crystal.scale.set(0.65, 1.4, 0.65);
  group.add(crystal);
  return group;
}

function makeCrater(x, z, radius) {
  const group = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.7, radius, 0.65, 32, 1, false), new THREE.MeshStandardMaterial({ color: 0x342e30, roughness: 1 }));
  bowl.position.y = -0.22;
  bowl.scale.y = 0.55;
  group.add(bowl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.74, 0.22, 8, 36), new THREE.MeshStandardMaterial({ color: 0x8b5c49, roughness: 1 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.12;
  group.add(rim);
  group.position.set(x, terrainHeight(x, z, 21) + 0.1, z);
  return group;
}

export default function ThreeWorld({ mode = 'landing', missionId = 'moon', telemetry = {}, roverState = null, label = 'MISSION SURFACE' }) {
  const mountRef = useRef(null);
  const sceneData = useRef({ telemetry, roverState });
  const [webglError, setWebglError] = useState(false);
  useEffect(() => { sceneData.current = { telemetry, roverState }; }, [telemetry, roverState]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let renderer;
    let frame = 0;
    let resizeObserver;
    let lander;
    let rover;
    let sampleGroups = [];
    let craters = [];
    let scene;
    let camera;
    let plume;
    let shield;
    let mainChute;
    let drogueChute;
    let rendererDisposed = false;
    const style = PLANET_STYLE[missionId] || PLANET_STYLE.moon;

    try {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(style.sky);
      scene.fog = new THREE.Fog(style.fog, 48, 130);
      camera = new THREE.PerspectiveCamera(43, 1, 0.1, 260);
      camera.position.set(0, mode === 'rover' ? 9 : 13, mode === 'rover' ? 15 : 34);
      camera.lookAt(0, mode === 'rover' ? 1.2 : 7, 0);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.domElement.className = 'three-world-canvas';
      mount.appendChild(renderer.domElement);
      setWebglError(false);

      const ambient = new THREE.HemisphereLight(0xc8ddf7, style.ground, 1.65);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(style.light, 2.7);
      sun.position.set(-18, 34, 20);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      scene.add(sun);
      const fill = new THREE.PointLight(style.light, 1.1, 80);
      fill.position.set(18, 12, 5);
      scene.add(fill);

      addStars(scene, missionId === 'moon' ? 650 : 240);
      addTerrain(scene, style, missionId === 'mars' ? 8 : missionId === 'titan' ? 14 : 3);

      const horizonBody = new THREE.Mesh(
        new THREE.SphereGeometry(missionId === 'moon' ? 5.5 : 4.5, 28, 20),
        new THREE.MeshStandardMaterial({ color: style.planet, roughness: 0.95, emissive: style.planet, emissiveIntensity: 0.08 })
      );
      horizonBody.position.set(22, 21, -75);
      scene.add(horizonBody);
      const horizonGlow = new THREE.Mesh(new THREE.SphereGeometry(missionId === 'moon' ? 6.3 : 5.0, 24, 16), new THREE.MeshBasicMaterial({ color: style.planet, transparent: true, opacity: 0.08, side: THREE.BackSide }));
      horizonGlow.position.copy(horizonBody.position);
      scene.add(horizonGlow);

      if (mode === 'landing') {
        makeLandingPad(scene);
        lander = makeLander();
        scene.add(lander);
        plume = lander.userData.plume;
        shield = lander.userData.shield;
        mainChute = lander.userData.mainChute;
        drogueChute = lander.userData.drogueChute;
      } else {
        // Expedition base and a set of rough terrain obstacles.
        const base = new THREE.Group();
        const baseBody = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0x8ea9b5, metalness: 0.45, roughness: 0.5 }));
        baseBody.position.y = 0.65;
        base.add(baseBody);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5aa3b6, transparent: true, opacity: 0.72, roughness: 0.2 }));
        dome.position.y = 1.25;
        base.add(dome);
        base.position.set(-12, 0, 12);
        scene.add(base);

        const samplePositions = [[7, -6], [-12, -17], [13, -28]];
        sampleGroups = samplePositions.map(([x, z], i) => {
          const sample = makeSample(i === 1 ? 0xf1c16c : 0x70e5ef);
          sample.position.set(x, terrainHeight(x, z, 21), z);
          scene.add(sample);
          return sample;
        });
        craters = [[-1, -11, 2.5], [5, -21, 2.2], [-9, -27, 2.7], [14, -13, 1.8], [2, -31, 2.4]].map(([x, z, radius]) => {
          const crater = makeCrater(x, z, radius);
          scene.add(crater);
          return crater;
        });
        rover = makeRover();
        scene.add(rover);
      }

      const clock = new THREE.Clock();
      const animate = () => {
        if (rendererDisposed) return;
        frame = window.requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();
        if (mode === 'landing' && lander) {
          const t = sceneData.current.telemetry || {};
          const maxAltitude = Number(t.maxAltitude || (missionId === 'moon' ? 220 : missionId === 'mars' ? 9000 : 12000));
          const altitude = Math.max(0, Number(t.altitude ?? maxAltitude));
          const lift = 1.15 + (altitude / maxAltitude) * 19;
          lander.position.set(Number(t.x || 0) * 0.62, lift, 0);
          lander.rotation.z = THREE.MathUtils.degToRad(Number(t.tilt || 0));
          lander.rotation.x = Math.sin(elapsed * 0.35) * 0.012;
          plume.visible = Number(t.effectiveThrottle || 0) > 2;
          plume.scale.setScalar(0.65 + Number(t.effectiveThrottle || 0) / 95 * (0.82 + Math.sin(elapsed * 18) * 0.1));
          shield.visible = Boolean(t.shieldAttached);
          mainChute.visible = Boolean(t.mainChute || (missionId === 'mars' && t.parachute));
          drogueChute.visible = Boolean(t.drogueChute);
          if (mainChute.visible) mainChute.position.y = missionId === 'titan' ? 4.5 : 4.0;
        }
        if (mode === 'rover' && rover) {
          const r = sceneData.current.roverState || {};
          const x = Number(r.x || -12);
          const z = Number(r.z || 12);
          rover.position.set(x, terrainHeight(x, z, 21), z);
          rover.rotation.y = Number(r.heading || 0);
          // Camera follows behind the rover but keeps some terrain visible ahead.
          const targetCamera = new THREE.Vector3(x + Math.sin(r.heading || 0) * 2.5, 8.4, z + Math.cos(r.heading || 0) * 12);
          camera.position.lerp(targetCamera, 0.075);
          camera.lookAt(x, 0.5, z - 4.5);
          sampleGroups.forEach((sample, index) => {
            const collected = (r.collected || []).includes(index);
            sample.visible = !collected;
            sample.position.y = terrainHeight(sample.position.x, sample.position.z, 21) + 0.18 + Math.sin(elapsed * 2.2 + index) * 0.1;
            sample.rotation.y = elapsed * 0.6 + index;
          });
          craters.forEach((crater, index) => { crater.rotation.y = Math.sin(elapsed * 0.15 + index) * 0.02; });
        }
        if (renderer && camera) renderer.render(scene, camera);
      };
      animate();

      const resize = () => {
        if (!mount || !renderer || !camera) return;
        const width = Math.max(320, mount.clientWidth || 900);
        const height = Math.max(320, mount.clientHeight || 520);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      resize();
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);
      } else {
        window.addEventListener('resize', resize);
      }
    } catch (error) {
      console.error('3D world could not be initialized:', error);
      setWebglError(true);
    }

    return () => {
      rendererDisposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      if (resizeObserver) resizeObserver.disconnect();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement?.parentNode === mount) mount.removeChild(renderer.domElement);
      }
      if (scene) {
        scene.traverse((object) => {
          object.geometry?.dispose?.();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose?.());
          else object.material?.dispose?.();
        });
      }
    };
  }, [mode, missionId]);

  return (
    <div className={`three-world three-world-${missionId}`}>
      <div className="three-world-label"><span className="world-live-dot" /> {label}</div>
      <div className="three-world-coordinates">3D SIMULATION · {mode === 'rover' ? 'ROVER CAM' : 'FLIGHT CAM'}</div>
      <div ref={mountRef} className="three-world-mount" />
      {webglError && <div className="webgl-fallback"><b>3D VIEW UNAVAILABLE</b><span>Try Chrome or Edge with hardware acceleration enabled. The mission controls remain available.</span></div>}
      <div className="three-world-caption"><span>MISSION ENVIRONMENT / SIMULATED</span><span>DRAG IS NOT TO SCALE</span></div>
    </div>
  );
}
