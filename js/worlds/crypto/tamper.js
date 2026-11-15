import { t } from '../../core/i18n.js';
import { bytes, xor, randomPad, printable, hex, hmac, sameBytes } from './math.js';
import { L, el, action, check, line, workshop } from './ui.js';

const modes = [
  { id: 'free', title: L('Закрытое письмо можно изменить', 'A sealed letter can be changed'),
    text: L('Алиса отправляет платёжную инструкцию PAY BOB 100. Ева знает формат, но не ключ. Она может перевернуть биты перехваченного шифротекста. Нажмите на бит и доставьте письмо: что прочитает Боб?', 'Alice sends the payment instruction PAY BOB 100. Eve knows the format but not the key. She can flip bits of the intercepted ciphertext. Toggle a bit and deliver the letter: what will Bob read?') },
  { id: 'forge', title: L('Измените сумму, не зная ключа', 'Change the amount without the key'),
    text: L('Вам доступен байт первой цифры суммы. Сделайте так, чтобы Боб принял PAY BOB 900. Ключ нигде не показывается. Переворот бита шифротекста переворачивает тот же бит расшифрованного письма.', 'You control the byte containing the first digit of the amount. Make Bob accept PAY BOB 900. The key is never shown. Flipping a ciphertext bit flips the same bit of the decrypted letter.'),
    goal: L('Боб должен принять 900 вместо 100.', 'Bob must accept 900 instead of 100.'),
    after: L('C′ = C ⊕ Δ, поэтому M′ = C′ ⊕ K = M ⊕ Δ. Секретность сообщения не гарантирует его целостность.', 'C′ = C ⊕ Δ, so M′ = C′ ⊕ K = M ⊕ Δ. Message secrecy does not guarantee integrity.') },
  { id: 'protect', title: L('Научите Боба отвергать подмену', 'Teach Bob to reject tampering'),
    text: L('Добавьте тег подлинности. Здесь HMAC-SHA-256 вычисляется настоящим Web Crypto по всему шифротексту с отдельным секретным ключом. Боб сначала проверяет тег и только затем открывает письмо. Ева может изменить письмо, но не вычислить новый корректный тег.', 'Add an authentication tag. Here real Web Crypto computes HMAC-SHA-256 over the whole ciphertext using a separate secret key. Bob checks the tag before opening the letter. Eve can change the letter but cannot compute a new valid tag.'),
    goal: L('Включите проверку. Доставьте сначала исходное письмо, затем изменённое: первое должно пройти, второе — нет.', 'Enable verification. Deliver an original letter and then a modified one: the first must pass and the second must fail.'),
    after: L('Проверена целостность с общим секретом. Это MAC, а не публично проверяемая цифровая подпись. В реальных системах часто используют готовую схему AEAD, объединяющую шифрование и аутентификацию.', 'This checks integrity using a shared secret. It is a MAC, not a publicly verifiable digital signature. Real systems often use an AEAD construction combining encryption and authentication.') },
];
export default {
  modes,
  mount(ui) {
    const w = workshop(ui, { next: 'crypto-mitm', title: L('Монтажный стол Евы', 'Eve’s editing desk'), sources: [['https://www.rfc-editor.org/rfc/rfc8439.html', 'RFC 8439 · AEAD']], links: [['mod', L('Сложение по модулю 2', 'Addition modulo 2')]], note: L('Учебное XOR-шифрование + настоящий HMAC-SHA-256. Не готовый протокол для реальной переписки.', 'Teaching XOR encryption + real HMAC-SHA-256. Not a production messaging protocol.') });
    const original = bytes('PAY BOB 100'), at = 8;
    let mode, c, key, authKey, delta = 0, authenticated = false, passed = false, rejected = false, alive = true, job = 0;
    let bits, receipt, equation, change, tagEl;
    function redraw() {
      bits.replaceChildren();
      for (let bit = 7; bit >= 0; bit--) {
        const b = action(String((delta >> bit) & 1), () => { delta ^= 1 << bit; redraw(); });
        b.className = `crypto-bit-button${delta & (1 << bit) ? ' on' : ''}`;
        b.setAttribute('aria-label', `${t(L('Перевернуть бит', 'Flip bit'))} ${bit}`); b.setAttribute('aria-pressed', String(!!(delta & (1 << bit)))); bits.append(b);
      }
      equation.textContent = `Δ = ${delta.toString(2).padStart(8, '0')} (${delta})`;
      change.textContent = `0x${c[at].toString(16).padStart(2, '0')} ⊕ 0x${delta.toString(16).padStart(2, '0')} = 0x${(c[at] ^ delta).toString(16).padStart(2, '0')}`;
    }
    async function deliver(clean = false) {
      const token = ++job, d = clean ? 0 : delta, useAuth = authenticated;
      const changed = Uint8Array.from(c); changed[at] ^= d;
      receipt.textContent = t(L('Боб проверяет конверт…', 'Bob is inspecting the envelope…'));
      try {
        const tag = await hmac(authKey, c), calculated = await hmac(authKey, changed);
        if (!alive || token !== job) return;
        const accepted = !useAuth || sameBytes(tag, calculated);
        tagEl.textContent = useAuth ? `HMAC: ${hex(tag.slice(0, 8))}…` : t(L('Тега подлинности нет', 'No authentication tag'));
        const decoded = accepted ? printable(xor(changed, key)) : null;
        receipt.textContent = accepted ? `${t(L('Боб принял', 'Bob accepted'))}: ${decoded}` : t(L('Боб отклонил письмо: тег не совпал. Расшифровки нет.', 'Bob rejected the letter: tag mismatch. Nothing is decrypted.'));
        receipt.className = `crypto-receipt ${accepted ? 'accepted' : 'rejected'}`;
        w.story({ attack: d !== 0, substitute: d !== 0, sent: '100', forwarded: accepted ? (decoded?.slice(-3) || 'C′') : 'C′', blocked: !accepted, alice: L('Отправила PAY BOB 100', 'Sent PAY BOB 100'), bob: accepted ? L('Принял письмо', 'Accepted the letter') : L('Подмена отклонена', 'Tampering rejected'), caption: accepted ? L(`В руках Боба: ${decoded}. Проверка подлинности ${useAuth ? 'включена' : 'выключена'}.`, `Bob received: ${decoded}. Authentication is ${useAuth ? 'on' : 'off'}.`) : L('Боб заметил изменение до открытия письма. Ева сохранила старый тег, но байты уже другие.', 'Bob detected a change before opening the letter. Eve kept the old tag, but the bytes are different.') }, true);
        if (mode === 'forge' && accepted && decoded === 'PAY BOB 900') ui.solve(mode);
        if (mode === 'protect' && useAuth) { passed ||= accepted && d === 0; rejected ||= !accepted && d !== 0; if (passed && rejected) ui.solve(mode); }
      } catch { if (alive && token === job) receipt.textContent = t(L('Web Crypto недоступен. Откройте сайт через HTTPS или localhost.', 'Web Crypto is unavailable. Open the site over HTTPS or localhost.')); }
    }
    function build() {
      w.experiment.replaceChildren(el('p', 'crypto-known', L('Известный формат: PAY BOB 100. Меняем первый байт суммы, ключ скрыт.', 'Known format: PAY BOB 100. Edit the first byte of the amount; the key stays hidden.')));
      bits = el('div', 'crypto-bit-buttons'); equation = el('p', 'crypto-equation'); change = el('code', 'crypto-equation');
      receipt = el('output', 'crypto-receipt', L('Письмо ещё не доставлено.', 'The letter has not been delivered yet.')); tagEl = el('code', 'crypto-micro');
      const f = check(L('Проверять HMAC до расшифровки', 'Verify HMAC before decryption'), authenticated, v => { authenticated = v; passed = rejected = false; job++; receipt.textContent = t(L('Доставьте письмо с новой настройкой.', 'Deliver a letter with the new setting.')); });
      w.experiment.append(el('h3', '', L('Какие биты перевернуть?', 'Which bits should Eve flip?')), bits, equation, change, f.el,
        line(action(L('Доставить изменённое', 'Deliver modified'), () => deliver(), true), action(L('Доставить исходное', 'Deliver original'), () => deliver(true)), action(L('Убрать изменения', 'Clear edits'), () => { delta = 0; redraw(); })), tagEl, receipt,
        el('p', 'crypto-micro', 'M′ = (M ⊕ K ⊕ Δ) ⊕ K = M ⊕ Δ'));
      redraw();
    }
    return { setMode(id) { job++; mode = id; key = randomPad(original.length); authKey = randomPad(32); c = xor(original, key); delta = 0; authenticated = false; passed = rejected = false; build(); w.story({ attack: true, caption: L('Ева меняет конверт по дороге. Нажмите биты ниже, затем доставьте письмо Бобу.', 'Eve edits the envelope in transit. Toggle bits below, then deliver the letter to Bob.') }); }, dispose() { alive = false; job++; w.dispose(); } };
  },
};
