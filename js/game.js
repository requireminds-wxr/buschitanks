// Spiellogik ohne DOM-Abhängigkeiten.

const START_ARMY = ['inf', 'inf', 'inf', 'recon', 'tank', 'at', 'art'];

class Game {
  // opts: { nations: [axisKey, alliesKey], ai: [bool, bool], size, seed, rng? }
  constructor(opts) {
    this.rng = opts.rng || Math.random;
    this.fog = opts.fog !== false;
    this.map = generateMap(opts.size, opts.seed);
    this.players = opts.nations.map((nation, i) => ({ nation, ai: !!opts.ai[i], funds: START_FUNDS }));
    this.units = [];
    this.nextId = 1;
    this.turn = 1;
    this.halfTurn = 0;
    this.current = 0;
    this.version = 0;
    this.visCache = [null, null];
    this.explored = [new Set(), new Set()];
    this.gameOver = false;
    this.winner = -1;
    this.endReason = '';
    this.log = [];
    this.onLog = null;
    for (let i = 0; i < 2; i++) this.placeStartArmy(i);
    this.startTurn();
  }

  // ---------- Abfragen ----------

  tile(q, r) { return this.map.tiles.get(hexKey(q, r)); }
  tileOf(u) { return this.tile(u.q, u.r); }
  unitAt(q, r) { return this.units.find(u => u.q === q && u.r === r); }
  stats(u) { return unitStats(this.players[u.owner].nation, u.type); }
  unitCost(player, type) { return unitStats(this.players[player].nation, type).cost; }
  nationOf(player) { return NATIONS[this.players[player].nation]; }

  incomeOf(player) {
    let sum = 0;
    for (const t of this.map.tiles.values()) if (t.owner === player) sum += TERRAIN[t.terrain].income || 0;
    return Math.round(sum * (this.nationOf(player).incomeMul || 1));
  }

  citiesOf(player) {
    let n = 0;
    for (const t of this.map.tiles.values()) if (t.owner === player) n++;
    return n;
  }

  productionTiles(player) {
    const out = [];
    for (const t of this.map.tiles.values()) {
      if (t.owner === player && TERRAIN[t.terrain].capturable && !this.unitAt(t.q, t.r)) out.push(t);
    }
    return out;
  }

  // Bodeneinheiten müssen anhalten, wenn sie neben eine feindliche Bodeneinheit ziehen.
  // knownOnly: nur Gegner berücksichtigen, die der Spieler sieht (für die Zugplanung).
  inEnemyZoc(q, r, player, knownOnly) {
    for (const [nq, nr] of hexNeighbors(q, r)) {
      const e = this.unitAt(nq, nr);
      if (e && e.owner !== player && !this.stats(e).isAir && (!knownOnly || this.canSee(player, e))) return true;
    }
    return false;
  }

  // ---------- Aufklärung ----------

  // Felder, die ein Spieler gerade einsehen kann (gecacht bis zur nächsten Zustandsänderung).
  visibleTiles(player) {
    const cached = this.visCache[player];
    if (cached && cached.version === this.version) return cached.vis;
    const vis = new Set();
    const add = (q, r, range) => {
      for (let dq = -range; dq <= range; dq++) {
        for (let dr = Math.max(-range, -dq - range); dr <= Math.min(range, -dq + range); dr++) {
          const k = hexKey(q + dq, r + dr);
          if (this.map.tiles.has(k)) vis.add(k);
        }
      }
    };
    if (!this.fog) {
      for (const k of this.map.tiles.keys()) vis.add(k);
    } else {
      for (const u of this.units) {
        if (u.owner !== player) continue;
        const s = this.stats(u);
        const bonus = s.isAir ? 0 : (TERRAIN[this.tileOf(u).terrain].vision || 0);
        add(u.q, u.r, s.vision + bonus);
      }
      for (const t of this.map.tiles.values()) if (t.owner === player) add(t.q, t.r, 1);
    }
    for (const k of vis) this.explored[player].add(k);
    this.visCache[player] = { version: this.version, vis };
    return vis;
  }

  canSee(player, e) {
    if (!this.fog || e.owner === player) return true;
    if (e.revealUntil >= this.halfTurn) return true;
    if (!this.visibleTiles(player).has(hexKey(e.q, e.r))) return false;
    if (this.stats(e).isAir || !TERRAIN[this.tileOf(e).terrain].conceals) return true;
    // Im Wald nur aus nächster Nähe oder von Aufklärern zu erkennen.
    return this.units.some(u => {
      if (u.owner !== player) return false;
      const d = hexDistance(u.q, u.r, e.q, e.r);
      const s = this.stats(u);
      return d <= 1 || (s.spotter && d <= s.vision);
    });
  }

  visibleEnemies(player) {
    return this.units.filter(e => e.owner !== player && this.canSee(player, e));
  }

  canMove(u) { return !u.moved && !u.attacked; }

  canAttackNow(u) {
    if (u.attacked) return false;
    return !(this.stats(u).noMoveAndFire && u.moved);
  }

  // Erreichbare Felder: Map key -> { cost, prev, stop }
  reachable(u) {
    const s = this.stats(u);
    const startKey = hexKey(u.q, u.r);
    const res = new Map([[startKey, { cost: 0, prev: null, stop: true }]]);
    if (!this.canMove(u)) return res;
    const open = [{ k: startKey, q: u.q, r: u.r, c: 0 }];
    while (open.length) {
      open.sort((a, b) => a.c - b.c);
      const cur = open.shift();
      if (cur.c > res.get(cur.k).cost) continue;
      if (cur.k !== startKey && !s.isAir && this.inEnemyZoc(cur.q, cur.r, u.owner, true)) continue;
      for (const [nq, nr] of hexNeighbors(cur.q, cur.r)) {
        const t = this.tile(nq, nr);
        if (!t) continue;
        const tc = TERRAIN[t.terrain].cost[s.moveType];
        if (tc >= IMPASSABLE) continue;
        // Unentdeckte Gegner sind für die Planung unsichtbar (Hinterhalt beim Ausführen).
        const occ = this.unitAt(nq, nr);
        if (occ && occ.owner !== u.owner && this.canSee(u.owner, occ)) continue;
        const friend = occ && occ.owner === u.owner;
        const nc = cur.c + tc;
        if (nc > s.move) continue;
        const nk = hexKey(nq, nr);
        const ex = res.get(nk);
        if (!ex || nc < ex.cost) {
          res.set(nk, { cost: nc, prev: cur.k, stop: !friend });
          open.push({ k: nk, q: nq, r: nr, c: nc });
        }
      }
    }
    return res;
  }

  pathTo(reach, destKey) {
    const path = [];
    let k = destKey;
    while (k) { path.unshift(k); k = reach.get(k).prev; }
    return path;
  }

  inRange(u, fromQ, fromR, target) {
    const range = this.stats(u).range;
    const d = hexDistance(fromQ, fromR, target.q, target.r);
    return d >= range[0] && d <= range[1];
  }

  attackValue(att, def) {
    const a = this.stats(att), d = this.stats(def);
    if (d.isAir) return a.air;
    return a.soft * (1 - d.armor) + a.hard * d.armor;
  }

  targetsFrom(u, q, r) {
    return this.units.filter(e => e.owner !== u.owner && this.inRange(u, q, r, e) && this.attackValue(u, e) > 0 && this.canSee(u.owner, e));
  }

  attackTargets(u) {
    if (!this.canAttackNow(u)) return [];
    return this.targetsFrom(u, u.q, u.r);
  }

  terrainDefense(u, q, r) {
    const s = this.stats(u);
    if (s.isAir) return 0;
    const t = TERRAIN[this.tile(q, r).terrain];
    return s.armor >= 1 ? Math.floor(t.def / 2) : t.def;
  }

  // Durchschnittsschaden von att gegen def; defPos erlaubt hypothetische Stellungen.
  baseDamage(att, def, attHp, defPos) {
    const a = this.attackValue(att, def);
    if (a <= 0) return 0;
    const [q, r] = defPos || [def.q, def.r];
    const defense = this.stats(def).def + this.terrainDefense(def, q, r);
    return a * (attHp / 10) * 1.2 / (1 + defense * 0.12);
  }

  canCounter(def, att, dist) {
    const s = this.stats(def);
    return !s.noCounter && dist >= s.range[0] && dist <= s.range[1] && this.attackValue(def, att) > 0;
  }

  // Kampfprognose für die Anzeige und die KI.
  forecast(att, def, fromPos) {
    const [fq, fr] = fromPos || [att.q, att.r];
    const base = this.baseDamage(att, def, att.hp);
    const roundDmg = x => (base > 0 ? Math.max(1, Math.round(x)) : 0);
    const min = roundDmg(base * 0.85), max = roundDmg(base * 1.15), avg = roundDmg(base);
    const defHpAfter = Math.max(0, def.hp - avg);
    let cmin = 0, cmax = 0, cavg = 0;
    const dist = hexDistance(fq, fr, def.q, def.r);
    if (defHpAfter > 0 && this.canCounter(def, att, dist)) {
      const cb = this.baseDamage(def, att, defHpAfter, [fq, fr]);
      const rc = x => (cb > 0 ? Math.max(1, Math.round(x)) : 0);
      cmin = rc(cb * 0.85); cmax = rc(cb * 1.15); cavg = rc(cb);
    }
    return { min, max, avg, cmin, cmax, cavg, kill: min >= def.hp, mayKill: max >= def.hp };
  }

  rollDamage(att, def, attHp, defPos) {
    const base = this.baseDamage(att, def, attHp, defPos);
    if (base <= 0) return 0;
    return Math.max(1, Math.round(base * (0.85 + this.rng() * 0.3)));
  }

  // ---------- Aktionen ----------

  // Führt einen Zug Feld für Feld aus. Stößt die Einheit auf einen unentdeckten Gegner
  // (Hinterhalt) oder in dessen Kontrollzone, bleibt sie stehen.
  // Rückgabe: { path, ambush, capture } oder null bei ungültigem Ziel.
  moveUnit(u, destKey) {
    const reach = this.reachable(u);
    const info = reach.get(destKey);
    if (!info || !info.stop) return null;
    const planned = this.pathTo(reach, destKey);
    const isAir = this.stats(u).isAir;
    let stand = 0;
    let ambush = null;
    let stopped = false;
    for (let i = 1; i < planned.length; i++) {
      const [q, r] = parseKey(planned[i]);
      const occ = this.unitAt(q, r);
      if (occ && occ.owner !== u.owner) { ambush = occ; break; }
      if (!occ) stand = i;
      if (!isAir && i < planned.length - 1 && this.inEnemyZoc(q, r, u.owner, false)) { stopped = true; break; }
    }
    const path = planned.slice(0, stand + 1);
    if (stand > 0 || ambush) u.moved = true;
    if (stand > 0) {
      [u.q, u.r] = parseKey(planned[stand]);
      this.version++;
    }
    if (ambush) {
      ambush.revealUntil = Math.max(ambush.revealUntil || 0, this.halfTurn);
      this.addLog(`Hinterhalt! ${this.stats(u).name} stößt auf ${this.stats(ambush).name}.`, u.owner);
    } else if (stopped) {
      this.addLog(`Hinterhalt! ${this.stats(u).name} trifft auf versteckten Feind und hält an.`, u.owner);
    }
    return { path, ambush, stopped, capture: this.tryCapture(u) };
  }

  tryCapture(u) {
    const t = this.tileOf(u);
    if (!this.stats(u).capture || !TERRAIN[t.terrain].capturable || t.owner === u.owner) return null;
    const prev = t.owner;
    t.owner = u.owner;
    this.version++;
    const what = t.terrain === 'hq' ? 'das feindliche Hauptquartier' : 'eine Stadt';
    this.addLog(`${this.stats(u).name} erobert ${what}.`, u.owner);
    this.checkWinner();
    return { tile: t, prevOwner: prev };
  }

  attack(att, def) {
    const as = this.stats(att), ds = this.stats(def);
    const dist = hexDistance(att.q, att.r, def.q, def.r);
    const dmg = this.rollDamage(att, def, att.hp);
    def.hp = Math.max(0, def.hp - dmg);
    let counter = 0;
    if (def.hp > 0 && this.canCounter(def, att, dist)) {
      counter = this.rollDamage(def, att, def.hp, [def.q, def.r]);
      att.hp = Math.max(0, att.hp - counter);
    }
    att.attacked = true;
    att.moved = true;
    // Wer feuert, verrät seine Stellung bis zum Ende des gegnerischen Zuges.
    att.revealUntil = this.halfTurn + 1;
    let msg = `${as.name} greift ${ds.name} an: −${dmg}`;
    if (counter) msg += `, Gegenschlag −${counter}`;
    if (def.hp <= 0) msg += `. ${ds.name} vernichtet!`;
    if (att.hp <= 0) msg += `. ${as.name} vernichtet!`;
    this.addLog(msg, att.owner);
    const defKilled = def.hp <= 0, attKilled = att.hp <= 0;
    if (defKilled) this.removeUnit(def);
    if (attKilled) this.removeUnit(att);
    this.checkWinner();
    return { dmg, counter, defKilled, attKilled };
  }

  removeUnit(u) {
    const i = this.units.indexOf(u);
    if (i >= 0) this.units.splice(i, 1);
    this.version++;
  }

  buy(type, tile) {
    const p = this.players[this.current];
    const cost = this.unitCost(this.current, type);
    if (tile.owner !== this.current || !TERRAIN[tile.terrain].capturable) return null;
    if (this.unitAt(tile.q, tile.r) || p.funds < cost) return null;
    p.funds -= cost;
    const u = this.spawn(type, this.current, tile.q, tile.r);
    u.moved = true;
    u.attacked = true;
    this.addLog(`${this.stats(u).name} ausgehoben (−${cost}).`, this.current);
    return u;
  }

  spawn(type, owner, q, r) {
    const u = { id: this.nextId++, type, owner, q, r, hp: 10, moved: false, attacked: false };
    this.units.push(u);
    this.version++;
    return u;
  }

  endTurn() {
    if (this.gameOver) return;
    this.current = 1 - this.current;
    this.halfTurn++;
    this.version++;
    if (this.current === 0) this.turn++;
    if (this.turn > MAX_TURNS) { this.decideByPoints(); return; }
    this.startTurn();
  }

  startTurn() {
    const p = this.players[this.current];
    const income = this.incomeOf(this.current);
    p.funds += income;
    for (const u of this.units) {
      if (u.owner !== this.current) continue;
      u.moved = false;
      u.attacked = false;
      const t = this.tileOf(u);
      if (t.owner === this.current && TERRAIN[t.terrain].capturable && u.hp < 10) {
        u.hp = Math.min(10, u.hp + HEAL_PER_TURN);
      }
    }
    this.addLog(`Runde ${this.turn}: ${this.nationOf(this.current).short} ist am Zug (+${income} Nachschub).`, this.current);
  }

  checkWinner() {
    if (this.gameOver) return;
    for (let i = 0; i < 2; i++) {
      if (this.map.tiles.get(this.map.hq[i]).owner !== i) {
        return this.finish(1 - i, `Das Hauptquartier von ${this.nationOf(i).short} wurde erobert.`);
      }
    }
    for (let i = 0; i < 2; i++) {
      if (!this.units.some(u => u.owner === i)) {
        return this.finish(1 - i, `Die Streitkräfte von ${this.nationOf(i).short} wurden vernichtet.`);
      }
    }
  }

  decideByPoints() {
    this.turn = MAX_TURNS;
    const score = i => this.citiesOf(i) * 1000 + this.units.filter(u => u.owner === i)
      .reduce((s, u) => s + this.stats(u).cost * u.hp / 10, 0);
    const s0 = score(0), s1 = score(1);
    const reason = `Rundenlimit erreicht – entschieden nach Städten und Truppenstärke.`;
    this.finish(s0 === s1 ? -1 : (s0 > s1 ? 0 : 1), reason);
  }

  finish(winner, reason) {
    this.gameOver = true;
    this.winner = winner;
    this.endReason = reason;
    this.addLog(winner >= 0 ? `Sieg für ${this.nationOf(winner).short}! ${reason}` : `Unentschieden. ${reason}`, winner >= 0 ? winner : -1);
  }

  addLog(text, player) {
    this.log.push({ text, player, turn: this.turn });
    if (this.log.length > 200) this.log.shift();
    if (this.onLog) this.onLog();
  }

  // ---------- Aufbau ----------

  placeStartArmy(player) {
    const hq = this.map.tiles.get(this.map.hq[player]);
    const nearby = [...this.map.tiles.values()]
      .filter(t => !TERRAIN[t.terrain].capturable)
      .sort((a, b) => hexDistance(a.q, a.r, hq.q, hq.r) - hexDistance(b.q, b.r, hq.q, hq.r) || a.row - b.row || a.col - b.col);
    for (const type of START_ARMY) {
      const mt = UNIT_TYPES[type].moveType;
      const spot = nearby.find(t => TERRAIN[t.terrain].cost[mt] < IMPASSABLE && !this.unitAt(t.q, t.r));
      if (spot) this.spawn(type, player, spot.q, spot.r);
    }
  }

  // Bewegungskosten-Entfernung zu Zielfeldern (ohne Einheiten), für die KI.
  distanceMap(goalKeys, moveType) {
    const dist = new Map();
    const open = [];
    for (const k of goalKeys) { dist.set(k, 0); open.push({ k, c: 0 }); }
    while (open.length) {
      open.sort((a, b) => a.c - b.c);
      const cur = open.shift();
      if (cur.c > dist.get(cur.k)) continue;
      const [q, r] = parseKey(cur.k);
      const enterCost = Math.min(TERRAIN[this.tile(q, r).terrain].cost[moveType], cur.c === 0 ? 1 : IMPASSABLE);
      if (enterCost >= IMPASSABLE) continue;
      for (const [nq, nr] of hexNeighbors(q, r)) {
        const t = this.tile(nq, nr);
        if (!t || TERRAIN[t.terrain].cost[moveType] >= IMPASSABLE) continue;
        const nk = hexKey(nq, nr);
        const nc = cur.c + enterCost;
        if (!dist.has(nk) || nc < dist.get(nk)) { dist.set(nk, nc); open.push({ k: nk, c: nc }); }
      }
    }
    return dist;
  }
}
