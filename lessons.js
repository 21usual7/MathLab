// Bilingual text block: English always visible, Russian can be hidden with the toggle
function bi(en, ru) {
  return `<div class="en">${en}</div><div class="ru">${ru}</div>`;
}

// Quiz option: { en, ru }. If ru is omitted (numbers), the same label is used for both.
function opt(en, ru = en) {
  return { en, ru };
}

const LESSONS = [
  {
    id: 'derivative',
    title: { en: 'Derivative = slope of the tangent', ru: 'Производная = наклон касательной' },
    intro: bi(
      'Zoom in on any curve far enough and it looks like a straight line. Its slope is the derivative. Move the sliders: the red secant line through two points turns into the tangent as the gap h shrinks to 0.',
      'Приблизьте любую кривую достаточно сильно — и она станет похожа на прямую. Её наклон и есть производная. Двигайте ползунки: красная секущая через две точки превращается в касательную, когда расстояние h стремится к 0.'
    ),

    render(root) {
      root.innerHTML = `
        <div class="widget">
          <canvas class="plot"></canvas>
          <div class="controls">
            <label>x₀ <input type="range" id="x0" min="-2" max="2" step="0.01" value="1"><span id="x0v"></span></label>
            <label>h  <input type="range" id="h" min="0.01" max="1" step="0.01" value="1"><span id="hv"></span></label>
          </div>
          <div class="readout" id="ro"></div>
        </div>`;

      const canvas = root.querySelector('canvas');
      const x0Input = root.querySelector('#x0');
      const hInput = root.querySelector('#h');
      const f = x => x * x;

      function draw() {
        const x0 = parseFloat(x0Input.value);
        const h = parseFloat(hInput.value);
        root.querySelector('#x0v').textContent = x0.toFixed(2);
        root.querySelector('#hv').textContent = h.toFixed(2);

        const p = makePlot(canvas, [-3, 3], [-1, 9]);
        p.axes();
        p.curve(f, '#2b6cb0');

        const secantSlope = (f(x0 + h) - f(x0)) / h;
        const exactSlope = 2 * x0;

        // Secant through (x0, f(x0)) and (x0+h, f(x0+h))
        p.line(x0, f(x0), x0 + h, f(x0 + h), '#e53e3e', 2);
        p.dot(x0, f(x0), '#e53e3e');
        p.dot(x0 + h, f(x0 + h), '#e53e3e');

        // Exact tangent at x0 (dashed green)
        p.line(x0, f(x0), x0 + 1, f(x0) + exactSlope, '#2f855a', 2, [6, 4]);
        p.dot(x0, f(x0), '#2f855a');

        root.querySelector('#ro').innerHTML =
          `secant slope = (f(x₀+h) − f(x₀)) / h = ${secantSlope.toFixed(3)}<br>` +
          `exact f′(x₀) = 2·x₀ = ${exactSlope.toFixed(3)}<br>` +
          `difference = ${Math.abs(secantSlope - exactSlope).toFixed(3)} (equals h for f = x²)`;
      }

      root.querySelectorAll('input').forEach(i => i.addEventListener('input', draw));
      draw();
    },

    quiz: [
      {
        q: bi('Predict: what is the slope of f(x) = x² at x = 0?', 'Предскажите: каков наклон f(x) = x² в точке x = 0?'),
        options: [opt('0'), opt('1'), opt('2')],
        answer: 0,
        hint: bi('Use f′(x) = 2x. Picture the bottom of the parabola.', 'Используйте f′(x) = 2x. Представьте дно параболы.'),
        explain: bi('Yes: the tangent at the vertex of the parabola is flat, so the slope is 0.', 'Да: касательная в вершине параболы горизонтальна, наклон равен 0.'),
      },
      {
        q: bi('What is the slope of f(x) = x² at x = 1.5?', 'Каков наклон f(x) = x² в точке x = 1.5?'),
        options: [opt('1.5'), opt('2'), opt('3')],
        answer: 2,
        hint: bi('Derivative rule for x²: f′(x) = 2x. Plug in x = 1.5.', 'Правило для x²: f′(x) = 2x. Подставьте x = 1.5.'),
        explain: bi('2 · 1.5 = 3.', '2 · 1.5 = 3.'),
      },
      {
        q: bi('What happens to the secant line as h → 0?', 'Что происходит с секущей при h → 0?'),
        options: [
          opt('It becomes the tangent', 'Становится касательной'),
          opt('It becomes vertical', 'Становится вертикальной'),
          opt('It disappears', 'Исчезает'),
        ],
        answer: 0,
        hint: bi('Two points on the curve get closer and closer.', 'Две точки на кривой всё ближе друг к другу.'),
        explain: bi('The limit of secant slopes is the derivative, i.e. the tangent slope.', 'Предел наклонов секущих — это производная, то есть наклон касательной.'),
      },
    ],
  },

  {
    id: 'quadratic',
    title: { en: 'Quadratics: roots, vertex, discriminant', ru: 'Квадратичная функция: корни, вершина, дискриминант' },
    intro: bi(
      'Plot y = ax² + bx + c. Change a, b and c and watch the parabola. The discriminant D = b² − 4ac tells you how many times it crosses the x-axis.',
      'Постройте y = ax² + bx + c. Меняйте a, b и c и смотрите на параболу. Дискриминант D = b² − 4ac показывает, сколько раз парабола пересекает ось x.'
    ),

    render(root) {
      root.innerHTML = `
        <div class="widget">
          <canvas class="plot"></canvas>
          <div class="controls">
            <label>a <input type="range" id="a" min="-2" max="2" step="0.1" value="1"><span id="av"></span></label>
            <label>b <input type="range" id="b" min="-6" max="6" step="0.1" value="-2"><span id="bv"></span></label>
            <label>c <input type="range" id="c" min="-6" max="6" step="0.1" value="-3"><span id="cv"></span></label>
          </div>
          <div class="readout" id="ro"></div>
        </div>`;

      const canvas = root.querySelector('canvas');
      const inputs = { a: root.querySelector('#a'), b: root.querySelector('#b'), c: root.querySelector('#c') };

      function draw() {
        const a = parseFloat(inputs.a.value);
        const b = parseFloat(inputs.b.value);
        const c = parseFloat(inputs.c.value);
        ['a', 'b', 'c'].forEach(k => root.querySelector(`#${k}v`).textContent = parseFloat(inputs[k].value).toFixed(1));

        const f = x => a * x * x + b * x + c;
        const p = makePlot(canvas, [-6, 6], [-10, 10]);
        p.axes();
        p.curve(f, '#2b6cb0');

        const ro = root.querySelector('#ro');
        if (a === 0) {
          ro.textContent = 'a = 0: this is a line, not a parabola.';
          return;
        }

        const vx = -b / (2 * a);
        const vy = f(vx);
        p.dot(vx, vy, '#805ad5');

        const D = b * b - 4 * a * c;
        let text = `D = b² − 4ac = ${D.toFixed(2)}<br>`;
        text += `vertex x = −b/(2a) = ${vx.toFixed(2)}, y = ${vy.toFixed(2)}<br>`;
        // Sliders give decimal values: treat a tiny D as exactly zero
        if (Math.abs(D) < 1e-9) {
          p.dot(vx, 0, '#e53e3e');
          text += 'D = 0 → one double root (touches the x-axis)';
        } else if (D > 0) {
          const r1 = (-b - Math.sqrt(D)) / (2 * a);
          const r2 = (-b + Math.sqrt(D)) / (2 * a);
          p.dot(r1, 0, '#e53e3e');
          p.dot(r2, 0, '#e53e3e');
          text += `D > 0 → two roots: x₁ = ${r1.toFixed(2)}, x₂ = ${r2.toFixed(2)}`;
        } else {
          text += 'D < 0 → no real roots (never touches the x-axis)';
        }
        ro.innerHTML = text;
      }

      Object.values(inputs).forEach(i => i.addEventListener('input', draw));
      draw();
    },

    quiz: [
      {
        q: bi('If a > 0, which way does the parabola open?', 'Если a > 0, куда открыты ветви параболы?'),
        options: [opt('Up', 'Вверх'), opt('Down', 'Вниз')],
        answer: 0,
        hint: bi('Look at the x² term: its sign decides the direction.', 'Посмотрите на знак при x².'),
        explain: bi('Positive x² coefficient → the arms go up.', 'Положительный коэффициент при x² → ветви вверх.'),
      },
      {
        q: bi('If D < 0, the graph…', 'Если D < 0, график…'),
        options: [
          opt('crosses the x-axis twice', 'пересекает ось x дважды'),
          opt('touches the x-axis once', 'касается оси x один раз'),
          opt('never touches the x-axis', 'никогда не касается оси x'),
        ],
        answer: 2,
        hint: bi('A negative discriminant means √D has no real value.', 'Отрицательный дискриминант: из D нельзя извлечь вещественный корень.'),
        explain: bi('No real roots, so the parabola stays entirely above or below the x-axis.', 'Вещественных корней нет, парабола целиком выше или ниже оси x.'),
      },
      {
        q: bi('What is the x-coordinate of the vertex of x² − 4x + 1?', 'Чему равна координата x вершины x² − 4x + 1?'),
        options: [opt('2'), opt('−2'), opt('4')],
        answer: 0,
        hint: bi('Use x = −b / (2a) with a = 1, b = −4.', 'Используйте x = −b / (2a), где a = 1, b = −4.'),
        explain: bi('x = −(−4) / 2 = 2.', 'x = −(−4) / 2 = 2.'),
      },
    ],
  },
];
