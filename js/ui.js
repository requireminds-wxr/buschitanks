// Bedienung: Eingabe, Seitenleiste, Dialoge und Zugablauf.

const $ = id => document.getElementById(id);

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function rangeText(type) {
  const [a, b] = UNIT_TYPES[type].range;
  return a === b ? `${a}` : `${a}–${b}`;
}

function listText(items) {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]}` : items.join('');
}

function unitIconCanvas(nationKey, type, w = 52, h = 40) {
  const c = document.createElement('canvas');
  c.width = w * 2; c.height = h * 2;
  c.style.width = w + 'px'; c.style.height = h + 'px';
  const ctx = c.getContext('2d');
  ctx.scale(2, 2);
  const draw = () => { ctx.clearRect(0, 0, w, h); drawCounter(ctx, nationKey, type, 1, 1, w - 2, h - 2); };
  draw();
  // Grafik noch nicht geladen: nachzeichnen, sobald sie da ist.
  const sp = loadSprite(`${nationKey}.${type}`);
  if (sp && !unitSprite(nationKey, type))
    [sp.base, sp.barrel].filter(Boolean).forEach(i => i.addEventListener('load', () => { if (unitSprite(nationKey, type)) draw(); }));
  return c;
}

class Controller {
  constructor() {
    this.view = new View($('map'));
    this.game = null;
    this.selected = null;
    this.buyTile = null;
    this.hoverTile = null;
    this.busy = false;
    this.setup = { nations: ['de', 'su'], ai: [false, true], size: 'medium', seed: this.randomSeed(), fog: true };
    this.flags = {};
    for (const k of Object.keys(NATIONS)) this.flags[k] = flagDataUrl(k);
    this.bindEvents();
    this.showStartScreen();
  }

  randomSeed() { return Math.floor(Math.random() * 1e6); }

  bindEvents() {
    const cv = $('map');
    cv.addEventListener('click', e => this.onClick(e));
    cv.addEventListener('mousemove', e => this.onHover(e));
    cv.addEventListener('mouseleave', () => { this.hoverTile = null; this.updateHover(null); });
    cv.addEventListener('contextmenu', e => { e.preventDefault(); this.deselect(); });
    $('endTurnBtn').addEventListener('click', () => this.endTurn());
    $('nextUnitBtn').addEventListener('click', () => this.selectNextUnit());
    $('menuBtn').addEventListener('click', () => this.showStartScreen(true));
    window.addEventListener('keydown', e => {
      if (!$('overlay').classList.contains('hidden')) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === 'e' || e.key === 'E') this.endTurn();
      else if (e.key === 'n' || e.key === 'N') this.selectNextUnit();
      else if (e.key === 'Escape') this.deselect();
      else if (e.key === 'u' || e.key === 'U') this.toggleUnload();
    });
  }

  get humanTurn() {
    return this.game && !this.game.gameOver && !this.game.players[this.game.current].ai && !this.busy;
  }

  // ---------- Spielstart ----------

  showStartScreen(cancellable) {
    const noAir = listText(UNIT_ORDER.filter(t => !UNIT_TYPES[t].air).map(t => UNIT_TYPES[t].label));
    const noAirText = noAir ? `${noAir} können keine Flugzeuge angreifen. ` : '';
    const st = this.setup;
    const nationCards = (list, side) => list.map(k => `
      <button class="nation-card ${st.nations[side] === k ? 'sel' : ''}" data-side="${side}" data-nation="${k}">
        <img src="${this.flags[k]}" alt="">
        <div><div class="nm">${esc(NATIONS[k].name)}</div><div class="bn">${esc(NATIONS[k].bonus)}</div></div>
      </button>`).join('');
    const ctrl = side => `
      <div class="ctrl">
        <button data-ctrl="${side}" data-ai="0" class="${!st.ai[side] ? 'sel' : ''}">Mensch</button>
        <button data-ctrl="${side}" data-ai="1" class="${st.ai[side] ? 'sel' : ''}">Computer</button>
      </div>`;
    this.openDialog(`
      <h1>Hexfront <span>39–45</span></h1>
      <p class="tag">Rundenbasierte Hex-Strategie im Zweiten Weltkrieg</p>
      <div class="sides">
        <div><h2>Achsenmächte</h2><div class="nation-list">${nationCards(AXIS, 0)}</div>${ctrl(0)}</div>
        <div class="vs">VS</div>
        <div><h2>Alliierte</h2><div class="nation-list">${nationCards(ALLIES, 1)}</div>${ctrl(1)}</div>
      </div>
      <div class="opts">
        <label>Kartengröße
          <select id="sizeSel">${Object.entries(MAP_SIZES).map(([k, v]) => `<option value="${k}" ${k === st.size ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
        </label>
        <label>Karten-Seed
          <input id="seedInput" type="number" value="${st.seed}">
        </label>
        <button class="btn ghost" id="seedBtn" type="button">Neue Karte würfeln</button>
        <label class="check"><input id="fogInput" type="checkbox" ${st.fog ? 'checked' : ''}> Nebel des Krieges</label>
        <span style="flex:1"></span>
        ${cancellable && this.game ? '<button class="btn ghost" id="cancelBtn" type="button">Zurück zum Spiel</button>' : ''}
        <button class="btn big" id="startBtn" type="button">Feldzug beginnen</button>
      </div>
      <details>
        <summary>Spielregeln</summary>
        <ul>
          <li><b>Ziel:</b> Erobere alle Städte – einschließlich beider Hauptquartiere. Wer sie alle hält, gewinnt sofort. Ein verlorenes HQ ist noch keine Niederlage, kann aber zurückerobert werden. Nach ${MAX_TURNS} Runden entscheiden Städte und Truppenstärke.</li>
          <li><b>Ablauf:</b> Einheit anklicken → blaues Feld wählen, um zu ziehen → rot markiertes Ziel anklicken, um anzugreifen. Angreifen ist auch ohne Bewegung möglich, danach ist die Einheit fertig.</li>
          <li><b>Schwere Fernkampfeinheiten</b> (Artillerie, schwere Flak) schießen auf ${rangeText('art')} Felder, aber nicht im Zug, in dem sie abgesetzt wurden. Artillerie wird nicht erwidert und erwidert selbst nicht. Sie braucht Aufklärung, denn sie sieht selbst nur ${UNIT_TYPES.art.vision} Feld weit.</li>
          <li><b>Bewegung kostet Kraft:</b> Wer vor dem Angriff zieht, verliert ${Math.round(MOVE_ATTACK_PENALTY * 100)} % Angriffskraft je gezogenem Feld (3 Felder = −30 %). Die Prognose beim Zielen zeigt den Abzug an.</li>
          <li><b>Gegenschlag:</b> Überlebt das Ziel einen Nahkampfangriff, schlägt es mit seiner verbleibenden Stärke zurück.</li>
          <li><b>Gelände:</b> Wald, Hügel, Städte und Gebirge geben Deckung (Panzer nur halbe Deckung). Fahrzeuge kommen nicht ins Gebirge. Sümpfe sind nur für Infanterie passierbar.</li>
          <li><b>Aufklärung:</b> Du siehst nur, was deine Einheiten und Städte aufklären (Sichtweite je Typ, auf Hügeln und im Gebirge +1). Gegner in nicht aufgeklärten Feldern sind unsichtbar und können nicht angegriffen werden. Im Wald erkennt man Gegner nur aus direkter Nachbarschaft oder mit Aufklärern und Flugzeugen. Wer feuert, verrät seine Stellung für eine Runde.</li>
          <li><b>Hinterhalt:</b> Stößt eine Einheit unterwegs auf einen unentdeckten Gegner, bleibt sie sofort stehen und verliert ihre restliche Bewegung. Angreifen darf sie danach noch, ist aber überrascht: −60 % Angriffskraft (auch beim Gegenschlag) bis zum Ende des gegnerischen Zuges.</li>
          <li><b>Flak:</b> Leichte Flak (2–4 cm) wirkt auf ${rangeText('lflak')} Felder, stark gegen Flugzeuge und weiche Ziele. Schwere Flak (7,5–9 cm, z. B. 8,8 cm) wirkt auf ${rangeText('hflak')} Felder, stark gegen Flugzeuge und Panzer.</li>
          <li><b>Gezogene Geschütze und Transport:</b> Artillerie und Flak sind gezogen (Ausnahme: der US-Flakpanzer M16 fährt selbst) und bewegen sich nur mit einem LKW oder Halbkettenfahrzeug. Auch Infanterie kann mitfahren. Ein Fahrzeug lädt genau eine Einheit: daneben fahren, dann Fahrzeug und Einheit nacheinander anklicken. Zum Absetzen nach der Fahrt ein gelbes Nachbarfeld anklicken (oder vorher <kbd>U</kbd>). Abgesetzte Einheiten handeln erst im nächsten Zug, Infanterie erobert eine Stadt aber sofort. Wird ein beladenes Fahrzeug vernichtet, ist auch die Ladung verloren. Der LKW ist abseits der Straßen langsam, die Halbkette geländegängig.</li>
          <li><b>Straßen:</b> Auf Straßen kostet jedes Feld nur 1 Bewegungspunkt. Abseits bremst das Gelände: Radfahrzeuge zahlen auf Ebene 2, in Wald und Hügeln 3; Ketten auf Ebene 1, in Wald und Hügeln 2.</li>
          <li><b>Luftabwehr:</b> ${noAirText}Bodeneinheiten außer Flak haben gegen Flugzeuge nur ${Math.round(GROUND_VS_AIR_MUL * 100)} % Angriffskraft.</li>
          <li><b>Beweglichkeit:</b> ${UNIT_ORDER.filter(t => !UNIT_TYPES[t].towed).map(t => `${UNIT_TYPES[t].label} ${UNIT_TYPES[t].move}`).join(', ')} Punkte (einzelne Nationen abweichend). Flugzeuge fliegen unabhängig vom Gelände. Die Werte stehen in <code>config/einheiten.js</code>.</li>
          <li><b>Kontrollzone:</b> Bodeneinheiten müssen anhalten, sobald sie neben eine feindliche Bodeneinheit ziehen. Flugzeuge ignorieren das.</li>
          <li><b>Städte:</b> Nur Infanterie kann Städte erobern (einfach daraufziehen). Jede Stadt bringt Nachschub, im eigenen HQ und in eigenen Städten können neue Einheiten ausgehoben werden. Beschädigte Einheiten, die ihren Zug in einer eigenen Stadt oder im eigenen HQ beginnen, werden kostenlos um ${HEAL_PER_TURN} Stärkepunkte repariert.</li>
          <li><b>Tasten:</b> E = Zug beenden, N = nächste Einheit, U = Ladung absetzen, Esc / Rechtsklick = Auswahl aufheben.</li>
        </ul>
      </details>`);

    const dlg = $('overlayContent');
    dlg.querySelectorAll('.nation-card').forEach(b => b.addEventListener('click', () => {
      st.nations[Number(b.dataset.side)] = b.dataset.nation;
      this.showStartScreen(cancellable);
    }));
    dlg.querySelectorAll('[data-ctrl]').forEach(b => b.addEventListener('click', () => {
      st.ai[Number(b.dataset.ctrl)] = b.dataset.ai === '1';
      this.showStartScreen(cancellable);
    }));
    $('sizeSel').addEventListener('change', e => { st.size = e.target.value; });
    $('seedInput').addEventListener('change', e => { st.seed = Number(e.target.value) || 0; });
    $('fogInput').addEventListener('change', e => { st.fog = e.target.checked; });
    $('seedBtn').addEventListener('click', () => { st.seed = this.randomSeed(); $('seedInput').value = st.seed; });
    if ($('cancelBtn')) $('cancelBtn').addEventListener('click', () => this.closeDialog());
    $('startBtn').addEventListener('click', () => {
      st.seed = Number($('seedInput').value) || 0;
      this.closeDialog();
      this.startGame();
    });
  }

  startGame() {
    const st = this.setup;
    this.gameToken = {};
    this.busy = false;
    this.game = new Game({ nations: [...st.nations], ai: [...st.ai], size: st.size, seed: st.seed, fog: st.fog });
    this.game.onLog = () => this.renderLog();
    this.selected = null;
    this.buyTile = null;
    this.view.setGame(this.game);
    this.renderLog();
    this.beginTurn();
  }

  openDialog(html, small, opaque) {
    $('overlay').classList.toggle('opaque', !!opaque);
    $('overlayContent').className = 'dialog' + (small ? ' small' : '');
    $('overlayContent').innerHTML = html;
    $('overlay').classList.remove('hidden');
  }

  closeDialog() { $('overlay').classList.add('hidden'); }

  // ---------- Zugablauf ----------

  // Aus wessen Sicht der Nebel gezeichnet wird.
  updateViewer() {
    const g = this.game;
    const humans = [0, 1].filter(i => !g.players[i].ai);
    this.view.viewer = g.gameOver ? -1 : humans.length === 1 ? humans[0] : humans.length === 2 ? g.current : -1;
  }

  // Einheit an der Position, sofern der Betrachter sie sieht.
  visibleUnitAt(q, r) {
    const u = this.game.unitAt(q, r);
    if (!u || this.view.viewer < 0 || this.game.canSee(this.view.viewer, u)) return u || null;
    return null;
  }

  beginTurn() {
    const g = this.game;
    this.updateViewer();
    this.deselect();
    this.refresh();
    if (g.gameOver) { this.showGameOver(); return; }
    const p = g.players[g.current];
    if (p.ai) {
      this.runAi();
    } else if (g.players.every(pl => !pl.ai)) {
      const n = g.nationOf(g.current);
      this.openDialog(`
        <div class="center">
          <img src="${this.flags[p.nation]}" alt="">
          <h2>${esc(n.name)} ist am Zug</h2>
          <p class="tag">Runde ${g.turn} · Nachschub: ${p.funds}</p>
          <button class="btn big" id="readyBtn">Bereit</button>
        </div>`, true, true);
      $('readyBtn').addEventListener('click', () => this.closeDialog());
    }
  }

  async runAi() {
    const g = this.game, token = this.gameToken;
    this.busy = true;
    this.refresh();
    const n = g.nationOf(g.current);
    $('aiBanner').innerHTML = `<img src="${this.flags[g.players[g.current].nation]}" alt=""> ${esc(n.short)} plant den Angriff …`;
    $('aiBanner').classList.remove('hidden');
    await sleep(400);
    if (token !== this.gameToken) return;
    await aiTakeTurn(g, this.view);
    if (token !== this.gameToken) return;
    $('aiBanner').classList.add('hidden');
    this.busy = false;
    this.beginTurn();
  }

  endTurn() {
    if (!this.humanTurn) return;
    this.game.endTurn();
    this.beginTurn();
  }

  showGameOver() {
    const g = this.game;
    this.updateViewer();
    const w = g.winner;
    const title = w >= 0 ? `Sieg für ${esc(g.nationOf(w).name)}!` : 'Unentschieden';
    const flag = w >= 0 ? `<img src="${this.flags[g.players[w].nation]}" alt="">` : '';
    const line = i => `${esc(g.nationOf(i).short)}: ${g.citiesOf(i)} Städte, ${g.units.filter(u => u.owner === i).length} Einheiten`;
    this.openDialog(`
      <div class="center">
        ${flag}
        <h1>${title}</h1>
        <p class="tag">${esc(g.endReason)}</p>
        <div class="result-stats"><div>${line(0)}</div><div>${line(1)}</div></div>
        <button class="btn ghost" id="viewMapBtn">Karte ansehen</button>
        <button class="btn big" id="againBtn">Neues Spiel</button>
      </div>`, true);
    $('againBtn').addEventListener('click', () => this.showStartScreen());
    $('viewMapBtn').addEventListener('click', () => this.closeDialog());
  }

  // ---------- Eingabe ----------

  eventTile(e) {
    const r = $('map').getBoundingClientRect();
    return this.view.pick(e.clientX - r.left, e.clientY - r.top);
  }

  async onClick(e) {
    if (!this.humanTurn) return;
    const g = this.game;
    const t = this.eventTile(e);
    if (!t) { this.deselect(); return; }
    const unit = this.visibleUnitAt(t.q, t.r);
    const sel = this.selected;

    if (sel) {
      if (unit && unit.owner !== g.current && g.attackTargets(sel).includes(unit)) {
        await this.doAttack(sel, unit);
        return;
      }
      // Aufladen: Transporter und Ladung in beliebiger Reihenfolge anklicken.
      if (unit && unit.owner === g.current && unit !== sel) {
        if (g.canLoad(sel, unit)) { await this.doLoad(sel, unit); return; }
        if (g.canLoad(unit, sel)) { await this.doLoad(unit, sel); return; }
      }
      if (!unit && this.view.overlay.unloads.includes(hexKey(t.q, t.r))) {
        await this.doUnload(sel, hexKey(t.q, t.r));
        return;
      }
      const reach = g.reachable(sel);
      const info = reach.get(hexKey(t.q, t.r));
      if (!unit && info && info.stop && g.canMove(sel)) {
        await this.doMove(sel, hexKey(t.q, t.r));
        return;
      }
      if (unit === sel) { this.deselect(); return; }
    }

    if (unit && unit.owner === g.current) { this.select(unit); return; }
    if (!unit && !g.unitAt(t.q, t.r) && t.owner === g.current && TERRAIN[t.terrain].capturable) { this.openBuy(t); return; }
    this.deselect();
    if (unit) this.renderInfo(unit);
  }

  async doMove(u, destKey) {
    const g = this.game;
    this.busy = true;
    this.view.overlay.reach = null;
    this.view.overlay.path = null;
    this.view.overlay.targets = [];
    const res = g.moveUnit(u, destKey);
    if (res) {
      await this.view.animateMove(u, res.path);
      if (res.ambush) await this.view.flashText(res.ambush.q, res.ambush.r, 'Hinterhalt!', '#ff9b6a');
      else if (res.stopped) await this.view.flashText(u.q, u.r, 'Hinterhalt!', '#ff9b6a');
      if (res.capture) await this.view.flashText(u.q, u.r, 'Erobert!', '#ffe08a');
    }
    this.busy = false;
    if (g.gameOver) { this.refresh(); this.showGameOver(); return; }
    if (g.attackTargets(u).length || g.loadTargets(u).length || g.unloadTiles(u).length) this.select(u);
    else this.deselect();
    this.refresh();
  }

  async doLoad(t, cargo) {
    const g = this.game;
    this.busy = true;
    const [cq, cr] = [cargo.q, cargo.r];
    g.load(t, cargo);
    await this.view.flashText(cq, cr, 'Aufgesessen', '#7fe08a');
    this.busy = false;
    this.unloadMode = false;
    this.select(t);
    this.refresh();
  }

  async doUnload(t, key) {
    const g = this.game;
    this.busy = true;
    const res = g.unload(t, key);
    if (res) {
      await this.view.flashText(res.unit.q, res.unit.r, 'Abgesetzt', '#ffd650');
      if (res.capture) await this.view.flashText(res.unit.q, res.unit.r, 'Erobert!', '#ffe08a');
    }
    this.busy = false;
    this.unloadMode = false;
    this.deselect();
    this.refresh();
    if (g.gameOver) this.showGameOver();
  }

  // Abladen ohne vorherige Bewegung: Taste U oder Knopf in der Seitenleiste.
  toggleUnload() {
    const u = this.selected;
    if (!this.humanTurn || !u || !u.cargo) return;
    this.unloadMode = !this.unloadMode;
    this.select(u);
  }

  async doAttack(att, def) {
    const g = this.game;
    this.busy = true;
    this.view.overlay.targets = [];
    this.view.overlay.reach = null;
    this.hideTooltip();
    await this.view.showAttack(att, def);
    const res = g.attack(att, def);
    if (res) await this.view.showAttackResult(att, def, res);
    this.busy = false;
    this.deselect();
    this.refresh();
    if (g.gameOver) this.showGameOver();
  }

  select(u) {
    const g = this.game;
    if (this.selected !== u || !u.cargo) this.unloadMode = false;
    this.selected = u;
    this.buyTile = null;
    const ov = this.view.overlay;
    ov.selected = u;
    ov.buyTile = null;
    const unloading = u.cargo && (this.unloadMode || !g.canMove(u));
    ov.reach = g.canMove(u) && !unloading ? g.reachable(u) : null;
    ov.targets = g.attackTargets(u);
    ov.loads = g.stats(u).transport ? g.loadTargets(u) : g.units.filter(t => g.canLoad(t, u));
    ov.unloads = unloading ? g.unloadTiles(u) : [];
    ov.path = null;
    $('buyPanel').classList.add('hidden');
    this.renderInfo(u);
  }

  deselect() {
    this.selected = null;
    this.buyTile = null;
    const ov = this.view.overlay;
    ov.selected = null; ov.reach = null; ov.targets = []; ov.path = null; ov.buyTile = null; ov.loads = []; ov.unloads = [];
    this.unloadMode = false;
    $('buyPanel').classList.add('hidden');
    this.renderInfo(null);
  }

  selectNextUnit() {
    if (!this.humanTurn) return;
    const g = this.game;
    const ready = g.units.filter(u => u.owner === g.current && (g.canMove(u) || g.attackTargets(u).length));
    if (!ready.length) return;
    const i = ready.indexOf(this.selected);
    this.select(ready[(i + 1) % ready.length]);
  }

  onHover(e) {
    const t = this.eventTile(e);
    if (t === this.hoverTile && !this.selected) return;
    this.hoverTile = t;
    this.updateHover(t, e);
  }

  updateHover(t, e) {
    const g = this.game, ov = this.view.overlay;
    if (!g) return;
    ov.hover = t;
    ov.path = null;
    if (!t) { this.hideTooltip(); return; }
    const unit = this.visibleUnitAt(t.q, t.r);
    const sel = this.selected;
    let html = '';

    if (sel && this.humanTurn) {
      if (unit && unit.owner !== g.current && ov.targets.includes(unit)) {
        const f = g.forecast(sel, unit);
        const range = (a, b) => (a === b ? `${a}` : `${a}–${b}`);
        html = `<b>${esc(g.stats(sel).name)}</b> → <b>${esc(g.stats(unit).name)}</b><br>
          Schaden: <span class="dmg">${range(f.min, f.max)}</span> (Ziel hat ${unit.hp})<br>
          Gegenschlag: <span class="ctr">${f.cmax ? range(f.cmin, f.cmax) : 'keiner'}</span>
          ${f.kill ? '<br><b>Sicher vernichtet</b>' : f.mayKill ? '<br>Vernichtung möglich' : ''}
          ${sel.movedHexes ? `<br><i>Bewegt (${sel.movedHexes} Felder): −${Math.round((1 - g.moveAttackMul(sel.movedHexes)) * 100)} % Angriff</i>` : ''}
          ${g.isSurprised(sel) ? '<br><i>Überrascht: −60 % Angriff</i>' : ''}
          ${g.stats(unit).isAir && !g.stats(sel).aa && !g.stats(sel).isAir ? '<br><i>Ohne Flak: 80 % gegen Flugzeuge</i>' : ''}
          ${g.isSurprised(unit) && f.cmax ? '<br><i>Ziel ist überrascht (−60 %)</i>' : ''}`;
      } else if (ov.reach && !unit) {
        const k = hexKey(t.q, t.r);
        const info = ov.reach.get(k);
        if (info && info.stop) ov.path = g.pathTo(ov.reach, k);
      }
    }
    if (!html) {
      const terr = TERRAIN[t.terrain];
      const viewer = this.view.viewer;
      const k = hexKey(t.q, t.r);
      if (viewer >= 0 && g.fog && !g.explored[viewer].has(k)) {
        this.showTooltip('<b>Unerkundet</b>', e);
        return;
      }
      html = `<b>${terr.name}</b>${t.road ? ' mit Straße' : ''}`;
      if (viewer >= 0 && g.fog && !g.visibleTiles(viewer).has(k)) html += ' · <i>nicht aufgeklärt</i>';
      if (terr.def) html += ` · Deckung +${terr.def}`;
      if (terr.capturable) {
        html += `<br>${t.owner >= 0 ? esc(g.nationOf(t.owner).short) : 'Neutral'} · +${terr.income} Nachschub`;
      }
      if (unit) {
        const s = g.stats(unit);
        html += `<br>${esc(s.name)} (${esc(g.nationOf(unit.owner).short)}) · Stärke ${unit.hp}/10`;
      }
    }
    if (e) this.showTooltip(html, e);
  }

  showTooltip(html, e) {
    const tip = $('tooltip');
    const r = $('board').getBoundingClientRect();
    tip.innerHTML = html;
    tip.classList.remove('hidden');
    let x = e.clientX - r.left + 16, y = e.clientY - r.top + 16;
    if (x + tip.offsetWidth > r.width - 8) x = e.clientX - r.left - tip.offsetWidth - 12;
    if (y + tip.offsetHeight > r.height - 8) y = e.clientY - r.top - tip.offsetHeight - 12;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  hideTooltip() { $('tooltip').classList.add('hidden'); }

  // ---------- Seitenleiste ----------

  refresh() {
    this.renderTopbar();
    if (this.selected && !this.game.units.includes(this.selected)) this.deselect();
    if (this.buyTile) this.openBuy(this.buyTile);
    else this.renderInfo(this.selected);
  }

  renderTopbar() {
    const g = this.game;
    if (!g) return;
    const p = g.players[g.current];
    const n = g.nationOf(g.current);
    $('turnInfo').innerHTML = `
      <span class="chip">Runde <b>${g.turn}</b>/${MAX_TURNS}</span>
      <span class="chip"><img src="${this.flags[p.nation]}" alt=""><b>${esc(n.short)}</b>${p.ai ? ' (KI)' : ''}</span>
      <span class="chip">Nachschub <b>${p.funds}</b> <span style="color:var(--muted)">+${g.incomeOf(g.current)}</span></span>
      <span class="chip" title="Städte inklusive Hauptquartiere – wer alle hält, gewinnt">Städte <b>${g.citiesOf(g.current)}</b>/${g.totalCities()}</span>`;
    const human = this.humanTurn;
    $('endTurnBtn').disabled = !human;
    $('nextUnitBtn').disabled = !human;
  }

  renderInfo(u) {
    const g = this.game;
    const el = $('infoPanel');
    if (!g) { el.innerHTML = ''; return; }
    if (!u) {
      const p = g.players[g.current];
      const ready = g.units.filter(x => x.owner === g.current && (g.canMove(x) || g.attackTargets(x).length)).length;
      el.innerHTML = `
        <h3>Lage</h3>
        <dl class="stats">
          ${[0, 1].map(i => {
            const v = this.view.viewer;
            const units = v < 0 || i === v ? `${g.units.filter(x => x.owner === i).length} Einheiten` : `${g.visibleEnemies(v).length} gesichtet`;
            return `<dt>${esc(g.nationOf(i).short)}</dt><dd>${g.citiesOf(i)} Städte · ${units}</dd>`;
          }).join('')}
        </dl>
        ${p.ai ? '' : `<p class="hint">${ready} Einheit(en) noch bereit. Wähle eine Einheit oder eine eigene Stadt ohne Einheit, um Truppen auszuheben.</p>
        <p class="hint"><kbd>N</kbd> nächste Einheit · <kbd>E</kbd> Zug beenden · <kbd>Esc</kbd> abbrechen</p>`}`;
      return;
    }
    const s = g.stats(u);
    const n = g.nationOf(u.owner);
    const terr = TERRAIN[g.tileOf(u).terrain];
    const frac = u.hp / 10;
    const color = frac > 0.6 ? 'var(--ok)' : frac > 0.3 ? '#f2c14e' : 'var(--danger)';
    let status = '';
    if (u.owner === g.current) {
      if (g.canMove(u)) status = '<span class="status ready">Bereit</span>';
      else if (g.attackTargets(u).length) status = '<span class="status ready">Kann angreifen</span>';
      else status = '<span class="status">Befehle ausgeführt</span>';
    }
    if (u.movedHexes && u.owner === g.current) status += ` <span class="status warn">${u.movedHexes} Felder bewegt: −${Math.round((1 - g.moveAttackMul(u.movedHexes)) * 100)} % Angriff</span>`;
    if (g.isSurprised(u)) status += ' <span class="status warn">Überrascht: −60 % Angriff</span>';
    const tileNow = g.tileOf(u);
    const repairHint = u.hp < 10 && tileNow.owner === u.owner && terr.capturable
      ? `<p class="hint">Wird zu Beginn des nächsten eigenen Zuges um ${HEAL_PER_TURN} repariert.</p>`
      : u.hp < 10 && u.owner === g.current ? '<p class="hint">Beschädigt – in einer eigenen Stadt wird repariert.</p>' : '';
    const airNote = s.air > 0 && !s.isAir && !s.aa ? ` <small>(×${GROUND_VS_AIR_MUL} = ${Math.round(s.air * GROUND_VS_AIR_MUL * 10) / 10})</small>` : '';
    el.innerHTML = `
      <div class="unit-card">
        <div class="head"><span id="unitIcon"></span>
          <div><div class="name">${esc(s.name)}</div><div class="sub">${esc(s.label)} · ${esc(n.short)}</div></div>
        </div>
        <div class="hpbar"><div style="width:${frac * 100}%;background:${color}"></div></div>
        <dl class="stats">
          <dt>Stärke</dt><dd>${u.hp} / 10</dd>
          <dt>Angriff weich / hart / Luft</dt><dd>${s.soft} / ${s.hard} / ${s.air ? s.air : '–'}${airNote}</dd>
          <dt>Verteidigung</dt><dd>${s.def} ${g.terrainDefense(u, u.q, u.r) ? `+${g.terrainDefense(u, u.q, u.r)} (${terr.name})` : ''}</dd>
          <dt>Bewegung</dt><dd>${s.towed ? 'gezogen' : `${s.move} (${MOVE_TYPE_LABEL[s.moveType]})`}</dd>
          ${s.transport ? `<dt>Ladung</dt><dd>${u.cargo ? `${esc(g.stats(u.cargo).name)} (${u.cargo.hp}/10)` : 'leer'}</dd>` : ''}
          <dt>Reichweite</dt><dd>${s.range[0] === s.range[1] ? s.range[0] : s.range.join('–')}</dd>
          <dt>Sichtweite</dt><dd>${s.vision}${s.spotter ? ' (sieht in Wälder)' : ''}</dd>
          <dt>Panzerung</dt><dd>${s.isAir ? 'Flugzeug' : s.armor >= 1 ? 'schwer' : s.armor > 0 ? 'leicht' : 'keine'}</dd>
        </dl>
        ${status}
        ${s.noMoveAndFire ? '<p class="hint">Kann nicht im selben Zug ziehen und feuern.</p>' : ''}
        ${s.capture ? '<p class="hint">Kann Städte und Hauptquartiere erobern.</p>' : ''}
        ${!s.air ? '<p class="hint">Kann keine Flugzeuge angreifen.</p>' : ''}
        ${s.towed ? '<p class="hint">Gezogen: bewegt sich nur mit LKW oder Halbkette. Transporter daneben stellen, dann Transporter und Geschütz nacheinander anklicken.</p>' : ''}
        ${s.transportable ? '<p class="hint">Kann mit LKW oder Halbkette transportiert werden.</p>' : ''}
        ${s.transport ? `<p class="hint">${u.cargo
          ? 'Ladung absetzen: nach dem Fahren gelbes Nachbarfeld anklicken, oder vorher <kbd>U</kbd> drücken. Wird das Fahrzeug vernichtet, ist auch die Ladung verloren.'
          : 'Lädt ein gezogenes Geschütz oder Infanterie: daneben fahren und die grün markierte Einheit anklicken.'}</p>` : ''}
        ${u.cargo && u.owner === g.current && g.canMove(u) && g.unloadTiles(u).length ? `<button class="btn" id="unloadBtn">${this.unloadMode ? 'Abladen abbrechen' : 'Hier abladen (U)'}</button>` : ''}
        ${repairHint}
      </div>`;
    $('unitIcon').appendChild(unitIconCanvas(g.players[u.owner].nation, u.type));
    const ub = $('unloadBtn');
    if (ub) ub.addEventListener('click', () => this.toggleUnload());
  }

  openBuy(tile) {
    const g = this.game;
    if (!this.humanTurn || tile.owner !== g.current || g.unitAt(tile.q, tile.r)) {
      this.buyTile = null;
      this.view.overlay.buyTile = null;
      $('buyPanel').classList.add('hidden');
      this.renderInfo(this.selected);
      return;
    }
    this.selected = null;
    const ov = this.view.overlay;
    ov.selected = null; ov.reach = null; ov.targets = []; ov.path = null; ov.loads = []; ov.unloads = [];
    this.buyTile = tile;
    ov.buyTile = tile;
    const p = g.players[g.current];
    const panel = $('buyPanel');
    panel.innerHTML = `<h3>Truppen ausheben – ${TERRAIN[tile.terrain].name}</h3><div class="buy-list"></div>
      <p class="hint">Neue Einheiten sind ab der nächsten Runde einsatzbereit.</p>`;
    const list = panel.querySelector('.buy-list');
    for (const type of UNIT_ORDER) {
      const s = unitStats(p.nation, type);
      const b = document.createElement('button');
      b.className = 'buy-item';
      b.disabled = s.cost > p.funds;
      b.innerHTML = `<span class="ic"></span>
        <span><div class="n">${esc(s.name)}</div><div class="t">${esc(s.label)} · A ${s.soft}/${s.hard}/${s.air} · V ${s.def} · B ${s.towed ? 'gezogen' : s.move}${s.transport ? ' · Transport' : ''}</div></span>
        <span class="c">${s.cost}</span>`;
      b.querySelector('.ic').appendChild(unitIconCanvas(p.nation, type));
      b.addEventListener('click', () => {
        const u = g.buy(type, tile);
        if (u) {
          this.view.flashText(tile.q, tile.r, 'Neu!', '#bfe3ff');
          this.buyTile = null;
          this.deselect();
          this.refresh();
        }
      });
      list.appendChild(b);
    }
    panel.classList.remove('hidden');
    $('infoPanel').innerHTML = `<h3>Nachschub</h3><p class="hint">Verfügbar: <b>${p.funds}</b> · Einkommen pro Runde: <b>${g.incomeOf(g.current)}</b></p>`;
  }

  renderLog() {
    const g = this.game;
    const el = $('log');
    el.innerHTML = g.log.slice(-60).reverse().map(entry => {
      const color = entry.player >= 0 ? g.nationOf(entry.player).color : 'var(--line)';
      return `<li style="border-left-color:${color}">${esc(entry.text)}</li>`;
    }).join('');
    this.renderTopbar();
  }
}

function showConfigErrors() {
  $('overlay').classList.remove('hidden');
  $('overlay').classList.add('opaque');
  $('overlayContent').innerHTML = `
    <h2>Fehler in der Konfiguration</h2>
    <p>Bitte <code>config/einheiten.js</code> bzw. <code>config/nationen.js</code> korrigieren und die Seite neu laden.</p>
    <ul>${CONFIG_ERRORS.map(m => `<li>${esc(m)}</li>`).join('')}</ul>`;
}

window.addEventListener('DOMContentLoaded', () => {
  if (CONFIG_ERRORS.length) { showConfigErrors(); return; }
  window.controller = new Controller();
});
