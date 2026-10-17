// Einfache, gierige KI: greift an, wenn es sich lohnt, erobert Städte, rückt sonst vor.

const AI_DELAY = 260;
const AI_UNIT_ORDER = { recon: 0, art: 1, hflak: 1, air: 2, heavy: 3, tank: 3, lflak: 4, at: 5, inf: 6 };

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function aiTakeTurn(game, view) {
  const me = game.current;
  const units = game.units.filter(u => u.owner === me)
    .sort((a, b) => AI_UNIT_ORDER[a.type] - AI_UNIT_ORDER[b.type]);
  for (const u of units) {
    if (game.gameOver) break;
    if (!game.units.includes(u)) continue;
    await aiActUnit(game, view, u);
  }
  if (!game.gameOver) {
    aiBuy(game);
    if (view) await sleep(AI_DELAY);
  }
  if (!game.gameOver) game.endTurn();
}

function unitWorth(game, u) { return game.stats(u).cost; }

function scoreAttack(game, u, target, fromQ, fromR) {
  const f = game.forecast(u, target, [fromQ, fromR]);
  if (f.avg <= 0) return -Infinity;
  const dealt = Math.min(f.avg, target.hp) / 10 * unitWorth(game, target);
  const kill = f.avg >= target.hp ? unitWorth(game, target) * 0.4 : 0;
  const lost = Math.min(f.cavg, u.hp) / 10 * unitWorth(game, u);
  const t = game.tileOf(target);
  // Eindringlinge in eigenen Städten haben Vorrang.
  const threat = TERRAIN[t.terrain].capturable && t.owner === u.owner ? 150 : 0;
  return dealt + kill - lost * 0.9 + threat + game.terrainDefense(u, fromQ, fromR) * 6;
}

function bestAttackFrom(game, u, q, r) {
  let best = null;
  for (const e of game.targetsFrom(u, q, r)) {
    const score = scoreAttack(game, u, e, q, r);
    if (!best || score > best.score) best = { score, target: e };
  }
  return best;
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
  if (view) await view.showAttackResult(u, target, res);
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
      const score = t.terrain === 'hq' ? 1e6 : 260 + (t.owner >= 0 ? 140 : 0);
      if (!best || score > best.score) best = { score, dest: k, target: null };
    }
    if (s.noMoveAndFire && k !== startKey) continue;
    const atk = bestAttackFrom(game, u, q, r);
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
    if (s.noMoveAndFire || s.type === 'at' || s.type === 'lflak') {
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

function aiBuy(game) {
  const me = game.current;
  const p = game.players[me];
  const enemies = game.visibleEnemies(me);
  const mine = game.units.filter(u => u.owner === me);
  const count = (list, pred) => list.filter(pred).length;
  const enemyArmor = count(enemies, u => game.stats(u).armor >= 1);
  const enemyAir = count(enemies, u => game.stats(u).isAir);
  const spots = game.productionTiles(me).sort((a, b) => (b.terrain === 'hq') - (a.terrain === 'hq'));

  for (const tile of spots) {
    const myInf = count(mine, u => u.type === 'inf');
    const myArt = count(mine, u => u.type === 'art');
    const myAa = count(mine, u => u.type === 'lflak' || u.type === 'hflak');
    const myRecon = count(mine, u => u.type === 'recon');
    const weights = {
      inf: 2 + (myInf < 4 ? 4 : 0),
      recon: myRecon < 2 ? 2.5 : 0.5,
      tank: 3,
      heavy: p.funds >= 900 ? 3 : 1,
      at: 1 + enemyArmor * 0.6,
      art: myArt < 3 ? 2 : 0.5,
      lflak: Math.max(0.5, enemyAir * 1.5 - myAa),
      hflak: Math.max(0.5, enemyAir * 1.5 + enemyArmor * 0.5 - myAa),
      air: 1.5,
    };
    const options = UNIT_ORDER.filter(t => game.unitCost(me, t) <= p.funds && weights[t] > 0);
    if (!options.length) break;
    const total = options.reduce((s, t) => s + weights[t], 0);
    let roll = game.rng() * total;
    let pick = options[0];
    for (const t of options) { roll -= weights[t]; if (roll <= 0) { pick = t; break; } }
    const u = game.buy(pick, tile);
    if (u) mine.push(u);
  }
}
