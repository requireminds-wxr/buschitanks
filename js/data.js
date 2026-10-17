// Spieldaten: Gelände, Einheitentypen und Nationen.

const START_FUNDS = 500;
const MAX_TURNS = 40;
const HEAL_PER_TURN = 2;
const IMPASSABLE = 99;

const TERRAIN = {
  plain:    { name: 'Ebene',         def: 0, cost: { foot: 1,  wheel: 1,  track: 1,  air: 1 } },
  forest:   { name: 'Wald',          def: 2, cost: { foot: 1,  wheel: 3,  track: 2,  air: 1 }, conceals: true },
  hills:    { name: 'Hügel',         def: 2, cost: { foot: 2,  wheel: 3,  track: 2,  air: 1 }, vision: 1 },
  mountain: { name: 'Gebirge',       def: 4, cost: { foot: 3,  wheel: 99, track: 99, air: 1 }, vision: 1 },
  swamp:    { name: 'Sumpf',         def: 0, cost: { foot: 2,  wheel: 99, track: 3,  air: 1 } },
  water:    { name: 'Wasser',        def: 0, cost: { foot: 99, wheel: 99, track: 99, air: 1 } },
  city:     { name: 'Stadt',         def: 3, cost: { foot: 1,  wheel: 1,  track: 1,  air: 1 }, capturable: true, income: 100 },
  hq:       { name: 'Hauptquartier', def: 4, cost: { foot: 1,  wheel: 1,  track: 1,  air: 1 }, capturable: true, income: 200 },
};

const MOVE_TYPE_LABEL = { foot: 'zu Fuß', wheel: 'Räder', track: 'Ketten', air: 'Luft' };

// soft/hard/air = Angriffswert gegen ungepanzerte, gepanzerte und Luftziele.
// armor: 0 = weiches Ziel, 0.5 = leicht gepanzert, 1 = Panzer.
// vision: Sichtweite in Feldern. spotter: sieht auch in Wälder hinein.
const UNIT_TYPES = {
  inf:   { label: 'Infanterie',      moveType: 'foot',  move: 3, soft: 6, hard: 2,  air: 1,  def: 5,  armor: 0,   range: [1, 1], vision: 2, cost: 100, capture: true },
  recon: { label: 'Aufklärung',      moveType: 'wheel', move: 6, soft: 5, hard: 2,  air: 3,  def: 3,  armor: 0.5, range: [1, 1], vision: 4, cost: 150, spotter: true },
  tank:  { label: 'Panzer',          moveType: 'track', move: 5, soft: 7, hard: 7,  air: 1,  def: 7,  armor: 1,   range: [1, 1], vision: 2, cost: 300 },
  heavy: { label: 'Schwerer Panzer', moveType: 'track', move: 4, soft: 8, hard: 10, air: 1,  def: 10, armor: 1,   range: [1, 1], vision: 2, cost: 500 },
  at:    { label: 'Panzerabwehr',    moveType: 'foot',  move: 3, soft: 2, hard: 9,  air: 0,  def: 5,  armor: 0,   range: [1, 1], vision: 2, cost: 200 },
  art:   { label: 'Artillerie',      moveType: 'wheel', move: 4, soft: 9, hard: 5,  air: 0,  def: 2,  armor: 0,   range: [2, 3], vision: 1, cost: 250, noCounter: true, noMoveAndFire: true },
  lflak: { label: 'Leichte Flak',    moveType: 'wheel', move: 5, soft: 7, hard: 2,  air: 9,  def: 3,  armor: 0,   range: [1, 2], vision: 2, cost: 200 },
  hflak: { label: 'Schwere Flak',    moveType: 'wheel', move: 3, soft: 4, hard: 9,  air: 10, def: 4,  armor: 0,   range: [2, 3], vision: 2, cost: 350, noMoveAndFire: true },
  air:   { label: 'Jagdbomber',      moveType: 'air',   move: 7, soft: 7, hard: 6,  air: 6,  def: 4,  armor: 0,   range: [1, 1], vision: 3, cost: 400, isAir: true, spotter: true },
};

const UNIT_ORDER = ['inf', 'recon', 'tank', 'heavy', 'at', 'art', 'lflak', 'hflak', 'air'];

const NATIONS = {
  de: {
    name: 'Deutsches Reich', short: 'Deutschland', side: 'axis',
    color: '#7b828b', dark: '#2a2e33', text: '#f2f2f2',
    costMul: 1.05,
    mods: { tank: { soft: 1, hard: 1 }, heavy: { soft: 1, hard: 1 }, hflak: { hard: 1 }, air: { soft: 1 } },
    bonus: 'Panzerqualität: Panzer, Tiger, Stukas und die Acht-Acht +1 Angriff, dafür alle Einheiten 5 % teurer.',
    units: { inf: 'Grenadiere', recon: 'Sd.Kfz. 234 Puma', tank: 'Panzer IV', heavy: 'Tiger I', at: 'Pak 40', art: 'leFH 18', lflak: 'Flak 38 (2 cm)', hflak: 'Flak 36 (8,8 cm)', air: 'Ju 87 Stuka' },
  },
  it: {
    name: 'Königreich Italien', short: 'Italien', side: 'axis',
    color: '#3f6ea8', dark: '#1a2c44', text: '#f2f2f2',
    costMul: 0.85,
    mods: { tank: { def: -1 }, heavy: { def: -1 }, art: { soft: 1 } },
    bonus: 'Günstige Ausrüstung: 15 % billiger und Artillerie +1, aber Panzer −1 Verteidigung.',
    units: { inf: 'Fanteria', recon: 'AB 41', tank: 'M13/40', heavy: 'P26/40', at: 'Cannone 47/32', art: 'Obice 75/18', lflak: 'Breda 20/65', hflak: 'Cannone 90/53', air: 'Fiat G.55' },
  },
  jp: {
    name: 'Kaiserreich Japan', short: 'Japan', side: 'axis',
    color: '#d3b043', dark: '#4a3c12', text: '#1d1a10',
    costMul: 1,
    mods: { inf: { soft: 2 }, tank: { hard: -1, def: -1 }, heavy: { hard: -1, def: -1 }, air: { move: 1 } },
    bonus: 'Banzai: Infanterie +2 Angriff, Zero +1 Bewegung, aber Panzer schwächer.',
    units: { inf: 'Infanterie (IJA)', recon: 'Typ 97 Te-Ke', tank: 'Typ 97 Chi-Ha', heavy: 'Typ 1 Chi-He', at: 'Typ 1 47-mm-Pak', art: 'Typ 91 Haubitze', lflak: 'Typ 98 20-mm-Flak', hflak: 'Typ 88 75-mm-Flak', air: 'A6M Zero' },
  },
  us: {
    name: 'Vereinigte Staaten', short: 'USA', side: 'allies',
    color: '#5f6b2f', dark: '#23280f', text: '#f2f2f2',
    costMul: 1, incomeMul: 1.25,
    mods: { art: { soft: 1 }, air: { hard: 1 } },
    bonus: 'Arsenal der Demokratie: +25 % Einkommen, Artillerie und Jagdbomber +1.',
    units: { inf: 'GI-Infanterie', recon: 'M8 Greyhound', tank: 'M4 Sherman', heavy: 'M26 Pershing', at: '57-mm-Pak M1', art: 'M2A1 Haubitze', lflak: 'M16 Flakpanzer', hflak: '90-mm-Flak M1', air: 'P-47 Thunderbolt' },
  },
  uk: {
    name: 'Vereinigtes Königreich', short: 'Großbritannien', side: 'allies',
    color: '#9a7448', dark: '#3a2a16', text: '#f7f0e4',
    costMul: 1,
    mods: { inf: { def: 1 }, art: { soft: 1, hard: 1 }, lflak: { air: 1 }, hflak: { air: 1 } },
    bonus: 'Bulldogge: Infanterie +1 Verteidigung, Artillerie und Flak stärker.',
    units: { inf: 'Infanterie', recon: 'Daimler Armoured Car', tank: 'Cromwell', heavy: 'Churchill', at: '6-Pfünder-Pak', art: '25-Pfünder', lflak: 'Bofors 40 mm', hflak: 'QF 3,7 Zoll', air: 'Hawker Typhoon' },
  },
  su: {
    name: 'Sowjetunion', short: 'Sowjetunion', side: 'allies',
    color: '#a33d2c', dark: '#3d130c', text: '#f7ece8',
    costMul: 0.9,
    mods: { inf: { costMul: 0.7 }, tank: { move: 1 } },
    bonus: 'Masse: alles 10 % billiger, Infanterie 30 % billiger, T-34 +1 Bewegung.',
    units: { inf: 'Schützen', recon: 'BA-64', tank: 'T-34/76', heavy: 'IS-2', at: 'ZiS-3', art: 'M-30 Haubitze', lflak: '61-K (37 mm)', hflak: '52-K (85 mm)', air: 'Il-2 Sturmowik' },
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
    cost: Math.round((base.cost * (nation.costMul || 1) * (mod.costMul || 1)) / 10) * 10,
    name: nation.units[typeKey],
  };
  statsCache.set(cacheKey, s);
  return s;
}
