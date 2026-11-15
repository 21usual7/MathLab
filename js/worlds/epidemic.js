// An epidemic on a grid. Each cell is a person; a sick cell infects each healthy neighbour with probability p
// and recovers after one day (an SIR model with an infectious period of one step). Which cells ever fall ill
// is exactly bond percolation: every link between neighbours is «open» with probability p, and the outbreak
// is the cluster of open links around its start. On the square grid the threshold is exactly p = 1/2
// (Kesten, 1980): below it every outbreak dies out, above it a wave can cross the whole city.
// In a well-mixed crowd the threshold would be R₀ = 4p = 1, that is p = 1/4: the grid's geometry doubles it.

import { Plot2D } from '../views/plot2d.js';
import { COLORS } from '../core/palette.js';
import { t } from '../core/i18n.js';
import { slider, seg, toggle, button, row } from '../ui/kit.js';

export const N = 64;
const HEALTHY = 0, SICK = 1, RECOVERED = 2, VACCINE = 3;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// One run from the whole left column: does the outbreak reach the right column? Vaccinated cells (fraction v,
// or the given mask) never fall ill. Returns { cross, size }.
export function cross(p, v = 0, rand = Math.random, mask = null) {
  const st = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) if ((mask && mask[i]) || (v && rand() < v)) st[i] = VACCINE;
  let front = [], size = 0;
  for (let y = 0; y < N; y++) { const i = y * N; if (st[i] !== VACCINE) { st[i] = SICK; front.push(i); size++; } }
  let hit = false;
  while (front.length) {
    const next = [];
    for (const i of front) {
      const x = i % N, y = (i / N) | 0;
      if (x === N - 1) hit = true;
      for (const [dx, dy] of NB) {
        const X = x + dx, Y = y + dy;
        if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
        const j = Y * N + X;
        if (st[j] === HEALTHY && rand() < p) { st[j] = SICK; next.push(j); size++; }
      }
    }
    front = next;
  }
  return { cross: hit, size };
}

export function series(p, v, runs = 100) {
  let c = 0, size = 0;
  for (let k = 0; k < runs; k++) { const r = cross(p, v); c += r.cross; size += r.size; }
  return { P: c / runs, size: size / runs / (N * N) };
}

const RGB = {
  [HEALTHY]: [26, 33, 44], [SICK]: [255, 159, 90], [RECOVERED]: [120, 46, 52], [VACCINE]: [52, 122, 140], hand: [88, 196, 221],
};

const TXT = {
  play: { en: '▶ Run', ru: '▶ Пуск' },
  pause: { en: '❚❚ Pause', ru: '❚❚ Пауза' },
  wave: { en: 'Wave from the left', ru: 'Волна слева' },
  reset: { en: 'Heal everyone', ru: 'Вылечить всех' },
  clear: { en: 'Remove vaccines', ru: 'Убрать прививки' },
  seriesBtn: { en: 'Series ×100', ru: 'Серия ×100' },
  ignite: { en: 'Infect', ru: 'Заразить' },
  vaccinate: { en: 'Vaccinate', ru: 'Привить' },
  tool: { en: 'Brush', ru: 'Кисть' },
  check: { en: 'Check', ru: 'Проверить' },
  again: { en: 'New outbreak', ru: 'Новая вспышка' },
  hudFree: { en: 'Click or draw on the city with the brush · «Wave from the left» starts an outbreak from the whole left edge', ru: 'Щёлкайте или рисуйте кистью по городу · «Волна слева» запускает вспышку со всего левого края' },
  hudSeries: { en: 'A series runs 100 outbreaks from the left edge and counts how often they reach the right edge', ru: 'Серия запускает 100 вспышек от левого края и считает, как часто они доходят до правого' },
  hudRing: { en: 'Press Run, see where it starts — and draw vaccines around it', ru: 'Нажмите «Пуск», увидьте, где началось, — и рисуйте прививки вокруг' },
};

const MODES = [
  {
    id: 'free',
    title: { en: 'A city of 4096 people', ru: 'Город из 4096 человек' },
    text: {
      en: 'Every day each sick person (orange) infects each of their four healthy neighbours with probability $p$, and then recovers (dark red) and does not fall ill again. One sick person infects $R_0 = 4p$ others on average. Start a wave from the left edge and move $p$: at $0.4$ it dies out, at $0.6$ it sweeps the city. Vaccinated people (blue) never fall ill: draw a wall, or vaccinate a random part $v$ of the city. The series button runs $100$ outbreaks at once and puts a point on the chart: how often the wave crosses the city.',
      ru: 'Каждый день каждый больной (оранжевый) заражает каждого из четырёх здоровых соседей с вероятностью $p$, а потом выздоравливает (тёмно-красный) и больше не болеет. В среднем один больной заражает $R_0 = 4p$ человек. Запустите волну с левого края и двигайте $p$: при $0.4$ она гаснет, при $0.6$ накрывает город. Привитые (синие) не болеют никогда: нарисуйте стену или привейте случайную долю $v$ города. Кнопка серии запускает $100$ вспышек разом и ставит точку на график: как часто волна пересекает город.',
    },
  },
  {
    id: 'threshold',
    title: { en: 'Find the threshold', ru: 'Найдите порог' },
    text: {
      en: 'Somewhere between «always dies out» and «always crosses» there is a sharp edge. Run series for different $p$ (at least $4$ different values), look at the chart and set your estimate of the threshold $p^*$ — the $p$ at which the wave crosses the city half the time.',
      ru: 'Где-то между «всегда гаснет» и «всегда проходит» есть резкая граница. Запустите серии при разных $p$ (хотя бы $4$ разных значения), посмотрите на график и поставьте свою оценку порога $p^*$ — того $p$, при котором волна пересекает город в половине случаев.',
    },
    goal: { en: 'At least 4 series at different $p$, and $p^*$ within $0.03$ of the real threshold.', ru: 'Не меньше 4 серий при разных $p$ и $p^*$ не дальше $0.03$ от настоящего порога.' },
    after: {
      en: 'The threshold is exactly $p = \\frac12$. Why exactly a half? Draw a link of the «dual» grid across every closed link: the wave is stopped exactly when closed links form a wall from top to bottom. At $p = \\frac12$ open and closed links are equally likely — a crossing and a wall are equally likely too. And note: at the threshold $R_0 = 4p = 2$, not $1$ as in a well-mixed crowd. Neighbours infect the same people again and again — the geometry of contacts matters as much as the infection itself.',
      ru: 'Порог — ровно $p = \\frac12$. Почему ровно половина? Через каждую закрытую связь проведём связь «двойственной» решётки: волна остановлена ровно тогда, когда закрытые связи образуют стену сверху донизу. При $p = \\frac12$ открытые и закрытые связи равновероятны — значит, и проход, и стена равновероятны. И заметьте: на пороге $R_0 = 4p = 2$, а не $1$, как в перемешанной толпе. Соседи раз за разом заражают одних и тех же — геометрия контактов важна не меньше самой заразности.',
    },
  },
  {
    id: 'herd',
    title: { en: 'Herd immunity', ru: 'Коллективный иммунитет' },
    text: {
      en: 'A contagious disease: $p = 0.8$, far above the threshold. Vaccines are given at random to a part $v$ of the city. Find a $v$ at which a wave from the left edge crosses the city in less than $10\\%$ of cases — and do not vaccinate more than $42\\%$ of people: vaccines are expensive.',
      ru: 'Заразная болезнь: $p = 0.8$, намного выше порога. Прививки достаются случайной доле $v$ города. Найдите такое $v$, при котором волна с левого края пересекает город меньше чем в $10\\%$ случаев, — и не прививайте больше $42\\%$ людей: прививки дорогие.',
    },
    goal: { en: 'A series with crossing below 10% at $v \\le 0.42$.', ru: 'Серия с проходом меньше 10% при $v \\le 0.42$.' },
    after: {
      en: 'Not everyone has to be vaccinated: it is enough that the healthy-and-susceptible people stop forming paths across the city. The vaccinated are «holes» in the grid, and once there are enough of them, the open paths fall apart into islands — the same threshold, now for cells. The unvaccinated are protected too: that is what «herd» immunity means.',
      ru: 'Прививать всех не нужно: достаточно, чтобы восприимчивые люди перестали образовывать пути через город. Привитые — это «дырки» в решётке, и когда их хватает, открытые пути распадаются на островки — тот же порог, только теперь для клеток. Защищены и непривитые: вот что значит «коллективный» иммунитет.',
    },
  },
  {
    id: 'ring',
    title: { en: 'Ring vaccination', ru: 'Кольцевая вакцинация' },
    text: {
      en: 'An outbreak will start somewhere in the city: $p = 0.75$. You have $60$ doses and no time to waste. Press Run, find the outbreak and draw vaccines around it so that it dies out having infected less than $10\\%$ of the city.',
      ru: 'Где-то в городе начнётся вспышка: $p = 0.75$. У вас $60$ доз и ни минуты лишней. Нажмите «Пуск», найдите вспышку и нарисуйте вокруг неё прививки так, чтобы она погасла, заразив меньше $10\\%$ города.',
    },
    goal: { en: 'The outbreak dies out with less than 10% of the city ever ill; 60 doses.', ru: 'Вспышка гаснет, переболело меньше 10% города; 60 доз.' },
    after: {
      en: 'You did not need to vaccinate the city — only a closed ring around the outbreak: in $4$-neighbour contact every path outward must cross it. A ring of radius $r$ costs about $8r$ doses (a «diamond» — only $4r$), so the earlier you close it, the cheaper. This is how smallpox was eradicated in the 1970s: not mass vaccination, but rings around every case.',
      ru: 'Прививать город не понадобилось — только замкнутое кольцо вокруг вспышки: при заражении через четырёх соседей любой путь наружу обязан его пересечь. Кольцо радиуса $r$ стоит около $8r$ доз («ромб» — всего $4r$), поэтому чем раньше замкнёте, тем дешевле. Так в 1970-х победили оспу: не поголовной прививкой, а кольцами вокруг каждого случая.',
    },
  },
];

export default {
  modes: MODES,

  mount(ui) {
    const S = {
      st: new Uint8Array(N * N), hand: new Uint8Array(N * N), p: 0.55, v: 0, speed: 12, tool: 'ignite',
      day: 0, ever: 0, curve: [], data: [], playing: false, mode: 'free', budget: Infinity, used: 0, guess: 0.4, started: false, over: false,
    };
    const img = document.createElement('canvas');
    img.width = img.height = N;
    const ictx = img.getContext('2d'), pix = ictx.createImageData(N, N);
    const plot = new Plot2D(ui.host, p => draw(p), { cx: N / 2, cy: N / 2, unit: 12, grid: false, fit: [N + 4, N + 4] });
    let raf = 0, last = 0, acc = 0, chart = null;

    // ---- The city ----
    function vaccinateRandom() {
      for (let i = 0; i < N * N; i++) {
        if (S.st[i] === VACCINE && !S.hand[i]) S.st[i] = HEALTHY;
        if (S.st[i] === HEALTHY && S.v && Math.random() < S.v) S.st[i] = VACCINE;
      }
    }
    function heal() {
      for (let i = 0; i < N * N; i++) if (S.st[i] === SICK || S.st[i] === RECOVERED) S.st[i] = HEALTHY;
      S.day = 0; S.ever = 0; S.curve = []; S.over = false;
    }
    function wave() {
      heal();
      for (let y = 0; y < N; y++) infect(0, y);
      play(true);
    }
    function infect(x, y) {
      const i = y * N + x;
      if (S.st[i] === HEALTHY) { S.st[i] = SICK; S.ever++; }
    }
    function day() {
      const next = [];
      for (let i = 0; i < N * N; i++) {
        if (S.st[i] !== SICK) continue;
        const x = i % N, y = (i / N) | 0;
        for (const [dx, dy] of NB) {
          const X = x + dx, Y = y + dy;
          if (X < 0 || Y < 0 || X >= N || Y >= N) continue;
          const j = Y * N + X;
          if (S.st[j] === HEALTHY && Math.random() < S.p) next.push(j);
        }
        S.st[i] = RECOVERED;
      }
      next.forEach(j => { if (S.st[j] === HEALTHY) { S.st[j] = SICK; S.ever++; } });
      S.day++;
      const sick = S.st.reduce((n, v) => n + (v === SICK), 0);
      S.curve.push(sick);
      if (!sick) { play(false); S.over = true; finishedRun(); }
      if (S.mode === 'ring' && S.ever > 0.1 * N * N && !S.over) { S.over = true; play(false); finishedRun(); }
    }

    // ---- Time ----
    function play(on) {
      S.playing = on;
      if (playBtn) playBtn.label(t(on ? TXT.pause : TXT.play));
      cancelAnimationFrame(raf);
      if (on) { last = performance.now(); acc = 0; raf = requestAnimationFrame(tick); }
      redraw();
    }
    function tick(now) {
      acc += (now - last) / 1000 * S.speed;
      last = now;
      while (acc >= 1 && S.playing) { acc -= 1; day(); }
      redraw();
      if (S.playing) raf = requestAnimationFrame(tick);
    }
    const redraw = () => { plot.request(); report(); drawChart(); };

    // ---- Challenges ----
    function finishedRun() {
      if (S.mode !== 'ring') return;
      const share = S.ever / (N * N);
      if (share < 0.1 && !S.curve.at(-1)) return ui.solve('ring', t({ en: `The outbreak died out: ${(100 * share).toFixed(1)}% fell ill, ${S.used} doses used.`, ru: `Вспышка погасла: переболело ${(100 * share).toFixed(1)}%, использовано доз: ${S.used}.` }));
      ui.status(t({ en: `Too late: ${(100 * share).toFixed(0)}% of the city is ill. Close the ring earlier and nearer — a small ring is cheap. Press «New outbreak».`, ru: `Не успели: заболело ${(100 * share).toFixed(0)}% города. Замыкайте кольцо раньше и ближе — маленькое кольцо дешевле. Нажмите «Новая вспышка».` }), 'fail');
    }

    function runSeries() {
      const x = S.mode === 'herd' ? S.v : S.p;
      const r = series(S.p, S.v, 100);
      S.data = S.data.filter(d => Math.abs(d.x - x) > 0.004);
      S.data.push({ x, P: r.P });
      S.data.sort((a, b) => a.x - b.x);
      drawChart();
      if (S.mode === 'herd') {
        if (r.P < 0.1 && S.v <= 0.42 + 1e-9) return ui.solve('herd', t({ en: `At $v = ${S.v.toFixed(2)}$ the wave crossed in ${(100 * r.P).toFixed(0)}% of 100 runs.`, ru: `При $v = ${S.v.toFixed(2)}$ волна прошла в ${(100 * r.P).toFixed(0)}% из 100 прогонов.` }));
        if (r.P < 0.1) return ui.status(t({ en: `It works (${(100 * r.P).toFixed(0)}%), but $v = ${S.v.toFixed(2)}$ is more than $0.42$: you can do with fewer doses.`, ru: `Работает (${(100 * r.P).toFixed(0)}%), но $v = ${S.v.toFixed(2)}$ больше $0.42$: можно обойтись меньшим числом доз.` }), 'fail');
        return ui.status(t({ en: `At $v = ${S.v.toFixed(2)}$ the wave crosses in ${(100 * r.P).toFixed(0)}% of cases — still too often.`, ru: `При $v = ${S.v.toFixed(2)}$ волна проходит в ${(100 * r.P).toFixed(0)}% случаев — всё ещё слишком часто.` }), 'progress');
      }
      if (S.mode === 'threshold') ui.status(t({ en: `$p = ${S.p.toFixed(2)}$: crossed in ${(100 * r.P).toFixed(0)} of 100 runs. Series so far: ${S.data.length}.`, ru: `$p = ${S.p.toFixed(2)}$: прошла в ${(100 * r.P).toFixed(0)} из 100 прогонов. Серий: ${S.data.length}.` }), 'progress');
    }

    function checkGuess() {
      const distinct = S.data.filter((d, i, a) => !i || d.x - a[i - 1].x >= 0.02).length;
      if (distinct < 4) return ui.status(t({ en: `First run series at $4$ different $p$ (now ${distinct}).`, ru: `Сначала запустите серии при $4$ разных $p$ (сейчас ${distinct}).` }), 'fail');
      if (Math.abs(S.guess - 0.5) <= 0.03) { S.solvedLine = true; drawChart(); return ui.solve('threshold', t({ en: `Your estimate $p^* = ${S.guess.toFixed(2)}$.`, ru: `Ваша оценка $p^* = ${S.guess.toFixed(2)}$.` })); }
      return ui.status(t({ en: `$p^* = ${S.guess.toFixed(2)}$ is ${S.guess < 0.5 ? 'too low' : 'too high'}: look at your chart — where does the crossing chance pass $50\\%$? More series near that place make it sharper.`, ru: `$p^* = ${S.guess.toFixed(2)}$ — ${S.guess < 0.5 ? 'низковато' : 'высоковато'}: посмотрите на свой график — где вероятность прохода переходит через $50\\%$? Больше серий рядом с этим местом сделают картину резче.` }), 'fail');
    }

    // ---- Drawing ----
    function draw(p) {
      for (let i = 0; i < N * N; i++) {
        const x = i % N, y = N - 1 - ((i / N) | 0), k = (y * N + x) * 4;
        const c = S.st[i] === VACCINE && S.hand[i] ? RGB.hand : RGB[S.st[i]];
        pix.data[k] = c[0]; pix.data[k + 1] = c[1]; pix.data[k + 2] = c[2]; pix.data[k + 3] = 255;
      }
      ictx.putImageData(pix, 0, 0);
      const ctx = p.ctx, x0 = p.sx(0), y0 = p.sy(N), s = p.sx(N) - x0;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, x0, y0, s, s);
      // Thin gaps between people when the cells are big enough
      if (s / N > 7) {
        ctx.strokeStyle = 'rgba(13,17,23,0.55)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let k = 1; k < N; k++) { const q = x0 + s * k / N; ctx.moveTo(q, y0); ctx.lineTo(q, y0 + s); ctx.moveTo(x0, y0 + s * k / N); ctx.lineTo(x0 + s, y0 + s * k / N); }
        ctx.stroke();
      }
      // The right edge — the far side of the city a wave has to reach
      if (S.mode !== 'ring') p.line(N + 0.25, 0, N + 0.25, N, 'rgba(244,211,94,0.7)', { width: 3 });
      const canPaint = S.mode === 'free' || (S.mode === 'ring' && S.started && !S.over);
      if (canPaint) p.pen = pts => paint(pts);
    }

    function paint(pts) {
      const cell = ([x, y]) => [Math.floor(x), Math.floor(y)];
      const a = cell(pts.length > 1 ? pts[pts.length - 2] : pts[0]), b = cell(pts[pts.length - 1]);
      const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
      for (let k = 0; k <= n; k++) {
        const x = Math.round(a[0] + (b[0] - a[0]) * k / n), y = Math.round(a[1] + (b[1] - a[1]) * k / n);
        if (x < 0 || y < 0 || x >= N || y >= N) continue;
        const i = y * N + x;
        if (S.tool === 'ignite' && S.mode === 'free') { if (pts.length === 1) infect(x, y); }
        else if (S.st[i] === HEALTHY && S.used < S.budget) { S.st[i] = VACCINE; S.hand[i] = 1; S.used++; }
      }
      redraw();
    }

    // The chart in the panel: the epidemic curve (free) and the crossing chance against p or v
    function drawChart() {
      if (!chart) return;
      const c = chart, dpr = window.devicePixelRatio || 1, W = c.clientWidth, H = c.clientHeight;
      if (!W) return;
      c.width = W * dpr; c.height = H * dpr;
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const L = 30, B = 18, w = W - L - 8, h = H - B - 8;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.strokeRect(L, 8, w, h);
      ctx.fillStyle = '#8b95a7';
      ctx.font = '10px Inter, sans-serif';
      const xname = S.mode === 'herd' ? 'v' : 'p';
      if (S.mode === 'free' && !S.data.length) {
        // Sick people per day
        const max = Math.max(10, ...S.curve);
        ctx.fillText(t({ en: 'sick per day', ru: 'больных в день' }), L + 4, 20);
        ctx.beginPath();
        S.curve.forEach((v, i) => { const X = L + w * i / Math.max(40, S.curve.length), Y = 8 + h - h * v / max; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
        ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 1.8; ctx.stroke();
        return;
      }
      ctx.fillText('100%', 2, 14); ctx.fillText('0', 18, 8 + h);
      [0, 0.25, 0.5, 0.75, 1].forEach(x => ctx.fillText(String(x), L + w * x - 6, H - 4));
      ctx.fillText(xname, L + w - 8, 20);
      if (S.solvedLine) { ctx.strokeStyle = 'rgba(244,211,94,0.7)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(L + w / 2, 8); ctx.lineTo(L + w / 2, 8 + h); ctx.stroke(); ctx.setLineDash([]); }
      if (S.mode === 'threshold') { ctx.strokeStyle = 'rgba(88,196,221,0.8)'; ctx.beginPath(); ctx.moveTo(L + w * S.guess, 8); ctx.lineTo(L + w * S.guess, 8 + h); ctx.stroke(); }
      if (S.mode === 'herd') { ctx.strokeStyle = 'rgba(252,98,85,0.5)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(L, 8 + h * 0.9); ctx.lineTo(L + w, 8 + h * 0.9); ctx.stroke(); ctx.setLineDash([]); }
      ctx.beginPath();
      S.data.forEach((d, i) => { const X = L + w * d.x, Y = 8 + h - h * d.P; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.strokeStyle = 'rgba(244,211,94,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
      S.data.forEach(d => { ctx.beginPath(); ctx.arc(L + w * d.x, 8 + h - h * d.P, 3.2, 0, 7); ctx.fillStyle = COLORS.yellow; ctx.fill(); });
    }

    function report() {
      const rows = [];
      if (S.mode !== 'ring') rows.push(['$p$', S.p.toFixed(2)], ['$R_0 = 4p$', (4 * S.p).toFixed(2)]);
      rows.push([t({ en: 'Day', ru: 'День' }), String(S.day)]);
      rows.push([t({ en: 'Ill now', ru: 'Болеют сейчас' }), String(S.curve.at(-1) || S.st.reduce((n, v) => n + (v === SICK), 0))]);
      rows.push([t({ en: 'Ever ill', ru: 'Переболело' }), `${(100 * S.ever / (N * N)).toFixed(1)}%`]);
      if (isFinite(S.budget)) rows.push([t({ en: 'Doses left', ru: 'Доз осталось' }), String(S.budget - S.used)]);
      else rows.push([t({ en: 'Vaccinated', ru: 'Привито' }), `${(100 * S.st.reduce((n, v) => n + (v === VACCINE), 0) / (N * N)).toFixed(1)}%`]);
      ui.readout(rows);
    }

    // ---- Controls ----
    let playBtn = null;
    function controls(kind) {
      const c = ui.controls;
      c.innerHTML = '';
      const pS = slider({ label: 'p', min: 0, max: 1, step: 0.01, value: S.p, format: v => v.toFixed(2), onInput: v => { S.p = v; report(); } });
      const vS = slider({ label: 'v', min: 0, max: 0.8, step: 0.01, value: S.v, format: v => v.toFixed(2), onInput: v => { S.v = v; vaccinateRandom(); redraw(); } });
      playBtn = button(t(TXT.play), () => {
        if (S.mode === 'ring' && !S.started) return startRing();
        if (S.over && S.mode === 'ring') return;
        play(!S.playing);
      }, { primary: true });
      const seriesBtn = button(t(TXT.seriesBtn), runSeries);
      if (kind === 'free') {
        c.append(pS.el, vS.el,
          slider({ label: t({ en: '\\text{days/s}', ru: '\\text{дней/с}' }), min: 1, max: 40, step: 1, value: S.speed, format: v => String(v), onInput: v => { S.speed = v; } }).el,
          row(seg([{ id: 'ignite', label: t(TXT.ignite) }, { id: 'vaccine', label: t(TXT.vaccinate) }], S.tool, k => { S.tool = k; })),
          row(button(t(TXT.wave), wave, { primary: true }), playBtn, button(t(TXT.reset), () => { play(false); heal(); redraw(); }), button(t(TXT.clear), () => { S.hand.fill(0); S.v = 0; vS.set(0); for (let i = 0; i < N * N; i++) if (S.st[i] === VACCINE) S.st[i] = HEALTHY; redraw(); }), seriesBtn));
      } else if (kind === 'threshold') {
        const gS = slider({ label: 'p^*', min: 0, max: 1, step: 0.01, value: S.guess, format: v => v.toFixed(2), onInput: v => { S.guess = v; drawChart(); } });
        c.append(pS.el, row(button(t(TXT.wave), wave), playBtn, seriesBtn), gS.el, row(button(t(TXT.check), checkGuess, { primary: true })));
      } else if (kind === 'herd') {
        playBtn.el.classList.remove('primary');
        seriesBtn.el.classList.add('primary');
        c.append(vS.el, row(seriesBtn, button(t(TXT.wave), wave), playBtn));
      } else if (kind === 'ring') {
        c.append(row(playBtn, button(t(TXT.again), () => { play(false); setupRing(); redraw(); })));
      }
      if (kind !== 'ring') {
        chart = document.createElement('canvas');
        chart.className = 'world-chart';
        c.appendChild(chart);
      } else chart = null;
    }

    function setupRing() {
      S.st.fill(HEALTHY); S.hand.fill(0); S.used = 0; S.started = false; S.over = false;
      S.day = 0; S.ever = 0; S.curve = [];
      ui.status('', 'reset');
      if (playBtn) playBtn.label(t(TXT.play));
    }
    function startRing() {
      const x = 14 + Math.floor(Math.random() * (N - 28)), y = 14 + Math.floor(Math.random() * (N - 28));
      infect(x, y);
      S.started = true;
      S.speed = 1.6;
      play(true);
    }

    return {
      setMode(id) {
        play(false);
        Object.assign(S, { mode: id, data: [], budget: Infinity, used: 0, solvedLine: false, started: false, over: false });
        S.st.fill(HEALTHY); S.hand.fill(0);
        heal();
        if (id === 'free') { Object.assign(S, { p: 0.55, v: 0, speed: 12, tool: 'ignite' }); controls('free'); ui.hud(t(TXT.hudFree)); }
        else if (id === 'threshold') { Object.assign(S, { p: 0.4, v: 0, speed: 20, guess: 0.4 }); controls('threshold'); ui.hud(t(TXT.hudSeries)); }
        else if (id === 'herd') { Object.assign(S, { p: 0.8, v: 0.2, speed: 20 }); vaccinateRandom(); controls('herd'); ui.hud(t(TXT.hudSeries)); }
        else if (id === 'ring') { Object.assign(S, { p: 0.75, v: 0, budget: 60 }); setupRing(); controls('ring'); ui.hud(t(TXT.hudRing)); }
        requestAnimationFrame(redraw);
      },
      dispose() { cancelAnimationFrame(raf); plot.dispose(); },
    };
  },
};
