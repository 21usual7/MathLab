const L = (ru, en) => ({ ru, en });
export const ALGORITHMS_SUBJECT = {
  id: 'algorithms', path: true, title: L('Алгоритмы и структуры данных', 'Algorithms and data structures'),
  summary: L('Программа как проверяемое рассуждение: эксперимент, инвариант и контрпример.', 'A program as an argument you can test: experiment, invariant, and counterexample.'),
};
// Modules of one route, in order. Each lesson: prediction → trace → why → Python → transfer → cheat sheet.
export const ALGORITHM_TRACKS = [
  { id: 'a-cost', subject: 'algorithms', title: L('Цена алгоритма', 'The cost of an algorithm'), summary: L('Считаем шаги, а не секунды: O(n) против O(n²).', 'Count steps, not seconds: O(n) versus O(n²).') },
  { id: 'patterns', subject: 'algorithms', title: L('Массивы: накопить, сдвинуть, сойтись', 'Arrays: accumulate, slide, converge'), summary: L('Три приёма, которые превращают перебор отрезков и пар в один проход.', 'Three techniques that turn scanning all ranges and pairs into one pass.') },
  { id: 'a-memory', subject: 'algorithms', title: L('Память: словарь и стек', 'Memory: dictionaries and stacks'), summary: L('Что запомнить о прошлом, чтобы не возвращаться к нему.', 'What to remember about the past so you never revisit it.') },
  { id: 'search', subject: 'algorithms', title: L('Порядок: слияние и поиск', 'Order: merging and searching'), summary: L('Отсортированные данные дают право отбрасывать и сливать.', 'Sorted data grants the right to discard and to merge.') },
  { id: 'a-graphs', subject: 'algorithms', title: L('Графы и динамика', 'Graphs and dynamic programming'), summary: L('Связи между объектами и ответы, собранные из меньших ответов.', 'Links between objects, and answers assembled from smaller answers.') },
];
export const ALGORITHM_TOPICS = [
  { id: 'complexity', track: 'a-cost', status: 'ready', minutes: 15, next: ['prefix-sums', 'hash-two-sum'],
    title: L('Сколько стоит алгоритм: считаем шаги', 'What an algorithm costs: counting steps'), kicker: L('O-нотация · n(n−1)/2 · set', 'Big-O · n(n−1)/2 · set'),
    summary: L('Повтор в списке «в лоб» и через множество. Почему удвоение данных учетверяет работу.', 'Finding a repeat head-on and with a set. Why doubling the data quadruples the work.') },
  { id: 'prefix-sums', track: 'patterns', status: 'ready', minutes: 18, prereqs: ['complexity'], next: ['sliding-window', 'two-pointers'],
    title: L('Префиксные суммы: накопить и вычесть', 'Prefix sums: accumulate and subtract'), kicker: L('Накопление · разность · запросы O(1)', 'Accumulation · difference · O(1) queries'),
    summary: L('Сумма любого отрезка одной разностью. Задача по мотивам LeetCode 303.', 'Any range sum by one subtraction. Practice adapted from LeetCode 303.') },
  { id: 'sliding-window', track: 'patterns', status: 'ready', minutes: 15, prereqs: ['prefix-sums'], next: ['two-pointers'],
    title: L('Скользящее окно: прибавить вошедшее, вычесть ушедшее', 'Sliding window: add what enters, subtract what leaves'), kicker: L('Окно длины k · O(n) вместо O(n·k)', 'Window of length k · O(n) instead of O(n·k)'),
    summary: L('Лучшие k дней подряд за один проход. Задача по мотивам LeetCode 643.', 'The best k days in a row in one pass. Practice adapted from LeetCode 643.') },
  { id: 'two-pointers', track: 'patterns', status: 'ready', minutes: 20, prereqs: ['prefix-sums'], next: ['hash-two-sum', 'binary-search'],
    title: L('Два указателя: исключать целые семейства пар', 'Two pointers: eliminate whole families of pairs'), kicker: L('Сортировка · неравенства · O(1) памяти', 'Sorting · inequalities · O(1) space'),
    summary: L('Неравенства объясняют каждый сдвиг. Пара с нужной суммой, LeetCode 167.', 'Inequalities justify each move. A pair with a target sum, LeetCode 167.') },
  { id: 'hash-two-sum', track: 'a-memory', status: 'ready', minutes: 20, prereqs: ['two-pointers'], next: ['bracket-stack'],
    title: L('Хеш-таблица: уравнение вместо перебора', 'Hash maps: an equation instead of enumeration'), kicker: L('Словарь · дополнение t − x', 'Dictionary · complement t − x'),
    summary: L('Память прошлых значений заменяет перебор пар. Практика Two Sum.', 'Remembered values replace pair enumeration. Two Sum practice.') },
  { id: 'bracket-stack', track: 'a-memory', status: 'ready', minutes: 20, prereqs: ['hash-two-sum'], next: ['bfs', 'binary-search'],
    title: L('Стек: память о незакрытом', 'Stacks: remembering what remains open'), kicker: L('LIFO · вложенность · баланс', 'LIFO · nesting · balance'),
    summary: L('Почему счётчика недостаточно. Напишите проверку скобок, LeetCode 20.', 'Why a counter is insufficient. Write a bracket validator, LeetCode 20.') },
  { id: 'merge-sorted', track: 'search', status: 'ready', minutes: 18, prereqs: ['two-pointers'], next: ['binary-search'],
    title: L('Слияние: две стопки в одну', 'Merging: two piles into one'), kicker: L('Сортировка слиянием · O(n log n)', 'Merge sort · O(n log n)'),
    summary: L('Две верхушки решают всё. Откуда в сортировке берётся log n.', 'Two heads decide everything. Where log n in sorting comes from.') },
  { id: 'binary-search', track: 'search', status: 'ready', minutes: 20, prereqs: ['merge-sorted'], next: ['bfs'],
    title: L('Бинарный поиск: право отбросить половину', 'Binary search: permission to discard half'), kicker: L('Инвариант · граница · O(log n)', 'Invariant · boundary · O(log n)'),
    summary: L('Найдите границу в упорядоченных данных, сломайте одну строку и постройте свой контрпример.', 'Find a boundary in sorted data, break one line, and construct your own counterexample.') },
  { id: 'bfs', track: 'a-graphs', status: 'ready', minutes: 20, prereqs: ['bracket-stack'], next: ['dp-stairs'],
    title: L('Поиск в ширину: очередь находит кратчайший путь', 'Breadth-first search: a queue finds shortest paths'), kicker: L('Граф · очередь FIFO · O(V + E)', 'Graph · FIFO queue · O(V + E)'),
    summary: L('Волна расходится слоями. Почему стек вместо очереди даёт неверные расстояния.', 'A wave spreads in layers. Why a stack instead of a queue gives wrong distances.') },
  { id: 'dp-stairs', track: 'a-graphs', status: 'ready', minutes: 18, prereqs: ['complexity'], next: [],
    title: L('Динамическое программирование: ответ из меньших ответов', 'Dynamic programming: answers from smaller answers'), kicker: L('Рекуррента · база · индукция', 'Recurrence · base case · induction'),
    summary: L('Лестница и числа Фибоначчи. Таблица вместо экспоненциальной рекурсии, LeetCode 70.', 'Stairs and Fibonacci numbers. A table instead of exponential recursion, LeetCode 70.') },
];
export async function loadAlgorithmTopic(id) {
  if (id === 'binary-search') return (await import('./binary-search.js')).default;
  if (ALGORITHM_TOPICS.some(topic => topic.id === id)) return (await import('./pattern-player.js')).createPatternTopic(id);
  return null;
}
export function algorithmProgress(id) {
  try { return JSON.parse(localStorage.getItem(id === 'binary-search' ? 'mathlab-topic-binary-search' : `mathlab-pattern-${id}`) || '[]').length; } catch { return 0; }
}
export const LESSON_SHAPE = [L('Прогноз', 'Predict'), L('Трассировка', 'Trace'), L('Почему работает', 'Why it works'), L('Свой Python', 'Your Python'), L('Перенос', 'Transfer'), L('Шпаргалка', 'Cheat sheet')];
