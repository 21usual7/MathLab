// A film inside a topic: a short story in chapters drawn on a canvas, like a video — play, pause, scrub the
// timeline, jump between scenes. It stops for a prediction ("what happens next?"), and "Under the microscope"
// pauses it and opens the knobs of the current scene: what you change stays in the story. At the end (or at
// any moment) "Explore it yourself" goes to the steps of the topic.
//
// A film is data:
//   { title, cover, note, state: () => ({...}),
//     chapters: [{ id, duration (s), title, caption: (p, st) => text, paint: (g, p, st) => void,
//                  ask: { at, q, options: [{ text, ok }], explain },
//                  lens: { text, knobs: [{ key, label, min, max, step }] } }] }
// p is the progress of the chapter 0 → 1; st is the state that the microscope changes. paint draws on a
// 1000 × 560 picture that is scaled into any screen.

import { t } from '../core/i18n.js';

export const W = 1000, H = 560;
export const clamp = x => Math.max(0, Math.min(1, x));
export const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const beat = (p, a, b) => ease((p - a) / (b - a)); // 0 before a, 1 after b, smooth in between
export const mix = (a, b, k) => a + (b - a) * k;
export const duration = chapters => chapters.reduce((s, c) => s + c.duration, 0);
export const chapterStart = (chapters, i) => duration(chapters.slice(0, i));

// The chapter at a moment and how far into it we are
export function chapterAt(chapters, seconds) {
  let start = 0;
  for (let i = 0; i < chapters.length; i++) {
    const c = chapters[i];
    if (seconds < start + c.duration || i === chapters.length - 1) return { index: i, chapter: c, progress: clamp((seconds - start) / c.duration) };
    start += c.duration;
  }
}

const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const tag = (name, cls, text) => { const e = document.createElement(name); if (cls) e.className = cls; if (text != null) e.textContent = typeof text === 'string' ? text : t(text); return e; };
const button = (text, onClick, primary = false) => { const b = tag('button', `btn${primary ? ' primary' : ''}`, text); b.type = 'button'; b.addEventListener('click', onClick); return b; };

// The drawing kit handed to paint(): ctx in picture coordinates and a few shapes
function kit(ctx) {
  const g = {
    ctx, t,
    alpha(a, fn) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); },
    text(value, x, y, size = 28, color = '#e6e9ef', align = 'center', weight = 500, serif = false) {
      ctx.fillStyle = color;
      ctx.font = `${serif ? 400 : weight} ${size}px ${serif ? 'Fraunces, Georgia, serif' : 'Inter, system-ui, sans-serif'}`;
      ctx.textAlign = align; ctx.textBaseline = 'middle';
      ctx.fillText(typeof value === 'object' ? t(value) : String(value), x, y);
    },
    line(x1, y1, x2, y2, color = '#8b95a7', w = 2, dash = []) {
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
    },
    curve(pts, color = '#8b95a7', w = 2) {
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    },
    arrow(x1, y1, x2, y2, color = '#8b95a7', w = 2, head = 10) {
      g.line(x1, y1, x2, y2, color, w);
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - head * Math.cos(a - 0.4), y2 - head * Math.sin(a - 0.4));
      ctx.lineTo(x2 - head * Math.cos(a + 0.4), y2 - head * Math.sin(a + 0.4)); ctx.fill();
    },
    circle(x, y, r, fill, stroke, w = 2) {
      ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, 2 * Math.PI);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke(); }
    },
    box(x, y, w, h, fill = '#151a22', stroke = '#3a4150', r = 12) {
      ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
    },
    // A point that has gone k of the way along a polyline
    along(pts, k) {
      const len = [0];
      for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const d = clamp(k) * len[len.length - 1];
      let i = 1; while (i < pts.length - 1 && len[i] < d) i++;
      const q = (d - len[i - 1]) / (len[i] - len[i - 1] || 1);
      return [mix(pts[i - 1][0], pts[i][0], q), mix(pts[i - 1][1], pts[i][1], q)];
    },
  };
  return g;
}

export function mountFilm(host, film, { onExplore }) {
  const chapters = film.chapters, total = duration(chapters);
  const root = tag('section', 'film');
  root.setAttribute('aria-label', t(film.title));
  const top = tag('header', 'film-top');
  top.append(tag('span', 'film-title', film.title), tag('span', 'film-format', { en: 'A story · pause and explore', ru: 'Ролик · остановитесь и исследуйте' }),
    button({ en: 'Explore it yourself →', ru: 'К экспериментам →' }, () => onExplore()));
  const stage = tag('div', 'film-stage'), canvas = tag('canvas', 'film-canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const cover = tag('div', 'film-cover');
  cover.append(tag('p', '', film.cover), button({ en: '▶ Watch', ru: '▶ Смотреть' }, () => start(), true),
    tag('small', '', { en: `About ${Math.round(total / 60 * 2) / 2} min. Pause at any moment and turn the knobs yourself.`, ru: `Около ${String(Math.round(total / 60 * 2) / 2).replace('.', ',')} мин. В любой момент можно остановиться и покрутить всё самому.` }));
  stage.append(canvas, cover);
  const caption = tag('div', 'film-caption');
  caption.setAttribute('aria-live', 'polite');
  const extra = tag('div', 'film-extra');
  const footer = tag('footer', 'film-footer'), timeline = tag('input', 'film-timeline');
  Object.assign(timeline, { type: 'range', min: 0, max: total, step: 0.05, value: 0 });
  timeline.setAttribute('aria-label', t({ en: 'Time', ru: 'Время' }));
  const nav = tag('div', 'film-nav');
  const play = button({ en: '▶ Play', ru: '▶ Смотреть' }, () => (running ? pause() : start()));
  const prev = button('←', () => jump(frame.index - 1)), next = button('→', () => jump(frame.index + 1));
  prev.setAttribute('aria-label', t({ en: 'Previous scene', ru: 'Предыдущая сцена' }));
  next.setAttribute('aria-label', t({ en: 'Next scene', ru: 'Следующая сцена' }));
  const select = tag('select');
  select.setAttribute('aria-label', t({ en: 'Scene', ru: 'Сцена' }));
  chapters.forEach((c, i) => { const o = tag('option', '', c.title); o.value = i; select.append(o); });
  const lensBtn = button({ en: '⌕ Under the microscope', ru: '⌕ Под микроскопом' }, () => openLens());
  const time = tag('span', 'film-time');
  nav.append(play, prev, next, select, lensBtn, time);
  footer.append(timeline, nav);
  root.append(top, stage, caption, extra, footer);
  if (film.note) root.append(tag('p', 'film-note', film.note));
  host.append(root);

  const ctx = canvas.getContext('2d'), g = kit(ctx), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let st = film.state(), seconds = 0, frame = chapterAt(chapters, 0), running = false, raf = null, last = 0;
  let started = false, disposed = false, lens = false, lensResume = false, width = 0, height = 0, extraKey = '', captionText = '';
  const answers = new Map();

  function resize() {
    const r = stage.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    width = r.width; height = r.height;
    canvas.width = Math.round(width * d); canvas.height = Math.round(height * d);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    draw();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(stage);

  function draw() {
    if (disposed || !width) return;
    const d = Math.min(devicePixelRatio || 1, 2);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.fillStyle = '#050607'; ctx.fillRect(0, 0, width, height);
    frame = chapterAt(chapters, seconds);
    if (started) {
      const s = Math.min(width / W, height / H);
      ctx.save(); ctx.translate((width - W * s) / 2, (height - H * s) / 2); ctx.scale(s, s);
      frame.chapter.paint(g, frame.progress, st);
      ctx.restore();
    }
    timeline.value = seconds;
    time.textContent = `${clock(seconds)} / ${clock(total)}`;
    select.value = frame.index;
    prev.disabled = frame.index === 0;
    next.disabled = frame.index === chapters.length - 1;
    lensBtn.disabled = !started || !frame.chapter.lens;
    root.dataset.chapter = frame.chapter.id;
    const c = started ? t(frame.chapter.caption(frame.progress, st)) : '';
    if (c !== captionText) { caption.textContent = c; captionText = c; }
    const key = lens ? `lens:${frame.chapter.id}` : asking() ? `ask:${frame.chapter.id}` : seconds >= total - 0.01 ? 'end' : '';
    if (key !== extraKey) { extraKey = key; buildExtra(); }
  }
  // A question is shown once the chapter has reached it; the film waits for an answer
  const asking = () => started && frame.chapter.ask && frame.progress >= frame.chapter.ask.at;

  function pause() {
    running = false;
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    play.textContent = t(seconds > 0 ? { en: '▶ Continue', ru: '▶ Дальше' } : { en: '▶ Play', ru: '▶ Смотреть' });
  }
  function tick(now) {
    raf = null;
    if (!running || disposed) return;
    seconds = Math.min(total, seconds + Math.min(0.1, (now - last) / 1000));
    last = now;
    draw();
    if (asking() && !answers.has(frame.chapter.id)) { pause(); return; }
    if (seconds >= total) { pause(); return; }
    raf = requestAnimationFrame(tick);
  }
  function start() {
    if (lens) closeLens(false);
    started = true; cover.hidden = true;
    if (seconds >= total) seconds = 0;
    if (reduced.matches) { // no motion: show the finished picture of the chapter
      seconds = chapterStart(chapters, frame.index) + chapters[frame.index].duration - 0.001;
      pause(); draw(); return;
    }
    running = true;
    play.textContent = t({ en: '❚❚ Pause', ru: '❚❚ Пауза' });
    last = performance.now();
    draw();
    if (raf === null) raf = requestAnimationFrame(tick);
  }
  function jump(i) {
    pause();
    if (lens) closeLens(false);
    started = true; cover.hidden = true;
    i = Math.max(0, Math.min(chapters.length - 1, i));
    seconds = chapterStart(chapters, i) + (reduced.matches ? chapters[i].duration - 0.001 : 0.001);
    draw();
  }
  timeline.addEventListener('input', () => { pause(); if (lens) closeLens(false); started = true; cover.hidden = true; seconds = +timeline.value; draw(); });
  select.addEventListener('change', () => jump(+select.value));

  // Under the caption: a question, the knobs of the microscope or the way out at the end
  function buildExtra() {
    extra.replaceChildren();
    const c = frame.chapter;
    if (lens) {
      const box = tag('div', 'film-lens');
      const head = tag('div', 'film-lens-head');
      head.append(tag('strong', '', { en: 'Under the microscope', ru: 'Под микроскопом' }),
        button({ en: 'Restore', ru: 'Вернуть как было' }, () => { const s0 = film.state(); c.lens.knobs.forEach(k => { st[k.key] = s0[k.key]; }); draw(); extraKey = ''; draw(); }),
        button({ en: 'Back to the story ▶', ru: 'Назад к ролику ▶' }, () => closeLens(true), true));
      box.append(head, tag('p', 'film-lens-text', c.lens.text));
      const knobs = tag('div', 'film-knobs');
      for (const k of c.lens.knobs) {
        const row = tag('label', 'film-knob'), input = tag('input'), out = tag('output');
        Object.assign(input, { type: 'range', min: k.min, max: k.max, step: k.step, value: st[k.key] });
        out.textContent = String(st[k.key]).replace('-', '−');
        input.addEventListener('input', () => { st[k.key] = +input.value; out.textContent = String(st[k.key]).replace('-', '−'); draw(); });
        row.append(tag('span', '', k.label), input, out);
        knobs.append(row);
      }
      box.append(knobs);
      extra.append(box);
      return;
    }
    if (asking()) {
      const q = c.ask, box = tag('div', 'film-question');
      box.append(tag('span', '', q.q));
      const opts = tag('div', 'film-options');
      q.options.forEach(o => opts.append(button(o.text, () => {
        answers.set(c.id, o);
        opts.querySelectorAll('button').forEach((b, k) => { b.disabled = true; if (q.options[k].ok) b.classList.add('right'); });
        if (!o.ok) opts.children[q.options.indexOf(o)].classList.add('wrong');
        box.append(tag('p', `film-feedback ${o.ok ? 'right' : 'wrong'}`, { en: `${o.ok ? 'Right.' : 'Not quite.'} ${t(q.explain)}`, ru: `${o.ok ? 'Верно.' : 'Не совсем.'} ${t(q.explain)}` }),
          button({ en: 'Continue ▶', ru: 'Дальше ▶' }, () => start(), true));
      })));
      box.append(opts);
      const done = answers.get(c.id);
      if (done) { // answered before (after scrubbing back): show it as answered
        extra.append(box);
        opts.children[q.options.indexOf(done)].click();
        return;
      }
      extra.append(box);
      return;
    }
    if (extraKey === 'end') {
      const box = tag('div', 'film-question');
      box.append(tag('span', '', { en: 'That was the story. Now turn the knobs yourself:', ru: 'Это был ролик. Теперь покрутите всё сами:' }),
        button({ en: 'Explore it yourself →', ru: 'К экспериментам →' }, () => onExplore(), true));
      extra.append(box);
    }
  }
  function openLens() {
    if (!frame.chapter.lens) return;
    lensResume = running; pause(); lens = true; root.classList.add('lens-open'); draw();
  }
  function closeLens(resume) {
    lens = false; root.classList.remove('lens-open'); extraKey = '?'; draw();
    if (resume && lensResume) start();
  }

  const onKey = e => {
    if (e.target.closest('input, select, button, textarea')) return;
    if (e.code === 'Space') { e.preventDefault(); running ? pause() : start(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); jump(frame.index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); jump(frame.index - 1); }
  };
  window.addEventListener('keydown', onKey);
  const hidden = () => { if (document.hidden) pause(); };
  document.addEventListener('visibilitychange', hidden);
  resize();
  return {
    dispose() {
      disposed = true; pause(); observer.disconnect();
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', hidden);
      root.remove();
    },
  };
}
