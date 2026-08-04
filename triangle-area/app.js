/* =================================================================
   Triangle Matching Puzzle — plain JS, no dependencies.

   Place points on an n x n lattice. Every 3 points form a triangle.
   Any two triangles that "match" (equal area / equal perimeter /
   congruent) get filled on the board.
   ================================================================= */

/* ---------------- 1. Config: edit these ---------------- */

const CONFIG = {
  N: 19,                        // grid is N x N lattice points
  EXTEND_BY: 5,                 // how many points Auto-solve adds to what's placed
  SEARCH_MS: 350,               // time budget for the randomized search
  MAX_SOLUTIONS: 24,            // how many distinct results to keep for < > stepping
  LANG: 'ja',                   // 'ja' or 'en' — starting language
  BOARD_STYLE: 'Graph paper',   // 'Graph paper' | 'Blueprint' | 'Minimal' | 'Dot grid'
  COLLISION_STYLE: 'Translucent fill', // 'Translucent fill' | 'Bold outline' | 'Glow'
  DISTINCT_GROUP_COLORS: true,  // false = every matching group is red
  IGNORE_COLLINEAR: true,       // start with straight-line triples ignored
  SHOW_SAFE: false,             // start with the safe-cell overlay on?
  CRITERIA: { area: true, perim: false, congru: false },
};

const BOARD_STYLES = {
  'Graph paper': { bg: '#fbfcfe', grid: '#dde6f0', empty: '#b8c6d8', active: '#2f6df6', activeRing: '#1b4fd1', dotR: 2.4, lines: true },
  'Blueprint':   { bg: '#0e2a52', grid: 'rgba(255,255,255,.16)', empty: 'rgba(173,201,240,.55)', active: '#8fc0ff', activeRing: '#cfe2ff', dotR: 2.4, lines: true },
  'Minimal':     { bg: '#ffffff', grid: '#eef1f4', empty: '#cdd5df', active: '#111827', activeRing: '#374151', dotR: 2.4, lines: true },
  'Dot grid':    { bg: '#faf9f6', grid: 'transparent', empty: '#cbb8a8', active: '#b4541e', activeRing: '#7c3a13', dotR: 2.6, lines: false },
};

const GROUP_COLORS = ['#e5484d', '#ef7d12', '#d6409f', '#9333ea', '#0891b2', '#65a30d', '#dc2626'];

/* ---------------- 2. Text ---------------- */

const I18N = {
  ja: {
    htmlLang: 'ja',
    docTitle: '三角形マッチング・パズル',
    eyebrow: '格子幾何 · サンドボックス',
    title: '三角形マッチング・パズル',
    intro: '格子に点を置きます。3点ごとに三角形ができます。2つの三角形が一致しないように点を追加しましょう — 一致した組は盤面で塗られます。',
    criteriaLabel: '三角形が一致する条件',
    criteriaHint: '1つ以上を有効にします。有効なルールのいずれかで一致すると衝突です。',
    optionsLabel: 'オプション',
    solveLabel: '解探索とリセット',
    autoSolveBtn: '自動で解く',
    resetBtn: 'リセット',
    points: '点', triangles: '三角形', clashes: '一致組',
    chips: { area: '面積が等しい', perim: '周の長さが等しい', congru: '合同' },
    legendPlaced: '配置した点（もう一度クリックで削除）',
    legendSafe: '安全なセル（追加しても三角形が重複しない）',
    legendMatch: '一致した三角形',
    optShowSafe: '安全なセルを表示',
    optCountColl: '一直線上の3点を三角形として数える',
    langBtn: 'EN',
    st_pickT: '一致のルールを選んでください', st_pickS: '上で面積・周の長さ・合同のいずれかを選びます。',
    st_addT: '点を3つ以上置いてください', st_addS: '格子をクリックして点を配置します。',
    st_okT: t => '✓ ' + t + ' 個の三角形はすべて異なります', st_okS: 'まだ一致する三角形はありません。続けましょう。',
    st_badT: (c, g) => '✗ ' + c + ' 個の三角形が ' + g + ' 組で一致', st_badS: '一致した三角形が盤面で塗られています。',
    sol: (i, n, k) => '解 ' + i + ' / ' + n + ' ・ ' + k + ' 点', solNone: '未探索',
  },
  en: {
    htmlLang: 'en',
    docTitle: 'Triangle Matching Puzzle',
    eyebrow: 'Lattice geometry · sandbox',
    title: 'Triangle Matching Puzzle',
    intro: 'Place points on the grid. Every 3 points form a triangle. Add points without ever creating two triangles that match — any matching pair gets filled on the board.',
    criteriaLabel: 'Match when triangles share…',
    criteriaHint: 'Turn on one or more. A pair clashes if it matches on any active rule.',
    optionsLabel: 'Options',
    solveLabel: 'Solve & reset',
    autoSolveBtn: 'Auto-solve',
    resetBtn: 'Reset',
    points: 'points', triangles: 'triangles', clashes: 'match groups',
    chips: { area: 'Equal area', perim: 'Equal perimeter', congru: 'Congruent' },
    legendPlaced: 'placed point — click again to remove',
    legendSafe: 'safe cell (adding it keeps all triangles distinct)',
    legendMatch: 'matching triangles',
    optShowSafe: 'Show safe cells',
    optCountColl: 'Count straight-line triples as triangles',
    langBtn: '日本語',
    st_pickT: 'Pick a matching rule', st_pickS: 'Choose equal area, perimeter, or congruent above.',
    st_addT: 'Add at least 3 points', st_addS: 'Click the grid to place lattice points.',
    st_okT: t => '✓ All ' + t + ' triangles are distinct', st_okS: 'No two triangles match yet — keep going.',
    st_badT: (c, g) => '✗ ' + c + ' triangles match in ' + g + ' group' + (g > 1 ? 's' : ''), st_badS: 'Matching triangles are filled on the board.',
    sol: (i, n, k) => 'solution ' + i + ' / ' + n + ' · ' + k + ' pts', solNone: 'no search yet',
  },
};

/* ---------------- 3. State ---------------- */

const state = {
  n: CONFIG.N,
  lang: CONFIG.LANG,
  active: {},                              // "x,y" -> true for placed points
  criteria: { ...CONFIG.CRITERIA },
  ignoreCollinear: CONFIG.IGNORE_COLLINEAR,
  showSafe: CONFIG.SHOW_SAFE,
  solutions: [],
  solIdx: 0,
};

const L = () => I18N[state.lang];

/* ---------------- 4. Geometry ---------------- */

const sqDist = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/* Signatures for one triple. Returns null for collinear triples when
   those are being ignored. Values are exact-ish strings so equality
   comparison is a plain string match:
     area   — twice the area, always an integer on a lattice
     perim  — sum of side lengths, rounded to 6 decimals
     congru — the three squared side lengths, sorted                */
function sigsOf(A, B, C) {
  const area2 = Math.abs((B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x));
  if (area2 === 0 && state.ignoreCollinear) return null;
  const d1 = sqDist(A, B), d2 = sqDist(B, C), d3 = sqDist(C, A);
  const sorted = [d1, d2, d3].sort((p, q) => p - q);
  const perim = Math.sqrt(d1) + Math.sqrt(d2) + Math.sqrt(d3);
  return { area: 'A' + area2, perim: 'P' + perim.toFixed(6), congru: 'C' + sorted.join('_') };
}

function activeCriteria() {
  const c = state.criteria, out = [];
  if (c.area) out.push('area');
  if (c.perim) out.push('perim');
  if (c.congru) out.push('congru');
  return out;
}

function pointsArr() {
  return Object.keys(state.active).map(k => {
    const [x, y] = k.split(',');
    return { x: +x, y: +y, k };
  });
}

/* Point inside (or on the edge of) a triangle — same-sign test. */
function coveredByCollision(x, y, tris) {
  const sign = (ax, ay, bx, by, cx, cy) => (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
  for (const v of tris) {
    const d1 = sign(x, y, v[0].x, v[0].y, v[1].x, v[1].y);
    const d2 = sign(x, y, v[1].x, v[1].y, v[2].x, v[2].y);
    const d3 = sign(x, y, v[2].x, v[2].y, v[0].x, v[0].y);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    if (!(hasNeg && hasPos)) return true;
  }
  return false;
}

/* ---------------- 5. Analysis ---------------- */

/* Enumerate every triangle, then union-find matching ones into groups. */
function analyze(pts) {
  const active = activeCriteria();
  const tris = [];
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      for (let k = j + 1; k < pts.length; k++) {
        const sig = sigsOf(pts[i], pts[j], pts[k]);
        if (sig) tris.push({ pts: [i, j, k], sig });
      }

  const buckets = {};
  active.forEach(c => (buckets[c] = {}));
  tris.forEach((t, idx) => active.forEach(c => {
    const v = t.sig[c];
    (buckets[c][v] = buckets[c][v] || []).push(idx);
  }));

  const parent = tris.map((_, i) => i);
  const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const colliding = new Set();
  active.forEach(c => Object.values(buckets[c]).forEach(list => {
    if (list.length > 1) {
      list.forEach(i => colliding.add(i));
      for (let m = 1; m < list.length; m++) parent[find(list[0])] = find(list[m]);
    }
  }));

  const gm = {};
  colliding.forEach(i => { const r = find(i); (gm[r] = gm[r] || []).push(i); });
  return { tris, colliding, groups: Object.values(gm), total: tris.length };
}

/* Which empty cells could be added without creating any match. */
function computeSafe(pts) {
  const n = state.n, active = activeCriteria();
  const existing = { area: new Set(), perim: new Set(), congru: new Set() };
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      for (let k = j + 1; k < pts.length; k++) {
        const s = sigsOf(pts[i], pts[j], pts[k]);
        if (s) active.forEach(c => existing[c].add(s[c]));
      }

  const occupied = new Set(pts.map(p => p.k));
  const res = {};
  for (let x = 0; x < n; x++)
    for (let y = 0; y < n; y++) {
      const key = x + ',' + y;
      if (occupied.has(key)) continue;
      res[key] = canAdd({ x, y, k: key }, pts, existing, active);
    }
  return res;
}

/* Could point e join `chosen` without duplicating a signature? */
function canAdd(e, chosen, sets, active) {
  const fresh = { area: new Set(), perim: new Set(), congru: new Set() };
  for (let i = 0; i < chosen.length; i++)
    for (let j = i + 1; j < chosen.length; j++) {
      const s = sigsOf(chosen[i], chosen[j], e);
      if (!s) continue;
      for (const c of active) if (sets[c].has(s[c]) || fresh[c].has(s[c])) return false;
      active.forEach(c => fresh[c].add(s[c]));
    }
  return true;
}

/* ---------------- 6. Auto-solve ---------------- */

/* Keep the placed points, greedily add up to `limit` more at random. */
function greedyExtend(active, base, limit) {
  const n = state.n;
  const chosen = base.map(p => ({ x: p.x, y: p.y, k: p.k }));
  const used = new Set(chosen.map(c => c.k));
  const sets = { area: new Set(), perim: new Set(), congru: new Set() };

  for (let i = 0; i < chosen.length; i++)
    for (let j = i + 1; j < chosen.length; j++)
      for (let k = j + 1; k < chosen.length; k++) {
        const s = sigsOf(chosen[i], chosen[j], chosen[k]);
        if (s) active.forEach(c => sets[c].add(s[c]));
      }

  const addSigs = pick => {
    for (let i = 0; i < chosen.length; i++)
      for (let j = i + 1; j < chosen.length; j++) {
        const s = sigsOf(chosen[i], chosen[j], pick);
        if (s) active.forEach(c => sets[c].add(s[c]));
      }
  };

  for (let step = 0; step < limit; step++) {
    const cands = [];
    for (let x = 0; x < n; x++)
      for (let y = 0; y < n; y++) {
        const key = x + ',' + y;
        if (!used.has(key) && canAdd({ x, y, k: key }, chosen, sets, active)) cands.push({ x, y, k: key });
      }
    if (!cands.length) break;
    const pick = cands[(Math.random() * cands.length) | 0];
    addSigs(pick);
    chosen.push(pick);
    used.add(pick.k);
  }
  return chosen;
}

function autoSolve() {
  const active = activeCriteria();
  if (!active.length) return;
  const base = pointsArr();
  const start = Date.now(), found = new Map();
  let runs = 0;
  while (Date.now() - start < CONFIG.SEARCH_MS && runs < 2500) {
    runs++;
    const keys = greedyExtend(active, base, CONFIG.EXTEND_BY).map(p => p.k).sort();
    const id = keys.join('|');
    if (!found.has(id)) found.set(id, keys);
  }
  const sols = [...found.values()]
    .filter(k => k.length > base.length)
    .sort((a, b) => b.length - a.length)
    .slice(0, CONFIG.MAX_SOLUTIONS);
  if (!sols.length) return;
  state.solutions = sols;
  state.solIdx = 0;
  applySolution(0);
}

function applySolution(idx) {
  state.active = {};
  state.solutions[idx].forEach(k => (state.active[k] = true));
  state.solIdx = idx;
  render();
}

function stepSolution(d) {
  const len = state.solutions.length;
  if (!len) return;
  applySolution((state.solIdx + d + len) % len);
}

/* ---------------- 7. Rendering ---------------- */

const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';

function svgEl(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function togglePoint(x, y) {
  const k = x + ',' + y;
  if (state.active[k]) delete state.active[k]; else state.active[k] = true;
  state.solutions = [];
  state.solIdx = 0;
  render();
}

const SIZE = 560, MARGIN = 46;

function renderBoard(pts, an, safeMap) {
  const svg = $('board');
  svg.textContent = '';
  const n = state.n;
  const pal = BOARD_STYLES[CONFIG.BOARD_STYLE] || BOARD_STYLES['Graph paper'];
  const span = SIZE - 2 * MARGIN;
  const cell = n > 1 ? span / (n - 1) : 0;
  const px = x => MARGIN + x * cell;
  const py = y => MARGIN + y * cell;

  svg.appendChild(svgEl('rect', { x: 0, y: 0, width: SIZE, height: SIZE, rx: 14, fill: pal.bg }));

  if (pal.lines) {
    for (let i = 0; i < n; i++) {
      svg.appendChild(svgEl('line', { x1: px(i), y1: py(0), x2: px(i), y2: py(n - 1), stroke: pal.grid, 'stroke-width': 1 }));
      svg.appendChild(svgEl('line', { x1: px(0), y1: py(i), x2: px(n - 1), y2: py(i), stroke: pal.grid, 'stroke-width': 1 }));
    }
  }

  // matching triangles
  const colorOf = {};
  an.groups.forEach((g, gi) => {
    const col = CONFIG.DISTINCT_GROUP_COLORS ? GROUP_COLORS[gi % GROUP_COLORS.length] : '#e5484d';
    g.forEach(ti => (colorOf[ti] = col));
  });

  const style = CONFIG.COLLISION_STYLE;
  const collTris = [];
  an.groups.forEach(g => g.forEach(ti => {
    const tri = an.tris[ti].pts.map(idx => pts[idx]);
    collTris.push(tri);
    const points = tri.map(p => px(p.x) + ',' + py(p.y)).join(' ');
    const col = colorOf[ti];
    if (style === 'Bold outline') {
      svg.appendChild(svgEl('polygon', { points, fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    } else if (style === 'Glow') {
      svg.appendChild(svgEl('polygon', { points, fill: col, 'fill-opacity': .10, stroke: col, 'stroke-opacity': .25, 'stroke-width': 8, 'stroke-linejoin': 'round' }));
      svg.appendChild(svgEl('polygon', { points, fill: col, 'fill-opacity': .16, stroke: col, 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    } else {
      svg.appendChild(svgEl('polygon', { points, fill: col, 'fill-opacity': .18, stroke: col, 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    }
  }));

  // lattice points + per-cell hit areas
  for (let x = 0; x < n; x++)
    for (let y = 0; y < n; y++) {
      const key = x + ',' + y, placed = !!state.active[key];
      const X = px(x), Y = py(y);

      if (placed) {
        svg.appendChild(svgEl('circle', { cx: X, cy: Y, r: 7.5, fill: pal.active, stroke: pal.activeRing, 'stroke-width': 1.5 }));
      } else if (!collTris.length || !coveredByCollision(x, y, collTris)) {
        // hidden entirely when covered by a highlighted triangle
        if (safeMap && safeMap[key]) {
          svg.appendChild(svgEl('circle', {
            cx: X, cy: Y, r: Math.min(cell * .34, 13), fill: 'none',
            stroke: '#16a34a', 'stroke-width': 2, 'stroke-opacity': .65,
          }));
        }
        svg.appendChild(svgEl('circle', { cx: X, cy: Y, r: pal.dotR, fill: pal.empty }));
      }

      const hit = svgEl('rect', { x: X - cell / 2, y: Y - cell / 2, width: cell, height: cell, fill: 'transparent' });
      hit.style.cursor = 'pointer';
      hit.addEventListener('click', () => togglePoint(x, y));
      svg.appendChild(hit);
    }
}

function renderChips() {
  const box = $('chips');
  box.textContent = '';
  const t = L().chips;
  [['area', t.area], ['perim', t.perim], ['congru', t.congru]].forEach(([key, label]) => {
    const b = document.createElement('button');
    b.className = 'chip' + (state.criteria[key] ? ' on' : '');
    b.textContent = label;
    b.addEventListener('click', () => {
      state.criteria[key] = !state.criteria[key];
      state.solutions = [];
      state.solIdx = 0;
      render();
    });
    box.appendChild(b);
  });
}

function renderStatus(pts, an, active) {
  const t = L();
  let bg, fg, title, sub;
  if (!active.length) { bg = '#f1f5f9'; fg = '#475569'; title = t.st_pickT; sub = t.st_pickS; }
  else if (pts.length < 3) { bg = '#f1f5f9'; fg = '#475569'; title = t.st_addT; sub = t.st_addS; }
  else if (an.colliding.size === 0) { bg = '#ecfdf3'; fg = '#15803d'; title = t.st_okT(an.total); sub = t.st_okS; }
  else { bg = '#fef2f2'; fg = '#b42318'; title = t.st_badT(an.colliding.size, an.groups.length); sub = t.st_badS; }
  const box = $('status');
  box.style.background = bg;
  box.style.color = fg;
  $('statusTitle').textContent = title;
  $('statusSub').textContent = sub;
}

function render() {
  const t = L();
  const pts = pointsArr();
  const an = analyze(pts);
  const safeMap = state.showSafe ? computeSafe(pts) : null;
  const active = activeCriteria();

  document.documentElement.lang = t.htmlLang;
  document.title = t.docTitle;

  $('eyebrow').textContent = t.eyebrow;
  $('title').textContent = t.title;
  $('intro').textContent = t.intro;
  $('langBtn').textContent = t.langBtn;
  $('criteriaLabel').textContent = t.criteriaLabel;
  $('criteriaHint').textContent = t.criteriaHint;
  $('optionsLabel').textContent = t.optionsLabel;
  $('solveLabel').textContent = t.solveLabel;
  $('autoSolveBtn').textContent = t.autoSolveBtn;
  $('resetBtn').textContent = t.resetBtn;
  $('safeText').textContent = t.optShowSafe;
  $('collText').textContent = t.optCountColl;
  $('legPlaced').textContent = t.legendPlaced;
  $('legSafe').textContent = t.legendSafe;
  $('legMatch').textContent = t.legendMatch;
  $('labPoints').textContent = t.points;
  $('labTris').textContent = t.triangles;
  $('labGroups').textContent = t.clashes;

  $('safeBox').className = 'cb' + (state.showSafe ? ' on' : '');
  $('safeBox').textContent = state.showSafe ? '✓' : '';
  $('collBox').className = 'cb' + (!state.ignoreCollinear ? ' on' : '');
  $('collBox').textContent = !state.ignoreCollinear ? '✓' : '';

  $('statPoints').textContent = pts.length;
  $('statTris').textContent = an.total;
  $('statGroups').textContent = an.groups.length;

  $('solInfo').textContent = state.solutions.length
    ? t.sol(state.solIdx + 1, state.solutions.length, state.solutions[state.solIdx].length)
    : t.solNone;

  renderChips();
  renderStatus(pts, an, active);
  renderBoard(pts, an, safeMap);
}

/* ---------------- 8. Wiring ---------------- */

$('langBtn').addEventListener('click', () => {
  state.lang = state.lang === 'ja' ? 'en' : 'ja';
  render();
});
$('safeBtn').addEventListener('click', () => { state.showSafe = !state.showSafe; render(); });
$('collBtn').addEventListener('click', () => {
  state.ignoreCollinear = !state.ignoreCollinear;
  state.solutions = [];
  state.solIdx = 0;
  render();
});
$('autoSolveBtn').addEventListener('click', autoSolve);
$('resetBtn').addEventListener('click', () => {
  state.active = {};
  state.solutions = [];
  state.solIdx = 0;
  render();
});
$('prevBtn').addEventListener('click', () => stepSolution(-1));
$('nextBtn').addEventListener('click', () => stepSolution(1));

render();
