import { t } from '../../core/i18n.js';
import { L, el, button, input } from './ui.js';
import { DEMO, trace, transition } from './binary-search-model.js';

// A decision-sized storyboard. Nothing advances before the student justifies the update.
export function binarySearchStory(host, { onTransfer, onCounterexample, onCode } = {}) {
  const root = el('section', 'algorithm-story binary-story'); root.setAttribute('aria-label', t(L('Бинарный поиск: история', 'Binary search: the story')));
  const back = el('a', 'algorithm-back', L('← Алгоритмы и структуры данных', '← Algorithms and data structures')); back.href = '#topics/algorithms';
  const title = el('h2', '', L('Не ищем число. Сужаем место для границы.', 'Do not chase a number. Narrow the boundary.'));
  const intro = el('p', 'pattern-reason', L('Задача: найти первую позицию a[i] ≥ x. Числа упорядочены. Голубым отмечено то, что ещё не проверено, зелёным — доказанное, золотым — текущее сравнение. Шаги переключаете вы.', 'Find the first position a[i] ≥ x. The values are sorted. Blue means unknown, green means proven, and gold marks the current comparison. You control each step.'));
  const sample = input(L('Порог x (число)', 'Threshold x (number)'), 'story-target', '8'); sample.node.inputMode = 'decimal';
  const scene = el('div', 'binary-scene'), feedback = el('p', 'algorithm-feedback'); feedback.setAttribute('role', 'status');
  const prediction = el('section', 'algorithm-prediction');
  const caption = el('p', 'algorithm-caption'); caption.setAttribute('aria-live', 'polite');
  const position = el('span', 'algorithm-muted');
  const prev = button(L('← Назад', '← Back'), () => show(index - 1));
  const next = button(L('Следующий шаг →', 'Next step →'), () => show(index + 1));
  const reset = button(L('↺ С начала', '↺ Restart'), () => { answered.clear(); show(0); });
  const microscope = button(L('⌕ Причинный микроскоп', '⌕ Causal microscope'), openMicroscope);
  const controls = el('div', 'algorithm-transport'); controls.append(prev, position, next, reset, microscope);
  const code = el('pre', 'algorithm-code pattern-code');
  const lines = ['lo, hi = 0, len(nums)', 'while lo < hi:', '    mid = (lo + hi) // 2', '    if nums[mid] < target:', '        lo = mid + 1', '    else: hi = mid', 'return lo'].map(line => { const row = el('span', '', line); code.append(row); return row; });
  const links = el('div', 'algorithm-actions');
  links.append(button(L('Новый пример: проверьте себя ↗', 'Try a new problem ↗'), () => onTransfer?.()), button(L('Построить контрпример ↗', 'Construct a counterexample ↗'), () => onCounterexample?.()));
  if (onCode) links.append(button(L('Написать на Python ↗', 'Write it in Python ↗'), onCode));
  const head = el('header', 'algorithm-story-head'); head.append(back, el('span', 'algorithm-eyebrow', L('Порядок → неравенство → исключение', 'Order → inequality → elimination')), title);
  let target = 8, frames, index = 0, dialog = null, disposed = false; const answered = new Set();
  const rebuild = () => {
    const run = trace(DEMO, target);
    frames = [{ kind: 'task', state: { lo: 0, hi: DEMO.length } }];
    run.steps.forEach((step, i) => { frames.push({ kind: 'compare', state: step, step, iteration: i }); frames.push({ kind: 'discard', state: step.after, step, iteration: i }); });
    frames.push({ kind: 'done', state: run.state, result: run.result }); answered.clear(); show(0);
  };
  const apply = button(L('Новый поиск', 'New search'), () => {
    const value = Number(sample.node.value);
    if (!sample.node.value.trim() || !Number.isFinite(value)) { feedback.textContent = t(L('Нужен конечный числовой порог.', 'Enter a finite numerical threshold.')); return; }
    target = value; rebuild();
  });
  const experiment = el('div', 'binary-input'); experiment.append(sample.wrap, apply);
  root.append(head, intro, experiment, scene, caption, prediction, feedback, controls, code, links); host.append(root);
  function show(i) {
    if (disposed) return;
    index = Math.max(0, Math.min(frames.length - 1, i)); const f = frames[index], { lo, hi } = f.state;
    root.dataset.phase = f.kind; root.dataset.frame = index; scene.replaceChildren(); feedback.textContent = ''; prediction.replaceChildren(); prediction.hidden = f.kind !== 'compare';
    scene.append(el('p', 'pattern-label', L('Значения a[i] · подписи снизу — индексы', 'Values a[i] · labels below are indices')));
    const row = el('div', 'pattern-cells binary-cells');
    DEMO.forEach((v, j) => {
      const proven = j < lo || j >= hi, active = f.kind === 'compare' && j === f.step.mid;
      const cell = el('div', `pattern-cell${proven ? ' proven' : ''}${active ? ' marked' : ''}`); cell.append(el('strong', '', String(v)), el('small', '', `${j}${j < lo ? ' · < x' : j >= hi ? ' · ≥ x' : ''}`)); row.append(cell);
    }); scene.append(row, el('p', 'pattern-label', L('Возможные позиции границы · n тоже допустимо', 'Possible boundary positions · n is allowed too')));
    const positions = el('div', 'pattern-cells binary-boundaries');
    for (let j = 0; j <= DEMO.length; j++) { const cell = el('span', `binary-boundary${j >= lo && j <= hi ? ' possible' : ''}`); cell.textContent = j; positions.append(cell); }
    scene.append(positions);
    const state = el('p', 'algorithm-state', `lo = ${lo}   hi = ${hi}   ${t(L('неизвестных элементов', 'unknown elements'))}: ${hi - lo}`); scene.append(state);
    let line = 0;
    if (f.kind === 'task') caption.textContent = t(L(`Ищем первую позицию со значением ≥ ${target}. Ответ может лежать между 0 и ${DEMO.length}. Ничего не отбрасываем до сравнения.`, `Find the first position with value ≥ ${target}. The answer can be anywhere from 0 to ${DEMO.length}. Discard nothing before comparing.`));
    if (f.kind === 'compare') {
      const s = f.step; line = 3;
      scene.append(el('p', 'pattern-formula', `mid = (${lo} + ${hi}) // 2 = ${s.mid}\na[${s.mid}] = ${s.value} ${s.less ? '<' : '≥'} ${target}`));
      caption.textContent = t(L('Результат сравнения известен. Какую часть можно исключить, не потеряв первую подходящую позицию?', 'The comparison result is known. Which region can be excluded without losing the first suitable position?'));
      prediction.append(el('h3', '', L('Обоснуйте сдвиг', 'Justify the move')));
      const choices = el('div', 'algorithm-actions');
      ['lo = mid + 1', 'hi = mid'].forEach((label, k) => choices.append(button(label, () => {
        const ok = k === (s.less ? 0 : 1); feedback.dataset.valid = String(ok);
        feedback.textContent = t(ok ? s.less ? L('Да. Все a[i] при i ≤ mid не больше a[mid] < x. Первая подходящая позиция строго правее mid.', 'Yes. Every a[i] with i ≤ mid is at most a[mid] < x. The first suitable position is strictly after mid.') : L('Да. Все значения начиная с mid подходят. Первая подходящая позиция не правее mid; сам mid остаётся кандидатом.', 'Yes. Every value from mid onward qualifies. The first suitable position is at most mid; mid itself remains a candidate.') : L('Так можно потерять ответ. Используйте порядок массива: какие значения гарантированно меньше x, а какие уже подходят?', 'That can lose the answer. Use the sorted order: which values are guaranteed below x, and which already qualify?'));
        if (ok) { answered.add(index); next.disabled = false; }
      }))); prediction.append(choices);
    }
    if (f.kind === 'discard') {
      const s = f.step; line = s.less ? 4 : 5;
      scene.append(el('p', 'pattern-formula', `${s.less ? 'lo = mid + 1' : 'hi = mid'}\n[${s.lo}, ${s.hi}) → [${lo}, ${hi})\n${s.hi - s.lo} → ${hi - lo}`));
      caption.textContent = t(L('Сначала было сравнение, теперь его следствие: зелёные элементы больше не проверяем. Позиции границы — отдельная строка: hi включён в кандидаты, хотя элемент a[hi] уже не в неизвестном интервале.', 'First the comparison, now its consequence: green elements need no further checks. Boundary positions are separate: hi is still a candidate even though element a[hi] is outside the unknown interval.'));
    }
    if (f.kind === 'done') { line = 6; scene.append(el('p', 'pattern-formula', `lo = hi = ${f.result} → return ${f.result}`)); caption.textContent = t(L('Слева всё < x, начиная с hi всё ≥ x. Неизвестных элементов нет, осталась одна позиция границы. Длина интервала уменьшается примерно вдвое: O(log n) сравнений, O(1) дополнительной памяти.', 'Everything before lo is < x; everything from hi is ≥ x. No unknown elements remain, and exactly one boundary position survives. The interval roughly halves: O(log n) comparisons and O(1) extra space.')); }
    lines.forEach((row, k) => row.classList.toggle('active', k === line));
    prev.disabled = index === 0; next.disabled = index === frames.length - 1 || (f.kind === 'compare' && !answered.has(index)); position.textContent = `${index + 1} / ${frames.length}`;
  }
  function openMicroscope() {
    if (dialog) return;
    const d = el('dialog', 'algorithm-microscope'); dialog = d; d.setAttribute('aria-label', t(L('Один шаг под микроскопом', 'One step under the microscope')));
    const title = el('h2', '', L('Один снимок, одна изменённая строка', 'One snapshot, one changed line'));
    const select = el('select'); select.setAttribute('aria-label', t(L('Изменить одну строку', 'Change one line')));
    [['correct', 'lo = mid + 1'], ['stall', 'lo = mid']].forEach(([value, label]) => { const option = el('option', '', label); option.value = value; select.append(option); });
    const before = el('pre', 'algorithm-code', 'a = [1, 3]; x = 3\nlo = 0; hi = 1; mid = 0\na[mid] = 1 < 3');
    const after = el('pre', 'algorithm-code'), verdict = el('p', 'algorithm-feedback');
    const inspect = () => { const step = transition([1, 3], 3, { lo: 0, hi: 1 }, select.value); after.textContent = `lo: 0 → ${step.after.lo}\nhi: 1 → ${step.after.hi}\nhi − lo: 1 → ${step.after.hi - step.after.lo}`; verdict.textContent = t(step.decreased ? L('Инвариант сохранён, длина уменьшилась. Поиск завершится.', 'The invariant survives and the length shrinks. The search terminates.') : L('Инвариант сохранён, но длина не уменьшилась. Тот же шаг повторится бесконечно.', 'The invariant survives, but the length did not shrink. This step repeats forever.')); };
    select.addEventListener('change', inspect); d.append(title, before, select, after, verdict, button(L('Вернуться к истории', 'Return to the story'), () => d.close())); root.append(d); inspect(); d.addEventListener('close', () => { d.remove(); dialog = null; microscope.focus(); }, { once: true }); d.showModal();
  }
  rebuild();
  return { dispose() { disposed = true; if (dialog) { dialog.close(); dialog.remove(); } root.remove(); } };
}
