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
  switch (type) {
    case 'inf':
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
      break;
    case 'recon':
      ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y); ctx.stroke();
      break;
    case 'tank':
      oval(w * 0.33, h * 0.27);
      break;
    case 'heavy':
      oval(w * 0.36, h * 0.32); oval(w * 0.2, h * 0.12);
      break;
    case 'at':
      ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(cx, y); ctx.lineTo(x + w, y + h); ctx.stroke();
      break;
    case 'art':
      ctx.beginPath(); ctx.arc(cx, cy, h * 0.2, 0, Math.PI * 2); ctx.fill();
      break;
    case 'aa':
      ctx.beginPath(); ctx.ellipse(cx, y + h, w * 0.36, h * 0.7, 0, Math.PI, 0); ctx.stroke();
      break;
    case 'air':
      ctx.beginPath();
      ctx.ellipse(cx - w * 0.15, cy, w * 0.15, h * 0.2, 0, 0, Math.PI * 2);
      ctx.moveTo(cx + w * 0.3, cy);
      ctx.ellipse(cx + w * 0.15, cy, w * 0.15, h * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

class View {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = null;
    this.moveAnims = new Map();
    this.effects = [];
    this.overlay = { reach: null, targets: [], path: null, selected: null, hover: null, buyTile: null };
    this.terrainCache = null;
    window.addEventListener('resize', () => this.resize());
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  setGame(game) {
    this.game = game;
    this.moveAnims.clear();
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
    for (const t of this.game.map.tiles.values()) this.drawTerrain(ctx, t);
    this.terrainCache = c;
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

  async showAttack(att, def) {
    this.addEffect({ kind: 'shot', from: [att.q, att.r], to: [def.q, def.r], dur: 260 });
    await sleep(240);
  }

  async showAttackResult(att, def, res) {
    this.addEffect({ kind: 'boom', q: def.q, r: def.r, dur: 420 });
    this.addEffect({ kind: 'text', q: def.q, r: def.r, text: res.defKilled ? 'Vernichtet' : `−${res.dmg}`, color: '#ff6b5a', dur: 1100 });
    if (res.counter) {
      await sleep(260);
      this.addEffect({ kind: 'boom', q: att.q, r: att.r, dur: 380 });
      this.addEffect({ kind: 'text', q: att.q, r: att.r, text: res.attKilled ? 'Vernichtet' : `−${res.counter}`, color: '#ffb35a', dur: 1100 });
    }
    await sleep(380);
  }

  unitPos(u, now) {
    const a = this.moveAnims.get(u.id);
    if (!a) return this.center(u.q, u.r);
    const t = Math.min(1, (now - a.start) / a.dur);
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
      const [x, y] = this.unitPos(u, now);
      this.drawUnit(ctx, u, x, y, now);
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
    const n = g.nationOf(u.owner);
    const done = u.owner === g.current && !g.gameOver && g.attackTargets(u).length === 0 && !g.canMove(u);
    const w = s * 1.12, h = s * 0.84;
    const bob = st.isAir ? Math.sin(now / 400 + u.id) * s * 0.04 - s * 0.06 : 0;
    const cy = y + bob;
    ctx.save();
    if (st.isAir) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(x + 3, y + h * 0.45, w * 0.4, h * 0.14, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    roundRect(ctx, x - w / 2 + 2, cy - h / 2 + 3, w, h, s * 0.12); ctx.fill();
    ctx.fillStyle = n.color;
    roundRect(ctx, x - w / 2, cy - h / 2, w, h, s * 0.12); ctx.fill();
    ctx.strokeStyle = n.dark; ctx.lineWidth = 1.5; ctx.stroke();
    // Glanzkante
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, x - w / 2 + 2, cy - h / 2 + 2, w - 4, h * 0.3, s * 0.08); ctx.fill();

    const bw = w * 0.52, bh = h * 0.42;
    const bx = x - bw / 2 - w * 0.08, by = cy - h / 2 + h * 0.12;
    ctx.fillStyle = 'rgba(250,248,240,0.92)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = n.dark; ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    drawUnitSymbol(ctx, u.type, bx, by, bw, bh, '#1d1d1d');
    drawFlag(ctx, g.players[u.owner].nation, bx + bw + w * 0.05, by, w * 0.22, h * 0.17);

    // Stärke
    ctx.fillStyle = n.text;
    ctx.font = `bold ${Math.round(s * 0.3)}px "Oswald", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(u.hp), x - w * 0.08, cy + h / 2 - h * 0.08);
    // Stärkebalken
    const barX = bx + bw + w * 0.05, barW = w * 0.22, barY = by + h * 0.24, barH = h * 0.52;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(barX, barY, barW, barH);
    const frac = u.hp / 10;
    ctx.fillStyle = frac > 0.6 ? '#7fd36b' : frac > 0.3 ? '#f2c14e' : '#e9573f';
    ctx.fillRect(barX + 1, barY + 1 + (barH - 2) * (1 - frac), barW - 2, (barH - 2) * frac);

    if (done) {
      ctx.fillStyle = 'rgba(20,20,20,0.45)';
      roundRect(ctx, x - w / 2, cy - h / 2, w, h, s * 0.12); ctx.fill();
    }
    ctx.restore();
  }

  drawEffects(ctx, now) {
    const s = this.size;
    this.effects = this.effects.filter(e => now - e.start < e.dur);
    for (const e of this.effects) {
      const t = (now - e.start) / e.dur;
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
