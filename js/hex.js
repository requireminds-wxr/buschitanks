// Hex-Mathematik: axiale Koordinaten (q, r), Spitze oben, Kartenlayout "odd-r".

const SQRT3 = Math.sqrt(3);
const HEX_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

function hexKey(q, r) { return q + ',' + r; }

function parseKey(k) {
  const i = k.indexOf(',');
  return [Number(k.slice(0, i)), Number(k.slice(i + 1))];
}

function hexNeighbors(q, r) { return HEX_DIRS.map(([dq, dr]) => [q + dq, r + dr]); }

function hexDistance(q1, r1, q2, r2) {
  const dq = q1 - q2, dr = r1 - r2;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

function offsetToAxial(col, row) { return [col - ((row - (row & 1)) >> 1), row]; }
function axialToOffset(q, r) { return [q + ((r - (r & 1)) >> 1), r]; }

function hexToPixel(q, r, size) { return [size * SQRT3 * (q + r / 2), size * 1.5 * r]; }

function pixelToHex(x, y, size) {
  const q = (SQRT3 / 3 * x - y / 3) / size;
  const r = (2 / 3 * y) / size;
  return hexRound(q, r);
}

function hexRound(q, r) {
  const x = q, z = r, y = -x - z;
  let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
  const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return [rx, rz];
}

function hexLine(q1, r1, q2, r2) {
  const n = hexDistance(q1, r1, q2, r2);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = n === 0 ? 0 : i / n;
    out.push(hexRound(q1 + (q2 - q1) * t + 1e-6, r1 + (r2 - r1) * t + 1e-6));
  }
  return out;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
