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
export function dupTrace(a, variant = 'correct') {
  const frames = []; let k = 0;
  for (let i = 0; i < a.length; i++) for (let j = variant === 'self' ? 0 : i + 1; j < a.length; j++) {
    k++; const same = a[i] === a[j], memory = [`i=${i}`, `j=${j}`, `k=${k}`];
    frames.push({ values: a, marks: [i, j], memory, line: 3, formula: `a[${i}] = ${a[i]} ${same ? '=' : '≠'} ${a[j]} = a[${j}]`, note: L('Одно сравнение — одна пара позиций. Счётчик k показывает, сколько работы уже сделано.', 'One comparison checks one pair of positions. The counter k shows how much work is done.') });
    if (same) { frames.push({ values: a, marks: [i, j], memory, line: 4, formula: 'return True', note: i === j ? L('Ошибка: j = i, элемент сравнили с самим собой. Повтор «найден» в массиве без повторов.', 'Bug: j = i, an element was compared with itself. A duplicate is "found" where none exists.') : L('Две разные позиции хранят одно значение — повтор найден.', 'Two distinct positions hold one value: a duplicate.') }); return { frames, result: true, comparisons: k }; }
  }
  const n = a.length;
  frames.push({ values: a, marks: [], memory: [`k=${k}`], line: 5, formula: `k = n(n − 1)/2 = ${n}·${n - 1}/2 = ${n * (n - 1) / 2}`, note: L('Каждая пара i < j проверена ровно один раз. Удвоение n почти учетверяет работу: это O(n²).', 'Every pair i < j was checked exactly once. Doubling n nearly quadruples the work: O(n²).') });
  return { frames, result: false, comparisons: k };
}
export function windowTrace(a, k, variant = 'correct') {
  const span = r => Array.from({ length: k }, (_, j) => r - k + 1 + j);
  let total = a.slice(0, k).reduce((s, v) => s + v, 0), best = total;
  const frames = [{ values: a, marks: span(k - 1), memory: [`total=${total}`, `best=${best}`], line: 1, formula: `${a.slice(0, k).map(v => v < 0 ? `(${v})` : v).join(' + ')} = ${total}`, note: L('Первое окно складываем целиком — единственный раз.', 'Add up the first window in full — the only time we do so.') }];
  for (let r = k; r < a.length; r++) {
    const old = total; total += variant === 'no-subtract' ? a[r] : a[r] - a[r - k];
    frames.push({ values: a, marks: span(r), memory: [`total=${total}`, `best=${best}`], line: 3, formula: variant === 'no-subtract' ? `${old} + (${a[r]}) = ${total}` : `${old} + (${a[r]}) − (${a[r - k]}) = ${total}`, note: variant === 'no-subtract' ? L('Ошибка: окно сдвинулось, а ушедший элемент остался в сумме. total больше не равен сумме k подсвеченных чисел.', 'Bug: the window moved but the leaving element stayed in the sum. total no longer equals the k highlighted values.') : L('Соседние окна делят k − 1 общих чисел. Меняются только вошедшее и ушедшее.', 'Neighbouring windows share k − 1 values. Only the entering and leaving values change.') });
    const prev = best; best = Math.max(best, total);
    frames.push({ values: a, marks: span(r), memory: [`total=${total}`, `best=${best}`], line: 4, formula: `best = max(${prev}, ${total}) = ${best}`, note: L('best — лучшая сумма среди уже просмотренных окон.', 'best is the largest sum among the windows seen so far.') });
  }
  frames.push({ values: a, marks: [], memory: [`best=${best}`], line: 5, formula: `return ${best}`, note: L('n − k + 1 окон, каждое за O(1): весь проход O(n).', 'n − k + 1 windows, each in O(1): the whole pass is O(n).') });
  return { frames, result: best };
}
export function mergeTrace(a, b, variant = 'correct') {
  const values = [...a, ...b], labels = [...a.map((_, k) => `a${k}`), ...b.map((_, k) => `b${k}`)], out = [], frames = [];
  let i = 0, j = 0;
  const snap = (line, formula, note) => frames.push({ values, labels, marks: [i < a.length ? i : -1, j < b.length ? a.length + j : -1].filter(x => x >= 0), dim: [...Array(i).keys(), ...Array.from({ length: j }, (_, k) => a.length + k)], memory: [...out], line, formula, note });
  while (i < a.length && j < b.length) {
    const left = a[i] <= b[j], x = left ? a[i] : b[j];
    snap(2, `a[${i}] = ${a[i]} ${left ? '≤' : '>'} ${b[j]} = b[${j}]`, L('Сравниваем только две «верхушки». Меньшая из них меньше всего, что осталось.', 'Compare only the two heads. The smaller one is smaller than everything left.'));
    out.push(x); if (left) i++; else j++;
    snap(left ? 3 : 5, `out ← ${x}`, L('Взятый элемент больше не участвует. out остаётся отсортированным.', 'The taken element is done. out stays sorted.'));
  }
  if (variant !== 'no-tail') out.push(...a.slice(i), ...b.slice(j));
  const tail = variant === 'no-tail' ? [] : [...a.slice(i), ...b.slice(j)]; i = a.length; j = b.length;
  snap(6, variant === 'no-tail' ? `out: ${out.length} из ${values.length}` : `out += [${tail.join(', ')}]`, variant === 'no-tail' ? L('Ошибка: одна стопка кончилась, а хвост другой забыт. Элементы потеряны.', 'Bug: one pile ran out and the other tail was forgotten. Elements are lost.') : L('Одна стопка пуста; хвост другой уже отсортирован и не меньше out[-1]. Дописываем целиком.', 'One pile is empty; the other tail is sorted and no smaller than out[-1]. Append it whole.'));
  return { frames, result: out };
}
export function bfsTrace(graph, start, variant = 'correct') {
  const name = v => String.fromCharCode(65 + v), dist = graph.map(() => -1), queue = [start], frames = [];
  const shown = () => dist.map(d => d < 0 ? '?' : d), labels = graph.map((_, v) => name(v));
  dist[start] = 0;
  frames.push({ values: shown(), labels, marks: [start], memory: queue.map(name), line: 2, formula: `dist[${name(start)}] = 0`, note: L('Старт на расстоянии 0. Очередь — кто ждёт обработки.', 'The start is at distance 0. The queue holds what awaits processing.') });
  while (queue.length) {
    const v = variant === 'stack' ? queue.pop() : queue.shift();
    frames.push({ values: shown(), labels, marks: [v], memory: queue.map(name), line: 4, formula: `v = ${name(v)}, dist = ${dist[v]}`, note: variant === 'stack' ? L('Ошибка: берём последнего пришедшего. Глубокая ветка обгоняет близкие вершины.', 'Bug: we take the latest arrival. A deep branch overtakes nearer vertices.') : L('Из очереди выходит самый ранний — вершины выходят слоями 0, 1, 2…', 'The earliest arrival leaves first — vertices leave in layers 0, 1, 2…') });
    for (const u of graph[v]) if (dist[u] < 0) {
      dist[u] = dist[v] + 1; queue.push(u);
      frames.push({ values: shown(), labels, marks: [v, u], memory: queue.map(name), line: 7, formula: `dist[${name(u)}] = dist[${name(v)}] + 1 = ${dist[u]}`, note: L('Первое открытие фиксирует расстояние. Позже вершину не трогаем.', 'The first discovery fixes the distance. Later visits leave it alone.') });
    }
  }
  frames.push({ values: shown(), labels, marks: [], memory: [], line: 9, formula: `dist = [${dist.join(', ')}]`, note: L('Каждая вершина и каждое ребро обработаны один раз: O(V + E).', 'Every vertex and edge is handled once: O(V + E).') });
  return { frames, result: dist };
}
export function stairsTrace(n, variant = 'correct') {
  const ways = Array(n + 1).fill(0), shown = k => ways.map((v, j) => j <= k ? v : '?'), frames = [];
  ways[0] = variant === 'base-zero' ? 0 : 1;
  frames.push({ values: shown(0), marks: [0], memory: [], line: 1, formula: `ways[0] = ${ways[0]}`, note: variant === 'base-zero' ? L('Ошибка: «0 способов стоять на месте». Неверная база испортит всю таблицу.', 'Bug: "0 ways to stay put". A wrong base spoils the whole table.') : L('Стоять на месте — один способ: пустая последовательность шагов.', 'Staying put is one way: the empty sequence of steps.') });
  if (n >= 1) { ways[1] = 1; frames.push({ values: shown(1), marks: [1], memory: [], line: 2, formula: 'ways[1] = 1', note: L('На первую ступень — только шаг 1.', 'The first stair: only a step of 1.') }); }
  for (let i = 2; i <= n; i++) {
    ways[i] = ways[i - 1] + ways[i - 2];
    frames.push({ values: shown(i), marks: [i - 2, i - 1, i], memory: [`+1: ${ways[i - 1]}`, `+2: ${ways[i - 2]}`], line: 4, formula: `ways[${i}] = ${ways[i - 1]} + ${ways[i - 2]} = ${ways[i]}`, note: L('Последний шаг — 1 или 2 ступени. Это два непересекающихся случая, их способы складываются.', 'The last step is 1 or 2 stairs. The cases are disjoint, so their counts add.') });
  }
  frames.push({ values: shown(n), marks: [n], memory: [], line: 5, formula: `return ${ways[n]}`, note: L('Каждая клетка посчитана один раз из готовых: O(n) вместо экспоненты.', 'Each cell is computed once from finished ones: O(n) instead of exponential.') });
  return { frames, result: ways[n] };
}
