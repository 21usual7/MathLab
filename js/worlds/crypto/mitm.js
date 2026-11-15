import { t } from '../../core/i18n.js';
import { exchange, sign, verify, multiply } from './math.js';
import { exchangeProcess } from './exchange-process.js';
import { L, el, action, check, field, line, workshop, output } from './ui.js';

const modes = [
  { id: 'free', title: L('Секрет возникает на двух концах', 'A secret appears at both ends'),
    text: L('Алиса и Боб выбирают секретные числа и обмениваются публичными степенями. Обычный наблюдатель видит A и B. Переключите Еву из наблюдателя в посредника: вместо пересылки чужой степени она отправит каждому свою.', 'Alice and Bob choose secret numbers and exchange public powers. An observer sees A and B. Switch Eve from observer to intermediary: instead of forwarding each public power, she sends her own to each person.') },
  { id: 'intercept', title: L('Два секрета вместо одного', 'Two secrets instead of one'),
    text: L('Ева может задерживать и заменять сообщения в сети, но ей не сообщают секреты Алисы и Боба. Подмените обмен, а затем укажите два ключа: для разговора Евы с Алисой и для разговора Евы с Бобом.', 'Eve can delay and replace network messages, but Alice’s and Bob’s secrets are not given to her. Substitute the exchange, then enter Eve’s key for talking to Alice and her key for talking to Bob.'),
    goal: L('Организуйте подмену и найдите оба ключа Евы.', 'Substitute the exchange and find both of Eve’s keys.'),
    after: L('Ева не решала дискретный логарифм. Алиса вычислила секрет с Евой, думая, что это Боб; Боб — наоборот. Ева может расшифровывать и заново шифровать сообщения между ними.', 'Eve never solved a discrete logarithm. Alice shared a secret with Eve while believing she was Bob, and Bob did the converse. Eve can decrypt and re-encrypt messages between them.') },
  { id: 'authenticate', title: L('Кто подписал обмен?', 'Who signed the exchange?'),
    text: L('У каждого уже есть доверенный открытый ключ подписи собеседника. Подпишем публичные значения обмена: чужую степень нельзя незаметно выдать за подписанную Бобом. Это учебная проверка отдельных значений; реальный протокол связывает подпись с контекстом всего обмена.', 'Each person already has a trusted signing public key for the other. Sign the public exchange values: a substitute cannot silently be passed off as signed by Bob. This teaching model checks individual values; real protocols bind signatures to the full handshake context.'),
    goal: L('Включите проверку подписей. Проверьте обычный обмен и обмен с подменой.', 'Enable signature checks. Test an honest exchange and a substituted exchange.'),
    after: L('Проверять подпись нужно по заранее доверенному ключу. Если Ева может заменить и этот ключ, проверка подписи подмену не устраняет. В TLS доверие связывают с именем сервера и цепочкой сертификатов.', 'Signatures must be checked with an already trusted key. If Eve can substitute that key too, signature verification does not solve the problem. TLS binds trust to the server name and a certificate chain.') },
];

export default {
  modes,
  mount(ui) {
    const w = workshop(ui, { next: 'crypto-hashes', title: L('Кто на другом конце?', 'Who is at the other end?'), sources: [['https://www.rfc-editor.org/rfc/rfc8446.html#section-4.4.3', 'RFC 8446 · CertificateVerify']], links: [['dh', L('Как работает DH', 'How DH works')], ['ecc', L('Эллиптические кривые', 'Elliptic curves')]], note: L('Учебные DH: p = 23, g = 5; ECDSA: порядок 37. Такие размеры легко перебираются. Здесь изучается подмена, не стойкость параметров.', 'Teaching DH: p = 23, g = 5; ECDSA order 37. These sizes are easy to brute-force. This lab studies substitution, not parameter strength.') });
    const process = exchangeProcess(); w.process(process);
    let mode, attack = false, authenticated = false, a = 6, b = 15, testedHonest = false, testedAttack = false;
    let cards, wire, result, fAttack, fAuth;
    const aSecret = 9, bSecret = 14;
    function state() {
      const s = exchange({ a, b, attack });
      // Fixed nonces selected to give nonzero r,s for each public value; these tiny signatures only illustrate authentication.
      const signature = (z, secret) => { for (let k = 2; k < 37; k++) { try { return sign(z, secret, k); } catch {} } };
      const sigA = signature(s.A, aSecret), sigB = signature(s.B, bSecret);
      const valid = verify(s.toBob, sigA, multiply(aSecret)) && verify(s.toAlice, sigB, multiply(bSecret));
      return { ...s, valid, accepted: !authenticated || valid };
    }
    function redraw() {
      const s = state();
      process.set({s,attack,authenticated,hideKeys:mode==='intercept'});
      cards.replaceChildren(); wire.replaceChildren();
      cards.append(output(L('Алиса получила', 'Alice received'), `B = ${s.toAlice}`), output(L('Боб получил', 'Bob received'), `A = ${s.toBob}`));
      if (s.accepted) cards.append(output(L('Ключ Алисы', 'Alice’s key'), mode === 'intercept' ? '?' : s.alice), output(L('Ключ Боба', 'Bob’s key'), mode === 'intercept' ? '?' : s.bob));
      else cards.append(el('p', 'crypto-known', L('Обмен остановлен: подпись подменённого значения не прошла проверку.', 'Exchange stopped: the substituted value failed signature verification.')));
      wire.append(el('p', 'crypto-equation', `A = 5^${mode === 'intercept' ? 'a' : a} mod 23 = ${s.A}; B = 5^${mode === 'intercept' ? 'b' : b} mod 23 = ${s.B}`));
      if (attack) wire.append(el('p', 'crypto-equation', `E₁ = 5³ mod 23 = 10; E₂ = 5⁷ mod 23 = 17`),
        el('p', 'crypto-micro', L('Ева отправила Алисе E₁, Бобу E₂. Её собственные секреты: e₁ = 3, e₂ = 7.', 'Eve sent E₁ to Alice and E₂ to Bob. Her own secrets are e₁ = 3, e₂ = 7.')));
      w.story({ attack, substitute: attack, sent: 'A', forwarded: 'E₂', blocked: !s.accepted, alice: L('Отправляет публичное A', 'Sends public A'), bob: s.accepted ? L('Обмен принят', 'Exchange accepted') : L('Подпись неверна', 'Invalid signature'), caption: !s.accepted ? L('Подмена обнаружена. Алиса и Боб не продолжают переписку.', 'Substitution detected. Alice and Bob do not continue the conversation.') : attack ? L('Ева за двумя столами сразу: для Алисы она изображает Боба, для Боба — Алису.', 'Eve sits at two desks at once: she plays Bob to Alice, and Alice to Bob.') : L('Публичные числа идут через сеть. Секретные показатели остаются у Алисы и Боба.', 'Public numbers cross the network. Secret exponents stay with Alice and Bob.') });
    }
    function run() {
      redraw(); const s = state();
      w.story({ attack, substitute: attack, sent: 'A', forwarded: 'E₂', blocked: !s.accepted, caption: !s.accepted ? L('Боб отвергает подмену: доверенный ключ не подтверждает полученные данные.', 'Bob rejects the substitution: the trusted key does not authenticate the received data.') : attack ? L('Два разговора с Евой. Алиса и Боб приняли её публичные значения.', 'Two conversations with Eve. Alice and Bob accepted her public values.') : L('Честный обмен завершён: оба получили одинаковый секрет.', 'The honest exchange finished: both obtained the same secret.') }, true);
      result.textContent = !s.accepted ? t(L('Подмена остановлена до передачи сообщения.', 'Substitution stopped before message transmission.')) : attack ? t(L('Ева может вычислить A³ mod 23 и B⁷ mod 23.', 'Eve can compute A³ mod 23 and B⁷ mod 23.')) : `${s.alice} = ${s.bob}`;
      if (mode === 'authenticate' && authenticated) {
        testedHonest ||= !attack && s.accepted; testedAttack ||= attack && !s.accepted;
        if (testedHonest && testedAttack) ui.solve(mode);
      }
    }
    function build() {
      w.experiment.replaceChildren();
      fAttack = check(L('Ева подменяет публичные значения', 'Eve substitutes the public values'), attack, v => { attack = v; redraw(); });
      fAuth = check(L('Проверять подписи по доверенным ключам', 'Verify signatures with trusted keys'), authenticated, v => { authenticated = v; testedHonest = testedAttack = false; redraw(); });
      w.experiment.append(fAttack.el, fAuth.el);
      if (mode === 'free') {
        const fa = field(L('Секрет Алисы a', 'Alice’s secret a'), { type: 'range', min: 2, max: 20, step: 1, value: a, onInput: v => { a = v; redraw(); } });
        const fb = field(L('Секрет Боба b', 'Bob’s secret b'), { type: 'range', min: 2, max: 20, step: 1, value: b, onInput: v => { b = v; redraw(); } });
        w.experiment.append(line(fa.el, fb.el));
      }
      wire = el('div'); cards = el('div', 'crypto-card-grid'); result = el('output', 'crypto-receipt');
      w.experiment.append(wire, cards, action(L('Провести обмен', 'Run exchange'), run, true), result);
      if (mode === 'intercept') {
        const x = field(L('Ключ Евы с Алисой', 'Eve’s key with Alice'), { type: 'number', min: 0, max: 22, name: 'alice-key' });
        const y = field(L('Ключ Евы с Бобом', 'Eve’s key with Bob'), { type: 'number', min: 0, max: 22, name: 'bob-key' });
        w.experiment.append(line(x.el, y.el), action(L('Проверить ключи', 'Check keys'), () => {
          const s = state();
          if (attack && s.accepted && x.input.value !== '' && y.input.value !== '' && +x.input.value === s.eveAlice && +y.input.value === s.eveBob) ui.solve(mode);
          else ui.status(t(L('Нужен принятый обмен с подменой. Возведите настоящее публичное A в секрет Евы 3, а B — в 7, по модулю 23.', 'You need an accepted substituted exchange. Raise the real public A to Eve’s secret 3, and B to 7, modulo 23.')), 'fail');
        }, true));
      }
      redraw();
    }
    return { setMode(id) { mode = id; a = 6; b = 15; attack = authenticated = testedHonest = testedAttack = false; build(); }, dispose() { w.dispose(); } };
  },
};
