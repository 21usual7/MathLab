import { t } from '../../core/i18n.js';
import { L, el, button, input } from './ui.js';
import { binarySearchStory } from './binary-search-story.js';
import { TRANSFER, checkTransfer, checkCounterexample } from './binary-search-model.js';

const steps = [
  { id: 'story', title: L('Право отбросить половину', 'Permission to discard half'), text: L('Один поиск, один инвариант и одна сломанная строка. Останавливайте историю и проверяйте причину каждого шага.', 'One search, one invariant, and one broken line. Pause the story and inspect the reason for each step.') },
  { id: 'transfer', title: L('Граница в новых данных', 'A boundary in new data'), text: L('Индексы начинаются с нуля. Найдите первую позицию a[i] ≥ x. Если таких значений нет, верните n — длину массива. Готового запуска здесь нет.', 'Indices start at zero. Find the first position a[i] ≥ x. If no value qualifies, return n, the array length. There is no worked trace here.'), goal: L('Решите три новых примера и объясните случай n.', 'Solve three new cases and explain the n case.'), after: L('Дубликаты требуют первой границы; отсутствие точного совпадения не означает отсутствие ответа; n — допустимая позиция границы.', 'Duplicates require the first boundary; no exact match does not mean no answer; n is a valid boundary position.') },
  { id: 'counterexample', title: L('Ваш контрпример', 'Your counterexample'), text: L('В программе заменили lo = mid + 1 на lo = mid. Постройте свой отсортированный массив и запрос, на котором поиск застрянет. Укажите, какое требование нарушено.', 'The program now uses lo = mid instead of lo = mid + 1. Construct a sorted array and target that make it stall. Identify which requirement fails.'), goal: L('Постройте контрпример и отличите инвариант от завершения.', 'Construct a counterexample and distinguish the invariant from termination.'), after: L('Инвариант может сохраняться бесконечно. Для завершения нужен отдельный довод: неотрицательная целая длина hi − lo должна строго уменьшаться.', 'An invariant can remain true forever. Termination needs a separate argument: the nonnegative integer hi − lo must strictly decrease.') },
];

export default {
  steps,
  lab: false,
  setup() {},
  mountStage(ui) {
    const solved = new Set();
    try {
      const saved = JSON.parse(localStorage.getItem('mathlab-topic-binary-search') || '[]');
      const legacy = JSON.parse(localStorage.getItem('mathlab-worlds') || '{}')['binary-search'] || [];
      [...saved, ...legacy.map(id => steps.findIndex(s => s.id === id))]
        .filter(i => Number.isInteger(i) && i > 0 && i < steps.length).forEach(i => solved.add(i));
    } catch { /* The lesson remains usable when browser storage is unavailable. */ }
    let active = 0;
    const feedback = el('p', 'algorithm-result'); feedback.setAttribute('aria-live', 'polite');
    ui.status = (message, kind) => { feedback.textContent = message; feedback.className = `algorithm-result ${kind}`; };
    ui.solve = id => {
      solved.add(active);
      try { localStorage.setItem('mathlab-topic-binary-search', JSON.stringify([...solved])); } catch {}
      ui.status(t(steps.find(s => s.id === id).after), 'right'); ui.onSolve();
    };
    const player = ui.host.closest('.topic-player'); player.classList.add('algorithm-topic');
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('../../../css/algorithms.css', import.meta.url).href; document.head.append(css);
    const root = el('section', 'algorithm-lab'); ui.host.append(root, feedback); let film = null;
    function status(message, right = false) { ui.status(t(message), right ? 'right' : 'wrong'); }
    function heading(text) { root.append(el('h2', '', text)); }
    function transfer() {
      heading(L('Не повторяйте запуск — найдите границу', 'Find the boundary without replaying the trace'));
      root.append(el('p', '', L('Дайте индекс первой позиции a[i] ≥ x. Важны и повторяющиеся значения, и промежутки между числами, и позиция за последним элементом.', 'Give the first index with a[i] ≥ x. Consider repeated values, gaps between numbers, and the position after the final element.')));
      const fields = TRANSFER.map(({ a, x }, i) => {
        const task = el('section', 'algorithm-task'); task.append(el('h3', '', `a = [${a.join(', ')}]; x = ${x}`), el('p', 'algorithm-muted', `${t(L('Индексы', 'Indices'))}: ${a.map((_, j) => j).join(' · ')}; n = ${a.length}`));
        const f = input(L('Индекс границы', 'Boundary index'), `boundary-${i}`); f.node.inputMode = 'numeric'; task.append(f.wrap); root.append(task); return f.node;
      });
      const why = el('select'); why.dataset.field = 'why-n'; why.setAttribute('aria-label', t(L('Почему в последнем примере ответ n?', 'Why is the last answer n?')));
      [['', L('Почему в последнем примере ответ n?', 'Why is the last answer n?')], ['below', L('Все значения < x; подходящий суффикс пуст', 'All values are < x; the qualifying suffix is empty')], ['missing', L('Любое отсутствие точного совпадения даёт n', 'Any missing exact match gives n')], ['last', L('Нужно вернуть индекс последнего элемента', 'Return the index of the final element')]].forEach(([v, label]) => { const o = el('option', '', label); o.value = v; why.append(o); });
      root.append(why, button(L('Проверить границы', 'Check boundaries'), () => {
        const checks = checkTransfer(fields.map(f => f.value)); fields.forEach((f, i) => f.setAttribute('aria-invalid', String(!checks[i])));
        if (!checks.every(Boolean)) { status(L('Хотя бы одна граница неверна. Проверьте: слева все значения < x, а с выбранной позиции все ≥ x. Первое равное нельзя пропускать.', 'At least one boundary is wrong. Check that everything before it is < x and everything from it is ≥ x. Do not skip the first equal value.')); return; }
        if (why.value !== 'below') { status(L('Числа верны. Но отсутствие точного совпадения само по себе не даёт n: во втором примере подходящее значение есть. Объясните пустой подходящий суффикс.', 'The numbers are right. But a missing exact match alone does not imply n: the second case has a qualifying value. Explain the empty qualifying suffix.')); return; }
        ui.solve('transfer');
      }));
      root.append(el('p', 'algorithm-note', L('Перенос: замените a[i] ≥ x любым монотонным условием false…false, true…true. Тогда ищется первая истинная позиция: например, минимальная ёмкость, при которой задача выполнима.', 'Transfer: replace a[i] ≥ x with any monotone predicate false…false, true…true. Then search for the first true position, such as the minimum capacity that makes a task feasible.')));
    }
    function counterexample() {
      heading(L('Сломайте строку собственным примером', 'Break the line with your own example'));
      root.append(el('pre', 'algorithm-code', 'lo = 0; hi = n\nwhile lo < hi:\n  mid = floor((lo + hi) / 2)\n  if a[mid] < x: lo = mid  # changed\n  else: hi = mid\nreturn lo'));
      const a = input(L('Отсортированные числа через запятую (1–12)', 'Sorted numbers separated by commas (1–12)'), 'array');
      const x = input(L('Запрос x', 'Target x'), 'target');
      const why = el('select'); why.dataset.field = 'failure-reason'; why.setAttribute('aria-label', t(L('Что нарушается?', 'What fails?')));
      [['', L('Что нарушается?', 'What fails?')], ['invariant', L('Обязательно нарушается инвариант', 'The invariant must fail')], ['progress', L('Длина hi − lo перестаёт уменьшаться', 'The length hi − lo stops decreasing')]].forEach(([v, label]) => { const o = el('option', '', label); o.value = v; why.append(o); });
      const report = el('pre', 'algorithm-code'); report.setAttribute('aria-live', 'polite');
      root.append(a.wrap, x.wrap, why, button(L('Испытать мой контрпример', 'Test my counterexample'), () => {
        const parts = a.node.value.split(',').map(s => s.trim()), values = parts.map(Number);
        if (parts.some(s => s === '') || x.node.value.trim() === '') { status(L('Введите числа и запрос. Пустое поле не считается нулём.', 'Enter numbers and a target. An empty field does not count as zero.')); return; }
        const check = checkCounterexample(values, Number(x.node.value));
        if (check.reason === 'input') { status(L('Нужны 1–12 конечных чисел в неубывающем порядке и числовой запрос.', 'Use 1–12 finite numbers in nondecreasing order and a numeric target.')); return; }
        report.textContent = check.run.steps.map(s => `[${s.lo}, ${s.hi}) → mid=${s.mid}; ${s.value} < ${x.node.value}: ${s.less} → [${s.after.lo}, ${s.after.hi}); Δ=${s.after.hi - s.after.lo}`).join('\n');
        if (!check.ok) { status(L('На этом примере ошибка не проявилась. Нужен шаг с a[mid] < x, где mid совпадёт с lo. Придумайте запрос, который приведёт к такому состоянию.', 'This example does not expose the bug. You need a step with a[mid] < x where mid equals lo. Construct a target that reaches such a state.')); return; }
        if (why.value !== 'progress') { status(L('Вы нашли застревание. Посмотрите на последний шаг: значения за границами по-прежнему удовлетворяют инварианту, но длина не меняется. Выберите точную причину.', 'You found a stall. In the final step, values outside the bounds still satisfy the invariant, but the length is unchanged. Choose the precise reason.')); return; }
        ui.solve('counterexample');
      }), report);
    }
    return {
      solved,
      mode: '2d',
      reset() { this.setStep(active); },
      setStep(i) {
        active = i;
        const id = steps[i]?.id;
        film?.dispose(); film = null; root.replaceChildren(); root.hidden = id === 'story';
        feedback.textContent = ''; feedback.className = 'algorithm-result';
        player.classList.toggle('algorithm-film-mode', id === 'story');
        if (id === 'story') film = binarySearchStory(ui.host, { onTransfer: () => ui.goto(1), onCounterexample: () => ui.goto(2) });
        else if (id === 'transfer') transfer(); else if (id === 'counterexample') counterexample();
      },
      dispose() { film?.dispose(); root.remove(); feedback.remove(); player.classList.remove('algorithm-topic', 'algorithm-film-mode'); css.remove(); },
    };
  },
};
