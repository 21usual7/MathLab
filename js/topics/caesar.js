// The Caesar cipher: every letter moves k places along the alphabet — adding k on a clock of letters.
// Decrypting is walking back. There are few keys, so they can all be tried; and letter frequencies give the key away
// at once: the most common letter of the secret text is the encrypted «О» («E» in English).
// The alphabet follows the language of explanations: 32 Russian letters (Ё counted as Е) or 26 English ones.

import { COLORS, THEME } from '../core/palette.js';
import { t } from '../core/i18n.js';
import { mod } from './mod.js';

const ALPHA = { en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ru: 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ' };
// How often each letter appears in ordinary text, %
const FREQ = {
  en: { E: 12.7, T: 9.06, A: 8.17, O: 7.51, I: 6.97, N: 6.75, S: 6.33, H: 6.09, R: 5.99, D: 4.25, L: 4.03, C: 2.78, U: 2.76,
    M: 2.41, W: 2.36, F: 2.23, G: 2.02, Y: 1.97, P: 1.93, B: 1.29, V: 0.98, K: 0.77, J: 0.15, X: 0.15, Q: 0.1, Z: 0.07 },
  ru: { О: 10.97, Е: 8.45, А: 8.01, И: 7.35, Н: 6.7, Т: 6.26, С: 5.47, Р: 4.73, В: 4.54, Л: 4.4, К: 3.49, М: 3.21, Д: 2.98,
    П: 2.81, У: 2.62, Я: 2.01, Ы: 1.9, Ь: 1.74, Г: 1.7, З: 1.65, Б: 1.59, Ч: 1.44, Й: 1.21, Х: 0.97, Ж: 0.94, Ш: 0.73,
    Ю: 0.64, Ц: 0.48, Щ: 0.36, Э: 0.32, Ф: 0.26, Ъ: 0.04 },
};
// A long text: its letter counts look like the language's
const LONG = {
  en: 'The Caesar cipher replaces every letter with the one that stands a few places further along the alphabet. Such a cipher is easy to break: it is enough to count how often each letter appears. In English text the most common letter is E, followed by T, A and O. If another letter is the most common one in the secret message, it must be the encrypted E, and the distance between them is the key. That is why real ciphers are built so that letter frequencies tell nothing about the key.',
  ru: 'Шифр Цезаря заменяет каждую букву той, что стоит на несколько позиций дальше по алфавиту. Такой шифр очень просто взломать: довольно посчитать, сколько раз встречается каждая буква. В русском тексте чаще прочих попадается буква О, потом идут Е, А и И. Если в шифровке чаще всего встречается другая буква, то скорее всего это и есть зашифрованная О, и расстояние от одной до другой говорит, каков ключ. Поэтому хорошие шифры устроены по-другому: по частотам букв ничего нельзя узнать о ключе.',
};
const WORD = { en: 'HELLO', ru: 'ПРИВЕТ' };
const SECRET = { en: 'MEET ME AT THE BRIDGE AT MIDNIGHT', ru: 'ВСТРЕЧАЕМСЯ У МОСТА В ПОЛНОЧЬ' };
const LOCK = { en: 'LOCK', ru: 'ЗАМОК' };

const alpha = () => t(ALPHA);
const N = () => alpha().length;
// Shift every letter of the alphabet by k; anything else stays
export const shift = (text, k) => {
  const A = alpha(), n = A.length;
  return text.toUpperCase().replace(/Ё/g, 'Е').replace(/./g, c => (A.includes(c) ? A[mod(A.indexOf(c) + k, n)] : c));
};
const counts = text => { const A = alpha(), c = new Array(A.length).fill(0); for (const ch of shift(text, 0)) if (A.includes(ch)) c[A.indexOf(ch)]++; return c; };

const I = v => Math.round(v);
const WINDOW = { cx: 0, cy: 0, unit: 82, grid: false, fit: [7.8, 7.8] };
const BARS = { cx: 0, cy: 0.6, unit: 70, grid: false, fit: [9.2, 6] };
const tt = s => `\\text{${s}}`;

// Two rings of letters: the alphabet outside, the same alphabet shifted by k inside — what each letter becomes.
// Letters of `word` are lit: yellow outside, green inside.
function rings(p, k, word = '') {
  const A = alpha(), n = A.length, lit = new Set(shift(word, 0));
  const at = (i, r) => [r * Math.sin(2 * Math.PI * i / n), r * Math.cos(2 * Math.PI * i / n)];
  p.polyline(Array.from({ length: 145 }, (_, i) => at(i * n / 144, 2.75)), 'rgba(255,255,255,0.14)', 1.5);
  for (let i = 0; i < n; i++) {
    const on = lit.has(A[i]);
    p.text(A[i], ...at(i, 3.2), on ? COLORS.yellow : THEME.text, { size: 16, weight: on ? 600 : 400 });
    p.text(A[mod(i + k, n)], ...at(i, 2.3), on ? COLORS.green : THEME.label, { size: 15, weight: on ? 600 : 400 });
  }
  // The arrow of the shift: from A outside to what it becomes inside
  p.arrow(...at(0, 2.95), ...at(0, 2.55), COLORS.green, { width: 2 });
}

// Letter counts of a secret text (blue bars) and the frequencies of the language moved by the guess g (yellow
// outlines): they match when g is the key
function bars(p, text, g) {
  const A = alpha(), n = A.length, c = counts(text), total = c.reduce((a, b) => a + b, 0);
  const f = A.split('').map(ch => t(FREQ)[ch] / 100), w = 8.6 / n, x0 = -4.3, base = -1.6, H = 26;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * w;
    p.rect(x + 0.1 * w, base, x + 0.9 * w, base + H * c[i] / total, COLORS.blue + 'aa');
    const e = H * f[mod(i - g, n)];
    p.polyline([[x + 0.05 * w, base], [x + 0.05 * w, base + e], [x + 0.95 * w, base + e], [x + 0.95 * w, base]], COLORS.yellow, 1.5);
    p.text(A[i], x + w / 2, base - 0.3, THEME.label, { size: Math.min(12, 0.85 * w * p.u) }); // smaller in a narrow view
  }
}

export default {
  view: '2d',
  view2d: WINDOW,
  lab: false,

  setup(scene) {
    const n = N();
    scene.ensureParam('k', 3, { min: 0, max: n - 1, step: 1 });
    scene.ensureParam('g', 0, { min: 0, max: n - 1, step: 1 }); // a guess of the key

    scene.custom.push(
      {
        id: 'encrypt',
        draw2d(p, sc, s) { rings(p, I(s.k), t(WORD)); },
        legend: s => `${tt(t(WORD))} \\;\\xrightarrow{\\;+${I(s.k)}\\;}\\; \\green{${tt(shift(t(WORD), I(s.k)))}}`,
      },
      {
        // A secret text with key 13; the guess g walks it back
        id: 'tryAll',
        draw2d(p, sc, s) { rings(p, I(s.g)); },
        legend: () => `\\green{${tt(shift(t(SECRET), 13))}}`,
      },
      { id: 'tryAllOut', legend: s => `\\xrightarrow{\\;-${I(s.g)}\\;}\\; ${tt(shift(t(SECRET), 13 - I(s.g)))}` },
      {
        id: 'freq',
        draw2d(p, sc, s) { bars(p, shift(t(LONG), 11), I(s.g)); },
        legend: s => `g = ${I(s.g)}:\\ ${tt(shift(t(LONG), 11 - I(s.g)).slice(0, 26))}\\ldots`,
      },
      // ---- Tasks ----
      {
        id: 'lock',
        draw2d(p, sc, s) { rings(p, I(s.g)); },
        legend: s => `\\green{${tt(shift(t(LOCK), 5))}} \\;\\xrightarrow{\\;-${I(s.g)}\\;}\\; ${tt(shift(t(LOCK), 5 - I(s.g)))}`,
      },
      {
        id: 'freq19',
        draw2d(p, sc, s) { bars(p, shift(t(LONG), 19), I(s.g)); },
        legend: s => `g = ${I(s.g)}:\\ ${tt(shift(t(LONG), 19 - I(s.g)).slice(0, 26))}\\ldots`,
      },
      {
        id: 'twice',
        draw2d(p, sc, s) { rings(p, I(s.g), t(WORD)); },
        legend: () => `${tt(t(WORD))} \\xrightarrow{+20} ${tt(shift(t(WORD), 20))} \\xrightarrow{+25} \\green{${tt(shift(t(WORD), 45))}}`,
      },
      { id: 'twiceOut', legend: s => `${tt(t(WORD))} \\xrightarrow{+${I(s.g)}} ${tt(shift(t(WORD), I(s.g)))}` },
    );
  },

  steps: [
    {
      title: { en: 'Shift the alphabet', ru: 'Сдвиг алфавита' },
      text: {
        en: 'Julius Caesar wrote secret letters by replacing each letter with the one three places further: A became D, B became E. Put the alphabet on a clock: encrypting is adding the key $k$ to the number of every letter, modulo $26$. The outer ring is the ordinary alphabet, the inner one is what each letter turns into. At the end the alphabet wraps around: X, Y, Z become A, B, C.',
        ru: 'Юлий Цезарь писал секретные письма, заменяя каждую букву той, что стоит на три позиции дальше: А превращалась в Г, Б — в Д. Поставим алфавит на часы: зашифровать — значит прибавить ключ $k$ к номеру каждой буквы по модулю $32$. Внешнее кольцо — обычный алфавит, внутреннее — во что превращается каждая буква. В конце алфавит заворачивает: Э, Ю, Я становятся А, Б, В.',
      },
      try: { en: 'Turn the inner ring with $k$ and watch the word change.', ru: 'Поворачивайте внутреннее кольцо ползунком $k$ и смотрите, как меняется слово.' },
      check: {
        q: { en: 'With $k = 3$, what does Z become?', ru: 'Во что при $k = 3$ превращается Я?' },
        options: [{ text: { en: 'C', ru: 'В' }, ok: true }, { text: { en: 'W', ru: 'Ь' } }, { text: { en: 'Z', ru: 'Я' } }],
        explain: {
          en: 'Z is letter number $25$ (counting from $0$). $25 + 3 = 28 \\equiv 2 \\pmod{26}$ — letter number $2$, C.',
          ru: 'Я — буква номер $31$ (считая с $0$). $31 + 3 = 34 \\equiv 2 \\pmod{32}$ — буква номер $2$, В.',
        },
      },
      state: { show: ['encrypt'], params: { k: 3 }, window: WINDOW, controls: ['k'] },
    },
    {
      title: { en: 'Few keys: try them all', ru: 'Ключей мало: переберите все' },
      text: {
        en: 'Decrypting is walking back: subtract $k$, or — the same on a clock — add $26 - k$. But an enemy does not know $k$. Not a problem: there are only $25$ keys that change anything. Here is an intercepted message; move the guess $g$ and read the legend. Only one key gives words — the rest is nonsense.',
        ru: 'Расшифровать — значит пройти назад: вычесть $k$ или, что на часах то же самое, прибавить $32 - k$. Но враг не знает $k$. Не беда: ключей, которые хоть что-то меняют, всего $31$. Вот перехваченное сообщение; двигайте догадку $g$ и читайте подпись. Слова получаются только при одном ключе — остальное бессмыслица.',
      },
      try: { en: 'Move $g$ until the legend can be read.', ru: 'Двигайте $g$, пока подпись не станет читаемой.' },
      check: {
        q: { en: 'A message was encrypted with $k = 3$. Which forward shift decrypts it?', ru: 'Сообщение зашифровали ключом $k = 3$. Каким сдвигом вперёд его расшифровать?' },
        options: [{ text: { en: '$23$', ru: '$29$' }, ok: true }, { text: '$3$' }, { text: '$-3$' }],
        explain: {
          en: '$3 + 23 = 26 \\equiv 0$: three forward and twenty-three more is a full circle, every letter is back in place.',
          ru: '$3 + 29 = 32 \\equiv 0$: три вперёд и ещё двадцать девять — полный круг, каждая буква вернулась на место.',
        },
      },
      state: { show: ['tryAll', 'tryAllOut'], params: { g: 0 }, window: WINDOW, controls: ['g'] },
    },
    {
      title: { en: 'Frequencies give the key away', ru: 'Частоты выдают ключ' },
      text: {
        en: 'For a long text one need not even try keys. In ordinary English some letters are much more common: E, T, A, O. The <span class="c-blue">blue bars</span> count the letters of a secret text; the <span class="c-yellow">yellow outlines</span> are the usual frequencies of English, moved by the guess $g$. The cipher moved all letters by the same key, so the whole picture is moved — find $g$ where the outlines fit the bars.',
        ru: 'Для длинного текста даже перебирать не нужно. В русском тексте одни буквы гораздо чаще других: О, Е, А, И. <span class="c-blue">Синие столбики</span> считают буквы шифровки; <span class="c-yellow">жёлтые контуры</span> — обычные частоты русских букв, сдвинутые на догадку $g$. Шифр сдвинул все буквы на один ключ — значит, вся картинка сдвинута. Найдите $g$, при котором контуры совпадут со столбиками.',
      },
      try: { en: 'Move $g$: watch where the highest bar is and where the outline of E is.', ru: 'Двигайте $g$: смотрите, где самый высокий столбик и где контур буквы О.' },
      check: {
        q: { en: 'The most common letter of a long secret text is H. What is the most likely key?', ru: 'Чаще всего в длинной шифровке встречается буква С. Какой ключ вероятнее всего?' },
        options: [{ text: '$3$', ok: true }, { text: '$8$' }, { text: '$11$' }],
        explain: {
          en: 'H is most likely the encrypted E: E is letter $4$, H is letter $7$, so $k = 7 - 4 = 3$.',
          ru: 'С — скорее всего зашифрованная О: О — буква номер $14$ (считая А нулевой), С — номер $17$, значит, $k = 17 - 14 = 3$.',
        },
      },
      state: { show: ['freq'], params: { g: 0 }, window: BARS, controls: ['g'] },
    },
    {
      title: { en: 'A secret has to be large — and shared', ru: 'Секрет должен быть большим — и общим' },
      text: {
        en: 'Caesar\'s cipher fails twice. There are too few keys — so real ciphers have keys of $128$ bits or more: more keys than atoms in a planet, trying them all is out of the question. And it hides the frequencies badly — real ciphers mix the letters so thoroughly that every letter of the result is equally likely. One problem remains: both sides must know the same key. How can they agree on it if every message can be read by an enemy? That is the next topic.',
        ru: 'Шифр Цезаря проваливается дважды. Ключей слишком мало — поэтому у настоящих шифров ключи из $128$ бит и больше: ключей больше, чем атомов в планете, перебрать их невозможно. И он плохо прячет частоты — настоящие шифры перемешивают буквы так, что любая буква результата одинаково вероятна. Остаётся одна проблема: обе стороны должны знать один и тот же ключ. Как договориться о нём, если любое сообщение может прочитать враг? Это следующая тема.',
      },
      state: { show: ['encrypt'], params: { k: 7 }, window: WINDOW, controls: ['k'] },
    },
    {
      title: { en: 'Open the lock', ru: 'Откройте замок' },
      text: {
        en: 'The legend shows an intercepted word. Find the key $g$ that turns it back into an English word.',
        ru: 'В подписи — перехваченное слово. Найдите ключ $g$, который превращает его обратно в русское слово.',
      },
      task: {
        kind: 'drag',
        target: { g: 5 },
        back: 1,
        right: {
          en: 'Key $5$: the word is LOCK.',
          ru: 'Ключ $5$: это слово ЗАМОК.',
        },
        get mistakes() {
          return [{ params: { g: N() - 5 }, text: {
            en: 'Walking back by this $g$ is the same as walking $5$ forward: the letters moved further away instead of coming back. Decrypting walks back by the key itself.',
            ru: 'Шаг назад на такое $g$ — то же, что $5$ шагов вперёд: буквы ушли ещё дальше, а не вернулись. Расшифровка идёт назад ровно на ключ.' } }];
        },
        hints: {
          g: g => ({ en: `With $g = ${I(g)}$ the word is ${shift(t(LOCK), 5 - I(g))} — not English yet.`, ru: `При $g = ${I(g)}$ получается ${shift(t(LOCK), 5 - I(g))} — пока не слово.` }),
        },
      },
      state: { show: ['lock'], params: { g: 0 }, window: WINDOW, controls: ['g'] },
    },
    {
      title: { en: 'Break it by frequencies', ru: 'Взломайте по частотам' },
      text: {
        en: 'A long text with another key. Fit the yellow outlines to the blue bars with $g$ — and check by reading the legend.',
        ru: 'Длинный текст с другим ключом. Совместите жёлтые контуры с синими столбиками ползунком $g$ — и проверьте, прочитав подпись.',
      },
      task: {
        kind: 'drag',
        target: { g: 19 },
        back: 2,
        right: {
          en: 'Key $19$: the highest bar is X, letter $23$, and E is letter $4$: $23 - 4 = 19$.',
          ru: 'Ключ $19$: самый высокий столбик — Б, буква номер $1$, а О — номер $14$: $1 - 14 = -13 \\equiv 19 \\pmod{32}$.',
        },
        hints: {
          g: { en: 'Find the highest blue bar: it is most likely the encrypted E. The key is how far it is from E.', ru: 'Найдите самый высокий синий столбик: скорее всего, это зашифрованная О. Ключ — на сколько он отстоит от О.' },
        },
      },
      state: { show: ['freq19'], params: { g: 0 }, window: BARS, controls: ['g'] },
    },
    {
      title: { en: 'Twice is once', ru: 'Дважды — это один раз' },
      text: {
        en: 'The word was encrypted with key $20$, and the result once more with key $25$. Find the single key $g$ that does the same at once.',
        ru: 'Слово зашифровали ключом $20$, а результат — ещё раз ключом $25$. Найдите один ключ $g$, который делает то же самое сразу.',
      },
      task: {
        kind: 'drag',
        get target() { return { g: mod(45, N()) }; },
        back: 0,
        get right() {
          const n = N();
          return { en: `$20 + 25 = 45 = ${n} + ${45 - n}$: two shifts are one shift by the sum, modulo ${n}. Encrypting twice adds no safety.`, ru: `$20 + 25 = 45 = ${n} + ${45 - n}$: два сдвига — один сдвиг на сумму по модулю ${n}. Двойное шифрование безопасности не добавляет.` };
        },
        mistakes: [
          { params: { g: 5 }, text: { en: 'This is $25 - 20$. But both shifts go forward: they add up.', ru: 'Это $25 - 20$. Но оба сдвига идут вперёд — они складываются.' } },
        ],
        hints: {
          g: { en: 'Both shifts go forward by $20$ and $25$ letters. How far in total — and how much of it is full circles?', ru: 'Оба сдвига идут вперёд — на $20$ и на $25$ букв. На сколько всего, и сколько из этого — полные круги?' },
        },
      },
      state: { show: ['twice', 'twiceOut'], params: { g: 0 }, window: WINDOW, controls: ['g'] },
    },
  ],
};
