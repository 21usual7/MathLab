// Player of the structure lessons: each step has a kind (story, terms, guided, sandbox, quiz, costs, python, builtin, cheat).
// Solved steps share storage with the pattern lessons (mathlab-pattern-<id>), so progress on the Algorithms page counts them alike.
import { t } from '../../core/i18n.js';
import { L, el, button } from './ui.js';
import { mountPython } from './python-editor.js';
import { STRUCTURES } from './structure-lessons.js';
import { ALGORITHM_TOPICS } from './catalog.js';

const card = (cls, head, body) => { const c = el('div', `pattern-card ${cls}`); if (head) c.append(el('h3', '', head)); if (body) c.append(...[].concat(body)); return c; };

export function createStructureTopic(id) {
  const lesson = STRUCTURES[id], meta = ALGORITHM_TOPICS.find(m => m.id === id);
  return {
    lab: false, setup() {},
    steps: lesson.steps.map(s => ({ title: s.title, text: s.text })),
    mountStage(ui) {
      const player = ui.host.closest('.topic-player'); player.classList.add('algorithm-topic', 'pattern-topic', 'structure-topic');
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('../../../css/algorithms.css', import.meta.url).href; document.head.append(css);
      const root = el('section', 'algorithm-lab pattern-lesson structure-lesson'); ui.host.append(root); let child = null;
      const solved = new Set(); try { JSON.parse(localStorage.getItem(`mathlab-pattern-${id}`) || '[]').filter(Number.isInteger).forEach(i => solved.add(i)); } catch {}
      function solve(i) { if (solved.has(i)) return; solved.add(i); try { localStorage.setItem(`mathlab-pattern-${id}`, JSON.stringify([...solved])); } catch {} ui.onSolve(); }
      const kicker = i => el('p', 'algorithm-eyebrow', L(`${t(meta.title).split(':')[0]} · шаг ${i + 1} из ${lesson.steps.length}`, `${t(meta.title).split(':')[0]} · step ${i + 1} of ${lesson.steps.length}`));

      const render = {
        story(s) {
          const hook = el('div', 'pattern-hook'); hook.append(el('p', '', s.lead)); root.append(hook);
          s.body.forEach(p => root.append(el('p', 'structure-text', p)));
          if (s.callout) root.append(card('experiment', null, el('p', 'pattern-reason', s.callout)));
        },
        terms(s) {
          const grid = el('div', 'structure-terms');
          s.items.forEach(([term, def]) => { const c = el('div', 'structure-term'); c.append(el('code', '', term), el('p', '', def)); grid.append(c); });
          root.append(grid);
        },
        guided(s) {
          const say = el('p', 'structure-say'), host = el('div'), next = button(L('Следующее действие →', 'Next action →'), () => go()), again = button(L('↺ Сначала', '↺ From the start'), () => start()), count = el('span', 'algorithm-muted');
          say.setAttribute('role', 'status'); const bar = el('div', 'algorithm-actions'); bar.append(next, count, again);
          root.append(say, bar, host); let k = 0, box = null, busy = false;
          function start() { box?.dispose(); box = lesson.sandbox(host); host.querySelector('.sandbox')?.classList.add('guided'); k = 0; say.textContent = t(L('Нажмите «Следующее действие». Кнопки песочницы здесь не нужны — сценарий ведёт сам.', 'Press "Next action". The sandbox buttons are not needed here — the script leads.')); upd(); }
          function upd() { count.textContent = `${k} / ${s.script.length}`; next.disabled = k >= s.script.length || busy; }
          async function go() { if (busy || k >= s.script.length) return; const st = s.script[k++]; busy = true; upd(); say.textContent = t(st.say); await box.apply(st.op, st.arg); busy = false; upd(); if (k === s.script.length) say.textContent += ' ' + t(L('Сценарий закончен — дальше песочница в ваших руках.', 'The script is over — next, the sandbox is yours.')); }
          start(); child = { dispose: () => box?.dispose() };
        },
        sandbox(s, i) {
          const list = el('ul', 'structure-goals'), done = new Set(), items = s.goals.map(g => { const li = el('li', '', g.text); list.append(li); return li; });
          const status = el('p', 'algorithm-feedback'); status.setAttribute('role', 'status');
          root.append(el('h3', '', L('Цели', 'Goals')), list, status);
          const box = lesson.sandbox(root, e => {
            s.goals.forEach((g, j) => { if (g.event === e && !done.has(j)) { done.add(j); items[j].classList.add('done'); } });
            if (done.size === s.goals.length) { status.textContent = t(L('Все цели выполнены. Задание засчитано.', 'All goals done. The task is solved.')); status.dataset.valid = 'true'; solve(i); }
          });
          if (solved.has(i)) { items.forEach(li => li.classList.add('done')); status.textContent = t(L('Задание уже засчитано — песочница открыта для экспериментов.', 'Already solved — the sandbox stays open for experiments.')); }
          child = box;
        },
        quiz(s, i) {
          const ok = new Set();
          s.items.forEach((q, j) => {
            const box = el('div', 'structure-q'), fb = el('p', 'algorithm-feedback'), choices = el('div', 'pattern-choices'); fb.setAttribute('role', 'status');
            box.append(el('h3', '', `${j + 1}. ${t(q.q)}`), choices, fb);
            // Authors list the right answer first; show the options rotated so its position gives nothing away.
            const n = q.options.length, order = q.options.map((_, k) => (k + j + 1) % n);
            order.forEach(k => choices.append(button(q.options[k], () => {
              const right = k === q.correct; fb.textContent = `${t(right ? L('Верно. ', 'Correct. ') : L('Не совсем. ', 'Not quite. '))}${t(q.explain)}`; fb.dataset.valid = String(right);
              if (right) ok.add(j); if (ok.size === s.items.length) solve(i);
            })));
            root.append(box);
          });
        },
        costs(s) {
          const table = el('table', 'structure-costs');
          table.innerHTML = `<thead><tr><th>${t(L('Операция', 'Operation'))}</th><th>${t(L('Стоимость', 'Cost'))}</th><th>${t(L('Почему', 'Why'))}</th></tr></thead>`;
          const body = el('tbody'); s.rows.forEach(r => { const tr = el('tr'); r.forEach((c, k) => tr.append(el('td', '', typeof c === 'string' ? c : c))); body.append(tr); }); table.append(body); root.append(table);
        },
        python(s, i) { child = mountPython(root, s.task, { key: id, onSolve: () => solve(i) }); },
        builtin(s) { s.items.forEach(b => root.append(el('pre', 'algorithm-code', b.code), el('p', 'structure-text', b.text))); },
        cheat(s) {
          const list = (head, items) => { const ul = el('ul'); items.forEach(x => ul.append(el('li', '', x))); return card('', head, ul); };
          const grid = el('div', 'pattern-cards'); grid.append(list(L('Когда брать эту структуру', 'When to reach for it'), s.signals), list(L('Типичные ошибки', 'Usual mistakes'), s.pitfalls));
          const cost = el('p', 'pattern-cost'); cost.append(el('span', 'algorithm-eyebrow', L('Стоимость', 'Cost')), el('strong', '', lesson.cost));
          const next = el('div', 'algorithm-actions');
          (meta.next || []).forEach(n => { const a = el('a', 'btn', L('Дальше: ', 'Next: ')); a.textContent += t(ALGORITHM_TOPICS.find(m => m.id === n).title); a.href = `#topic/${n}`; next.append(a); });
          const all = el('a', 'btn', L('Весь раздел', 'The whole section')); all.href = '#algorithms'; next.append(all);
          root.append(cost, grid, el('h3', '', L('Шаблон', 'Template')), el('pre', 'algorithm-code', s.template), next);
        },
      };
      return {
        mode: '2d', solved,
        reset() { this.setStep(this.active); },
        setStep(i) {
          this.active = i; child?.dispose?.(); child = null; root.replaceChildren(); ui.host.scrollTop = 0;
          const s = lesson.steps[Math.min(i, lesson.steps.length - 1)];
          root.append(kicker(i), el('h2', '', s.title)); render[s.kind](s, i);
        },
        dispose() { child?.dispose?.(); root.remove(); css.remove(); player.classList.remove('algorithm-topic', 'pattern-topic', 'structure-topic'); },
      };
    },
  };
}
