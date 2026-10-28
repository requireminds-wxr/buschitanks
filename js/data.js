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
// Direktes Feuer: Gelände, das die Schusslinie blockiert, und Gelände, das die
// Reichweite je Feld auf der Linie (inklusive Zielfeld) um 1 verkürzt.
const BLOCKS_LINE_OF_FIRE = ['mountain', 'city', 'hq'];
const REDUCES_RANGE = ['forest', 'hills'];

// Einheitenwerte stehen in config/einheiten.js (UNIT_CONFIG) und werden hier geprüft.
// Generische Einheitenklassen: bestimmen NATO-Symbol, Silhouette und KI-Verhalten.
const UNIT_CLASSES = {
  inf: 'Infanterie', recon: 'Aufklärung', truck: 'LKW', halftrack: 'Halbkettenfahrzeug',
  light: 'Leichter Panzer', tank: 'Mittlerer Panzer', heavy: 'Schwerer Panzer', td: 'Jagdpanzer',
  at: 'Panzerabwehr', art: 'Artillerie', lflak: 'Leichte Flak', hflak: 'Schwere Flak',
  spaa: 'Flakpanzer', fighter: 'Jagdflugzeug', attack: 'Schlachtflugzeug',
};
const UNIT_ORDER = Object.keys(UNIT_CLASSES);
const UNIT_NUMBER_FIELDS = ['move', 'soft', 'hard', 'air', 'def', 'armor', 'vision', 'cost'];
const UNIT_FLAGS = ['modelsOnly', 'capture', 'spotter', 'aa', 'isAir', 'noCounter', 'noMoveAndFire', 'towed', 'transport', 'transportable'];

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

// Allgemeine Klassen, die jede Nation direkt bauen kann (ohne Modelle).
const GENERIC_ORDER = UNIT_ORDER.filter(k => UNIT_TYPES[k] && !UNIT_TYPES[k].modelsOnly);

// Klasse eines Einheitentyps: bei Modellen deren class (z. B. 'tank' für den Panzer IV).
function unitClass(typeKey) {
  if (typeof MODELS !== 'undefined' && MODELS[typeKey]) return MODELS[typeKey].class;
  return (UNIT_TYPES[typeKey] && UNIT_TYPES[typeKey].class) || typeKey;
}


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
    for (const t of GENERIC_ORDER) if (typeof units[t] !== 'string' || !units[t]) CONFIG_ERRORS.push(`${where}: units.${t} (Name) fehlt.`);
    for (const t of Object.keys(units)) if (!GENERIC_ORDER.includes(t)) CONFIG_ERRORS.push(`${where}: units enthält „${t}“ – Namen gibt es nur für allgemeine Klassen (${GENERIC_ORDER.join(', ')}); Panzer und Flugzeuge stehen in config/modelle.js.`);
    const mods = n.mods || {};
    for (const [t, m] of Object.entries(mods)) {
      if (!GENERIC_ORDER.includes(t)) { CONFIG_ERRORS.push(`${where}: mods enthält „${t}“ – Abweichungen gibt es nur für allgemeine Klassen (${GENERIC_ORDER.join(', ')}); Panzer und Flugzeuge haben eigene Werte in config/modelle.js.`); continue; }
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

// Epochen und Modelle stehen in config/modelle.js (ERA_CONFIG, MODEL_CONFIG).
function loadEras() {
  if (typeof ERA_CONFIG === 'undefined' || !Array.isArray(ERA_CONFIG) || !ERA_CONFIG.length) {
    const err = (typeof window !== 'undefined' && window.CONFIG_LOAD_ERROR_MODELS) || 'ERA_CONFIG fehlt oder enthält einen Syntaxfehler.';
    CONFIG_ERRORS.push(`config/modelle.js: ${err}`);
    return [{ key: 'early', name: '–', fromTurn: 1 }];
  }
  ERA_CONFIG.forEach((e, i) => {
    const where = `Epoche ${i + 1}`;
    if (!e || typeof e.key !== 'string' || !e.key) CONFIG_ERRORS.push(`${where}: key muss ein Text sein.`);
    if (!e || typeof e.name !== 'string' || !e.name) CONFIG_ERRORS.push(`${where}: name muss ein Text sein.`);
    if (!e || !Number.isInteger(e.fromTurn) || e.fromTurn < 1) CONFIG_ERRORS.push(`${where}: fromTurn muss eine ganze Zahl ≥ 1 sein.`);
    else if (i === 0 && e.fromTurn !== 1) CONFIG_ERRORS.push(`${where}: Die erste Epoche muss mit fromTurn: 1 beginnen.`);
    else if (i > 0 && ERA_CONFIG[i - 1] && e.fromTurn <= ERA_CONFIG[i - 1].fromTurn) CONFIG_ERRORS.push(`${where}: fromTurn muss größer sein als bei der vorigen Epoche.`);
  });
  return ERA_CONFIG.map(e => ({ ...e }));
}

const ERAS = loadEras();

function loadModels() {
  const out = {};
  if (typeof MODEL_CONFIG === 'undefined') {
    const err = (typeof window !== 'undefined' && window.CONFIG_LOAD_ERROR_MODELS) || 'Datei fehlt oder enthält einen Syntaxfehler (z. B. fehlendes Komma oder Anführungszeichen). Die genaue Zeile steht in der Browser-Konsole (Mac: Cmd+Alt+J).';
    CONFIG_ERRORS.push(`config/modelle.js konnte nicht geladen werden: ${err}`);
    return out;
  }
  const eraKeys = ERAS.map(e => e.key);
  const known = new Set(['nation', 'class', 'name', 'eras', 'sprite', 'moveType', 'fire', 'range', ...UNIT_NUMBER_FIELDS, ...UNIT_FLAGS]);
  for (const [key, m] of Object.entries(MODEL_CONFIG)) {
    const where = `Modell „${key}“`;
    if (UNIT_TYPES[key]) { CONFIG_ERRORS.push(`${where}: Der Schlüssel ist schon eine Klasse – bitte anders benennen (z. B. ${key}_1).`); continue; }
    if (!m || typeof m !== 'object') { CONFIG_ERRORS.push(`${where} ist kein Eintrag { … }.`); continue; }
    if (!NATIONS[m.nation]) CONFIG_ERRORS.push(`${where}: nation muss eine von ${NATION_ORDER.join(', ')} sein.`);
    if (!UNIT_TYPES[m.class]) CONFIG_ERRORS.push(`${where}: class muss eine dieser Klassen sein: ${UNIT_ORDER.join(', ')}.`);
    if (typeof m.name !== 'string' || !m.name) CONFIG_ERRORS.push(`${where}: name muss ein Text sein.`);
    if (!Array.isArray(m.eras) || !m.eras.length || !m.eras.every(e => eraKeys.includes(e))) {
      CONFIG_ERRORS.push(`${where}: eras muss eine Liste aus ${eraKeys.map(e => `'${e}'`).join(', ')} sein.`);
    }
    if ('sprite' in m && !UNIT_TYPES[m.sprite]) CONFIG_ERRORS.push(`${where}: sprite muss eine Klasse sein, z. B. 'tank' oder 'halftrack'.`);
    if ('moveType' in m && !MOVE_TYPE_LABEL[m.moveType]) CONFIG_ERRORS.push(`${where}: moveType muss 'foot', 'wheel', 'track' oder 'air' sein.`);
    if ('fire' in m && !FIRE_TYPE_LABEL[m.fire]) CONFIG_ERRORS.push(`${where}: fire muss 'direct' oder 'indirect' sein.`);
    for (const f of UNIT_NUMBER_FIELDS) {
      if (f in m && (typeof m[f] !== 'number' || !isFinite(m[f]) || m[f] < 0)) CONFIG_ERRORS.push(`${where}: ${f} muss eine Zahl ≥ 0 sein.`);
    }
    const r = m.range;
    if ('range' in m && (!Array.isArray(r) || r.length !== 2 || !r.every(n => Number.isInteger(n) && n >= 1) || r[0] > r[1])) {
      CONFIG_ERRORS.push(`${where}: range muss [min, max] mit ganzen Zahlen ≥ 1 sein, z. B. [1, 2].`);
    }
    for (const f of UNIT_FLAGS) if (f in m && typeof m[f] !== 'boolean') CONFIG_ERRORS.push(`${where}: ${f} muss true oder false sein.`);
    for (const f of Object.keys(m)) if (!known.has(f)) CONFIG_ERRORS.push(`${where}: unbekanntes Attribut „${f}“ (Tippfehler?).`);
    out[key] = { ...m, range: Array.isArray(r) ? [...r] : undefined };
  }
  for (const n of NATION_ORDER) {
    for (const cls of ['tank']) {
      if (!Object.values(out).some(m => m.nation === n && (m.class === cls || m.class === 'light') && m.eras && m.eras.includes(ERAS[0].key))) {
        CONFIG_ERRORS.push(`config/modelle.js: ${NATIONS[n] ? NATIONS[n].short : n} braucht in der ersten Epoche mindestens einen Panzer (class 'tank' oder 'light') für die Startarmee.`);
      }
    }
  }
  return out;
}

const MODELS = loadModels();

// Epoche zu einer Runde: die letzte, die bis dahin begonnen hat.
function eraOfTurn(turn) {
  let era = ERAS[0];
  for (const e of ERAS) if (turn >= e.fromTurn) era = e;
  return era;
}

// Baubare Typen einer Nation in einer Epoche: allgemeine Klassen und passende Modelle,
// sortiert nach Klasse und Preis.
function buildableTypes(nationKey, eraKey) {
  const models = Object.keys(MODELS).filter(k => MODELS[k].nation === nationKey && MODELS[k].eras.includes(eraKey));
  const types = [...GENERIC_ORDER, ...models];
  const order = t => UNIT_ORDER.indexOf(unitClass(t));
  return types.sort((a, b) => order(a) - order(b) || unitStats(nationKey, a).cost - unitStats(nationKey, b).cost);
}

// Typ für eine Klasse der Startarmee: allgemeine Klasse direkt, sonst das Modell der Nation
// aus der ersten Epoche (leichter oder mittlerer Panzer), dessen Preis START_TANK_VALUE
// am nächsten kommt – so starten alle Nationen mit einem ähnlich starken Panzer.
const START_TANK_VALUE = 250;
function startTypeFor(nationKey, cls) {
  if (GENERIC_ORDER.includes(cls)) return cls;
  const era = ERAS[0].key;
  const classes = cls === 'tank' ? ['tank', 'light'] : [cls];
  const list = Object.keys(MODELS).filter(k => MODELS[k].nation === nationKey && classes.includes(MODELS[k].class) && MODELS[k].eras.includes(era));
  const gap = k => Math.abs(unitStats(nationKey, k).cost - START_TANK_VALUE);
  return list.sort((a, b) => gap(a) - gap(b))[0] || null;
}

const statsCache = new Map();

// Werte einer Einheit: Modell (eigene Werte über der Klasse) oder allgemeine Klasse mit Nationsabweichungen.
function unitStats(nationKey, typeKey) {
  const cacheKey = nationKey + ':' + typeKey;
  if (statsCache.has(cacheKey)) return statsCache.get(cacheKey);
  const nation = NATIONS[nationKey];
  const model = MODELS[typeKey];
  let s;
  if (model) {
    const base = UNIT_TYPES[model.class];
    const own = {};
    for (const [k, v] of Object.entries(model)) if (v !== undefined && !['nation', 'eras'].includes(k)) own[k] = v;
    s = {
      ...base, ...own,
      type: typeKey,
      range: model.range ? [...model.range] : [...base.range],
      cost: Math.round(((own.cost ?? base.cost) * (nation.costMul || 1)) / 10) * 10,
    };
  } else {
    const base = UNIT_TYPES[typeKey];
    const mod = nation.mods[typeKey] || {};
    s = {
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
  }
  statsCache.set(cacheKey, s);
  return s;
}
