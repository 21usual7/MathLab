import { t } from '../../core/i18n.js';
import { bytes, xor, crib, printable, randomPad } from './math.js';
import { L, el, action, field, check, line, workshop } from './ui.js';
import { xorProcess } from './xor-process.js';

const modes = [
  { id: 'free', title: L('Два письма, один ключ', 'Two letters, one pad'),
    text: L('Алиса прячет каждое письмо под случайной маской: каждый бит складывается с битом ключа по XOR. Боб снимает маску тем же действием. Посмотрите глазами Евы: у неё есть копии конвертов, но нет ключа. Выберите байт и сравните два письма.', 'Alice hides each letter under a random pad: each message bit is XORed with a key bit. Bob removes it by doing the same operation. Look through Eve’s eyes: she has copies of the envelopes, but no key. Select a byte and compare the letters.') },
  { id: 'recover', title: L('Прочитайте начало второго письма', 'Read the second letter’s opening'),
    text: L('Ева перехватила два письма с одним ключом. Из расписания встреч она знает: первое начинается с MEET. Секретный ключ ей неизвестен. Используйте известные четыре буквы, чтобы восстановить первые четыре буквы второго письма.', 'Eve intercepted two letters using the same pad. From a meeting schedule she knows the first starts with MEET. She does not know the pad. Use those four known letters to recover the first four letters of the second message.'),
    goal: L('Вычислите начало второго письма и введите ответ.', 'Compute and enter the second letter’s opening.'),
    after: L('Известный фрагмент одного письма раскрыл фрагмент другого. Остаток сообщений не восстановлен: осмысленная догадка сама по себе ещё не доказательство.', 'A known fragment of one letter exposed a fragment of the other. The remaining messages are still unknown: a plausible guess alone is not a proof.') },
  { id: 'repair', title: L('Уберите причину утечки', 'Remove the cause of the leak'),
    text: L('Длина ключа равна длине письма. Выберите, как Алисе шифровать второе письмо, затем проверьте исправление. Для одноразового блокнота нужна новая независимая равномерная маска на каждое сообщение; её заранее безопасно передают Бобу.', 'The pad is as long as the letter. Choose how Alice should encrypt her second letter, then check the repair. A one-time pad needs a new independent uniform pad for each message, securely shared with Bob beforehand.'),
    goal: L('Уберите повтор маски. Объясните, какой член больше не сокращается.', 'Remove pad reuse. Identify the term that no longer cancels.'),
    after: L('Теперь C₁ ⊕ C₂ = M₁ ⊕ M₂ ⊕ K₁ ⊕ K₂. У Евы остался неизвестный случайный член. В потоковых шифрах повтор nonce с тем же ключом тоже может повторить поток ключевых байтов.', 'Now C₁ ⊕ C₂ = M₁ ⊕ M₂ ⊕ K₁ ⊕ K₂. Eve is left with an unknown random term. In stream ciphers, repeating a nonce with the same key can also repeat the keystream.') },
  { id: 'why', kind: 'proof', title: L('Почему ключ исчезает', 'Why the pad disappears'),
    statement: L('XOR — сложение битов по модулю 2.', 'XOR is addition of bits modulo 2.'),
    slides: [
      { title: L('Две одинаковые маски', 'Two identical masks'), text: L('Письма: $C_1=M_1\\oplus K$ и $C_2=M_2\\oplus K$. Нажмите на байт: ниже видны его восемь битов. У XOR только четыре случая: $0\\oplus0=0$, $1\\oplus1=0$, $0\\oplus1=1$, $1\\oplus0=1$.', 'The letters are $C_1=M_1\\oplus K$ and $C_2=M_2\\oplus K$. Select a byte to see its eight bits. XOR has just four cases: $0\\oplus0=0$, $1\\oplus1=0$, $0\\oplus1=1$, $1\\oplus0=1$.') },
      { title: L('Переставим слагаемые', 'Rearrange the terms'), text: L('XOR ассоциативен и коммутативен, поэтому $(M_1\\oplus K)\\oplus(M_2\\oplus K)=M_1\\oplus M_2\\oplus(K\\oplus K)$. Каждый бит ключа встречается дважды и даёт ноль.', 'XOR is associative and commutative, so $(M_1\\oplus K)\\oplus(M_2\\oplus K)=M_1\\oplus M_2\\oplus(K\\oplus K)$. Every key bit appears twice and gives zero.') },
      { title: L('Что узнала Ева', 'What Eve learned'), text: L('Осталось $D=M_1\\oplus M_2$. Если фрагмент $M_1$ известен, то $D\\oplus M_1=M_2$ на том же месте. Без дополнительной информации это связь между двумя неизвестными, а не готовая расшифровка обоих писем.', 'What remains is $D=M_1\\oplus M_2$. If a fragment of $M_1$ is known, then $D\\oplus M_1=M_2$ at that position. Without additional information this is a relation between two unknowns, not a complete decryption of both letters.') },
    ] },
];

export default {
  modes,
  mount(ui) {
    const w = workshop(ui, { next: 'crypto-tamper', title: L('Снимите повторную маску', 'Lift the reused mask'), links: [['mod', L('Остатки и XOR', 'Remainders and XOR')]], sources: [['https://www.rfc-editor.org/rfc/rfc8439.html#section-4', 'RFC 8439 · nonce']], note: L('Исходные сообщения — ASCII: один символ = один байт. Переключение битов может дать непечатный байт (·). Ключи генерируются в браузере. Это модель одноразового блокнота.', 'Initial messages use ASCII: one character = one byte. Flipping bits may produce a non-printable byte (·). Pads are generated in your browser. This is a one-time-pad model.') });
    let mode = 'free', m1, m2, k1, k2, c1, c2, fresh = false, eve = false, selected = 0, guess = '', offset = 0, proof = 0;
    let table, bitbox, fragment, result, sender;
    let pair = false, decrypt = false;
    const process = xorProcess((row, bit) => {
      if (mode !== 'free' || eve || pair) return;
      if (row === 0) m1[selected] ^= 1 << bit;
      else k1[selected] ^= 1 << bit;
      c1 = xor(m1, k1); c2 = xor(m2, k2); drawBytes(); story(true);
    });
    w.process(process);
    const init = () => { m1 = bytes('MEET AT NINE'); m2 = bytes('SEND AT NOON'); k1 = randomPad(m1.length); k2 = fresh ? randomPad(m2.length) : k1; c1 = xor(m1, k1); c2 = xor(m2, k2); };
    function story(send = false) {
      w.story({ attack: true, multiple: true, sent: 'C₁', alice: L('Два письма Бобу', 'Two letters for Bob'), bob: L('Снял маску ключом', 'Removed the pad'),
        caption: eve ? L('Вы — Ева. Видны только шифротексты и явно известный фрагмент; ключа у вас нет.', 'You are Eve. Only ciphertexts and the explicitly known fragment are visible; you do not have the pad.') : L('Алиса и Боб заранее разделили секретные маски. Ева может скопировать всё, что идёт по сети.', 'Alice and Bob shared secret pads beforehand. Eve can copy everything that crosses the network.') }, send);
    }
    function drawBytes() {
      table.replaceChildren();
      const rows = eve ? [['C₁', c1], ['C₂', c2], ['C₁ ⊕ C₂', xor(c1, c2)]] : [['M₁', m1], ['K₁', k1], ['C₁', c1], ['M₂', m2], [fresh ? 'K₂' : 'K₁', k2], ['C₂', c2]];
      for (const [label, data] of rows) {
        const row = el('div', 'crypto-byte-row'); row.append(el('span', 'crypto-row-name', label));
        const cells = el('div', 'crypto-byte-cells');
        data.forEach((b, i) => {
          const cell = action(b.toString(16).padStart(2, '0'), () => { selected = i; drawBytes(); });
          cell.className = `crypto-byte${i === selected ? ' selected' : ''}${i >= offset && i < offset + guess.length ? ' crib-range' : ''}`;
          cell.setAttribute('aria-label', `${label}, ${t(L('байт', 'byte'))} ${i + 1}: ${b}`);
          cell.setAttribute('aria-pressed', String(i === selected)); cells.append(cell);
        }); row.append(cells); table.append(row);
      }
      bitbox.replaceChildren(el('h3', '', L(`Байт ${selected + 1}: что видит ${eve ? 'Ева' : 'наблюдатель'}`, `Byte ${selected + 1}: what ${eve ? 'Eve' : 'the observer'} sees`)));
      for (const [label, v] of [['C₁', c1[selected]], ['C₂', c2[selected]], ['⊕', c1[selected] ^ c2[selected]]]) {
        const row = el('div', 'crypto-bit-row'); row.append(el('span', '', label));
        for (const bit of v.toString(2).padStart(8, '0')) row.append(el('span', bit === '1' ? 'one' : 'zero', bit));
        bitbox.append(row);
      }
      bitbox.append(el('p', 'crypto-equation', fresh ? 'C₁ ⊕ C₂ = M₁ ⊕ M₂ ⊕ K₁ ⊕ K₂' : proof === 1 ? '(M₁ ⊕ K) ⊕ (M₂ ⊕ K) = M₁ ⊕ M₂ ⊕ (K ⊕ K)' : 'C₁ ⊕ C₂ = M₁ ⊕ M₂'));
      if (!eve) {
        sender.replaceChildren(el('p', 'crypto-plaintext', `M₁: ${printable(m1)}\nM₂: ${printable(m2)}`));
      }
      process.set(pair || eve ? { a: c1[selected], b: c2[selected], labels: ['C₁', 'C₂', 'D'], pair: true, fresh, editable: false }
        : { a: decrypt ? c1[selected] : m1[selected], b: k1[selected], labels: decrypt ? ['C₁', 'K₁', 'M₁'] : ['M₁', 'K₁', 'C₁'], pair: false, fresh, editable: true });
      w.refresh();
      showCrib();
    }
    function showCrib() {
      try {
        result.textContent = guess ? printable(crib(c1, c2, guess, offset)) : '····';
        fragment.textContent = guess ? t(L(`Если M₁[${offset + 1}…${offset + guess.length}] = «${guess}», то фрагмент M₂:`, `If M₁[${offset + 1}…${offset + guess.length}] = “${guess}”, the M₂ fragment is:`)) : t(L('Введите известный или предполагаемый фрагмент первого письма.', 'Enter a known or guessed fragment of the first letter.'));
      } catch { result.textContent = '—'; fragment.textContent = t(L('Нужны печатные ASCII-символы; фрагмент должен помещаться в письмо.', 'Use printable ASCII; the fragment must fit inside the letter.')); }
    }
    function build() {
      w.experiment.replaceChildren();
      if (mode === 'free') {
        const view = check(L('Глазами Евы: скрыть письма и ключ', 'Eve’s view: hide letters and pad'), eve, v => { eve = v; build(); story(); });
        w.experiment.append(view.el);
      }
      sender = el('div'); if (!eve) w.experiment.append(sender);
      table = el('div', 'crypto-byte-table'); bitbox = el('div', 'crypto-bits');
      const inspect = el('details', 'crypto-inspect');
      inspect.append(el('summary', '', L('Внутри конвертов: байты и биты', 'Inside the envelopes: bytes and bits')), table,
        el('p', 'crypto-micro', L('Числа записаны в hex. Нажмите на байт, чтобы раскрыть его биты.', 'Numbers are hexadecimal. Select a byte to reveal its bits.')), bitbox);
      const cancel = el('div', 'crypto-cancel-demo');
      cancel.innerHTML = `<div class="crypto-cancel-card"><span>C₁</span><strong>M₁</strong><b class="crypto-pad">⊕ K₁</b></div><span class="crypto-xor-symbol">⊕</span><div class="crypto-cancel-card"><span>C₂</span><strong>M₂</strong><b class="crypto-pad">⊕ ${fresh ? 'K₂' : 'K₁'}</b></div>`;
      const cancelResult = el('output', 'crypto-equation');
      const combine = action(L('Сложить перехваты: что останется?', 'XOR the intercepts: what remains?'), () => {
        pair = true; drawBytes(); story(true);
        cancelResult.textContent = fresh ? t(L('K₁ и K₂ разные. Неизвестная маска K₁ ⊕ K₂ осталась.', 'K₁ and K₂ differ. The unknown pad K₁ ⊕ K₂ remains.')) : t(L('K₁ ⊕ K₁ = 0: одинаковая маска сократилась. Осталось M₁ ⊕ M₂.', 'K₁ ⊕ K₁ = 0: the identical pad cancelled. M₁ ⊕ M₂ remains.'));
      });
      if (mode === 'free') w.experiment.append(line(action(L('Показать шифрование M ⊕ K', 'Show encryption M ⊕ K'), () => { pair = decrypt = false; drawBytes(); story(true); }), action(L('Снять маску C ⊕ K', 'Remove pad C ⊕ K'), () => { pair = false; decrypt = true; drawBytes(); story(true); })));
      w.experiment.append(cancel, combine, cancelResult);

      if (mode === 'recover') w.experiment.append(el('p', 'crypto-known', L('Известный фрагмент M₁: MEET, позиция 1.', 'Known M₁ fragment: MEET, position 1.')));
      const input = field(L('Фрагмент первого письма', 'Fragment of the first letter'), { value: guess, maxLength: 12, name: 'crib', onInput: v => { guess = v; drawBytes(); } });
      const pos = field(L('Начало фрагмента (номер байта)', 'Fragment start (byte number)'), { type: 'number', min: 1, max: 12, value: offset + 1, name: 'offset', onInput: v => { offset = v - 1; drawBytes(); } });
      fragment = el('p', 'crypto-micro'); result = el('output', 'crypto-decoded');
      w.experiment.append(line(input.el, pos.el), fragment, result, el('p', 'crypto-micro', L('«·» означает непечатный байт. Правдоподобный текст не подтверждает догадку автоматически.', '“·” means a non-printable byte. Plausible text does not automatically confirm a guess.')));
      if (mode === 'recover') {
        const answer = field(L('Ваш ответ: первые 4 буквы M₂', 'Your answer: first 4 letters of M₂'), { maxLength: 4, name: 'answer' });
        w.experiment.append(line(answer.el, action(L('Проверить', 'Check'), () => {
          if (answer.input.value === 'SEND') ui.solve(mode);
          else ui.status(t(L('Примените XOR к двум перехватам, затем ещё раз к известному MEET. Ключ угадывать не нужно.', 'XOR the two intercepts, then XOR the result with the known MEET. You do not need to guess the pad.')), 'fail');
        }, true)));
      }
      if (mode === 'free' || mode === 'repair') {
        const f = check(L('Новая независимая маска для второго письма', 'New independent pad for the second letter'), fresh, v => { fresh = v; k2 = fresh ? randomPad(m2.length) : k1; c2 = xor(m2, k2); drawBytes(); cancel.querySelectorAll('.crypto-pad')[1].textContent = fresh ? '⊕ K₂' : '⊕ K₁'; cancelResult.textContent = ''; story(true); });
        w.experiment.append(f.el);
        if (mode === 'repair') {
          const why = field(L('Какой член остался неизвестным Еве?', 'Which term is still unknown to Eve?'), { name: 'reason' });
          const select = el('select'); select.setAttribute('aria-label', t(L('Неизвестный член', 'Unknown term')));
          for (const v of ['', 'K₁ ⊕ K₂', 'M₁ ⊕ M₁', '0']) { const o = el('option', '', v || L('Выберите…', 'Choose…')); o.value = v; select.append(o); }
          why.input.replaceWith(select);
          w.experiment.append(line(why.el, action(L('Проверить исправление', 'Check repair'), () => {
            if (fresh && select.value === 'K₁ ⊕ K₂') ui.solve(mode);
            else ui.status(t(L('Проверьте обе части: маски должны быть независимыми; в XOR двух перехватов должен остаться неизвестный член.', 'Check both parts: pads must be independent, and XORing the two intercepts must leave an unknown term.')), 'fail');
          }, true)));
        }
      }
      w.experiment.append(inspect);
      drawBytes();
    }
    return {
      setMode(id) { mode = id; fresh = false; eve = id !== 'free'; selected = 0; guess = ''; offset = 0; proof = 0; pair = id !== 'free'; decrypt = false; init(); build(); story(); },
      slide(k) { proof = k; drawBytes(); },
      dispose() { w.dispose(); },
    };
  },
};
