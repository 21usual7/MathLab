// Algorithms (#algorithms): its own section — a hero with a live merge sort, the route as a metro map,
// the lesson format, the modules, and a cost cheat sheet. Lessons themselves stay at #topic/<id>.

import { t } from '../core/i18n.js';
import { tween, lerp } from '../core/anim.js';
import { ALGORITHMS_SUBJECT, ALGORITHM_TRACKS, ALGORITHM_TOPICS, algorithmProgress, LESSON_SHAPE, STRUCTURE_SHAPE } from '../topics/algorithms/catalog.js';

const L = (ru, en) => ({ ru, en });
const COLORS = ['#5cd0b3', '#58c4dd', '#b69df8', '#f4d35e', '#ff9f5a', '#83c167', '#e88bd0'];
const TEXT = {
  eyebrow: L('Алгоритмы и структуры данных', 'Algorithms and data structures'),
  h1: L('Алгоритм — это <em>доказательство</em>, которое можно запустить', 'An algorithm is a <em>proof</em> you can run'),
  lead: L('От «сколько стоит двойной цикл» до Дейкстры и динамического программирования. Каждый урок — прогноз, пошаговая анимация, одна намеренно сломанная строка, свой код на Python прямо в браузере и шпаргалка.', 'From "what does a double loop cost" to Dijkstra and dynamic programming. Every lesson is a prediction, a step-by-step animation, one deliberately broken line, your own Python right in the browser, and a cheat sheet.'),
  lessons: L('уроков', 'lessons'), modules: L('модулей', 'modules'), hours: L('часа', 'hours'), python: L('Python в браузере', 'Python in the browser'),
  start: L('Начать с первого урока', 'Start with lesson one'), next: L('Продолжить', 'Continue'), again: L('Пройдено! Повторить', 'Done! Revisit'),
  map: L('Карта маршрута', 'Route map'), mapLead: L('Модули идут по порядку, но каждая станция открыта: можно начать с того, что нужно сейчас. Заполненная станция — урок пройден.', 'Modules go in order, but every station is open: start wherever you need. A filled station is a finished lesson.'),
  shape: L('Как устроены уроки', 'How lessons work'), kinds: L('Два вида уроков. Квадратная станция — структура данных: что это и как устроено внутри. Круглая — алгоритм: приём, который на структуре работает.', 'Two kinds of lessons. A square station is a data structure: what it is and how it works inside. A round one is an algorithm: a technique that runs on a structure.'),
  structure: L('Структура данных', 'Data structure'), algorithm: L('Алгоритм', 'Algorithm'),
  shapeText: [L('Сначала ответ на вопрос — без подсказок.', 'Answer a question first — no hints.'), L('Одна операция за шаг, с анимацией и кодом.', 'One operation per step, animated, beside the code.'), L('Идея, инвариант и одна сломанная строка.', 'The idea, the invariant, and one broken line.'), L('Настоящий CPython в браузере, проверки с разбором.', 'Real CPython in the browser, checks that explain.'), L('Новые данные без готовой трассировки.', 'New data without a worked trace.'), L('Признаки, стоимость, ошибки, шаблон.', 'Signals, cost, mistakes, template.')],
  route: L('Модули', 'Modules'), progress: L('пройдено', 'done'),
  cheat: L('Шпаргалка по стоимости', 'Cost cheat sheet'), cheatLead: L('Все приёмы раздела на одной странице. Название ведёт к уроку.', 'Every technique of the section on one page. A name leads to its lesson.'),
  lesson: L('Урок', 'Lesson'), cost: L('Стоимость', 'Cost'), hero: L('Сортировка слиянием: каждый уровень сливает соседние отсортированные куски.', 'Merge sort: each level merges neighbouring sorted pieces.'),
};
const short = m => m.short ? t(m.short) : t(m.title).split(':')[0];
const done = m => algorithmProgress(m.id) >= 3;
const still = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Route order: modules in order, lessons in catalog order inside each module.
const ROUTE = ALGORITHM_TRACKS.flatMap((tr, k) => ALGORITHM_TOPICS.filter(m => m.track === tr.id).map(m => ({ ...m, color: COLORS[k % COLORS.length], module: k })));

// ---------- Metro map: a serpentine of five stations per row ----------
const ROW = 5, X = i => 100 + 200 * i, Y = r => 70 + 150 * r, R = 75;
function station(i) { const r = Math.floor(i / ROW), c = i % ROW; return [X(r % 2 ? ROW - 1 - c : c), Y(r)]; }
function segment(i) {
  const [x1, y1] = station(i), [x2, y2] = station(i + 1);
  return y1 === y2 ? `M${x1} ${y1} H${x2}` : `M${x1} ${y1} A${R} ${R} 0 0 ${x1 > 500 ? 1 : 0} ${x2} ${y2}`;
}
function metro() {
  const rows = Math.ceil(ROUTE.length / ROW), H = Y(rows - 1) + 80, next = ROUTE.find(m => !done(m));
  const segs = ROUTE.slice(0, -1).map((m, i) => `<path d="${segment(i)}" stroke="${m.color}" class="metro-line"/>`).join('');
  const whole = ROUTE.slice(0, -1).map((_, i) => segment(i)).join(' ');
  const train = still() ? '' : `<circle r="7" class="metro-train"><animateMotion dur="${ROUTE.length * 2.4}s" repeatCount="indefinite" path="${whole}"/></circle>`;
  const stations = ROUTE.map((m, i) => {
    const [x, y] = station(i);
    return `<a class="metro-station${m.kind === 'structure' ? ' structure' : ''}${done(m) ? ' done' : ''}${m === next ? ' next' : ''}" href="#topic/${m.id}" style="left:${x / 10}%;top:${y / H * 100}%;--mc:${m.color}">
      <span class="metro-dot"></span><span class="metro-name"><small>${String(i + 1).padStart(2, '0')}</small>${short(m)}</span></a>`;
  }).join('');
  return `<div class="metro" style="aspect-ratio:1000/${H}"><svg viewBox="0 0 1000 ${H}" aria-hidden="true">${segs}${train}</svg>${stations}</div>`;
}

// ---------- Hero: bottom-up merge sort, bars keep identity and slide ----------
function heroSort(host) {
  const vals = [7, 2, 10, 4, 12, 1, 9, 5, 11, 3, 8, 6], n = vals.length, states = [[...vals]], ranges = [null];
  for (let w = 1; w < n; w *= 2) for (let lo = 0; lo < n; lo += 2 * w) {
    const mid = Math.min(lo + w, n), hi = Math.min(lo + 2 * w, n); if (mid >= hi) continue;
    const a = [...states.at(-1)]; a.splice(lo, hi - lo, ...a.slice(lo, hi).sort((p, q) => p - q)); states.push(a); ranges.push([lo, hi]);
  }
  states.push([...vals]); ranges.push(null);
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), W = 38;
  svg.setAttribute('viewBox', '0 0 480 300'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', t(TEXT.hero));
  const band = document.createElementNS(NS, 'rect'); band.setAttribute('class', 'sort-band'); band.setAttribute('y', 270); band.setAttribute('height', 6); band.setAttribute('rx', 3); svg.append(band);
  const bars = Object.fromEntries(vals.map(v => {
    const r = document.createElementNS(NS, 'rect'); r.setAttribute('width', W - 8); r.setAttribute('height', v * 19); r.setAttribute('y', 260 - v * 19); r.setAttribute('rx', 5);
    r.setAttribute('fill', `hsl(${170 + v * 8} 60% ${50 + v * 1.5}%)`); svg.append(r); return [v, r];
  }));
  const place = (state, k = 1, from = state) => state.forEach((v, i) => bars[v].setAttribute('x', 12 + lerp(from.indexOf(v), i, k) * W));
  host.append(svg); place(states[0]);
  if (still()) { place(states.at(-2)); return () => {}; }
  let s = 0, stop = () => {}, timer;
  const step = () => {
    const from = states[s], to = states[(s + 1) % states.length], range = ranges[(s + 1) % states.length]; s = (s + 1) % states.length;
    band.style.opacity = range ? 1 : 0; if (range) { band.setAttribute('x', 12 + range[0] * W); band.setAttribute('width', (range[1] - range[0]) * W - 8); }
    stop = tween(700, k => place(to, k, from), () => { timer = setTimeout(step, s === states.length - 2 ? 1800 : 350); });
  };
  timer = setTimeout(step, 600);
  return () => { stop(); clearTimeout(timer); };
}

export function mountAlgorithms(root) {
  const next = ROUTE.find(m => !done(m)), count = ROUTE.filter(done).length, minutes = ROUTE.reduce((s, m) => s + m.minutes, 0);
  const cta = next ? `<a class="btn primary" href="#topic/${next.id}">${t(count ? TEXT.next : TEXT.start)}: ${short(next)} →</a>` : `<a class="btn primary" href="#topic/${ROUTE[0].id}">${t(TEXT.again)} →</a>`;
  root.innerHTML = `
    <div class="home algo-page">
      <section class="algo-hero">
        <div class="algo-hero-text">
          <p class="eyebrow">${t(TEXT.eyebrow)}</p>
          <h1>${t(TEXT.h1)}</h1>
          <p class="lead">${t(TEXT.lead)}</p>
          <ul class="algo-stats">
            <li><b>${ROUTE.length}</b>${t(TEXT.lessons)}</li><li><b>${ALGORITHM_TRACKS.length}</b>${t(TEXT.modules)}</li>
            <li><b>≈ ${(minutes / 60).toFixed(1).replace('.', getDecimal())}</b>${t(TEXT.hours)}</li><li><b>&lt;/&gt;</b>${t(TEXT.python)}</li>
          </ul>
          <div class="cta">${cta}<a class="btn" href="#algorithms" data-scroll="#algo-map">${t(TEXT.map)}</a></div>
          <div class="algo-progress" role="img" aria-label="${count} / ${ROUTE.length}"><span style="width:${count / ROUTE.length * 100}%"></span></div>
          <p class="algo-progress-label">${count} / ${ROUTE.length} ${t(TEXT.progress)}</p>
        </div>
        <figure class="algo-hero-visual"><div class="algo-sort"></div><figcaption>${t(TEXT.hero)}</figcaption></figure>
      </section>

      <section class="algo-block" id="algo-map">
        <div class="section-head"><h2>${t(TEXT.map)}</h2><p>${t(TEXT.mapLead)}</p></div>
        <div class="metro-legend"><span class="metro-kind"><i class="sq"></i>${t(TEXT.structure)}</span><span class="metro-kind"><i></i>${t(TEXT.algorithm)}</span>${ALGORITHM_TRACKS.map((tr, k) => `<a href="#algorithms" data-scroll="#algo-m${k + 1}" style="--mc:${COLORS[k]}"><span></span>${t(tr.title)}</a>`).join('')}</div>
        ${metro()}
      </section>

      <section class="algo-block">
        <div class="section-head"><h2>${t(TEXT.shape)}</h2><p>${t(TEXT.kinds)}</p></div>
        <h3 class="algo-kind structure">${t(TEXT.structure)} · ${STRUCTURE_SHAPE.length} ${t(L('шагов', 'steps'))}</h3>
        <ol class="algo-chain">${STRUCTURE_SHAPE.map(s => `<li>${t(s)}</li>`).join('')}</ol>
        <h3 class="algo-kind">${t(TEXT.algorithm)} · ${LESSON_SHAPE.length} ${t(L('шагов', 'steps'))}</h3>
        <ol class="algo-shape">${LESSON_SHAPE.map((s, i) => `<li><span>${i + 1}</span><b>${t(s)}</b><p>${t(TEXT.shapeText[i])}</p></li>`).join('')}</ol>
      </section>

      <section class="algo-block">
        <div class="section-head"><h2>${t(TEXT.route)}</h2><p>${t(ALGORITHMS_SUBJECT.summary)}</p></div>
        <ol class="path">${ALGORITHM_TRACKS.map((tr, k) => `
          <li class="path-module" id="algo-m${k + 1}" style="--mc:${COLORS[k]}"><span class="path-num">${k + 1}</span>
            <div class="path-body"><h3>${t(tr.title)}</h3><p>${t(tr.summary)}</p>
              <div class="path-cards">${ROUTE.filter(m => m.track === tr.id).map(m => {
                const p = Math.min(3, algorithmProgress(m.id));
                return `<a class="node ready path-card${m.kind === 'structure' ? ' is-structure' : ''}" href="#topic/${m.id}">
                  <span class="node-kicker">${t(m.kicker)}</span><span class="node-title">${t(m.title)}</span>
                  <span class="node-summary">${t(m.summary)}</span>
                  <span class="node-meta">${m.minutes} min<span class="card-progress" aria-label="${p} / 3">${[0, 1, 2].map(j => `<i class="${j < p ? 'on' : ''}"></i>`).join('')}</span></span></a>`;
              }).join('')}</div></div></li>`).join('')}
        </ol>
      </section>

      <section class="algo-block">
        <div class="section-head"><h2>${t(TEXT.cheat)}</h2><p>${t(TEXT.cheatLead)}</p></div>
        <table class="algo-cheat"><thead><tr><th>${t(TEXT.lesson)}</th><th>${t(TEXT.cost)}</th></tr></thead><tbody>
          ${ROUTE.map(m => `<tr style="--mc:${m.color}"><td><a href="#topic/${m.id}">${short(m)}</a></td><td data-cost="${m.id}">${m.id === 'binary-search' ? 'O(log n) · O(1)' : '…'}</td></tr>`).join('')}
        </tbody></table>
      </section>
      <footer class="foot">MathLab · <a href="#topics">Topics</a> · <a href="#algorithms">Algorithms</a> · <a href="#worlds">Worlds</a> · <a href="#lab">Lab</a></footer>
    </div>`;
  const stopSort = heroSort(root.querySelector('.algo-sort'));
  // In-page links: the hash belongs to the router, so scroll by hand.
  const onClick = e => { const a = e.target.closest('[data-scroll]'); if (!a) return; e.preventDefault(); root.querySelector(a.dataset.scroll)?.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'start' }); };
  root.addEventListener('click', onClick);
  // The cheat sheet needs the lesson texts; load them after the page is on screen.
  let alive = true;
  Promise.all([import('../topics/algorithms/pattern-lessons.js'), import('../topics/algorithms/structure-lessons.js')]).then(([{ LESSONS }, { STRUCTURES }]) => {
    if (!alive) return;
    root.querySelectorAll('[data-cost]').forEach(td => { const l = LESSONS[td.dataset.cost] || STRUCTURES[td.dataset.cost]; if (l) td.textContent = t(l.cost); });
  });
  return () => { alive = false; stopSort(); root.removeEventListener('click', onClick); };
}
function getDecimal() { return t(L(',', '.')); }
