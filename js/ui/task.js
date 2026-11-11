// A task inside a topic ("Try it yourself"): the student builds something on the live scene and the program
// checks it and explains the mistake — without AI, by comparing with the answer and with known mistakes.
//
// Two kinds:
//   drag    — move points on the scene so that parameters reach the target:
//             { kind: 'drag', target: { h: 2, k: 1 }, tol, mistakes: [{ params: { h: -2, k: 1 }, text }], hints: { h: text } }
//   formula — read a graph and type its formula:
//             { kind: 'formula', answer: 'y = sqrt(x - 3)', range: [lo, hi], mistakes: [{ formula: 'y = sqrt(x + 3)', text }] }
// Both: right (shown when solved), back (index of the step to revisit after a mistake).

import { analyze, compile } from '../core/expr.js';
import { same, diagnose, explainDiff } from '../core/check.js';
import { t } from '../core/i18n.js';
import { renderMath, renderTex } from './tex.js';

export function taskHTML(task) {
  return `
    <div class="task">
      ${task.kind === 'formula'
        ? `<form class="task-form"><span class="task-y">y =</span><input spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Formula"><button class="btn primary" type="submit">Check</button></form>`
        : '<button class="btn primary task-check" type="button">Check</button>'}
      <div class="task-feedback" aria-live="polite"></div>
      <button class="ghost task-show" type="button" hidden>Show the answer</button>
    </div>`;
}

// Wires one task. ctx: { scene, stepLabel(i) → text, goto(i) }. Returns { enter() } for when its step becomes active.
export function bindTask(el, task, index, ctx) {
  const { scene } = ctx;
  const box = el.querySelector('.task'), feedback = box.querySelector('.task-feedback'), showBtn = box.querySelector('.task-show');
  let attempts = 0, solved = false, student = null;

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
  function checkDrag() {
    const tol = task.tol ?? 0.13;
    if (near(task.target, tol)) { say(true, t(task.right) || ''); return after(true); }
    const m = (task.mistakes || []).find(mm => mm.params && near(mm.params, tol));
    if (m) { say(false, t(m.text), m.back ?? task.back); return after(false); }
    // Which parameters are off, in the words of the task
    const off = Object.keys(task.target).filter(name => Math.abs(scene.params.get(name).value - task.target[name]) > tol);
    say(false, off.map(name => t((task.hints || {})[name]) || t({ en: `${name} is not right yet.`, ru: `${name} пока не то.` })).join(' '));
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
    const raw = input.value.trim().replace(/^y\s*=\s*/, '');
    if (!raw) return;
    if (!student) student = scene.add('', { id: `student-${index}`, color: 'orange', legend: false });
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

  if (task.kind === 'formula') {
    const form = box.querySelector('form'), input = form.querySelector('input');
    form.addEventListener('submit', e => { e.preventDefault(); checkFormula(input); });
    showBtn.addEventListener('click', () => {
      input.value = task.answer.replace(/^y\s*=\s*/, '');
      checkFormula(input);
      feedback.innerHTML = `<span class="verdict">${t({ en: 'Answer:', ru: 'Ответ:' })}</span> <span class="task-answer"></span>`;
      renderTex(feedback.querySelector('.task-answer'), analyze(task.answer, scene.defs).tex);
      showBtn.hidden = true;
    });
  } else {
    box.querySelector('.task-check').addEventListener('click', checkDrag);
    showBtn.addEventListener('click', () => {
      scene.animateParams(task.target, 1200);
      feedback.innerHTML = `<span class="verdict">${t({ en: 'Here is the answer.', ru: 'Вот ответ.' })}</span> ${t(task.right) || ''}`;
      renderMath(feedback);
      showBtn.hidden = true;
    });
  }

  return {
    // The student's graph is shown again when the student comes back to this task
    enter() { if (student && student.info.kind === 'function') student.visible = true; },
    get solved() { return solved; },
  };
}
