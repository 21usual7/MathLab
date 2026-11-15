import { t } from '../../core/i18n.js';
import { runChannel } from './math.js';
import { L, el, action, check, line, workshop } from './ui.js';

const modes = [
  { id: 'free', title: L('Соберите переписку', 'Assemble a conversation'),
    text: L('Шифрование уже есть. Добавляйте остальные механизмы и проверяйте их против конкретных действий Евы. В каждом тесте создаётся отдельный учебный сеанс. Буквы и суммы действительно шифруются и проверяются в браузере; результат не задан заранее картинкой.', 'Encryption is already present. Add the other mechanisms and test them against specific actions by Eve. Each test creates a separate teaching session. Letters and amounts are actually encrypted and checked in your browser; the outcome is not a preset picture.') },
  { id: 'secure', title: L('Переживите все пять атак', 'Survive all five attacks'),
    text: L('Ева умеет слушать сеть, искать повтор потока ключевых байтов, подменять обмен DH, менять платёж и повторять старый платёж. Подберите защиту и запустите весь набор проверок. Механизмы должны работать вместе.', 'Eve can listen, exploit repeated keystreams, substitute the DH exchange, modify a payment and replay an old payment. Choose defenses and run the whole test suite. The mechanisms must work together.'),
    goal: L('Все пять проверок должны пройти на одной конфигурации.', 'All five checks must pass under one configuration.'),
    after: L('Проверены именно показанные атаки. Это ещё не доказательство безопасности протокола. Реальный протокол также определяет форматы, разделение ключей, контекст подписей, обработку ошибок и многое другое.', 'These tests cover only the attacks shown. They are not a security proof. A real protocol also specifies formats, key separation, signature context, error handling and much more.') },
  { id: 'minimal', title: L('Зачем нужен каждый механизм?', 'Why is every mechanism needed?'),
    text: L('Включите все механизмы и убедитесь, что проверки проходят. Затем выключите один механизм, запустите проверки и найдите открывшуюся атаку. Повторите для каждого из четырёх механизмов. Исследуйте необходимость каждого условия.', 'Enable every mechanism and check that the tests pass. Then disable one mechanism, run the tests and find the attack it enables. Repeat for each of the four mechanisms. Investigate why each condition is needed.'),
    goal: L('Сначала рабочая конфигурация, затем четыре опыта: выключен ровно один механизм.', 'First a working configuration, then four experiments with exactly one mechanism disabled.'),
    after: L('Теперь у каждого требования есть конкретная причина и воспроизводимый контрпример при его удалении.', 'Each requirement now has a specific reason and a reproducible counterexample when it is removed.') },
];
const defenses = [
  ['fresh', L('Не повторять поток ключевых байтов', 'Never reuse keystream blocks')],
  ['identity', L('Проверять обмен по доверенному ключу', 'Authenticate exchange with a trusted key')],
  ['integrity', L('Проверять HMAC до расшифровки', 'Verify HMAC before decryption')],
  ['sequence', L('Отсекать повтор номера сообщения', 'Reject repeated message numbers')],
];
const attacks = [
  ['listen', L('Подслушать', 'Eavesdrop')], ['reuse', L('Сократить общий поток', 'Cancel reused keystream')],
  ['mitm', L('Подменить обмен', 'Substitute exchange')], ['tamper', L('Изменить 100 на 900', 'Change 100 to 900')], ['replay', L('Повторить платёж', 'Replay payment')],
];
const reasons = {
  encrypted: L('В перехвате шифротекст; ключ не раскрыт этой атакой.', 'The intercept contains ciphertext; this attack did not reveal the key.'),
  fresh: L('Блоки потока не повторились: сокращения общего потока нет.', 'Keystream blocks differ: no shared stream cancels.'),
  reuse: L('Повтор потока раскрыл второе сообщение из известного первого.', 'Keystream reuse exposed the second message using the known first message.'),
  identity: L('Подпись подменённого DH-значения не прошла проверку.', 'The substituted DH share failed signature verification.'),
  mitm: L('Ева прочитала письмо и заново зашифровала для Боба.', 'Eve read the letter and re-encrypted it for Bob.'),
  integrity: L('HMAC не совпал; Боб не расшифровал изменённое письмо.', 'HMAC mismatch; Bob did not decrypt the altered letter.'),
  tamper: L('Боб принял сумму 900 вместо 100.', 'Bob accepted 900 instead of 100.'),
  sequence: L('Боб уже видел этот номер; повтор отвергнут.', 'Bob has already seen this number; replay rejected.'),
  replay: L('Старый платёж принят повторно. Без MAC Ева может также поменять номер.', 'The old payment was accepted again. Without a MAC Eve can also change the number.'),
};
export default {
  modes,
  mount(ui) {
    const w = workshop(ui, { title: L('Защитите разговор', 'Protect the conversation'), sources: [['https://www.rfc-editor.org/rfc/rfc8446.html', 'RFC 8446 · TLS 1.3']], links: [['dh', L('Обмен ключами', 'Key exchange')]], note: L('Учебная сборка: DH mod 23 → разделённые ключи → AES-CTR + HMAC-SHA-256. Это не TLS и не безопасный протокол для применения: маленький DH перебирается.', 'Teaching construction: DH mod 23 → separated keys → AES-CTR + HMAC-SHA-256. This is not TLS or a production-safe protocol: tiny DH is brute-forceable.') });
    let mode, config, results, job = 0, alive = true, baseline = false, removed = new Set(), evidence;
    const clearResults = () => { results.replaceChildren(); evidence.textContent = ''; job++; };
    async function run(which = attacks.map(([id]) => id)) {
      const token = ++job, frozen = { ...config }; results.replaceChildren();
      try {
        const list = [];
        for (const id of which) {
          const result = await runChannel(frozen, id);
          if (!alive || token !== job) return;
          list.push([id, result]);
          const row = el('div', `crypto-trial ${result.safe ? 'safe' : 'broken'}`);
          row.append(el('strong', '', `${result.safe ? '✓' : '✗'} ${t(attacks.find(([x]) => x === id)[1])}`), el('p', '', reasons[result.reason]), el('code', 'crypto-evidence', result.evidence));
          if (id === 'reuse') row.append(el('p', 'crypto-micro', L(`Попытка прочитать второе письмо: ${result.recovered}`, `Attempt to read the second letter: ${result.recovered}`)));
          if (id === 'mitm' && result.delivered) row.append(el('p', 'crypto-micro', L(`У Боба: ${result.delivered}`, `Bob received: ${result.delivered}`)));
          results.append(row);
        }
        const broken = list.find(([, r]) => !r.safe), safe = !broken;
        w.story({ attack: true, blocked: safe, bob: safe ? L('Атака не прошла', 'Attack stopped') : L('Принял подмену', 'Accepted the attack'), caption: safe ? L('Показанные действия Евы не нарушили заданных свойств канала.', 'The tested actions by Eve did not break the channel’s stated properties.') : reasons[broken[1].reason] }, true);
        if (which.length === attacks.length) {
          if (mode === 'secure' && safe) ui.solve(mode);
          if (mode === 'minimal') {
            const off = defenses.filter(([key]) => !frozen[key]).map(([key]) => key);
            if (off.length === 0 && safe) baseline = true;
            if (baseline && off.length === 1 && !safe) removed.add(off[0]);
            evidence.textContent = t(L(`Рабочая конфигурация: ${baseline ? 'проверена' : 'ещё не проверена'}. Исследовано удаление: ${removed.size} / 4.`, `Working configuration: ${baseline ? 'verified' : 'not yet verified'}. Removed mechanisms explored: ${removed.size} / 4.`));
            if (baseline && removed.size === 4) ui.solve(mode);
          }
        }
      } catch { if (alive && token === job) ui.status(t(L('Не удалось выполнить Web Crypto. Нужен HTTPS или localhost.', 'Could not run Web Crypto. HTTPS or localhost is required.')), 'fail'); }

    }
    function build() {
      w.experiment.replaceChildren(el('p', 'crypto-known', L('У Евы контроль над сетью. Доверенные ключи Алисы и Боба хранятся отдельно от неё.', 'Eve controls the network. Alice’s and Bob’s trusted keys are stored independently of it.')));
      for (const [key, label] of defenses) { const f = check(label, config[key], v => { config[key] = v; clearResults(); }); w.experiment.append(f.el); }
      results = el('div', 'crypto-results'); evidence = el('output', 'crypto-micro');
      w.experiment.append(action(L('Проверить все пять атак', 'Run all five attacks'), () => run(), true), line(...attacks.map(([id, label]) => action(label, () => run([id])))), evidence, results);
      w.story({ attack: true, caption: L('Выберите защиту, затем дайте Еве попробовать её сломать.', 'Choose defenses, then let Eve try to break them.') });
    }
    return { setMode(id) { job++; mode = id; config = Object.fromEntries(defenses.map(([key]) => [key, false])); baseline = false; removed = new Set(); build(); }, dispose() { alive = false; job++; w.dispose(); } };
  },
};
