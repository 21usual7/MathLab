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

// ---------- A graph drawn by hand ----------
// It cannot be compared number by number. We compare what the eye sees: where the graph turns (peaks and
// valleys), where it crosses the x axis, whether it goes up or down. Wiggles smaller than `noise` are ignored.

// ys are values at evenly spaced xs
export function shape(xs, ys, noise = 0.25) {
  const zeros = [], turns = [];
  // Crossings of the axis: the sign must really change, not just touch zero
  let sign = 0;
  ys.forEach((y, i) => {
    const s = y > noise / 2 ? 1 : y < -noise / 2 ? -1 : 0;
    if (!s) return;
    if (sign && s !== sign) {
      let k = i;
      while (k > 0 && Math.sign(ys[k - 1]) === s) k--;
      const a = ys[k - 1], b = ys[k];
      zeros.push(xs[k - 1] + (xs[k] - xs[k - 1]) * (a / (a - b)));
    }
    sign = s;
  });
  // Turns: the graph went up by more than noise and then down by more than noise (or the other way)
  let dir = 0, ext = ys[0], extX = xs[0], lo = ys[0], loX = xs[0], hi = ys[0], hiX = xs[0], start = 0;
  for (let i = 1; i < ys.length; i++) {
    const x = xs[i], y = ys[i];
    if (!dir) {
      if (y > hi) { hi = y; hiX = x; }
      if (y < lo) { lo = y; loX = x; }
      if (hi - lo > noise) {
        dir = start = hiX > loX ? 1 : -1;
        [ext, extX] = dir > 0 ? [hi, hiX] : [lo, loX];
      }
    } else if (dir * (y - ext) > 0) {
      ext = y; extX = x;
    } else if (dir * (ext - y) > noise) {
      turns.push({ x: extX, kind: dir > 0 ? 'max' : 'min' });
      dir = -dir; ext = y; extX = x;
    }
  }
  return { zeros, turns, start, sign };
}

// The first visible difference of the student's shape st from the right one goal (or { type: 'same' }).
// what: which properties are checked ('turns', 'zeros'); tol: how far a turn or a zero may be off along x.
export function compareShape(st, goal, { tol = 0.4, what = ['turns', 'zeros'] } = {}) {
  const far = (a, b) => a.findIndex((x, i) => Math.abs(x - b[i]) > tol);
  if (what.includes('turns')) {
    if (st.turns.length !== goal.turns.length || st.start !== goal.start) return { type: 'turns', st, goal };
    const i = far(st.turns.map(t => t.x), goal.turns.map(t => t.x));
    if (i >= 0) return { type: 'turnPlace', got: st.turns[i], want: goal.turns[i] };
  }
  if (what.includes('zeros')) {
    if (st.zeros.length !== goal.zeros.length) return { type: 'zeros', st, goal };
    const i = far(st.zeros, goal.zeros);
    if (i >= 0) return { type: 'zeroPlace', got: st.zeros[i], want: goal.zeros[i] };
    if (!goal.zeros.length && st.sign !== goal.sign) return { type: 'sign', goal };
  }
  return { type: 'same' };
}

const r1 = v => String(Math.round(v * 10) / 10);

// «goes up → goes down → goes up»
function story(sh, lang) {
  const word = { en: { 1: 'goes up', '-1': 'goes down', 0: 'is flat' }, ru: { 1: 'растёт', '-1': 'убывает', 0: 'ровная' } }[lang];
  const parts = [word[sh.start]];
  let d = sh.start;
  sh.turns.forEach(() => { d = -d; parts.push(word[d]); });
  return parts.join(' → ');
}

// The difference in words (en / ru)
export function explainShape(diff) {
  const turn = { en: { max: 'peak', min: 'valley' }, ru: { max: 'вершина', min: 'впадина' } };
  switch (diff.type) {
    case 'turns': return {
      en: `The right graph ${story(diff.goal, 'en')}; yours ${story(diff.st, 'en')}.`,
      ru: `Нужный график: ${story(diff.goal, 'ru')}. Ваш: ${story(diff.st, 'ru')}.`,
    };
    case 'turnPlace': return {
      en: `The ${turn.en[diff.want.kind]} should be at x ≈ ${r1(diff.want.x)}, and yours is at x ≈ ${r1(diff.got.x)}.`,
      ru: `${turn.ru[diff.want.kind][0].toUpperCase() + turn.ru[diff.want.kind].slice(1)} должна быть при x ≈ ${r1(diff.want.x)}, а у вас — при x ≈ ${r1(diff.got.x)}.`,
    };
    case 'zeros': {
      const at = z => z.length ? ` (x ≈ ${z.map(r1).join('; ')})` : '';
      return {
        en: `The right graph crosses the x axis ${diff.goal.zeros.length} time(s)${at(diff.goal.zeros)}, yours ${diff.st.zeros.length}.`,
        ru: `Число пересечений с осью x: нужно ${diff.goal.zeros.length}${at(diff.goal.zeros)}, у вас ${diff.st.zeros.length}.`,
      };
    }
    case 'zeroPlace': return {
      en: `The graph should cross the x axis at x ≈ ${r1(diff.want)}, and yours does at x ≈ ${r1(diff.got)}.`,
      ru: `График должен пересекать ось x при x ≈ ${r1(diff.want)}, а ваш — при x ≈ ${r1(diff.got)}.`,
    };
    case 'sign': return diff.goal.sign > 0
      ? { en: 'The right graph lies above the x axis everywhere here.', ru: 'Нужный график здесь везде выше оси x.' }
      : { en: 'The right graph lies below the x axis everywhere here.', ru: 'Нужный график здесь везде ниже оси x.' };
    default: return { en: '', ru: '' };
  }
}
