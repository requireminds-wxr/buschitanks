// Verarbeitet die Rohbilder aus tools/raw/<modell>/ zu Spiel-Sprites.
//
//   node tools/process-units.mjs [--model gpt-image-2.5-sunburst] [--out assets/units]
//
// Je Einheit entstehen <out>/<nation>.<typ>.png (Körper) und, falls ein frei
// stehendes Rohr erkannt wird, <out>/<nation>.<typ>.barrel.png (gleich groß,
// nur das Rohr). Die Ankerpunkte für Animationen stehen in <out>/sprites.js:
//   pivot   Drehpunkt des Rohrs (Blende/Schild), Anteil an Breite/Höhe
//   muzzle  Mündung bzw. vorderster Punkt (Mündungsfeuer)
// Alle Sprites schauen nach rechts; gespiegelt wird im Spiel.
import fs from 'node:fs';
import path from 'node:path';
import { decodePNG, encodePNG } from './png.mjs';
import { BARREL_LAYOUT } from './unit-prompts.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i < 0 ? def : process.argv[i + 1] ?? def;
}
const model = arg('model', 'gpt-image-2.5-sunburst');
const outDir = path.join(ROOT, arg('out', 'assets/units'));
const TARGET_W = 320;

// Die API liefert weiche Halos und nie ganz deckende Pixel: Alpha straffen.
function cleanAlpha(im) {
  const d = im.data;
  for (let i = 3; i < d.length; i += 4) d[i] = Math.max(0, Math.min(255, Math.round((d[i] - 72) * 255 / (232 - 72))));
}

function crop(im, x0, y0, w, h) {
  const out = { width: w, height: h, data: Buffer.alloc(w * h * 4) };
  for (let y = 0; y < h; y++) {
    const sy = y + y0;
    if (sy < 0 || sy >= im.height) continue;
    for (let x = 0; x < w; x++) {
      const sx = x + x0;
      if (sx < 0 || sx >= im.width) continue;
      im.data.copy(out.data, (y * w + x) * 4, (sy * im.width + sx) * 4, (sy * im.width + sx) * 4 + 4);
    }
  }
  return out;
}

function bbox(im) {
  let x0 = im.width, y0 = im.height, x1 = -1, y1 = -1;
  for (let y = 0; y < im.height; y++)
    for (let x = 0; x < im.width; x++)
      if (im.data[(y * im.width + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1 };
}

// Flächenmittel mit vormultipliziertem Alpha, getrennt nach Achsen.
function resize(im, w, h) {
  const pass = (src, sw, sh, dw, dh, horiz) => {
    const out = new Float64Array(dw * dh * 4);
    const n = horiz ? sw : sh, m = horiz ? dw : dh, f = n / m;
    for (let j = 0; j < m; j++) {
      const a = j * f, b = a + f;
      for (let k = Math.floor(a); k < Math.ceil(b); k++) {
        const wgt = (Math.min(b, k + 1) - Math.max(a, k)) / f;
        if (horiz) for (let y = 0; y < sh; y++) for (let c = 0; c < 4; c++) out[(y * dw + j) * 4 + c] += src[(y * sw + k) * 4 + c] * wgt;
        else for (let x = 0; x < sw; x++) for (let c = 0; c < 4; c++) out[(j * dw + x) * 4 + c] += src[(k * sw + x) * 4 + c] * wgt;
      }
    }
    return out;
  };
  const pre = new Float64Array(im.width * im.height * 4);
  for (let i = 0; i < pre.length; i += 4) {
    const a = im.data[i + 3] / 255;
    pre[i] = im.data[i] * a; pre[i + 1] = im.data[i + 1] * a; pre[i + 2] = im.data[i + 2] * a; pre[i + 3] = im.data[i + 3];
  }
  const tmp = pass(pre, im.width, im.height, w, im.height, true);
  const res = pass(tmp, w, im.height, w, h, false);
  const out = { width: w, height: h, data: Buffer.alloc(w * h * 4) };
  for (let i = 0; i < res.length; i += 4) {
    const a = res[i + 3];
    const k = a > 0 ? 255 / a : 0;
    out.data[i] = Math.round(res[i] * k); out.data[i + 1] = Math.round(res[i + 1] * k); out.data[i + 2] = Math.round(res[i + 2] * k);
    out.data[i + 3] = Math.round(a);
  }
  return out;
}

// Sucht das frei stehende Rohr: den längsten waagerechten Streifen im oberen
// Bildteil, dessen senkrechte Pixelfolge überall dünn bleibt. Links endet er an
// der Blende (Drehpunkt), nach rechts wird um die Mündungsbremse erweitert.
// Mehrere parallele Rohre (Vierlings-MG) werden gemeinsam erfasst.
function findBarrel(im) {
  const W = im.width, H = im.height;
  const opaque = (x, y) => im.data[(y * W + x) * 4 + 3] > 40;
  // Senkrechte Pixelfolge je Pixel: oberes und unteres Ende.
  const top = new Int32Array(W * H).fill(-1), bot = new Int32Array(W * H);
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      if (!opaque(x, y)) continue;
      let b = y;
      while (b + 1 < H && opaque(x, b + 1)) b++;
      for (let k = y; k <= b; k++) { top[k * W + x] = y; bot[k * W + x] = b; }
      y = b;
    }
  const thinMax = H * 0.09;
  const thin = (x, y) => top[y * W + x] >= 0 && bot[y * W + x] - top[y * W + x] + 1 <= thinMax;

  // Längster dünner Streifen je Zeile, der bis an die Front reicht oder ganz oben
  // liegt (Holme und Ausleger enden weiter hinten und liegen tiefer).
  const rows = [];
  for (let y = 0; y < H * 0.7; y++) {
    let best = null, x0 = -1;
    for (let x = 0; x <= W; x++) {
      if (x < W && thin(x, y)) { if (x0 < 0) x0 = x; continue; }
      if (x0 >= 0 && (x - 1 >= W * 0.8 || y < H * 0.3) && (!best || x - x0 > best.len)) best = { y, x0, x1: x - 1, len: x - x0 };
      x0 = -1;
    }
    if (best) rows.push(best);
  }
  const best = rows.reduce((m, r) => (!m || r.len > m.len ? r : m), null);
  if (!best || best.len < W * 0.08) return null;

  // Zeilen desselben Rohrs (oder paralleler Rohre) zu Achsen zusammenfassen.
  const overlap = (r) => Math.min(r.x1, best.x1) - Math.max(r.x0, best.x0);
  const axes = [];
  for (const r of rows.filter(r => r.len >= best.len * 0.8 && overlap(r) >= best.len * 0.8)) {
    const g = axes[axes.length - 1];
    if (g && r.y === g.y1 + 1) g.y1 = r.y; else axes.push({ y0: r.y, y1: r.y });
  }
  for (const g of axes) { g.yc = Math.round((g.y0 + g.y1) / 2); g.tube = g.y1 - g.y0 + 1; }

  // Nach rechts über Mündungsbremse und Lücken darin hinweg erweitern.
  const win = (g, x, h) => {
    const out = [];
    for (let y = Math.max(0, Math.round(g.yc - h)); y <= Math.min(H - 1, Math.round(g.yc + h)); y++) if (opaque(x, y)) out.push(y);
    return out;
  };
  let end = best.x1;
  for (let x = best.x1 + 1, gap = 0; x < W && gap < 4; x++) {
    if (axes.some(g => win(g, x, g.tube * 1.5).length)) { end = x; gap = 0; } else gap++;
  }

  // Spalten des Rohrs: [x, oben, unten] je Achse.
  const spans = [];
  for (let x = best.x0; x <= end; x++)
    for (const g of axes) {
      const ys = x <= best.x1 ? win(g, x, g.tube / 2 + 1) : win(g, x, g.tube * 1.5);
      if (!ys.length) continue;
      const y = ys[0];
      const [t, b] = x <= best.x1 ? [top[y * W + x], bot[y * W + x]] : [ys[0], ys[ys.length - 1]];
      spans.push([x, t, b]);
    }
  const yc = axes.find(g => g.y0 <= best.y && best.y <= g.y1)?.yc ?? best.y;
  return { spans, pivot: [best.x0, yc], muzzle: [end, yc] };
}

// Vorderster Punkt im oberen Teil als Mündung (Infanterie-MG, Flugzeugnase, LKW).
function frontPoint(im) {
  for (let x = im.width - 1; x >= 0; x--)
    for (let y = 0; y < im.height * 0.75; y++)
      if (im.data[(y * im.width + x) * 4 + 3] > 100) return [x, y];
  return [im.width - 1, im.height / 2];
}

const rawDir = path.join(ROOT, 'tools/raw', model);
fs.mkdirSync(outDir, { recursive: true });
const manifest = {};
for (const file of fs.readdirSync(rawDir).filter(f => f.endsWith('.png')).sort()) {
  const key = file.replace(/\.png$/, '');
  // Rohr nur suchen, wenn der Prompt eins verlangt hat (BARREL_LAYOUT).
  const txt = path.join(rawDir, `${key}.txt`);
  const wantsBarrel = fs.existsSync(txt) && fs.readFileSync(txt, 'utf8').includes(BARREL_LAYOUT);
  const raw = decodePNG(fs.readFileSync(path.join(rawDir, file)));
  cleanAlpha(raw);
  const bb = bbox(raw);
  const pad = Math.round((bb.x1 - bb.x0) * 0.02);
  let im = crop(raw, bb.x0 - pad, bb.y0 - pad, bb.x1 - bb.x0 + 1 + pad * 2, bb.y1 - bb.y0 + 1 + pad * 2);

  // Rohr in voller Auflösung abtrennen, danach beide Ebenen gleich skalieren.
  const barrel = wantsBarrel ? findBarrel(im) : null;
  let barrelIm = null;
  if (barrel) {
    barrelIm = { width: im.width, height: im.height, data: Buffer.alloc(im.data.length) };
    for (const [x, t, b] of barrel.spans)
      for (let y = Math.max(0, t - 1); y <= Math.min(im.height - 1, b + 1); y++) {
        const o = (y * im.width + x) * 4;
        im.data.copy(barrelIm.data, o, o, o + 4);
        im.data.fill(0, o, o + 4);
      }
  }
  const front = barrel ? barrel.muzzle : frontPoint(im);
  const W = TARGET_W, H = Math.round(im.height * W / im.width);
  const norm = ([x, y]) => [+(x / im.width).toFixed(4), +(y / im.height).toFixed(4)];
  fs.writeFileSync(path.join(outDir, `${key}.png`), encodePNG(resize(im, W, H)));
  const entry = { w: W, h: H, muzzle: norm(front) };
  const barrelFile = path.join(outDir, `${key}.barrel.png`);
  if (barrelIm) {
    fs.writeFileSync(barrelFile, encodePNG(resize(barrelIm, W, H)));
    entry.barrel = true;
    entry.pivot = norm(barrel.pivot);
  } else fs.rmSync(barrelFile, { force: true }); // Rohr aus einem früheren Lauf
  manifest[key] = entry;
  console.log(key.padEnd(12), `${W}×${H}`, barrel ? `Rohr ab x=${entry.pivot[0]}` : 'ohne Rohr');
}

const lines = Object.entries(manifest).map(([k, v]) => `  '${k}': ${JSON.stringify(v)},`);
fs.writeFileSync(path.join(outDir, 'sprites.js'),
  `// Erzeugt von tools/process-units.mjs (${model}) – nicht von Hand ändern.\n` +
  `// Koordinaten als Anteil an Breite/Höhe; alle Sprites schauen nach rechts.\n` +
  `const UNIT_SPRITES = {\n${lines.join('\n')}\n};\n`);
