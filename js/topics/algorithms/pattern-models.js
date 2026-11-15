// Deterministic snapshots: every frame follows one operation, never an interpolated answer.
const L = (ru, en) => ({ ru, en });
export function prefixTrace(a, left, right, variant = 'correct') {
  const p = [0], frames = [{ values: a, marks: [], memory: [...p], line: 0, formula: 'P[0] = 0', note: L('Пустой префикс имеет сумму 0.', 'The empty prefix sums to zero.') }];
  a.forEach((v, i) => { p.push(p.at(-1) + v); frames.push({ values: a, marks: [i], memory: [...p], line: 2, formula: `P[${i + 1}] = ${p[i]} + (${v}) = ${p[i + 1]}`, note: L('Добавляем ровно один элемент. P[k] — сумма первых k элементов, без a[k].', 'Add exactly one element. P[k] sums the first k elements, excluding a[k].') }); });
  const end = variant === 'off-by-one' ? right : right + 1, result = p[end] - p[left];
  frames.push({ values: a, marks: a.map((_, i) => i).filter(i => i >= left && i <= right), memory: p, line: 3, formula: `P[${end}] − P[${left}] = ${p[end]} − (${p[left]}) = ${result}`, note: variant === 'correct' ? L('Общий префикс сокращается. Правая граница включена, поэтому нужен r + 1.', 'The shared prefix cancels. The right endpoint is included, so use r + 1.') : L('Ошибка: P[r] не включает a[r]. Последний элемент отрезка потерян.', 'Bug: P[r] excludes a[r]. The last element of the range is lost.') });
  return { frames, result };
}
export function pointerTrace(a, target) {
  let l = 0, r = a.length - 1; const frames = [];
  while (l < r) {
    const sum = a[l] + a[r];
    frames.push({ values: a, marks: [l, r], memory: [`l=${l}`, `r=${r}`], line: 2, formula: `${a[l]} + (${a[r]}) = ${sum} ${sum === target ? '=' : sum < target ? '<' : '>'} ${target}`, note: L('Сначала сравниваем сумму с целью. Указатели пока неподвижны.', 'First compare the sum to the target. The pointers have not moved yet.') });
    if (sum === target) return { frames, result: [l, r] };
    const small = sum < target, old = small ? l : r;
    if (small) l++; else r--;
    frames.push({ values: a, marks: [l, r], memory: [`l=${l}`, `r=${r}`], line: small ? 5 : 7, formula: small ? `a[${old}] + a[j] ≤ ${sum} < ${target}` : `a[i] + a[${old}] ≥ ${sum} > ${target}`, note: small ? L('При сортировке слева — наименьшее число, справа — наибольшее. С прежним левым числом все оставшиеся суммы слишком малы.', 'In sorted data, the left value is smallest and the right value largest. Every remaining sum with that old left value is too small.') : L('С прежним правым числом все оставшиеся суммы слишком велики. Исключаем весь этот столбец пар.', 'Every remaining sum with that old right value is too large. Discard that whole column of pairs.') });
  }
  frames.push({ values: a, marks: [], memory: [], line: 8, formula: 'l ≥ r → None', note: L('Разных позиций больше нет. На неотсортированном массиве такой вывод может быть ложным.', 'No distinct positions remain. On unsorted input, this conclusion can be false.') });
  return { frames, result: null };
}
export function hashTrace(a, target, variant = 'correct') {
  const seen = new Map(), frames = [];
  for (let i = 0; i < a.length; i++) {
    const v = a[i], need = target - v;
    if (variant === 'insert-first') seen.set(v, i);
    frames.push({ values: a, marks: [i], memory: [...seen].map(([k, j]) => `${k} → ${j}`), line: 2, formula: `y = ${target} − (${v}) = ${need}`, note: L('Ищем дополнение в уже просмотренных позициях. Ключ — значение, запись — его индекс.', 'Look for the complement among earlier positions. The key is a value; its entry is an index.') });
    if (seen.has(need)) { const j = seen.get(need); frames.push({ values: a, marks: [j, i], memory: [...seen].map(([k, n]) => `${k} → ${n}`), line: 4, formula: `(${j}, ${i}): ${a[j]} + (${v}) = ${target}`, note: j === i ? L('Ошибка: один элемент использован дважды. Проверяйте дополнение до вставки.', 'Bug: one element was used twice. Look up the complement before insertion.') : L('Оба индекса различны: таблица до проверки содержала только прошлые позиции.', 'The indices differ: before lookup, the table contained only earlier positions.') }); return { frames, result: [j, i] }; }
    seen.set(v, i);
    frames.push({ values: a, marks: [i], memory: [...seen].map(([k, j]) => `${k} → ${j}`), line: 5, formula: `seen[${v}] = ${i}`, note: L('Пары ещё нет. Только теперь запоминаем текущее число для следующих шагов.', 'No pair yet. Only now store this value for future steps.') });
  }
  return { frames, result: null };
}
export function stackTrace(s, variant = 'correct') {
  const stack = [], pairs = { ')': '(', ']': '[', '}': '{' }, frames = [];
  let balance = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i], open = '([{'.includes(c);
    if (variant === 'count-only') { balance += open ? 1 : -1; frames.push({ values: [...s], marks: [i], memory: [`balance=${balance}`], line: 3, formula: `${open ? '+1' : '−1'} → ${balance}`, note: L('Счётчик хранит количество, но забывает тип и порядок незакрытых скобок.', 'A counter keeps the quantity but forgets bracket types and nesting order.') }); if (balance < 0) return { frames, result: false }; continue; }
    if (open) stack.push(c);
    else if (!stack.length || stack.at(-1) !== pairs[c]) { frames.push({ values: [...s], marks: [i], memory: [...stack], line: 5, formula: `${stack.at(-1) || '∅'} ≠ ${pairs[c]}`, note: L('Закрывающая скобка должна соответствовать вершине стека. Баланса количества недостаточно.', 'The closing bracket must match the stack top. Balanced counts alone are insufficient.') }); return { frames, result: false }; }
    else stack.pop();
    frames.push({ values: [...s], marks: [i], memory: [...stack], line: open ? 4 : 7, formula: open ? `push ${c}` : `pop ${pairs[c]}`, note: L('Стек — незакрытые скобки прочитанного префикса. Последняя открытая закрывается первой.', 'The stack holds the unmatched brackets of the processed prefix. The last opened is closed first.') });
  }
  const result = variant === 'count-only' ? balance === 0 : stack.length === 0;
  frames.push({ values: [...s], marks: [], memory: variant === 'count-only' ? [`balance=${balance}`] : [...stack], line: 8, formula: `return ${result ? 'True' : 'False'}`, note: L('В конце незакрытых скобок быть не должно. Пустая строка тоже корректна.', 'At the end, no brackets may remain open. The empty string is valid too.') });
  return { frames, result };
}
export const pairOK = (args, result) => {
  const [a, target] = args;
  if (result === null) return !a.some((v, i) => a.slice(i + 1).some(w => v + w === target));
  return Array.isArray(result) && result.length === 2 && result.every(i => Number.isInteger(i) && i >= 0 && i < a.length) && result[0] !== result[1] && a[result[0]] + a[result[1]] === target;
};
