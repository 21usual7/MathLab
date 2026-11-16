const L = (ru, en) => ({ ru, en });
export const ALGORITHMS_SUBJECT = {
  id: 'algorithms', path: true, href: '#algorithms', title: L('Алгоритмы и структуры данных', 'Algorithms and data structures'),
  summary: L('Программа как проверяемое рассуждение: эксперимент, инвариант и контрпример.', 'A program as an argument you can test: experiment, invariant, and counterexample.'),
};
// Modules of one route, in order. Each lesson: prediction → trace → why → Python → transfer → cheat sheet.
export const ALGORITHM_TRACKS = [
  { id: 'a-cost', subject: 'algorithms', title: L('Цена алгоритма', 'The cost of an algorithm'), summary: L('Считаем шаги, а не секунды: O(n) против O(n²).', 'Count steps, not seconds: O(n) versus O(n²).') },
  { id: 'patterns', subject: 'algorithms', title: L('Массивы: накопить, сдвинуть, сойтись', 'Arrays: accumulate, slide, converge'), summary: L('Три приёма, которые превращают перебор отрезков и пар в один проход.', 'Three techniques that turn scanning all ranges and pairs into one pass.') },
  { id: 'a-memory', subject: 'algorithms', title: L('Память: словарь и стек', 'Memory: dictionaries and stacks'), summary: L('Что запомнить о прошлом, чтобы не возвращаться к нему.', 'What to remember about the past so you never revisit it.') },
  { id: 'search', subject: 'algorithms', title: L('Порядок: слияние и поиск', 'Order: merging and searching'), summary: L('Отсортированные данные дают право отбрасывать и сливать.', 'Sorted data grants the right to discard and to merge.') },
  { id: 'a-trees', subject: 'algorithms', title: L('Рекурсия и деревья', 'Recursion and trees'), summary: L('Задача внутри задачи: от Ханойских башен к деревьям поиска и куче.', 'A problem inside a problem: from the Towers of Hanoi to search trees and heaps.') },
  { id: 'a-graphs', subject: 'algorithms', title: L('Графы: кратчайшие пути', 'Graphs: shortest paths'), summary: L('Волна по рёбрам: сначала все равны, потом у каждого своя цена.', 'A wave along edges: first all equal, then each with its own cost.') },
  { id: 'a-dp', subject: 'algorithms', title: L('Перебор и динамика', 'Search and dynamic programming'), summary: L('Как перебрать всё, не перебирая лишнего, и как не считать одно дважды.', 'How to try everything without trying too much, and never compute the same thing twice.') },
];
export const ALGORITHM_TOPICS = [
  { id: 'complexity', track: 'a-cost', status: 'ready', minutes: 15, next: ['array'],
    title: L('Сколько стоит алгоритм: считаем шаги', 'What an algorithm costs: counting steps'), kicker: L('O-нотация · n(n−1)/2 · set', 'Big-O · n(n−1)/2 · set'),
    summary: L('Повтор в списке «в лоб» и через множество. Почему удвоение данных учетверяет работу.', 'Finding a repeat head-on and with a set. Why doubling the data quadruples the work.') },
  { id: 'array', kind: 'structure', track: 'a-cost', status: 'ready', minutes: 25, prereqs: ['complexity'], next: ['prefix-sums'],
    title: L('Массив: память подряд и индекс', 'Arrays: contiguous memory and the index'), kicker: L('Структура · a[i] за O(1) · сдвиг · удвоение', 'Structure · a[i] in O(1) · shifting · doubling'),
    summary: L('Почему a[i] стоит один шаг, insert(0) — n шагов, а append в среднем O(1). Песочница с памятью.', 'Why a[i] costs one step, insert(0) costs n, and append is O(1) on average. A memory sandbox.') },
  { id: 'prefix-sums', track: 'patterns', status: 'ready', minutes: 18, prereqs: ['complexity'], next: ['sliding-window', 'two-pointers'],
    title: L('Префиксные суммы: накопить и вычесть', 'Prefix sums: accumulate and subtract'), kicker: L('Накопление · разность · запросы O(1)', 'Accumulation · difference · O(1) queries'),
    summary: L('Сумма любого отрезка одной разностью. Задача по мотивам LeetCode 303.', 'Any range sum by one subtraction. Practice adapted from LeetCode 303.') },
  { id: 'sliding-window', track: 'patterns', status: 'ready', minutes: 15, prereqs: ['prefix-sums'], next: ['two-pointers'],
    title: L('Скользящее окно: прибавить вошедшее, вычесть ушедшее', 'Sliding window: add what enters, subtract what leaves'), kicker: L('Окно длины k · O(n) вместо O(n·k)', 'Window of length k · O(n) instead of O(n·k)'),
    summary: L('Лучшие k дней подряд за один проход. Задача по мотивам LeetCode 643.', 'The best k days in a row in one pass. Practice adapted from LeetCode 643.') },
  { id: 'two-pointers', track: 'patterns', status: 'ready', minutes: 20, prereqs: ['prefix-sums'], next: ['hash-two-sum', 'binary-search'],
    title: L('Два указателя: исключать целые семейства пар', 'Two pointers: eliminate whole families of pairs'), kicker: L('Сортировка · неравенства · O(1) памяти', 'Sorting · inequalities · O(1) space'),
    summary: L('Неравенства объясняют каждый сдвиг. Пара с нужной суммой, LeetCode 167.', 'Inequalities justify each move. A pair with a target sum, LeetCode 167.') },
  { id: 'hash-table', kind: 'structure', track: 'a-memory', status: 'ready', minutes: 25, prereqs: ['array'], next: ['hash-two-sum'],
    title: L('Хеш-таблица: номер корзины из самого ключа', 'Hash tables: the bucket number from the key itself'), kicker: L('Структура · хеш · коллизии · α = n/m', 'Structure · hashing · collisions · α = n/m'),
    summary: L('Как устроены dict и set: корзины, цепочки, рехеширование. Почему поиск — O(1) в среднем.', 'How dict and set work: buckets, chains, rehashing. Why lookup is O(1) on average.') },
  { id: 'hash-two-sum', short: L('Two Sum: дополнение', 'Two Sum: the complement'), track: 'a-memory', status: 'ready', minutes: 20, prereqs: ['hash-table', 'two-pointers'], next: ['bracket-stack'],
    title: L('Хеш-таблица: уравнение вместо перебора', 'Hash maps: an equation instead of enumeration'), kicker: L('Словарь · дополнение t − x', 'Dictionary · complement t − x'),
    summary: L('Память прошлых значений заменяет перебор пар. Практика Two Sum.', 'Remembered values replace pair enumeration. Two Sum practice.') },
  { id: 'stack-queue', kind: 'structure', track: 'a-memory', status: 'ready', minutes: 25, prereqs: ['array'], next: ['bracket-stack', 'graphs'],
    title: L('Стек и очередь: последний или первый', 'Stacks and queues: last in or first in'), kicker: L('Структура · LIFO · FIFO · deque', 'Structure · LIFO · FIFO · deque'),
    summary: L('Две структуры с одинаковыми операциями и разным порядком. Почему list.pop(0) — ловушка.', 'Two structures with the same operations and a different order. Why list.pop(0) is a trap.') },
  { id: 'bracket-stack', short: L('Проверка скобок', 'Bracket checking'), track: 'a-memory', status: 'ready', minutes: 20, prereqs: ['stack-queue'], next: ['recursion', 'bfs'],
    title: L('Стек: память о незакрытом', 'Stacks: remembering what remains open'), kicker: L('LIFO · вложенность · баланс', 'LIFO · nesting · balance'),
    summary: L('Почему счётчика недостаточно. Напишите проверку скобок, LeetCode 20.', 'Why a counter is insufficient. Write a bracket validator, LeetCode 20.') },
  { id: 'merge-sorted', track: 'search', status: 'ready', minutes: 18, prereqs: ['two-pointers'], next: ['binary-search'],
    title: L('Слияние: две стопки в одну', 'Merging: two piles into one'), kicker: L('Сортировка слиянием · O(n log n)', 'Merge sort · O(n log n)'),
    summary: L('Две верхушки решают всё. Откуда в сортировке берётся log n.', 'Two heads decide everything. Where log n in sorting comes from.') },
  { id: 'binary-search', track: 'search', status: 'ready', minutes: 20, prereqs: ['merge-sorted'], next: ['tree'],
    title: L('Бинарный поиск: право отбросить половину', 'Binary search: permission to discard half'), kicker: L('Инвариант · граница · O(log n)', 'Invariant · boundary · O(log n)'),
    summary: L('Найдите границу в упорядоченных данных, сломайте одну строку и постройте свой контрпример.', 'Find a boundary in sorted data, break one line, and construct your own counterexample.') },
  { id: 'recursion', track: 'a-trees', status: 'ready', minutes: 18, prereqs: ['bracket-stack'], next: ['tree', 'backtracking'],
    title: L('Рекурсия: Ханойские башни', 'Recursion: the Towers of Hanoi'), kicker: L('Индукция · стек вызовов · 2ⁿ − 1', 'Induction · call stack · 2ⁿ − 1'),
    summary: L('Доверьтесь меньшей задаче. Диски летят по дугам, стек вызовов растёт и сжимается.', 'Trust the smaller problem. Disks fly in arcs while the call stack grows and shrinks.') },
  { id: 'tree', kind: 'structure', track: 'a-trees', status: 'ready', minutes: 25, prereqs: ['recursion'], next: ['bst', 'heap'],
    title: L('Дерево: корень, листья, обходы', 'Trees: root, leaves, traversals'), kicker: L('Структура · высота · pre/in/post · по уровням', 'Structure · height · pre/in/post · level order'),
    summary: L('Словарь деревьев и четыре обхода на живом дереве, которое можно растить.', 'The vocabulary of trees and four traversals on a live tree you can grow.') },
  { id: 'bst', track: 'a-trees', status: 'ready', minutes: 20, prereqs: ['tree', 'binary-search'], next: ['heap'],
    title: L('Дерево поиска: бинарный поиск на указателях', 'Binary search trees: binary search over pointers'), kicker: L('Порядок · высота h · O(log n) или O(n)', 'Order · height h · O(log n) or O(n)'),
    summary: L('Узлы вырастают из родителей. Почему порядок вставки решает всё.', 'Nodes grow out of their parents. Why insertion order decides everything.') },
  { id: 'heap', kind: 'structure', track: 'a-trees', status: 'ready', minutes: 25, prereqs: ['tree'], next: ['dijkstra'],
    title: L('Куча: минимум всегда наверху', 'Heaps: the minimum is always on top'), kicker: L('Структура · дерево в массиве · всплытие · погружение', 'Structure · a tree in an array · sift-up · sift-down'),
    summary: L('Очередь с приоритетом: push и pop_min за O(log n). Дерево и массив меняются синхронно.', 'A priority queue: push and pop_min in O(log n). Tree and array change in sync.') },
  { id: 'graphs', kind: 'structure', track: 'a-graphs', status: 'ready', minutes: 25, prereqs: ['stack-queue'], next: ['bfs'],
    title: L('Граф: вершины, рёбра и как их хранить', 'Graphs: vertices, edges, and how to store them'), kicker: L('Структура · список и матрица смежности · 2E', 'Structure · adjacency list and matrix · 2E'),
    summary: L('Соберите граф кликами — список смежности и матрица меняются вместе. Когда что выбирать.', 'Build a graph by clicking — the adjacency list and matrix change together. When to choose which.') },
  { id: 'bfs', track: 'a-graphs', status: 'ready', minutes: 20, prereqs: ['graphs'], next: ['dijkstra'],
    title: L('Поиск в ширину: очередь находит кратчайший путь', 'Breadth-first search: a queue finds shortest paths'), kicker: L('Граф · очередь FIFO · O(V + E)', 'Graph · FIFO queue · O(V + E)'),
    summary: L('Волна расходится слоями. Почему стек вместо очереди даёт неверные расстояния.', 'A wave spreads in layers. Why a stack instead of a queue gives wrong distances.') },
  { id: 'dijkstra', track: 'a-graphs', status: 'ready', minutes: 22, prereqs: ['bfs', 'heap'], next: ['backtracking'],
    title: L('Алгоритм Дейкстры: кратчайшие пути со стоимостью', 'Dijkstra’s algorithm: shortest paths with costs'), kicker: L('Веса ≥ 0 · релаксация · куча', 'Weights ≥ 0 · relaxation · heap'),
    summary: L('Импульсы бегут по рёбрам, расстояния уточняются. Почему BFS тут ошибается.', 'Pulses run along edges as distances improve. Why BFS gets it wrong here.') },
  { id: 'backtracking', track: 'a-dp', status: 'ready', minutes: 20, prereqs: ['recursion'], next: ['dp-stairs'],
    title: L('Перебор с возвратом: ферзи на доске', 'Backtracking: queens on a board'), kicker: L('Дерево решений · отсечения · отмена хода', 'Decision tree · pruning · undo'),
    summary: L('Ставим, упираемся, отступаем. Забытая отмена оставляет «призрачный» бой.', 'Place, hit a wall, retreat. A forgotten undo leaves "ghost" attacks.') },
  { id: 'dp-stairs', track: 'a-dp', status: 'ready', minutes: 18, prereqs: ['recursion'], next: [],
    title: L('Динамическое программирование: ответ из меньших ответов', 'Dynamic programming: answers from smaller answers'), kicker: L('Рекуррента · база · индукция', 'Recurrence · base case · induction'),
    summary: L('Лестница и числа Фибоначчи. Таблица вместо экспоненциальной рекурсии, LeetCode 70.', 'Stairs and Fibonacci numbers. A table instead of exponential recursion, LeetCode 70.') },
];
export async function loadAlgorithmTopic(id) {
  if (id === 'binary-search') return (await import('./binary-search.js')).default;
  const meta = ALGORITHM_TOPICS.find(topic => topic.id === id);
  if (meta?.kind === 'structure') return (await import('./structure-player.js')).createStructureTopic(id);
  if (meta) return (await import('./pattern-player.js')).createPatternTopic(id);
  return null;
}
export function algorithmProgress(id) {
  try { return JSON.parse(localStorage.getItem(id === 'binary-search' ? 'mathlab-topic-binary-search' : `mathlab-pattern-${id}`) || '[]').length; } catch { return 0; }
}
export const STRUCTURE_SHAPE = [L('Зачем', 'Why'), L('Словарь', 'Words'), L('Под микроскопом', 'Microscope'), L('Песочница', 'Sandbox'), L('Проверка', 'Quiz'), L('Стоимость', 'Costs'), L('Пределы', 'Limits'), L('Свой Python', 'Your Python'), L('В Python', 'Built-ins'), L('Шпаргалка', 'Cheat sheet')];
export const LESSON_SHAPE = [L('Прогноз', 'Predict'), L('Трассировка', 'Trace'), L('Почему работает', 'Why it works'), L('Свой Python', 'Your Python'), L('Перенос', 'Transfer'), L('Шпаргалка', 'Cheat sheet')];
