import { t } from '../../core/i18n.js';
import { L, el, button, input } from './ui.js';
import { mountPython } from './python-editor.js';
import { LESSONS } from './pattern-lessons.js';

function cells(values, marks = [], { indices = true, prefix = false } = {}) {
  const row = el('div', 'pattern-cells');
  values.forEach((v, i) => {
    const cell = el('div', `pattern-cell${marks.includes(i) ? ' marked' : ''}`);
    cell.append(el('strong', '', String(v)));
    if (indices) cell.append(el('small', '', prefix ? `P[${i}]` : String(i)));
    row.append(cell);
  });
  if (!values.length) row.append(el('span', 'algorithm-muted', '∅'));
  return row;
}
function prefixPlot(values, input) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 540 120'); svg.classList.add('prefix-plot'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', t(L('График накопленной суммы. Разность высот даёт сумму отрезка.', 'Accumulated sum plot. The height difference gives a range sum.')));
  const all = [0]; input.forEach(v => all.push(all.at(-1) + v));
  const low = Math.min(...all), span = Math.max(1, Math.max(...all) - low);
  const points = values.map((v, i) => `${25 + i * 490 / Math.max(1, input.length)},${100 - (v - low) / span * 80}`).join(' ');
  const path = document.createElementNS(svg.namespaceURI, 'polyline'); path.setAttribute('points', points); path.setAttribute('fill', 'none'); path.setAttribute('stroke', '#85d5b1'); path.setAttribute('stroke-width', '3'); svg.append(path);
  return svg;
}
function drawSnapshot(host, frame, lesson) {
  host.replaceChildren(el('p', 'pattern-label', L('Данные · индексы с нуля', 'Data · zero-based indices')), cells(frame.values, frame.marks));
  host.append(el('p', 'pattern-label', lesson.memoryTitle));
  const memory = cells(frame.memory, [], { indices: lesson === LESSONS['prefix-sums'], prefix: true }); memory.classList.add('pattern-memory');
  if (lesson === LESSONS['bracket-stack']) memory.classList.add('stack-memory');
  host.append(memory);
  if (lesson === LESSONS['prefix-sums'] && frame.memory.length > 1 && frame.memory.every(v => typeof v === 'number')) host.append(prefixPlot(frame.memory, frame.values));
  host.append(el('p', 'pattern-formula', frame.formula), el('p', 'pattern-reason', frame.note));
}
export function mountTrace(host, lesson, getRun = lesson.trace) {
  const root = el('section', 'pattern-trace'), snapshot = el('div', 'pattern-snapshot'), code = el('pre', 'algorithm-code pattern-code'); let index = 0, run = getRun();
  let rows = [];
  function renderCode() { code.replaceChildren(); rows = (run.code || lesson.code).map((text, i) => { const row = el('span', '', `${String(i + 1).padStart(2, ' ')}  ${text}`); code.append(row); return row; }); }
  renderCode();
  const counter = el('span', 'algorithm-muted'); counter.setAttribute('role', 'status');
  const back = button(L('← Назад', '← Back'), () => show(index - 1)), next = button(L('Один шаг →', 'One step →'), () => show(index + 1)), reset = button(L('↺ С начала', '↺ Restart'), () => show(0));
  const controls = el('div', 'algorithm-actions'); controls.append(back, counter, next, reset); root.append(snapshot, controls, code); host.append(root);
  function show(i) {
    index = Math.max(0, Math.min(run.frames.length - 1, i)); const frame = run.frames[index];
    drawSnapshot(snapshot, frame, lesson); rows.forEach((row, k) => { row.classList.toggle('active', k === frame.line); if (k === frame.line) row.setAttribute('aria-current', 'step'); else row.removeAttribute('aria-current'); });
    counter.textContent = `${index + 1} / ${run.frames.length}`; back.disabled = index === 0; next.disabled = index === run.frames.length - 1;
  }
  show(0);
  return { refresh() { run = getRun(); renderCode(); show(0); }, dispose() { root.remove(); } };
}
export function createPatternTopic(id) {
  const lesson = LESSONS[id];
  return {
    lab: false, setup() {},
    steps: [
      { title: L('Сначала ваш прогноз', 'Your prediction first'), text: lesson.lead },
      { title: L('Одна операция за шаг', 'One operation per step'), text: L('Следите за данными, памятью и подсвеченной строкой Python. Каждый переход можно отменить и повторить.', 'Follow the data, memory, and highlighted Python line. Every transition can be reversed and replayed.') },
      { title: L('Математика и одна сломанная причина', 'The mathematics and one broken cause'), text: L('Проверим, что делает алгоритм правильным, и изменим ровно одно условие.', 'Identify what makes the algorithm correct, then change exactly one condition.') },
      { title: L('Напишите алгоритм на Python', 'Write the algorithm in Python'), text: L('Начните с заготовки. Проверки объясняют расхождения; подсказка и памятка по Python доступны под редактором.', 'Start from the scaffold. Checks explain mismatches; an algorithm hint and Python guide are below the editor.') },
      { title: L('Перенесите идею', 'Transfer the idea'), text: L('Новые данные без готового запуска. Важен и ответ, и причина.', 'New data without a worked trace. Give both the answer and its reason.') },
    ],
    mountStage(ui) {
      const player = ui.host.closest('.topic-player'); player.classList.add('algorithm-topic', 'pattern-topic');
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('../../../css/algorithms.css', import.meta.url).href; document.head.append(css);
      const root = el('section', 'algorithm-lab pattern-lesson'); ui.host.append(root); let child = null;
      const solved = new Set(); try { JSON.parse(localStorage.getItem(`mathlab-pattern-${id}`) || '[]').filter(Number.isInteger).forEach(i => solved.add(i)); } catch {}
      function solve(i) { solved.add(i); try { localStorage.setItem(`mathlab-pattern-${id}`, JSON.stringify([...solved])); } catch {} ui.onSolve(); }
      function question(q, options, correct, explanation, step) {
        root.append(el('h2', '', q)); const feedback = el('p', 'algorithm-feedback'); feedback.setAttribute('role', 'status');
        const choices = el('div', 'pattern-choices'); options.forEach((option, i) => choices.append(button(option, () => { feedback.textContent = `${t(i === correct ? L('Верно. ', 'Correct. ') : L('Проверьте причину. ', 'Check the reasoning. '))}${t(explanation)}`; feedback.dataset.valid = String(i === correct); if (i === correct) solve(step); })));
        root.append(choices, feedback);
      }
      return {
        mode: '2d', solved,
        reset() { this.setStep(this.active); },
        setStep(i) {
          this.active = i; child?.dispose(); child = null; root.replaceChildren(); ui.host.scrollTop = 0;
          if (i === 0) { const q = lesson.prediction; question(q.q, q.options, q.correct, q.feedback, 0); root.append(el('p', 'algorithm-muted', L('Готовая трассировка — на следующем шаге. Сначала сформулируйте, что должно произойти.', 'The worked trace is on the next step. First decide what should happen.'))); }
          if (i === 1) child = mountTrace(root, lesson);
          if (i === 2) {
            root.append(el('h2', '', L('Математика → программа', 'Mathematics → program')), el('p', 'pattern-reason', lesson.math), el('h3', '', L('Почему это работает и сколько стоит', 'Why it works and what it costs')), el('p', 'pattern-reason', lesson.invariant), el('h3', '', lesson.experiment.title), el('p', 'pattern-reason', lesson.experiment.control));
            const label = el('label', 'algorithm-field', L('Изменяемая причина', 'Intervention')), select = el('select'); select.setAttribute('aria-label', t(L('Изменяемая причина', 'Intervention')));
            [L('Исходный алгоритм', 'Original algorithm'), lesson.experiment.broken].forEach((v, j) => { const option = el('option', '', v); option.value = j; select.append(option); }); label.append(select); root.append(label);
            const warning = el('p', 'pattern-intervention'); root.append(warning);
            child = mountTrace(root, lesson, () => {
              const broken = select.value === '1', run = lesson.experiment.trace(broken);
              if (broken) {
                run.code = [...lesson.code];
                if (id === 'prefix-sums') run.code[3] = 'return prefix[right] - prefix[left]  # BUG';
                if (id === 'hash-two-sum') {
                  run.code = ['seen = {}', 'for i, value in enumerate(nums):', '    seen[value] = i  # BUG: inserted too soon', '    need = target - value', '    if need in seen:', '        return [seen[need], i]', 'return None'];
                  run.frames.forEach(f => { f.line = f.line === 2 ? 3 : f.line === 4 ? 5 : 2; });
                }
                if (id === 'bracket-stack') run.code = ['balance = 0', '', 'for char in s:', '    balance += 1 if char in "([{\" else -1', '    if balance < 0:', '        return False', '', '', 'return balance == 0  # BUG: loses types'];
              }
              return run;
            });
            select.addEventListener('change', () => {
              warning.textContent = select.value === '1' ? t(L('Это намеренно испорченный запуск: формула показывает, где перестаёт действовать доказательство. Ниже показан код этого запуска.', 'This run is deliberately broken: the formula shows where the proof fails. The code below matches this run.')) : '';
              child.refresh();
            });
          }
          if (i === 3) child = mountPython(root, lesson.task, { key: id, onSolve: () => solve(3) });
          if (i === 4) {
            const q = lesson.transfer; root.append(el('h2', '', q.q));
            const answer = input(L('Ваш ответ', 'Your answer'), 'transfer-answer'), label = el('label', 'algorithm-field', L('Обоснование', 'Reason')), reason = el('select'); reason.setAttribute('aria-label', t(L('Обоснование', 'Reason')));
            const blank = el('option', '', L('Выберите причину', 'Choose a reason')); blank.value = ''; reason.append(blank);
            q.options.forEach((o, j) => { const option = el('option', '', o); option.value = j; reason.append(option); }); label.append(reason);
            const feedback = el('p', 'algorithm-feedback'); feedback.setAttribute('role', 'status');
            root.append(answer.wrap, label, button(L('Проверить рассуждение', 'Check reasoning'), () => {
              const ok = answer.node.value.trim() === q.answer && reason.value === String(q.correct);
              feedback.textContent = ok ? t(q.feedback) : t(L('Ответ или обоснование не согласованы. Вернитесь к инварианту: какая информация сохранялась на каждом шаге? Проверьте знаки и индексы.', 'The answer or reason does not fit. Revisit the invariant: what information survived each step? Check signs and indices.')); feedback.dataset.valid = String(ok); if (ok) solve(4);
            }), feedback);
          }
          if (i >= 5) root.append(el('h2', '', L('Идея, которую вы забираете с собой', 'The idea to take with you')), el('p', 'pattern-reason', lesson.invariant), el('p', 'algorithm-muted', L('Решённые задания отмечают конкретные попытки. Попробуйте завтра объяснить алгоритм без подсказок на новом примере.', 'Solved tasks record these attempts. Tomorrow, try explaining the algorithm on a fresh example without hints.')));
        },
        dispose() { child?.dispose(); root.remove(); css.remove(); player.classList.remove('algorithm-topic', 'pattern-topic'); },
      };
    },
  };
}
