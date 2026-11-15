import { L } from './ui.js';
export const CRYPTO_COLLECTION = {
  id: 'crypto', title: L('Криптография под атакой', 'Cryptography under attack'),
  summary: L('Алиса пишет Бобу. Ева контролирует сеть. Постройте защиту, найдите слабое место и объясните атаку математикой.', 'Alice writes to Bob. Eve controls the network. Build defenses, find a weakness and explain the attack with mathematics.'),
};
export const CRYPTO_WORLDS = [
  { id: 'crypto-xor', minutes: 12, title: L('Один ключ дважды', 'One pad, twice'), kicker: L('XOR · известный текст · повтор ключа', 'XOR · known plaintext · pad reuse'), summary: L('Два перехваченных конверта, одна повторная маска. Сложите байты, уберите ключ и восстановите фрагмент чужого письма.', 'Two intercepted envelopes, one reused pad. XOR the bytes, cancel the key and recover part of someone else’s letter.') },
  { id: 'crypto-tamper', minutes: 10, title: L('Закрытое письмо можно изменить', 'A sealed letter can be changed'), kicker: L('Биты · целостность · HMAC', 'Bits · integrity · HMAC'), summary: L('Превратите платёж 100 в 900, не зная ключа. Затем научите Боба замечать изменение до расшифровки.', 'Turn a payment of 100 into 900 without knowing the key. Then teach Bob to detect the change before decryption.') },
  { id: 'crypto-mitm', minutes: 12, title: L('Ева между Алисой и Бобом', 'Eve between Alice and Bob'), kicker: L('Диффи — Хеллман · подмена · доверие', 'Diffie–Hellman · substitution · trust'), summary: L('Обмен ключами работает, но собеседник оказался не тем. Побудьте посредником и защитите обмен доверенными подписями.', 'The key exchange works, but the other person is an impostor. Play the intermediary and authenticate the exchange with trusted signatures.') },
  { id: 'crypto-hashes', minutes: 20, title: L('Хеш: отпечаток, а не замок', 'Hash: a fingerprint, not a lock'), kicker: L('SHA-256 · коллизии · доверие · выбор функции', 'SHA-256 · collisions · trust · choosing a function'), summary: L('Измените один бит и проследите настоящие раунды SHA-256. Найдите коллизию короткого отпечатка и выберите инструмент для файла, API и базы паролей.', 'Flip one bit and follow actual SHA-256 rounds. Find a short-digest collision and choose the right tool for files, APIs and password databases.') },
  { id: 'crypto-signatures', minutes: 15, title: L('Подпись, которая выдала ключ', 'The signature that leaked a key'), kicker: L('ECDSA · сравнения · одноразовый секрет', 'ECDSA · congruences · one-time secret'), summary: L('Алиса повторила секретное число в двух подписях. Вычтите уравнения, восстановите ключ и подпишите третий документ.', 'Alice reused a secret number in two signatures. Subtract the equations, recover the key and sign a third document.') },
  { id: 'crypto-passwords', minutes: 12, title: L('Пароли и бюджет Евы', 'Passwords and Eve’s budget'), kicker: L('Вероятность · соль · стоимость перебора', 'Probability · salt · guessing cost'), summary: L('Сто вымышленных аккаунтов и три догадки. Исследуйте предсказуемость выбора и защиту после кражи базы.', 'A hundred fictional accounts and three guesses. Explore predictable choices and defenses after a database theft.') },
  { id: 'crypto-channel', minutes: 15, title: L('Соберите защищённую переписку', 'Build a protected conversation'), kicker: L('Шифрование · аутентификация · повтор', 'Encryption · authentication · replay'), summary: L('Соедините изученные механизмы и проверьте канал против пяти атак. Уберите одну защиту и найдите контрпример.', 'Combine the mechanisms and test a channel against five attacks. Remove a defense and find a counterexample.') },
].map(w => ({ ...w, collection: 'crypto' }));
export const CRYPTO_TOPIC_LABS = {
  mod: ['crypto-xor', 'crypto-tamper', 'crypto-hashes'], dh: ['crypto-mitm', 'crypto-channel'], ecc: ['crypto-signatures'],
};
const MODULES = {
  'crypto-hashes': () => import('./hashes.js'),
  'crypto-xor': () => import('./xor.js'), 'crypto-tamper': () => import('./tamper.js'),
  'crypto-mitm': () => import('./mitm.js'), 'crypto-signatures': () => import('./signatures.js'),
  'crypto-passwords': () => import('./passwords.js'), 'crypto-channel': () => import('./channel.js'),
};
export const loadCryptoWorld = async id => MODULES[id] ? (await MODULES[id]()).default : null;
