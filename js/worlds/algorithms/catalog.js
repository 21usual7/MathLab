const L = (ru, en) => ({ ru, en });
export const ALGORITHMS_COLLECTION = {
  id: 'algorithms', title: L('Математика через код', 'Mathematics through code'),
  summary: L('Программа как проверяемое рассуждение: эксперимент, инвариант и контрпример.', 'A program as an argument you can test: experiment, invariant, and counterexample.'),
};
export const ALGORITHM_WORLDS = [{
  id: 'binary-search', collection: 'algorithms', minutes: 15,
  title: L('Право отбросить половину', 'Permission to discard half'),
  kicker: L('Бинарный поиск · инвариант · завершение', 'Binary search · invariant · termination'),
  summary: L('Найдите границу в упорядоченных данных. Обоснуйте каждый шаг, сломайте одну строку и постройте свой контрпример.', 'Find a boundary in sorted data. Justify each step, break one line, and construct your own counterexample.'),
}];
export const loadAlgorithmWorld = async id => id === 'binary-search' ? (await import('./binary-search.js')).default : null;
