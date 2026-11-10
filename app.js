const app = document.getElementById('app');
const showRu = document.getElementById('showRu');
let redraw = null; // draw() of the open sandbox, called again on resize

showRu.addEventListener('change', () => {
  document.body.classList.toggle('hide-ru', !showRu.checked);
});

// The canvas size depends on the window: redraw after resize or phone rotation
window.addEventListener('resize', () => {
  if (redraw) redraw();
});

// Bilingual text block: English always visible, Russian can be hidden with the toggle.
// Math goes between $...$ and is rendered by KaTeX.
function bi(en, ru) {
  return `<div class="en">${en}</div><div class="ru">${ru}</div>`;
}

// KaTeX: $...$ inline, $$...$$ display
function renderMath(el) {
  if (window.renderMathInElement) {
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
    });
  }
}

// Progress lives only in this browser. Storage can be unavailable (private mode), so never fail.
const STORAGE_KEY = 'mathlab-v2';

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

// Canvas helper: maps math coordinates to pixels.
// xr as a number = center of the x-axis: the x-range is chosen from the canvas size
// so that one unit has the same length on both axes (slopes look true).
function makePlot(canvas, xr, yr) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  if (typeof xr === 'number') {
    const span = (yr[1] - yr[0]) * w / h;
    xr = [xr - span / 2, xr + span / 2];
  }

  const sx = x => (x - xr[0]) / (xr[1] - xr[0]) * w;
  const sy = y => h - (y - yr[0]) / (yr[1] - yr[0]) * h;
  const toX = px => xr[0] + px / w * (xr[1] - xr[0]);
  const toY = py => yr[0] + (h - py) / h * (yr[1] - yr[0]);
  // Far-away points are pulled to just outside the canvas (huge coordinates break drawing)
  const clampPy = py => Math.max(-h, Math.min(2 * h, py));

  // Grid step 1, 2 or 5 × 10^k, about 45 px apart at any zoom
  const raw = 45 * (xr[1] - xr[0]) / w;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map(m => m * pow).find(s => s >= raw);
  const label = v => String(Number(v.toPrecision(6)));

  return {
    xr, yr, sx, sy, toX, toY,
    axes() {
      ctx.strokeStyle = '#eee';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = Math.ceil(xr[0] / step) * step; x <= xr[1]; x += step) { ctx.moveTo(sx(x), 0); ctx.lineTo(sx(x), h); }
      for (let y = Math.ceil(yr[0] / step) * step; y <= yr[1]; y += step) { ctx.moveTo(0, sy(y)); ctx.lineTo(w, sy(y)); }
      ctx.stroke();

      ctx.strokeStyle = '#bbb';
      ctx.beginPath();
      if (xr[0] <= 0 && 0 <= xr[1]) { ctx.moveTo(sx(0), 0); ctx.lineTo(sx(0), h); }
      if (yr[0] <= 0 && 0 <= yr[1]) { ctx.moveTo(0, sy(0)); ctx.lineTo(w, sy(0)); }
      ctx.stroke();

      // Numbers along the axes (stuck to the edge when an axis is off-screen)
      ctx.fillStyle = '#999';
      ctx.font = '11px system-ui, sans-serif';
      const ly = Math.max(12, Math.min(h - 4, sy(0) + 13));
      const lx = Math.max(3, Math.min(w - 34, sx(0) + 4));
      for (let x = Math.ceil(xr[0] / step) * step; x <= xr[1]; x += step) {
        if (Math.abs(x) > step / 2) ctx.fillText(label(x), sx(x) + 3, ly);
      }
      for (let y = Math.ceil(yr[0] / step) * step; y <= yr[1]; y += step) {
        if (Math.abs(y) > step / 2) ctx.fillText(label(y), lx, sy(y) - 3);
      }
    },
    curve(fn, color, width = 2.5) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      let prev = null;
      for (let px = 0; px <= w; px += 1) {
        const y = fn(toX(px));
        if (!isFinite(y)) { prev = null; continue; }
        const py = sy(y);
        // A jump taller than the canvas is a break (tan x at π/2, 1/x at 0), not a steep line
        if (prev === null || Math.abs(py - prev) > h) ctx.moveTo(px, clampPy(py));
        else ctx.lineTo(px, clampPy(py));
        prev = py;
      }
      ctx.stroke();
    },
    line(x1, y1, x2, y2, color, width = 2, dash = []) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      // Extend the segment across the plot, but cut it where it leaves a band around the view:
      // pulling far endpoints to the edge would change the slope of the drawn line
      const k = (y2 - y1) / (x2 - x1);
      const span = yr[1] - yr[0];
      let xa = xr[0], xb = xr[1];
      if (k !== 0) {
        const xLow = x1 + (yr[0] - span - y1) / k, xHigh = x1 + (yr[1] + span - y1) / k;
        xa = Math.max(xa, Math.min(xLow, xHigh));
        xb = Math.min(xb, Math.max(xLow, xHigh));
      }
      ctx.moveTo(sx(xa), sy(y1 + k * (xa - x1)));
      ctx.lineTo(sx(xb), sy(y1 + k * (xb - x1)));
      ctx.stroke();
      ctx.setLineDash([]);
    },
    vline(x, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sx(x), 0);
      ctx.lineTo(sx(x), h);
      ctx.stroke();
      ctx.setLineDash([]);
    },
    area(fn, a, b, color) {
      const lo = Math.max(Math.min(a, b), xr[0]), hi = Math.min(Math.max(a, b), xr[1]);
      if (lo >= hi) return;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(sx(lo), sy(0));
      for (let px = sx(lo); px <= sx(hi); px += 1) {
        const y = fn(toX(px));
        if (isFinite(y)) ctx.lineTo(px, clampPy(sy(y)));
      }
      ctx.lineTo(sx(hi), sy(0));
      ctx.closePath();
      ctx.fill();
    },
    dot(x, y, color, r = 5) {
      if (!isFinite(y)) return;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), r, 0, Math.PI * 2);
      ctx.fill();
    },
  };
}

function showHome() {
  redraw = null;
  const state = loadState();

  app.innerHTML = `${bi(
    'Type any function and explore it, follow a guided exploration, or practise on endless problems from school algebra to first-year calculus.',
    'Введите любую функцию и исследуйте её, пройдите готовое исследование или тренируйтесь на бесконечных задачах — от школьной алгебры до матанализа первого курса.'
  )}
  <a class="card sandbox-card" href="#sandbox">
    <h3>Sandbox <span class="ru">· Песочница</span></h3>
    ${bi('Any function: graph, derivative, tangent, area, roots, extrema, limits.', 'Любая функция: график, производная, касательная, площадь, корни, экстремумы, пределы.')}
  </a>

  <h3 class="section">Explore <span class="ru">· Исследования</span></h3>
  <div class="cards grid">${SCENARIOS.map(s => `
    <a class="card" href="#explore/${s.id}">
      <h4>${s.title.en}</h4>
      <div class="ru">${s.title.ru}</div>
    </a>`).join('')}</div>

  <h3 class="section">Practice <span class="ru">· Практика</span></h3>
  <div class="cards grid">${TOPICS.map(t => {
    const st = state[t.id];
    return `
    <a class="card" href="#practice/${t.id}">
      <h4>${t.title.en}</h4>
      <div class="ru">${t.title.ru}</div>
      <div class="progress">${st ? `Level ${st.level} · ${st.solved} solved <span class="ru">· уровень ${st.level}, решено ${st.solved}</span>` : 'Not started <span class="ru">· Не начато</span>'}</div>
    </a>`;
  }).join('')}</div>
  ${Object.keys(state).length ? '<button class="reset">Reset progress <span class="ru">· Сбросить прогресс</span></button>' : ''}`;

  const reset = app.querySelector('.reset');
  if (reset) reset.addEventListener('click', () => { saveState({}); showHome(); });
  renderMath(app);
}

// Routes: #  ·  #sandbox?f=...&a=...  ·  #explore/<id>  ·  #practice/<id>
function route() {
  const [path, query] = location.hash.slice(1).split('?');
  const [page, id] = path.split('/');
  const params = new URLSearchParams(query || '');
  const scenario = page === 'explore' && SCENARIOS.find(s => s.id === id);
  const topic = page === 'practice' && TOPICS.find(t => t.id === id);

  if (page === 'sandbox') showSandbox(Object.fromEntries(params));
  else if (scenario) showSandbox(scenario, scenario);
  else if (topic) showPractice(topic);
  else showHome();

  document.body.classList.toggle('hide-ru', !showRu.checked);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
// All scripts (sandbox.js, practice.js) are loaded by then
window.addEventListener('DOMContentLoaded', route);
