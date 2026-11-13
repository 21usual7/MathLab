// Checking answers without AI. A formula is compared with the right one by numbers; when it is wrong we
// look for *how* its graph differs — shifted, stretched, flipped — and turn that into an explanation.
// Tasks may also list typical mistakes with their own, more precise explanations.

const DEFAULT_RANGE = [-6, 6];

function samples([lo, hi], n = 97) {
  // Slightly irregular points, so a periodic function does not hide its error at the nodes
  return Array.from({ length: n }, (_, i) => lo + (hi - lo) * (i + 0.37 * Math.sin(i * 12.9898) ** 2) / n);
}

// Both defined at the same places, and equal there (up to rounding)
export function same(f, g, range = DEFAULT_RANGE) {
  let both = 0;
  for (const x of samples(range)) {
    const a = f(x), b = g(x);
    if (isFinite(a) !== isFinite(b)) return false;
    if (!isFinite(a)) continue;
    both++;
    if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(b))) return false;
  }
  return both > 5;
}

// How the student's graph fs differs from the right one fa:
//   { type: 'same' } | { type: 'vshift', d } | { type: 'hshift', d } | { type: 'vscale', k } | { type: 'hscale', b } | { type: 'other' }
// vshift: fs = fa + d (higher by d); hshift: fs(x) = fa(x − d) (moved right by d); vscale: fs = k·fa; hscale: fs(x) = fa(b·x)
export function diagnose(fs, fa, range = DEFAULT_RANGE) {
  if (same(fs, fa, range)) return { type: 'same' };
  const xs = samples(range).filter(x => isFinite(fa(x)) && isFinite(fs(x)));
  // Answers in tasks are usually round numbers: snap to quarters what is a quarter up to rounding, keep the rest
  const nice = v => Math.abs(v - Math.round(v * 4) / 4) < 1e-6 ? Math.round(v * 4) / 4 : v;

  if (xs.length > 5) {
    const d = nice(fs(xs[0]) - fa(xs[0]));
    if (d !== 0 && same(fs, x => fa(x) + d, range)) return { type: 'vshift', d };
    const x0 = xs.find(x => Math.abs(fa(x)) > 1e-3);
    if (x0 !== undefined) {
      const k = nice(fs(x0) / fa(x0));
      if (k !== 1 && k !== 0 && same(fs, x => k * fa(x), range)) return { type: 'vscale', k };
    }
  }
  for (let d = -8; d <= 8; d += 0.25) {
    if (d !== 0 && same(fs, x => fa(x - d), range)) return { type: 'hshift', d };
  }
  for (const b of [-1, 2, 3, 4, 1.5, 0.5, 1 / 3, 0.25, 2 / 3, -2, -0.5]) {
    if (same(fs, x => fa(b * x), range)) return { type: 'hscale', b };
  }
  return { type: 'other' };
}

const n = v => String(Math.round(Math.abs(v) * 1000) / 1000);

// The difference in words (en / ru)
export function explainDiff(diag) {
  switch (diag.type) {
    case 'vshift': return diag.d > 0
      ? { en: `Your graph is ${n(diag.d)} higher than the right one: the number added outside the function is off.`, ru: `Ваш график на ${n(diag.d)} выше нужного: число, которое прибавляется снаружи функции, не то.` }
      : { en: `Your graph is ${n(diag.d)} lower than the right one: the number added outside the function is off.`, ru: `Ваш график на ${n(diag.d)} ниже нужного: число, которое прибавляется снаружи функции, не то.` };
    case 'hshift': return diag.d > 0
      ? { en: `Your graph is ${n(diag.d)} to the right of the right one. A shift along x is written inside, and the sign works backwards: f(x − 2) moves right.`, ru: `Ваш график на ${n(diag.d)} правее нужного. Сдвиг по x пишется внутри, и знак работает наоборот: f(x − 2) — это вправо.` }
      : { en: `Your graph is ${n(diag.d)} to the left of the right one. A shift along x is written inside, and the sign works backwards: f(x + 2) moves left.`, ru: `Ваш график на ${n(diag.d)} левее нужного. Сдвиг по x пишется внутри, и знак работает наоборот: f(x + 2) — это влево.` };
    case 'vscale': return diag.k === -1
      ? { en: 'Your graph is the right one flipped upside down: a minus in front of the function is missing or extra.', ru: 'Ваш график — нужный, перевёрнутый вверх ногами: не хватает минуса перед функцией или он лишний.' }
      : { en: `Your graph is ${n(diag.k)} times ${Math.abs(diag.k) > 1 ? 'taller' : 'flatter'} than the right one${diag.k < 0 ? ' and flipped' : ''}: check the factor in front of the function.`, ru: `Высоты вашего графика в ${n(Math.abs(diag.k) > 1 ? diag.k : 1 / diag.k)} раза ${Math.abs(diag.k) > 1 ? 'больше' : 'меньше'} нужных${diag.k < 0 ? ', и он перевёрнут' : ''}: проверьте множитель перед функцией.` };
    case 'hscale': {
      if (diag.b === -1) return { en: 'Your graph is the right one mirrored left to right: check the sign of x inside.', ru: 'Ваш график — нужный, отражённый слева направо: проверьте знак при x внутри.' };
      // fs(x) = fa(bx): with |b| > 1 the student's graph is narrower
      const narrow = Math.abs(diag.b) > 1, times = n(narrow ? diag.b : 1 / diag.b);
      const flip = diag.b < 0 ? { en: ' and mirrored', ru: ' и отражён' } : { en: '', ru: '' };
      return narrow
        ? { en: `Your graph is ${times} times narrower than the right one${flip.en}. A factor inside acts on x backwards: a bigger factor squeezes.`, ru: `Ваш график в ${times} раза уже нужного${flip.ru}. Множитель внутри действует на x наоборот: чем он больше, тем график уже.` }
        : { en: `Your graph is ${times} times wider than the right one${flip.en}. A factor inside acts on x backwards: a bigger factor squeezes.`, ru: `Ваш график в ${times} раза шире нужного${flip.ru}. Множитель внутри действует на x наоборот: чем он больше, тем график уже.` };
    }
    default: return { en: 'The graphs do not match. Compare them on the picture: where do they part?', ru: 'Графики не совпадают. Сравните их на картинке: где они расходятся?' };
  }
}
