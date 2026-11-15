// Billiards on strange tables. A ball moves straight and reflects off the cushion: the angle of incidence equals
// the angle of reflection, d′ = d − 2(d·n)n. Everything else follows from the shape of the table:
//   rectangle — mirror the table instead of the ball, and a bank shot becomes a straight line (unfolding);
//   circle    — every chord makes the same angle with the cushion, so the path is a star or fills a ring;
//   ellipse   — a shot through one focus always comes through the other (the sum of distances is constant);
//   stadium   — two straight sides and two half circles: two almost equal shots part exponentially (chaos).
// The path is computed exactly (ray against the analytic boundary), then the ball is animated along it.

import { Plot2D } from '../views/plot2d.js';
import { COLORS } from '../core/palette.js';
import { t } from '../core/i18n.js';
import { slider, seg, toggle, button, row } from '../ui/kit.js';

const EPS = 1e-7;
const deg = Math.PI / 180;
export const TABLES = {
  rect: { a: 4, b: 2.2 },
  circle: { R: 2.6 },
  ellipse: { a: 4, b: 2.4 },
  stadium: { L: 1.6, r: 2.2 },
};
const FOCUS = Math.sqrt(TABLES.ellipse.a ** 2 - TABLES.ellipse.b ** 2); // 3.2

// ---------- Geometry of the tables ----------

const quad = (A, B, C) => {
  const D = B * B - 4 * A * C;
  if (D < 0 || !A) return [];
  const s = Math.sqrt(D);
  return [(-B - s) / (2 * A), (-B + s) / (2 * A)];
};
const unit = ([x, y]) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };

function circleHits(P, d, c, r) {
  const ox = P[0] - c[0], oy = P[1] - c[1];
  return quad(d[0] ** 2 + d[1] ** 2, 2 * (ox * d[0] + oy * d[1]), ox * ox + oy * oy - r * r).map(tt => {
    const x = P[0] + tt * d[0], y = P[1] + tt * d[1];
    return { t: tt, x, y, n: [(x - c[0]) / r, (y - c[1]) / r] };
  });
}
// The line through Q with unit normal n
function lineHit(P, d, Q, n) {
  const dn = d[0] * n[0] + d[1] * n[1];
  if (Math.abs(dn) < 1e-12) return [];
  const tt = ((Q[0] - P[0]) * n[0] + (Q[1] - P[1]) * n[1]) / dn;
  return [{ t: tt, x: P[0] + tt * d[0], y: P[1] + tt * d[1], n }];
}

// All the places where the ray P + t·d meets the cushion, with the normal there
function wallHits(kind, P, d) {
  if (kind === 'rect') {
    const { a, b } = TABLES.rect;
    return [
      ...lineHit(P, d, [a, 0], [1, 0]), ...lineHit(P, d, [-a, 0], [1, 0]),
      ...lineHit(P, d, [0, b], [0, 1]), ...lineHit(P, d, [0, -b], [0, 1]),
    ].filter(h => Math.abs(h.x) <= a + 1e-9 && Math.abs(h.y) <= b + 1e-9);
  }
  if (kind === 'circle') return circleHits(P, d, [0, 0], TABLES.circle.R);
  if (kind === 'ellipse') {
    const { a, b } = TABLES.ellipse, [x, y] = P;
    return quad((d[0] / a) ** 2 + (d[1] / b) ** 2, 2 * (x * d[0] / a ** 2 + y * d[1] / b ** 2), (x / a) ** 2 + (y / b) ** 2 - 1).map(tt => {
      const X = x + tt * d[0], Y = y + tt * d[1];
      return { t: tt, x: X, y: Y, n: unit([X / a ** 2, Y / b ** 2]) };
    });
  }
  const { L, r } = TABLES.stadium;
  return [
    ...[...lineHit(P, d, [0, r], [0, 1]), ...lineHit(P, d, [0, -r], [0, 1])].filter(h => Math.abs(h.x) <= L),
    ...circleHits(P, d, [L, 0], r).filter(h => h.x >= L),
    ...circleHits(P, d, [-L, 0], r).filter(h => h.x <= -L),
  ];
}

export function inside(kind, [x, y], m = 0) {
  if (kind === 'rect') return Math.abs(x) < TABLES.rect.a - m && Math.abs(y) < TABLES.rect.b - m;
  if (kind === 'circle') return Math.hypot(x, y) < TABLES.circle.R - m;
  if (kind === 'ellipse') return (x / (TABLES.ellipse.a - m)) ** 2 + (y / (TABLES.ellipse.b - m)) ** 2 < 1;
  const { L, r } = TABLES.stadium;
  return Math.hypot(Math.max(0, Math.abs(x) - L), y) < r - m;
}

function outline(kind, n = 240) {
  if (kind === 'rect') { const { a, b } = TABLES.rect; return [[-a, -b], [a, -b], [a, b], [-a, b], [-a, -b]]; }
  if (kind === 'circle') return Array.from({ length: n + 1 }, (_, i) => [TABLES.circle.R * Math.cos(2 * Math.PI * i / n), TABLES.circle.R * Math.sin(2 * Math.PI * i / n)]);
  if (kind === 'ellipse') return Array.from({ length: n + 1 }, (_, i) => [TABLES.ellipse.a * Math.cos(2 * Math.PI * i / n), TABLES.ellipse.b * Math.sin(2 * Math.PI * i / n)]);
  const { L, r } = TABLES.stadium, pts = [];
  for (let i = 0; i <= n / 2; i++) { const th = -Math.PI / 2 + Math.PI * i / (n / 2); pts.push([L + r * Math.cos(th), r * Math.sin(th)]); }
  for (let i = 0; i <= n / 2; i++) { const th = Math.PI / 2 + Math.PI * i / (n / 2); pts.push([-L + r * Math.cos(th), r * Math.sin(th)]); }
  pts.push(pts[0]);
  return pts;
}

// A segment obstacle A–B: where the ray meets it
function segHit(P, d, [A, B]) {
  const ex = B[0] - A[0], ey = B[1] - A[1], den = d[0] * ey - d[1] * ex;
  if (Math.abs(den) < 1e-12) return null;
  const wx = A[0] - P[0], wy = A[1] - P[1];
  const tt = (wx * ey - wy * ex) / den, u = (wx * d[1] - wy * d[0]) / den;
  return u >= 0 && u <= 1 && tt > EPS ? { t: tt, x: P[0] + tt * d[0], y: P[1] + tt * d[1] } : null;
}

// The whole path of one shot: points where it turns; it ends in the target, in an obstacle or after `bounces`
export function trace(kind, P0, angle, { bounces = 12, obstacles = [], target = null } = {}) {
  let P = [...P0], d = [Math.cos(angle * deg), Math.sin(angle * deg)];
  const pts = [[...P]];
  let end = 'done', cushions = 0;
  for (let k = 0; k < bounces + 1; k++) {
    const hits = wallHits(kind, P, d).filter(h => h.t > EPS);
    if (!hits.length) { end = 'lost'; break; }
    const w = hits.reduce((a, b) => (b.t < a.t ? b : a));
    const ob = obstacles.map(s => segHit(P, d, s)).filter(Boolean).reduce((a, b) => (!a || b.t < a.t ? b : a), null);
    const tg = target ? circleHits(P, d, target.c, target.r).filter(h => h.t > EPS).reduce((a, b) => (!a || b.t < a.t ? b : a), null) : null;
    if (tg && tg.t < w.t && (!ob || tg.t < ob.t)) { pts.push([tg.x, tg.y]); end = 'target'; break; }
    if (ob && ob.t < w.t) { pts.push([ob.x, ob.y]); end = 'obstacle'; break; }
    if (k === bounces) { pts.push([P[0] + d[0] * w.t, P[1] + d[1] * w.t]); break; }
    P = [w.x, w.y];
    const dn = d[0] * w.n[0] + d[1] * w.n[1];
    d = unit([d[0] - 2 * dn * w.n[0], d[1] - 2 * dn * w.n[1]]);
    pts.push([...P]);
    cushions++;
  }
  // Arc length at every corner: the ball is put on the path by length
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, len, total: len[len.length - 1], end, cushions };
}

export function posAt(path, s) {
  const { pts, len } = path;
  if (s >= path.total) return [pts[pts.length - 1], pts.length - 1];
  let i = 1;
  while (len[i] < s) i++;
  const k = (s - len[i - 1]) / (len[i] - len[i - 1] || 1);
  return [[pts[i - 1][0] + k * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + k * (pts[i][1] - pts[i - 1][1])], i - 1];
}

// The step around the circle between two bounces, in degrees (the same for all bounces of a circle path)
export function circleStep(path) {
  const a = path.pts.slice(1, -1).map(([x, y]) => Math.atan2(y, x) / deg);
  return a.slice(1).map((v, i) => ((v - a[i]) % 360 + 360) % 360);
}

// ---------- Unfolding of the rectangle: copy (i, j) of the table, mirrored when i or j is odd ----------
const mirror = ([x, y], i, j) => {
  const { a, b } = TABLES.rect;
  return [2 * a * i + (i % 2 ? -x : x), 2 * b * j + (j % 2 ? -y : y)];
};

// ---------- The world ----------

const TWIN = 0.01; // degrees between a shot and its twin
const VIEW = {
  rect: { cx: 0, cy: 0, unit: 90, grid: false, fit: [9.2, 5.8] },
  circle: { cx: 0, cy: 0, unit: 90, grid: false, fit: [6.4, 6.4] },
  ellipse: { cx: 0, cy: 0, unit: 90, grid: false, fit: [9.2, 6] },
  stadium: { cx: 0, cy: 0, unit: 90, grid: false, fit: [8.8, 5.6] },
  unfold: { cx: 0, cy: 0, unit: 90, grid: false, fit: [41, 23.5] },
};

const TXT = {
  shoot: { en: 'Shoot', ru: 'Удар' },
  stop: { en: 'Stop', ru: 'Стоп' },
  table: { en: 'Table', ru: 'Стол' },
  rect: { en: 'Rectangle', ru: 'Прямоугольник' },
  circle: { en: 'Circle', ru: 'Круг' },
  ellipse: { en: 'Ellipse', ru: 'Эллипс' },
  stadium: { en: 'Stadium', ru: 'Стадион' },
  unfold: { en: 'Unfolding', ru: 'Развёртка' },
  foci: { en: 'Foci', ru: 'Фокусы' },
  twin: { en: 'Twin ball', ru: 'Двойник' },
  preview: { en: 'Show the path', ru: 'Показать путь' },
  angle: '\\text{angle}',
  angleRu: '\\text{угол}',
  bounces: { en: 'Bounces', ru: 'Отскоков' },
  apart: { en: 'Twin is apart by', ru: 'Двойник отстал на' },
  step: { en: 'Step around the circle', ru: 'Шаг по кругу' },
  hudAim: {
    en: 'Drag anywhere to aim · drag the ball to move it · fine angle — the slider',
    ru: 'Тяните в любом месте — прицел · тяните шар — переставить · точный угол — ползунок',
  },
  hudFixed: { en: 'Drag anywhere to aim · fine angle — the slider', ru: 'Тяните в любом месте — прицел · точный угол — ползунок' },
};

const MODES = [
  {
    id: 'free',
    title: { en: 'Four tables', ru: 'Четыре стола' },
    text: {
      en: 'One rule for every table: the ball goes straight and leaves the cushion at the same angle it came in. Change only the shape — and the behaviour changes completely. On the <b>rectangle</b> switch on the unfolding: instead of reflecting the ball, reflect the table, and the path becomes a straight line. On the <b>circle</b> the path never comes closer to the centre than one fixed distance: all its chords touch one inner circle. On the <b>ellipse</b> shoot through a focus. On the <b>stadium</b> launch a twin with an angle only $0.01°$ different and watch the distance between them.',
      ru: 'Одно правило для всех столов: шар идёт по прямой и отскакивает от борта под тем же углом, под которым пришёл. Меняется только форма — и поведение меняется целиком. На <b>прямоугольнике</b> включите развёртку: вместо того чтобы отражать шар, отразим стол — и путь станет прямой. На <b>круге</b> путь никогда не подходит к центру ближе одного расстояния: все его хорды касаются одной внутренней окружности. На <b>эллипсе</b> ударьте через фокус. На <b>стадионе</b> запустите двойника с углом всего на $0.01°$ другим и следите за расстоянием между ними.',
    },
  },
  {
    id: 'bank',
    title: { en: 'Off two cushions', ru: 'От двух бортов' },
    text: {
      en: 'A partition stands in the middle of the table. Hit the target bouncing off <b>exactly two</b> cushions, not touching the partition. Guessing the angle is hard. Switch on the unfolding: every mirror copy of the target is a straight-line aim, and a copy two tables away means two cushions.',
      ru: 'Посреди стола стоит перегородка. Попадите в цель, отскочив <b>ровно от двух</b> бортов и не задев перегородку. Угадать угол трудно. Включите развёртку: каждая зеркальная копия цели — это прицел по прямой, а копия через два стола — это два борта.',
    },
    goal: { en: 'Hit the target after exactly 2 cushions.', ru: 'Попасть в цель ровно через 2 борта.' },
    after: {
      en: 'The straight line to a mirror copy of the target folds back into the real path: each time the line crosses an edge of a copy, the real ball bounces. That is how billiard players and light in a periscope «see» around corners.',
      ru: 'Прямая к зеркальной копии цели складывается обратно в настоящий путь: каждый раз, когда прямая пересекает край копии, настоящий шар отскакивает. Так бильярдисты и свет в перископе «видят» за угол.',
    },
  },
  {
    id: 'focus',
    title: { en: 'The whispering ellipse', ru: 'Шепчущий эллипс' },
    text: {
      en: 'The ball stands at the focus $F_1$ of the ellipse, the target at the other focus $F_2$, and a partition blocks the straight way. Hit the target three times, aiming in three clearly different directions (at least $15°$ apart).',
      ru: 'Шар стоит в фокусе $F_1$ эллипса, цель — в другом фокусе $F_2$, а прямой путь закрывает перегородка. Попадите в цель три раза, целясь в три заметно разных направления (не ближе $15°$ друг к другу).',
    },
    goal: { en: 'Three hits from three directions.', ru: 'Три попадания с трёх направлений.' },
    after: {
      en: 'Any direction works. For every point of the ellipse $|PF_1| + |PF_2|$ is the same, so the lines to the foci make equal angles with the cushion — exactly the law of reflection. In «whispering galleries» with an elliptic ceiling, a whisper at one focus is heard at the other.',
      ru: 'Подходит любое направление. Для каждой точки эллипса $|PF_1| + |PF_2|$ одно и то же, поэтому прямые к фокусам составляют с бортом равные углы — ровно закон отражения. В «шепчущих галереях» с эллиптическим сводом шёпот в одном фокусе слышен в другом.',
    },
  },
  {
    id: 'star',
    title: { en: 'A star on the circle', ru: 'Звезда на круге' },
    text: {
      en: 'On a round table the ball steps around the circle by the same angle $\\Delta$ at every bounce. Make the path a five-pointed star — a pentagram: put the ball and choose the angle.',
      ru: 'На круглом столе шар на каждом отскоке шагает по кругу на один и тот же угол $\\Delta$. Сделайте путь пятиконечной звездой — пентаграммой: поставьте шар и подберите угол.',
    },
    goal: { en: 'A closed pentagram: $\\Delta = 144°$ (within $0.6°$).', ru: 'Замкнутая пентаграмма: $\\Delta = 144°$ (с точностью $0.6°$).' },
    after: {
      en: 'Five steps of $144°$ make $720°$ — two full turns, and the path closes. If $\\Delta / 360°$ is a fraction $p/q$, the path closes after $q$ bounces; if it is irrational, the path never closes and fills a whole ring.',
      ru: 'Пять шагов по $144°$ — это $720°$, два полных оборота, и путь замыкается. Если $\\Delta / 360°$ — дробь $p/q$, путь замкнётся через $q$ отскоков; если число иррационально, путь не замкнётся никогда и заполнит целое кольцо.',
    },
  },
  {
    id: 'calm',
    title: { en: 'Calm inside chaos', ru: 'Покой внутри хаоса' },
    text: {
      en: 'In the stadium the twin starts $0.01°$ apart — and usually after $30$ bounces the two balls are in different corners: the error doubles again and again. But some paths are not afraid of chaos. Find a shot after which the twin is still within $0.05$ after $30$ bounces.',
      ru: 'На стадионе двойник стартует с отличием $0.01°$ — и обычно через $30$ отскоков шары в разных углах: ошибка удваивается снова и снова. Но некоторые пути хаоса не боятся. Найдите удар, после которого через $30$ отскоков двойник отстаёт меньше чем на $0.05$.',
    },
    goal: { en: 'Twin apart by less than 0.05 after 30 bounces.', ru: 'Двойник ближе 0.05 после 30 отскоков.' },
    after: {
      en: 'Bouncing straight up and down between the flat sides: there the cushions are parallel and an error grows only linearly. Almost every other path of the stadium is chaotic (Bunimovich, 1974) — the curved ends spread neighbouring paths apart. This is why weather cannot be predicted for a month: a tiny error grows the same way.',
      ru: 'Отскоки строго вверх-вниз между прямыми бортами: там борта параллельны, и ошибка растёт лишь линейно. Почти все остальные пути стадиона хаотичны (Бунимович, 1974) — закруглённые концы разводят соседние пути. Поэтому погоду нельзя предсказать на месяц: маленькая ошибка растёт так же.',
    },
  },
];

export default {
  modes: MODES,

  mount(ui) {
    const S = {
      kind: 'rect', ball: [-2.4, -0.9], angle: 24, bounces: 14, speed: 7,
      unfold: false, foci: false, twin: false, preview: false,
      obstacles: [], target: null, fixed: false,
      shot: null, twinShot: null, s: 0, playing: false, mode: 'free', hits: [],
    };
    const plot = new Plot2D(ui.host, p => draw(p), { ...VIEW.rect });
    let raf = 0, last = 0, angleCtl = null;

    const view = () => plot.setView({ ...(S.unfold && S.kind === 'rect' ? VIEW.unfold : VIEW[S.kind]) }, 700);
    const opts = () => ({ bounces: S.bounces, obstacles: S.obstacles, target: S.target });

    function shoot() {
      S.shot = trace(S.kind, S.ball, S.angle, opts());
      S.twinShot = S.twin ? trace(S.kind, S.ball, S.angle + TWIN, { ...opts(), target: null }) : null;
      S.s = 0;
      S.playing = true;
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
      ui.status('');
    }
    // Any change of the setup cancels the shot in flight
    function clearShot() { S.shot = null; S.twinShot = null; S.playing = false; cancelAnimationFrame(raf); }
    function stop() { S.playing = false; cancelAnimationFrame(raf); plot.request(); report(); }
    function tick(now) {
      if (!S.shot || !S.playing) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      S.s += S.speed * dt * (1 + S.shot.cushions / 25); // long runs speed up a little
      if (S.s >= S.shot.total) { S.s = S.shot.total; S.playing = false; plot.request(); report(); finished(); return; }
      plot.request();
      report();
      raf = requestAnimationFrame(tick);
    }

    // Distance between the ball and its twin when the ball has gone the same length
    const apart = s => {
      if (!S.twinShot) return null;
      const [a] = posAt(S.shot, s), [b] = posAt(S.twinShot, Math.min(s, S.twinShot.total));
      return Math.hypot(a[0] - b[0], a[1] - b[1]);
    };

    function report() {
      const rows = [[t({ en: 'Angle', ru: 'Угол' }), `${S.angle.toFixed(2)}°`]];
      if (S.shot) {
        const [, i] = posAt(S.shot, S.s);
        rows.push([t(TXT.bounces), String(Math.min(i, S.shot.cushions))]);
        const d = apart(S.s);
        if (d !== null) rows.push([t(TXT.apart), d < 1e-4 ? d.toExponential(1) : d.toFixed(4)]);
        if (S.kind === 'circle' && S.shot.cushions >= 2) rows.push([t(TXT.step), `${circleStep(S.shot)[0].toFixed(2)}°`]);
      }
      ui.readout(rows);
    }

    // ---- What the challenge says after a shot ----
    function finished() {
      const sh = S.shot, m = S.mode;
      if (m === 'bank') {
        if (sh.end === 'target' && sh.cushions === 2) return ui.solve('bank', t({ en: 'Two cushions, straight into the target.', ru: 'Два борта — и точно в цель.' }));
        if (sh.end === 'target') return ui.status(t({ en: `A hit, but after ${sh.cushions} cushion(s) — exactly 2 are needed.`, ru: `Попадание, но через ${sh.cushions} — нужно ровно 2 борта.` }), 'fail');
        if (sh.end === 'obstacle') return ui.status(t({ en: 'The ball hit the partition. In the unfolding, the partition has copies too: aim at a copy of the target that no copy of the partition hides.', ru: 'Шар врезался в перегородку. В развёртке у перегородки тоже есть копии: цельтесь в копию цели, которую не закрывает ни одна копия перегородки.' }), 'fail');
        return ui.status(t({ en: 'Missed. Switch on the unfolding and aim at a copy of the target two tables away.', ru: 'Мимо. Включите развёртку и цельтесь в копию цели через два стола.' }), 'fail');
      }
      if (m === 'focus') {
        if (sh.end === 'obstacle') return ui.status(t({ en: 'The partition is in the way of this direction. Try another one.', ru: 'В этом направлении мешает перегородка. Попробуйте другое.' }), 'fail');
        if (sh.end !== 'target') return ui.status(t({ en: 'Missed?! Strange — check the angle.', ru: 'Мимо?! Странно — проверьте угол.' }), 'fail');
        if (!sh.cushions) return ui.status(t({ en: 'Straight past the partition — that does not count: the ball must bounce off the cushion.', ru: 'Мимо перегородки напрямую — не считается: шар должен отскочить от борта.' }), 'fail');
        const a = ((S.angle % 360) + 360) % 360;
        const far = S.hits.every(h => Math.min(Math.abs(h - a), 360 - Math.abs(h - a)) >= 15);
        if (far) S.hits.push(a);
        if (S.hits.length >= 3) return ui.solve('focus', t({ en: `Hits at ${S.hits.map(h => `${h.toFixed(0)}°`).join(', ')}.`, ru: `Попадания под ${S.hits.map(h => `${h.toFixed(0)}°`).join(', ')}.` }));
        return ui.status(t({
          en: far ? `A hit! Different directions: ${S.hits.length} of 3.` : `A hit, but too close to a direction you already used (${S.hits.length} of 3).`,
          ru: far ? `Попадание! Разных направлений: ${S.hits.length} из 3.` : `Попадание, но слишком близко к уже использованному направлению (${S.hits.length} из 3).`,
        }), 'progress');
      }
      if (m === 'star') {
        const st = circleStep(sh);
        if (!st.length) return;
        const D = st[0], ok = Math.min(Math.abs(D - 144), Math.abs(D - 216)) < 0.6;
        if (ok) return ui.solve('star', t({ en: `$\\Delta = ${D.toFixed(2)}°$.`, ru: `$\\Delta = ${D.toFixed(2)}°$.` }));
        return ui.status(t({
          en: `$\\Delta = ${D.toFixed(1)}°$, and a pentagram needs $144°$ (or $216°$ — the same star the other way round). Hint: $\\Delta$ depends only on how close to the centre the line of the shot passes — the closer, the bigger the step.`,
          ru: `$\\Delta = ${D.toFixed(1)}°$, а пентаграмме нужно $144°$ (или $216°$ — та же звезда в обратную сторону). Подсказка: $\\Delta$ зависит только от того, насколько близко к центру проходит линия удара: чем ближе, тем больше шаг.`,
        }), 'fail');
      }
      if (m === 'calm') {
        const d = apart(sh.total);
        if (sh.cushions >= 30 && d < 0.05) return ui.solve('calm', t({ en: `After 30 bounces the twin is ${d.toFixed(4)} away.`, ru: `Через 30 отскоков двойник в ${d.toFixed(4)}.` }));
        return ui.status(t({ en: `The twin is ${d.toFixed(2)} away — this path is chaotic. Which part of the stadium does not spread paths apart?`, ru: `Двойник в ${d.toFixed(2)} — этот путь хаотичен. Какая часть стадиона не разводит пути?` }), 'fail');
      }
    }

    // ---- Drawing ----
    function drawTable(p, kind, at = (P => P), alpha = 1) {
      const pts = outline(kind).map(at);
      if (alpha === 1) p.fill(pts, 'rgba(182,157,248,0.06)');
      p.polyline(pts, alpha === 1 ? COLORS.purple : `rgba(182,157,248,${alpha})`, alpha === 1 ? 3 : 1.2);
    }

    function trail(p, path, s, color, width) {
      const [pos, i] = posAt(path, s), n = i + 1;
      for (let k = 0; k < n; k++) {
        const a = path.pts[k], b = k === i ? pos : path.pts[k + 1];
        const age = n - 1 - k, alpha = Math.max(0.12, 1 - age / 26);
        p.line(...a, ...b, color.replace('A', alpha.toFixed(2)), { width });
      }
      return pos;
    }

    function draw(p) {
      const unfold = S.unfold && S.kind === 'rect';
      if (unfold) {
        for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
          if (!i && !j) continue;
          drawTable(p, 'rect', P => mirror(P, i, j), 0.35);
          if (S.target) p.ring(...mirror(S.target.c, i, j), Math.abs(i) + Math.abs(j) === 2 ? COLORS.orange : 'rgba(255,159,90,0.55)', 6);
          S.obstacles.forEach(([A, B]) => p.line(...mirror(A, i, j), ...mirror(B, i, j), 'rgba(139,149,167,0.5)', { width: 2 }));
        }
      }
      drawTable(p, S.kind);
      S.obstacles.forEach(([A, B]) => p.line(...A, ...B, '#8b95a7', { width: 4 }));
      if (S.kind === 'ellipse' && (S.foci || S.mode === 'focus')) {
        [[-FOCUS, 0, 'F_1'], [FOCUS, 0, 'F_2']].forEach(([x, y, n]) => { p.dot(x, y, COLORS.teal, 4.5); p.tex(`f${n}`, n, x, y, COLORS.teal, { dx: -8, dy: 18 }); });
      }
      if (S.target) {
        p.ring(...S.target.c, COLORS.orange, S.target.r * p.u);
        p.dot(...S.target.c, COLORS.orange, 3);
      }

      // The aim: dashed to the first cushion; with the unfolding — the whole straight line through the copies
      const d = [Math.cos(S.angle * deg), Math.sin(S.angle * deg)];
      if (!S.playing) {
        if (unfold) p.line(...S.ball, S.ball[0] + 60 * d[0], S.ball[1] + 60 * d[1], 'rgba(244,211,94,0.55)', { width: 1.5, dash: [7, 6] });
        if (S.preview && !unfold) {
          const pv = trace(S.kind, S.ball, S.angle, opts());
          p.polyline(pv.pts, 'rgba(244,211,94,0.28)', 1.2);
        } else {
          const first = trace(S.kind, S.ball, S.angle, { ...opts(), bounces: 0 });
          p.line(...first.pts[0], ...first.pts[1], 'rgba(244,211,94,0.6)', { width: 1.5, dash: [7, 6] });
        }
      }

      let pos = S.ball;
      if (S.shot) {
        // A circle path never comes closer to the centre than one distance: the ring its chords touch
        if (S.kind === 'circle' && S.shot.cushions) {
          const a = S.shot.pts[0], b = S.shot.pts[1], rho = Math.abs(a[0] * b[1] - a[1] * b[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
          p.polyline(Array.from({ length: 121 }, (_, i) => [rho * Math.cos(i * Math.PI / 60), rho * Math.sin(i * Math.PI / 60)]), 'rgba(92,208,179,0.35)', 1.2);
        }
        if (S.twinShot) { const q = trail(p, S.twinShot, Math.min(S.s, S.twinShot.total), 'rgba(252,98,85,A)', 1.4); p.dot(...q, COLORS.red, 6); }
        pos = trail(p, S.shot, S.s, 'rgba(244,211,94,A)', 2);
        if (unfold && S.s > 0) {
          // The same shot in the unfolded plane: a straight line of the same length
          const L = S.s;
          p.line(...S.shot.pts[0], S.shot.pts[0][0] + L * d[0], S.shot.pts[0][1] + L * d[1], 'rgba(244,211,94,0.9)', { width: 1.4 });
        }
        if (S.twinShot) chart(p);
      }
      // The ball where it is now; before the next shot also the start, which can be dragged
      if (S.shot) p.dot(...pos, '#ffffff', 7);
      if (!S.playing) {
        if (S.fixed) p.dot(...S.ball, S.shot ? 'rgba(255,255,255,0.45)' : '#ffffff', 7);
        else p.handle(...S.ball, '#ffffff', (x, y) => { if (inside(S.kind, [x, y], 0.08)) { S.ball = [x, y]; clearShot(); report(); plot.request(); } });
      }
      if (!S.playing) p.pen = pts => {
        const [x, y] = pts[pts.length - 1];
        if (Math.hypot(x - S.ball[0], y - S.ball[1]) < 0.05) return;
        S.angle = ((Math.atan2(y - S.ball[1], x - S.ball[0]) / deg) % 360 + 360) % 360;
        if (angleCtl) angleCtl.set(S.angle);
        clearShot();
        report();
        plot.request();
      };
    }

    // log₁₀ of the distance to the twin after each bounce, in the top right corner
    function chart(p) {
      const ctx = p.ctx, W = 170, H = 70, x0 = p.w - W - 14, y0 = 14;
      const cut = S.shot.len.filter(l => l <= S.s);
      const ds = cut.map(l => apart(l)).filter(v => v !== null).map(v => Math.log10(Math.max(v, 1e-6)));
      ctx.fillStyle = 'rgba(13,17,23,0.85)';
      ctx.fillRect(x0, y0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeRect(x0 + 0.5, y0 + 0.5, W - 1, H - 1);
      const n = Math.max(30, S.shot.cushions), sy = v => y0 + H - 8 - (v + 6) / 7 * (H - 16);
      ctx.beginPath();
      ds.forEach((v, i) => { const x = x0 + 8 + (W - 16) * i / n, y = sy(v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = '#8b95a7';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(t({ en: 'log distance to twin', ru: 'log расстояния до двойника' }), x0 + 8, y0 + 14);
    }

    // ---- Controls for each mode ----
    function controls({ table = false, toggles = [], bounces = false }) {
      const c = ui.controls;
      c.innerHTML = '';
      if (table) {
        c.appendChild(row(seg(['rect', 'circle', 'ellipse', 'stadium'].map(id => ({ id, label: t(TXT[id]) })), S.kind, k => {
          S.kind = k; clearShot();
          if (!inside(k, S.ball, 0.1)) S.ball = k === 'ellipse' ? [-FOCUS, 0] : [-1, -0.6];
          view(); plot.request(); report();
        })));
      }
      angleCtl = slider({ label: t({ en: TXT.angle, ru: TXT.angleRu }), min: 0, max: 360, step: 0.05, value: S.angle, format: v => `${v.toFixed(2)}°`, onInput: v => { S.angle = v; clearShot(); plot.request(); report(); } });
      c.appendChild(angleCtl.el);
      if (bounces) {
        c.appendChild(slider({ label: t({ en: '\\text{bounces}', ru: '\\text{отскоков}' }), min: 1, max: 300, step: 1, value: S.bounces, format: v => String(v), onInput: v => { S.bounces = v; } }).el);
        c.appendChild(slider({ label: t({ en: '\\text{speed}', ru: '\\text{скорость}' }), min: 1, max: 40, step: 1, value: S.speed, format: v => String(v), onInput: v => { S.speed = v; } }).el);
      }
      const tg = toggles.map(k => toggle(t(TXT[k]), S[k], on => {
        S[k] = on;
        if (k === 'unfold') view();
        if (k === 'foci' && on && S.kind === 'ellipse') { S.ball = [-FOCUS, 0]; clearShot(); }
        plot.request();
      }));
      c.appendChild(row(button(t(TXT.shoot), shoot, { primary: true }), button(t(TXT.stop), stop), ...tg));
    }

    return {
      setMode(id) {
        stop();
        Object.assign(S, { mode: id, shot: null, twinShot: null, s: 0, obstacles: [], target: null, fixed: false, hits: [], unfold: false, foci: false, twin: false, preview: false });
        if (id === 'free') {
          Object.assign(S, { kind: 'rect', ball: [-2.4, -0.9], angle: 24, bounces: 14 });
          controls({ table: true, toggles: ['unfold', 'foci', 'twin', 'preview'], bounces: true });
        } else if (id === 'bank') {
          Object.assign(S, { kind: 'rect', ball: [-3, -1.2], angle: 10, bounces: 6, fixed: true, obstacles: [[[0, -0.6], [0, 2.2]]], target: { c: [3, 1.3], r: 0.24 } });
          controls({ toggles: ['unfold'] });
        } else if (id === 'focus') {
          Object.assign(S, { kind: 'ellipse', ball: [-FOCUS, 0], angle: 60, bounces: 4, fixed: true, foci: true, obstacles: [[[0, -0.9], [0, 0.9]]], target: { c: [FOCUS, 0], r: 0.2 } });
          controls({});
        } else if (id === 'star') {
          Object.assign(S, { kind: 'circle', ball: [-1.2, -0.4], angle: 30, bounces: 10 });
          controls({});
        } else if (id === 'calm') {
          Object.assign(S, { kind: 'stadium', ball: [-1.2, 0.3], angle: 37, bounces: 30, twin: true });
          controls({});
        }
        ui.hud(t(S.fixed ? TXT.hudFixed : TXT.hudAim));
        view();
        plot.request();
        report();
      },
      dispose() { cancelAnimationFrame(raf); plot.dispose(); },
    };
  },
};
