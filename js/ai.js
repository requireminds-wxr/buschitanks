// Einfache, gierige KI: greift an, wenn es sich lohnt, erobert Städte, rückt sonst vor.

const AI_DELAY = 260;
const AI_UNIT_ORDER = {
  recon: 0, art: 1, hflak: 1, fighter: 1.5, attack: 2, heavy: 3, tank: 3, td: 3, light: 3.5,
  lflak: 4, spaa: 4, at: 5, truck: 5.5, halftrack: 5.5, inf: 6,
};

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function aiTakeTurn(game, view) {
  const me = game.current;
  await aiSieges(game, view);
  const units = game.units.filter(u => u.owner === me)
    .sort((a, b) => AI_UNIT_ORDER[unitClass(a.type)] - AI_UNIT_ORDER[unitClass(b.type)]);
  for (const u of units) {
    if (game.gameOver) break;
    if (!game.units.includes(u)) continue;
    if (game.stats(u).transport) await aiTransport(game, view, u);
    else await aiActUnit(game, view, u);
  }
  if (!game.gameOver) {
    aiBuy(game);
    if (view) await sleep(AI_DELAY);
  }
  if (!game.gameOver) game.endTurn();
}

function unitWorth(game, u) { return game.stats(u).cost; }

// ---------- Stadtangriffe ----------
// Eine besetzte feindliche Stadt wird nur angegriffen, wenn die Besatzung in diesem Zug
// mit Überlegenheit vernichtet und die Stadt sofort von eigener Infanterie besetzt werden kann.

const SIEGE_MARGIN = 1.2; // erwarteter Schaden muss die Stärke des Verteidigers um 20 % übertreffen

async function aiSieges(game, view) {
  for (let guard = 0; guard < 20 && !game.gameOver; guard++) {
    const plan = bestSiegePlan(game, game.current);
    if (!plan) return;
    await aiExecuteSiege(game, view, plan);
  }
}

function bestSiegePlan(game, me) {
  const reachCache = new Map();
  const reachOf = u => {
    if (!reachCache.has(u)) reachCache.set(u, game.reachable(u));
    return reachCache.get(u);
  };
  let best = null;
  for (const def of game.visibleEnemies(me)) {
    const tile = game.tileOf(def);
    if (!TERRAIN[tile.terrain].capturable || tile.owner === me) continue;
    const plan = planSiege(game, me, tile, def, reachOf);
    if (plan && (!best || plan.value > best.value)) best = plan;
  }
  return best;
}

function planSiege(game, me, tile, def, reachOf) {
  const cityKey = hexKey(tile.q, tile.r);

  // 1. Kann eine eigene Infanterie die Stadt erreichen, sobald die Besatzung weg ist?
  const idx = game.units.indexOf(def);
  game.units.splice(idx, 1);
  game.version++;
  let capturer = null;
  for (const u of game.units) {
    if (u.owner !== me || !game.stats(u).capture || !game.canMove(u)) continue;
    const info = game.reachable(u).get(cityKey);
    if (info && info.stop && (!capturer || u.hp > capturer.hp)) capturer = u;
  }
  game.units.splice(idx, 0, def);
  game.version++;
  if (!capturer) return null;

  // 2. Reicht die Feuerkraft der übrigen Einheiten mit Überlegenheit?
  const options = [];
  for (const u of game.units) {
    if (u.owner !== me || u === capturer || !game.canAttackNow(u)) continue;
    const s = game.stats(u);
    const spots = [];
    for (const [k, info] of reachOf(u)) {
      if (!info.stop || k === cityKey) continue;
      if (s.noMoveAndFire && k !== hexKey(u.q, u.r)) continue;
      const [q, r] = parseKey(k);
      if (!game.inRange(u, q, r, def)) continue;
      const steps = game.pathTo(reachOf(u), k).length - 1;
      const f = game.forecast(u, def, [q, r], steps);
      if (f.avg > 0) spots.push({ key: k, avg: f.avg, loss: f.cavg / 10 * unitWorth(game, u) });
    }
    if (spots.length) options.push({ u, spots: spots.sort((a, b) => b.avg - a.avg) });
  }
  options.sort((a, b) => b.spots[0].avg - a.spots[0].avg);
  const taken = new Set();
  const attacks = [];
  let damage = 0, losses = 0;
  for (const o of options) {
    if (damage >= def.hp * SIEGE_MARGIN) break;
    const spot = o.spots.find(sp => !taken.has(sp.key));
    if (!spot) continue;
    taken.add(spot.key);
    attacks.push({ u: o.u, key: spot.key });
    damage += spot.avg;
    losses += spot.loss;
  }
  if (damage < def.hp * SIEGE_MARGIN) return null;

  const winning = game.citiesOf(me) === game.totalCities() - 1;
  const cityValue = winning ? 1e6 : (tile.terrain === 'hq' ? 700 : 400) + unitWorth(game, def) * def.hp / 10;
  return { def, tile, cityKey, capturer, attacks, value: cityValue - losses };
}

async function aiExecuteSiege(game, view, plan) {
  const me = game.current;
  // Fernkämpfer zuerst (kein Gegenschlag), dann die Nahkämpfer.
  const ranged = a => (game.stats(a.u).range[1] > 1 ? 1 : 0);
  plan.attacks.sort((a, b) => ranged(b) - ranged(a));
  for (const a of plan.attacks) {
    if (game.gameOver || !game.units.includes(plan.def)) break;
    if (!game.units.includes(a.u)) continue;
    await aiMove(game, view, a.u, a.key);
    if (game.units.includes(a.u) && game.units.includes(plan.def) && game.canSee(me, plan.def)
        && game.canAttackNow(a.u) && game.inRange(a.u, a.u.q, a.u.r, plan.def)) {
      await aiAttack(game, view, a.u, plan.def);
    }
  }
  if (game.gameOver || game.units.includes(plan.def) || !game.units.includes(plan.capturer)) return;
  const info = game.reachable(plan.capturer).get(plan.cityKey);
  if (info && info.stop) await aiMove(game, view, plan.capturer, plan.cityKey);
}

function scoreAttack(game, u, target, fromQ, fromR, steps) {
  const f = game.forecast(u, target, [fromQ, fromR], steps);
  if (f.avg <= 0) return -Infinity;
  const dealt = Math.min(f.avg, target.hp) / 10 * unitWorth(game, target);
  const kill = f.avg >= target.hp ? unitWorth(game, target) * 0.4 : 0;
  const lost = Math.min(f.cavg, u.hp) / 10 * unitWorth(game, u);
  const t = game.tileOf(target);
  // Eindringlinge in eigenen Städten haben Vorrang.
  const threat = TERRAIN[t.terrain].capturable && t.owner === u.owner ? 150 : 0;
  return dealt + kill - lost * 0.9 + threat + game.terrainDefense(u, fromQ, fromR) * 6;
}

function bestAttackFrom(game, u, q, r, steps) {
  let best = null;
  for (const e of game.targetsFrom(u, q, r)) {
    const score = scoreAttack(game, u, e, q, r, steps);
    if (!best || score > best.score) best = { score, target: e };
  }
  return best;
}

// Einheiten ohne Eroberungsfähigkeit sollen fremde Städte nicht besetzen,
// sonst kommt die eigene Infanterie nicht hinein.
function blocksCity(game, u, t) {
  return !game.stats(u).capture && TERRAIN[t.terrain].capturable && t.owner !== u.owner;
}

async function aiMove(game, view, u, destKey) {
  if (destKey === hexKey(u.q, u.r)) return;
  const res = game.moveUnit(u, destKey);
  if (!res || !view) return;
  await view.animateMove(u, res.path);
  if (res.ambush || res.stopped) await view.flashText(u.q, u.r, 'Hinterhalt!', '#ff9b6a');
  if (res.capture) await view.flashText(u.q, u.r, 'Erobert!', '#ffe08a');
}

async function aiAttack(game, view, u, target) {
  if (view) await view.showAttack(u, target);
  const res = game.attack(u, target);
  if (view && res) await view.showAttackResult(u, target, res);
}

async function aiActUnit(game, view, u) {
  const s = game.stats(u);
  const startKey = hexKey(u.q, u.r);
  const reach = game.reachable(u);

  // 1. Beste direkte Aktion: Angriff (ggf. nach Bewegung) oder Eroberung.
  let best = null;
  for (const [k, info] of reach) {
    if (!info.stop) continue;
    const [q, r] = parseKey(k);
    const t = game.tile(q, r);
    if (s.capture && TERRAIN[t.terrain].capturable && t.owner !== u.owner) {
      // Die letzte fehlende Stadt entscheidet das Spiel.
      const winning = game.citiesOf(u.owner) === game.totalCities() - 1;
      const score = winning ? 1e6 : (t.terrain === 'hq' ? 520 : 260) + (t.owner >= 0 ? 140 : 0);
      if (!best || score > best.score) best = { score, dest: k, target: null };
    }
    if (s.noMoveAndFire && k !== startKey) continue;
    const atk = bestAttackFrom(game, u, q, r, game.pathTo(reach, k).length - 1);
    if (atk) atk.score -= blocksCity(game, u, t) ? 80 : 0;
    if (atk && (!best || atk.score > best.score)) best = { score: atk.score, dest: k, target: atk.target };
  }

  if (best && best.score > 15) {
    if (view) await sleep(AI_DELAY * 0.5);
    await aiMove(game, view, u, best.dest);
    if (best.target && !game.gameOver && game.units.includes(best.target) && game.canAttackNow(u) && game.inRange(u, u.q, u.r, best.target)) {
      await aiAttack(game, view, u, best.target);
    }
    return;
  }

  // 2. Strategische Bewegung.
  if (!game.canMove(u)) return;
  const enemies = game.visibleEnemies(u.owner);
  let goals = [];
  if (u.hp <= 3) {
    goals = game.productionTiles(u.owner).map(t => hexKey(t.q, t.r));
  }
  if (!goals.length && s.capture) {
    for (const t of game.map.tiles.values()) {
      if (TERRAIN[t.terrain].capturable && t.owner !== u.owner) goals.push(hexKey(t.q, t.r));
    }
  }
  if (!goals.length) {
    goals = enemies.map(e => hexKey(e.q, e.r));
    goals.push(game.map.hq[1 - u.owner]);
    // Ohne Feindkontakt: Aufklärer erkunden feindliche Städte.
    if (!enemies.length || s.spotter) {
      for (const t of game.map.tiles.values()) {
        if (TERRAIN[t.terrain].capturable && t.owner !== u.owner) goals.push(hexKey(t.q, t.r));
      }
    }
  }
  const dist = game.distanceMap(goals, s.moveType);
  const valueOf = k => {
    const [q, r] = parseKey(k);
    let v = dist.has(k) ? dist.get(k) : 999;
    v -= game.terrainDefense(u, q, r) * 0.25;
    if (blocksCity(game, u, game.tile(q, r))) v += 8;
    if (s.noMoveAndFire || s.class === 'at' || s.class === 'lflak') {
      // Unterstützungseinheiten halten Abstand zur Front.
      const adjacent = enemies.some(e => hexDistance(q, r, e.q, e.r) <= 1);
      if (adjacent) v += 6;
    }
    return v;
  };
  let bestKey = startKey, bestVal = valueOf(startKey);
  for (const [k, info] of reach) {
    if (!info.stop) continue;
    const v = valueOf(k);
    if (v < bestVal) { bestVal = v; bestKey = k; }
  }
  if (bestKey === startKey) return;
  if (view) await sleep(AI_DELAY * 0.4);
  await aiMove(game, view, u, bestKey);

  if (!game.gameOver && game.units.includes(u) && game.canAttackNow(u)) {
    const atk = bestAttackFrom(game, u, u.q, u.r);
    if (atk && atk.score > 0) await aiAttack(game, view, u, atk.target);
  }
}

// Kauft nach Bedarf je Klasse; innerhalb einer Klasse werden bessere (teurere) Modelle
// der aktuellen Epoche bevorzugt, sofern bezahlbar.
function aiBuy(game) {
  const me = game.current;
  const p = game.players[me];
  const enemies = game.visibleEnemies(me);
  const mine = game.units.filter(u => u.owner === me);
  const count = (list, pred) => list.filter(pred).length;
  const cls = u => unitClass(u.type);
  const enemyArmor = count(enemies, u => game.stats(u).armor >= 1);
  const enemyAir = count(enemies, u => game.stats(u).isAir);
  const spots = game.productionTiles(me).sort((a, b) => (b.terrain === 'hq') - (a.terrain === 'hq'));
  const buildable = game.buildable(me);

  for (const tile of spots) {
    const myInf = count(mine, u => cls(u) === 'inf');
    const myArt = count(mine, u => cls(u) === 'art');
    const myAa = count(mine, u => game.stats(u).aa);
    const myRecon = count(mine, u => cls(u) === 'recon');
    const myFighters = count(mine, u => cls(u) === 'fighter');
    // Gezogene Geschütze brauchen Fahrzeuge (auch die schon verladenen zählen).
    const towed = count(mine, u => game.stats(u).towed) + count(mine, u => u.cargo && game.stats(u.cargo).towed);
    const transports = count(mine, u => game.stats(u).transport);
    const needTransport = towed - transports;
    const classWeights = {
      inf: 2 + (myInf < 4 ? 4 : 0),
      recon: myRecon < 2 ? 2.5 : 0.5,
      light: 1,
      tank: 3,
      heavy: p.funds >= 900 ? 3 : 1,
      td: 1 + enemyArmor * 0.4,
      at: 1 + enemyArmor * 0.4,
      art: myArt < 3 ? 2 : 0.5,
      lflak: Math.max(0.5, enemyAir * 1.2 - myAa),
      hflak: Math.max(0.5, enemyAir * 1.2 + enemyArmor * 0.4 - myAa),
      spaa: Math.max(0.3, enemyAir * 1.2 - myAa),
      fighter: Math.max(0.3, 0.8 + enemyAir * 1.2 - myFighters * 0.5),
      attack: 1.5,
      truck: needTransport > 0 ? 3 * needTransport : 0.3,
      halftrack: needTransport > 0 ? 2 * needTransport : 0.2,
    };
    const affordable = buildable.filter(t => game.unitCost(me, t) <= p.funds && (classWeights[unitClass(t)] || 0) > 0);
    if (!affordable.length) break;
    const weights = new Map();
    for (const c of new Set(affordable.map(unitClass))) {
      const list = affordable.filter(t => unitClass(t) === c);
      const sum = list.reduce((s, t) => s + game.unitCost(me, t), 0);
      for (const t of list) weights.set(t, classWeights[c] * game.unitCost(me, t) / sum);
    }
    const total = [...weights.values()].reduce((s, w) => s + w, 0);
    let roll = game.rng() * total;
    let pick = affordable[0];
    for (const [t, w] of weights) { roll -= w; if (roll <= 0) { pick = t; break; } }
    const u = game.buy(pick, tile);
    if (u) mine.push(u);
  }
}

// ---------- Transport ----------

// Leere Fahrzeuge holen gezogene Geschütze ohne Ziele (oder Infanterie mit weitem Weg) ab;
// beladene Fahrzeuge setzen Geschütze dort ab, wo sie im nächsten Zug feuern können,
// und Infanterie direkt auf fremden Städten.
async function aiTransport(game, view, t) {
  if (!t.cargo) {
    const loaded = await aiPickup(game, view, t);
    if (!loaded || !game.units.includes(t)) return;
  }
  if (t.cargo && !game.gameOver) await aiDeliver(game, view, t);
}

function pickupCandidates(game, t) {
  const me = t.owner;
  const enemies = game.visibleEnemies(me);
  const cityGoals = [...game.map.tiles.values()]
    .filter(x => TERRAIN[x.terrain].capturable && x.owner !== me).map(x => hexKey(x.q, x.r));
  const footDist = cityGoals.length ? game.distanceMap(cityGoals, 'foot') : new Map();
  const out = [];
  for (const u of game.units) {
    if (u.owner !== me || u.attacked) continue;
    const s = game.stats(u);
    if (s.towed && !game.attackTargets(u).length) {
      // Geschütze in der eigenen Stadt blockieren die Produktion und haben Vorrang.
      const inCity = TERRAIN[game.tileOf(u).terrain].capturable ? 30 : 0;
      const nearEnemy = enemies.some(e => hexDistance(u.q, u.r, e.q, e.r) <= s.range[1] + 1);
      if (!nearEnemy || inCity) out.push({ u, prio: 100 + inCity });
    } else if (s.transportable && game.canMove(u)) {
      const d = footDist.get(hexKey(u.q, u.r));
      if (d !== undefined && d >= 6) out.push({ u, prio: 20 + d });
    }
  }
  return out;
}

async function aiPickup(game, view, t) {
  const cands = pickupCandidates(game, t);
  if (!cands.length) return false;
  const reach = game.reachable(t);
  let best = null;
  for (const c of cands) {
    for (const [k, info] of reach) {
      if (!info.stop) continue;
      const [q, r] = parseKey(k);
      if (hexDistance(q, r, c.u.q, c.u.r) !== 1) continue;
      const score = c.prio - info.cost * 2;
      if (!best || score > best.score) best = { score, key: k, cargo: c.u };
    }
  }
  if (best) {
    if (view) await sleep(AI_DELAY * 0.4);
    await aiMove(game, view, t, best.key);
    if (game.units.includes(t) && game.canLoad(t, best.cargo)) {
      game.load(t, best.cargo);
      if (view) await view.flashText(t.q, t.r, 'Aufgesessen', '#7fe08a');
      return true;
    }
    return false;
  }
  // Nichts in Reichweite: Richtung des nächsten wartenden Geschützes fahren.
  if (!game.canMove(t)) return false;
  const goals = [];
  for (const c of cands) for (const [q, r] of hexNeighbors(c.u.q, c.u.r)) if (game.tile(q, r)) goals.push(hexKey(q, r));
  await aiDriveToward(game, view, t, goals);
  return false;
}

// Gefahr für ein beladenes Fahrzeug: sichtbare Gegner, die das Feld im nächsten Zug erreichen könnten.
const CARGO_SAFE_DIST = 4;
function cargoDanger(enemies, q, r) {
  let d = 0;
  for (const e of enemies) {
    const dist = hexDistance(q, r, e.q, e.r);
    if (dist <= 1) d += 3;
    else if (dist <= CARGO_SAFE_DIST) d += 1;
  }
  return d;
}

async function aiDeliver(game, view, t) {
  const me = t.owner;
  const cargo = t.cargo;
  const cs = game.stats(cargo);
  const enemies = game.visibleEnemies(me);
  const reach = game.canMove(t) ? game.reachable(t) : new Map([[hexKey(t.q, t.r), { cost: 0, stop: true }]]);
  const cargoType = cs.moveType;
  const foreignCities = [...game.map.tiles.values()].filter(x => TERRAIN[x.terrain].capturable && x.owner !== me);
  const cityDist = cs.capture && foreignCities.length
    ? game.distanceMap(foreignCities.map(x => hexKey(x.q, x.r)), cargoType) : new Map();
  let best = null;
  for (const [k, info] of reach) {
    if (!info.stop) continue;
    const [q, r] = parseKey(k);
    const danger = cargoDanger(enemies, q, r);
    for (const [uq, ur] of hexNeighbors(q, r)) {
      const tile = game.tile(uq, ur);
      const uk = hexKey(uq, ur);
      if (!tile || game.unitAt(uq, ur) || TERRAIN[tile.terrain].cost[cargoType] >= IMPASSABLE) continue;
      const minDist = enemies.reduce((m, e) => Math.min(m, hexDistance(uq, ur, e.q, e.r)), 99);
      let score = -Infinity;
      if (cs.capture && TERRAIN[tile.terrain].capturable && tile.owner !== me) {
        const winning = game.citiesOf(me) === game.totalCities() - 1;
        score = winning ? 1e6 : 500;
      } else if (cs.capture) {
        // Infanterie nahe einer fremden Stadt absetzen, statt sie weiter spazieren zu fahren.
        const d = cityDist.get(uk);
        if (d !== undefined && d <= 3 && minDist >= 2) score = 60 - d * 8;
      } else if (cs.towed) {
        const targets = enemies.filter(e => game.inRange(cargo, uq, ur, e) && game.attackValue(cargo, e, 0) > 0).length;
        if (targets && minDist >= 2) score = 100 + targets * 10 + game.terrainDefense(cargo, uq, ur) * 3;
        else if (minDist >= 3) {
          // Noch kein Ziel in Reichweite: in Stellung gehen, sobald Gegner oder fremde Städte nahe sind.
          const front = Math.min(minDist,
            foreignCities.reduce((m, x) => Math.min(m, hexDistance(uq, ur, x.q, x.r)), 99));
          if (front <= cs.range[1] + 2) score = 70 - front * 3 + game.terrainDefense(cargo, uq, ur) * 3;
        }
      }
      if (score === -Infinity) continue;
      score -= danger * 25 + info.cost;
      if (!best || score > best.score) best = { score, key: k, drop: uk };
    }
  }
  if (best) {
    if (view) await sleep(AI_DELAY * 0.4);
    if (best.key !== hexKey(t.q, t.r)) await aiMove(game, view, t, best.key);
    if (game.units.includes(t) && game.unloadTiles(t).includes(best.drop)) {
      const res = game.unload(t, best.drop);
      if (view && res) {
        await view.flashText(res.unit.q, res.unit.r, 'Abgesetzt', '#ffd650');
        if (res.capture) await view.flashText(res.unit.q, res.unit.r, 'Erobert!', '#ffe08a');
      }
    }
    return;
  }
  if (!game.canMove(t)) return;
  // Kein Absetzpunkt: Richtung Front (sichtbare Gegner bzw. fremde Städte) fahren.
  const goals = enemies.map(e => hexKey(e.q, e.r));
  for (const x of foreignCities) goals.push(hexKey(x.q, x.r));
  await aiDriveToward(game, view, t, goals);
}

// Fährt so nah wie möglich an die Ziele, ohne direkt neben sichtbare Gegner zu geraten.
async function aiDriveToward(game, view, t, goals) {
  if (!goals.length || !game.canMove(t)) return;
  const s = game.stats(t);
  const enemies = game.visibleEnemies(t.owner);
  const dist = game.distanceMap(goals, s.moveType);
  const valueOf = k => {
    const [q, r] = parseKey(k);
    let v = dist.has(k) ? dist.get(k) : 999;
    // Beladen deutlich mehr Abstand halten: mit dem Fahrzeug geht auch die Ladung verloren.
    if (t.cargo) v += cargoDanger(enemies, q, r) * 6;
    else if (enemies.some(e => hexDistance(q, r, e.q, e.r) <= 2)) v += 8;
    if (blocksCity(game, t, game.tile(q, r))) v += 8;
    return v;
  };
  const startKey = hexKey(t.q, t.r);
  let bestKey = startKey, bestVal = valueOf(startKey);
  for (const [k, info] of game.reachable(t)) {
    if (!info.stop) continue;
    const v = valueOf(k);
    if (v < bestVal) { bestVal = v; bestKey = k; }
  }
  if (bestKey === startKey) return;
  if (view) await sleep(AI_DELAY * 0.4);
  await aiMove(game, view, t, bestKey);
}
