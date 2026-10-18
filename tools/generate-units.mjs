// Erzeugt Einheitengrafiken über die OpenAI-Bild-API.
//
//   node tools/generate-units.mjs [--model gpt-image-2.5-sunburst] [--quality high]
//                                 [--only de.heavy,su.inf] [--force]
//
// Rohbilder landen in tools/raw/<modell>/<nation>.<typ>.png (nicht im Repo);
// danach mit tools/process-units.mjs zu Sprites verarbeiten.
// Der API-Schlüssel kommt aus KT_OPENAI_API_KEY (notfalls aus ~/.zshrc).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { UNIT_PROMPTS, BARREL_LAYOUT } from './unit-prompts.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i < 0 ? def : process.argv[i + 1] ?? def;
}
const model = arg('model', 'gpt-image-2.5-sunburst');
const quality = arg('quality', 'high');
const only = arg('only', '')?.split(',').filter(Boolean);
const force = process.argv.includes('--force');

function apiKey() {
  if (process.env.KT_OPENAI_API_KEY) return process.env.KT_OPENAI_API_KEY;
  const rc = fs.readFileSync(path.join(os.homedir(), '.zshrc'), 'utf8');
  const m = rc.match(/KT_OPENAI_API_KEY=["']?([^"'\s]+)/);
  if (!m) throw new Error('KT_OPENAI_API_KEY nicht gefunden');
  return m[1];
}

function loadConfig() {
  const ctx = {};
  vm.createContext(ctx);
  for (const f of ['config/einheiten.js', 'config/nationen.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
  return vm.runInContext('({ UNIT_CONFIG, NATION_CONFIG })', ctx);
}

// Bildaufbau je Motivgruppe. Die Vorgaben zu Rohr und Ausrichtung braucht die
// Nachbearbeitung, um das Rohr als eigene Ebene für Animationen abzutrennen.
const LAYOUT = {
  vehicle: 'Exact orthographic side profile, vehicle facing right, wheels or tracks level at the bottom of the vehicle.',
  gun: 'Exact orthographic side profile, the gun deployed for firing and facing right, no crew, no towing vehicle.',
  barrel: BARREL_LAYOUT,
  inf: 'Exact side view of a squad of three soldiers advancing to the right in a loose row, full bodies visible, slightly overlapping, carrying their typical rifles and one light machine gun.',
  air: 'Exact orthographic side profile of the aircraft in level flight, flying to the right, landing gear retracted (unless the aircraft has fixed landing gear), propeller shown as a faint semi-transparent blurred disc.',
};

const STYLE = [
  'Semi-realistic painted illustration for a turn-based strategy board game, in the style of a detailed hand-painted game sprite.',
  'Isolated on a fully transparent background: no ground, no cast shadow, no scenery, no smoke, no frame, no text, no numbers, no national insignia or emblems of any kind.',
  'The subject is centered and fills about 90 % of the image width.',
  'Crisp, slightly darker outline around the whole silhouette so the shape stays readable when scaled down to 40 pixels.',
  'Soft even lighting from the upper left, muted historically accurate colours, light weathering.',
].join(' ');

function buildPrompt(cfg, nation, type) {
  const n = cfg.NATION_CONFIG[nation], u = cfg.UNIT_CONFIG[type];
  const name = n.units[type];
  const desc = UNIT_PROMPTS[`${nation}.${type}`] ?? `the ${name} (${u.label}) of the ${n.short} army in World War II`;
  const mods = n.mods[type] ?? {};
  const towed = mods.towed ?? u.towed;
  const parts = [`Subject: ${desc}.`];
  if (type === 'inf') parts.push(LAYOUT.inf);
  else if (type === 'air') parts.push(LAYOUT.air);
  else parts.push(towed || type === 'at' ? LAYOUT.gun : LAYOUT.vehicle);
  if (['tank', 'heavy', 'at', 'art', 'lflak', 'hflak'].includes(type) || (type === 'recon' && u.hard + (mods.hard ?? 0) >= 4)) parts.push(LAYOUT.barrel);
  parts.push(STYLE);
  return parts.join(' ');
}

async function generate(key, prompt, file) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, size: '1536x1024', quality, background: 'transparent', output_format: 'png' }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error.message);
  fs.writeFileSync(file, Buffer.from(d.data[0].b64_json, 'base64'));
  fs.writeFileSync(file.replace(/\.png$/, '.txt'), prompt + '\n');
}

const cfg = loadConfig();
const jobs = [];
for (const nation of Object.keys(cfg.NATION_CONFIG))
  for (const type of Object.keys(cfg.UNIT_CONFIG))
    if (!only.length || only.includes(`${nation}.${type}`)) jobs.push([nation, type]);

const outDir = path.join(ROOT, 'tools/raw', model);
fs.mkdirSync(outDir, { recursive: true });
const key = apiKey();
const queue = jobs.filter(([n, t]) => force || !fs.existsSync(path.join(outDir, `${n}.${t}.png`)));
console.log(`${queue.length} Bilder mit ${model} (${quality}) …`);

// Höchstens vier Anfragen gleichzeitig.
let failed = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const [nation, type] = queue.shift();
    const file = path.join(outDir, `${nation}.${type}.png`);
    try {
      await generate(key, buildPrompt(cfg, nation, type), file);
      console.log('  ✓', nation, type);
    } catch (e) {
      failed++;
      console.log('  ✗', nation, type, e.message);
    }
  }
}));
if (failed) process.exitCode = 1;
