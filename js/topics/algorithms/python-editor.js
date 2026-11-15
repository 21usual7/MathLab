import { t } from '../../core/i18n.js';
import { L, el, button } from './ui.js';
export function mountPython(host, task, { key, onSolve } = {}) {
  const root = el('section', 'python-workbench');
  const label = el('label', '', L('Ваш Python-код', 'Your Python code'));
  const editor = el('textarea', 'python-editor'); editor.spellcheck = false; editor.autocapitalize = 'off'; editor.autocomplete = 'off'; editor.setAttribute('aria-label', t(L('Python-код', 'Python code')));
  try { editor.value = localStorage.getItem(`mathlab-code-${key}`) ?? task.starter; } catch { editor.value = task.starter; }
  label.append(editor);
  const info = el('p', 'algorithm-muted', L('Первый запуск загружает Python через интернет. Код выполняется в браузере. Верните результат через return; print виден ниже. На выполнение — 3 секунды.', 'The first run downloads Python over the internet. Code runs in your browser. Return your answer; print output appears below. Execution limit: 3 seconds.'));
  const output = el('pre', 'python-output'); output.setAttribute('role', 'status'); output.setAttribute('aria-live', 'polite');
  const custom = el('textarea', 'python-custom'); custom.value = JSON.stringify(task.cases[0].args); custom.setAttribute('aria-label', t(L('Аргументы своего примера в JSON', 'Custom arguments as JSON')));
  let customRequested = false;
  const results = el('div', 'python-results'); let worker = null, timer, disposed = false, generation = 0, attempts = 0;
  const finish = () => { clearTimeout(timer); worker?.terminate(); worker = null; run.disabled = false; stop.disabled = true; root.removeAttribute('aria-busy'); };
  const stop = button(L('■ Остановить', '■ Stop'), () => { generation++; finish(); output.textContent = t(L('Выполнение остановлено. Код сохранён.', 'Execution stopped. Your code is saved.')); }); stop.disabled = true;
  const run = button(L('▶ Запустить проверки', '▶ Run checks'), () => {
    if (worker || disposed) return;
    const customMode = customRequested; customRequested = false;
    let cases = task.cases;
    if (customMode) {
      try {
        const args = JSON.parse(custom.value);
        if (!Array.isArray(args)) throw new Error();
        cases = [{ args, label: L('Ваш пример', 'Your example') }];
      } catch { output.textContent = t(L('Введите список аргументов в JSON, например [[1, 3, 5], 4].', 'Enter a JSON array of arguments, for example [[1, 3, 5], 4].')); return; }
    }
    const submittedCode = editor.value;
    const token = ++generation; results.replaceChildren(); output.textContent = t(L('Загружаем Python…', 'Loading Python…')); run.disabled = true; stop.disabled = false; root.setAttribute('aria-busy', 'true');
    try { worker = new Worker(new URL('./python-worker.js', import.meta.url)); }
    catch (e) { output.textContent = String(e); finish(); return; }
    timer = setTimeout(() => { if (token !== generation) return; generation++; finish(); output.textContent = t(L('Не удалось загрузить Python за 45 секунд. Проверьте подключение и повторите запуск.', 'Python did not load within 45 seconds. Check your connection and try again.')); }, 45000);
    worker.onerror = e => { e.preventDefault(); if (token !== generation) return; output.textContent = t(L('Не удалось запустить Python. Проверьте интернет и повторите попытку.', 'Could not start Python. Check your connection and retry.')); finish(); };
    worker.onmessage = ({ data }) => {
      if (disposed || token !== generation) return;
      if (data.type === 'ready') {
        clearTimeout(timer); output.textContent = t(L('Проверяем ваш код…', 'Checking your code…'));
        timer = setTimeout(() => { generation++; finish(); output.textContent = t(L('Превышено время: 3 секунды. Проверьте, изменяются ли границы или счётчик цикла. Можно исправить код и запустить снова.', 'Time limit: 3 seconds. Check whether the loop bounds or counter change. Edit your code and try again.')); }, 3000);
        worker.postMessage({ type: 'run', code: submittedCode, functionName: task.functionName, cases: cases.map(c => c.args) });
      } else {
        if (!customMode) attempts++; let passed = 0;
        if (data.results) data.results.forEach((r, i) => {
          const c = cases[i], ok = !r.error && (customMode || task.check(c, r.value)); if (ok) passed++;
          const row = el('div', `python-case ${ok ? 'right' : 'wrong'}`);
          row.append(el('strong', '', `${ok ? '✓' : '×'} ${t(c.label)}`));
          if (customMode && !r.error) row.append(el('pre', '', JSON.stringify(r.value)));
          if (!ok) row.append(el('pre', '', `${t(L('Вход', 'Input'))}: ${JSON.stringify(c.args)}\n${r.error || `${t(L('Получено', 'Got'))}: ${JSON.stringify(r.value)}\n${t(L('Ожидание', 'Expected'))}: ${c.expected !== undefined ? JSON.stringify(c.expected) : t(L('два разных индекса с нужной суммой либо None, если пары нет', 'two distinct indices with the target sum, or None when absent'))}`}`));
          results.append(row);
        });
        output.textContent = data.error || (customMode ? t(L('Пример выполнен. Проверьте результат самостоятельно.', 'Example executed. Check the result yourself.')) + (data.stdout ? `\n\nstdout:\n${data.stdout}` : '') : `${passed} / ${cases.length} ${t(L('проверок пройдено', 'checks passed'))}${data.stdout ? `\n\nstdout:\n${data.stdout}` : ''}`);
        if (!customMode && passed === task.cases.length && !data.error) onSolve?.();
        if (attempts >= 2) solution.hidden = false;
        finish();
      }
    };
    worker.postMessage({ type: 'init' });
  });
  const runCustom = button(L('▶ Запустить свой пример', '▶ Run your example'), () => { if (worker) return; customRequested = true; run.click(); });
  const customPanel = el('details', 'algorithm-reference'); customPanel.append(el('summary', '', L('Свой пример', 'Your example')), el('p', '', L('Список аргументов функции в JSON. Результат показывается без оценки правильности.', 'Function arguments as a JSON array. The result is shown without a correctness grade.')), custom, runCustom);
  const reset = button(L('Вернуть заготовку', 'Restore starter'), () => { generation++; finish(); editor.value = task.starter; save(); results.replaceChildren(); output.textContent = ''; });
  function save() { try { localStorage.setItem(`mathlab-code-${key}`, editor.value); } catch {} }
  editor.addEventListener('input', save);
  editor.addEventListener('keydown', e => {
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); editor.setRangeText('    ', editor.selectionStart, editor.selectionEnd, 'end'); save(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run.click(); }
  });
  const controls = el('div', 'algorithm-actions'); controls.append(run, stop, reset);
  const hints = el('details', 'algorithm-reference'); hints.append(el('summary', '', L('Подсказка к алгоритму', 'Algorithm hint')), el('p', '', task.hint));
  const syntax = el('details', 'algorithm-reference'); syntax.append(el('summary', '', L('Python впервые? Короткая памятка', 'New to Python? A quick guide')), el('pre', 'algorithm-code', 'a = [4, -2, 7]        # list\nfor i, value in enumerate(a):\n    print(i, value)    # indentation: 4 spaces\n\n# == compare; = assign; len(a) length\n# // integer division; None no result\n# d = {} dictionary; stack = [] list\n# stack.append(x); stack.pop()\n# return value  (inside your function)'));
  const solution = el('details', 'algorithm-reference'); solution.hidden = true; solution.append(el('summary', '', L('Разбор после двух попыток', 'Walkthrough after two attempts')), el('p', '', L('Сравните с собственным решением. Пройденные примеры ещё не доказывают корректность для любых данных.', 'Compare this with your solution. Passing examples does not prove correctness for all inputs.')), el('pre', 'algorithm-code', task.solution));
  const link = el('a', 'algorithm-back', task.sourceTitle); link.href = task.source; link.target = '_blank'; link.rel = 'noopener noreferrer';
  root.append(el('h2', '', task.title), el('p', '', task.statement), el('pre', 'algorithm-code', task.example), link, label, controls, info, output, results, customPanel, hints, syntax, solution); host.append(root);
  return { dispose() { disposed = true; generation++; finish(); root.remove(); } };
}
