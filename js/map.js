// Prozedurale, punktsymmetrische Kartenerzeugung.

const MAP_SIZES = {
  small:  { label: 'Klein (14×10)',  w: 14, h: 10, cities: 3 },
  medium: { label: 'Mittel (18×12)', w: 18, h: 12, cities: 4 },
  large:  { label: 'Groß (24×15)',   w: 24, h: 15, cities: 6 },
};

function makeValueNoise(rng, gw, gh) {
  const grid = [];
  for (let i = 0; i < (gw + 2) * (gh + 2); i++) grid.push(rng());
  const g = (i, j) => grid[j * (gw + 2) + i];
  const smooth = t => t * t * (3 - 2 * t);
  return (x, y) => {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const u = smooth(x - x0), v = smooth(y - y0);
    const a = g(x0, y0), b = g(x0 + 1, y0), c = g(x0, y0 + 1), d = g(x0 + 1, y0 + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

function pickTerrain(e, m) {
  if (e < 0.27) return 'water';
  if (e > 0.78) return 'mountain';
  if (e > 0.65) return 'hills';
  if (e < 0.36 && m > 0.58) return 'swamp';
  if (m > 0.6) return 'forest';
  return 'plain';
}

function generateMap(sizeKey, seed) {
  const { w, h, cities } = MAP_SIZES[sizeKey];
  const rng = mulberry32(seed);
  const elev1 = makeValueNoise(rng, 40, 40);
  const elev2 = makeValueNoise(rng, 40, 40);
  const moist = makeValueNoise(rng, 40, 40);

  const grid = [];
  for (let row = 0; row < h; row++) {
    grid.push([]);
    for (let col = 0; col < w; col++) {
      const [q, r] = offsetToAxial(col, row);
      const e = 0.65 * elev1(col / 4.5, row / 4.5) + 0.35 * elev2(col / 2.2, row / 2.2);
      const m = moist(col / 3.5, row / 3.5);
      grid[row].push({ col, row, q, r, terrain: pickTerrain(e, m), owner: -1 });
    }
  }

  const mirrorOf = t => grid[h - 1 - t.row][w - 1 - t.col];
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const t = grid[row][col], m = mirrorOf(t);
      if (row * w + col > m.row * w + m.col) t.terrain = m.terrain;
    }
  }

  const tiles = new Map();
  for (const row of grid) for (const t of row) tiles.set(hexKey(t.q, t.r), t);

  const setBoth = (t, terrain, owner0) => {
    t.terrain = terrain;
    const m = mirrorOf(t);
    m.terrain = terrain;
    if (owner0 !== undefined) {
      t.owner = owner0;
      m.owner = owner0 === -1 ? -1 : 1 - owner0;
    }
  };

  // Hauptquartiere
  const hq0 = grid[Math.floor(h / 2)][1];
  setBoth(hq0, 'hq', 0);
  const hq1 = mirrorOf(hq0);

  // Städte in der linken Hälfte, gespiegelt auf die rechte
  const placed = [hq0];
  const candidates = [];
  for (const row of grid) {
    for (const t of row) {
      if (t.col >= Math.floor((w - 1) / 2)) continue;
      if (t.terrain === 'water' || t.terrain === 'mountain' || t.terrain === 'hq') continue;
      candidates.push(t);
    }
  }
  let attempts = 0;
  const cityTiles = [];
  while (cityTiles.length < cities && attempts < 500 && candidates.length) {
    attempts++;
    const t = candidates[Math.floor(rng() * candidates.length)];
    const m = mirrorOf(t);
    if (placed.some(p => hexDistance(p.q, p.r, t.q, t.r) < 3)) continue;
    if (hexDistance(t.q, t.r, m.q, m.r) < 3) continue;
    placed.push(t);
    cityTiles.push(t);
    setBoth(t, 'city', -1);
  }
  // Die Stadt am nächsten zum eigenen HQ gehört von Beginn an dem Spieler.
  cityTiles.sort((a, b) => hexDistance(a.q, a.r, hq0.q, hq0.r) - hexDistance(b.q, b.r, hq0.q, hq0.r));
  if (cityTiles.length) setBoth(cityTiles[0], 'city', 0);

  // Erreichbarkeit für Kettenfahrzeuge sicherstellen.
  const targets = [hq1, ...cityTiles, ...cityTiles.map(mirrorOf)];
  for (let pass = 0; pass < 3; pass++) {
    const reach = floodFill(tiles, hq0, 'track');
    const missing = targets.filter(t => !reach.has(hexKey(t.q, t.r)));
    if (!missing.length) break;
    for (const target of missing) {
      for (const [q, r] of hexLine(hq0.q, hq0.r, target.q, target.r)) {
        const t = tiles.get(hexKey(q, r));
        if (!t) continue;
        if (t.terrain === 'water' || t.terrain === 'swamp') setBoth(t, 'plain');
        else if (t.terrain === 'mountain') setBoth(t, 'hills');
      }
    }
  }

  return { w, h, grid, tiles, hq: [hexKey(hq0.q, hq0.r), hexKey(hq1.q, hq1.r)], seed, sizeKey };
}

function floodFill(tiles, start, moveType) {
  const seen = new Set([hexKey(start.q, start.r)]);
  const stack = [start];
  while (stack.length) {
    const t = stack.pop();
    for (const [q, r] of hexNeighbors(t.q, t.r)) {
      const k = hexKey(q, r);
      const n = tiles.get(k);
      if (!n || seen.has(k) || TERRAIN[n.terrain].cost[moveType] >= IMPASSABLE) continue;
      seen.add(k);
      stack.push(n);
    }
  }
  return seen;
}
