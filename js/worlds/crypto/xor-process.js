import { t } from '../../core/i18n.js';
import { L, el, actor, esc } from './ui.js';

// The same byte values drive the inputs, travelling bit tokens, XOR gates and outputs.
// No independent animation clock: the workshop's play/pause/scrub controls own the timeline.
export function xorProcess(onFlip) {
  const root = el('div', 'xor-process');
  const head = el('div', 'process-people');
  head.innerHTML = `<svg viewBox="-65 -60 130 170" aria-hidden="true">${actor('alice', 0, 0, 1)}</svg><div><strong>${esc(t(L('Как снимается маска', 'How a mask comes off')))}</strong><span>${esc(t(L('XOR = сложение каждого столбца по модулю 2', 'XOR = addition modulo 2 in each column')))}</span></div><svg viewBox="-65 -60 130 170" aria-hidden="true">${actor('bob', 0, 0, 1)}</svg>`;
  const inputRow = (name, row) => {
    const wrap = el('div', 'xor-process-row'), label = el('strong', '', name); wrap.append(label);
    for (let bit = 7; bit >= 0; bit--) {
      const b = el('button', 'xor-input-bit', '0'); b.type = 'button'; b.addEventListener('click', () => onFlip?.(row, bit));
      b.dataset.bit = bit; wrap.append(b);
    }
    return wrap;
  };
  const aRow = inputRow('M', 0), bRow = inputRow('K', 1);
  const gates = el('div', 'xor-gates');
  gates.innerHTML = `<svg viewBox="0 0 800 150" preserveAspectRatio="none" aria-hidden="true">${Array.from({ length: 8 }, (_, i) => {
    const x = 140 + 88 * i;
    return `<g class="xor-column"><path d="M${x - 17} 0V38Q${x - 17} 55 ${x} 66M${x + 17} 0V38Q${x + 17} 55 ${x} 66M${x} 91V150" fill="none" stroke="#40586b" stroke-width="2"/><circle cx="${x}" cy="78" r="16" fill="#1a3040" stroke="#58c4dd" stroke-width="2"/><text x="${x}" y="85" text-anchor="middle" fill="#58c4dd" font-size="24">⊕</text><g class="xor-travelling"><rect x="${x - 12}" y="-12" width="24" height="24" rx="5" fill="#f4d35e"/><text x="${x}" y="6" text-anchor="middle" fill="#17212b" font-size="18"></text></g></g>`;
  }).join('')}</svg>`;
  const output = el('div', 'xor-process-row xor-process-output'); output.append(el('strong', '', 'C'));
  for (let i = 0; i < 8; i++) output.append(el('span', 'xor-result-bit', '?'));
  const explanation = el('output', 'process-explanation');
  const cancellation = el('div', 'xor-cancellation');
  cancellation.innerHTML = `<span>M₁</span><b class="cancel-key">K₁</b><i>⊕</i><span>M₂</span><b class="cancel-key">K₁</b><strong class="cancel-zero">= 0</strong>`;
  root.append(head, aRow, bRow, gates, output, cancellation, explanation);
  let showedPair = null;
  let data = { a: 77, b: 170, labels: ['M', 'K', 'C'], editable: true, pair: false, fresh: false };
  function render(p) {
    if (showedPair !== data.pair) {
      head.querySelector('strong').textContent = t(data.pair ? L('Ева складывает два перехвата', 'Eve XORs two intercepts') : L('Как снимается маска', 'How a mask comes off'));
      head.querySelector('svg:last-child').innerHTML = actor(data.pair ? 'eve' : 'bob', 0, 0, 1);
      showedPair = data.pair;
    }
    const bits = [data.a, data.b].map(v => v.toString(2).padStart(8, '0'));
    for (const [row, r] of [[aRow, 0], [bRow, 1]]) {
      row.firstChild.textContent = data.labels[r];
      [...row.querySelectorAll('button')].forEach((b, i) => {
        b.textContent = bits[r][i]; b.disabled = !data.editable;
        b.setAttribute('aria-label', `${data.labels[r]}, ${t(L('бит', 'bit'))} ${7 - i}: ${bits[r][i]}`);
        b.classList.toggle('one', bits[r][i] === '1');
      });
    }
    output.firstChild.textContent = data.labels[2];
    [...output.querySelectorAll('span')].forEach((bit, i) => {
      const revealed = p >= .65 + i * .035, value = bits[0][i] ^ bits[1][i];
      bit.textContent = revealed ? value : '?'; bit.classList.toggle('one', revealed && value === 1);
    });
    gates.querySelectorAll('.xor-column').forEach((col, i) => {
      const local = Math.max(0, Math.min(1, p * 1.5 - i * .04));
      const token = col.querySelector('.xor-travelling');
      token.setAttribute('transform', `translate(0 ${local * 145})`);
      token.querySelector('text').textContent = local < .5 ? `${bits[0][i]}${bits[1][i]}` : String(bits[0][i] ^ bits[1][i]);
      token.style.opacity = p > 0 && local < 1 ? '1' : '0';
      col.querySelector('circle').setAttribute('stroke', p > .35 && p < .75 ? '#f4d35e' : '#58c4dd');
    });
    cancellation.hidden = !data.pair;
    cancellation.classList.toggle('paired', p >= .35);
    cancellation.classList.toggle('cancelled', p >= .7 && !data.fresh);
    cancellation.querySelectorAll('.cancel-key')[1].textContent = data.fresh ? 'K₂' : 'K₁';
    cancellation.querySelector('.cancel-zero').textContent = data.fresh ? 'K₁ ⊕ K₂' : '= 0';
    explanation.textContent = t(data.pair
      ? (p < .35 ? L('Раскроем два конверта как M₁ ⊕ K₁ и M₂ ⊕ K₂. Значения ключей Еве не нужны.', 'Expand the envelopes as M₁ ⊕ K₁ and M₂ ⊕ K₂. Eve does not need the key values.') : data.fresh ? L('Маски независимы. K₁ ⊕ K₂ остаётся неизвестным — сокращать их нельзя.', 'The pads are independent. K₁ ⊕ K₂ remains unknown — they cannot be cancelled.') : p < .7 ? L('Переставим слагаемые: одинаковые маски окажутся рядом.', 'Rearrange the terms: identical pads meet side by side.') : L('В каждом столбце K ⊕ K = 0. Через ворота прошли C₁ и C₂; осталось M₁ ⊕ M₂.', 'In each column K ⊕ K = 0. C₁ and C₂ passed through the gates; M₁ ⊕ M₂ remains.'))
      : p < .3 ? L('Два входных бита в каждом столбце. Нажмите биты, чтобы изменить сообщение или маску.', 'Two input bits in each column. Click bits to change the message or pad.') : p < .7 ? L('Ворота сравнивают пару: одинаковые биты дают 0, разные дают 1. Переносов между столбцами нет.', 'Each gate compares a pair: equal bits give 0, different bits give 1. There are no carries between columns.') : L(`${data.a} ⊕ ${data.b} = ${data.a ^ data.b}. Маску снимают тем же действием: (M ⊕ K) ⊕ K = M.`, `${data.a} ⊕ ${data.b} = ${data.a ^ data.b}. The same operation removes the pad: (M ⊕ K) ⊕ K = M.`));
    root.dataset.result = data.a ^ data.b;
  }
  return { el: root, label: L('Пропустить биты через XOR', 'Send the bits through XOR'), render,
    phase: p => p < .3 ? L('Входные биты', 'Input bits') : p < .7 ? L('Сложение mod 2', 'Addition mod 2') : L('Выходные биты', 'Output bits'),
    set(next) { data = { ...data, ...next }; },
  };
}
