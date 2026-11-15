import { t } from '../../core/i18n.js';
import { L, el, button } from './ui.js';
import { DEMO, CHAPTERS, DURATION, chapterStart, frameAt, trace, transition, playbackStep } from './binary-search-model.js';

const X = 8, RUN = trace(DEMO, X);
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const beat = (p, a, b) => ease((p - a) / (b - a));
const CODE = ['lo = 0; hi = n', 'while lo < hi:', '  mid = floor((lo + hi) / 2)', '  if a[mid] < x:', '    lo = mid + 1', '  else: hi = mid', 'return lo'];
const C = { bg: '#070b12', ink: '#edf3fa', dim: '#72859a', blue: '#65b7fa', gold: '#f4ce73', green: '#85d5b1', red: '#fa8e96', line: '#314152' };

export function binarySearchStory(host, { onTransfer, onCounterexample } = {}) {
  const root = el('section', 'algorithm-story'); root.setAttribute('aria-label', t(L('Бинарный поиск: история', 'Binary search: the story')));
  const head = el('header', 'algorithm-story-head');
  const back = el('a', 'algorithm-back', L('← Алгоритмы и структуры данных', '← Algorithms and data structures')); back.href = '#topics/algorithms'; head.append(back);
  head.append(el('span', 'algorithm-eyebrow', L('Математика через код / 01', 'Mathematics through code / 01')), el('h2', '', L('Право отбросить половину', 'Permission to discard half')));
  const canvas = el('canvas', 'algorithm-canvas'); canvas.setAttribute('aria-hidden', 'true');
  const caption = el('p', 'algorithm-caption'); caption.setAttribute('aria-live', 'polite');
  const semantic = el('p', 'algorithm-state');
  const codeReference = el('details', 'algorithm-reference'), codeSummary = el('summary', '', L('Код и текущая строка (псевдокод)', 'Code and current line (pseudocode)'));
  const codeBlock = el('pre', 'algorithm-code');
  const codeLines = CODE.map(value => { const row = el('span', '', value); codeBlock.append(row); return row; });
  codeReference.append(codeSummary, codeBlock);
  const prediction = el('section', 'algorithm-prediction');
  const predictionTitle = el('h3', '', L('Сравнение уже сделано. Какой шаг разрешён?', 'The comparison is done. Which update is justified?'));
  const predictionFeedback = el('p', 'algorithm-feedback'); predictionFeedback.setAttribute('role', 'status');
  let answered = false;
  const choose = correct => {
    predictionFeedback.textContent = t(correct ? L('Да: hi = mid. Индексы справа больше не надо проверять. Сама граница mid остаётся возможным ответом.', 'Yes: hi = mid. The elements to its right need no further checks. The boundary mid itself remains a possible answer.') : L('Это удалит возможный ответ 4: a[4] = 8. Из a[mid] ≥ x нельзя сделать вывод, что ответ справа.', 'That loses possible answer 4: a[4] = 8. From a[mid] ≥ x you cannot conclude the answer is on the right.'));
    if (correct) { answered = true; continueButton.hidden = false; }
  };
  const continueButton = button(L('Продолжить довод →', 'Continue the argument →'), () => { if (reduced.matches) seekChapter(2); else { setTime(chapterStart(2)); play(); } }); continueButton.hidden = true;
  const choices = el('div', 'algorithm-actions'); choices.append(button('lo = mid + 1', () => choose(false)), button('hi = mid', () => choose(true)), continueButton);
  prediction.append(predictionTitle, choices, predictionFeedback); prediction.hidden = true;
  const nav = el('div', 'algorithm-transport');
  const playButton = button(L('▶ Смотреть историю', '▶ Watch the story'), () => running ? pause() : play()); playButton.dataset.action = 'play';
  const prev = button('←', () => seekChapter(Math.max(0, frameAt(seconds).index - 1))); prev.setAttribute('aria-label', t(L('Предыдущая сцена', 'Previous scene')));
  const next = button('→', () => seekChapter(Math.min(CHAPTERS.length - 1, frameAt(seconds).index + 1))); next.setAttribute('aria-label', t(L('Следующая сцена', 'Next scene')));
  const chapters = el('select'); chapters.setAttribute('aria-label', t(L('Сцена истории', 'Story chapter')));
  CHAPTERS.forEach((c, i) => { const option = el('option', '', c); option.value = i; chapters.append(option); });
  chapters.addEventListener('change', () => seekChapter(+chapters.value));
  const microscope = button(L('⌕ Причинный микроскоп', '⌕ Causal microscope'), openMicroscope);
  nav.append(playButton, prev, next, chapters, microscope);
  const timeline = el('input', 'algorithm-timeline'); timeline.type = 'range'; timeline.min = 0; timeline.max = DURATION; timeline.step = '.05'; timeline.value = 0;
  timeline.setAttribute('aria-label', t(L('Время истории', 'Story time'))); timeline.addEventListener('input', () => { pause(); setTime(+timeline.value); });
  const links = el('div', 'algorithm-actions'); links.append(button(L('Новый пример: проверьте себя ↗', 'Try a new problem ↗'), () => onTransfer?.()), button(L('Построить контрпример ↗', 'Construct a counterexample ↗'), () => onCounterexample?.()));
  root.append(head, canvas, caption, semantic, codeReference, prediction, nav, timeline, links); host.append(root);
  const ctx = canvas.getContext('2d');
  let seconds = 0, running = false, raf = 0, last = null, disposed = false, width = 900, height = 490, dialog = null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function text(value, x, y, size = 20, color = C.ink, align = 'center') {
    ctx.fillStyle = color; ctx.font = `${size * (width < 600 ? 1.35 : 1)}px ui-monospace, SFMono-Regular, monospace`; ctx.textAlign = align; ctx.fillText(value, x, y, 860);
  }
  function line(x1, y1, x2, y2, color = C.line, stroke = 2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = stroke; ctx.stroke(); }
  function alpha(a, fn) { ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); }
  function cell(value, i, x, y, w, color, opacity = 1) {
    alpha(opacity, () => { ctx.fillStyle = '#111b28'; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x - w / 2, y - 26, w, 52, 7); ctx.fill(); ctx.stroke(); text(String(value), x, y + 8, 24, color); text(String(i), x, y + 51, 14, C.dim); });
  }
  function draw() {
    if (disposed) return;
    const f = frameAt(seconds), p = reduced.matches ? 1 : f.progress;
    root.dataset.time = seconds.toFixed(2); root.dataset.chapter = f.id;
    const dpr = Math.min(2, devicePixelRatio || 1); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, width, height);
    // A fixed logical stage keeps code, cards and interval markers in the same coordinate system.
    ctx.save(); ctx.scale(width / 900, height / 490);
    let step = RUN.steps[0], result = false, localProgress = p;
    if (f.id === 'repeat') { const segment = playbackStep(RUN, p); step = segment.step; localProgress = segment.progress; result = p > .98; }
    if (['invariant', 'transfer'].includes(f.id)) { step = RUN.steps.at(-1); result = true; }
    if (f.id === 'failure') step = { lo: 0, hi: 1, mid: 0, value: 1, less: true, after: { lo: 0, hi: 1 } };
    const a = f.id === 'failure' ? [1, 3] : DEMO;
    const target = f.id === 'failure' ? 3 : X;
    const gap = Math.min(95, 700 / a.length), totalWidth = gap * a.length;
    const baseX = 450 - totalWidth / 2 + gap / 2;
    const compared = f.id !== 'task' && (f.id !== 'compare' || p > .4) && (f.id !== 'repeat' || localProgress > .25);
    const discarded = ['discard', 'repeat', 'invariant', 'transfer'].includes(f.id);
    const move = f.id === 'discard' ? beat(p, .15, .75) : f.id === 'repeat' ? beat(localProgress, .5, .9) : discarded ? 1 : 0;
    text(t(L(`Первая позиция со значением ≥ ${target}`, `First position with value ≥ ${target}`)), 450, 40, 23);
    text(`x = ${target}`, 450, 78, 23, C.gold);
    a.forEach((v, i) => {
      const enter = f.id === 'task' ? beat(p, i * .055, .35 + i * .055) : 1;
      const settled = f.id === 'invariant' || f.id === 'transfer';
      const outside = !settled && (i < step.lo || i >= step.hi);
      const rejected = !settled && discarded && (i < step.after.lo || i >= step.after.hi);
      const drop = rejected && !outside ? move * 45 : 0;
      const active = !settled && i === step.mid && compared;
      cell(f.id === 'transfer' && p > .15 + i * .07 ? (v >= target ? 'T' : 'F') : v, i, baseX + i * gap, 151 + (1 - enter) * 60 + drop, Math.min(70, gap - 8), settled ? (i < 4 ? C.blue : C.gold) : active ? C.gold : outside || rejected ? C.dim : C.blue, enter * (outside ? .23 : rejected ? 1 - .77 * move : 1));
    });
    const lo = step.lo + (discarded ? (step.after.lo - step.lo) * move : 0);
    const hi = step.hi + (discarded ? (step.after.hi - step.hi) * move : 0);
    const boundX = i => baseX - gap / 2 + i * gap;
    alpha(f.id === 'task' ? beat(p, .65, 1) : 1, () => {
      line(boundX(lo), 235, boundX(hi), 235, C.blue, 3);
      line(boundX(lo), 226, boundX(lo), 244, C.blue); line(boundX(hi), 226, boundX(hi), 244, C.gold);
      text(`lo=${Math.round(lo)}`, boundX(lo), 268, 16, C.blue); text(`hi=${Math.round(hi)}`, boundX(hi), 292, 16, C.gold);
    });
    if (compared) alpha(f.id === 'compare' ? beat(p, .4, .65) : 1, () => {
      text(`${step.value} < ${target}  →  ${t(step.less ? L('да', 'true') : L('нет', 'false'))}`, 450, 331, 25, C.gold);
    });
    if (result) alpha(f.id === 'repeat' ? beat(p, .94, 1) : 1, () => { text(`lo = hi = 4  →  ${t(L('ответ', 'answer'))} 4`, 450, 374, 24, C.green); });
    const codeTop = result ? 411 : 373;
    const activeLine = f.id === 'task' ? 0 : result ? 6 : f.id === 'compare' ? 3 : f.id === 'repeat' && localProgress < .25 ? 2 : f.id === 'repeat' && localProgress < .5 ? 3 : f.id === 'failure' ? 4 : step.less ? 4 : 5;
    codeLines.forEach((row, i) => { row.classList.toggle('active', i === activeLine); if (i === activeLine) row.setAttribute('aria-current', 'true'); else row.removeAttribute('aria-current'); });
    text(CODE[activeLine], 450, codeTop, 20, f.id === 'failure' ? C.red : C.blue);
    if (f.id === 'failure') { text('lo = mid + 1  →  lo = mid', 450, 414, 21, C.red); text(t(L('hi − lo : 1 → 1. Следующий шаг тот же.', 'hi − lo : 1 → 1. The next step is identical.')), 450, 453, 18, C.red); }
    else if (f.id === 'invariant') {
      alpha(beat(p, .1, .4), () => text('i < lo ⇒ a[i] < x', 235, 452, 19, C.blue));
      alpha(beat(p, .45, .8), () => text('i ≥ hi ⇒ a[i] ≥ x', 665, 452, 19, C.gold));
    } else if (f.id === 'repeat') text(`hi − lo: ${step.hi - step.lo} → ${step.after.hi - step.after.lo}`, 450, 453, 20, C.green);
    else if (f.id === 'transfer') text('F F F F | T T T T', 450, 455, 23, C.green);
    else if (width < 600) { text(t(L('Элементы: [lo, hi)', 'Elements: [lo, hi)')), 450, 437, 17, C.dim); text(t(L('Возможная граница: [lo, hi]', 'Possible boundary: [lo, hi]')), 450, 472, 17, C.dim); }
    else text(t(L('Элементы: [lo, hi)   ·   возможная граница: [lo, hi]', 'Elements: [lo, hi)   ·   possible boundary: [lo, hi]')), 450, 465, 16, C.dim);
    ctx.restore();
    const captions = {
      task: L('Массив упорядочен. Ищем первую подходящую позицию, а не произвольное совпадение. Если подходящих значений нет, ответ — n.', 'The array is sorted. We want the first suitable position, not an arbitrary match. If none qualifies, the answer is n.'),
      compare: L('Сначала вычисляем mid = 4, затем сравниваем a[4] = 8 с x = 8. Только после результата можно менять границы.', 'First compute mid = 4, then compare a[4] = 8 with x = 8. Bounds may change only after the comparison.'),
      discard: L('a[4] ≥ 8. Все значения справа тоже ≥ 8, значит первая подходящая позиция не правее 4. Делаем hi = 4. Граница 4 остаётся возможной.', 'a[4] ≥ 8. All values to its right are also ≥ 8, so the first suitable position is at most 4. Set hi = 4. Boundary 4 remains possible.'),
      repeat: L('Тот же довод повторяется. Когда a[mid] < x, исключаем всё до mid включительно: lo = mid + 1. Гипотеза: искомая граница всё время остаётся между lo и hi, а длина неизвестной области строго уменьшается. Что позволит доказать это?', 'Repeat the argument. When a[mid] < x, exclude everything through mid: lo = mid + 1. Hypothesis: the boundary stays between lo and hi, while the unknown interval strictly shrinks. What would prove this?'),
      invariant: L('Слева от lo всё < x; начиная с hi всё ≥ x. Неизвестные элементы — [lo, hi), возможный ответ — [lo, hi]. При lo = hi остаётся ровно одна граница.', 'Everything before lo is < x; everything from hi is ≥ x. Unknown elements occupy [lo, hi); the answer lies in [lo, hi]. When lo = hi, exactly one boundary remains.'),
      failure: L('Возьмём [1, 3], x = 3 и состояние lo = 0, hi = 1. Изменим только lo = mid + 1 на lo = mid. Инвариант сохраняется, но прогресса нет: корректности недостаточно без завершения.', 'Take [1, 3], x = 3, and state lo = 0, hi = 1. Change only lo = mid + 1 to lo = mid. The invariant survives but progress stops: correctness also requires termination.'),
      transfer: L('Теперь закройте готовый запуск. Найдите границу в новых данных, объясните ответ n и постройте собственный контрпример. Та же идея работает для любого монотонного предиката: false…false, true…true.', 'Now leave the worked example. Find boundaries in new data, explain answer n, and construct your own counterexample. The idea extends to any monotone predicate: false…false, true…true.'),
    };
    const label = t(captions[f.id]); if (caption.textContent !== label) caption.textContent = label;
    semantic.textContent = `${t(CHAPTERS[f.index])}. ${f.id === 'task' ? `a = [${a.join(', ')}], x = ${target}` : `lo=${Math.round(lo)}, hi=${Math.round(hi)}${compared ? `; ${t(L('последнее сравнение', 'last comparison'))}: a[${step.mid}]=${step.value}` : ''}`}`;
    prediction.hidden = f.id !== 'compare' || f.progress < .65;
    chapters.value = f.index; timeline.value = seconds;
  }
  function resize() { const r = canvas.getBoundingClientRect(); width = Math.max(280, r.width); height = width * 490 / 900; const dpr = Math.min(2, devicePixelRatio || 1); canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); draw(); }
  function setTime(value) { seconds = Math.max(0, Math.min(DURATION, value)); draw(); }
  function pause() { running = false; last = null; cancelAnimationFrame(raf); playButton.textContent = t(L('▶ Продолжить', '▶ Continue')); }
  function seekChapter(i) { pause(); setTime(chapterStart(i) + (reduced.matches ? CHAPTERS[i].seconds - .01 : 0)); }
  function tick(now) {
    if (!running || disposed) return;
    let nextTime = seconds + (last == null ? 0 : Math.min(.1, (now - last) / 1000)); last = now;
    const gate = chapterStart(1) + CHAPTERS[1].seconds * .68;
    if (!answered && seconds < gate && nextTime >= gate) { setTime(gate); pause(); return; }
    setTime(nextTime); if (seconds >= DURATION) { pause(); return; } raf = requestAnimationFrame(tick);
  }
  function play() {
    if (disposed) return;
    if (!answered && frameAt(seconds).id === 'compare' && frameAt(seconds).progress >= .65) return;
    if (reduced.matches) { const i = frameAt(seconds).index; seekChapter(i === CHAPTERS.length - 1 ? 0 : i + 1); return; }
    if (seconds >= DURATION) seconds = 0;
    running = true; last = null; playButton.textContent = t(L('Ⅱ Пауза', 'Ⅱ Pause')); raf = requestAnimationFrame(tick);
  }
  function openMicroscope() {
    if (dialog) return;
    const resume = running; pause();
    dialog = el('dialog', 'algorithm-microscope'); const d = dialog;
    const title = el('h2', '', L('Один шаг под микроскопом', 'One step under the microscope')); title.id = 'algorithm-microscope-title'; d.setAttribute('aria-labelledby', title.id);
    const intro = el('p', '', L('Снимок перед сравнением зафиксирован. Меняйте одну строку и наблюдайте результат этого же шага. Это ограниченная модель алгоритма, не редактор JavaScript.', 'The snapshot before comparison is fixed. Change one line and observe that same step. This is a restricted algorithm model, not a JavaScript editor.'));
    const sample = el('select'); sample.setAttribute('aria-label', t(L('Снимок состояния', 'State snapshot')));
    const samples = [{ a: DEMO, x: X, state: { lo: 0, hi: 8 } }, { a: [1, 3], x: 3, state: { lo: 0, hi: 1 } }, { a: [1, 3, 3, 5], x: 3, state: { lo: 0, hi: 4 } }];
    [L('Первый шаг истории', 'First story step'), L('Интервал длины один', 'Interval of length one'), L('Повторяющиеся значения', 'Repeated values')].forEach((v, i) => { const o = el('option', '', v); o.value = i; sample.append(o); });
    sample.value = frameAt(seconds).id === 'failure' ? '1' : '0';
    const variant = el('select'); variant.setAttribute('aria-label', t(L('Изменить одну строку', 'Change one line')));
    [['correct', 'lo = mid + 1; hi = mid'], ['stall', 'lo = mid  (instead of mid + 1)'], ['skip', 'hi = mid − 1'], ['upper', 'a[mid] ≤ x']].forEach(([value, label]) => { const o = el('option', '', value === 'stall' ? L('lo = mid (вместо mid + 1)', 'lo = mid (instead of mid + 1)') : label); o.value = value; variant.append(o); });
    const before = el('pre', 'algorithm-code'), after = el('pre', 'algorithm-code'), verdict = el('p', 'algorithm-feedback'); verdict.setAttribute('role', 'status');
    function inspect() {
      const s = samples[+sample.value], step = transition(s.a, s.x, s.state, variant.value);
      before.textContent = `a = [${s.a.join(', ')}]; x = ${s.x}\nlo = ${step.lo}; hi = ${step.hi}; mid = ${step.mid}\n${step.value} ${variant.value === 'upper' ? '≤' : '<'} ${s.x} → ${step.less}`;
      after.textContent = `lo: ${step.lo} → ${step.after.lo}\nhi: ${step.hi} → ${step.after.hi}\nhi − lo: ${step.hi - step.lo} → ${step.after.hi - step.after.lo}\n${t(L('Истинная граница', 'True boundary'))}: ${step.answer}`;
      verdict.dataset.valid = String(step.valid && step.decreased);
      verdict.textContent = t(!step.valid ? L('Нарушен инвариант: исключён возможный ответ или неверно объявлены подходящие значения. Сравните истинную границу и новые границы.', 'Invariant broken: a possible answer was removed, or unsuitable values were declared suitable. Compare the true boundary with the new bounds.') : !step.decreased ? L('Инвариант сохранён, но длина не уменьшилась. Следующий шаг будет таким же: поиск застрял.', 'The invariant survives, but the length did not shrink. The next step is identical: the search stalls.') : variant.value === 'correct' ? L('Инвариант сохранён, неизвестная область уменьшилась. Шаг обоснован.', 'The invariant survives and the unknown interval shrinks. The step is justified.') : L('На этом снимке изменение не ломает шаг. Один успешный пример не доказывает корректность: смените снимок и проверьте дубликаты или интервал длины один.', 'This change does not break this snapshot. One successful example is not a proof: try duplicates or the interval of length one.'));
    }
    sample.addEventListener('change', inspect); variant.addEventListener('change', inspect);
    const close = button(L('Вернуться к истории', 'Return to the story'), () => d.close());
    d.append(title, intro, sample, variant, before, after, verdict, close); root.append(d); inspect();
    d.addEventListener('close', () => { d.remove(); dialog = null; microscope.focus(); if (resume && !disposed) play(); }, { once: true }); d.showModal();
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  const visibility = () => { if (document.hidden) pause(); }; document.addEventListener('visibilitychange', visibility);
  draw();
  return { dispose() { disposed = true; pause(); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); if (dialog) { dialog.close(); dialog.remove(); } root.remove(); } };
}
