// Topic player, one step at a time like slides: on the left a panel with the step — text, the live formulas,
// the sliders it talks about, a question or a task — and Back / Next; on the right the live scene
// (on phones: the scene on top, the panel under it). Each step sets the scene's state: parameters,
// visible objects, view, camera. The step is kept in the address (#topic/<id>/<n>), so a reload or a
// shared link opens the same step.
// A step may ask a question first ("predict, then check"): the answer is shown on the scene by
// check.reveal(scene, stage) only after the student has made a guess. A hint opens on demand.
// Proofs are steps too (step.proof): part of the main path, each with a «skip the proof» link.

import { Scene } from '../core/scene.js';
import { Stage } from '../ui/stage.js';
import { paramControl } from '../ui/params.js';
import { renderTex, renderMath } from '../ui/tex.js';
import { t } from '../core/i18n.js';
import { fmt } from '../core/numeric.js';
import { SUBJECTS, TRACKS, topicMeta, loadTopic } from '../topics/index.js';
import { encodeLab } from './lab.js';
import { taskHTML, bindTask } from '../ui/task.js';
import { CRYPTO_TOPIC_LABS, CRYPTO_WORLDS } from '../worlds/crypto/catalog.js';
import { mountFilm } from '../ui/film.js';

const PRACTICE = {
  title: { en: 'Try it yourself', ru: 'Попробуйте сами' },
  text: {
    en: 'Build it on the scene and press Check. A mistake is not a failure: the program says what exactly differs and where to look again.',
    ru: 'Постройте на сцене и нажмите Check. Ошибка — не провал: программа скажет, что именно не так и куда вернуться.',
  },
};

const chip = id => {
  const m = topicMeta(id);
  if (!m) return '';
  return m.status === 'ready'
    ? `<a class="chip" href="#topic/${id}">${t(m.title)}</a>`
    : `<span class="chip planned" title="Planned">${t(m.title)}</span>`;
};

export async function mountTopic(root, id, startStep = 0, { signal } = {}) {
  const meta = topicMeta(id);
  const topic = meta && meta.status === 'ready' ? await loadTopic(id) : null;
  // Imports cannot be aborted; discard stale results before touching the DOM or allocating a scene.
  if (signal?.aborted) return () => {};
  if (!topic) {
    root.innerHTML = `<div class="empty"><h1>${meta ? t(meta.title) : 'Not found'}</h1><p>${meta ? 'This topic is planned.' : ''}</p><a href="#">← Back to the map</a></div>`;
    return () => {};
  }

  const scene = new Scene();
  topic.setup(scene);
  const track = TRACKS.find(tr => tr.id === meta.track);
  const subject = SUBJECTS.find(x => x.id === track.subject);
  const N = topic.steps.length;
  const taskNo = i => topic.steps.slice(0, i + 1).filter(x => x.task).length;
  // A proof is a run of steps with `proof`: one thought and one picture per step, inside the main path.
  // Every proof step can be skipped to the step after the proof; the first one states what is proved.
  const proofOf = i => {
    if (!topic.steps[i] || !topic.steps[i].proof) return null;
    let a = i, b = i;
    while (a > 0 && topic.steps[a - 1].proof) a--;
    while (b + 1 < N && topic.steps[b + 1].proof) b++;
    return { a, b, k: i - a + 1, n: b - a + 1 };
  };
  const proofHead = (s, i) => {
    const g = proofOf(i);
    if (!g) return '';
    const statement = topic.steps[g.a].statement;
    return `<div class="proof-head">
      <span class="proof-label">${t({ en: 'Proof', ru: 'Доказательство' })} · ${g.k} / ${g.n}</span>
      ${g.k === 1 && statement ? `<div class="proof-statement">${t(statement)}</div>` : ''}
      <button type="button" class="ghost proof-skip" data-go="${g.b + 1}">${t({ en: 'Skip the proof', ru: 'Пропустить доказательство' })} →</button>
    </div>`;
  };

  root.innerHTML = `
    <article class="topic topic-player">
      <section class="panel">
        <div class="panel-top">
          <div class="crumbs"><a href="#topics/${subject.id}">${t(subject.title)}</a><span>/</span><span>${t(track.title)}</span></div>
          <details class="step-menu">
            <summary>${t({ en: 'Lesson steps', ru: 'Шаги темы' })}<span class="step-position"></span></summary>
            <nav class="step-list" aria-label="${t({ en: 'Lesson steps', ru: 'Шаги темы' })}">
              ${topic.steps.map((s, i) => `<button type="button" data-go="${i}" class="step-link"><span class="step-index">${i + 1}</span><span>${t(s.title)}<small>${t(s.task ? { en: 'Practice', ru: 'Задание' } : s.proof ? { en: 'Proof', ru: 'Доказательство' } : { en: 'Explore', ru: 'Исследование' })}</small></span><span class="step-result"></span></button>`).join('')}
            </nav>
          </details>
          <div class="dots" aria-label="${t({ en: 'Progress', ru: 'Прогресс' })}">
            ${topic.steps.map((s, i) => `<button type="button" class="dot${s.task ? ' is-task' : ''}${s.proof ? ' is-proof' : ''}" data-go="${i}" title="${i + 1}. ${t(s.title).replace(/"/g, '&quot;')}" aria-label="Step ${i + 1}"></button>`).join('')}
            <span class="counter"></span>
          </div>
        </div>

        <div class="panel-body">
          <header class="topic-head">
            <h1>${t(meta.title)}</h1>
            <p class="lead">${t(meta.summary)}</p>
            ${meta.prereqs && meta.prereqs.length ? `<div class="prereqs"><span class="label">Builds on</span>${meta.prereqs.map(chip).join('')}</div>` : ''}
            ${CRYPTO_TOPIC_LABS[id] ? `<div class="prereqs topic-labs"><span class="label">${t({ en: 'Try an attack', ru: 'Исследовать атаку' })}</span>${CRYPTO_TOPIC_LABS[id].map(wid => `<a class="chip" href="#world/${wid}">${t(CRYPTO_WORLDS.find(w => w.id === wid).title)} ↗</a>`).join('')}</div>` : ''}
          </header>
          ${topic.steps.map((s, i) => `
            <section class="step${s.task ? ' task-step' : ''}" data-i="${i}" hidden>
              ${s.task && taskNo(i) === 1 ? `<div class="practice-head"><h2>${t(PRACTICE.title)}</h2><p>${t(PRACTICE.text)}</p></div>` : ''}
              ${proofHead(s, i)}
              <div class="step-num">${s.task ? `Task ${taskNo(i)}` : String(i + 1).padStart(2, '0')}</div>
              <h2>${t(s.title)}</h2>
              ${s.try ? `<details class="step-explanation" open><summary>${t({ en: 'Why it works', ru: 'Почему так' })}</summary><div class="step-text">${t(s.text)}</div></details>` : `<div class="step-text">${t(s.text)}</div>`}
              <div class="live-slot"></div>
              ${s.try ? `<p class="try"><span class="try-label">${t({ en: 'Try it', ru: 'Попробуйте' })}</span>${t(s.try)}</p>` : ''}
              ${s.task ? taskHTML(s.task) : ''}
              ${s.check ? `
                <div class="check">
                  <span class="check-label">Predict, then check</span>
                  <div class="check-q">${t(s.check.q)}</div>
                  <div class="check-options">${s.check.options.map((o, k) => `<button type="button" data-k="${k}">${t(o.text)}</button>`).join('')}</div>
                  <div class="check-explain"></div>
                </div>` : ''}
              ${s.hint ? `<details class="hint"><summary>${t(s.hint.title) || 'Stuck? Open a hint'}</summary><div class="hint-body">${t(s.hint.text || s.hint)}</div></details>` : ''}
            </section>`).join('')}
          <section class="step end" data-i="${N}" hidden>
            <div class="step-num">✓</div>
            <h2>${t({ en: 'Where next', ru: 'Куда дальше' })}</h2>
            <div class="next-list">${(meta.next || []).map(chip).join('')}</div>
            <p><a href="#topics/${subject.id}">← ${t({ en: 'Back to the map', ru: 'Назад к карте' })}</a></p>
          </section>
          <div class="live">
            <div class="legend"></div>
            <div class="controls"></div>
          </div>
        </div>

        <nav class="panel-nav">
          <button type="button" class="btn" data-nav="-1">← Back</button>
          <button type="button" class="btn primary" data-nav="1">Next →</button>
        </nav>
      </section>

      <aside class="topic-stage">
        <div class="scene-tools">
          <span class="scene-step-title"></span>
          <button class="ghost" type="button" data-act="restart">↺ ${t({ en: 'Reset scene', ru: 'Сбросить сцену' })}</button>
          ${topic.film ? `<button class="ghost" type="button" data-act="film">▶ ${t({ en: 'Story', ru: 'Ролик' })}</button>` : ''}
          ${topic.lab === false ? '' : '<button class="ghost" type="button" data-act="lab">Open in Lab</button>'}
        </div>
        <div class="stage-host"></div>
        <div class="scene-action" hidden></div>
      </aside>
      ${topic.film ? '<div class="film-host" hidden></div>' : ''}
    </article>`;
  renderMath(root.querySelector('.panel-body'));

  const $ = s => root.querySelector(s);
  const stage = new Stage($('.stage-host'), scene, { mode: topic.view, view2d: topic.view2d, view3d: topic.view3d });
  const sections = [...root.querySelectorAll('.step[data-i]')]; // N steps + the end
  const live = $('.live'), legendEl = $('.legend'), controlsEl = $('.controls');
  const body = $('.panel-body');

  // ---- Legend: formulas of what is on the stage, in the colors of the objects, with live numbers ----
  let legendKey = '';
  const updateLegend = () => {
    const scope = scene.scope();
    const entries = [
      ...scene.items.filter(i => i.visible && i.legend && i.info.tex && i.info.kind !== 'param').map(i => `\\textcolor{${i.color}}{${i.info.tex}}`),
      ...scene.custom.filter(c => c.visible && c.legend).map(c => c.legend({ ...scope }, scene)).filter(Boolean),
    ];
    const key = entries.join('|');
    if (key === legendKey) return;
    legendKey = key;
    legendEl.innerHTML = entries.map(() => '<div class="legend-row"></div>').join('');
    [...legendEl.children].forEach((el, i) => renderTex(el, `\\displaystyle ${entries[i]}`));
  };

  // ---- Parameter controls of the current step ----
  let controls = [];
  const setControls = names => {
    controlsEl.innerHTML = '';
    controls = names.filter(n => scene.params.has(n)).map(n => paramControl(scene, n));
    controls.forEach(c => controlsEl.appendChild(c.el));
  };

  const off = scene.on(() => {
    updateLegend();
    controls.forEach(c => c.update());
  });

  // ---- Steps ----
  let active = -1;
  const answered = new Set();
  let tasks = [];
  let restartParams = {};
  let restartView = topic.view;
  const narrow = matchMedia('(max-width: 900px)');
  const syncExplanations = () => root.querySelectorAll('.step-explanation').forEach(el => { el.open = !narrow.matches; });
  syncExplanations();
  narrow.addEventListener('change', syncExplanations);
  const updateProgress = () => {
    root.querySelectorAll('.dot').forEach((d, k) => {
      d.classList.toggle('current', k === active);
      d.classList.toggle('done', k < active);
      d.classList.toggle('solved', !!tasks[k]?.solved);
      if (k === active) d.setAttribute('aria-current', 'step');
      else d.removeAttribute('aria-current');
    });
    root.querySelectorAll('.step-link').forEach((el, k) => {
      if (k === active) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
      el.querySelector('.step-result').textContent = tasks[k]?.solved ? '✓' : '';
    });
  };

  const show = (i, restart = false) => {
    i = Math.max(0, Math.min(N, i));
    if (i === active && !restart) return;
    const back = i < active;
    active = i;
    sections.forEach((el, k) => { el.hidden = k !== i; });
    $('.topic-head').hidden = i !== 0;
    updateProgress();
    $('.step-menu').open = false;
    $('.counter').textContent = i < N ? `${i + 1} / ${N}` : `${N} / ${N}`;
    $('.step-position').textContent = i < N ? `${i + 1} / ${N}` : '✓';
    $('.scene-step-title').textContent = i < N ? t(topic.steps[i].title) : t({ en: 'Where next', ru: 'Куда дальше' });
    $('[data-act="restart"]').hidden = i === N;
    // Keep a single instruction node: it follows its step into the scene footer.
    const action = $('.scene-action'), oldTry = action.querySelector('.try');
    if (oldTry) sections[+oldTry.dataset.step].appendChild(oldTry);
    const instruction = sections[i].querySelector('.try');
    if (instruction) { instruction.dataset.step = i; action.appendChild(instruction); }
    action.hidden = !instruction;
    $('[data-nav="-1"]').disabled = i === 0;
    const next = $('[data-nav="1"]');
    next.hidden = i === N;
    next.textContent = i === N - 1 ? `${t({ en: 'Finish', ru: 'Готово' })} ✓` : `${t({ en: 'Next', ru: 'Далее' })} →`;
    $('[data-nav="-1"]').textContent = `← ${t({ en: 'Back', ru: 'Назад' })}`;
    sections[i].classList.remove('enter', 'enter-back');
    void sections[i].offsetWidth; // restart the entry animation
    sections[i].classList.add(back ? 'enter-back' : 'enter');
    body.scrollTop = 0;
    // On a phone the page itself scrolls: come back to the start of the new step (the scene stays on top)
    if (active !== -1 && matchMedia('(max-width: 900px)').matches && window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', `#topic/${id}${i ? `/${i + 1}` : ''}`);

    scene.stopTween?.();
    for (const p of scene.params.values()) p.playing = false;
    if (i === N) { live.hidden = true; stage.p3?.autoRotate(false); scene.changed(); return; } // "Where next" keeps the last scene
    live.hidden = false;
    sections[i].querySelector('.live-slot').appendChild(live);

    const step = topic.steps[i], st = step.state || {};
    if (restart) {
      for (const [name, value] of Object.entries(restartParams)) scene.setParam(name, value);
      stage.setMode(restartView);
      stage.reset();
    } else {
      restartParams = { ...Object.fromEntries([...scene.params].map(([name, p]) => [name, p.value])), ...st.params };
      restartView = st.view || stage.mode;
    }
    if (st.view) stage.setMode(st.view);
    if (st.show) scene.showOnly(st.show);
    if (st.params && !restart) scene.animateParams(st.params, st.ms ?? 1000);
    if (st.window && stage.p2) stage.p2.setView(typeof st.window === 'function' ? st.window(scene) : st.window, st.windowMs || 1200);
    if (st.camera && stage.p3) stage.p3.setCamera(st.camera);
    if (stage.p3) stage.p3.autoRotate(!!st.rotate);
    (st.play || []).forEach(name => scene.play(name, true));
    setControls(st.controls || topic.controls || []);
    if (step.enter) step.enter(scene, stage);
    if (answered.has(i) && step.check.reveal) step.check.reveal(scene, stage);
    if (step.task && !tasks[i]) tasks[i] = bindTask(sections[i], step.task, i, {
      scene, goto: show, stepLabel: k => `${k + 1}. ${t(topic.steps[k].title)}`,
    });
    if (tasks[i]) tasks[i].enter();
    // In a task the Lab would show the formula of the goal graph — the answer
    const labBtn = $('[data-act=lab]');
    if (labBtn) labBtn.hidden = !!step.task;
    legendKey = '';
    scene.changed();
  };

  // ---- Tasks: built on the scene, checked, mistakes explained ----
  // Create task controllers only when visited. Preserve them for subsequent attempts.
  let solvedTimer;
  const onTaskClick = e => {
    if (!e.target.closest('.task')) return;
    clearTimeout(solvedTimer);
    solvedTimer = setTimeout(updateProgress, 0);
  };
  root.addEventListener('click', onTaskClick);

  // ---- Questions: one guess, then the explanation and the answer on the scene ----
  sections.forEach((el, i) => {
    const check = i < N && topic.steps[i].check;
    if (!check) return;
    const box = el.querySelector('.check'), explain = box.querySelector('.check-explain');
    box.querySelectorAll('button[data-k]').forEach(b => b.addEventListener('click', () => {
      if (answered.has(i)) return;
      answered.add(i);
      const k = +b.dataset.k, ok = !!check.options[k].ok;
      box.querySelectorAll('button[data-k]').forEach(o => {
        o.disabled = true;
        if (check.options[+o.dataset.k].ok) o.classList.add('right');
      });
      if (!ok) b.classList.add('wrong');
      box.classList.add('answered');
      explain.innerHTML = `<span class="verdict ${ok ? 'right' : 'wrong'}">${ok ? 'Right.' : 'Not quite.'}</span> ${t(check.explain)}`;
      renderMath(explain);
      if (i === active && check.reveal) { check.reveal(scene, stage); scene.changed(); }
    }));
  });

  // ---- Navigation: buttons, dots, keyboard ----
  root.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => show(active + +b.dataset.nav)));
  root.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
    const inMenu = !!b.closest('.step-menu');
    show(+b.dataset.go);
    if (inMenu) { $('.step-menu').open = false; $('.step-menu summary').focus(); }
  }));
  $('[data-act="restart"]').addEventListener('click', () => show(active, true));
  const onKey = e => {
    if (film) return; // the film has its own keys
    if (e.target.closest('input, textarea, summary, .step-menu button, [contenteditable]') || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); show(active + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); show(active - 1); }
  };
  window.addEventListener('keydown', onKey);

  // The current scene, editable, in the Lab
  if (topic.lab !== false) $('[data-act=lab]').addEventListener('click', () => {
    const used = new Set();
    // The user's functions (f(x) = …) go along even when hidden: the visible lines may use them
    const items = scene.items.filter(i => (i.visible || i.info.name) && i.info.kind !== 'error').map(i => {
      (i.info.params || []).forEach(p => used.add(p));
      return i.text;
    });
    used.forEach(name => items.push(`${name} = ${fmt(scene.params.get(name).value)}`));
    location.hash = `#lab?s=${encodeLab({ items, mode: stage.mode })}`;
  });

  show(Math.max(0, Math.min(N - 1, startStep)));

  // ---- The film: a short story before the steps; it opens by itself at the start of the topic ----
  let film = null, filmToken = 0;
  const closeFilm = () => {
    filmToken++;
    film?.dispose(); film = null;
    $('.topic-player').classList.remove('film-mode');
    $('.film-host').hidden = true;
    stage.p2?.request?.(); scene.changed();
  };
  const openFilm = async () => {
    const token = ++filmToken, def = await topic.film();
    if (token !== filmToken || !root.isConnected) return;
    film?.dispose();
    $('.topic-player').classList.add('film-mode');
    $('.film-host').hidden = false;
    film = mountFilm($('.film-host'), def, { onExplore: closeFilm });
  };
  if (topic.film) {
    $('[data-act=film]').addEventListener('click', openFilm);
    if (startStep === 0) openFilm();
  }

  return () => {
    narrow.removeEventListener('change', syncExplanations);
    window.removeEventListener('keydown', onKey);
    root.removeEventListener('click', onTaskClick);
    clearTimeout(solvedTimer);
    filmToken++;
    film?.dispose();
    off();
    stage.dispose();
    scene.dispose();
  };
}
