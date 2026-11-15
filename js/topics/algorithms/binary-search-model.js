// lower_bound searches positions, including the sentinel n. No dynamic code execution.
export const DEMO = Object.freeze([1, 3, 3, 5, 8, 8, 12, 17]);
export const CHAPTERS = [
  { id: 'task', seconds: 7, ru: 'Найти границу', en: 'Find a boundary' },
  { id: 'compare', seconds: 9, ru: 'Одно сравнение', en: 'One comparison' },
  { id: 'discard', seconds: 9, ru: 'Право исключить', en: 'Permission to discard' },
  { id: 'repeat', seconds: 12, ru: 'Повторить довод', en: 'Repeat the argument' },
  { id: 'invariant', seconds: 10, ru: 'Что остаётся истинным', en: 'What stays true' },
  { id: 'failure', seconds: 10, ru: 'Одна строка ломает поиск', en: 'One line breaks the search' },
  { id: 'transfer', seconds: 8, ru: 'Перенос идеи', en: 'Transfer the idea' },
];
export const DURATION = CHAPTERS.reduce((s, c) => s + c.seconds, 0);
export const chapterStart = i => CHAPTERS.slice(0, i).reduce((s, c) => s + c.seconds, 0);
export function frameAt(seconds) {
  const time = Math.max(0, Math.min(DURATION, Number(seconds) || 0));
  let start = 0;
  for (let i = 0; i < CHAPTERS.length; i++) {
    const c = CHAPTERS[i];
    if (time < start + c.seconds || i === CHAPTERS.length - 1) return { index: i, id: c.id, progress: (time - start) / c.seconds, time };
    start += c.seconds;
  }
}
export function validInput(a, x) {
  return Array.isArray(a) && a.every((v, i) => Number.isFinite(v) && (!i || a[i - 1] <= v)) && Number.isFinite(x);
}
export const boundary = (a, x) => { const p = a.findIndex(v => v >= x); return p < 0 ? a.length : p; };
export function invariant(a, x, { lo, hi }) {
  return Number.isInteger(lo) && Number.isInteger(hi) && lo >= 0 && lo <= hi && hi <= a.length && a.slice(0, lo).every(v => v < x) && a.slice(hi).every(v => v >= x);
}
export function transition(a, x, state, variant = 'correct') {
  if (!validInput(a, x) || !invariant(a, x, state)) throw new RangeError('Expected sorted finite input and valid bounds');
  const { lo, hi } = state;
  if (lo === hi) return { ...state, done: true, result: lo };
  const mid = Math.floor((lo + hi) / 2), less = variant === 'upper' ? a[mid] <= x : a[mid] < x;
  const after = less ? { lo: variant === 'stall' ? mid : mid + 1, hi } : { lo, hi: variant === 'skip' ? mid - 1 : mid };
  return { lo, hi, mid, value: a[mid], less, after, valid: invariant(a, x, after), decreased: after.hi - after.lo < hi - lo, answer: boundary(a, x) };
}
export function trace(a, x, variant = 'correct') {
  if (!validInput(a, x)) throw new RangeError('Expected a sorted array of finite numbers');
  const steps = []; let state = { lo: 0, hi: a.length }, reason = 'done';
  while (state.lo < state.hi) {
    const step = transition(a, x, state, variant); steps.push(step); state = step.after;
    if (!step.valid) { reason = 'invariant'; break; }
    if (!step.decreased) { reason = 'stalled'; break; }
  }
  return { steps, state, reason, result: reason === 'done' ? state.lo : null, expected: boundary(a, x) };
}
// Select a trace segment without wrapping its final endpoint back to zero.
export function playbackStep(run, progress) {
  const p = Math.max(0, Math.min(1, Number(progress) || 0));
  if (!run.steps.length) return { index: -1, step: null, progress: 1 };
  const q = p * run.steps.length, index = Math.min(run.steps.length - 1, Math.floor(q));
  return { index, step: run.steps[index], progress: Math.min(1, q - index) };
}
export const TRANSFER = [
  { a: [0, 2, 2, 2, 7, 11], x: 2 },
  { a: [1, 4, 4, 9, 13], x: 6 },
  { a: [2, 5, 5, 10], x: 12 },
];
export function checkTransfer(answers) {
  return TRANSFER.map(({ a, x }, i) => String(answers[i]).trim() !== '' && Number(answers[i]) === boundary(a, x));
}
export function checkCounterexample(a, x) {
  if (!validInput(a, x) || !a.length || a.length > 12) return { ok: false, reason: 'input' };
  const run = trace(a, x, 'stall');
  return { ok: run.reason === 'stalled', reason: run.reason, run };
}
