// Setzt die leichte Flak jeder Nation auf LKW und Halbkette (mobile Flak).
//
//   node tools/compose-mobile-flak.mjs [--dir assets/units]
//
// Aus <nation>.lflak.png (Geschütz ohne Lafettenbeine) und <nation>.truck.png
// bzw. <nation>.halftrack.png entstehen <nation>.lflak_lkw.png und
// <nation>.lflak_hk.png samt Rohr-Ebene (.barrel.png). Die Ankerpunkte stehen
// in <dir>/sprites-mobile.js und ergänzen UNIT_SPRITES aus sprites.js.
import fs from 'node:fs';
import path from 'node:path';
import { decodePNG, encodePNG } from './png.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const i = process.argv.indexOf('--dir');
const dir = path.join(ROOT, i < 0 ? 'assets/units' : process.argv[i + 1]);
const NATIONS = ['de', 'it', 'jp', 'us', 'uk', 'su'];

// Träger: Anteil der Geschützhöhe, ab dem die Lafettenbeine beginnen (wird
// abgeschnitten), Größe des Geschützes relativ zur Sprite-Breite, Mitte des
// Geschützes und Höhe der Ladefläche als Anteil an Breite/Höhe des Trägers.
const CARRIERS = {
  lflak_lkw: { from: 'truck', scale: 0.58, x: 0.34, deck: 0.2 },
  lflak_hk:  { from: 'halftrack', scale: 0.56, x: 0.3, deck: 0.3 },
};
const GUN_CUT = 0.66;

const load = f => decodePNG(fs.readFileSync(path.join(dir, f)));
const blank = (w, h) => ({ width: w, height: h, data: Buffer.alloc(w * h * 4) });

// Bilinear skalieren (Farben mit Alpha gewichtet, sonst dunkle Säume).
function resize(im, w, h) {
  const out = blank(w, h), sx = im.width / w, sy = im.height / h;
  const px = (x, y) => (Math.min(im.height - 1, Math.max(0, y)) * im.width + Math.min(im.width - 1, Math.max(0, x))) * 4;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const fx = (x + 0.5) * sx - 0.5, fy = (y + 0.5) * sy - 0.5;
    const x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
    const acc = [0, 0, 0, 0];
    for (const [dx, dy, wt] of [[0, 0, (1 - ax) * (1 - ay)], [1, 0, ax * (1 - ay)], [0, 1, (1 - ax) * ay], [1, 1, ax * ay]]) {
      const p = px(x0 + dx, y0 + dy), a = im.data[p + 3] * wt;
      acc[0] += im.data[p] * a; acc[1] += im.data[p + 1] * a; acc[2] += im.data[p + 2] * a; acc[3] += a;
    }
    const o = (y * w + x) * 4;
    if (acc[3] > 0) for (let c = 0; c < 3; c++) out.data[o + c] = Math.round(acc[c] / acc[3]);
    out.data[o + 3] = Math.round(acc[3]);
  }
  return out;
}

// src über dst legen (Alpha-Blending), Versatz ox/oy, nur Zeilen < maxY von src.
function paste(dst, src, ox, oy, maxY = src.height) {
  for (let y = 0; y < maxY; y++) for (let x = 0; x < src.width; x++) {
    const tx = x + ox, ty = y + oy;
    if (tx < 0 || ty < 0 || tx >= dst.width || ty >= dst.height) continue;
    const s = (y * src.width + x) * 4, d = (ty * dst.width + tx) * 4;
    const a = src.data[s + 3] / 255, b = dst.data[d + 3] / 255, o = a + b * (1 - a);
    if (o <= 0) continue;
    for (let c = 0; c < 3; c++) dst.data[d + c] = Math.round((src.data[s + c] * a + dst.data[d + c] * b * (1 - a)) / o);
    dst.data[d + 3] = Math.round(o * 255);
  }
}

const base = fs.readFileSync(path.join(dir, 'sprites.js'), 'utf8');
const META = Function(base + '\nreturn UNIT_SPRITES;')();
const out = {};
for (const n of NATIONS) {
  const gun = load(`${n}.lflak.png`), gunMeta = META[`${n}.lflak`];
  const barrel = gunMeta.barrel ? load(`${n}.lflak.barrel.png`) : null;
  for (const [key, c] of Object.entries(CARRIERS)) {
    const car = load(`${n}.${c.from}.png`);
    const gw = Math.round(car.width * c.scale), gh = Math.round(gun.height * gw / gun.width);
    const cut = Math.round(gh * GUN_CUT);
    const gx = Math.round(car.width * c.x - gw / 2);
    // Die Ladefläche liegt bei deck; darüber ragt das Geschütz hinaus.
    const deckY = Math.round(car.height * c.deck);
    const top = Math.max(0, cut - deckY);
    const W = car.width, H = car.height + top;
    const im = blank(W, H);
    paste(im, car, 0, top);
    const gy = top + deckY - cut;
    paste(im, resize(gun, gw, gh), gx, gy, cut);
    const name = `${n}.${key}`;
    fs.writeFileSync(path.join(dir, `${name}.png`), encodePNG(im));
    const map = ([fx, fy]) => [+((gx + fx * gw) / W).toFixed(4), +((gy + fy * gh) / H).toFixed(4)];
    const meta = { w: W, h: H, muzzle: map(gunMeta.muzzle) };
    if (barrel) {
      const bl = blank(W, H);
      paste(bl, resize(barrel, gw, gh), gx, gy);
      fs.writeFileSync(path.join(dir, `${name}.barrel.png`), encodePNG(bl));
      Object.assign(meta, { barrel: true, pivot: map(gunMeta.pivot) });
    }
    out[name] = meta;
  }
}

fs.writeFileSync(path.join(dir, 'sprites-mobile.js'),
  '// Erzeugt von tools/compose-mobile-flak.mjs – nicht von Hand ändern.\n' +
  '// Leichte Flak auf LKW (lflak_lkw) und Halbkette (lflak_hk), ergänzt sprites.js.\n' +
  'Object.assign(UNIT_SPRITES, {\n' +
  Object.entries(out).map(([k, v]) => `  '${k}': ${JSON.stringify(v)},`).join('\n') + '\n});\n');
console.log(Object.keys(out).length, 'Sprites geschrieben');
