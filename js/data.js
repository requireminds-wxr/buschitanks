// Spieldaten: Gelände, Einheitentypen und Nationen (Werte aus config/).

const START_FUNDS = 500;
const MAX_TURNS = 50;
const HEAL_PER_TURN = 3;
const AMBUSH_ATTACK_MUL = 0.4;   // überraschte Einheiten: −60 % Angriff
const GROUND_VS_AIR_MUL = 0.8;   // Bodeneinheiten ohne Flak: −20 % gegen Flugzeuge
const MOVE_ATTACK_PENALTY = 0.1;  // −10 % Angriff je in diesem Zug bewegtem Feld
const IMPASSABLE = 99;

// Bewegungskosten je Feld. Auf einer Straße kostet jedes passierbare Feld 1 Punkt.
const ROAD_COST = 1;

const TERRAIN = {
  plain:    { name: 'Ebene',         def: 0, cost: { foot: 1,  wheel: 2,  track: 1,  air: 1 } },
  forest:   { name: 'Wald',          def: 2, cost: { foot: 1,  wheel: 3,  track: 2,  air: 1 }, conceals: true },
  hills:    { name: 'Hügel',         def: 2, cost: { foot: 2,  wheel: 3,  track: 2,  air: 1 }, vision: 1 },
  mountain: { name: 'Gebirge',       def: 4, cost: { foot: 3,  wheel: 99, track: 99, air: 1 }, vision: 1 },
  swamp:    { name: 'Sumpf',         def: 0, cost: { foot: 2,  wheel: 99, track: 99, air: 1 } },
  water:    { name: 'Wasser',        def: 0, cost: { foot: 99, wheel: 99, track: 99, air: 1 } },
  city:     { name: 'Stadt',         def: 3, cost: { foot: 1,  wheel: 1,  track: 1,  air: 1 }, capturable: true, income: 100 },
  hq:       { name: 'Hauptquartier', def: 4, cost: { foot: 1,  wheel: 1,  track: 1,  air: 1 }, capturable: true, income: 200 },
};

const MOVE_TYPE_LABEL = { foot: 'zu Fuß', wheel: 'Räder', track: 'Ketten/Halbketten', air: 'Luft' };
const FIRE_TYPE_LABEL = { direct: 'direkt', indirect: 'indirekt' };
// Gelände, das direktes Feuer blockiert.
const BLOCKS_LINE_OF_FIRE = ['mountain'];

// Einheitenwerte stehen in config/einheiten.js (UNIT_CONFIG) und werden hier geprüft.
// Generische Einheitenklassen: bestimmen NATO-Symbol, Silhouette und KI-Verhalten.
const UNIT_CLASSES = {
  inf: 'Infanterie', recon: 'Aufklärung', truck: 'LKW', halftrack: 'Halbkettenfahrzeug',
  tank: 'Mittlerer Panzer', heavy: 'Schwerer Panzer', at: 'Panzerabwehr', art: 'Artillerie',
  lflak: 'Leichte Flak', hflak: 'Schwere Flak', air: 'Flugzeug',
};
const UNIT_ORDER = ['inf', 'recon', 'truck', 'halftrack', 'tank', 'heavy', 'at', 'art', 'lflak', 'hflak', 'air'];
const UNIT_NUMBER_FIELDS = ['move', 'soft', 'hard', 'air', 'def', 'armor', 'vision', 'cost'];
const UNIT_FLAGS = ['capture', 'spotter', 'aa', 'isAir', 'noCounter', 'noMoveAndFire', 'towed', 'transport', 'transportable'];

// Fehler beim Laden oder Prüfen der Konfiguration; ui.js zeigt sie statt des Startbildschirms.
const CONFIG_ERRORS = [];

function loadUnitTypes() {
  const out = {};
  if (typeof UNIT_CONFIG === 'undefined') {
    const err = (typeof window !== 'undefined' && window.CONFIG_LOAD_ERROR) || 'Datei fehlt oder enthält einen Syntaxfehler (z. B. fehlendes Komma oder Anführungszeichen). Die genaue Zeile steht in der Browser-Konsole (Mac: Cmd+Alt+J).';
    CONFIG_ERRORS.push(`config/einheiten.js konnte nicht geladen werden: ${err}`);
    return out;
  }
  for (const key of UNIT_ORDER) {
    const c = UNIT_CONFIG[key];
    const where = `Einheit „${key}“`;
    if (!c || typeof c !== 'object') { CONFIG_ERRORS.push(`${where} fehlt.`); continue; }
    if (typeof c.label !== 'string' || !c.label) CONFIG_ERRORS.push(`${where}: label muss ein Text sein.`);
    if (!UNIT_CLASSES[c.class]) CONFIG_ERRORS.push(`${where}: class muss eine dieser Klassen sein: ${Object.keys(UNIT_CLASSES).join(', ')}.`);
    if (!MOVE_TYPE_LABEL[c.moveType]) CONFIG_ERRORS.push(`${where}: moveType muss 'foot', 'wheel', 'track' oder 'air' sein.`);
    if (!FIRE_TYPE_LABEL[c.fire]) CONFIG_ERRORS.push(`${where}: fire muss 'direct' oder 'indirect' sein.`);
    if (typeof c.towed !== 'boolean') CONFIG_ERRORS.push(`${where}: towed muss true oder false sein.`);
    for (const f of UNIT_NUMBER_FIELDS) {
      if (typeof c[f] !== 'number' || !isFinite(c[f]) || c[f] < 0) CONFIG_ERRORS.push(`${where}: ${f} muss eine Zahl ≥ 0 sein.`);
    }
    const r = c.range;
    if (!Array.isArray(r) || r.length !== 2 || !r.every(n => Number.isInteger(n) && n >= 1) || r[0] > r[1]) {
      CONFIG_ERRORS.push(`${where}: range muss [min, max] mit ganzen Zahlen ≥ 1 sein, z. B. [1, 1] oder [2, 3].`);
    }
    for (const f of UNIT_FLAGS) {
      if (f in c && typeof c[f] !== 'boolean') CONFIG_ERRORS.push(`${where}: ${f} muss true oder false sein.`);
    }
    const known = new Set(['class', 'label', 'moveType', 'fire', 'range', ...UNIT_NUMBER_FIELDS, ...UNIT_FLAGS]);
    for (const f of Object.keys(c)) if (!known.has(f)) CONFIG_ERRORS.push(`${where}: unbekanntes Attribut „${f}“ (Tippfehler?).`);
    out[key] = { ...c, range: Array.isArray(r) ? [...r] : [1, 1] };
  }
  for (const key of Object.keys(UNIT_CONFIG)) {
    if (!UNIT_ORDER.includes(key)) CONFIG_ERRORS.push(`Unbekannter Einheitentyp „${key}“ – erlaubt sind: ${UNIT_ORDER.join(', ')}.`);
  }
  return out;
}

const UNIT_TYPES = loadUnitTypes();

// Klasse eines Modells (Einheitentyps), z. B. 'tank' für einen Panzer IV.
function unitClass(typeKey) { return (UNIT_TYPES[typeKey] && UNIT_TYPES[typeKey].class) || typeKey; }


// Nationen stehen in config/nationen.js (NATION_CONFIG) und werden hier geprüft.
const NATION_ORDER = ['de', 'it', 'jp', 'us', 'uk', 'su'];
const NATION_MOD_NUMBERS = ['soft', 'hard', 'air', 'def', 'move'];

function loadNations() {
  const out = {};
  if (typeof NATION_CONFIG === 'undefined') {
    const err = (typeof window !== 'undefined' && window.CONFIG_LOAD_ERROR_NATIONS) || 'Datei fehlt oder enthält einen Syntaxfehler (z. B. fehlendes Komma oder Anführungszeichen). Die genaue Zeile steht in der Browser-Konsole (Mac: Cmd+Alt+J).';
    CONFIG_ERRORS.push(`config/nationen.js konnte nicht geladen werden: ${err}`);
    return out;
  }
  const color = v => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
  for (const key of NATION_ORDER) {
    const n = NATION_CONFIG[key];
    const where = `Nation „${key}“`;
    if (!n || typeof n !== 'object') { CONFIG_ERRORS.push(`${where} fehlt.`); continue; }
    for (const f of ['name', 'short', 'bonus']) if (typeof n[f] !== 'string' || !n[f]) CONFIG_ERRORS.push(`${where}: ${f} muss ein Text sein.`);
    if (n.side !== 'axis' && n.side !== 'allies') CONFIG_ERRORS.push(`${where}: side muss 'axis' oder 'allies' sein.`);
    for (const f of ['color', 'dark', 'text']) if (!color(n[f])) CONFIG_ERRORS.push(`${where}: ${f} muss eine Farbe wie '#7b828b' sein.`);
    for (const f of ['costMul', 'incomeMul']) {
      if (f in n && !(typeof n[f] === 'number' && n[f] > 0)) CONFIG_ERRORS.push(`${where}: ${f} muss eine Zahl > 0 sein.`);
    }
    const units = n.units || {};
    for (const t of UNIT_ORDER) if (typeof units[t] !== 'string' || !units[t]) CONFIG_ERRORS.push(`${where}: units.${t} (Name) fehlt.`);
    for (const t of Object.keys(units)) if (!UNIT_ORDER.includes(t)) CONFIG_ERRORS.push(`${where}: units enthält unbekannten Typ „${t}“.`);
    const mods = n.mods || {};
    for (const [t, m] of Object.entries(mods)) {
      if (!UNIT_ORDER.includes(t)) { CONFIG_ERRORS.push(`${where}: mods enthält unbekannten Typ „${t}“.`); continue; }
      for (const [f, v] of Object.entries(m || {})) {
        if (NATION_MOD_NUMBERS.includes(f)) { if (typeof v !== 'number' || !isFinite(v)) CONFIG_ERRORS.push(`${where}: mods.${t}.${f} muss eine Zahl sein.`); }
        else if (f === 'costMul') { if (!(typeof v === 'number' && v > 0)) CONFIG_ERRORS.push(`${where}: mods.${t}.costMul muss eine Zahl > 0 sein.`); }
        else if (f === 'moveType') { if (!MOVE_TYPE_LABEL[v]) CONFIG_ERRORS.push(`${where}: mods.${t}.moveType muss 'foot', 'wheel', 'track' oder 'air' sein.`); }
        else if (f === 'towed') { if (typeof v !== 'boolean') CONFIG_ERRORS.push(`${where}: mods.${t}.towed muss true oder false sein.`); }
        else CONFIG_ERRORS.push(`${where}: mods.${t} hat unbekanntes Attribut „${f}“ (Tippfehler?).`);
      }
    }
    const known = new Set(['name', 'short', 'side', 'color', 'dark', 'text', 'costMul', 'incomeMul', 'bonus', 'units', 'mods']);
    for (const f of Object.keys(n)) if (!known.has(f)) CONFIG_ERRORS.push(`${where}: unbekanntes Attribut „${f}“ (Tippfehler?).`);
    out[key] = { ...n, mods: { ...mods }, units: { ...units } };
  }
  for (const key of Object.keys(NATION_CONFIG)) {
    if (!NATION_ORDER.includes(key)) CONFIG_ERRORS.push(`Unbekannte Nation „${key}“ – erlaubt sind: ${NATION_ORDER.join(', ')}.`);
  }
  return out;
}

const NATIONS = loadNations();

const AXIS = NATION_ORDER.filter(k => NATIONS[k] && NATIONS[k].side === 'axis');
const ALLIES = NATION_ORDER.filter(k => NATIONS[k] && NATIONS[k].side === 'allies');

const statsCache = new Map();

// Werte einer Einheit inklusive Nationsboni.
function unitStats(nationKey, typeKey) {
  const cacheKey = nationKey + ':' + typeKey;
  if (statsCache.has(cacheKey)) return statsCache.get(cacheKey);
  const base = UNIT_TYPES[typeKey];
  const nation = NATIONS[nationKey];
  const mod = nation.mods[typeKey] || {};
  const s = {
    ...base,
    type: typeKey,
    soft: Math.max(0, base.soft + (mod.soft || 0)),
    hard: Math.max(0, base.hard + (mod.hard || 0)),
    air: Math.max(0, base.air + (mod.air || 0)),
    def: Math.max(0, base.def + (mod.def || 0)),
    move: Math.max(0, base.move + (mod.move || 0)),
    moveType: mod.moveType || base.moveType,
    towed: 'towed' in mod ? mod.towed : base.towed,
    cost: Math.round((base.cost * (nation.costMul || 1) * (mod.costMul || 1)) / 10) * 10,
    name: nation.units[typeKey],
  };
  statsCache.set(cacheKey, s);
  return s;
}
