const L = (ru, en) => ({ ru, en });
export const ALGORITHMS_SUBJECT = {
  id: 'algorithms', title: L('Алгоритмы и структуры данных', 'Algorithms and data structures'),
  summary: L('Программа как проверяемое рассуждение: эксперимент, инвариант и контрпример.', 'A program as an argument you can test: experiment, invariant, and counterexample.'),
};
export const ALGORITHM_TOPICS = [
  { id: 'prefix-sums', track: 'patterns', status: 'ready', minutes: 18, next: ['two-pointers', 'graph'],
    title: L('Префиксные суммы: накопить и вычесть', 'Prefix sums: accumulate and subtract'),
    summary: L('Дискретное накопление, разность и запросы к массиву. Свой Python и задачи по мотивам LeetCode 303.', 'Discrete accumulation, differences, and range queries. Your Python and practice adapted from LeetCode 303.') },
  { id: 'two-pointers', track: 'patterns', status: 'ready', minutes: 20, prereqs: ['prefix-sums'], next: ['hash-two-sum', 'binary-search'],
    title: L('Два указателя: исключать целые семейства пар', 'Two pointers: eliminate whole families of pairs'),
    summary: L('Неравенства объясняют каждый сдвиг. Напишите поиск пары и проверьте, зачем нужна сортировка.', 'Inequalities justify each move. Write a pair search and discover why ordering matters.') },
  { id: 'hash-two-sum', track: 'patterns', status: 'ready', minutes: 20, prereqs: ['two-pointers'], next: ['bracket-stack'],
    title: L('Хеш-таблица: уравнение вместо перебора', 'Hash maps: an equation instead of enumeration'),
    summary: L('Из x + y = t получаем дополнение. Память прошлых значений заменяет перебор пар. Практика Two Sum.', 'From x + y = t, derive a complement. Remembered values replace pair enumeration. Two Sum practice.') },
  { id: 'bracket-stack', track: 'patterns', status: 'ready', minutes: 20, next: ['binary-search'],
    title: L('Стек: память о незакрытом', 'Stacks: remembering what remains open'),
    summary: L('Префиксный баланс, вложенность и почему счётчика недостаточно. Напишите проверку скобок.', 'Prefix balance, nesting, and why a counter is insufficient. Write a bracket validator.') },
  {
  id: 'binary-search', track: 'search', status: 'ready', minutes: 20, next: ['two-pointers'],
  title: L('Право отбросить половину', 'Permission to discard half'),
  kicker: L('Бинарный поиск · инвариант · завершение', 'Binary search · invariant · termination'),
  summary: L('Найдите границу в упорядоченных данных. Обоснуйте каждый шаг, сломайте одну строку и постройте свой контрпример.', 'Find a boundary in sorted data. Justify each step, break one line, and construct your own counterexample.'),
}];
export async function loadAlgorithmTopic(id) {
  if (id === 'binary-search') return (await import('./binary-search.js')).default;
  if (ALGORITHM_TOPICS.some(topic => topic.id === id)) return (await import('./pattern-player.js')).createPatternTopic(id);
  return null;
}
