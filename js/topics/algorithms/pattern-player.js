import { t } from '../../core/i18n.js';
import { L, el, button, input } from './ui.js';
import { mountPython } from './python-editor.js';
import { LESSONS } from './pattern-lessons.js';
import { ALGORITHM_TOPICS } from './catalog.js';

function cells(values, marks = [], { indices = true, prefix = false, labels, dim = [] } = {}) {
  const row = el('div', 'pattern-cells');
  values.forEach((v, i) => {
    const cell = el('div', `pattern-cell${marks.includes(i) ? ' marked' : ''}${dim.includes(i) ? ' dim' : ''}`);
    cell.append(el('strong', '', String(v)));
    if (indices) cell.append(el('small', '', labels ? labels[i] : prefix ? `P[${i}]` : String(i)));
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
// BFS: vertices coloured by state — current/marked yellow, distance known green, unknown grey.
function graphPlot(frame, { edges, pos }) {
  const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), add = (tag, attrs, text) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (text != null) n.textContent = text; svg.append(n); return n; };
  svg.setAttribute('viewBox', '0 0 420 140'); svg.classList.add('graph-plot'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', t(L('Граф: вершины и расстояния от старта', 'Graph: vertices and distances from the start')));
  edges.forEach((list, v) => list.forEach(u => { if (u > v) add('line', { x1: pos[v][0], y1: pos[v][1], x2: pos[u][0], y2: pos[u][1], class: frame.marks.includes(v) && frame.marks.includes(u) ? 'hot' : '' }); }));
  pos.forEach(([x, y], v) => {
    const known = frame.values[v] !== '?', state = frame.marks.includes(v) ? 'current' : known ? 'known' : 'unknown';
    add('circle', { cx: x, cy: y, r: 19, class: state }); add('text', { x, y: y + 5, 'text-anchor': 'middle' }, `${frame.labels[v]}${known ? ':' + frame.values[v] : ''}`);
  });
  return svg;
}
function drawSnapshot(host, frame, lesson) {
  host.replaceChildren(el('p', 'pattern-label', frame.labels ? L('Данные', 'Data') : L('Данные · индексы с нуля', 'Data · zero-based indices')), cells(frame.values, frame.marks, { labels: frame.labels, dim: frame.dim }));
  if (lesson.graph) host.append(graphPlot(frame, lesson.graph));
  if (lesson.memoryTitle) {
    host.append(el('p', 'pattern-label', lesson.memoryTitle));
    const memory = cells(frame.memory, [], { indices: lesson === LESSONS['prefix-sums'], prefix: true }); memory.classList.add('pattern-memory');
    if (lesson === LESSONS['bracket-stack']) memory.classList.add('stack-memory');
    host.append(memory);
  }
  if (lesson === LESSONS['prefix-sums'] && frame.memory.length > 1 && frame.memory.every(v => typeof v === 'number')) host.append(prefixPlot(frame.memory, frame.values));
  host.append(el('p', 'pattern-formula', frame.formula), el('p', 'pattern-reason', frame.note));
}
export function mountTrace(host, lesson, getRun = lesson.trace) {
  const root = el('section', 'pattern-trace'), snapshot = el('div', 'pattern-snapshot'), code = el('pre', 'algorithm-code pattern-code'); let index = 0, run = getRun();
  let rows = [];
  function renderCode() { code.replaceChildren(); rows = (run.code || lesson.code).map((text, i) => { const row = el('span', '', `${String(i + 1).padStart(2, ' ')}  ${text}`); code.append(row); return row; }); }
  renderCode();
  const counter = el('span', 'algorithm-muted'); counter.setAttribute('role', 'status');
  let timer = null;
  const halt = () => { clearInterval(timer); timer = null; play.textContent = t(L('▶ Авто', '▶ Auto')); };
  const back = button(L('← Назад', '← Back'), () => { halt(); show(index - 1); }), next = button(L('Один шаг →', 'One step →'), () => { halt(); show(index + 1); }), reset = button(L('↺ С начала', '↺ Restart'), () => { halt(); show(0); });
  const play = button(L('▶ Авто', '▶ Auto'), () => {
    if (timer) return halt();
    if (index === run.frames.length - 1) show(0);
    timer = setInterval(() => index < run.frames.length - 1 ? show(index + 1) : halt(), 1300); play.textContent = t(L('⏸ Пауза', '⏸ Pause'));
  });
  const controls = el('div', 'algorithm-actions'); controls.append(back, counter, next, play, reset);
  const main = el('div', 'pattern-main'), stage = el('div', 'pattern-scene'); let scene = lesson.scene?.(stage, run);
  main.append(snapshot); const side = el('div', 'pattern-side'); side.append(controls, code); root.append(stage, main, side); host.append(root);
  root.tabIndex = -1; root.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { halt(); show(index + 1); } if (e.key === 'ArrowLeft') { halt(); show(index - 1); } });
  function show(i) {
    index = Math.max(0, Math.min(run.frames.length - 1, i)); const frame = run.frames[index];
    drawSnapshot(snapshot, frame, lesson); scene?.update(frame); rows.forEach((row, k) => { row.classList.toggle('active', k === frame.line); if (k === frame.line) row.setAttribute('aria-current', 'step'); else row.removeAttribute('aria-current'); });
    counter.textContent = `${index + 1} / ${run.frames.length}`; back.disabled = index === 0; next.disabled = index === run.frames.length - 1;
  }
  show(0);
  return { refresh() { halt(); run = getRun(); renderCode(); stage.replaceChildren(); scene = lesson.scene?.(stage, run); show(0); }, dispose() { halt(); root.remove(); } };
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
      { title: L('Шпаргалка', 'Cheat sheet'), text: L('Как узнать задачу на этот приём, шаблон кода, стоимость и типичные ошибки — на одной странице.', 'How to recognise the pattern, a code template, its cost, and the usual mistakes — on one page.') },
    ],
    mountStage(ui) {
      const player = ui.host.closest('.topic-player'); player.classList.add('algorithm-topic', 'pattern-topic');
      const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('../../../css/algorithms.css', import.meta.url).href; document.head.append(css);
      const root = el('section', 'algorithm-lab pattern-lesson'); ui.host.append(root); let child = null, widget = null;
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
          this.active = i; child?.dispose(); child = null; widget?.dispose(); widget = null; root.replaceChildren(); ui.host.scrollTop = 0;
          if (i === 0) { const q = lesson.prediction; const hook = el('div', 'pattern-hook'); hook.append(el('p', 'algorithm-eyebrow', L('Задача урока', 'The problem')), el('p', '', lesson.lead)); root.append(hook); question(q.q, q.options, q.correct, q.feedback, 0); root.append(el('p', 'algorithm-muted', L('Готовая трассировка — на следующем шаге. Сначала сформулируйте, что должно произойти.', 'The worked trace is on the next step. First decide what should happen.'))); }
          if (i === 1) child = mountTrace(root, lesson);
          if (i === 2) {
            const card = (cls, head, text) => { const c = el('div', `pattern-card ${cls}`); c.append(el('h3', '', head), el('p', 'pattern-reason', text)); return c; };
            const grid = el('div', 'pattern-cards'); grid.append(card('idea', L('Идея', 'The idea'), lesson.math), card('proof', L('Почему это работает и сколько стоит', 'Why it works and what it costs'), lesson.invariant));
            root.append(el('h2', '', L('Математика → программа', 'Mathematics → program')), grid); widget = lesson.widget?.(root); root.append(card('experiment', lesson.experiment.title, lesson.experiment.control));
            const label = el('label', 'algorithm-field', L('Изменяемая причина', 'Intervention')), select = el('select'); select.setAttribute('aria-label', t(L('Изменяемая причина', 'Intervention')));
            [L('Исходный алгоритм', 'Original algorithm'), lesson.experiment.broken].forEach((v, j) => { const option = el('option', '', v); option.value = j; select.append(option); }); label.append(select); root.append(label);
            const warning = el('p', 'pattern-intervention'); root.append(warning);
            child = mountTrace(root, lesson, () => {
              const broken = select.value === '1', run = lesson.experiment.trace(broken);
              if (broken) {
                run.code = [...lesson.code];
                [].concat(lesson.experiment.bug || []).forEach(b => { run.code[b.line] = b.text; });
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
              warning.textContent = select.value === '1' ? t(lesson.experiment.warning || L('Это намеренно испорченный запуск: формула показывает, где перестаёт действовать доказательство. Ниже показан код этого запуска.', 'This run is deliberately broken: the formula shows where the proof fails. The code below matches this run.')) : '';
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
          if (i >= 5) {
            const list = (head, items) => { const c = el('div', 'pattern-card'), ul = el('ul'); items.forEach(x => ul.append(el('li', '', x))); c.append(el('h3', '', head), ul); return c; };
            const grid = el('div', 'pattern-cards'); grid.append(list(L('Когда узнавать этот приём', 'When to recognise it'), lesson.signals), list(L('Типичные ошибки', 'Usual mistakes'), lesson.pitfalls));
            const cost = el('p', 'pattern-cost'); cost.append(el('span', 'algorithm-eyebrow', L('Стоимость', 'Cost')), el('strong', '', lesson.cost));
            const meta = ALGORITHM_TOPICS.find(m => m.id === id), next = el('div', 'algorithm-actions');
            (meta.next || []).forEach(n => { const a = el('a', 'btn', L('Дальше: ', 'Next: ')); a.textContent += t(ALGORITHM_TOPICS.find(m => m.id === n).title); a.href = `#topic/${n}`; next.append(a); });
            const all = el('a', 'btn', L('Вся программа раздела', 'The whole route')); all.href = '#topics/algorithms'; next.append(all);
            root.append(el('h2', '', L('Шпаргалка', 'Cheat sheet')), cost, grid, el('h3', '', L('Шаблон на Python', 'Python template')), el('pre', 'algorithm-code', lesson.task.solution), el('p', 'algorithm-muted', L('Проверьте себя завтра: объясните инвариант на новом примере без подсказок.', 'Check yourself tomorrow: explain the invariant on a fresh example without hints.')), next);
          }
        },
        dispose() { child?.dispose(); widget?.dispose(); root.remove(); css.remove(); player.classList.remove('algorithm-topic', 'pattern-topic'); },
      };
    },
  };
}
