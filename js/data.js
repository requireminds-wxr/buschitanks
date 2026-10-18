// Spieldaten: Gelände, Einheitentypen und Nationen.

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

// Einheitenwerte stehen in config/einheiten.js (UNIT_CONFIG) und werden hier geprüft.
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
    if (!MOVE_TYPE_LABEL[c.moveType]) CONFIG_ERRORS.push(`${where}: moveType muss 'foot', 'wheel', 'track' oder 'air' sein.`);
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
    const known = new Set(['label', 'moveType', 'range', ...UNIT_NUMBER_FIELDS, ...UNIT_FLAGS]);
    for (const f of Object.keys(c)) if (!known.has(f)) CONFIG_ERRORS.push(`${where}: unbekanntes Attribut „${f}“ (Tippfehler?).`);
    out[key] = { ...c, range: Array.isArray(r) ? [...r] : [1, 1] };
  }
  for (const key of Object.keys(UNIT_CONFIG)) {
    if (!UNIT_ORDER.includes(key)) CONFIG_ERRORS.push(`Unbekannter Einheitentyp „${key}“ – erlaubt sind: ${UNIT_ORDER.join(', ')}.`);
  }
  return out;
}

const UNIT_TYPES = loadUnitTypes();


const NATIONS = {
  de: {
    name: 'Deutsches Reich', short: 'Deutschland', side: 'axis',
    color: '#7b828b', dark: '#2a2e33', text: '#f2f2f2',
    costMul: 1.05,
    mods: { tank: { soft: 1, hard: 1 }, heavy: { soft: 2, hard: 2, def: 2 }, hflak: { hard: 1 }, air: { soft: 1 } },
    bonus: 'Panzerqualität: Tiger +2 Angriff und +2 Verteidigung; Panzer IV, Stukas und die Acht-Acht +1 Angriff, dafür alle Einheiten 5 % teurer.',
    units: { inf: 'Grenadiere', recon: 'Sd.Kfz. 234 Puma', truck: 'Opel Blitz', halftrack: 'Sd.Kfz. 7', tank: 'Panzer IV', heavy: 'Tiger I', at: 'Pak 40', art: 'leFH 18', lflak: 'Flak 38 (2 cm)', hflak: 'Flak 36 (8,8 cm)', air: 'Ju 87 Stuka' },
  },
  it: {
    name: 'Königreich Italien', short: 'Italien', side: 'axis',
    color: '#3f6ea8', dark: '#1a2c44', text: '#f2f2f2',
    costMul: 0.85,
    mods: { tank: { def: -1 }, heavy: { def: -1, move: 1 }, art: { soft: 1 } },
    bonus: 'Günstige Ausrüstung: 15 % billiger und Artillerie +1, P26/40 +1 Bewegung, aber Panzer −1 Verteidigung.',
    units: { inf: 'Fanteria', recon: 'AB 41', truck: 'Fiat 626', halftrack: 'Breda 61', tank: 'M13/40', heavy: 'P26/40', at: 'Cannone 47/32', art: 'Obice 75/18', lflak: 'Breda 20/65', hflak: 'Cannone 90/53', air: 'Fiat G.55' },
  },
  jp: {
    name: 'Kaiserreich Japan', short: 'Japan', side: 'axis',
    color: '#d3b043', dark: '#4a3c12', text: '#1d1a10',
    costMul: 1,
    mods: { inf: { soft: 2 }, tank: { hard: -1, def: -1 }, heavy: { hard: -1, def: -1, move: 1 }, air: { move: 1 } },
    bonus: 'Banzai: Infanterie +2 Angriff, Zero und Chi-He +1 Bewegung, aber Panzer schwächer.',
    units: { inf: 'Infanterie (IJA)', recon: 'Typ 97 Te-Ke', truck: 'Isuzu Typ 94', halftrack: 'Typ 1 Ho-Ha', tank: 'Typ 97 Chi-Ha', heavy: 'Typ 1 Chi-He', at: 'Typ 1 47-mm-Pak', art: 'Typ 91 Haubitze', lflak: 'Typ 98 20-mm-Flak', hflak: 'Typ 88 75-mm-Flak', air: 'A6M Zero' },
  },
  us: {
    name: 'Vereinigte Staaten', short: 'USA', side: 'allies',
    color: '#5f6b2f', dark: '#23280f', text: '#f2f2f2',
    costMul: 1, incomeMul: 1.25,
    mods: { art: { soft: 1 }, air: { hard: 1 }, tank: { move: 1 }, heavy: { move: 1 }, lflak: { move: 5, moveType: 'track', towed: false } },
    bonus: 'Arsenal der Demokratie: +25 % Einkommen, Artillerie und Jagdbomber +1, Sherman und Pershing +1 Bewegung, M16 fährt selbst.',
    units: { inf: 'GI-Infanterie', recon: 'M8 Greyhound', truck: 'GMC CCKW', halftrack: 'M3 Halbkette', tank: 'M4 Sherman', heavy: 'M26 Pershing', at: '57-mm-Pak M1', art: 'M2A1 Haubitze', lflak: 'M16 Flakpanzer', hflak: '90-mm-Flak M1', air: 'P-47 Thunderbolt' },
  },
  uk: {
    name: 'Vereinigtes Königreich', short: 'Großbritannien', side: 'allies',
    color: '#9a7448', dark: '#3a2a16', text: '#f7f0e4',
    costMul: 1,
    mods: { inf: { def: 1 }, tank: { move: 1 }, art: { soft: 1, hard: 1 }, lflak: { air: 1 }, hflak: { air: 1 } },
    bonus: 'Bulldogge: Infanterie +1 Verteidigung, Artillerie und Flak stärker, Cromwell +1 Bewegung.',
    units: { inf: 'Infanterie', recon: 'Daimler Armoured Car', truck: 'Bedford QL', halftrack: 'M5 Halbkette', tank: 'Cromwell', heavy: 'Churchill', at: '6-Pfünder-Pak', art: '25-Pfünder', lflak: 'Bofors 40 mm', hflak: 'QF 3,7 Zoll', air: 'Hawker Typhoon' },
  },
  su: {
    name: 'Sowjetunion', short: 'Sowjetunion', side: 'allies',
    color: '#a33d2c', dark: '#3d130c', text: '#f7ece8',
    costMul: 0.9,
    mods: { inf: { costMul: 0.7 }, tank: { move: 1 } },
    bonus: 'Masse: alles 10 % billiger, Infanterie 30 % billiger, T-34 +1 Bewegung.',
    units: { inf: 'Schützen', recon: 'BA-64', truck: 'GAZ-AA', halftrack: 'Komsomolez', tank: 'T-34/76', heavy: 'IS-2', at: 'ZiS-3', art: 'M-30 Haubitze', lflak: '61-K (37 mm)', hflak: '52-K (85 mm)', air: 'Il-2 Sturmowik' },
  },
};

const AXIS = ['de', 'it', 'jp'];
const ALLIES = ['us', 'uk', 'su'];

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
    soft: base.soft + (mod.soft || 0),
    hard: base.hard + (mod.hard || 0),
    air: base.air + (mod.air || 0),
    def: base.def + (mod.def || 0),
    move: base.move + (mod.move || 0),
    moveType: mod.moveType || base.moveType,
    towed: 'towed' in mod ? mod.towed : base.towed,
    cost: Math.round((base.cost * (nation.costMul || 1) * (mod.costMul || 1)) / 10) * 10,
    name: nation.units[typeKey],
  };
  statsCache.set(cacheKey, s);
  return s;
}
