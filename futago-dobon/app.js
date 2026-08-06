/* =================================================================
   Futago Dobon (双子でドボン) — plain JS, no dependencies.

   Place points on an n x n lattice. Every 3 points form a triangle.
   The goal is to keep adding points without ever creating two
   congruent triangles — any congruent pair gets filled on the board.
   ================================================================= */

/* ---------------- 1. Config: edit these ---------------- */

const CONFIG = {
  N: 19,                        // grid is N x N lattice points
  LANG: 'ja',                   // 'ja' or 'en' — starting language
  BOARD_STYLE: 'Graph paper',   // 'Graph paper' | 'Blueprint' | 'Minimal' | 'Dot grid'
  COLLISION_STYLE: 'Translucent fill', // 'Translucent fill' | 'Bold outline' | 'Glow'
  DISTINCT_GROUP_COLORS: true,  // false = every congruent group is red
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
    docTitle: '双子でドボン',
    title: '双子でドボン',
    intro: '格子に点を置きます。3点ごとに三角形ができます。2つの三角形が合同にならないように点を追加しましょう！',
    resetBtn: 'リセット',
    points: '点', triangles: '三角形', clashes: '合同組',
    legendPlaced: '配置した点（もう一度クリックで削除）',
    legendMatch: '合同な三角形（面積がゼロの場合も含みます）',
    langBtn: 'EN',
    st_addT: '点を3つ以上置いてください', st_addS: '格子をクリックして点を配置します。',
    st_okT: t => '✓ ' + t + ' 個の三角形はすべて異なります', st_okS: 'まだ合同な三角形はありません。続けましょう。',
    st_badT: (c, g) => '✗ ' + c + ' 個の三角形が ' + g + ' 組で合同', st_badS: '合同な三角形が盤面で塗られています。',
  },
  en: {
    htmlLang: 'en',
    docTitle: 'Futago Dobon',
    title: 'Futago Dobon',
    intro: 'Place points on the grid. Every 3 points form a triangle. How many points can you add without creating two congruent triangles?',
    resetBtn: 'Reset',
    points: 'points', triangles: 'triangles', clashes: 'congruent groups',
    legendPlaced: 'placed point — click again to remove',
    legendMatch: 'congruent triangles (including ones with zero area)',
    langBtn: '日本語',
    st_addT: 'Add at least 3 points', st_addS: 'Click the grid to place lattice points.',
    st_okT: t => '✓ All ' + t + ' triangles are distinct', st_okS: 'No two triangles are congruent yet — keep going.',
    st_badT: (c, g) => '✗ ' + c + ' triangles congruent in ' + g + ' group' + (g > 1 ? 's' : ''), st_badS: 'Congruent triangles are filled on the board.',
  },
};

/* ---------------- 3. State ---------------- */

const state = {
  n: CONFIG.N,
  lang: CONFIG.LANG,
  active: {},                              // "x,y" -> true for placed points
};

const L = () => I18N[state.lang];

/* ---------------- 4. Geometry ---------------- */

const sqDist = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

/* Congruence signature for one triple: the three squared side lengths,
   sorted, as a comparable string — two triangles are congruent exactly
   when these match. Collinear (degenerate) triples are counted as
   triangles too, matching the original tool's "count three points on a
   line as a triangle" mode: a straight run of points can itself form a
   twin (e.g. four evenly-spaced points give two identical [1,1,4]
   triples), which is what makes a line-up a bust. */
function sigOf(A, B, C) {
  const sorted = [sqDist(A, B), sqDist(B, C), sqDist(C, A)].sort((p, q) => p - q);
  return sorted.join('_');
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

/* Enumerate every triangle, then union-find congruent ones into groups. */
function analyze(pts) {
  const tris = [];
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      for (let k = j + 1; k < pts.length; k++) {
        const sig = sigOf(pts[i], pts[j], pts[k]);
        if (sig) tris.push({ pts: [i, j, k], sig });
      }

  const buckets = {};
  tris.forEach((t, idx) => {
    (buckets[t.sig] = buckets[t.sig] || []).push(idx);
  });

  const parent = tris.map((_, i) => i);
  const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const colliding = new Set();
  Object.values(buckets).forEach(list => {
    if (list.length > 1) {
      list.forEach(i => colliding.add(i));
      for (let m = 1; m < list.length; m++) parent[find(list[0])] = find(list[m]);
    }
  });

  const gm = {};
  colliding.forEach(i => { const r = find(i); (gm[r] = gm[r] || []).push(i); });
  return { tris, colliding, groups: Object.values(gm), total: tris.length };
}

/* ---------------- 6. Rendering ---------------- */

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
  render();
}

const SIZE = 560, MARGIN = 46;

function renderBoard(pts, an) {
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

  // congruent triangles
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
        svg.appendChild(svgEl('circle', { cx: X, cy: Y, r: pal.dotR, fill: pal.empty }));
      }

      const hit = svgEl('rect', { x: X - cell / 2, y: Y - cell / 2, width: cell, height: cell, fill: 'transparent' });
      hit.style.cursor = 'pointer';
      hit.addEventListener('click', () => togglePoint(x, y));
      svg.appendChild(hit);
    }
}

function renderStatus(pts, an) {
  const t = L();
  let bg, fg, title, sub;
  if (pts.length < 3) { bg = '#f1f5f9'; fg = '#475569'; title = t.st_addT; sub = t.st_addS; }
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

  document.documentElement.lang = t.htmlLang;
  document.title = t.docTitle;

  $('title').textContent = t.title;
  $('intro').textContent = t.intro;
  $('langBtn').textContent = t.langBtn;
  $('resetBtn').textContent = t.resetBtn;
  $('legPlaced').textContent = t.legendPlaced;
  $('legMatch').textContent = t.legendMatch;
  $('labPoints').textContent = t.points;
  $('labTris').textContent = t.triangles;
  $('labGroups').textContent = t.clashes;

  $('statPoints').textContent = pts.length;
  $('statTris').textContent = an.total;
  $('statGroups').textContent = an.groups.length;

  renderStatus(pts, an);
  renderBoard(pts, an);
}

/* ---------------- 7. Wiring ---------------- */

$('langBtn').addEventListener('click', () => {
  state.lang = state.lang === 'ja' ? 'en' : 'ja';
  render();
});
$('resetBtn').addEventListener('click', () => {
  state.active = {};
  render();
});

render();
