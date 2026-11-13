// A task inside a topic ("Try it yourself"): the student builds something on the live scene and the program
// checks it and explains the mistake — without AI, by comparing with the answer and with known mistakes.
//
// Three kinds:
//   drag    — move points on the scene so that parameters reach the target:
//             { kind: 'drag', target: { h: 2, k: 1 }, tol, mistakes: [{ params: { h: -2, k: 1 }, text }], hints: { h: text } }
//             target may be a list when several places are right; a hint may be a function of the parameter's value
//   formula — read a graph and type its formula:
//             { kind: 'formula', answer: 'y = sqrt(x - 3)', range: [lo, hi], mistakes: [{ formula: 'y = sqrt(x + 3)', text }] }
//             lhs: the letter in front of the input when the height is not called y (a slice of a surface: 'z')
//   sketch  — draw a graph by hand (mouse or finger); compared by its shape — turns and zeros, not by numbers:
//             { kind: 'sketch', answer: 'y = 3x^2/4 - 1', range: [lo, hi], check: ['turns', 'zeros'], tol, noise,
//               mistakes: [{ formula: 'y = x^3/4 - x', text }] }
// All: right (shown when solved), back (index of the step to revisit after a mistake).

import { analyze, compile } from '../core/expr.js';
import { same, diagnose, explainDiff, shape, compareShape, explainShape } from '../core/check.js';
import { COLORS } from '../core/palette.js';
import { t } from '../core/i18n.js';
import { renderMath, renderTex } from './tex.js';
import { keypadButton, prepareInput } from './keypad.js';

export function taskHTML(task) {
  return `
    <div class="task">
      ${task.kind === 'formula'
        ? `<form class="task-form"><span class="task-y">${task.lhs || 'y'} =</span><input spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Formula"><button class="btn primary" type="submit">Check</button></form>`
        : '<button class="btn primary task-check" type="button">Check</button>'}
      <div class="task-feedback" aria-live="polite"></div>
      <button class="ghost task-show" type="button" hidden>Show the answer</button>
    </div>`;
}

// Wires one task. ctx: { scene, stepLabel(i) → text, goto(i) }. Returns { enter() } for when its step becomes active.
export function bindTask(el, task, index, ctx) {
  const { scene } = ctx;
  const box = el.querySelector('.task'), feedback = box.querySelector('.task-feedback'), showBtn = box.querySelector('.task-show');
  let attempts = 0, solved = false, student = null, answer = null;

  const say = (ok, html, back = task.back) => {
    box.classList.toggle('solved', ok);
    const link = !ok && back != null ? ` <a href="#" class="task-back" data-goto="${back}">${t({ en: 'Revisit', ru: 'Повторить' })}: ${ctx.stepLabel(back)}</a>` : '';
    feedback.innerHTML = `<span class="verdict ${ok ? 'right' : 'wrong'}">${ok ? 'Right.' : 'Not yet.'}</span> ${html}${link}`;
    renderMath(feedback);
    const a = feedback.querySelector('.task-back');
    if (a) a.addEventListener('click', e => { e.preventDefault(); ctx.goto(+a.dataset.goto); });
  };

  const after = ok => {
    attempts++;
    if (ok) { solved = true; showBtn.hidden = true; return; }
    if (attempts >= 2) showBtn.hidden = false;
  };

  // ---- drag ----
  const near = (values, tol) => Object.entries(values).every(([name, v]) => Math.abs(scene.params.get(name).value - v) <= tol);
  const targets = [].concat(task.target);
  const dist = g => Object.entries(g).reduce((d, [name, v]) => d + Math.abs(scene.params.get(name).value - v), 0);
  const nearest = () => targets.reduce((a, b) => dist(b) < dist(a) ? b : a);
  function checkDrag() {
    const tol = task.tol ?? 0.13;
    if (targets.some(g => near(g, tol))) { say(true, t(task.right) || ''); return after(true); }
    const m = (task.mistakes || []).find(mm => mm.params && near(mm.params, tol));
    if (m) { say(false, t(m.text), m.back ?? task.back); return after(false); }
    // Which parameters are off, in the words of the task
    const goal = nearest(), hint = name => {
      const h = (task.hints || {})[name];
      return typeof h === 'function' ? h(scene.params.get(name).value) : h;
    };
    const off = Object.keys(goal).filter(name => Math.abs(scene.params.get(name).value - goal[name]) > tol);
    say(false, off.map(name => t(hint(name)) || t({ en: `${name} is not right yet.`, ru: `${name} пока не то.` })).join(' '));
    after(false);
  }

  // ---- formula ----
  const fnOf = text => {
    const info = analyze(text, scene.defs);
    if (info.kind !== 'function' || !info.node) return null;
    const fn = compile(info.node), s = scene.scope();
    return x => { s.x = x; return fn(s); };
  };
  function checkFormula(input) {
    const raw = input.value.trim().replace(/^[yz]\s*=\s*/, '');
    if (!raw) return;
    if (!student) student = scene.add('', { id: `student-${index}`, color: 'orange', legend: false, only: '2d' }); // in 3D a graph y = … would lie on the floor
    scene.setText(student, `y = ${raw}`);
    student.visible = true;
    scene.changed();
    if (student.info.kind === 'error') { feedback.innerHTML = `<span class="verdict wrong">${student.info.message}</span>`; return; }
    const fs = fnOf(`y = ${raw}`), fa = fnOf(task.answer);
    if (!fs) { say(false, t({ en: 'Write a function of x: y = …', ru: 'Напишите функцию от x: y = …' })); return after(false); }
    const range = task.range || [-6, 6];
    if (same(fs, fa, range)) { say(true, t(task.right) || ''); return after(true); }
    const m = (task.mistakes || []).find(mm => { const g = fnOf(mm.formula); return g && same(fs, g, range); });
    if (m) { say(false, t(m.text), m.back ?? task.back); return after(false); }
    say(false, `${t(explainDiff(diagnose(fs, fa, range)))} ${t({ en: 'Your graph is orange.', ru: 'Ваш график — оранжевый.' })}`);
    after(false);
  }

  // ---- sketch ----
  // The line is a scene object of its own: while it is on the scene, dragging over the graph draws instead of panning
  let stroke = [];
  const pen = { id: `sketch-${index}`, visible: false, draw2d(p) {
    p.pen = pts => { stroke = pts; scene.changed(); };
    if (stroke.length > 1) p.polyline(stroke, COLORS.orange, 3);
  } };
  if (task.kind === 'sketch') scene.custom.push(pen);
  function checkSketch() {
    const [lo, hi] = task.range, span = hi - lo;
    const pts = [...stroke].sort((a, b) => a[0] - b[0]);
    const gap = pts.slice(1).reduce((g, q, i) => Math.max(g, q[0] - pts[i][0]), 0);
    if (pts.length < 2 || pts[0][0] > lo + 0.05 * span || pts[pts.length - 1][0] < hi - 0.05 * span || gap > 0.15 * span) {
      say(false, t({ en: `Draw one line across the whole picture, from x = ${lo} to x = ${hi}.`, ru: `Проведите одну линию через всю картинку — от x = ${lo} до x = ${hi}.` }));
      return;
    }
    // The line as values at evenly spaced x, a little smoothed: the hand shakes
    const xs = Array.from({ length: 121 }, (_, i) => lo + span * i / 120);
    let k = 0;
    const raw = xs.map(x => {
      while (k < pts.length - 2 && pts[k + 1][0] < x) k++;
      const [a, b] = [pts[k], pts[k + 1]];
      return b[0] === a[0] ? a[1] : a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, (x - a[0]) / (b[0] - a[0])));
    });
    const ys = raw.map((_, i) => { const w = raw.slice(Math.max(0, i - 3), i + 4); return w.reduce((a, v) => a + v, 0) / w.length; });
    const noise = task.noise ?? 0.25, opts = { tol: task.tol ?? 0.4, what: task.check || ['turns', 'zeros'] };
    const of = text => { const f = fnOf(text); return shape(xs, xs.map(f), noise); };
    const st = shape(xs, ys, noise), diff = compareShape(st, of(task.answer), opts);
    if (diff.type === 'same') { say(true, t(task.right) || ''); return after(true); }
    const m = (task.mistakes || []).find(mm => compareShape(st, of(mm.formula), opts).type === 'same');
    if (m) { say(false, t(m.text), m.back ?? task.back); return after(false); }
    say(false, `${t(explainShape(diff))} ${t({ en: 'Draw again: a new line replaces the old one.', ru: 'Нарисуйте ещё раз: новая линия заменит старую.' })}`);
    after(false);
  }

  if (task.kind === 'formula') {
    const form = box.querySelector('form'), input = form.querySelector('input');
    prepareInput(input);
    input.after(keypadButton(input));
    form.addEventListener('submit', e => { e.preventDefault(); checkFormula(input); });
    showBtn.addEventListener('click', () => {
      input.value = task.answer.replace(/^y\s*=\s*/, '');
      checkFormula(input);
      feedback.innerHTML = `<span class="verdict">${t({ en: 'Answer:', ru: 'Ответ:' })}</span> <span class="task-answer"></span>`;
      renderTex(feedback.querySelector('.task-answer'), analyze(task.answer, scene.defs).tex);
      showBtn.hidden = true;
    });
  } else if (task.kind === 'sketch') {
    box.querySelector('.task-check').addEventListener('click', checkSketch);
    showBtn.addEventListener('click', () => {
      if (!answer) answer = scene.add(task.answer, { id: `answer-${index}`, color: 'green', legend: false, only: '2d' });
      answer.visible = true;
      scene.changed();
      feedback.innerHTML = `<span class="verdict">${t({ en: 'Here is the answer — the green line.', ru: 'Вот ответ — зелёная линия.' })}</span> ${t(task.right) || ''}`;
      renderMath(feedback);
      showBtn.hidden = true;
    });
  } else {
    box.querySelector('.task-check').addEventListener('click', checkDrag);
    showBtn.addEventListener('click', () => {
      scene.animateParams(nearest(), 1200);
      feedback.innerHTML = `<span class="verdict">${t({ en: 'Here is the answer.', ru: 'Вот ответ.' })}</span> ${t(task.right) || ''}`;
      renderMath(feedback);
      showBtn.hidden = true;
    });
  }

  return {
    // The student's graph is shown again when the student comes back to this task
    enter() {
      if (student && student.info.kind === 'function') student.visible = true;
      if (answer) answer.visible = true;
      pen.visible = task.kind === 'sketch';
    },
    get solved() { return solved; },
  };
}
