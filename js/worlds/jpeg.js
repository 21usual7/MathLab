// How a photo shrinks tenfold: JPEG taken apart on a built-in picture or on the visitor's own photo.
// The photo never leaves the device: it is read into a canvas and compressed right here (jpeg-math.js).
// On the left half of the view — the original, on the right — the compressed copy (drag the divider);
// a click on the picture opens one 8×8 block: its pixels before and after, and the 64 waves it is made of.

import { COLORS } from '../core/palette.js';
import { t } from '../core/i18n.js';
import { slider, seg, toggle, button, row } from '../ui/kit.js';
import { renderMath } from '../ui/tex.js';
import { jpeg, sunset, wave, dct, ZIGZAG, table } from './jpeg-math.js';

const MAXW = 480, MAXH = 360;

const TXT = {
  sample: { en: 'Sunset', ru: 'Закат' },
  photo: { en: 'Your photo', ru: 'Ваше фото' },
  upload: { en: 'Choose a photo…', ru: 'Выбрать фото…' },
  color: { en: 'Colour', ru: 'Цвет' },
  sub: { en: 'Colour at half size (4:2:0)', ru: 'Цвет в половину размера (4:2:0)' },
  grid: { en: 'Blocks', ru: 'Блоки' },
  diff: { en: 'Difference ×6', ru: 'Разница ×6' },
  original: { en: 'original', ru: 'оригинал' },
  compressed: { en: 'compressed', ru: 'сжатое' },
  block: { en: 'Block', ru: 'Блок' },
  waves: { en: 'Its 64 waves', ru: 'Его 64 волны' },
  hud: {
    en: 'Drag the divider · click the picture to open a block · your photo is processed only in this browser',
    ru: 'Тяните разделитель · щёлкните по картинке, чтобы открыть блок · ваше фото обрабатывается только в этом браузере',
  },
  hudWaves: { en: 'Click the waves on the right to add them to your sum', ru: 'Щёлкайте по волнам справа, чтобы добавить их в свою сумму' },
};

// Rounds of the first challenge: the target is a sum of these waves (u — across, v — down)
const ROUNDS = [[[1, 0]], [[0, 3]], [[2, 0], [0, 2]], [[1, 1], [4, 0]]];

const MODES = [
  {
    id: 'free',
    title: { en: 'A photo made of waves', ru: 'Фото из волн' },
    text: {
      en: 'JPEG does four things. <b>1.</b> Cuts the picture into $8 \\times 8$ blocks. <b>2.</b> Writes every block as a sum of $64$ waves $\\cos\\frac{(2x + 1)u\\pi}{16}\\cos\\frac{(2y + 1)v\\pi}{16}$ — slow ones in the top left corner, fast ones in the bottom right; this is just another way to write the same $64$ numbers, nothing is lost yet. <b>3.</b> Divides each wave\'s amount by a number and rounds: fast waves by big numbers, so most of them become $0$. <b>4.</b> Stores the zeros very compactly. Move the quality and watch the size, the closeness (PSNR, in decibels) and the waves of a block. Try your own photo.',
      ru: 'JPEG делает четыре вещи. <b>1.</b> Режет картинку на блоки $8 \\times 8$. <b>2.</b> Записывает каждый блок как сумму $64$ волн $\\cos\\frac{(2x + 1)u\\pi}{16}\\cos\\frac{(2y + 1)v\\pi}{16}$ — медленные в левом верхнем углу, быстрые в правом нижнем; это просто другая запись тех же $64$ чисел, пока ничего не потеряно. <b>3.</b> Делит количество каждой волны на число и округляет: быстрые — на большие числа, так что большинство из них становятся $0$. <b>4.</b> Очень компактно хранит нули. Двигайте качество и смотрите на размер, близость (PSNR, в децибелах) и волны блока. Попробуйте своё фото.',
    },
  },
  {
    id: 'waves',
    title: { en: 'Assemble a block from waves', ru: 'Соберите блок из волн' },
    text: {
      en: 'On the left is a target block, next to it — your sum. Find which waves the target is made of and click them in the table of $64$ waves. The column of the table is $u$ — how many half-swings across; the row is $v$ — how many half-swings down. Four rounds.',
      ru: 'Слева — блок-цель, рядом — ваша сумма. Найдите, из каких волн состоит цель, и щёлкните их в таблице $64$ волн. Столбец таблицы — это $u$, сколько полуколебаний поперёк; строка — $v$, сколько полуколебаний вниз. Четыре раунда.',
    },
    goal: { en: 'Four targets assembled exactly.', ru: 'Четыре цели собраны точно.' },
    after: {
      en: 'Any block of $64$ pixels is such a sum — of exactly these $64$ waves, each taken in its own amount. In a photo the slow waves carry almost everything, the fast ones only fine detail and noise. That is the whole secret: keep the slow, throw out the fast.',
      ru: 'Любой блок из $64$ пикселей — такая сумма, ровно этих $64$ волн, каждая в своём количестве. В фотографии медленные волны несут почти всё, а быстрые — только мелкие детали и шум. В этом и весь секрет: медленные оставить, быстрые выбросить.',
    },
  },
  {
    id: 'ten',
    title: { en: 'Ten times smaller, unnoticed', ru: 'В десять раз меньше — незаметно' },
    text: {
      en: 'A black-and-white sunset takes $8$ bits per pixel. Make it at least $10$ times smaller while keeping it close to the original: PSNR at least $37$ dB (above that, the difference is hard to see without the «Difference» view).',
      ru: 'Чёрно-белый закат занимает $8$ бит на пиксель. Сделайте его хотя бы в $10$ раз меньше и при этом близким к оригиналу: PSNR не меньше $37$ дБ (выше этого разницу трудно увидеть без режима «Разница»).',
    },
    goal: { en: 'Compression ×10 or more, PSNR ≥ 37 dB.', ru: 'Сжатие в 10 раз и больше, PSNR ≥ 37 дБ.' },
    after: {
      en: 'Quality and size pull in opposite directions, and there is only a narrow corridor where both hold. Cutting the number of waves bluntly is worse than quantization: rounding keeps a fast wave where the block really needs it (an edge) and removes it where it is almost zero.',
      ru: 'Качество и размер тянут в разные стороны, и есть лишь узкий коридор, где выполнено и то и другое. Грубо отрезать число волн хуже, чем квантовать: округление оставляет быструю волну там, где она блоку действительно нужна (на крае), и убирает там, где она почти ноль.',
    },
  },
  {
    id: 'color',
    title: { en: 'Colour almost for free', ru: 'Цвет почти даром' },
    text: {
      en: 'JPEG stores brightness and colour separately. Brightness here is fixed at quality $75$. Make the colour add no more than $12\\%$ to the size of the brightness — and keep the colours true: PSNR of the colours at least $34$ dB.',
      ru: 'JPEG хранит яркость и цвет отдельно. Яркость здесь закреплена на качестве $75$. Сделайте так, чтобы цвет добавлял к размеру яркости не больше $12\\%$, — и чтобы цвета остались верными: PSNR цветов не меньше $34$ дБ.',
    },
    goal: { en: 'Colour ≤ 12% of brightness, colour PSNR ≥ 34 dB.', ru: 'Цвет ≤ 12% от яркости, PSNR цветов ≥ 34 дБ.' },
    after: {
      en: 'The eye has about $20$ times more brightness receptors than precise colour ones: we see edges in brightness, and colour only «fills them in». So JPEG stores colour at half resolution both ways — a quarter of the pixels — and quantizes it coarsely. A colour photo costs only a little more than a black-and-white one. Video does the same.',
      ru: 'Рецепторов яркости в глазу примерно в $20$ раз больше, чем точных цветовых: края мы видим по яркости, а цвет лишь «заливает» их. Поэтому JPEG хранит цвет в половинном разрешении по обеим осям — четверть пикселей — и грубо квантует. Цветное фото стоит лишь чуть дороже чёрно-белого. Видео делает так же.',
    },
  },
];

// A plane of numbers 0…255 drawn into an offscreen canvas
function paint(cv, w, h, r, g, b, map = v => v) {
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'), im = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) { im.data[4 * i] = map(r[i]); im.data[4 * i + 1] = map(g[i]); im.data[4 * i + 2] = map(b[i]); im.data[4 * i + 3] = 255; }
  ctx.putImageData(im, 0, 0);
}

export default {
  modes: MODES,

  mount(ui) {
    const S = {
      img: sunset(), source: 'sample', photo: null, qy: 75, qc: 50, keep: 64, sub: true, gray: false,
      split: 0.5, grid: false, diff: false, sel: [12, 9], res: null, mode: 'free', hover: null,
      round: 0, chosen: new Set(),
    };
    ui.host.innerHTML = `
      <div class="jp">
        <div class="jp-main"><canvas class="jp-view"></canvas></div>
        <aside class="jp-side">
          <div class="jp-cap jp-cap-block"></div>
          <div class="jp-pair"><canvas class="jp-b0"></canvas><canvas class="jp-b1"></canvas></div>
          <div class="jp-cap">${t(TXT.waves)}</div>
          <canvas class="jp-basis"></canvas>
          <div class="jp-info"></div>
        </aside>
      </div>`;
    const $ = s => ui.host.querySelector(s);
    const view = $('.jp-view'), basis = $('.jp-basis'), b0 = $('.jp-b0'), b1 = $('.jp-b1'), info = $('.jp-info'), cap = $('.jp-cap-block');
    const offA = document.createElement('canvas'), offB = document.createElement('canvas'), offD = document.createElement('canvas');
    let frame = 0, geo = null;

    // ---- Compressing ----
    function recompute() {
      const o = S.img;
      S.res = jpeg(o, { qy: S.qy, qc: S.qc, keep: S.keep, sub: S.sub, gray: S.gray });
      const gr = S.gray ? S.res.Y : null;
      paint(offA, o.w, o.h, gr || o.r, gr || o.g, gr || o.b);
      paint(offB, o.w, o.h, S.res.r, S.res.g, S.res.b);
      const d = new Float32Array(o.w * o.h);
      const ref = gr ? [gr, gr, gr] : [o.r, o.g, o.b];
      for (let i = 0; i < d.length; i++) d[i] = Math.min(255, 6 * (Math.abs(ref[0][i] - S.res.r[i]) + Math.abs(ref[1][i] - S.res.g[i]) + Math.abs(ref[2][i] - S.res.b[i])) / 3);
      paint(offD, o.w, o.h, d, d.map(v => v * 0.75), d.map(v => v * 0.3));
      report();
      judge();
      request();
    }
    const request = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); }); };

    function report() {
      const r = S.res, kb = b => `${(b / 8 / 1024).toFixed(1)} KB`;
      const nz = r.y.blocks.reduce((n, q) => n + q.reduce((m, v) => m + (v !== 0), 0), 0) / r.y.blocks.length;
      const rows = [
        [t({ en: 'Size (estimate)', ru: 'Размер (оценка)' }), `${kb(r.bits)} / ${kb(r.raw)}`],
        [t({ en: 'Compression', ru: 'Сжатие' }), `×${(r.raw / r.bits).toFixed(1)}`],
        [t({ en: 'PSNR of brightness', ru: 'PSNR яркости' }), `${r.psnrY.toFixed(1)} dB`],
      ];
      if (!S.gray) rows.push([t({ en: 'PSNR of colours', ru: 'PSNR цветов' }), `${r.psnrRGB.toFixed(1)} dB`], [t({ en: 'Colour costs', ru: 'Цвет стоит' }), `${(100 * r.bitsC / r.bitsY).toFixed(0)}% ${t({ en: 'of brightness', ru: 'от яркости' })}`]);
      rows.push([t({ en: 'Waves kept per block', ru: 'Волн осталось на блок' }), nz.toFixed(1)]);
      if (S.mode !== 'waves') ui.readout(rows);
    }

    function judge() {
      const r = S.res;
      if (S.mode === 'ten') {
        const k = r.raw / r.bits;
        if (k >= 10 && r.psnrY >= 37) return ui.solve('ten', t({ en: `×${k.toFixed(1)} at ${r.psnrY.toFixed(1)} dB.`, ru: `×${k.toFixed(1)} при ${r.psnrY.toFixed(1)} дБ.` }));
        ui.status(t({
          en: k < 10 ? `Only ×${k.toFixed(1)} — still too big.` : `×${k.toFixed(1)}, but ${r.psnrY.toFixed(1)} dB — the copy is too far from the original.`,
          ru: k < 10 ? `Только ×${k.toFixed(1)} — всё ещё великовато.` : `×${k.toFixed(1)}, но ${r.psnrY.toFixed(1)} дБ — копия слишком далеко от оригинала.`,
        }), 'progress');
      }
      if (S.mode === 'color') {
        const share = r.bitsC / r.bitsY;
        if (share <= 0.12 && r.psnrRGB >= 34) return ui.solve('color', t({ en: `Colour adds ${(100 * share).toFixed(0)}%, colours at ${r.psnrRGB.toFixed(1)} dB.`, ru: `Цвет добавляет ${(100 * share).toFixed(0)}%, цвета — ${r.psnrRGB.toFixed(1)} дБ.` }));
        ui.status(t({
          en: share > 0.12 ? `Colour adds ${(100 * share).toFixed(0)}% — too expensive.${S.sub ? '' : ' Does colour need every pixel?'}` : `Cheap (${(100 * share).toFixed(0)}%), but colours are off: ${r.psnrRGB.toFixed(1)} dB.`,
          ru: share > 0.12 ? `Цвет добавляет ${(100 * share).toFixed(0)}% — дорого.${S.sub ? '' : ' Нужен ли цвету каждый пиксель?'}` : `Дёшево (${(100 * share).toFixed(0)}%), но цвета поплыли: ${r.psnrRGB.toFixed(1)} дБ.`,
        }), 'progress');
      }
    }

    // ---- Drawing ----
    function fitBox(cw, ch, w, h, pad = 16) {
      const k = Math.min((cw - 2 * pad) / w, (ch - 2 * pad) / h);
      const s = k >= 3 ? Math.floor(k) : k; // a whole zoom when the pixels are big (crisp), otherwise use all the room
      return { s, x: Math.round((cw - w * s) / 2), y: Math.round((ch - h * s) / 2), w: w * s, h: h * s };
    }
    function sizeCanvas(cv) {
      const dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return [ctx, W, H];
    }

    function draw() {
      const [ctx, W, H] = sizeCanvas(view);
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      if (S.mode === 'waves') { drawRound(ctx, W, H); drawSide(); return; }
      const o = S.img, g = geo = fitBox(W, H, o.w, o.h);
      const cut = Math.round(g.w * S.split);
      ctx.drawImage(S.diff ? offD : offB, 0, 0, o.w, o.h, g.x, g.y, g.w, g.h);
      if (!S.diff) {
        ctx.save(); ctx.beginPath(); ctx.rect(g.x, g.y, cut, g.h); ctx.clip();
        ctx.drawImage(offA, 0, 0, o.w, o.h, g.x, g.y, g.w, g.h);
        ctx.restore();
        // The divider with its handle and names
        ctx.fillStyle = '#ffffff'; ctx.fillRect(g.x + cut - 1, g.y, 2, g.h);
        ctx.beginPath(); ctx.arc(g.x + cut, g.y + g.h / 2, 11, 0, 7); ctx.fill();
        ctx.fillStyle = '#0d1117'; ctx.font = '600 12px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⇔', g.x + cut, g.y + g.h / 2 + 1);
        ctx.font = '600 11px Inter, sans-serif'; ctx.textBaseline = 'top';
        const tag = (txt, x, align) => { ctx.textAlign = align; ctx.fillStyle = 'rgba(13,17,23,0.75)'; const m = ctx.measureText(txt).width + 12; ctx.fillRect(align === 'left' ? x : x - m, g.y + 8, m, 20); ctx.fillStyle = '#e6e9ef'; ctx.fillText(txt, align === 'left' ? x + 6 : x - 6, g.y + 12); };
        if (cut > 90) tag(t(TXT.original).toUpperCase(), g.x + 8, 'left');
        if (g.w - cut > 90) tag(t(TXT.compressed).toUpperCase(), g.x + g.w - 8, 'right');
      }
      if (S.grid && g.s >= 2) {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = 8; x < o.w; x += 8) { ctx.moveTo(g.x + x * g.s + 0.5, g.y); ctx.lineTo(g.x + x * g.s + 0.5, g.y + g.h); }
        for (let y = 8; y < o.h; y += 8) { ctx.moveTo(g.x, g.y + y * g.s + 0.5); ctx.lineTo(g.x + g.w, g.y + y * g.s + 0.5); }
        ctx.stroke();
      }
      ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = 2;
      ctx.strokeRect(g.x + S.sel[0] * 8 * g.s - 1, g.y + S.sel[1] * 8 * g.s - 1, 8 * g.s + 2, 8 * g.s + 2);
      drawSide();
    }

    // The selected block of the brightness: its pixels before and after, and its 64 waves
    function blockOf(plane) {
      const { w } = S.img, [bx, by] = S.sel, out = new Float64Array(64);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) out[y * 8 + x] = plane[(by * 8 + y) * w + bx * 8 + x];
      return out;
    }
    function drawBlock(cv, vals) {
      const [ctx, W] = sizeCanvas(cv), c = W / 8;
      for (let i = 0; i < 64; i++) { const v = Math.max(0, Math.min(255, Math.round(vals[i]))); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect((i % 8) * c, Math.floor(i / 8) * c, Math.ceil(c), Math.ceil(c)); }
    }
    function drawSide() {
      const waves = S.mode === 'waves';
      let coef = null, q = null, Q = null;
      if (!waves) {
        const blocksX = S.img.w / 8, idx = S.sel[1] * blocksX + S.sel[0];
        q = S.res.y.blocks[idx];
        Q = table(S.qy);
        coef = dct(blockOf(S.res.Y).map(v => v - 128));
        cap.textContent = `${t(TXT.block)} (${S.sel[0]}, ${S.sel[1]}) — ${t(TXT.original)} / ${t(TXT.compressed)}`;
        drawBlock(b0, blockOf(S.res.Y));
        drawBlock(b1, blockOf(S.res.y.out));
      }
      const [ctx, W] = sizeCanvas(basis), cell = W / 8, px = (cell - 4) / 8;
      ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, W);
      const max = coef ? Math.max(1, ...coef.slice(1).map(Math.abs)) : 1;
      for (let v = 0; v < 8; v++) for (let u = 0; u < 8; u++) {
        const i = v * 8 + u, wv = wave(u, v);
        const on = waves ? S.chosen.has(i) : q[i] !== 0;
        for (let k = 0; k < 64; k++) {
          const g = Math.round(128 + 110 * wv[k]);
          ctx.fillStyle = `rgb(${g},${g},${g})`;
          ctx.fillRect(u * cell + 2 + (k % 8) * px, v * cell + 2 + Math.floor(k / 8) * px, Math.ceil(px), Math.ceil(px));
        }
        if (!on) { ctx.fillStyle = 'rgba(13,17,23,0.72)'; ctx.fillRect(u * cell + 2, v * cell + 2, cell - 4, cell - 4); }
        if (on) { ctx.strokeStyle = COLORS.yellow; ctx.lineWidth = waves ? 2.5 : 1 + 2 * Math.min(1, Math.abs(coef[i]) / max * 3); ctx.strokeRect(u * cell + 1.5, v * cell + 1.5, cell - 3, cell - 3); }
        if (S.hover === i) { ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 2; ctx.strokeRect(u * cell + 1, v * cell + 1, cell - 2, cell - 2); }
      }
      if (S.hover !== null && !waves) {
        const i = S.hover, u = i % 8, v = Math.floor(i / 8);
        info.innerHTML = t({
          en: `Wave $(u, v) = (${u}, ${v})$: amount $${coef[i].toFixed(0)}$, divided by $${Q[i]}$ → <b>${q[i]}</b>${q[i] ? '' : ' (thrown away)'}`,
          ru: `Волна $(u, v) = (${u}, ${v})$: количество $${coef[i].toFixed(0)}$, делим на $${Q[i]}$ → <b>${q[i]}</b>${q[i] ? '' : ' (выброшена)'}`,
        });
      } else if (!waves) {
        const n = q.reduce((m, x) => m + (x !== 0), 0);
        info.innerHTML = t({ en: `Kept <b>${n}</b> of 64 waves (framed). Point at a wave to see its amount.`, ru: `Осталось <b>${n}</b> из 64 волн (в рамке). Наведите на волну, чтобы увидеть её количество.` });
      } else info.innerHTML = t({ en: `Round ${S.round + 1} of ${ROUNDS.length}`, ru: `Раунд ${S.round + 1} из ${ROUNDS.length}` });
      renderMath(info);
    }

    // The first challenge: the target and the student's sum, side by side and big
    const sumOf = cells => { const s = new Float64Array(64).fill(128); cells.forEach(i => { const w = wave(i % 8, Math.floor(i / 8)); for (let k = 0; k < 64; k++) s[k] += 100 / Math.max(1, cells.length ** 0.5) * w[k]; }); return s; };
    const target = () => ROUNDS[S.round].map(([u, v]) => v * 8 + u);
    function drawRound(ctx, W, H) {
      const size = Math.min((W - 80) / 2, H - 90), c = size / 8, y0 = (H - size) / 2 + 10;
      [[sumOf(target()), t({ en: 'Target', ru: 'Цель' })], [sumOf([...S.chosen]), t({ en: 'Your sum', ru: 'Ваша сумма' })]].forEach(([vals, name], k) => {
        const x0 = W / 2 - size - 20 + k * (size + 40);
        for (let i = 0; i < 64; i++) { const v = Math.max(0, Math.min(255, Math.round(vals[i]))); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x0 + (i % 8) * c, y0 + Math.floor(i / 8) * c, Math.ceil(c), Math.ceil(c)); }
        ctx.fillStyle = '#b9c1cd'; ctx.font = '500 14px Inter, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(name, x0, y0 - 10);
      });
      cap.textContent = '';
    }
    function checkRound() {
      const want = target();
      if (want.length !== S.chosen.size || !want.every(i => S.chosen.has(i))) return;
      if (S.round + 1 < ROUNDS.length) {
        S.round++; S.chosen.clear();
        ui.status(t({ en: `Exactly! Round ${S.round + 1} of ${ROUNDS.length}.`, ru: `Точно! Раунд ${S.round + 1} из ${ROUNDS.length}.` }), 'progress');
      } else ui.solve('waves', '');
      request();
    }

    // ---- Pointer ----
    let drag = null;
    const local = (cv, e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    view.addEventListener('pointerdown', e => {
      if (S.mode === 'waves' || !geo) return;
      view.setPointerCapture(e.pointerId);
      const [x, y] = local(view, e), cut = geo.x + geo.w * S.split;
      drag = !S.diff && Math.abs(x - cut) < 16 ? 'split' : 'pick';
      move(x, y);
    });
    const move = (x, y) => {
      if (drag === 'split') S.split = Math.max(0, Math.min(1, (x - geo.x) / geo.w));
      else if (drag === 'pick') {
        const bx = Math.floor((x - geo.x) / geo.s / 8), by = Math.floor((y - geo.y) / geo.s / 8);
        if (bx >= 0 && by >= 0 && bx < S.img.w / 8 && by < S.img.h / 8) S.sel = [bx, by];
      }
      request();
    };
    view.addEventListener('pointermove', e => {
      if (drag) return move(...local(view, e));
      if (!geo || S.mode === 'waves') return;
      const [x] = local(view, e);
      view.style.cursor = !S.diff && Math.abs(x - (geo.x + geo.w * S.split)) < 16 ? 'ew-resize' : 'crosshair';
    });
    const up = () => { drag = null; };
    view.addEventListener('pointerup', up);
    view.addEventListener('pointercancel', up);
    const cellAt = e => { const [x, y] = local(basis, e), c = basis.clientWidth / 8, u = Math.floor(x / c), v = Math.floor(y / c); return u >= 0 && v >= 0 && u < 8 && v < 8 ? v * 8 + u : null; };
    basis.addEventListener('pointermove', e => { const i = cellAt(e); if (i !== S.hover) { S.hover = i; request(); } });
    basis.addEventListener('pointerleave', () => { S.hover = null; request(); });
    basis.addEventListener('click', e => {
      const i = cellAt(e);
      if (i === null) return;
      if (S.mode === 'waves') { S.chosen.has(i) ? S.chosen.delete(i) : S.chosen.add(i); checkRound(); }
      else S.hover = i;
      request();
    });
    const ro = new ResizeObserver(request);
    ro.observe(view);
    ro.observe(basis);

    // ---- Your photo: read here, downscaled, never sent anywhere ----
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'image/*';
    file.hidden = true;
    ui.host.appendChild(file);
    file.addEventListener('change', async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f), im = new Image();
      im.onload = () => {
        const k = Math.min(1, MAXW / im.width, MAXH / im.height);
        const w = Math.max(16, Math.floor(im.width * k / 16) * 16), h = Math.max(16, Math.floor(im.height * k / 16) * 16);
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const c2 = cv.getContext('2d');
        c2.drawImage(im, 0, 0, w, h);
        const d = c2.getImageData(0, 0, w, h).data, r = new Float32Array(w * h), g = new Float32Array(w * h), b = new Float32Array(w * h);
        for (let i = 0; i < w * h; i++) { r[i] = d[4 * i]; g[i] = d[4 * i + 1]; b[i] = d[4 * i + 2]; }
        URL.revokeObjectURL(url);
        S.photo = { w, h, r, g, b };
        S.img = S.photo; S.source = 'photo';
        S.sel = [Math.floor(w / 16), Math.floor(h / 16)];
        if (srcSeg) srcSeg.set('photo');
        recompute();
      };
      im.src = url;
    });

    // ---- Controls ----
    let srcSeg = null;
    function controls(kind) {
      const c = ui.controls;
      c.innerHTML = '';
      if (kind === 'waves') {
        c.appendChild(row(button(t({ en: 'Clear my sum', ru: 'Очистить сумму' }), () => { S.chosen.clear(); request(); })));
        return;
      }
      const qyS = slider({ label: t({ en: '\\text{quality}', ru: '\\text{качество}' }), min: 1, max: 100, step: 1, value: S.qy, format: v => String(v), onInput: v => { S.qy = v; recompute(); } });
      const kS = slider({ label: t({ en: '\\text{waves}', ru: '\\text{волн}' }), min: 1, max: 64, step: 1, value: S.keep, format: v => String(v), onInput: v => { S.keep = v; recompute(); } });
      const qcS = slider({ label: t({ en: '\\text{colour}', ru: '\\text{цвет}' }), min: 1, max: 100, step: 1, value: S.qc, format: v => String(v), onInput: v => { S.qc = v; recompute(); } });
      if (kind === 'free') {
        srcSeg = seg([{ id: 'sample', label: t(TXT.sample) }, { id: 'photo', label: t(TXT.photo) }], S.source, k => {
          if (k === 'photo' && !S.photo) { file.click(); srcSeg.set('sample'); return; }
          S.source = k; S.img = k === 'photo' ? S.photo : sunset(); S.sel = [12, 9]; recompute();
        });
        c.append(row(srcSeg, button(t(TXT.upload), () => file.click())), qyS.el, kS.el, qcS.el);
        c.appendChild(row(
          toggle(t(TXT.color), !S.gray, on => { S.gray = !on; qcS.disable(S.gray); recompute(); }),
          toggle(t(TXT.sub), S.sub, on => { S.sub = on; recompute(); }),
          toggle(t(TXT.grid), S.grid, on => { S.grid = on; request(); }),
          toggle(t(TXT.diff), S.diff, on => { S.diff = on; request(); }),
        ));
        qcS.disable(S.gray);
      } else if (kind === 'ten') {
        c.append(qyS.el, kS.el, row(toggle(t(TXT.grid), S.grid, on => { S.grid = on; request(); }), toggle(t(TXT.diff), S.diff, on => { S.diff = on; request(); })));
      } else if (kind === 'color') {
        qyS.disable(true);
        c.append(qyS.el, qcS.el, row(toggle(t(TXT.sub), S.sub, on => { S.sub = on; recompute(); }), toggle(t(TXT.diff), S.diff, on => { S.diff = on; request(); })));
      }
    }

    return {
      setMode(id) {
        S.mode = id;
        ui.host.querySelector('.jp').dataset.mode = id;
        Object.assign(S, { diff: false, grid: false, split: 0.5, hover: null });
        if (id === 'free') Object.assign(S, { img: S.source === 'photo' && S.photo ? S.photo : sunset(), qy: 75, qc: 50, keep: 64, sub: true, gray: false });
        if (id === 'waves') Object.assign(S, { round: 0, chosen: new Set(), img: sunset(), gray: true });
        if (id === 'ten') Object.assign(S, { img: sunset(), qy: 90, keep: 64, gray: true, sub: false });
        if (id === 'color') Object.assign(S, { img: sunset(), qy: 75, qc: 90, keep: 64, gray: false, sub: false });
        S.sel = [12, 9];
        controls(id);
        ui.hud(t(id === 'waves' ? TXT.hudWaves : TXT.hud));
        recompute();
        if (id === 'waves') ui.readout([]);
      },
      dispose() { cancelAnimationFrame(frame); ro.disconnect(); ui.host.innerHTML = ''; },
    };
  },
};
