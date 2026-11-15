import { t } from '../../core/i18n.js';
import { L, el } from './ui.js';
import { distance } from './hash-math.js';

export function hashRoundProcess() {
  const root = el('div', 'hash-round-process');
  const head = el('div', 'hash-process-head'); head.append(el('strong', '', L('Один изменённый бит проходит через SHA-256', 'One changed bit travels through SHA-256')));
  const count = el('output', 'hash-round-count');
  const board = el('div', 'hash-state-board');
  const rows = [];
  for (let i = 0; i < 8; i++) {
    const row = el('div', 'hash-state-row');
    const name = el('strong', '', 'abcdefgh'[i]), words = el('code', 'hash-state-words');
    const cells = el('div', 'hash-state-bits');
    for(let b=0;b<32;b++) cells.append(el('span', '', ''));
    row.append(name, words, cells); rows.push({ row, words, cells }); board.append(row);
  }
  const step = el('div', 'hash-round-operation');
  step.innerHTML = '<span>ROTR · XOR · Ch · Maj</span><strong>＋ mod 2³²</strong><span>a…h → a′…h′</span>';
  const explanation = el('output', 'process-explanation');
  const formula = el('code', 'crypto-equation', 'T₁ = h + Σ₁(e) + Ch(e,f,g) + K[t] + W[t]\na′ = T₁ + Σ₀(a) + Maj(a,b,c); e′ = d + T₁ (mod 2³²)');
  root.append(head, count, step, board, explanation, formula);
  let data = null;
  function render(p) {
    if (!data) return;
    const { a, b, block = 0 } = data, frame = Math.min(65, Math.floor(p * 65));
    const A = frame === 65 ? a.blocks[block].after : a.blocks[block].frames[frame];
    const B = frame === 65 ? b.blocks[block].after : b.blocks[block].frames[frame];
    count.textContent = t(L(`Блок ${block + 1}/${a.blocks.length} · ${frame === 65 ? 'итог блока' : `раунд ${frame}/64`} · различий: ${distance(A,B)} / 256`, `Block ${block + 1}/${a.blocks.length} · ${frame === 65 ? 'block result' : `round ${frame}/64`} · changed: ${distance(A,B)} / 256`));
    for (let i = 0; i < 8; i++) {
      rows[i].words.textContent = `${A[i].toString(16).padStart(8,'0')} → ${B[i].toString(16).padStart(8,'0')}`;
      [...rows[i].cells.children].forEach((cell, bit) => {
        const x = (A[i] >>> (31-bit)) & 1, changed = ((A[i]^B[i]) >>> (31-bit)) & 1;
        cell.className = changed ? 'different' : x ? 'one' : '';
        cell.title = `${'abcdefgh'[i]}[${31-bit}]: ${x} → ${(B[i] >>> (31-bit)) & 1}`;
      });
    }
    explanation.textContent = t(frame === 0 ? L('Одинаковые начальные слова ещё не означают одинаковый результат: изменённый бит войдёт через слова сообщения W[t].', 'Identical starting words do not imply identical outputs: the changed bit will enter through message words W[t].') : frame < 65 ? L('Оранжевые клетки — реальные различия двух вычислений. Сдвиги, выбор битов и сложение mod 2³² распространяют изменение по состоянию.', 'Orange cells are real differences between the two computations. Rotations, bit selection and addition mod 2³² spread the change through the state.') : L('После 64 раундов прибавляется входное состояние блока. Это настоящий результат SHA-256; лавинный эффект не означает, что всегда изменится ровно половина битов.', 'After 64 rounds the incoming block state is added. This is the actual SHA-256 result; the avalanche effect does not mean exactly half the bits always change.'));
    root.dataset.round = frame; root.dataset.differences = distance(A,B);
  }
  return { el: root, label: L('Пройти 64 раунда', 'Run through 64 rounds'), phase: p => L(`SHA-256 · ${Math.min(64,Math.floor(p*65))}/64`, `SHA-256 · ${Math.min(64,Math.floor(p*65))}/64`), render,
    set(next) { data = next; },
  };
}

export function hashBucketProcess() {
  const root = el('div', 'hash-bucket-process'), heading = el('h3', '', L('Разные карточки, конечное число ячеек', 'Different cards, a finite number of slots'));
  const moving = el('div', 'hash-dropping-card', 'card-0'), slots = el('div', 'hash-buckets');
  const label = el('output', 'process-explanation'); root.append(heading, moving, slots, label);
  let data = { bits: 4, items: [], collision: null };
  function render(p) {
    const N=2**data.bits;
    if (slots.children.length !== N) {
      slots.replaceChildren();
      for(let i=0;i<N;i++) { const slot=el('div','hash-bucket'); slot.dataset.bucket=i; slot.title=i.toString(16); slots.append(slot); }
    }
    slots.classList.toggle('many', N>16);
    const last=data.items.at(-1);
    const arrived=p>=.8?data.items:data.items.slice(0,-1);
    const counts=new Map(); for(const item of arrived) counts.set(item.bucket,(counts.get(item.bucket)||0)+1);
    [...slots.children].forEach((slot,i)=> { slot.className=`hash-bucket${counts.get(i)>1?' collided':counts.has(i)?' occupied':''}`; slot.textContent=N<=16?`${i.toString(16)}${counts.has(i)?` · ${counts.get(i)}`:''}`:''; });
    moving.textContent=last?.text || t(L('Новая карточка', 'New card'));
    const target=last?slots.children[last.bucket]:null;
    const dx=target?target.offsetLeft+target.offsetWidth/2-moving.offsetLeft-moving.offsetWidth/2:0;
    const dy=target?target.offsetTop+target.offsetHeight/2-moving.offsetTop-moving.offsetHeight/2:0;
    moving.style.transform=`translate(${dx*p}px,${dy*p}px) scale(${1-.75*p})`;
    moving.style.opacity=String(p>.8?Math.max(0,1-(p-.8)*5):1);
    label.textContent=data.collision ? t(L(`«${data.collision[0]}» и «${data.collision[1]}» попали в одну ячейку ${last.bucket.toString(16)}.`, `“${data.collision[0]}” and “${data.collision[1]}” reached the same slot ${last.bucket.toString(16)}.`)) : t(L(`${data.items.length} карточек · ${N} ячеек · сохраняем только ${data.bits} бит SHA-256.`, `${data.items.length} cards · ${N} slots · keeping only ${data.bits} SHA-256 bits.`));
  }
  return { el:root, label:L('Показать попадание в ячейку','Show a card entering a slot'), render, set(next){data=next;} };
}
