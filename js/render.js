// Canvas-Darstellung: Gelände, Einheiten-Counter, Overlays und Animationen.

const TERRAIN_COLORS = {
  plain: '#a9b071', forest: '#6f8b4d', hills: '#b4a066', mountain: '#8e877e',
  swamp: '#7c8b64', water: '#4f7896', city: '#b9ae8f', hq: '#b9ae8f',
};

function hexPath(ctx, x, y, s) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 30);
    const px = x + s * Math.cos(a), py = y + s * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Vereinfachte Flaggen, ohne NS-Symbolik.
function drawFlag(ctx, nationKey, x, y, w, h) {
  ctx.save();
  const stripesH = cols => cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x, y + i * h / cols.length, w, h / cols.length + 0.5); });
  const stripesV = cols => cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + i * w / cols.length, y, w / cols.length + 0.5, h); });
  switch (nationKey) {
    case 'de': stripesH(['#111', '#f4f4f4', '#d0161e']); break;
    case 'it': stripesV(['#1a8f45', '#f4f4f4', '#cf2b37']); break;
    case 'jp':
      ctx.fillStyle = '#f7f7f7'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#c8102e'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.3, 0, Math.PI * 2); ctx.fill();
      break;
    case 'us':
      stripesH(['#b22234', '#fff', '#b22234', '#fff', '#b22234', '#fff', '#b22234']);
      ctx.fillStyle = '#3c3b6e'; ctx.fillRect(x, y, w * 0.42, h * 0.57);
      break;
    case 'uk':
      ctx.fillStyle = '#012169'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = h * 0.22;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
      ctx.strokeStyle = '#c8102e'; ctx.lineWidth = h * 0.09; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(x, y + h * 0.34, w, h * 0.32); ctx.fillRect(x + w * 0.4, y, w * 0.2, h);
      ctx.fillStyle = '#c8102e'; ctx.fillRect(x, y + h * 0.4, w, h * 0.2); ctx.fillRect(x + w * 0.44, y, w * 0.12, h);
      break;
    case 'su':
      ctx.fillStyle = '#cc0000'; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ffd700'; drawStar(ctx, x + w * 0.2, y + h * 0.28, h * 0.14);
      break;
    default:
      ctx.fillStyle = '#ddd'; ctx.fillRect(x, y, w, h);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}

function drawStar(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
  }
  ctx.closePath();
  ctx.fill();
}

function flagDataUrl(nationKey, w = 36, h = 24) {
  const c = document.createElement('canvas');
  c.width = w * 2; c.height = h * 2;
  const ctx = c.getContext('2d');
  ctx.scale(2, 2);
  drawFlag(ctx, nationKey, 0, 0, w, h);
  return c.toDataURL();
}

// Taktisches NATO-Symbol im Kästchen (x, y, w, h).
function drawUnitSymbol(ctx, type, x, y, w, h, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.2, h * 0.11);
  ctx.lineCap = 'round';
  const cx = x + w / 2, cy = y + h / 2;
  const oval = (rx, ry) => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); };
  switch (unitClass(type)) {
    case 'inf':
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
      break;
    case 'recon':
      ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y); ctx.stroke();
      break;
    case 'tank':
      oval(w * 0.33, h * 0.27);
      break;
    case 'light':
      oval(w * 0.24, h * 0.2);
      break;
    case 'heavy':
      oval(w * 0.36, h * 0.32); oval(w * 0.2, h * 0.12);
      break;
    case 'td':
      // Panzerabwehr (umgekehrtes V) auf Ketten (Oval).
      oval(w * 0.33, h * 0.24);
      ctx.beginPath(); ctx.moveTo(x + w * 0.12, y + h); ctx.lineTo(cx, y); ctx.lineTo(x + w * 0.88, y + h); ctx.stroke();
      break;
    case 'spaa':
      oval(w * 0.3, h * 0.2);
      ctx.beginPath(); ctx.ellipse(cx, y + h, w * 0.42, h * 0.85, 0, Math.PI, 0); ctx.stroke();
      break;
    case 'at':
      ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(cx, y); ctx.lineTo(x + w, y + h); ctx.stroke();
      break;
    case 'art':
      ctx.beginPath(); ctx.arc(cx, cy, h * 0.2, 0, Math.PI * 2); ctx.fill();
      break;
    case 'lflak':
      ctx.beginPath(); ctx.ellipse(cx, y + h, w * 0.36, h * 0.7, 0, Math.PI, 0); ctx.stroke();
      break;
    case 'hflak':
      ctx.beginPath(); ctx.ellipse(cx, y + h, w * 0.36, h * 0.7, 0, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, y + h, w * 0.18, h * 0.36, 0, Math.PI, 0); ctx.fill();
      break;
    case 'truck':
      // Versorgung/Transport: Querbalken unten, motorisiert (Räder).
      ctx.beginPath(); ctx.moveTo(x, y + h * 0.62); ctx.lineTo(x + w, y + h * 0.62); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + w * 0.3, y + h * 0.82, h * 0.1, 0, Math.PI * 2); ctx.arc(x + w * 0.7, y + h * 0.82, h * 0.1, 0, Math.PI * 2); ctx.fill();
      break;
    case 'halftrack':
      ctx.beginPath(); ctx.moveTo(x, y + h * 0.62); ctx.lineTo(x + w, y + h * 0.62); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + w * 0.22, y + h * 0.82, h * 0.1, 0, Math.PI * 2); ctx.fill();
      roundRect(ctx, x + w * 0.42, y + h * 0.72, w * 0.42, h * 0.2, h * 0.1); ctx.stroke();
      break;
    case 'fighter':
    case 'attack':
      // Luftfahrzeug, dazu F (Jäger) bzw. A (Schlachtflugzeug).
      ctx.beginPath();
      ctx.ellipse(cx - w * 0.15, cy, w * 0.15, h * 0.2, 0, 0, Math.PI * 2);
      ctx.moveTo(cx + w * 0.3, cy);
      ctx.ellipse(cx + w * 0.15, cy, w * 0.15, h * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = `bold ${Math.round(h * 0.42)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(unitClass(type) === 'fighter' ? 'F' : 'A', cx, y + h * 0.58);
      break;
  }
  ctx.restore();
}

// Silhouette je Einheitentyp, gezeichnet in einem 100×60-Raster.
function drawUnitIcon(ctx, type, x, y, w, h, color) {
  const k = Math.min(w / 100, h / 60);
  ctx.save();
  ctx.translate(x + (w - 100 * k) / 2, y + (h - 60 * k) / 2);
  ctx.scale(k, k);
  ctx.fillStyle = color; ctx.strokeStyle = color;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const poly = pts => { ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.fill(); };
  const line = (x1, y1, x2, y2, lw) => { ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const circle = (cx, cy, r) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); };
  const track = (tx, ty, tw, th) => {
    roundRect(ctx, tx, ty, tw, th, th / 2); ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#000';
    const n = Math.round(tw / 14);
    for (let i = 0; i < n; i++) circle(tx + th / 2 + i * (tw - th) / (n - 1), ty + th / 2, th * 0.28);
    ctx.restore();
  };
  switch (unitClass(type)) {
    case 'inf':
      ctx.beginPath(); ctx.ellipse(50, 11, 10, 7, 0, Math.PI, 0); ctx.fill();
      ctx.fillRect(37, 10, 26, 3);
      circle(50, 16, 5);
      poly([[42, 21], [58, 21], [60, 41], [40, 41]]);
      line(46, 41, 40, 57, 6); line(54, 41, 60, 57, 6);
      line(43, 25, 35, 35, 5);
      line(28, 44, 76, 6, 3.5);
      break;
    case 'recon':
      poly([[6, 40], [14, 27], [28, 22], [74, 22], [88, 30], [95, 40]]);
      poly([[38, 22], [42, 13], [60, 13], [64, 22]]);
      line(60, 17, 84, 15, 3);
      [22, 40, 62, 80].forEach(cx => circle(cx, 45, 7.5));
      break;
    case 'tank':
      track(6, 38, 86, 16);
      poly([[11, 38], [18, 28], [84, 28], [90, 38]]);
      poly([[32, 28], [37, 16], [62, 16], [67, 28]]);
      line(62, 21, 97, 19, 3.5);
      break;
    case 'light':
      track(14, 40, 72, 14);
      poly([[18, 40], [24, 31], [80, 31], [84, 40]]);
      poly([[38, 31], [42, 22], [58, 22], [62, 31]]);
      line(58, 26, 84, 25, 3);
      break;
    case 'td':
      track(6, 38, 86, 16);
      poly([[11, 38], [16, 22], [74, 22], [90, 38]]);
      line(70, 28, 98, 26, 4.5);
      break;
    case 'spaa':
      track(6, 38, 86, 16);
      poly([[11, 38], [18, 28], [84, 28], [90, 38]]);
      poly([[34, 28], [36, 16], [62, 16], [66, 28]]);
      line(50, 20, 74, 2, 3); line(56, 22, 80, 4, 3);
      break;
    case 'heavy':
      track(3, 37, 92, 19);
      poly([[6, 37], [11, 24], [90, 24], [95, 37]]);
      poly([[25, 24], [30, 8], [66, 8], [71, 24]]);
      line(66, 15, 97, 13, 5);
      ctx.fillRect(93, 9.5, 6, 7);
      break;
    case 'at':
      poly([[37, 15], [53, 13], [57, 40], [35, 42]]);
      line(50, 26, 97, 22, 4);
      line(44, 42, 6, 56, 4); line(46, 44, 22, 58, 4);
      circle(46, 46, 9);
      break;
    case 'art':
      line(44, 36, 90, 7, 7.5);
      poly([[32, 30], [56, 27], [60, 40], [34, 42]]);
      line(42, 42, 5, 56, 4.5);
      circle(46, 46, 11);
      break;
    case 'lflak':
      line(46, 36, 72, 4, 3.5); line(55, 38, 81, 6, 3.5);
      poly([[34, 29], [64, 29], [66, 42], [32, 42]]);
      ctx.fillRect(16, 42, 68, 5);
      circle(27, 50, 6.5); circle(73, 50, 6.5);
      break;
    case 'hflak':
      line(46, 35, 97, 3, 6);
      poly([[33, 23], [59, 20], [63, 39], [31, 39]]);
      ctx.fillRect(41, 38, 18, 10);
      ctx.fillRect(4, 48, 92, 5);
      line(14, 53, 7, 58, 4); line(86, 53, 93, 58, 4);
      break;
    case 'truck':
      poly([[6, 42], [6, 18], [62, 18], [62, 42]]);
      poly([[64, 42], [64, 22], [82, 22], [94, 32], [94, 42]]);
      ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.fillRect(70, 25, 10, 7); ctx.restore();
      [20, 46, 82].forEach(cx => circle(cx, 46, 8));
      break;
    case 'halftrack':
      poly([[30, 40], [30, 22], [80, 22], [80, 40]]);
      poly([[80, 40], [80, 26], [92, 30], [96, 40]]);
      poly([[44, 22], [48, 14], [70, 14], [72, 22]]);
      track(6, 38, 56, 16);
      circle(84, 47, 8);
      break;
    case 'fighter':
    case 'attack':
      ctx.beginPath(); ctx.ellipse(52, 30, 40, 6.5, 0, 0, Math.PI * 2); ctx.fill();
      poly([[44, 27], [52, 2], [62, 2], [61, 27]]);
      poly([[44, 33], [52, 58], [62, 58], [61, 33]]);
      poly([[12, 28], [15, 16], [22, 16], [23, 28]]);
      poly([[12, 32], [15, 44], [22, 44], [23, 32]]);
      line(93, 19, 93, 41, 2.5);
      break;
  }
  ctx.restore();
}

// Spielstein: NATO-Symbol, Flagge, Silhouette und (optional) Stärke.
// ---------- Gemalte Einheitengrafiken ----------
// Sprites aus assets/units (erzeugt mit tools/generate-units.mjs und
// tools/process-units.mjs). Fehlt eine Grafik, zeichnet drawCounter die Silhouette.

const SPRITE_DIR = (typeof window !== 'undefined' && window.UNIT_SPRITE_DIR) || 'assets/units/';
const spriteCache = {};

function loadSprite(key) {
  const meta = typeof UNIT_SPRITES !== 'undefined' && UNIT_SPRITES[key];
  if (!meta) return null;
  if (!spriteCache[key]) {
    const img = src => { const i = new Image(); i.src = src; return i; };
    spriteCache[key] = { meta, base: img(SPRITE_DIR + key + '.png'), barrel: meta.barrel ? img(SPRITE_DIR + key + '.barrel.png') : null };
  }
  return spriteCache[key];
}
if (typeof UNIT_SPRITES !== 'undefined') Object.keys(UNIT_SPRITES).forEach(loadSprite);

// Modelle ohne eigene Grafik nutzen die Grafik ihrer Klasse (bzw. einer verwandten).
const SPRITE_CLASS = { light: 'tank', td: 'tank', spaa: 'tank', fighter: 'air', attack: 'air' };
function spriteKey(nationKey, type) {
  if (hasSprite(`${nationKey}.${type}`)) return `${nationKey}.${type}`;
  const m = MODELS[type];
  const cls = unitClass(type);
  return `${nationKey}.${(m && m.sprite) || SPRITE_CLASS[cls] || cls}`;
}
function hasSprite(key) { return typeof UNIT_SPRITES !== 'undefined' && !!UNIT_SPRITES[key]; }

function unitSprite(nationKey, type) {
  const sp = loadSprite(spriteKey(nationKey, type));
  const ready = i => !i || (i.complete && i.naturalWidth > 0);
  return sp && ready(sp.base) && ready(sp.barrel) ? sp : null;
}

// Fahrt: Ketten rütteln, Räder federn, Infanterie wippt im Schritt (Versatz in px).
function driveBob(moveType, now, h) {
  if (moveType === 'air') return 0;
  return moveType === 'foot' ? -Math.abs(Math.sin(now / 80)) * h * 0.04
    : Math.sin(now / (moveType === 'track' ? 28 : 55)) * h * 0.015;
}

// Bild samt weichem Schatten, einmal je Zeichengröße vorberechnet: shadowBlur in
// jedem Frame wäre teuer. scale = Gerätepixel je Einheit des Zielkontexts.
function shadowedImage(sp, img, dw, dh, scale) {
  const pw = Math.max(1, Math.round(dw * scale)), key = (img === sp.base ? 'b' : 'r') + pw;
  const cache = sp.shadows || (sp.shadows = new Map());
  let c = cache.get(key);
  if (!c) {
    if (cache.size >= 16) cache.clear();
    const ph = Math.max(1, Math.round(dh * scale)), blur = Math.max(1, dh * 0.08);
    const pad = Math.ceil(blur * 1.5) + 1;
    c = document.createElement('canvas');
    c.width = pw + pad * 2; c.height = ph + pad * 2;
    const g = c.getContext('2d');
    g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = blur;
    g.drawImage(img, pad, pad, pw, ph);
    c.pad = pad / scale; c.scale = scale;
    cache.set(key, c);
  }
  return c;
}

function drawShadowed(ctx, sp, img, x, y, dw, dh, scale) {
  const c = shadowedImage(sp, img, dw, dh, scale);
  ctx.drawImage(c, x - c.pad, y - c.pad, c.width / c.scale, c.height / c.scale);
}

// pose: dir (1 = nach rechts, −1 = nach links, Zwischenwerte beim Wenden),
// elev (Rohrerhöhung in Rad), recoil (0–1), flash (0–1), bob (Versatz in px).
function drawUnitSprite(ctx, sp, x, y, w, h, pose = {}) {
  const m = sp.meta, k = Math.min(w / m.w, h / m.h);
  const dw = m.w * k, dh = m.h * k;
  const { dir = 1, elev = 0, recoil = 0, flash = 0, bob = 0 } = pose;
  const t = ctx.getTransform(), scale = Math.hypot(t.c, t.d) || 1;
  ctx.save();
  ctx.translate(x + w / 2, y + (h - dh) / 2 + bob);
  ctx.scale(dir, 1);
  ctx.translate(-dw / 2 - recoil * dw * (sp.barrel ? 0.015 : 0.04), 0);
  let mx = m.muzzle[0] * dw, my = m.muzzle[1] * dh;
  if (sp.barrel) {
    // Rohr hinter dem Körper zeichnen, damit es beim Rückstoß in der Blende verschwindet.
    const px = m.pivot[0] * dw, py = m.pivot[1] * dh, c = Math.cos(elev), s = Math.sin(elev);
    ctx.save();
    ctx.translate(px, py); ctx.rotate(-elev); ctx.translate(-recoil * dw * 0.07, 0);
    drawShadowed(ctx, sp, sp.barrel, -px, -py, dw, dh, scale);
    ctx.restore();
    const dx = mx - px - recoil * dw * 0.07, dy = my - py;
    mx = px + dx * c + dy * s; my = py - dx * s + dy * c;
  }
  drawShadowed(ctx, sp, sp.base, 0, 0, dw, dh, scale);
  if (flash > 0) {
    const r = Math.max(3, dh * 0.4) * flash;
    ctx.translate(mx, my); ctx.rotate(-elev);
    const grd = ctx.createRadialGradient(r * 0.3, 0, 0, r * 0.3, 0, r);
    grd.addColorStop(0, 'rgba(255,250,210,1)');
    grd.addColorStop(0.35, 'rgba(255,190,70,0.9)');
    grd.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.ellipse(r * 0.5, 0, r, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawCounter(ctx, nationKey, type, x, y, w, h, hp, pose) {
  const n = NATIONS[nationKey];
  const r = h * 0.14;
  ctx.fillStyle = n.color;
  roundRect(ctx, x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = n.dark; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  roundRect(ctx, x + 2, y + 2, w - 4, h * 0.34, r * 0.7); ctx.fill();

  const bx = x + w * 0.07, by = y + h * 0.08, bw = w * 0.36, bh = h * 0.3;
  ctx.fillStyle = 'rgba(250,248,240,0.94)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = n.dark; ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, bw, bh);
  drawUnitSymbol(ctx, type, bx, by, bw, bh, '#1d1d1d');
  const fw = w * 0.26, fh = h * 0.2, fx = x + w - fw - w * 0.07;
  drawFlag(ctx, nationKey, fx, by, fw, fh);

  const withHp = hp !== undefined;
  const sp = unitSprite(nationKey, type);
  if (sp) drawUnitSprite(ctx, sp, x + w * 0.05, y + h * 0.4, w * 0.9, h * (withHp ? 0.46 : 0.54), pose);
  else drawUnitIcon(ctx, type, x + w * 0.08, y + h * 0.42, w * 0.84, h * (withHp ? 0.42 : 0.5), n.text);
  if (withHp) {
    const barX = x + w * 0.07, barY = y + h * 0.87, barW = w * 0.86, barH = Math.max(2, h * 0.07);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(barX, barY, barW, barH);
    const f = hp / 10;
    ctx.fillStyle = f > 0.6 ? '#7fd36b' : f > 0.3 ? '#f2c14e' : '#e9573f';
    ctx.fillRect(barX, barY, barW * f, barH);
    ctx.fillStyle = n.text;
    ctx.font = `bold ${Math.round(h * 0.3)}px "Oswald", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(hp), (bx + bw + fx) / 2, by + bh / 2 + 1);
  }
}

class View {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = null;
    this.moveAnims = new Map();
    this.facing = new Map();    // Einheit → { dir, from, start } (Blickrichtung, nur Darstellung)
    this.fireAnims = new Map(); // Einheit → { start, aim, elev }
    this.effects = [];
    this.overlay = { reach: null, targets: [], path: null, selected: null, hover: null, buyTile: null, loads: [], unloads: [] };
    this.terrainCache = null;
    this.viewer = -1; // Perspektive für den Nebel des Krieges; -1 = alles sichtbar
    window.addEventListener('resize', () => this.resize());
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  setGame(game) {
    this.game = game;
    this.moveAnims.clear();
    this.facing.clear();
    this.fireAnims.clear();
    this.effects = [];
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.W = rect.width; this.H = rect.height;
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    if (!this.game) return;
    const { w, h } = this.game.map;
    const pad = 12;
    this.size = Math.min((this.W - pad * 2) / (SQRT3 * (w + 0.5)), (this.H - pad * 2) / (1.5 * (h - 1) + 2));
    this.ox = (this.W - SQRT3 * this.size * (w + 0.5)) / 2 + SQRT3 * this.size / 2;
    this.oy = (this.H - this.size * (1.5 * (h - 1) + 2)) / 2 + this.size;
    this.terrainCache = null;
  }

  center(q, r) {
    const [x, y] = hexToPixel(q, r, this.size);
    return [this.ox + x, this.oy + y];
  }

  pick(mx, my) {
    if (!this.game) return null;
    const [q, r] = pixelToHex(mx - this.ox, my - this.oy, this.size);
    return this.game.tile(q, r) || null;
  }

  // ---------- Gelände (gecacht) ----------

  buildTerrainCache() {
    const c = document.createElement('canvas');
    c.width = this.canvas.width; c.height = this.canvas.height;
    const ctx = c.getContext('2d');
    ctx.scale(this.dpr, this.dpr);
    // Städte nach den Straßen zeichnen, damit die Gebäude obenauf liegen.
    const tiles = [...this.game.map.tiles.values()];
    const isTown = t => TERRAIN[t.terrain].capturable;
    for (const t of tiles) if (!isTown(t)) this.drawTerrain(ctx, t);
    this.drawRoads(ctx);
    for (const t of tiles) if (isTown(t)) this.drawTerrain(ctx, t);
    this.terrainCache = c;
  }

  // Straßen als Linien zwischen benachbarten Straßenfeldern (in Städten bis zur Mitte).
  drawRoads(ctx) {
    const s = this.size, tiles = this.game.map.tiles;
    const segs = [];
    for (const t of tiles.values()) {
      if (!t.road) continue;
      for (const [q, r] of hexNeighbors(t.q, t.r)) {
        const n = tiles.get(hexKey(q, r));
        if (n && n.road && hexKey(t.q, t.r) < hexKey(q, r)) segs.push([this.center(t.q, t.r), this.center(q, r)]);
      }
    }
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const stroke = (style, width, dash) => {
      ctx.strokeStyle = style; ctx.lineWidth = width; ctx.setLineDash(dash || []);
      ctx.beginPath();
      for (const [[x1, y1], [x2, y2]] of segs) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
      ctx.stroke();
    };
    stroke('rgba(60,45,25,0.55)', s * 0.26);
    stroke('#c9b07a', s * 0.17);
    stroke('rgba(120,95,55,0.5)', Math.max(1, s * 0.03), [s * 0.12, s * 0.12]);
    ctx.restore();
  }

  drawTerrain(ctx, t) {
    const s = this.size;
    const [x, y] = this.center(t.q, t.r);
    const rnd = mulberry32(hashStr(t.q + ':' + t.r + ':' + this.game.map.seed));
    hexPath(ctx, x, y, s + 0.5);
    ctx.fillStyle = TERRAIN_COLORS[t.terrain];
    ctx.fill();

    ctx.save();
    hexPath(ctx, x, y, s);
    ctx.clip();
    // leichte Fleckentextur
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,240,0.05)' : 'rgba(0,0,0,0.05)';
      ctx.beginPath();
      ctx.arc(x + (rnd() - 0.5) * s * 1.6, y + (rnd() - 0.5) * s * 1.6, s * (0.2 + rnd() * 0.35), 0, Math.PI * 2);
      ctx.fill();
    }
    switch (t.terrain) {
      case 'plain':
        ctx.strokeStyle = 'rgba(70,80,30,0.35)'; ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          const gx = x + (rnd() - 0.5) * s * 1.3, gy = y + (rnd() - 0.5) * s * 1.2;
          ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - s * 0.05, gy - s * 0.12);
          ctx.moveTo(gx, gy); ctx.lineTo(gx + s * 0.05, gy - s * 0.12); ctx.stroke();
        }
        break;
      case 'forest': {
        const n = 5 + Math.floor(rnd() * 3);
        const trees = [];
        for (let i = 0; i < n; i++) trees.push([x + (rnd() - 0.5) * s * 1.2, y + (rnd() - 0.5) * s * 1.1]);
        trees.sort((a, b) => a[1] - b[1]);
        for (const [tx, ty] of trees) {
          ctx.fillStyle = '#4a3a24'; ctx.fillRect(tx - s * 0.02, ty, s * 0.04, s * 0.14);
          ctx.fillStyle = '#3e5f2f';
          ctx.beginPath(); ctx.moveTo(tx, ty - s * 0.28); ctx.lineTo(tx + s * 0.15, ty + s * 0.05); ctx.lineTo(tx - s * 0.15, ty + s * 0.05); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.beginPath(); ctx.moveTo(tx, ty - s * 0.28); ctx.lineTo(tx - s * 0.15, ty + s * 0.05); ctx.lineTo(tx - s * 0.03, ty + s * 0.05); ctx.closePath(); ctx.fill();
        }
        break;
      }
      case 'hills':
        ctx.strokeStyle = 'rgba(90,70,30,0.6)'; ctx.lineWidth = Math.max(1.2, s * 0.06);
        for (let i = 0; i < 3; i++) {
          const hx = x + (i - 1) * s * 0.42 + (rnd() - 0.5) * s * 0.1, hy = y + (i % 2 ? -0.2 : 0.25) * s;
          ctx.beginPath(); ctx.arc(hx, hy + s * 0.12, s * 0.26, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        }
        break;
      case 'mountain':
        for (let i = 0; i < 3; i++) {
          const mx = x + (i - 1) * s * 0.42, my = y + s * 0.35 - (i === 1 ? s * 0.05 : 0);
          const mh = s * (i === 1 ? 0.8 : 0.55), mw = s * (i === 1 ? 0.42 : 0.32);
          ctx.fillStyle = '#6e675f';
          ctx.beginPath(); ctx.moveTo(mx - mw, my); ctx.lineTo(mx, my - mh); ctx.lineTo(mx + mw, my); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#5a544d';
          ctx.beginPath(); ctx.moveTo(mx, my - mh); ctx.lineTo(mx + mw, my); ctx.lineTo(mx + mw * 0.2, my); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#efece6';
          ctx.beginPath(); ctx.moveTo(mx, my - mh); ctx.lineTo(mx + mw * 0.3, my - mh * 0.7); ctx.lineTo(mx - mw * 0.3, my - mh * 0.7); ctx.closePath(); ctx.fill();
        }
        break;
      case 'swamp':
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = 'rgba(60,100,110,0.55)';
          ctx.beginPath(); ctx.ellipse(x + (rnd() - 0.5) * s, y + (rnd() - 0.5) * s, s * 0.22, s * 0.08, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = 'rgba(50,70,30,0.7)'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 6; i++) {
          const rx = x + (rnd() - 0.5) * s * 1.2, ry = y + (rnd() - 0.5) * s;
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + (rnd() - 0.5) * 3, ry - s * 0.2); ctx.stroke();
        }
        break;
      case 'water':
        ctx.strokeStyle = 'rgba(220,235,245,0.35)'; ctx.lineWidth = 1.2;
        for (let i = 0; i < 3; i++) {
          const wx = x + (rnd() - 0.5) * s * 0.9, wy = y + (i - 1) * s * 0.35;
          ctx.beginPath();
          ctx.moveTo(wx - s * 0.25, wy);
          ctx.quadraticCurveTo(wx - s * 0.12, wy - s * 0.08, wx, wy);
          ctx.quadraticCurveTo(wx + s * 0.12, wy + s * 0.08, wx + s * 0.25, wy);
          ctx.stroke();
        }
        break;
      case 'city':
      case 'hq': {
        const big = t.terrain === 'hq';
        const blocks = big
          ? [[-0.42, 0.05, 0.3, 0.38], [-0.08, -0.2, 0.34, 0.62], [0.3, 0.02, 0.26, 0.4]]
          : [[-0.42, 0.1, 0.26, 0.3], [-0.12, -0.08, 0.26, 0.46], [0.18, 0.12, 0.26, 0.28], [-0.25, 0.32, 0.5, 0.12]];
        for (const [bx, by, bw, bh] of blocks) {
          const px = x + bx * s, py = y + by * s, pw = bw * s, ph = bh * s;
          ctx.fillStyle = '#ddd5c2'; ctx.fillRect(px, py, pw, ph);
          ctx.fillStyle = '#9b4a32';
          ctx.beginPath(); ctx.moveTo(px - 1, py); ctx.lineTo(px + pw / 2, py - ph * 0.3); ctx.lineTo(px + pw + 1, py); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(40,40,50,0.6)';
          ctx.fillRect(px + pw * 0.25, py + ph * 0.3, pw * 0.18, ph * 0.18);
          ctx.fillRect(px + pw * 0.58, py + ph * 0.3, pw * 0.18, ph * 0.18);
        }
        if (big) {
          ctx.fillStyle = '#f2d16b';
          drawStar(ctx, x, y + s * 0.55, s * 0.14);
        }
        break;
      }
    }
    ctx.restore();
    hexPath(ctx, x, y, s);
    ctx.strokeStyle = 'rgba(40,40,20,0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // ---------- Animationen ----------

  animateMove(unit, pathKeys) {
    // Einheit aus einer abgebrochenen Partie: nie auflösen, damit deren KI-Zug stehen bleibt.
    if (!this.game.units.includes(unit)) return new Promise(() => {});
    if (pathKeys.length < 2) return Promise.resolve();
    const pts = pathKeys.map(k => this.center(...parseKey(k)));
    const dur = 120 * (pts.length - 1);
    const anim = { pts, start: performance.now(), dur };
    this.moveAnims.set(unit.id, anim);
    this.face(unit, pts[pts.length - 1][0] - pts[0][0]);
    return sleep(dur).then(() => {
      if (this.moveAnims.get(unit.id) === anim) this.moveAnims.delete(unit.id);
    });
  }

  addEffect(e) {
    e.start = performance.now();
    this.effects.push(e);
  }

  flashText(q, r, text, color) {
    this.addEffect({ kind: 'text', q, r, text, color, dur: 1000 });
    return sleep(450);
  }

  // Blickrichtung ändern, wenn dx deutlich nach links oder rechts zeigt.
  // Liefert true, wenn dafür gewendet wird.
  face(u, dx) {
    if (Math.abs(dx) < this.size * 0.2) return false;
    const dir = dx > 0 ? 1 : -1, cur = this.facingOf(u, performance.now());
    if (cur === dir) return false;
    this.facing.set(u.id, { dir, from: cur, start: performance.now() });
    return true;
  }

  facingOf(u, now) {
    const f = this.facing.get(u.id);
    if (!f) return u.owner === 0 ? 1 : -1; // Spieler 0 beginnt links
    const t = Math.min(1, Math.max(0, now - f.start) / 180);
    return f.from + (f.dir - f.from) * t;
  }

  // Zielen und Feuern: Rohr richten (Artillerie steil, Flak gegen Flugzeuge steil),
  // dann Rückstoß und Mündungsfeuer. Liefert die Zeit bis zum Schuss
  // (0, wenn der Schütze im Nebel steht und die Animation niemand sieht).
  startFire(att, def) {
    const [ax] = this.center(att.q, att.r), [dx] = this.center(def.q, def.r);
    const turn = this.face(att, dx - ax);
    const vsAir = this.game.stats(def).isAir;
    const dist = hexDistance(att.q, att.r, def.q, def.r);
    const elev = { art: 0.2 + dist * 0.07, hflak: vsAir ? 0.75 : 0.05, lflak: vsAir ? 0.6 : 0.03 }[att.type] ?? (vsAir ? 0.3 : 0);
    // Rohr heben nur abwarten, wenn sich auch sichtbar ein Rohr hebt.
    const sp = unitSprite(this.game.players[att.owner].nation, att.type);
    const aim = (turn ? 180 : 0) + (elev > 0.1 && sp?.barrel ? 260 : 0);
    this.fireAnims.set(att.id, { start: performance.now(), aim, elev });
    return !this.vis || this.vis.has(hexKey(att.q, att.r)) ? aim : 0;
  }

  firePose(u, now) {
    const f = this.fireAnims.get(u.id);
    if (!f) return {};
    const t = Math.max(0, now - f.start), ease = v => v * v * (3 - 2 * v);
    if (t > f.aim + 700) { this.fireAnims.delete(u.id); return {}; }
    const st = t - f.aim; // Zeit seit dem Schuss
    const elev = st < 0 ? f.elev * ease(f.aim ? t / f.aim : 1) : st < 400 ? f.elev : f.elev * (1 - ease((st - 400) / 300));
    return {
      elev,
      recoil: st < 0 ? 0 : st < 60 ? st / 60 : Math.max(0, 1 - (st - 60) / 300),
      flash: st < 0 || st > 110 ? 0 : 1 - st / 110,
    };
  }

  async showAttack(att, def) {
    const aim = this.startFire(att, def);
    if (aim) await sleep(aim);
    this.addEffect({ kind: 'shot', from: [att.q, att.r], to: [def.q, def.r], dur: 260 });
    await sleep(240);
  }

  async showAttackResult(att, def, res) {
    this.addEffect({ kind: 'boom', q: def.q, r: def.r, dur: 420 });
    this.addEffect({ kind: 'text', q: def.q, r: def.r, text: res.defKilled ? 'Vernichtet' : `−${res.dmg}`, color: '#ff6b5a', dur: 1100 });
    if (res.counter) {
      await sleep(this.startFire(def, att) + 260);
      this.addEffect({ kind: 'boom', q: att.q, r: att.r, dur: 380 });
      this.addEffect({ kind: 'text', q: att.q, r: att.r, text: res.attKilled ? 'Vernichtet' : `−${res.counter}`, color: '#ffb35a', dur: 1100 });
    }
    await sleep(380);
  }

  unitPos(u, now) {
    const a = this.moveAnims.get(u.id);
    if (!a) return this.center(u.q, u.r);
    const t = Math.min(1, Math.max(0, now - a.start) / a.dur);
    if (t >= 1) return a.pts[a.pts.length - 1];
    const f = t * (a.pts.length - 1);
    const i = Math.floor(f), k = f - i;
    const p0 = a.pts[i], p1 = a.pts[Math.min(i + 1, a.pts.length - 1)];
    return [p0[0] + (p1[0] - p0[0]) * k, p0[1] + (p1[1] - p0[1]) * k];
  }

  // ---------- Zeichnen ----------

  frame(now) {
    requestAnimationFrame(this.frame);
    if (this.game && this.size > 0) this.draw(now);
  }

  draw(now) {
    const ctx = this.ctx, g = this.game, s = this.size, ov = this.overlay;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    if (!this.terrainCache) this.buildTerrainCache();
    ctx.drawImage(this.terrainCache, 0, 0, this.W, this.H);

    // Besitzverhältnisse
    for (const t of g.map.tiles.values()) {
      if (!TERRAIN[t.terrain].capturable) continue;
      const [x, y] = this.center(t.q, t.r);
      if (t.owner >= 0) {
        const n = g.nationOf(t.owner);
        hexPath(ctx, x, y, s - 2.5);
        ctx.strokeStyle = n.color; ctx.lineWidth = 3; ctx.stroke();
        drawFlag(ctx, g.players[t.owner].nation, x + s * 0.18, y - s * 0.86, s * 0.46, s * 0.3);
      } else {
        ctx.fillStyle = '#eee'; ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
        ctx.fillRect(x + s * 0.18, y - s * 0.86, s * 0.46, s * 0.3);
        ctx.strokeRect(x + s * 0.18, y - s * 0.86, s * 0.46, s * 0.3);
      }
      ctx.strokeStyle = '#3a2f22'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x + s * 0.18, y - s * 0.86); ctx.lineTo(x + s * 0.18, y - s * 0.4); ctx.stroke();
    }

    // Nebel des Krieges
    const vis = this.viewer >= 0 && g.fog && !g.gameOver ? g.visibleTiles(this.viewer) : null;
    this.vis = vis;
    if (vis) {
      const explored = g.explored[this.viewer];
      for (const t of g.map.tiles.values()) {
        const k = hexKey(t.q, t.r);
        if (vis.has(k)) continue;
        const [x, y] = this.center(t.q, t.r);
        hexPath(ctx, x, y, s + 0.5);
        ctx.fillStyle = explored.has(k) ? 'rgba(18,22,14,0.5)' : 'rgba(12,14,10,0.9)';
        ctx.fill();
      }
    }

    // Reichweite
    if (ov.reach) {
      for (const [k, info] of ov.reach) {
        if (!info.stop) continue;
        const [x, y] = this.center(...parseKey(k));
        hexPath(ctx, x, y, s - 2);
        ctx.fillStyle = 'rgba(70,150,255,0.38)'; ctx.fill();
        ctx.strokeStyle = 'rgba(200,230,255,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
    if (ov.buyTile) {
      const [x, y] = this.center(ov.buyTile.q, ov.buyTile.r);
      hexPath(ctx, x, y, s - 1.5);
      ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([]);
    }
    // Pfadvorschau
    if (ov.path && ov.path.length > 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(2, s * 0.09);
      ctx.setLineDash([s * 0.18, s * 0.12]); ctx.lineCap = 'round';
      ctx.beginPath();
      ov.path.forEach((k, i) => { const [x, y] = this.center(...parseKey(k)); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.stroke(); ctx.setLineDash([]);
      const [ex, ey] = this.center(...parseKey(ov.path[ov.path.length - 1]));
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath(); ctx.arc(ex, ey, s * 0.12, 0, Math.PI * 2); ctx.fill();
    }
    // Hover & Auswahl
    if (ov.hover) {
      const [x, y] = this.center(ov.hover.q, ov.hover.r);
      hexPath(ctx, x, y, s - 1);
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2; ctx.stroke();
    }
    if (ov.selected && g.units.includes(ov.selected)) {
      const [x, y] = this.unitPos(ov.selected, now);
      hexPath(ctx, x, y, s - 1);
      ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = 3; ctx.stroke();
    }

    // Einheiten
    const sorted = [...g.units].sort((a, b) => a.r - b.r);
    for (const u of sorted) {
      if (vis && !g.canSee(this.viewer, u)) continue;
      const [x, y] = this.unitPos(u, now);
      this.drawUnit(ctx, u, x, y, now);
    }

    // Auf- und Abladen
    for (const u of ov.loads) {
      const [x, y] = this.center(u.q, u.r);
      hexPath(ctx, x, y, s - 2);
      ctx.strokeStyle = '#7fe08a'; ctx.lineWidth = 3; ctx.setLineDash([5, 3]); ctx.stroke(); ctx.setLineDash([]);
    }
    for (const k of ov.unloads) {
      const [x, y] = this.center(...parseKey(k));
      hexPath(ctx, x, y, s - 2);
      ctx.fillStyle = 'rgba(255,214,80,0.3)'; ctx.fill();
      ctx.strokeStyle = '#ffd650'; ctx.lineWidth = 2.5; ctx.stroke();
    }

    // Angriffsziele
    for (const e of ov.targets) {
      const [x, y] = this.center(e.q, e.r);
      const pulse = 0.5 + 0.5 * Math.sin(now / 180);
      hexPath(ctx, x, y, s - 2);
      ctx.strokeStyle = `rgba(255,70,50,${0.6 + pulse * 0.4})`; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = `rgba(255,60,40,${0.12 + pulse * 0.1})`; ctx.fill();
    }

    this.drawEffects(ctx, now);
  }

  drawUnit(ctx, u, x, y, now) {
    const g = this.game, s = this.size;
    const st = g.stats(u);
    const done = u.owner === g.current && !g.gameOver && g.attackTargets(u).length === 0 && !g.canMove(u);
    const w = s * 1.3, h = s * 1.0;
    const bob = st.isAir ? Math.sin(now / 400 + u.id) * s * 0.04 - s * 0.06 : 0;
    const cy = y + bob;
    ctx.save();
    if (st.isAir) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(x + 3, y + h * 0.48, w * 0.4, h * 0.13, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    roundRect(ctx, x - w / 2 + 2, cy - h / 2 + 3, w, h, h * 0.14); ctx.fill();
    const pose = { dir: this.facingOf(u, now), ...this.firePose(u, now) };
    if (this.moveAnims.has(u.id) && !st.isAir) pose.bob = driveBob(st.moveType, now, h);
    drawCounter(ctx, g.players[u.owner].nation, u.type, x - w / 2, cy - h / 2, w, h, u.hp, pose);
    if (done) {
      ctx.fillStyle = 'rgba(20,20,20,0.45)';
      roundRect(ctx, x - w / 2, cy - h / 2, w, h, h * 0.14); ctx.fill();
    }
    if (u.cargo) {
      // Ladung: kleines NATO-Symbol rechts unten.
      const bw = w * 0.36, bh = h * 0.3, bx = x + w / 2 - bw * 0.75, by = cy + h / 2 - bh * 0.6;
      ctx.fillStyle = 'rgba(250,248,240,0.97)'; ctx.strokeStyle = '#1d1d1d'; ctx.lineWidth = 1.2;
      ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
      drawUnitSymbol(ctx, u.cargo.type, bx, by, bw, bh, '#1d1d1d');
    }
    if (g.isSurprised(u)) {
      // Überraschte Einheit: oranges Warnzeichen links unten.
      const rr = s * 0.17, mx = x - w / 2 + rr * 0.6, my = cy + h / 2 - rr * 0.6;
      ctx.fillStyle = '#ff9b6a'; ctx.strokeStyle = '#1d1a10'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(mx, my, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1d1a10'; ctx.font = `bold ${Math.round(rr * 1.6)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', mx, my + 1);
    }
    ctx.restore();
  }

  drawEffects(ctx, now) {
    const s = this.size;
    this.effects = this.effects.filter(e => now - e.start < e.dur);
    const seen = (q, r) => !this.vis || this.vis.has(hexKey(q, r));
    for (const e of this.effects) {
      const t = Math.max(0, now - e.start) / e.dur;
      if (e.kind === 'shot' ? !seen(...e.from) && !seen(...e.to) : !seen(e.q, e.r)) continue;
      if (e.kind === 'text') {
        const [x, y] = this.center(e.q, e.r);
        ctx.save();
        ctx.globalAlpha = 1 - Math.max(0, t - 0.6) / 0.4;
        ctx.font = `bold ${Math.round(s * 0.42)}px "Oswald", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeText(e.text, x, y - s * 0.6 - t * s * 0.6);
        ctx.fillStyle = e.color;
        ctx.fillText(e.text, x, y - s * 0.6 - t * s * 0.6);
        ctx.restore();
      } else if (e.kind === 'boom') {
        const [x, y] = this.center(e.q, e.r);
        ctx.save();
        ctx.globalAlpha = 1 - t;
        const grd = ctx.createRadialGradient(x, y, 0, x, y, s * (0.3 + t * 0.7));
        grd.addColorStop(0, 'rgba(255,240,180,1)');
        grd.addColorStop(0.4, 'rgba(255,140,40,0.9)');
        grd.addColorStop(1, 'rgba(120,40,10,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(x, y, s * (0.3 + t * 0.7), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (e.kind === 'shot') {
        const [x1, y1] = this.center(...e.from), [x2, y2] = this.center(...e.to);
        const px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t - Math.sin(t * Math.PI) * s * 0.5;
        ctx.save();
        ctx.fillStyle = '#ffe9a8';
        ctx.shadowColor = '#ffb347'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(px, py, s * 0.08, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  }
}
