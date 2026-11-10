const app = document.getElementById('app');
const showRu = document.getElementById('showRu');

showRu.addEventListener('change', () => {
  document.body.classList.toggle('hide-ru', !showRu.checked);
});

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

// Canvas helper: maps math coordinates to pixels
function makePlot(canvas, xr, yr) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  // xr as a number = center of the x-axis: the x-range is chosen from the canvas size
  // so that one unit has the same length on both axes (slopes look true)
  if (typeof xr === 'number') {
    const span = (yr[1] - yr[0]) * w / h;
    xr = [xr - span / 2, xr + span / 2];
  }

  const sx = x => (x - xr[0]) / (xr[1] - xr[0]) * w;
  const sy = y => h - (y - yr[0]) / (yr[1] - yr[0]) * h;

  return {
    axes() {
      // Grid: one line per unit
      ctx.strokeStyle = '#eee';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = Math.ceil(xr[0]); x <= xr[1]; x++) { ctx.moveTo(sx(x), 0); ctx.lineTo(sx(x), h); }
      for (let y = Math.ceil(yr[0]); y <= yr[1]; y++) { ctx.moveTo(0, sy(y)); ctx.lineTo(w, sy(y)); }
      ctx.stroke();

      ctx.strokeStyle = '#bbb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (xr[0] <= 0 && 0 <= xr[1]) { ctx.moveTo(sx(0), 0); ctx.lineTo(sx(0), h); }
      if (yr[0] <= 0 && 0 <= yr[1]) { ctx.moveTo(0, sy(0)); ctx.lineTo(w, sy(0)); }
      ctx.stroke();
    },
    curve(fn, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let pen = false;
      for (let px = 0; px <= w; px += 2) {
        const x = xr[0] + px / w * (xr[1] - xr[0]);
        const y = fn(x);
        if (isFinite(y) && y >= yr[0] && y <= yr[1]) {
          pen ? ctx.lineTo(px, sy(y)) : ctx.moveTo(px, sy(y));
          pen = true;
        } else {
          pen = false;
        }
      }
      ctx.stroke();
    },
    line(x1, y1, x2, y2, color, width = 2, dash = []) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash);
      ctx.beginPath();
      // Extend the segment across the whole plot
      const k = (y2 - y1) / (x2 - x1);
      const ax = xr[0], bx = xr[1];
      ctx.moveTo(sx(ax), sy(y1 + k * (ax - x1)));
      ctx.lineTo(sx(bx), sy(y1 + k * (bx - x1)));
      ctx.stroke();
      ctx.setLineDash([]);
    },
    dot(x, y, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), 5, 0, Math.PI * 2);
      ctx.fill();
    },
  };
}

// Quiz: wrong answers can be retried; the right one shows the explanation
function renderQuiz(el, questions) {
  el.innerHTML = '<h3>Check yourself <span class="ru">· Проверьте себя</span></h3>';
  questions.forEach(qst => {
    const block = document.createElement('div');
    block.className = 'question';
    block.innerHTML = `${qst.q}<div class="options"></div><div class="feedback"></div>`;
    const optionsEl = block.querySelector('.options');
    const feedback = block.querySelector('.feedback');

    qst.options.forEach((o, i) => {
      const btn = document.createElement('button');
      // Numbers are the same in both languages: show them once
      btn.innerHTML = o.en === o.ru ? o.en : bi(o.en, o.ru);
      btn.addEventListener('click', () => {
        if (i === qst.answer) {
          btn.classList.add('correct');
          optionsEl.querySelectorAll('button').forEach(b => b.disabled = true);
          feedback.className = 'feedback ok';
          feedback.innerHTML = qst.explain;
        } else {
          btn.classList.add('wrong');
          btn.disabled = true;
          feedback.className = 'feedback bad';
          feedback.innerHTML = qst.hint;
        }
        renderMath(block);
      });
      optionsEl.appendChild(btn);
    });
    el.appendChild(block);
  });
}

function showHome() {
  app.innerHTML = `${bi(
    'Interactive lessons: see the idea, play with it, then check yourself.',
    'Интерактивные уроки: увидеть идею, потрогать её руками, потом проверить себя.'
  )}<div class="cards">${LESSONS.map(l => `
    <a class="card" href="#${l.id}">
      <h3>${l.title.en}</h3>
      <div class="ru">${l.title.ru}</div>
    </a>`).join('')}</div>`;
}

function showLesson(lesson) {
  app.innerHTML = `
    <a class="back" href="#">← All lessons <span class="ru">· Все уроки</span></a>
    <h2>${lesson.title.en}</h2>
    <div class="ru" style="margin-top:-6px">${lesson.title.ru}</div>
    <div>${lesson.intro}</div>
    <section class="lesson-widget"></section>
    <section class="quiz"></section>`;
  lesson.render(app.querySelector('.lesson-widget'));
  renderQuiz(app.querySelector('.quiz'), lesson.quiz);
  renderMath(app);
  window.scrollTo(0, 0);
}

function route() {
  const id = location.hash.slice(1);
  const lesson = LESSONS.find(l => l.id === id);
  lesson ? showLesson(lesson) : showHome();
  document.body.classList.toggle('hide-ru', !showRu.checked);
}

window.addEventListener('hashchange', route);
route();
