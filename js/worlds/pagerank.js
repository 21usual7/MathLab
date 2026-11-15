// Search: importance as an eigenvector. Eight sites and the links between them; a random surfer hops along
// the links (and sometimes jumps anywhere). How often a page is visited is its rank — and the same numbers come
// out of the equation r = G·r: the rank is the eigenvector of the link matrix. The student draws links with
// the mouse and watches both the surfer and the exact eigenvector.

import { Plot2D } from '../views/plot2d.js';
import { COLORS } from '../core/palette.js';
import { t } from '../core/i18n.js';
import { slider, toggle, button, row } from '../ui/kit.js';
import { rank, step, surf, places } from './pagerank-math.js';

const N = 8, YOU = 7;
const NAMES = [
  { en: 'Wiki', ru: 'Вики' }, { en: 'News', ru: 'Новости' }, { en: 'Blog', ru: 'Блог' }, { en: 'Forum', ru: 'Форум' },
  { en: 'Shop', ru: 'Магазин' }, { en: 'Cats', ru: 'Котики' }, { en: 'Recipes', ru: 'Рецепты' }, { en: 'You', ru: 'Вы' },
];
// The little internet of the challenge; the student's site has no links at the start
export const BASE = [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [0, 1], [2, 1], [3, 1], [5, 1], [1, 2], [3, 2], [6, 3], [4, 3], [1, 4], [5, 6], [6, 5], [0, 3], [4, 5]];
const POS = Array.from({ length: N }, (_, i) => { const a = Math.PI / 2 - 2 * Math.PI * i / N; return [3.2 * Math.cos(a), 3.2 * Math.sin(a)]; });
const VIEW = { cx: 0, cy: 0, unit: 80, grid: false, fit: [9.6, 9] };

const TXT = {
  hud: { en: 'Drag from one site to another to add a link (drag again to remove it)', ru: 'Тяните от одного сайта к другому — добавить ссылку (ещё раз — убрать)' },
  hudYou: { en: 'Only links to and from your site can be changed · drag from a site to «You» to ask for a link', ru: 'Менять можно только ссылки вашего сайта · тяните от сайта к «Вы», чтобы выпросить ссылку' },
  run: { en: '▶ Surfer', ru: '▶ Сёрфер' },
  pause: { en: '❚❚ Pause', ru: '❚❚ Пауза' },
  fast: { en: '+1000 clicks', ru: '+1000 кликов' },
  iter: { en: 'Step of the flow', ru: 'Шаг перетекания' },
  equal: { en: 'Equal shares', ru: 'Равные доли' },
  reset: { en: 'Reset links', ru: 'Сбросить ссылки' },
};

const MODES = [
  {
    id: 'free',
    title: { en: 'A random surfer', ru: 'Случайный сёрфер' },
    text: {
      en: 'A search engine has to decide which pages matter. Idea of 1998: imagine a surfer who clicks a random link on every page, and with probability $1 - d$ (here $d = 0.85$) gets bored and jumps to any page. The share of time spent on a page is its <b>rank</b>. Press ▶ and watch the bars (what the surfer counted) grow towards the circles (the exact rank). The exact rank needs no surfer: let the shares flow along the links again and again — «Equal shares», then «Step of the flow» — and they settle at $r = G\\,r$: a vector the link matrix $G$ does not change. It is the <b>eigenvector</b> of $G$ with $\\lambda = 1$. Draw and remove links and see who gains.',
      ru: 'Поисковику нужно решить, какие страницы важны. Идея 1998 года: представим сёрфера, который на каждой странице щёлкает случайную ссылку, а с вероятностью $1 - d$ (здесь $d = 0.85$) ему надоедает, и он прыгает на любую страницу. Доля времени, которую он проводит на странице, — её <b>ранг</b>. Нажмите ▶ и смотрите, как полоски (что насчитал сёрфер) растут к кругам (точному рангу). Для точного ранга сёрфер не нужен: пусть доли перетекают по ссылкам снова и снова — «Равные доли», потом «Шаг перетекания», — и они установятся на $r = G\\,r$: векторе, который матрица ссылок $G$ не меняет. Это <b>собственный вектор</b> $G$ с $\\lambda = 1$. Рисуйте и убирайте ссылки и смотрите, кто выигрывает.',
    },
  },
  {
    id: 'top3',
    title: { en: 'Into the top three', ru: 'В первую тройку' },
    text: {
      en: 'Your new site «You» is last: nobody links to it. You can persuade at most <b>two</b> sites to link to you, and put any links on your own site. Get into the top three.',
      ru: 'Ваш новый сайт «Вы» на последнем месте: на него никто не ссылается. Уговорить сослаться на вас можно не больше <b>двух</b> сайтов, а на своём сайте ставьте какие угодно ссылки. Войдите в первую тройку.',
    },
    goal: { en: 'Place 1–3 with at most 2 incoming links.', ru: 'Место 1–3, не больше 2 входящих ссылок.' },
    after: {
      en: 'Rank is passed along links and split between all the links of a page. So one link from an important page with few links outweighs many links from small sites: two links from «Cats» and «Recipes» give only 7th place. And a link back to the page that links to you returns part of the rank in a loop. That is exactly why «link farms» were invented — and why search engines learned to fight them.',
      ru: 'Ранг передаётся по ссылкам и делится между всеми ссылками страницы. Поэтому одна ссылка с важной страницы, где ссылок мало, весит больше многих ссылок с маленьких сайтов: две ссылки от «Котиков» и «Рецептов» дают лишь 7-е место. А ссылка обратно на страницу, которая ссылается на вас, возвращает часть ранга по кругу. Ровно поэтому придумали «фермы ссылок» — и поэтому поисковики научились с ними бороться.',
    },
  },
];

export default {
  modes: MODES,

  mount(ui) {
    const S = {
      edges: BASE.map(e => [...e]), d: 0.85, exact: null, flow: null, k: 0,
      visits: new Array(N).fill(0), clicks: 0, at: 0, from: 0, hop: 1, playing: false, speed: 4,
      mode: 'free', drag: null, target: null,
    };
    const plot = new Plot2D(ui.host, p => draw(p), { ...VIEW });
    let raf = 0, last = 0;

    const has = (a, b) => S.edges.some(([x, y]) => x === a && y === b);
    const incoming = () => S.edges.filter(([, b]) => b === YOU).length;
    function changed() {
      S.exact = rank(N, S.edges, S.d);
      S.visits.fill(0); S.clicks = 0; S.flow = null; S.k = 0;
      report();
      plot.request();
    }
    function toggleEdge(a, b) {
      if (a === b) return;
      if (S.mode === 'top3') {
        if (a !== YOU && b !== YOU) return ui.status(t({ en: 'Only the links of your own site can be changed.', ru: 'Менять можно только ссылки своего сайта.' }), 'fail');
        if (b === YOU && !has(a, b) && incoming() >= 2) return ui.status(t({ en: 'Two sites have already agreed — remove one of their links first.', ru: 'Два сайта уже согласились — сначала уберите одну из их ссылок.' }), 'fail');
      }
      S.edges = has(a, b) ? S.edges.filter(([x, y]) => !(x === a && y === b)) : [...S.edges, [a, b]];
      changed();
      judge();
    }

    // ---- The surfer ----
    function click() {
      S.from = S.at;
      S.at = surf(S.at, N, S.edges, S.d);
      S.visits[S.at]++;
      S.clicks++;
    }
    function play(on) {
      S.playing = on;
      if (runBtn) runBtn.label(t(on ? TXT.pause : TXT.run));
      cancelAnimationFrame(raf);
      if (on) { last = performance.now(); raf = requestAnimationFrame(tick); }
    }
    function tick(now) {
      if (!S.playing) return;
      S.hop += (now - last) / 1000 * S.speed;
      last = now;
      while (S.hop >= 1) { S.hop -= 1; click(); }
      report();
      plot.request();
      raf = requestAnimationFrame(tick);
    }

    // ---- Challenge ----
    function judge() {
      if (S.mode !== 'top3') return;
      const pl = places(S.exact)[YOU], n = incoming();
      if (pl <= 3 && n <= 2) return ui.solve('top3', t({ en: `Place ${pl} with ${n} incoming link${n === 1 ? '' : 's'}.`, ru: `Место ${pl}, входящих ссылок: ${n}.` }));
      ui.status(t({ en: `Your place: ${pl} of 8. Incoming links: ${n} of 2.`, ru: `Ваше место: ${pl} из 8. Входящих ссылок: ${n} из 2.` }), 'progress');
    }

    // ---- Drawing ----
    const shown = () => S.flow || S.exact;
    const radius = (p, i) => 0.15 + 0.85 * Math.sqrt(shown()[i]); // in units of the view: scales with the screen

    function draw(p) {
      const R = i => radius(p, i);
      // Links: arrows from rim to rim; a pair of opposite links is drawn as two parallel arrows
      S.edges.forEach(([a, b]) => {
        const [x1, y1] = POS[a], [x2, y2] = POS[b], L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L;
        const off = has(b, a) ? 0.09 : 0, ox = -uy * off, oy = ux * off;
        const mine = a === YOU || b === YOU;
        p.arrow(x1 + ux * R(a) + ox, y1 + uy * R(a) + oy, x2 - ux * (R(b) + 0.04) + ox, y2 - uy * (R(b) + 0.04) + oy,
          mine ? 'rgba(92,208,179,0.85)' : 'rgba(255,255,255,0.32)', { width: mine ? 2.2 : 1.5 });
      });
      // The link being drawn
      if (S.drag) {
        const [x, y] = S.drag.to;
        p.line(...POS[S.drag.from], x, y, S.target !== null ? COLORS.yellow : 'rgba(244,211,94,0.5)', { width: 2, dash: [6, 5] });
      }
      // Sites: the circle is the rank, the bar under it — what the surfer counted
      const pl = places(S.exact);
      for (let i = 0; i < N; i++) {
        const [x, y] = POS[i], c = i === YOU ? COLORS.teal : COLORS.blue;
        p.dot(x, y, c + (S.target === i ? '' : 'cc'), R(i) * p.u);
        if (R(i) * p.u >= 22) p.text(`${(100 * shown()[i]).toFixed(1)}%`, x, y, '#0d1117', { size: 12, weight: 700 }); // the table has them all
        p.text(`${pl[i]}. ${t(NAMES[i])}`, x, y - R(i) - 0.28, i === YOU ? COLORS.teal : '#b9c1cd', { size: 14, weight: 600 });
        if (S.clicks) {
          const share = S.visits[i] / S.clicks, w = 1.1;
          p.rect(x - w / 2, y - R(i) - 0.62, x - w / 2 + w * Math.min(1, share / 0.4), y - R(i) - 0.52, COLORS.yellow);
          p.rect(x - w / 2 + w * Math.min(1, shown()[i] / 0.4) - 0.015, y - R(i) - 0.66, x - w / 2 + w * Math.min(1, shown()[i] / 0.4) + 0.015, y - R(i) - 0.48, '#ffffff');
        }
      }
      // The surfer flies from page to page
      if (S.playing || S.clicks) {
        const k = S.playing ? Math.min(1, S.hop * 1.6) : 1, [a, b] = [POS[S.from], POS[S.at]];
        const jump = !has(S.from, S.at);
        if (jump && k < 1) p.dot(...b, `rgba(244,211,94,${(0.3 + 0.7 * k).toFixed(2)})`, 6);
        else p.dot(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, COLORS.yellow, 6);
      }
      p.pen = pts => {
        const [x0, y0] = pts[0], [x, y] = pts[pts.length - 1];
        const near = (px, py) => POS.findIndex((P, i) => Math.hypot(P[0] - px, P[1] - py) < Math.max(0.45, R(i)));
        if (pts.length === 1) { const i = near(x0, y0); S.drag = i >= 0 ? { from: i, to: [x, y] } : null; }
        if (!S.drag) return;
        S.drag.to = [x, y];
        const j = near(x, y);
        S.target = j >= 0 && j !== S.drag.from ? j : null;
        plot.request();
      };
    }
    // The link is made when the mouse (or finger) is released over a site
    const finish = () => {
      if (S.drag && S.target !== null) toggleEdge(S.drag.from, S.target);
      S.drag = null; S.target = null;
      plot.request();
    };
    plot.canvas.addEventListener('pointerup', finish);
    plot.canvas.addEventListener('pointercancel', finish);

    function report() {
      const order = shown().map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
      const rows = [[t({ en: 'Site', ru: 'Сайт' }), `${t({ en: 'rank', ru: 'ранг' })} · ${t({ en: 'surfer', ru: 'сёрфер' })}`]];
      order.forEach(([v, i]) => rows.push([`${i === YOU ? '<b>' : ''}${t(NAMES[i])}${i === YOU ? '</b>' : ''}`, `${(100 * v).toFixed(1)}% · ${S.clicks ? (100 * S.visits[i] / S.clicks).toFixed(1) + '%' : '—'}`]));
      rows.push([t({ en: 'Clicks', ru: 'Кликов' }), String(S.clicks)]);
      if (S.flow) rows.push([t({ en: 'Steps of the flow', ru: 'Шагов перетекания' }), String(S.k)]);
      ui.readout(rows);
    }

    // ---- Controls ----
    let runBtn = null;
    function controls() {
      const c = ui.controls;
      c.innerHTML = '';
      runBtn = button(t(TXT.run), () => play(!S.playing), { primary: true });
      c.append(
        row(runBtn, button(t(TXT.fast), () => { for (let k = 0; k < 1000; k++) click(); report(); plot.request(); })),
        slider({ label: t({ en: '\\text{clicks/s}', ru: '\\text{кликов/с}' }), min: 1, max: 60, step: 1, value: S.speed, format: v => String(v), onInput: v => { S.speed = v; } }).el,
        row(button(t(TXT.equal), () => { S.flow = new Array(N).fill(1 / N); S.k = 0; report(); plot.request(); }),
          button(t(TXT.iter), () => { S.flow = step(S.flow || new Array(N).fill(1 / N), N, S.edges, S.d); S.k++; report(); plot.request(); })),
      );
      if (S.mode === 'free') {
        c.append(
          slider({ label: 'd', min: 0, max: 1, step: 0.01, value: S.d, format: v => v.toFixed(2), onInput: v => { S.d = v; changed(); } }).el,
          row(button(t(TXT.reset), () => { S.edges = BASE.map(e => [...e]); changed(); })),
        );
      } else c.append(row(button(t(TXT.reset), () => { S.edges = BASE.map(e => [...e]); ui.status('', 'reset'); changed(); judge(); })));
    }

    return {
      setMode(id) {
        play(false);
        Object.assign(S, { mode: id, d: 0.85, edges: BASE.map(e => [...e]), at: 0, from: 0 });
        if (id === 'free') S.edges.push([YOU, 2], [2, YOU]);
        controls();
        ui.hud(t(id === 'free' ? TXT.hud : TXT.hudYou));
        changed();
        judge();
      },
      dispose() { cancelAnimationFrame(raf); plot.canvas.removeEventListener('pointerup', finish); plot.dispose(); },
    };
  },
};
