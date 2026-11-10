// Sandbox: any function → graph, derivative, tangent, secant, area, roots/extrema, limit table.
// Explore scenarios are the sandbox with a preset function, layers and a short explanation.

const LAYERS = [
  ['deriv', 'f′ graph', 'график f′'],
  ['tangent', 'tangent at a', 'касательная в a'],
  ['secant', 'secant a → a+h', 'секущая a → a+h'],
  ['area', 'area a → b', 'площадь a → b'],
  ['points', 'roots & extrema', 'корни и экстремумы'],
  ['limit', 'limit at a', 'предел в a'],
];

const PRESETS = ['x^3 - 3x', 'sin(x)/x', 'e^x', 'ln(x)', '1/x', 'tan(x)', 'x sin(1/x)', 'e^(-x^2)', 'sqrt(x)', 'x^2 - 2x - 3'];

const SCENARIOS = [
  {
    id: 'secant', f: 'x^2', a: 1, h: 1, show: 'secant,tangent', cx: 1, cy: 2, unit: 70,
    title: { en: 'Derivative = limit of secants', ru: 'Производная = предел секущих' },
    text: bi(
      'The red secant goes through $(a, f(a))$ and $(a+h, f(a+h))$; its slope is $\\frac{f(a+h) - f(a)}{h}$. Move $h$ toward $0$: the secant turns into the green tangent, and its slope becomes $f\'(a)$. This limit <b>is</b> the definition of the derivative. Then try another function, e.g. <code>sin(x)</code>.',
      'Красная секущая проходит через $(a, f(a))$ и $(a+h, f(a+h))$; её наклон $\\frac{f(a+h) - f(a)}{h}$. Двигайте $h$ к $0$: секущая превращается в зелёную касательную, а наклон — в $f\'(a)$. Этот предел <b>и есть</b> определение производной. Потом попробуйте другую функцию, например <code>sin(x)</code>.'),
  },
  {
    id: 'extrema', f: 'x^3 - 3x', a: -1.6, show: 'deriv,tangent,points', cx: 0, cy: 0, unit: 60,
    title: { en: 'Where the tangent is flat', ru: 'Где касательная горизонтальна' },
    text: bi(
      'Drag point $a$ along the curve. At a peak or a valley the tangent is horizontal, so $f\'(a) = 0$: the orange graph of $f\'$ crosses the x-axis exactly under the extrema (purple dots). Where $f\' > 0$ the function grows, where $f\' < 0$ it falls.',
      'Тяните точку $a$ вдоль кривой. На вершине или во впадине касательная горизонтальна, значит $f\'(a) = 0$: оранжевый график $f\'$ пересекает ось x точно под экстремумами (фиолетовые точки). Где $f\' > 0$, функция растёт, где $f\' < 0$ — убывает.'),
  },
  {
    id: 'exp', f: 'e^x', a: 0.5, show: 'deriv,tangent', cx: 0, cy: 2, unit: 60,
    title: { en: 'Why the number e is special', ru: 'Чем особенно число e' },
    text: bi(
      'For $e^x$ the orange graph of the derivative lies exactly on top of the blue one: $(e^x)\' = e^x$. Now type <code>2^x</code>: the derivative is a squashed copy ($\\approx 0.69 \\cdot 2^x$); for <code>3^x</code> it is stretched ($\\approx 1.10 \\cdot 3^x$). $e \\approx 2.718$ is exactly the base where the copy coincides.',
      'У $e^x$ оранжевый график производной лежит точно на синем: $(e^x)\' = e^x$. Введите <code>2^x</code>: производная — сжатая копия ($\\approx 0.69 \\cdot 2^x$); у <code>3^x</code> — растянутая ($\\approx 1.10 \\cdot 3^x$). $e \\approx 2.718$ — ровно то основание, при котором копия совпадает.'),
  },
  {
    id: 'sinx', f: 'sin(x)/x', a: 0, show: 'limit', cx: 0, cy: 0.5, unit: 60,
    title: { en: 'sin(x)/x near zero', ru: 'sin(x)/x около нуля' },
    text: bi(
      'At $x = 0$ the formula gives $\\frac{0}{0}$: the function is not defined there. Yet the graph shows no hole, and the table shows values approaching $1$ from both sides. That is the limit: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$. Zoom in near $0$: the curve keeps looking smooth.',
      'В точке $x = 0$ формула даёт $\\frac{0}{0}$: функция там не определена. Но на графике нет видимой дыры, а таблица показывает, что значения с обеих сторон приближаются к $1$. Это и есть предел: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$. Приблизьте окрестность $0$: кривая остаётся гладкой.'),
  },
  {
    id: 'squeeze', f: 'x sin(1/x)', a: 0, show: 'limit', cx: 0, cy: 0, unit: 150,
    title: { en: 'Infinite wiggles, still a limit', ru: 'Бесконечные колебания, но предел есть' },
    text: bi(
      'Near $0$ the function oscillates infinitely many times, but it is squeezed between $y = x$ and $y = -x$, so its limit at $0$ is $0$. Compare with <code>sin(1/x)</code>: nothing squeezes it, and the limit does not exist.',
      'Около $0$ функция колеблется бесконечно много раз, но зажата между $y = x$ и $y = -x$, поэтому её предел в $0$ равен $0$. Сравните с <code>sin(1/x)</code>: её ничто не зажимает, и предела нет.'),
  },
  {
    id: 'area', f: '1/x', a: 1, b: 2, show: 'area', cx: 2, cy: 1, unit: 80,
    title: { en: 'Area under 1/x and the number e', ru: 'Площадь под 1/x и число e' },
    text: bi(
      'The shaded area from $1$ to $b$ equals $\\ln b$. With $b = 2$ it is $\\approx 0.693 = \\ln 2$. Find $b$ where the area is exactly $1$: that is $b = e \\approx 2.718$.',
      'Закрашенная площадь от $1$ до $b$ равна $\\ln b$. При $b = 2$ это $\\approx 0.693 = \\ln 2$. Найдите $b$, при котором площадь ровно $1$: это $b = e \\approx 2.718$.'),
  },
  {
    id: 'chain', f: 'sin(x^2)', a: 1, show: 'deriv', cx: 0, cy: 0, unit: 50,
    title: { en: 'Chain rule in motion', ru: 'Производная сложной функции в движении' },
    text: bi(
      '$\\sin(x^2)$ oscillates faster and faster as $x$ grows. Its derivative $2x\\cos(x^2)$ is the outer derivative times the inner one ($2x$), so its swings grow: the faster the inside changes, the steeper the whole function.',
      '$\\sin(x^2)$ колеблется всё быстрее с ростом $x$. Её производная $2x\\cos(x^2)$ — производная внешней функции, умноженная на производную внутренней ($2x$), поэтому размах растёт: чем быстрее меняется «начинка», тем круче вся функция.'),
  },
  {
    id: 'parabola', f: 'x^2 - 2x - 3', a: 1, show: 'points,tangent', cx: 1, cy: -1, unit: 40,
    title: { en: 'Parabola: roots and vertex', ru: 'Парабола: корни и вершина' },
    text: bi(
      'Red dots are the roots, the purple dot is the vertex: the point where the tangent is horizontal, i.e. $f\'(x) = 2ax + b = 0$, so $x = -\\frac{b}{2a}$. Type your own $ax^2 + bx + c$: the discriminant $D = b^2 - 4ac$ decides whether there are 2, 1 or 0 roots.',
      'Красные точки — корни, фиолетовая — вершина: там касательная горизонтальна, то есть $f\'(x) = 2ax + b = 0$, откуда $x = -\\frac{b}{2a}$. Введите свою $ax^2 + bx + c$: дискриминант $D = b^2 - 4ac$ решает, будет 2, 1 или 0 корней.'),
  },
];

// Short number for the readout: 6 significant digits, float noise hidden
const fmt = v => (!isFinite(v) ? 'undefined' : Math.abs(v) < 1e-10 ? '0' : String(Number(v.toPrecision(6))));
const lineEq = (k, c) => `${fmt(k)}x ${c < 0 ? '−' : '+'} ${fmt(Math.abs(c))}`;

function texInto(el, s) {
  try {
    katex.render(s, el, { throwOnError: false });
  } catch (e) {
    el.textContent = s; // KaTeX did not load (offline): show the raw formula
  }
}

function showSandbox(opts, scenario) {
  const num = (v, d) => (v === undefined || v === '' || isNaN(+v) ? d : +v);
  let a = num(opts.a, 1), b = num(opts.b, 2), h = num(opts.h, 1);
  const show = new Set(String(opts.show ?? 'tangent').split(',').filter(Boolean));
  const view0 = { cx: num(opts.cx, 0), cy: num(opts.cy, 0), unit: num(opts.unit, 50) };
  let view = { ...view0 };
  let f = null, df = null, plot = null;

  app.innerHTML = `
    <a class="back" href="#">← Home <span class="ru">· На главную</span></a>
    ${scenario
      ? `<h2>${scenario.title.en}</h2><div class="ru" style="margin-top:-6px">${scenario.title.ru}</div><div class="scenario">${scenario.text}</div>`
      : '<h2>Sandbox <span class="ru">· Песочница</span></h2>'}
    <div class="widget sandbox">
      <label class="fx">f(x) = <input id="fx" spellcheck="false" autocomplete="off" autocapitalize="off"></label>
      <div class="error" id="err"></div>
      <div class="presets">${PRESETS.map(p => `<button data-f="${p}">${p}</button>`).join('')}</div>
      <div class="formulas"><div id="ftex"></div><div id="dtex"></div></div>
      <canvas class="plot tall"></canvas>
      <div class="toolbar">
        <button data-zoom="out" title="Zoom out">−</button>
        <button data-zoom="in" title="Zoom in">+</button>
        <button data-zoom="reset">Reset view</button>
      </div>
      <div class="layers">${LAYERS.map(([id, en, ru]) => `<label><input type="checkbox" data-layer="${id}"${show.has(id) ? ' checked' : ''}> ${en} <span class="ru">· ${ru}</span></label>`).join('')}</div>
      <div class="controls">
        <label>a <input type="number" id="a" step="0.1"></label>
        <label class="b-ctl">b <input type="number" id="b" step="0.1"></label>
        <label class="h-ctl">h <input type="range" id="h" min="0.001" max="2" step="0.001"><span id="hv"></span></label>
      </div>
      <div class="readout" id="ro"></div>
    </div>
    <div class="tip">${bi('Drag the graph to move it; scroll or use −/+ to zoom. Click to put point $a$ there, or drag the point itself.',
                         'Перетаскивайте график; масштаб — колесом или кнопками −/+. Клик ставит точку $a$, саму точку можно тянуть.')}</div>`;

  const $ = s => app.querySelector(s);
  const canvas = $('canvas'), fx = $('#fx'), err = $('#err'), ro = $('#ro');
  const aIn = $('#a'), bIn = $('#b'), hIn = $('#h');

  function syncControls() {
    $('.b-ctl').style.display = show.has('area') ? '' : 'none';
    $('.h-ctl').style.display = show.has('secant') ? '' : 'none';
    if (document.activeElement !== aIn) aIn.value = clean(a);
    if (document.activeElement !== bIn) bIn.value = clean(b);
    hIn.value = h;
    $('#hv').textContent = fmt(h);
  }

  function setFunction(text) {
    let node;
    try {
      node = parseExpr(text);
    } catch (e) {
      err.textContent = e.message; // keep the last good function on screen
      return;
    }
    err.textContent = '';
    f = fnOf(node);
    const dnode = derivativeOf(node);
    // No formula for f′ (rare functions): fall back to a numeric slope
    df = dnode ? fnOf(dnode) : x => (f(x + 1e-5) - f(x - 1e-5)) / 2e-5;
    texInto($('#ftex'), `f(x) = ${texOf(node)}`);
    if (dnode) texInto($('#dtex'), `f'(x) = ${texOf(dnode)}`);
    else $('#dtex').textContent = 'f′(x): no formula, computed numerically';
    draw();
  }

  function draw() {
    if (!f) return;
    const yspan = canvas.clientHeight / view.unit;
    const p = plot = makePlot(canvas, view.cx, [view.cy - yspan / 2, view.cy + yspan / 2]);
    const fa = f(a), da = df(a);
    const lines = [`a = ${fmt(a)}    f(a) = ${fmt(fa)}    f′(a) = ${fmt(da)}`];

    p.axes();
    if (show.has('area')) p.area(f, a, b, 'rgba(43, 108, 176, 0.18)');
    p.curve(f, '#2b6cb0');
    if (show.has('deriv')) p.curve(df, '#dd6b20', 2);
    if (!isFinite(fa)) p.vline(a, '#999');

    if (show.has('tangent') && isFinite(fa) && isFinite(da)) {
      p.line(a, fa, a + 1, fa + da, '#2f855a', 2);
      lines.push(`tangent: y = ${lineEq(da, fa - da * a)}`);
    }
    if (show.has('secant')) {
      const fh = f(a + h);
      if (isFinite(fa) && isFinite(fh)) {
        p.line(a, fa, a + h, fh, '#e53e3e', 2);
        p.dot(a + h, fh, '#e53e3e');
        lines.push(`secant slope (f(a+h) − f(a)) / h = ${fmt((fh - fa) / h)}    exact f′(a) = ${fmt(da)}`);
      }
    }
    if (show.has('area')) {
      const v = integrate(f, a, b);
      lines.push(`∫ f dx from ${fmt(a)} to ${fmt(b)} ${isFinite(v) ? '≈ ' + fmt(v) : ': undefined (f is not finite on [a, b])'}`);
    }
    if (show.has('points')) {
      const roots = findRoots(f, p.xr[0], p.xr[1]);
      const eps = (p.xr[1] - p.xr[0]) / 1000;
      const ext = findRoots(df, p.xr[0], p.xr[1]).filter(x => isFinite(f(x))).map(x => {
        const l = df(x - eps), r = df(x + eps);
        return { x, kind: l > 0 && r < 0 ? 'max' : l < 0 && r > 0 ? 'min' : 'flat' };
      });
      roots.forEach(r => p.dot(r, 0, '#e53e3e', 4));
      ext.forEach(e => p.dot(e.x, f(e.x), '#805ad5', 5));
      lines.push(`roots in view: ${roots.slice(0, 8).map(fmt).join(', ') || 'none'}`);
      lines.push(`f′ = 0 at: ${ext.slice(0, 8).map(e => `${e.kind} x = ${fmt(e.x)}, f = ${fmt(f(e.x))}`).join('; ') || 'none'}`);
    }
    if (show.has('limit')) {
      const ds = [0.1, 0.01, 0.001, 0.0001];
      const left = ds.map(d => f(a - d)), right = ds.map(d => f(a + d));
      ds.forEach((d, i) => { p.dot(a - d, left[i], '#805ad5', 3); p.dot(a + d, right[i], '#805ad5', 3); });
      lines.push(`x → a from the left (a − 0.1 … a − 0.0001):  ${left.map(fmt).join(', ')}`);
      lines.push(`x → a from the right (a + 0.1 … a + 0.0001): ${right.map(fmt).join(', ')}`);
      const L = left[3], R = right[3];
      if (isFinite(L) && isFinite(R) && Math.abs(L - R) < 1e-3 * Math.max(1, Math.abs(L))) lines.push(`limit ≈ ${fmt((L + R) / 2)}`);
      else if (Math.abs(L) > 1e3 || Math.abs(R) > 1e3) lines.push('values blow up near a: vertical asymptote, no finite limit');
      else lines.push('left and right values differ: the limit does not exist (or zoom in to look closer)');
    }

    p.dot(a, fa, '#1a202c');
    ro.innerHTML = lines.join('<br>');
    syncControls();
  }

  // ---- Interaction: drag to pan, drag point a, click to place a, wheel/buttons to zoom ----
  let drag = null;
  const pos = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

  canvas.addEventListener('pointerdown', e => {
    if (!plot) return;
    const [px, py] = pos(e);
    canvas.setPointerCapture(e.pointerId);
    drag = { px, py, cx: view.cx, cy: view.cy, moved: false, mode: Math.abs(px - plot.sx(a)) < 14 ? 'point' : 'pan' };
  });
  canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    const [px, py] = pos(e);
    if (Math.abs(px - drag.px) + Math.abs(py - drag.py) > 3) drag.moved = true;
    if (!drag.moved) return;
    if (drag.mode === 'point') a = clean(Math.round(plot.toX(px) * 1000) / 1000);
    else { view.cx = drag.cx - (px - drag.px) / view.unit; view.cy = drag.cy + (py - drag.py) / view.unit; }
    draw();
  });
  canvas.addEventListener('pointerup', e => {
    if (drag && !drag.moved) { a = clean(Math.round(plot.toX(pos(e)[0]) * 100) / 100); draw(); }
    drag = null;
  });

  function zoom(factor, px, py) {
    const x0 = plot.toX(px), y0 = plot.toY(py); // keep this point under the cursor
    view.unit = Math.min(5000, Math.max(2, view.unit * factor));
    view.cx = x0 - (px - canvas.clientWidth / 2) / view.unit;
    view.cy = y0 + (py - canvas.clientHeight / 2) / view.unit;
    draw();
  }
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const [px, py] = pos(e);
    zoom(e.deltaY < 0 ? 1.2 : 1 / 1.2, px, py);
  }, { passive: false });
  app.querySelectorAll('[data-zoom]').forEach(btn => btn.addEventListener('click', () => {
    const z = btn.dataset.zoom;
    if (z === 'reset') { view = { ...view0 }; draw(); }
    else zoom(z === 'in' ? 1.5 : 1 / 1.5, canvas.clientWidth / 2, canvas.clientHeight / 2);
  }));

  // ---- Controls ----
  fx.addEventListener('input', () => setFunction(fx.value));
  app.querySelectorAll('.presets button').forEach(btn => btn.addEventListener('click', () => {
    fx.value = btn.dataset.f;
    setFunction(fx.value);
  }));
  app.querySelectorAll('[data-layer]').forEach(cb => cb.addEventListener('change', () => {
    cb.checked ? show.add(cb.dataset.layer) : show.delete(cb.dataset.layer);
    draw();
  }));
  aIn.addEventListener('input', () => { if (aIn.value !== '' && isFinite(+aIn.value)) { a = +aIn.value; draw(); } });
  bIn.addEventListener('input', () => { if (bIn.value !== '' && isFinite(+bIn.value)) { b = +bIn.value; draw(); } });
  hIn.addEventListener('input', () => { h = +hIn.value; draw(); });

  renderMath(app);
  redraw = draw;
  fx.value = opts.f || 'x^3 - 3x';
  setFunction(fx.value);
}
