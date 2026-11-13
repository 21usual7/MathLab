// RSA: a lock anyone can close and only one key opens. On a clock of n = p·q powers come back: m^(φ+1) ≡ m with
// φ = (p − 1)(q − 1). So if e·d ≡ 1 (mod φ), raising to e (public) and then to d (secret) returns the message.
// Finding d needs φ, and φ needs p and q — the factoring of n, hopeless for a number with hundreds of digits.

import { COLORS } from '../core/palette.js';
import { t } from '../core/i18n.js';
import { clock, chords, powmod, at, R, multiples, mod } from './mod.js';

const N = 33, PHI = 20, E = 3, D = 7;
const WINDOW = { cx: 0, cy: 0, unit: 82, grid: false, fit: [8.4, 8.4] };
const I = v => Math.round(v);
const lit = ks => Object.fromEntries(ks.map(([k, c]) => [k, c]));

// m, m², m³, … until they come back to m
const cycle = (m, n) => { const s = [m]; for (let k = (m * m) % n; k !== m && s.length <= n; k = (k * m) % n) s.push(k); return [...s, m]; };

// A chord from mark i to mark j moved sideways by `off`: two arrows between the same marks do not overlap
function sideArrow(p, i, j, n, color, off, dash = []) {
  const a = at(i, n, R - 0.15), b = at(j, n, R - 0.15), L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const o = [-(b[1] - a[1]) / L * off, (b[0] - a[0]) / L * off];
  p.arrow(a[0] + o[0], a[1] + o[1], b[0] + o[0], b[1] + o[1], color, { width: 2.5, dash });
}

export default {
  view: '2d',
  view2d: WINDOW,
  lab: false,

  setup(scene) {
    scene.ensureParam('m', 4, { min: 0, max: 32, step: 1 }); // the message
    scene.ensureParam('c', 0, { min: 0, max: 32, step: 1 }); // the student's answers
    scene.ensureParam('d', 1, { min: 1, max: 19, step: 1 });
    scene.ensureParam('q', 2, { min: 2, max: 13, step: 1 });

    scene.custom.push(
      {
        // Encrypt m → c = m^e, decrypt c → c^d = m
        id: 'lock',
        draw2d(p, sc, s) {
          const m = I(s.m), c = powmod(m, E, N);
          clock(p, 'lock', N, { marks: lit([[m, COLORS.blue], [c, COLORS.red]]) });
          if (c !== m) {
            sideArrow(p, m, c, N, COLORS.red, 0.12);
            sideArrow(p, c, m, N, COLORS.green, 0.12, [6, 5]);
          }
        },
        legend: s => {
          const m = I(s.m), c = powmod(m, E, N);
          return `\\red{c} = \\blue{${m}}^{${E}} \\bmod ${N} = \\red{${c}},\\qquad \\green{\\red{${c}}^{${D}} \\bmod ${N}} = \\blue{${powmod(c, D, N)}}`;
        },
      },
      {
        // Powers of m come back to m after 20 steps (or a divisor of 20)
        id: 'cycle',
        draw2d(p, sc, s) {
          const m = I(s.m), seq = cycle(m, N);
          clock(p, 'cycle', N, { marks: lit([...seq.map(k => [k, COLORS.purple]), [m, COLORS.blue]]) });
          chords(p, seq, N, COLORS.purple);
        },
        legend: s => {
          const m = I(s.m), L = cycle(m, N).length - 1;
          return `\\blue{${m}}^1, \\blue{${m}}^2, \\ldots:\\ ${t({ en: '\\text{back after}', ru: '\\text{возврат через}' })}\\ ${L}\\ ${t({ en: '\\text{steps}', ru: '\\text{шаг.}' })}\\qquad \\blue{${m}}^{21} \\equiv \\blue{${powmod(m, 21, N)}}`;
        },
      },
      {
        // On the clock of φ = 20: jumps of e = 3 until 1 — seven of them
        id: 'keys',
        draw2d(p) {
          const seq = multiples(E, PHI), k = seq.indexOf(1);
          clock(p, 'keys', PHI, { marks: lit([[1, COLORS.yellow], ...seq.slice(1, k).map(j => [j, COLORS.green])]) });
          chords(p, seq.slice(0, k + 1), PHI, COLORS.green);
        },
        legend: () => `e \\cdot d = ${E} \\cdot \\yellow{${D}} = ${E * D} \\equiv 1 \\pmod{${PHI}}`,
      },
      // ---- Tasks ----
      {
        id: 'taskC',
        draw2d(p, sc, s) { clock(p, 'taskC', N, { marks: lit([[2, COLORS.blue], [I(s.c), COLORS.red]]) }); },
        legend: s => `\\blue{m} = 2,\\ e = ${E},\\ n = ${N}\\qquad \\red{c} = ${I(s.c)}`,
      },
      {
        id: 'taskD',
        draw2d(p, sc, s) {
          const d = I(s.d), seq = Array.from({ length: d + 1 }, (_, j) => mod(7 * j, PHI));
          clock(p, 'taskD', PHI, { marks: lit([[1, COLORS.grey], ...seq.slice(1).map(k => [k, COLORS.green]), [seq[d], COLORS.yellow]]) });
          chords(p, seq, PHI, COLORS.green);
        },
        legend: s => `7 \\cdot d \\equiv 1 \\pmod{20}\\qquad 7 \\cdot ${I(s.d)} = ${7 * I(s.d)} \\equiv \\yellow{${mod(7 * I(s.d), PHI)}}`,
      },
      {
        // Trying divisors of 91: jumps of q around the clock of 91 come back to 0 only for a divisor
        id: 'taskQ',
        draw2d(p, sc, s) {
          const q = I(s.q), seq = Array.from({ length: Math.ceil(91 / q) + 1 }, (_, j) => (j * q) % 91);
          clock(p, 'taskQ', 91, { labels: false, marks: lit(seq.map(k => [k, COLORS.green])) });
          chords(p, seq, 91, COLORS.green, 1.5);
        },
        legend: s => `91 = ${I(s.q)} \\cdot ${Math.floor(91 / I(s.q))} + \\yellow{${91 % I(s.q)}}`,
      },
    );
  },

  steps: [
    {
      title: { en: 'A lock anyone can close', ru: 'Замок, который закроет любой' },
      text: {
        en: 'Diffie–Hellman gives two people a common key. RSA does something stranger: Bob hangs out an open padlock — the numbers $n = 33$ and $e = 3$. Anyone can lock a message $\\blue{m}$ with it: $\\red{c} = m^3 \\bmod 33$. But only Bob has the key $d = 7$: $\\red{c}^{\\,7} \\bmod 33$ gives $\\blue{m}$ back. Locking (red) is public; unlocking (green, dashed) is Bob\'s secret.',
        ru: 'Диффи — Хеллман даёт двоим общий ключ. RSA делает вещь ещё более странную: Боб вывешивает открытый замок — числа $n = 33$ и $e = 3$. Любой может запереть им сообщение $\\blue{m}$: $\\red{c} = m^3 \\bmod 33$. Но ключ $d = 7$ есть только у Боба: $\\red{c}^{\\,7} \\bmod 33$ возвращает $\\blue{m}$. Запереть (красное) может каждый; отпереть (зелёное, пунктир) — только Боб.',
      },
      try: { en: 'Move $m$: every message goes to its own $c$ and comes back.', ru: 'Двигайте $m$: каждое сообщение уходит в своё $c$ и возвращается.' },
      check: {
        q: { en: 'Alice wants to send Bob a secret. Whose numbers does she use?', ru: 'Алиса хочет отправить Бобу секрет. Чьи числа она использует?' },
        options: [
          { text: { en: 'Bob\'s public $n$ and $e$', ru: 'открытые $n$ и $e$ Боба' }, ok: true },
          { text: { en: 'Bob\'s secret $d$', ru: 'секретное $d$ Боба' } },
          { text: { en: 'her own key', ru: 'свой ключ' } },
        ],
        explain: {
          en: 'The padlock is Bob\'s, and it is open to everybody: $n$ and $e$ can be printed in a newspaper. Only the one who will open it needs a secret.',
          ru: 'Замок — Боба, и он открыт всем: $n$ и $e$ можно напечатать в газете. Секрет нужен только тому, кто будет открывать.',
        },
      },
      state: { show: ['lock'], params: { m: 4 }, window: WINDOW, controls: ['m'] },
    },
    {
      title: { en: 'Powers come back', ru: 'Степени возвращаются' },
      text: {
        en: 'Why does it work? Take powers of $\\blue{m}$ on the clock of $33$: $m, m^2, m^3, \\ldots$ They walk around and come back to $m$ — for every $m$ after $20$ steps or a divisor of $20$. Here $33 = 3 \\cdot 11$ and $20 = (3 - 1)(11 - 1)$: this number is called $\\varphi(n)$ (Euler\'s theorem). So $m^{21} \\equiv m$ always — and $e \\cdot d = 3 \\cdot 7 = 21$: locking and unlocking together are exactly one full turn.',
        ru: 'Почему это работает? Возьмём степени $\\blue{m}$ на часах из $33$: $m, m^2, m^3, \\ldots$ Они обходят круг и возвращаются к $m$ — для любого $m$ через $20$ шагов или через делитель $20$. Здесь $33 = 3 \\cdot 11$, а $20 = (3 - 1)(11 - 1)$: это число называют $\\varphi(n)$ (теорема Эйлера). Значит, всегда $m^{21} \\equiv m$ — а $e \\cdot d = 3 \\cdot 7 = 21$: запереть и отпереть вместе — ровно один полный круг.',
      },
      try: { en: 'Change $m$ and watch the purple cycle return.', ru: 'Меняйте $m$ и смотрите, как фиолетовый цикл возвращается.' },
      check: {
        q: { en: '$m^{41} \\bmod 33 = ?$', ru: '$m^{41} \\bmod 33 = ?$' },
        options: [{ text: '$m$', ok: true }, { text: '$1$' }, { text: '$m^2$' }],
        explain: {
          en: '$41 = 2 \\cdot 20 + 1$: two full turns and one step — back to $m$.',
          ru: '$41 = 2 \\cdot 20 + 1$: два полных круга и один шаг — снова $m$.',
        },
      },
      state: { show: ['cycle'], params: { m: 2 }, window: WINDOW, controls: ['m'] },
    },
    {
      title: { en: 'The keys: e·d ≡ 1', ru: 'Ключи: e·d ≡ 1' },
      text: {
        en: 'So Bob needs $e \\cdot d$ to be one more than a multiple of $\\varphi = 20$: $e \\cdot d \\equiv 1 \\pmod{20}$. That is the inverse from the topic about remainders, on a clock of $20$: jump by $e = 3$ until you land on <span class="c-yellow">$1$</span> — seven jumps, so $d = 7$. Bob publishes $e$ and keeps $d$.',
        ru: 'Значит, Бобу нужно, чтобы $e \\cdot d$ было на единицу больше кратного $\\varphi = 20$: $e \\cdot d \\equiv 1 \\pmod{20}$. Это обратный элемент из темы про остатки, на часах из $20$: прыгайте по $e = 3$, пока не попадёте в <span class="c-yellow">$1$</span>, — семь прыжков, значит, $d = 7$. Боб публикует $e$ и хранит $d$.',
      },
      check: {
        q: { en: 'If $e = 7$ (and $\\varphi = 20$), what is $d$?', ru: 'Если $e = 7$ (и $\\varphi = 20$), чему равно $d$?' },
        options: [{ text: '$3$', ok: true }, { text: '$13$' }, { text: '$\\frac17$' }],
        explain: {
          en: '$7 \\cdot 3 = 21 \\equiv 1$. The roles of $e$ and $d$ can be swapped. $13$ gives $7 + 13 = 20$ — the opposite, not the inverse.',
          ru: '$7 \\cdot 3 = 21 \\equiv 1$. Роли $e$ и $d$ можно поменять. $13$ даёт $7 + 13 = 20$ — это противоположное, а не обратное.',
        },
      },
      state: { show: ['keys'], window: WINDOW, controls: [] },
    },
    {
      title: { en: 'Why d stays secret', ru: 'Почему d остаётся секретом' },
      text: {
        en: 'Eve knows $n = 33$ and $e = 3$. To find $d$ she needs $\\varphi = (p - 1)(q - 1)$, so she needs the factors $p$ and $q$ of $n$. For $33 = 3 \\cdot 11$ this takes a second. Real $n$ have about $600$ digits, and nobody knows how to factor such a number: multiplying two primes is easy, splitting the product back is not — another one-way road.',
        ru: 'Ева знает $n = 33$ и $e = 3$. Чтобы найти $d$, ей нужно $\\varphi = (p - 1)(q - 1)$, а значит, множители $p$ и $q$ числа $n$. Для $33 = 3 \\cdot 11$ это секунда. Настоящие $n$ — около $600$ цифр, и разложить такое число на множители никто не умеет: перемножить два простых легко, разделить произведение обратно — нет. Ещё одна дорога в одну сторону.',
      },
      check: {
        q: { en: '$n = 35 = 5 \\cdot 7$. What is $\\varphi(n)$?', ru: '$n = 35 = 5 \\cdot 7$. Чему равно $\\varphi(n)$?' },
        options: [{ text: '$24$', ok: true }, { text: '$34$' }, { text: '$35$' }],
        explain: {
          en: '$(5 - 1)(7 - 1) = 4 \\cdot 6 = 24$: the numbers from $1$ to $35$ that share no divisor with $35$.',
          ru: '$(5 - 1)(7 - 1) = 4 \\cdot 6 = 24$ — столько чисел от $1$ до $35$ не имеют общих делителей с $35$.',
        },
      },
      state: { show: ['lock'], params: { m: 9 }, window: WINDOW, controls: ['m'] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Run the lock backwards: Bob raises a message to his secret $d$, and anyone checks it with the public $e$ — only Bob could have made it. That is a <i>digital signature</i>. Try it: which $c$ gives $c^3 \\equiv 4$? And think why $m = 0$ and $m = 1$ are bad messages.',
        ru: 'Пустите замок в обратную сторону: Боб возводит сообщение в свой секретный $d$, а любой проверяет открытым $e$ — сделать такое мог только Боб. Это <i>цифровая подпись</i>. Попробуйте: какое $c$ даёт $c^3 \\equiv 4$? И подумайте, почему $m = 0$ и $m = 1$ — плохие сообщения.',
      },
      state: { show: ['lock'], params: { m: 4 }, window: WINDOW, controls: ['m'] },
    },
    {
      title: { en: 'Lock it', ru: 'Заприте' },
      text: {
        en: 'Encrypt $m = 2$ with Bob\'s lock $e = 3$, $n = 33$: set $c$.',
        ru: 'Зашифруйте $m = 2$ замком Боба $e = 3$, $n = 33$: поставьте $c$.',
      },
      task: {
        kind: 'drag',
        target: { c: 8 },
        back: 0,
        right: { en: '$2^3 = 8$, less than $33$: the remainder is $8$ itself.', ru: '$2^3 = 8$, меньше $33$: остаток — само $8$.' },
        mistakes: [
          { params: { c: 6 }, text: { en: 'This is $2 \\cdot 3$. The lock raises to a power: $2^3$.', ru: 'Это $2 \\cdot 3$. Замок возводит в степень: $2^3$.' } },
          { params: { c: 5 }, text: { en: 'This is $2 + 3$ — a Caesar shift. RSA raises to a power: $2^3$.', ru: 'Это $2 + 3$ — сдвиг Цезаря. RSA возводит в степень: $2^3$.' } },
        ],
        hints: { c: { en: '$c = m^e \\bmod n$.', ru: '$c = m^e \\bmod n$.' } },
      },
      state: { show: ['taskC'], params: { c: 0 }, window: WINDOW, controls: ['c'] },
    },
    {
      title: { en: 'Make the key', ru: 'Сделайте ключ' },
      text: {
        en: 'Now $e = 7$ and $\\varphi = 20$. Find the secret $d$ with $7d \\equiv 1 \\pmod{20}$.',
        ru: 'Теперь $e = 7$ и $\\varphi = 20$. Найдите секретное $d$, при котором $7d \\equiv 1 \\pmod{20}$.',
      },
      task: {
        kind: 'drag',
        target: { d: 3 },
        back: 2,
        right: { en: '$7 \\cdot 3 = 21 = 20 + 1$.', ru: '$7 \\cdot 3 = 21 = 20 + 1$.' },
        mistakes: [
          { params: { d: 13 }, text: { en: '$7 + 13 = 20$: that undoes adding. $d$ must undo multiplying: $7 \\cdot d \\equiv 1$.', ru: '$7 + 13 = 20$: это отменяет сложение. $d$ должно отменять умножение: $7 \\cdot d \\equiv 1$.' } },
        ],
        hints: { d: d => ({ en: `$7 \\cdot ${I(d)} \\equiv ${mod(7 * I(d), PHI)}$, not $1$.`, ru: `$7 \\cdot ${I(d)} \\equiv ${mod(7 * I(d), PHI)}$, а не $1$.` }) },
      },
      state: { show: ['taskD'], params: { d: 1 }, window: WINDOW, controls: ['d'] },
    },
    {
      title: { en: 'Break a small RSA', ru: 'Взломайте маленький RSA' },
      text: {
        en: 'Bob\'s public $n = 91$. Find a prime factor $q$ of it: jumps of $q$ around the clock of $91$ land exactly on $0$ only for a divisor.',
        ru: 'Открытое $n$ Боба — $91$. Найдите его простой множитель $q$: прыжки по $q$ на часах из $91$ попадают ровно в $0$ только для делителя.',
      },
      task: {
        kind: 'drag',
        target: [{ q: 7 }, { q: 13 }],
        back: 3,
        right: {
          en: '$91 = 7 \\cdot 13$. Now $\\varphi = 6 \\cdot 12 = 72$, and $d$ is found from $e$ in a moment. For $600$ digits this search would never end.',
          ru: '$91 = 7 \\cdot 13$. Теперь $\\varphi = 6 \\cdot 12 = 72$, и $d$ по $e$ находится сразу. Для $600$ цифр такой поиск не закончился бы никогда.',
        },
        hints: { q: q => ({ en: `$91 = ${I(q)} \\cdot ${Math.floor(91 / I(q))} + ${91 % I(q)}$: the remainder is not $0$.`, ru: `$91 = ${I(q)} \\cdot ${Math.floor(91 / I(q))} + ${91 % I(q)}$: остаток не $0$.` }) },
      },
      state: { show: ['taskQ'], params: { q: 2 }, window: WINDOW, controls: ['q'] },
    },
  ],
};
