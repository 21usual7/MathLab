import { t } from '../../core/i18n.js';
import { EC, sign, verify, multiply, recover } from './math.js';
import { L, el, action, field, check, line, workshop } from './ui.js';

const modes = [
  { id: 'free', title: L('Подпись — вычисление с секретом', 'A signature is a calculation with a secret'),
    text: L('Алиса подписывает два разных документа. Вместо длинных хешей используем учебные числа z₁ = 9 и z₂ = 22. Подпись (r, s) можно проверить открытым ключом Q = dG. Для каждой подписи Алиса также использует секретное одноразовое число k.', 'Alice signs two different documents. Instead of long hashes we use teaching numbers z₁ = 9 and z₂ = 22. The signature (r, s) can be verified with the public key Q = dG. For each signature Alice also uses a secret one-time number k.') },
  { id: 'recover', title: L('Две подписи выдали ключ', 'Two signatures leaked the key'),
    text: L('Ева получила два документа, их подписи и открытый ключ Алисы. Известно, что Алиса повторила одно и то же k. Вычтите уравнения подписей и восстановите сначала k, затем долгосрочный секрет d. Все вычисления — по модулю 37.', 'Eve has two documents, their signatures and Alice’s public key. Alice is known to have reused the same k. Subtract the signature equations to recover k and then the long-term secret d. All arithmetic is modulo 37.'),
    goal: L('Найдите секреты k и d. Затем подпишите третий документ от имени Алисы.', 'Find k and d. Then sign a third document as Alice.'),
    after: L('Проверка новой подписи прошла под настоящим открытым ключом Алисы. Утёк долгосрочный ключ, поэтому замены k для будущих подписей уже недостаточно: скомпрометированный ключ надо заменить.', 'The new signature verified under Alice’s real public key. The long-term key leaked, so changing k for future signatures is no longer enough: the compromised key must be replaced.') },
  { id: 'prevent', title: L('Один секретный k на разные документы?', 'One secret k for different documents?'),
    text: L('Вернитесь к моменту до утечки. Для разных хешей документов выберите разные секретные k и исследуйте, что случится с уравнениями атаки. Это учебный выбор чисел; в настоящей ECDSA k получают надёжным способом, например детерминированно из ключа и хеша по RFC 6979.', 'Return to the moment before the leak. Choose different secret k values for different document hashes and inspect what happens to the attack equations. These are teaching numbers; real ECDSA derives k securely, for example deterministically from the key and hash using RFC 6979.'),
    goal: L('Выключите повтор k и выберите верное объяснение.', 'Turn off k reuse and choose the correct explanation.'),
    after: L('В уравнениях появились разные неизвестные k₁ и k₂. Простое вычитание больше не выделяет общий k. Это устраняет показанную атаку, но само по себе не доказывает безопасность реализации.', 'The equations now contain separate unknowns k₁ and k₂. Simple subtraction no longer isolates a shared k. This removes the demonstrated attack, but does not by itself prove implementation security.') },
];
const D = 11, Z1 = 9, Z2 = 22, K = 5;
export default {
  modes,
  mount(ui) {
    const w = workshop(ui, { next: 'crypto-passwords', title: L('Документы на столе Евы', 'Documents on Eve’s desk'), sources: [['https://www.rfc-editor.org/rfc/rfc6979.html', 'RFC 6979 · ECDSA']], links: [['ecc', L('Откуда берутся r и Q', 'Where r and Q come from')], ['mod', L('Обратный элемент', 'Modular inverse')]], note: L('Настоящие уравнения ECDSA на учебной кривой y² = x³ − x + 1 mod 29, порядок 37. z — заданные представители хешей, не результат игрушечного хеширования.', 'Real ECDSA equations on a teaching curve y² = x³ − x + 1 mod 29, order 37. z values are given hash representatives, not outputs of a toy hash.') });
    let mode, reused = true, recovered = false, stage = 0, cards, equations, output;
    function signatures() { return [sign(Z1, D, K), sign(Z2, D, reused ? K : 9)]; }
    function draw() {
      const [s1, s2] = signatures(), Q = multiply(D);
      cards.replaceChildren();
      for (const [i, s, z] of [[1, s1, Z1], [2, s2, Z2]]) {
        const c = el('article', 'crypto-document'); c.append(el('span', 'crypto-eyebrow', L(`Документ ${i}`, `Document ${i}`)), el('h3', '', `z${i} = ${z}`), el('p', 'crypto-signature', `(r, s) = (${s.r}, ${s.s})`), el('p', 'crypto-micro', L(verify(z, s, Q) ? '✓ Подпись Алисы верна' : '✗ Подпись неверна', verify(z, s, Q) ? '✓ Alice’s signature is valid' : '✗ Invalid signature'))); cards.append(c);
      }
      equations.replaceChildren(el('p', 'crypto-equation', `Q = dG = (${Q.join(', ')}), n = ${EC.n}`));
      equations.append(el('p', 'crypto-equation', reused ? `s₁k ≡ z₁ + rd; s₂k ≡ z₂ + rd (mod 37)` : `s₁k₁ ≡ z₁ + r₁d; s₂k₂ ≡ z₂ + r₂d (mod 37)`));
      if (stage >= 1) equations.append(el('p', 'crypto-equation', reused ? `(${s1.s} − ${s2.s})k ≡ ${Z1} − ${Z2} (mod 37)` : `s₁k₁ − s₂k₂ ≡ z₁ − z₂ + (r₁ − r₂)d (mod 37)`));
      if (stage >= 2 && reused) equations.append(el('p', 'crypto-equation', `k ≡ (${Z1} − ${Z2}) · (${s1.s} − ${s2.s})⁻¹ (mod 37)`), el('p', 'crypto-equation', `d ≡ (${s1.s}k − ${Z1}) · ${s1.r}⁻¹ (mod 37)`));
      if (mode === 'free') equations.append(el('p', 'crypto-micro', L(`У Алисы: d = ${D}; k₁ = ${K}, k₂ = ${reused ? K : 9}. В задании эти секреты скрыты.`, `On Alice’s side: d = ${D}; k₁ = ${K}, k₂ = ${reused ? K : 9}. These secrets are hidden in the challenge.`)));
      w.story({ attack: true, alice: L('Подписала два документа', 'Signed two documents'), bob: L('Проверяет подпись по Q', 'Verifies using Q'), caption: reused ? L('В двух подписях повторилось r. В этом эксперименте причина известна: повтор секретного k.', 'The two signatures repeat r. In this experiment the cause is known: the secret k was reused.') : L('Алиса использовала разные секретные k для разных документов. Прежнее сокращение больше не работает.', 'Alice used different secret k values for different documents. The old cancellation no longer works.') });
    }
    function build() {
      w.experiment.replaceChildren(); cards = el('div', 'crypto-card-grid'); equations = el('div', 'crypto-equations'); output = el('output', 'crypto-receipt');
      w.experiment.append(cards, equations, line(action(L('1. Вычесть уравнения', '1. Subtract equations'), () => { stage = Math.max(stage, 1); draw(); }), action(L('2. Выразить неизвестные', '2. Isolate unknowns'), () => { stage = 2; draw(); })), output);
      if (mode === 'recover') {
        const fk = field(L('Секретное одноразовое k', 'Secret one-time k'), { type: 'number', min: 1, max: 36, name: 'k', onInput: () => { recovered = false; forge.disabled = true; } });
        const fd = field(L('Долгосрочный ключ d', 'Long-term key d'), { type: 'number', min: 1, max: 36, name: 'd', onInput: () => { recovered = false; forge.disabled = true; } });
        const forge = action(L('Подписать документ z₃ = 17', 'Sign document z₃ = 17'), () => {
          if (!recovered) return;
          const signature = sign(17, +fd.input.value, 9), valid = verify(17, signature, multiply(D));
          output.textContent = `(r, s) = (${signature.r}, ${signature.s}): ${t(valid ? L('Боб принял подпись Алисы', 'Bob accepted Alice’s signature') : L('Проверка не прошла', 'Verification failed'))}`;
          w.story({ attack: true, sender: 'eve', substitute: true, sent: '(r,s)', forwarded: '(r′,s′)', bob: L('Принял поддельную подпись', 'Accepted forged signature'), caption: L('Ева подписала новый документ украденным ключом. Боб проверил его открытым ключом Алисы — и принял.', 'Eve signed a new document using the stolen key. Bob checked it using Alice’s public key — and accepted.') }, true);
          if (valid) ui.solve(mode);
        }, true); forge.disabled = true;
        w.experiment.append(line(fk.el, fd.el), action(L('Проверить восстановление', 'Check recovery'), () => {
          const s = signatures(), expected = recover(Z1, s[0], Z2, s[1]);
          recovered = fk.input.value !== '' && fd.input.value !== '' && +fk.input.value === expected.k && +fd.input.value === expected.d;
          forge.disabled = !recovered;
          output.textContent = t(recovered ? L('Открытый ключ совпал: dG = Q. Теперь попробуйте подделать новый документ.', 'The public key matches: dG = Q. Now try forging a new document.') : L('Деление здесь — умножение на обратное по модулю 37. Сначала найдите k из разности уравнений, затем d.', 'Division means multiplication by an inverse modulo 37. First find k from the difference of the equations, then d.'));
        }), forge);
      } else {
        const toggle = check(L('Повторить секретное k в двух подписях', 'Reuse secret k in both signatures'), reused, v => { reused = v; draw(); }); w.experiment.append(toggle.el);
        if (mode === 'prevent') {
          const choice = el('select'); choice.setAttribute('aria-label', t(L('Почему вычитание не раскрывает ключ?', 'Why does subtraction no longer reveal the key?')));
          for (const [v, text] of [['', L('Выберите объяснение…', 'Choose an explanation…')], ['unknowns', L('Вместо общего k появились разные k₁ и k₂', 'The shared k was replaced by separate k₁ and k₂')], ['hidden', L('Теперь r и s стали секретными', 'r and s are now secret')], ['size', L('Числа просто стали больше', 'The numbers just got larger')]]) { const o = el('option', '', text); o.value = v; choice.append(o); }
          w.experiment.append(choice, action(L('Проверить', 'Check'), () => {
            if (!reused && choice.value === 'unknowns') ui.solve(mode);
            else ui.status(t(L('Открытые подписи по-прежнему доступны Еве. Посмотрите, сколько разных неизвестных осталось в разности.', 'Eve still has the public signatures. Count the distinct unknowns remaining after subtraction.')), 'fail');
          }, true));
        }
      }
      draw();
    }
    return { setMode(id) { mode = id; reused = true; recovered = false; stage = 0; build(); }, dispose() { w.dispose(); } };
  },
};
