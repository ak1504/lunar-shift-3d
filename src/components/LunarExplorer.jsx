import { useEffect, useRef, useState } from 'react';
import { BUILDINGS } from '../data/buildings';

const WORLD = { width: 1280, height: 720 };
const FACILITIES = [
  { id: 'airlock', x: 640, y: 104, w: 154, h: 78, label: 'AIRLOCK', subtitle: 'MISSION ENTRY / EXTRACTION', color: '#72dce7' },
  { id: 'solar', x: 255, y: 230, w: 190, h: 110, label: 'SOLAR ARRAY', subtitle: 'POWER SYSTEM', color: '#e8c56c' },
  { id: 'habitat', x: 630, y: 330, w: 190, h: 132, label: 'CREW HABITAT', subtitle: 'LIFE SUPPORT', color: '#77dfe4' },
  { id: 'recycler', x: 1005, y: 225, w: 166, h: 116, label: 'WATER RECYCLER', subtitle: 'WATER SYSTEM', color: '#77c8f1' },
  { id: 'greenhouse', x: 1000, y: 500, w: 180, h: 122, label: 'GREENHOUSE', subtitle: 'FOOD PRODUCTION', color: '#74d9a0' },
  { id: 'shelter', x: 275, y: 515, w: 178, h: 108, label: 'RADIATION SHELTER', subtitle: 'CREW PROTECTION', color: '#c5b995' },
  { id: 'rover', x: 640, y: 594, w: 128, h: 76, label: 'LUNAR ROVER', subtitle: 'EXPLORATION', color: '#e3be77' },
  { id: 'beacon', x: 1110, y: 405, w: 86, h: 120, label: 'SIGNAL BEACON', subtitle: 'SCAN DATA', color: '#e6a8ff' }
];

const PICKUPS = [
  { id: 'sample-west', kind: 'sample', x: 470, y: 365, icon: '◆', label: 'SOIL SAMPLE A', color: '#7de7ec' },
  { id: 'sample-east', kind: 'sample', x: 850, y: 520, icon: '◆', label: 'SOIL SAMPLE B', color: '#7de7ec' },
  { id: 'sample-north', kind: 'sample', x: 815, y: 205, icon: '◆', label: 'SOIL SAMPLE C', color: '#7de7ec' },
  { id: 'ice-core', kind: 'ice', x: 1138, y: 565, icon: '✦', label: 'ICE DEPOSIT', color: '#94cfff' },
  { id: 'oxygen-cache', kind: 'oxygen', x: 430, y: 640, icon: 'O₂', label: 'OXYGEN CACHE', color: '#8be8ed' },
  { id: 'power-cell', kind: 'power', x: 855, y: 635, icon: '⚡', label: 'POWER CELL', color: '#f2d37d' }
];

const CRATERS = [
  { x: 115, y: 375, rx: 68, ry: 27 }, { x: 520, y: 150, rx: 48, ry: 21 },
  { x: 905, y: 360, rx: 73, ry: 30 }, { x: 765, y: 660, rx: 56, ry: 23 },
  { x: 1160, y: 145, rx: 39, ry: 18 }, { x: 505, y: 570, rx: 41, ry: 17 }
];

const HAZARD = { x: 1095, y: 570, radius: 108 };
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function roundedRect(ctx, x, y, w, h, r = 10) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawText(ctx, text, x, y, size = 12, color = '#dbeafa', align = 'center', weight = '600') {
  ctx.save();
  ctx.font = `${weight} ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0,0,0,.55)';
  ctx.shadowBlur = 5;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawCrater(ctx, crater) {
  ctx.save();
  ctx.translate(crater.x, crater.y);
  ctx.scale(1, crater.ry / crater.rx);
  const gradient = ctx.createRadialGradient(-crater.rx * .15, -crater.rx * .2, crater.rx * .08, 0, 0, crater.rx);
  gradient.addColorStop(0, 'rgba(9,17,31,.66)');
  gradient.addColorStop(.72, 'rgba(24,35,53,.54)');
  gradient.addColorStop(1, 'rgba(178,190,204,.24)');
  ctx.beginPath(); ctx.arc(0, 0, crater.rx, 0, Math.PI * 2);
  ctx.fillStyle = gradient; ctx.fill();
  ctx.strokeStyle = 'rgba(218,226,237,.24)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}

function drawSolar(ctx, f, active, tick) {
  const x = f.x - 78; const y = f.y - 16;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#3e536d'; ctx.fillRect(68, 65, 5, 28);
  ctx.fillStyle = '#71869b'; ctx.fillRect(43, 90, 54, 5);
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const px = col * 38; const py = row * 31;
      ctx.save(); ctx.translate(px + 18, py + 18); ctx.rotate(-.12);
      const g = ctx.createLinearGradient(-16, -12, 17, 13);
      g.addColorStop(0, active ? '#3179ae' : '#3b4b5e'); g.addColorStop(1, active ? '#122e52' : '#202e40');
      ctx.fillStyle = g; ctx.fillRect(-17, -13, 34, 26);
      ctx.strokeStyle = active ? 'rgba(133,216,248,.74)' : 'rgba(132,148,165,.35)'; ctx.lineWidth = 1; ctx.strokeRect(-17, -13, 34, 26);
      ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(0, 13); ctx.moveTo(-17, 0); ctx.lineTo(17, 0); ctx.stroke();
      ctx.restore();
    }
  }
  ctx.fillStyle = '#aebaca'; ctx.fillRect(73, 52, 4, 45);
  ctx.fillStyle = '#d4dce6'; ctx.fillRect(62, 93, 27, 4);
  ctx.restore();
  drawText(ctx, active ? '☀' : '◌', f.x, f.y - 43, 23, active ? '#f6d26d' : '#718097');
}

function drawHabitat(ctx, f, tick) {
  const x = f.x - 82; const y = f.y - 45;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 57, 105, 20, 0, 0, Math.PI * 2); ctx.fill();
  const dome = ctx.createLinearGradient(x, y, x + 160, y + 100);
  dome.addColorStop(0, '#d6ecf1'); dome.addColorStop(.4, '#6996ae'); dome.addColorStop(1, '#213e5c');
  ctx.fillStyle = dome; ctx.strokeStyle = '#b8dce4'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + 13, y + 88); ctx.lineTo(x + 25, y + 41); ctx.quadraticCurveTo(x + 80, y - 30, x + 135, y + 41); ctx.lineTo(x + 147, y + 88); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#263d57'; ctx.fillRect(x + 7, y + 86, 147, 31); ctx.strokeStyle = '#9cb9cb'; ctx.strokeRect(x + 7, y + 86, 147, 31);
  ctx.fillStyle = '#a9d8e8'; ctx.fillRect(x + 66, y + 52, 29, 27); ctx.fillStyle = '#2b5472'; ctx.fillRect(x + 70, y + 56, 21, 19);
  ctx.fillStyle = '#e3c68a'; ctx.fillRect(x + 119, y + 92, 19, 25);
  for (let i = 0; i < 3; i += 1) { ctx.fillStyle = `rgba(125,235,237,${.18 + .1 * Math.sin(tick / 300 + i)})`; ctx.fillRect(x + 28 + i * 22, y + 33, 9, 6); }
  ctx.restore();
}

function drawRecycler(ctx, f, active) {
  const x = f.x - 65; const y = f.y - 38;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 44, 80, 16, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createLinearGradient(x, y, x + 135, y + 95); g.addColorStop(0, '#b6d5e3'); g.addColorStop(.55, '#64849b'); g.addColorStop(1, '#253f59');
  ctx.fillStyle = g; ctx.strokeStyle = '#c8e1e9'; ctx.lineWidth = 2; roundedRect(ctx, x, y + 13, 130, 72, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#54758e'; roundedRect(ctx, x + 13, y + 27, 42, 44, 7); ctx.fill();
  ctx.fillStyle = active ? '#69d8f4' : '#65788c'; ctx.beginPath(); ctx.arc(x + 34, y + 48, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#223b54'; roundedRect(ctx, x + 72, y + 27, 43, 42, 6); ctx.fill();
  ctx.fillStyle = active ? '#88e4f4' : '#71869a'; ctx.fillRect(x + 80, y + 36, 27, 5);
  ctx.strokeStyle = '#b7d6e2'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 4, y + 84); ctx.lineTo(x + 4, y + 99); ctx.lineTo(x + 123, y + 99); ctx.lineTo(x + 123, y + 84); ctx.stroke();
  ctx.restore();
}

function drawGreenhouse(ctx, f, active) {
  const x = f.x - 76; const y = f.y - 43;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 50, 91, 17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 18, y + 86); ctx.lineTo(x + 30, y + 19); ctx.lineTo(x + 121, y + 19); ctx.lineTo(x + 137, y + 86); ctx.closePath();
  const g = ctx.createLinearGradient(x, y, x + 135, y + 95); g.addColorStop(0, 'rgba(171,237,219,.75)'); g.addColorStop(1, 'rgba(28,99,81,.82)');
  ctx.fillStyle = g; ctx.strokeStyle = '#a4e9d1'; ctx.lineWidth = 3; ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(212,251,236,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 74, y + 20); ctx.lineTo(x + 74, y + 86); ctx.moveTo(x + 25, y + 53); ctx.lineTo(x + 132, y + 53); ctx.stroke();
  for (let i = 0; i < 4; i += 1) {
    const px = x + 37 + i * 22;
    ctx.fillStyle = active ? '#5ed08d' : '#597a70'; ctx.fillRect(px, y + 68, 5, 17);
    ctx.beginPath(); ctx.ellipse(px + 1, y + 65, 8, 4, -.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawShelter(ctx, f) {
  const x = f.x - 74; const y = f.y - 25;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.27)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 42, 93, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#897f6d'; ctx.strokeStyle = '#d5c7a5'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + 7, y + 39); ctx.lineTo(x + 25, y + 6); ctx.lineTo(x + 123, y + 6); ctx.lineTo(x + 142, y + 39); ctx.lineTo(x + 142, y + 68); ctx.lineTo(x + 7, y + 68); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#27394e'; roundedRect(ctx, x + 53, y + 32, 42, 36, 5); ctx.fill(); ctx.strokeStyle = '#c8b990'; ctx.stroke();
  ctx.fillStyle = '#e6d1a5'; ctx.fillRect(x + 68, y + 42, 12, 26);
  ctx.restore();
}

function drawRover(ctx, f, tick) {
  const x = f.x - 51; const y = f.y - 22;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 27, 61, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8c18f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 8, y + 26); ctx.lineTo(x + 89, y + 26); ctx.stroke();
  ctx.fillStyle = '#d2b16d'; ctx.strokeStyle = '#f1d99b'; ctx.lineWidth = 2; roundedRect(ctx, x + 9, y + 1, 78, 31, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#24344c'; roundedRect(ctx, x + 35, y - 11, 31, 19, 4); ctx.fill();
  ctx.fillStyle = '#8bd8e7'; ctx.fillRect(x + 44, y - 7, 14, 7);
  for (let i = 0; i < 4; i += 1) { ctx.fillStyle = '#1d2736'; ctx.beginPath(); ctx.arc(x + 18 + i * 20, y + 32, 9, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#aebac8'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.strokeStyle = '#d9c18c'; ctx.beginPath(); ctx.moveTo(x + 75, y + 3); ctx.lineTo(x + 98, y - 18); ctx.stroke();
  ctx.restore();
}

function drawBeacon(ctx, f, tick) {
  ctx.save();
  const pulse = 1 + .06 * Math.sin(tick / 180);
  ctx.translate(f.x, f.y - 8);
  ctx.fillStyle = '#536a82'; ctx.fillRect(-5, 5, 10, 77);
  ctx.fillStyle = '#b7c8d8'; ctx.fillRect(-20, 76, 40, 6);
  ctx.strokeStyle = '#d9c8ed'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-25, 6); ctx.lineTo(0, -22); ctx.lineTo(25, 6); ctx.stroke();
  ctx.fillStyle = '#d8a7ff'; ctx.beginPath(); ctx.arc(0, -17, 8 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(223,173,255,.38)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -17, 22 * pulse, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawAirlock(ctx, f) {
  const x = f.x - 62; const y = f.y - 23;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 27, 78, 15, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createLinearGradient(x, y, x + 124, y + 60); g.addColorStop(0, '#a6c7d8'); g.addColorStop(1, '#263f5c');
  ctx.fillStyle = g; ctx.strokeStyle = '#d6f4fa'; ctx.lineWidth = 2; roundedRect(ctx, x, y, 124, 50, 9); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#162c43'; roundedRect(ctx, x + 43, y + 8, 39, 42, 6); ctx.fill();
  ctx.strokeStyle = '#84dce7'; ctx.lineWidth = 2; ctx.strokeRect(x + 49, y + 14, 27, 30);
  ctx.fillStyle = '#7ce5ef'; ctx.beginPath(); ctx.arc(x + 63, y + 28, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawFacility(ctx, facility, buildingState, tick, active) {
  const complete = active?.tasks?.[facility.id];
  const near = active?.nearestId === facility.id;
  if (near) {
    ctx.save(); ctx.strokeStyle = 'rgba(113,235,239,.8)'; ctx.lineWidth = 3; ctx.setLineDash([8, 7]);
    ctx.beginPath(); ctx.ellipse(facility.x, facility.y + 18, facility.w * .66, facility.h * .62, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  if (facility.id === 'solar') drawSolar(ctx, facility, buildingState?.active, tick);
  if (facility.id === 'habitat') drawHabitat(ctx, facility, tick);
  if (facility.id === 'recycler') drawRecycler(ctx, facility, buildingState?.active);
  if (facility.id === 'greenhouse') drawGreenhouse(ctx, facility, buildingState?.active);
  if (facility.id === 'shelter') drawShelter(ctx, facility);
  if (facility.id === 'rover') drawRover(ctx, facility, tick);
  if (facility.id === 'beacon') drawBeacon(ctx, facility, tick);
  if (facility.id === 'airlock') drawAirlock(ctx, facility);

  const labelY = facility.y + facility.h * .55 + 22;
  if (facility.id !== 'airlock' && facility.id !== 'beacon') {
    drawText(ctx, facility.label, facility.x, labelY, 11, complete ? '#8df0b7' : '#e9f3fc');
    drawText(ctx, `LVL ${buildingState?.level || 1} · ${buildingState?.active === false ? 'PAUSED' : 'ONLINE'}`, facility.x, labelY + 15, 8, buildingState?.active === false ? '#a2a9b6' : '#8babc5');
  } else {
    drawText(ctx, facility.label, facility.x, facility.y + 50, 10, facility.color);
  }
  if (near) {
    ctx.save(); ctx.fillStyle = 'rgba(8,19,32,.92)'; roundedRect(ctx, facility.x - 42, facility.y - facility.h * .75 - 38, 84, 25, 6); ctx.fill();
    drawText(ctx, 'E  INTERACT', facility.x, facility.y - facility.h * .75 - 21, 10, '#8cf2f2'); ctx.restore();
  }
}

function drawPickup(ctx, item, tick) {
  const pulse = 1 + Math.sin(tick / 190 + item.x) * .1;
  ctx.save(); ctx.translate(item.x, item.y); ctx.scale(pulse, pulse);
  ctx.shadowColor = item.color; ctx.shadowBlur = 18;
  ctx.fillStyle = 'rgba(10,24,40,.88)'; ctx.strokeStyle = item.color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0; drawText(ctx, item.icon, 0, 5, item.kind === 'oxygen' ? 10 : 18, item.color);
  drawText(ctx, item.label, 0, 37, 8, '#d4e7f7');
  ctx.restore();
}

function drawAstronaut(ctx, player, tick) {
  ctx.save(); ctx.translate(player.x, player.y);
  const walking = Math.abs(player.vx) + Math.abs(player.vy) > 2;
  const stride = walking ? Math.sin(tick / 65) * 5 : Math.sin(tick / 450) * 1.2;
  ctx.fillStyle = 'rgba(0,0,0,.36)'; ctx.beginPath(); ctx.ellipse(0, 17, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
  // backpack
  ctx.fillStyle = '#e1e7ec'; roundedRect(ctx, -17, -13, 11, 26, 4); ctx.fill(); ctx.strokeStyle = '#8196a9'; ctx.lineWidth = 1; ctx.stroke();
  // legs
  ctx.strokeStyle = '#f0f3f7'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-5, 8); ctx.lineTo(-7 - stride, 18); ctx.moveTo(5, 8); ctx.lineTo(7 + stride, 18); ctx.stroke();
  ctx.strokeStyle = '#607d9b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-7 - stride, 18); ctx.lineTo(-3 - stride, 21); ctx.moveTo(7 + stride, 18); ctx.lineTo(11 + stride, 21); ctx.stroke();
  // suit body and arms
  ctx.fillStyle = '#edf3f8'; ctx.strokeStyle = '#9eafbf'; ctx.lineWidth = 1.5; roundedRect(ctx, -12, -10, 24, 25, 8); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#e6edf4'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(-17, 7 + stride * .45); ctx.moveTo(10, -4); ctx.lineTo(16, 7 - stride * .45); ctx.stroke();
  ctx.fillStyle = '#65d9e7'; roundedRect(ctx, -5, -3, 10, 8, 2); ctx.fill();
  // helmet
  ctx.fillStyle = '#f3f6f9'; ctx.strokeStyle = '#a7bdcb'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -16, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  const visor = ctx.createLinearGradient(-9, -24, 9, -8); visor.addColorStop(0, '#9ae9f3'); visor.addColorStop(.45, '#28658e'); visor.addColorStop(1, '#102843');
  ctx.fillStyle = visor; ctx.beginPath(); ctx.ellipse(1, -16, 9.5, 8, -.12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(220,252,255,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-4, -21); ctx.lineTo(2, -24); ctx.stroke();
  ctx.restore();
}

function drawWorld(ctx, player, buildings, tasks, collected, tick, hud) {
  const bg = ctx.createLinearGradient(0, 0, 0, WORLD.height); bg.addColorStop(0, '#101d34'); bg.addColorStop(.44, '#263b56'); bg.addColorStop(.45, '#7b8796'); bg.addColorStop(1, '#49586d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  // sky and stars
  for (let i = 0; i < 90; i += 1) {
    const x = (i * 173 + 31) % WORLD.width; const y = (i * 83 + 17) % 250;
    const alpha = .25 + .45 * Math.abs(Math.sin(tick / 1200 + i));
    ctx.fillStyle = `rgba(224,241,255,${alpha})`; ctx.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }
  const earth = ctx.createRadialGradient(1090, 100, 3, 1090, 100, 40); earth.addColorStop(0, '#b4ebff'); earth.addColorStop(.45, '#3e8fc0'); earth.addColorStop(1, '#193b6d');
  ctx.fillStyle = earth; ctx.beginPath(); ctx.arc(1090, 100, 29, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(153,224,174,.65)'; ctx.beginPath(); ctx.ellipse(1081, 91, 12, 6, -.5, 0, Math.PI * 2); ctx.fill();
  // distant ridge
  ctx.fillStyle = '#5d6e85'; ctx.beginPath(); ctx.moveTo(0, 300); ctx.lineTo(115, 240); ctx.lineTo(220, 295); ctx.lineTo(370, 225); ctx.lineTo(490, 286); ctx.lineTo(660, 220); ctx.lineTo(820, 280); ctx.lineTo(1010, 218); ctx.lineTo(1140, 270); ctx.lineTo(1280, 220); ctx.lineTo(1280, 400); ctx.lineTo(0, 400); ctx.closePath(); ctx.fill();
  // foreground terrain facets
  ctx.fillStyle = 'rgba(31,46,68,.28)'; ctx.beginPath(); ctx.moveTo(0, 485); ctx.lineTo(140, 425); ctx.lineTo(285, 475); ctx.lineTo(430, 410); ctx.lineTo(610, 495); ctx.lineTo(790, 430); ctx.lineTo(960, 500); ctx.lineTo(1120, 420); ctx.lineTo(1280, 475); ctx.lineTo(1280, 720); ctx.lineTo(0, 720); ctx.closePath(); ctx.fill();
  // paths
  ctx.strokeStyle = 'rgba(222,230,239,.22)'; ctx.lineWidth = 29; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(640, 155); ctx.bezierCurveTo(480, 230, 440, 320, 640, 370); ctx.bezierCurveTo(820, 420, 860, 500, 640, 590); ctx.stroke();
  ctx.strokeStyle = 'rgba(30,43,61,.2)'; ctx.lineWidth = 2; ctx.setLineDash([14, 12]); ctx.beginPath(); ctx.moveTo(640, 155); ctx.bezierCurveTo(480, 230, 440, 320, 640, 370); ctx.bezierCurveTo(820, 420, 860, 500, 640, 590); ctx.stroke(); ctx.setLineDash([]);
  CRATERS.forEach((crater) => drawCrater(ctx, crater));
  // small rocks
  for (let i = 0; i < 48; i += 1) {
    const x = (i * 251 + 37) % WORLD.width; const y = 260 + ((i * 139 + 73) % 440); const r = 2 + (i % 4) * 1.6;
    ctx.fillStyle = i % 2 ? 'rgba(39,52,72,.55)' : 'rgba(210,217,225,.35)'; ctx.beginPath(); ctx.ellipse(x, y, r * 1.4, r, i * .31, 0, Math.PI * 2); ctx.fill();
  }
  // radiation hazard field
  const pulse = 1 + Math.sin(tick / 230) * .045;
  const hz = ctx.createRadialGradient(HAZARD.x, HAZARD.y, 8, HAZARD.x, HAZARD.y, HAZARD.radius * pulse);
  hz.addColorStop(0, 'rgba(245,79,100,.25)'); hz.addColorStop(.65, 'rgba(245,79,100,.13)'); hz.addColorStop(1, 'rgba(245,79,100,0)');
  ctx.fillStyle = hz; ctx.beginPath(); ctx.arc(HAZARD.x, HAZARD.y, HAZARD.radius * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,125,133,.42)'; ctx.setLineDash([7, 7]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(HAZARD.x, HAZARD.y, HAZARD.radius * .7, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  drawText(ctx, '☢ RADIATION HOT ZONE', HAZARD.x, HAZARD.y - HAZARD.radius * .7 - 9, 9, '#ff9aa5');
  // facilities
  const active = { tasks, nearestId: hud.nearestId };
  FACILITIES.forEach((facility) => drawFacility(ctx, facility, buildings[facility.id], tick, active));
  // pickups
  PICKUPS.forEach((item) => { if (!collected.has(item.id)) drawPickup(ctx, item, tick); });
  // player waypoint
  if (hud.target) {
    ctx.strokeStyle = 'rgba(117,235,240,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hud.target.x, hud.target.y, 10 + Math.sin(tick / 120) * 3, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hud.target.x - 16, hud.target.y); ctx.lineTo(hud.target.x + 16, hud.target.y); ctx.moveTo(hud.target.x, hud.target.y - 16); ctx.lineTo(hud.target.x, hud.target.y + 16); ctx.stroke();
  }
  drawAstronaut(ctx, player, tick);
  // world HUD
  ctx.fillStyle = 'rgba(6,13,25,.78)'; roundedRect(ctx, 20, 18, 258, 42, 8); ctx.fill();
  drawText(ctx, 'EVA FIELD ZONE  /  OUTPOST A', 34, 44, 11, '#9fe7f0', 'left');
  ctx.fillStyle = 'rgba(6,13,25,.76)'; roundedRect(ctx, 1010, 18, 250, 42, 8); ctx.fill();
  drawText(ctx, hud.inHazard ? 'RADIATION EXPOSURE — MOVE OUT' : 'SURFACE CONDITIONS: STABLE', 1135, 44, 9, hud.inHazard ? '#ff9da5' : '#9ee7b5');
  drawText(ctx, 'CLICK TO MOVE  ·  WASD TO WALK  ·  E TO INTERACT', 640, 696, 10, '#d6e3f1');
}

function getNearestFacility(player) {
  const candidates = FACILITIES.filter((f) => !['airlock', 'beacon'].includes(f.id)).map((f) => ({ ...f, distance: distance(player, f) }));
  return candidates.sort((a, b) => a.distance - b.distance)[0];
}

export default function LunarExplorer({ buildings, tasks = {}, collectedItems = [], fieldMissionComplete = false, disabled = false, onSelect, onPickup, onExtract }) {
  const controlsDisabled = disabled || fieldMissionComplete;
  const canvasRef = useRef(null);
  const keysRef = useRef(new Set());
  const playerRef = useRef({ x: 640, y: 455, vx: 0, vy: 0, facing: 'down' });
  const targetRef = useRef(null);
  const claimedRef = useRef(new Set(collectedItems));
  const callbacksRef = useRef({ onSelect, onPickup, onExtract });
  const [hud, setHud] = useState({ oxygen: 100, battery: 100, nearby: null, samples: 0, beaconScanned: false, inHazard: false, toast: 'EVA READY — collect two lunar samples and scan the signal beacon.', target: null });
  const [mobileDirection, setMobileDirection] = useState('');
  const toastTimer = useRef(null);
  const hudRef = useRef(hud);
  const stateRef = useRef({ oxygen: 100, battery: 100, samples: 0, beaconScanned: false, inHazard: false, lastHazardHit: 0, lastHud: 0, toast: hud.toast });

  useEffect(() => { callbacksRef.current = { onSelect, onPickup, onExtract }; }, [onSelect, onPickup, onExtract]);
  useEffect(() => { claimedRef.current = new Set(collectedItems); }, [collectedItems]);
  useEffect(() => { hudRef.current = hud; }, [hud]);


  function showToast(message) {
    stateRef.current.toast = message;
    setHud((current) => ({ ...current, toast: message }));
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => { stateRef.current.toast = ''; setHud((current) => ({ ...current, toast: '' })); }, 3000);
  }

  function collect(item) {
    if (claimedRef.current.has(item.id)) return;
    claimedRef.current.add(item.id);
    if (item.kind === 'oxygen') stateRef.current.oxygen = Math.min(100, stateRef.current.oxygen + 28);
    if (item.kind === 'power') stateRef.current.battery = Math.min(100, stateRef.current.battery + 35);
    callbacksRef.current.onPickup?.(item.id);
    const messages = {
      sample: `${item.label} secured. Science data uploaded to the mission log.`,
      ice: 'Water-ice deposit recorded. The sample can support future resource planning.',
      oxygen: 'Suit oxygen cache collected. EVA reserve replenished.',
      power: 'Suit power cell collected. Mobility systems recharged.'
    };
    showToast(messages[item.kind]);
  }

  function interact() {
    if (controlsDisabled) return;
    const player = playerRef.current;
    const airlock = FACILITIES.find((f) => f.id === 'airlock');
    if (distance(player, airlock) < 88) {
      const samples = [...claimedRef.current].filter((id) => id.startsWith('sample-')).length;
      const scanned = claimedRef.current.has('signal-beacon');
      if (samples >= 2 && scanned) callbacksRef.current.onExtract?.();
      else showToast(`Extraction locked: recover 2 soil samples and scan the beacon. Current: ${samples}/2 samples · ${scanned ? 'beacon scanned' : 'beacon not scanned'}.`);
      return;
    }
    const beacon = FACILITIES.find((f) => f.id === 'beacon');
    if (distance(player, beacon) < 100) {
      if (claimedRef.current.has('signal-beacon')) showToast('Beacon telemetry already uploaded. Return to the airlock.');
      else {
        claimedRef.current.add('signal-beacon');
        callbacksRef.current.onPickup?.('signal-beacon');
        showToast('Beacon scanned! Long-range telemetry recovered. Return to the airlock.');
      }
      return;
    }
    const nearest = getNearestFacility(player);
    if (nearest && nearest.distance < 105) callbacksRef.current.onSelect?.(nearest.id);
    else showToast('No facility in range. Move closer to a highlighted structure.');
  }

  useEffect(() => {
    if (controlsDisabled) { keysRef.current.clear(); targetRef.current = null; setMobileDirection(''); }
  }, [controlsDisabled]);

  useEffect(() => {
    function keyDown(event) {
      if (controlsDisabled) return;
      const key = event.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
      if (key === 'e' && !event.repeat) { event.preventDefault(); interact(); return; }
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        keysRef.current.add(key); targetRef.current = null;
      }
    }
    function keyUp(event) { keysRef.current.delete(event.key.toLowerCase()); }
    function blur() { keysRef.current.clear(); }
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', blur); };
  }, [controlsDisabled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let last = performance.now();
    let tick = 0;
    const blocked = FACILITIES.filter((f) => !['airlock', 'beacon', 'rover'].includes(f.id));

    function frame(now) {
      const dt = Math.min(.04, (now - last) / 1000);
      last = now; tick += dt * 1000;
      const p = playerRef.current;
      if (!controlsDisabled) {
        const keys = keysRef.current;
        let dx = 0; let dy = 0;
        if (keys.has('w') || keys.has('arrowup')) dy -= 1;
        if (keys.has('s') || keys.has('arrowdown')) dy += 1;
        if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
        if (keys.has('d') || keys.has('arrowright')) dx += 1;
        if (mobileDirection === 'up') dy -= 1;
        if (mobileDirection === 'down') dy += 1;
        if (mobileDirection === 'left') dx -= 1;
        if (mobileDirection === 'right') dx += 1;
        if (targetRef.current && !dx && !dy) {
          const to = targetRef.current; const d = distance(p, to);
          if (d < 9) targetRef.current = null;
          else { dx = (to.x - p.x) / d; dy = (to.y - p.y) / d; }
        }
        const mag = Math.hypot(dx, dy) || 1;
        dx /= mag; dy /= mag;
        const speed = stateRef.current.battery <= 0 || stateRef.current.oxygen <= 0 ? 105 : 205;
        const stepX = dx * speed * dt; const stepY = dy * speed * dt;
        if (dx || dy) {
          p.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
          const nextX = clamp(p.x + stepX, 34, WORLD.width - 34);
          const nextY = clamp(p.y + stepY, 76, WORLD.height - 40);
          const collides = (x, y) => blocked.some((f) => x > f.x - f.w * .54 - 12 && x < f.x + f.w * .54 + 12 && y > f.y - f.h * .48 - 16 && y < f.y + f.h * .48 + 14);
          if (!collides(nextX, p.y)) p.x = nextX;
          if (!collides(p.x, nextY)) p.y = nextY;
          p.vx = dx * speed; p.vy = dy * speed;
          stateRef.current.oxygen = Math.max(0, stateRef.current.oxygen - dt * .115);
          stateRef.current.battery = Math.max(0, stateRef.current.battery - dt * .065);
        } else { p.vx = 0; p.vy = 0; }

        const inHazard = distance(p, HAZARD) < HAZARD.radius * .72;
        stateRef.current.inHazard = inHazard;
        if (inHazard && now - stateRef.current.lastHazardHit > 3200) {
          stateRef.current.lastHazardHit = now;
          stateRef.current.oxygen = Math.max(0, stateRef.current.oxygen - 5);
          showToast('Radiation hot zone! Move away from the marked area.');
        }
        if (stateRef.current.oxygen <= 0 && !stateRef.current.oxygenWarned) {
          stateRef.current.oxygenWarned = true;
          showToast('SUIT OXYGEN DEPLETED. Movement is limited — reach the airlock for a refill.');
        }
        if (stateRef.current.oxygen > 25) stateRef.current.oxygenWarned = false;
        if (distance(p, FACILITIES[0]) < 78 && (stateRef.current.oxygen < 99 || stateRef.current.battery < 99)) {
          stateRef.current.oxygen = Math.min(100, stateRef.current.oxygen + dt * 18);
          stateRef.current.battery = Math.min(100, stateRef.current.battery + dt * 22);
        }

        PICKUPS.forEach((item) => { if (!claimedRef.current.has(item.id) && distance(p, item) < 28) collect(item); });
      } else { p.vx = 0; p.vy = 0; }

      const nearest = getNearestFacility(p);
      const facilityNearby = nearest && nearest.distance < 105 ? nearest.id : null;
      const hazardDist = distance(p, HAZARD);
      const nearAirlock = distance(p, FACILITIES[0]) < 88;
      const nearBeacon = distance(p, FACILITIES.find((f) => f.id === 'beacon')) < 100;
      const nearby = nearAirlock ? 'airlock' : nearBeacon ? 'beacon' : facilityNearby;
      const samples = [...claimedRef.current].filter((id) => id.startsWith('sample-')).length;
      const target = targetRef.current;
      if (now - stateRef.current.lastHud > 130) {
        stateRef.current.lastHud = now;
        const newHud = {
          oxygen: stateRef.current.oxygen,
          battery: stateRef.current.battery,
          nearby: nearAirlock ? 'airlock' : nearBeacon ? 'beacon' : nearby,
          samples,
          beaconScanned: claimedRef.current.has('signal-beacon'),
          inHazard: hazardDist < HAZARD.radius * .72,
          toast: stateRef.current.toast,
          target: target ? { ...target } : null
        };
        setHud(newHud);
      }

      ctx.clearRect(0, 0, WORLD.width, WORLD.height);
      drawWorld(ctx, p, buildings, tasks, claimedRef.current, tick, { ...hudRef.current, ...stateRef.current, nearestId: nearby, target: targetRef.current, inHazard: hazardDist < HAZARD.radius * .72 });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [buildings, tasks, controlsDisabled, mobileDirection]);

  useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current); }, []);

  function handleCanvasClick(event) {
    if (controlsDisabled) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * WORLD.width;
    const y = ((event.clientY - rect.top) / rect.height) * WORLD.height;
    targetRef.current = { x: clamp(x, 34, WORLD.width - 34), y: clamp(y, 76, WORLD.height - 40) };
  }

  function pressDirection(direction) { setMobileDirection(direction); }
  const extracted = fieldMissionComplete;
  const nearAirlock = hud.nearby === 'airlock';
  const nearBeacon = hud.nearby === 'beacon';
  const interactLabel = nearAirlock ? (hud.samples >= 2 && hud.beaconScanned ? 'EXTRACT TO OUTPOST' : 'AIRLOCK LOCKED') : nearBeacon ? (hud.beaconScanned ? 'BEACON SCANNED' : 'SCAN SIGNAL BEACON') : hud.nearby ? `INTERACT · ${BUILDINGS[hud.nearby]?.shortName || 'FACILITY'}` : 'MOVE CLOSER TO INTERACT';

  return (
    <section className="arcade-explorer" aria-label="Playable lunar surface exploration game">
      <div className="arcade-topline">
        <div><span className="arcade-live-dot" /> EVA EXPEDITION <b>·</b> LUNAR SOUTH POLE</div>
        <div className="arcade-topline-right"><span>SOIL SAMPLES <b>{Math.min(2, hud.samples)}/2</b></span><span>BEACON <b>{hud.beaconScanned ? 'SCANNED' : 'NOT SCANNED'}</b></span></div>
      </div>
      <div className="arcade-canvas-wrap">
        <canvas ref={canvasRef} width={WORLD.width} height={WORLD.height} onClick={handleCanvasClick} aria-label="Lunar surface. Use WASD or arrow keys to move the astronaut; collect glowing objects and interact with facilities." />
        <div className="arcade-suit-hud">
          <div className="suit-stat"><span>SUIT O₂</span><b>{Math.ceil(hud.oxygen)}%</b><i><em style={{ width: `${hud.oxygen}%` }} /></i></div>
          <div className="suit-stat suit-battery"><span>SUIT CELL</span><b>{Math.ceil(hud.battery)}%</b><i><em style={{ width: `${hud.battery}%` }} /></i></div>
        </div>
        <div className={`arcade-toast ${hud.inHazard ? 'arcade-toast-danger' : ''}`}>{hud.toast || (hud.inHazard ? 'RADIATION EXPOSURE — MOVE OUT' : 'Explore the surface and recover mission samples.')}</div>
        {extracted && <div className="arcade-extracted"><b>✓ EVA EXPEDITION COMPLETE</b><span>Samples secured. Beacon data uploaded.</span></div>}
      </div>
      <div className="arcade-control-row">
        <div className="arcade-dpad" aria-label="Touch movement controls">
          <button disabled={controlsDisabled} onPointerDown={() => pressDirection('up')} onPointerUp={() => pressDirection('')} onPointerLeave={() => pressDirection('')} aria-label="Move up">▲</button>
          <button disabled={controlsDisabled} onPointerDown={() => pressDirection('left')} onPointerUp={() => pressDirection('')} onPointerLeave={() => pressDirection('')} aria-label="Move left">◀</button>
          <button disabled={controlsDisabled} onPointerDown={() => pressDirection('down')} onPointerUp={() => pressDirection('')} onPointerLeave={() => pressDirection('')} aria-label="Move down">▼</button>
          <button disabled={controlsDisabled} onPointerDown={() => pressDirection('right')} onPointerUp={() => pressDirection('')} onPointerLeave={() => pressDirection('')} aria-label="Move right">▶</button>
        </div>
        <div className="arcade-mission-hint"><b>FIELD OBJECTIVE</b><span>Recover any 2 lunar soil samples, scan the purple signal beacon, then return to the airlock. Avoid the red radiation field.</span></div>
        <button className="arcade-interact-button" disabled={controlsDisabled || (!hud.nearby && !nearAirlock && !nearBeacon) || extracted || (nearAirlock && !(hud.samples >= 2 && hud.beaconScanned))} onClick={interact}>{interactLabel} <span>↗</span></button>
      </div>
      <div className="arcade-controls-foot"><span><kbd>W A S D</kbd> / <kbd>↑ ↓ ← →</kbd> MOVE</span><span><kbd>E</kbd> INTERACT</span><span>CLICK TERRAIN TO WALK</span><span>Collect glowing caches by walking over them</span></div>
    </section>
  );
}
