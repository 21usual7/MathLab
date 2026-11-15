// Descent in the fog. A walker on a landscape z = f(x, y) does not see the map — it only feels the slope
// underfoot: the gradient ∇f points uphill, so a step goes the other way, p ← p − η∇f(p). How long the step η is
// decides everything: in a narrow canyon a long step throws the walker from wall to wall (and out of the map),
// a short one crawls along the bottom. Inertia (momentum, p ← p + v, v ← βv − η∇f) smooths the zigzag.
// In the fog the walker finds only the bottom of the valley it started in — a local minimum.

import * as THREE from 'three';
import { Plot3D } from '../views/plot3d.js';
import { COLORS } from '../core/palette.js';
import { t } from '../core/i18n.js';
import { slider, seg, toggle, button, row } from '../ui/kit.js';
import { R, hills, LANDS, grad, lowest } from './terrain.js';

const ZMAX = 4;

const TXT = {
  step: { en: 'Step', ru: 'Шаг' },
  run: { en: '▶ Descend', ru: '▶ Спуск' },
  restart: { en: 'New start', ru: 'Новый старт' },
  fog: { en: 'Fog', ru: 'Туман' },
  reseed: { en: 'Other hills', ru: 'Другие холмы' },
  canyon: { en: 'Canyon', ru: 'Каньон' },
  hills: { en: 'Hills', ru: 'Холмы' },
  banana: { en: 'Banana', ru: 'Банан' },
  eggs: { en: 'Egg box', ru: 'Ячейки' },
  hud: { en: 'Click the landscape to drop the walker · drag to turn the view', ru: 'Щёлкните по ландшафту — сбросить туда путника · тяните — повернуть вид' },
  hudFixed: { en: 'Drag to turn the view · the walker starts at the yellow point', ru: 'Тяните — повернуть вид · путник стартует в жёлтой точке' },
  hudFog: { en: 'Click anywhere to parachute the walker into the fog · only explored ground is visible', ru: 'Щёлкните где угодно — путник спустится на парашюте в туман · видна только исследованная земля' },
};

const CANYON_START = [-3.5, 1.2];

const MODES = [
  {
    id: 'free',
    title: { en: 'Feel the slope', ru: 'Почувствуйте наклон' },
    text: {
      en: 'The green arrow is $-\\nabla f$: the direction where the ground falls fastest, always across the level lines. A step of gradient descent is $p \\leftarrow p - \\eta\\,\\nabla f(p)$: on a steep place the step is long, on a flat one short, at the bottom it is zero. Drop the walker anywhere, change the step $\\eta$ and the inertia $\\beta$, compare the landscapes. The canyon is narrow across and long along — watch what a big $\\eta$ does there. In the egg box count how many bottoms there are.',
      ru: 'Зелёная стрелка — это $-\\nabla f$: направление, куда земля уходит вниз быстрее всего, всегда поперёк линий уровня. Шаг градиентного спуска — $p \\leftarrow p - \\eta\\,\\nabla f(p)$: на крутом месте шаг длинный, на пологом короткий, на дне — нулевой. Сбросьте путника куда угодно, меняйте шаг $\\eta$ и инерцию $\\beta$, сравнивайте ландшафты. Каньон узкий поперёк и длинный вдоль — посмотрите, что там делает большое $\\eta$. В ячейках посчитайте, сколько там днищ.',
    },
  },
  {
    id: 'canyon',
    title: { en: 'Bottom of the canyon in 14 steps', ru: 'Дно каньона за 14 шагов' },
    text: {
      en: 'The walker starts at the yellow point of the canyon $z = \\frac{x^2 + 9y^2}{10}$. Choose one step length $\\eta$ so that within $14$ steps the height falls below $0.01$. A long step bounces across the canyon, a short one crawls along it — there is a narrow window between them.',
      ru: 'Путник стартует в жёлтой точке каньона $z = \\frac{x^2 + 9y^2}{10}$. Подберите одну длину шага $\\eta$, чтобы за $14$ шагов высота стала меньше $0.01$. Длинный шаг скачет поперёк каньона, короткий ползёт вдоль — между ними узкое окно.',
    },
    goal: { en: 'Height below 0.01 in at most 14 steps, without inertia.', ru: 'Высота меньше 0.01 не больше чем за 14 шагов, без инерции.' },
    after: {
      en: 'Across the canyon the walls are $9$ times steeper than along it. A step multiplies $y$ by $1 - 1.8\\eta$ and $x$ by $1 - 0.2\\eta$: for $\\eta > \\frac{2}{1.8} \\approx 1.11$ the walls throw the walker out, and for a small $\\eta$ the factor $1 - 0.2\\eta$ is almost $1$. The best $\\eta = \\frac{2}{0.2 + 1.8} = 1$ balances the two. The ratio $9$ is the <i>condition number</i>: the bigger it is, the slower plain descent is — the everyday trouble of training neural networks.',
      ru: 'Поперёк каньона стенки в $9$ раз круче, чем вдоль. Шаг умножает $y$ на $1 - 1.8\\eta$, а $x$ — на $1 - 0.2\\eta$: при $\\eta > \\frac{2}{1.8} \\approx 1.11$ стенки выбрасывают путника, а при малом $\\eta$ множитель $1 - 0.2\\eta$ почти $1$. Лучшее $\\eta = \\frac{2}{0.2 + 1.8} = 1$ уравновешивает оба. Отношение $9$ — это <i>число обусловленности</i>: чем оно больше, тем медленнее обычный спуск — повседневная беда обучения нейросетей.',
    },
  },
  {
    id: 'momentum',
    title: { en: 'Inertia: in 6 steps', ru: 'Инерция: за 6 шагов' },
    text: {
      en: 'Now the walker has inertia: the velocity keeps a part $\\beta$ of the previous one, $v \\leftarrow \\beta v - \\eta\\nabla f$, $p \\leftarrow p + v$. The zigzags across the canyon cancel, and the moves along it add up. Reach the same bottom (height below $0.01$) in at most $6$ steps.',
      ru: 'Теперь у путника есть инерция: скорость хранит долю $\\beta$ прежней, $v \\leftarrow \\beta v - \\eta\\nabla f$, $p \\leftarrow p + v$. Зигзаги поперёк каньона гасят друг друга, а шаги вдоль складываются. Дойдите до того же дна (высота меньше $0.01$) не больше чем за $6$ шагов.',
    },
    goal: { en: 'Height below 0.01 in at most 6 steps.', ru: 'Высота меньше 0.01 не больше чем за 6 шагов.' },
    after: {
      en: 'This is the «heavy ball» of Polyak (1964). With good $\\eta$ and $\\beta$ the error shrinks by $\\frac{\\sqrt{\\kappa} - 1}{\\sqrt{\\kappa} + 1} = \\frac12$ a step instead of $\\frac{\\kappa - 1}{\\kappa + 1} = 0.8$: the square root of the condition number instead of the number itself. Almost every optimiser of neural networks (Adam among them) has such inertia inside.',
      ru: 'Это «тяжёлый шар» Поляка (1964). При хороших $\\eta$ и $\\beta$ ошибка за шаг уменьшается в $\\frac{\\sqrt{\\kappa} - 1}{\\sqrt{\\kappa} + 1} = \\frac12$, а не в $\\frac{\\kappa - 1}{\\kappa + 1} = 0.8$ раза: корень из числа обусловленности вместо самого числа. Почти в каждом оптимизаторе нейросетей (и в Adam) внутри такая инерция.',
    },
  },
  {
    id: 'fog',
    title: { en: 'The lowest valley in the fog', ru: 'Самая низкая долина в тумане' },
    text: {
      en: 'The hills are covered with fog: you see only the ground the walker has already crossed. You have three parachute jumps. After each one the walker descends by itself. Find the lowest valley of the whole map — not just the bottom of the nearest one.',
      ru: 'Холмы укрыты туманом: видна только земля, по которой путник уже прошёл. У вас три прыжка с парашютом. После каждого путник спускается сам. Найдите самую низкую долину всей карты — а не просто дно ближайшей.',
    },
    goal: { en: 'End a descent in the lowest valley (within 0.05 of the lowest height), with 3 jumps.', ru: 'Закончить спуск в самой низкой долине (не выше 0.05 над самой низкой точкой) за 3 прыжка.' },
    after: {
      en: 'Gradient descent knows only the valley it stands in: from every start it rolls to its own local minimum. The map splits into «basins of attraction», and only one of them leads to the lowest point. A long step can jump over a ridge — sometimes to luck. Real searches use many starts, noise (stochastic descent) and inertia for exactly this reason.',
      ru: 'Градиентный спуск знает только ту долину, в которой стоит: из любого старта он скатывается в свой локальный минимум. Карта делится на «бассейны притяжения», и только один ведёт в самую низкую точку. Длинный шаг может перепрыгнуть хребет — иногда к удаче. Настоящие поиски именно поэтому используют много стартов, шум (стохастический спуск) и инерцию.',
    },
  },
];

export default {
  modes: MODES,

  mount(ui) {
    const S = {
      land: 'canyon', f: LANDS.canyon.f, seed: 31, eta: 0.3, beta: 0, fog: false,
      path: [], vel: [0, 0], fixedStart: null, limit: Infinity, jumps: 0, maxJumps: Infinity,
      done: [], reveal: false, mode: 'free', low: null, running: false, out: false,
    };
    let plot = null; // created below, when everything it draws is defined: Plot3D draws its first frame at once
    let timer = 0;

    const cur = () => S.path[S.path.length - 1];
    const height = P => S.f(P[0], P[1]);

    // ---- Moving ----
    function step() {
      const P = cur();
      if (!P || S.out) return false;
      const [gx, gy] = grad(S.f, ...P);
      S.vel = [S.beta * S.vel[0] - S.eta * gx, S.beta * S.vel[1] - S.eta * gy];
      const Q = [P[0] + S.vel[0], P[1] + S.vel[1]];
      S.path.push(Q);
      if (Math.abs(Q[0]) > R || Math.abs(Q[1]) > R || !isFinite(Q[0] + Q[1])) S.out = true;
      plot.request();
      report();
      return true;
    }
    const steps = () => S.path.length - 1;
    const settled = () => S.path.length > 2 && Math.hypot(S.vel[0], S.vel[1]) < 2e-4;

    function run() {
      if (S.running) return stopRun();
      if (!cur()) return;
      // A challenge run is one try with one η: a finished try starts again from the start
      if (S.fixedStart && (steps() >= S.limit || S.out || judgeQuiet())) start(S.fixedStart);
      S.running = true;
      runBtn.label('■');
      const go = () => {
        if (!S.running) return;
        if (!step() || S.out || settled() || steps() >= Math.min(S.limit, 400)) { stopRun(); judge(); return; }
        if (S.mode !== 'free' && S.mode !== 'fog' && judgeQuiet()) { stopRun(); judge(); return; }
        timer = setTimeout(go, S.mode === 'fog' ? 90 : 260);
      };
      go();
    }
    function stopRun() { S.running = false; clearTimeout(timer); if (runBtn) runBtn.label(t(TXT.run)); }

    function start(P) {
      stopRun();
      if (S.fixedStart) P = S.fixedStart;
      if (S.mode === 'fog') {
        if (S.jumps >= S.maxJumps || S.reveal) return;
        S.jumps++;
        S.done.push(S.path);
      }
      S.path = [P];
      S.vel = [0, 0];
      S.out = false;
      plot.request();
      report();
      if (S.mode === 'fog') run();
    }

    // ---- Challenges ----
    const judgeQuiet = () => height(cur()) < 0.01;
    function judge() {
      const P = cur(), z = height(P), k = steps();
      if (S.mode === 'canyon' || S.mode === 'momentum') {
        const limit = S.mode === 'canyon' ? 14 : 6;
        if (z < 0.01 && k <= limit) return ui.solve(S.mode, t({ en: `Height ${z.toFixed(4)}, steps: ${k}, with $\\eta = ${S.eta.toFixed(2)}$${S.beta ? `, $\\beta = ${S.beta.toFixed(2)}$` : ''}.`, ru: `Высота ${z.toFixed(4)}, шагов: ${k}, при $\\eta = ${S.eta.toFixed(2)}$${S.beta ? `, $\\beta = ${S.beta.toFixed(2)}$` : ''}.` }));
        if (S.out) return ui.status(t({ en: 'The walker flew off the map: the step is too long for the steep walls.', ru: 'Путник улетел за край карты: шаг слишком длинный для крутых стенок.' }), 'fail');
        const ys = S.path.map(p => p[1]), zig = ys.slice(-4).every((v, i, a) => !i || Math.sign(v) !== Math.sign(a[i - 1]));
        const big = Math.abs(ys[ys.length - 1]) > 0.2;
        return ui.status(t({
          en: `Steps: ${k}, height ${z.toFixed(3)}. ${zig && big ? 'The walker zigzags across the canyon: the step is too long for its walls.' : 'The walker crawls along the bottom: the step is too short there.'}`,
          ru: `Шагов: ${k}, высота ${z.toFixed(3)}. ${zig && big ? 'Путник скачет поперёк каньона: шаг длинноват для его стенок.' : 'Путник ползёт вдоль дна: там шаг слишком короткий.'}`,
        }), 'fail');
      }
      if (S.mode === 'fog') {
        const best = Math.min(...[...S.done, S.path].map(pa => (pa.length ? height(pa[pa.length - 1]) : Infinity)));
        if (z <= S.low.z + 0.05) { S.reveal = true; plot.request(); return ui.solve('fog', t({ en: `The bottom at height ${z.toFixed(2)} — the lowest of the map.`, ru: `Дно на высоте ${z.toFixed(2)} — самое низкое на карте.` })); }
        if (S.jumps >= S.maxJumps) {
          S.reveal = true; plot.request();
          return ui.status(t({ en: `The jumps are over: your best bottom is ${best.toFixed(2)}, the lowest point of the map is ${S.low.z.toFixed(2)} (red). The fog has lifted — press «Other hills» to try a new map.`, ru: `Прыжки кончились: ваше лучшее дно ${best.toFixed(2)}, а самая низкая точка карты — ${S.low.z.toFixed(2)} (красная). Туман рассеялся — нажмите «Другие холмы», чтобы попробовать новую карту.` }), 'fail');
        }
        return ui.status(t({ en: `A bottom at height ${z.toFixed(2)}. Is it the lowest? Jumps left: ${S.maxJumps - S.jumps}.`, ru: `Дно на высоте ${z.toFixed(2)}. Самое ли низкое? Прыжков осталось: ${S.maxJumps - S.jumps}.` }), 'progress');
      }
    }

    // ---- Drawing ----
    const seen = (x, y) => [...S.done, S.path].some(pa => pa.some(P => (P[0] - x) ** 2 + (P[1] - y) ** 2 < 0.8));
    const lift = (x, y) => S.f(x, y) + 0.06;

    // A step is a hop: an arc over the straight way between two points
    function hops(path) {
      const out = [];
      for (let i = 0; i + 1 < path.length; i++) {
        const [a, b] = [path[i], path[i + 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(4, Math.ceil(L * 10));
        for (let k = i ? 1 : 0; k <= n; k++) {
          const s = k / n, x = a[0] + s * (b[0] - a[0]), y = a[1] + s * (b[1] - a[1]);
          const base = (1 - s) * lift(...a) + s * lift(...b);
          out.push([x, y, Math.max(base + 1.6 * Math.min(1.2, 0.35 * L) * s * (1 - s), lift(x, y))]);
        }
      }
      return out;
    }

    function draw(p) {
      const fogged = S.fog && !S.reveal;
      p.surface('land', fogged ? (x, y) => (seen(x, y) ? S.f(x, y) : NaN) : S.f, LANDS[S.land].color, fogged ? 110 : 80);
      [...S.done].forEach((pa, i) => {
        if (pa.length > 1) p.tube(`old${i}`, hops(pa), '#8b95a7', 0.03);
        if (pa.length) p.sphere(`oldEnd${i}`, [...pa[pa.length - 1], lift(...pa[pa.length - 1])], '#8b95a7', 0.09);
      });
      if (S.path.length > 1) p.tube('path', hops(S.path), COLORS.yellow, 0.035);
      S.path.forEach((P, i) => { if (i < 40 && Math.abs(P[0]) <= R && Math.abs(P[1]) <= R) p.sphere(`pt${i}`, [...P, lift(...P)], COLORS.orange, 0.05); });
      const P = cur() || S.fixedStart;
      if (P && Math.abs(P[0]) <= R && Math.abs(P[1]) <= R) {
        p.sphere('walker', [...P, lift(...P) + 0.06], COLORS.yellow, 0.14);
        const [gx, gy] = grad(S.f, ...P), g = Math.hypot(gx, gy);
        if (g > 1e-3) {
          const L = Math.min(1.4, 0.35 + g * 0.5), u = -gx / g * L, v = -gy / g * L;
          p.arrow('down', [P[0], P[1], lift(...P) + 0.04], [P[0] + u, P[1] + v, lift(...P) + 0.04 - g * L], COLORS.green, { radius: 0.035 });
        }
      }
      if (S.reveal && S.low) p.sphere('low', [...S.low.P, S.low.z + 0.1], COLORS.red, 0.13);
    }

    function report() {
      const P = cur();
      const rows = [];
      if (P) {
        const [gx, gy] = grad(S.f, ...P);
        rows.push([t({ en: 'Steps', ru: 'Шагов' }), String(steps()) + (isFinite(S.limit) ? ` / ${S.limit}` : '')]);
        rows.push(['$(x;\\ y)$', `(${P[0].toFixed(2)}; ${P[1].toFixed(2)})`]);
        rows.push([t({ en: 'Height $z$', ru: 'Высота $z$' }), S.out ? '—' : height(P).toFixed(4)]);
        rows.push(['$|\\nabla f|$', S.out ? '—' : Math.hypot(gx, gy).toFixed(3)]);
      }
      if (S.mode === 'fog') rows.push([t({ en: 'Jumps', ru: 'Прыжков' }), `${S.jumps} / ${S.maxJumps}`]);
      ui.readout(rows);
    }

    plot = new Plot3D(ui.host, p => draw(p), { R, zmax: ZMAX, camera: [8, -9.5, 7.5] });

    // Clicking the landscape (not dragging the view): where the ray from the eye meets z = f(x, y)
    const ray = new THREE.Raycaster();
    let down = null;
    const canvas = plot.renderer.domElement;
    const onDown = e => { down = { x: e.clientX, y: e.clientY, time: e.timeStamp }; };
    const onUp = e => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 || e.timeStamp - down.time > 600) { down = null; return; }
      down = null;
      if (S.fixedStart) return;
      const r = canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), plot.camera);
      const o = ray.ray.origin, d = ray.ray.direction;
      const below = s => { const x = o.x + s * d.x, y = o.y + s * d.y; return Math.abs(x) <= R && Math.abs(y) <= R && o.z + s * d.z <= S.f(x, y); };
      for (let s = 0; s < 80; s += 0.04) {
        if (!below(s)) continue;
        let lo = s - 0.04, hi = s;
        for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (below(m)) hi = m; else lo = m; }
        start([o.x + hi * d.x, o.y + hi * d.y]);
        return;
      }
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);

    // ---- Controls ----
    let runBtn = null;
    function controls({ lands = false, beta = false, fog = false, reseed = false, restart = true }) {
      const c = ui.controls;
      c.innerHTML = '';
      if (lands) c.appendChild(row(seg(['canyon', 'hills', 'banana', 'eggs'].map(id => ({ id, label: t(TXT[id]) })), S.land, k => setLand(k))));
      c.appendChild(slider({ label: '\\eta', min: 0.02, max: 1.6, step: 0.01, value: S.eta, format: v => v.toFixed(2), onInput: v => { S.eta = v; if (S.fixedStart) start(S.fixedStart); } }).el);
      if (beta) c.appendChild(slider({ label: '\\beta', min: 0, max: 0.95, step: 0.01, value: S.beta, format: v => v.toFixed(2), onInput: v => { S.beta = v; if (S.fixedStart) start(S.fixedStart); } }).el);
      runBtn = button(t(TXT.run), run, { primary: true });
      c.appendChild(row(
        runBtn,
        S.mode === 'fog' ? null : button(t(TXT.step), () => { stopRun(); step(); if (S.mode !== 'free' && (judgeQuiet() || S.out || steps() >= S.limit)) judge(); }),
        restart ? button(t(TXT.restart), () => start(cur() ? S.path[0] : [3, 1])) : null,
        reseed ? button(t(TXT.reseed), () => { S.seed++; setLand('hills', true); }) : null,
        fog ? toggle(t(TXT.fog), S.fog, on => { S.fog = on; plot.request(); }) : null,
      ));
    }

    function setLand(k, keepFog = false) {
      stopRun();
      S.land = k;
      S.f = k === 'hills' ? hills(S.seed) : LANDS[k].f;
      S.path = []; S.done = []; S.out = false; S.jumps = 0; S.reveal = false;
      if (!keepFog && S.mode === 'free') S.reveal = false;
      S.low = lowest(S.f);
      if (S.fixedStart) S.path = [S.fixedStart];
      ui.status('', 'reset');
      plot.request();
      report();
    }

    return {
      setMode(id) {
        stopRun();
        Object.assign(S, { mode: id, fixedStart: null, limit: Infinity, maxJumps: Infinity, fog: false, beta: 0 });
        if (id === 'free') {
          Object.assign(S, { eta: 0.3, seed: 12 }); // not the hills of the fog challenge
          setLand('canyon');
          start([3, 1]);
          controls({ lands: true, beta: true, fog: true, reseed: true });
          ui.hud(t(TXT.hud));
        } else if (id === 'canyon' || id === 'momentum') {
          Object.assign(S, { eta: id === 'canyon' ? 0.5 : 0.6, beta: id === 'canyon' ? 0 : 0.3, fixedStart: CANYON_START, limit: id === 'canyon' ? 14 : 6 });
          setLand('canyon');
          controls({ beta: id === 'momentum' });
          ui.hud(t(TXT.hudFixed));
        } else if (id === 'fog') {
          Object.assign(S, { eta: 0.25, fog: true, maxJumps: 3, seed: 31 });
          setLand('hills');
          controls({ restart: false, reseed: true });
          ui.hud(t(TXT.hudFog));
        }
        report();
      },
      dispose() {
        stopRun();
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointerup', onUp);
        plot.dispose();
      },
    };
  },
};
