import { t } from '../../core/i18n.js';
import { hmac, randomPad, sameBytes } from './math.js';
import { sha256Trace, utf8, hashHex, distance, prefix, collisionProbability, crc32 } from './hash-math.js';
import { hashRoundProcess, hashBucketProcess } from './hash-process.js';
import { L, el, action, field, check, line, workshop } from './ui.js';

const modes = [
  { id:'free', title:L('От сообщения к отпечатку','From a message to a fingerprint'),
    text:L('Хеш отображает сообщение произвольной длины в короткий отпечаток. У SHA-256 он всегда 256 бит. Измените один входной бит и проследите оба вычисления по настоящим 64 раундам: оранжевым отмечены различия. Здесь нет секретного ключа и операции «расшифровать хеш».','A hash maps a variable-length message to a short fingerprint. SHA-256 always outputs 256 bits. Change one input bit and follow both computations through the actual 64 rounds: orange marks differences. There is no secret key and no “decrypt the hash” operation.') },
  { id:'collision',title:L('Два документа, одна ячейка','Two documents, one slot'),
    text:L('Оставим только первые 8 бит SHA-256: получится 256 ячеек. Добавляйте разные карточки до совпадения. Полные отпечатки при этом почти наверняка различаются: мы ищем коллизию короткого префикса, а не ломаем SHA-256. Вероятность рядом предполагает независимые равномерные отпечатки.','Keep just the first 8 SHA-256 bits: there are 256 slots. Add distinct cards until two match. Their full hashes will almost certainly differ: this is a collision of a short prefix, not a break of SHA-256. The displayed probability assumes independent uniform fingerprints.'),
    goal:L('Найдите совпадение префиксов и объясните, почему оно ещё не является коллизией полного SHA-256.','Find matching prefixes and explain why they are not a collision of full SHA-256.'),
    after:L('Для идеального n-битового хеша любая пара ищется за порядок 2^(n/2) попыток; прообраз заданного отпечатка — за порядок 2^n. Разница возникает из-за числа пар, а не из-за обращения хеша.','For an ideal n-bit hash, finding any colliding pair takes order 2^(n/2) trials; finding a preimage of a given digest takes order 2^n. The difference comes from the number of pairs, not from reversing the hash.') },
  { id:'trust',title:L('Хеш совпал. Файлу можно верить?','The hash matches. Can you trust the file?'),
    text:L('Боб скачивает счёт. Ева может заменить файл и хеш на той же странице. Сравните три источника проверки: хеш с этой страницы, отпечаток из отдельного доверенного источника и HMAC с секретным ключом. Вычисления настоящие; файл здесь — короткая строка.','Bob downloads an invoice. Eve can replace both the file and the hash on the same page. Compare three checks: a hash from that page, a digest from an independent trusted source, and an HMAC using a secret key. These are real computations; the file here is a short string.'),
    goal:L('Покажите, что хеш рядом с файлом принимает подмену. Затем остановите её доверенной проверкой.','Show that a hash next to the file accepts the substitution. Then stop it using a trusted check.'),
    after:L('Обычный хеш не доказывает авторство. Важен источник ожидаемого отпечатка. HMAC добавляет общий секрет; цифровая подпись позволяет проверять по доверенному открытому ключу.','A plain hash does not prove authorship. The source of the expected digest matters. HMAC adds a shared secret; a digital signature allows verification with a trusted public key.') },
  { id:'roles',title:L('Разные задачи — разные конструкции','Different tasks, different constructions'),
    text:L('Слово «хеш» встречается в таблицах, архивах, подписях и базах паролей, но требования различаются. Для таблицы важны скорость и распределение, для защиты от противника — криптографические свойства, а для паролей — стоимость массового перебора. Подберите конструкцию под каждую задачу.','The word “hash” appears in tables, archives, signatures and password databases, but the requirements differ. Tables need speed and distribution, adversarial settings need cryptographic properties, and passwords need resistance to cheap bulk guessing. Match each task to a construction.'),
    goal:L('Подберите инструменты для пяти задач.','Match the tools to all five tasks.'),
    after:L('HMAC — конструкция с ключом поверх хеш-функции; Argon2id — функция для паролей с настройками памяти и времени. Быстрый SHA-256 без подходящей парольной схемы не заменяет защиту базы паролей.','HMAC is a keyed construction built around a hash function; Argon2id is a password-hashing function with memory and time costs. Fast SHA-256 without a suitable password scheme does not replace password-database defenses.') },
  { id:'why',kind:'proof',title:L('Откуда берётся парадокс дней рождения','Where the birthday effect comes from'),
    statement:L('Коллизии неизбежны, но неизбежность и доступность поиска — разные утверждения.','Collisions are inevitable, but inevitability and feasible search are different claims.'),
    slides:[
      {title:L('Бесконечно много входов, конечное число выходов','Infinitely many inputs, finitely many outputs'),text:L('У n-битового хеша всего $N=2^n$ выходов. Разных сообщений больше N: по принципу Дирихле хотя бы два попадут в одну ячейку. Это не даёт способ быстро найти их.','An n-bit hash has only $N=2^n$ outputs. There are more than N possible messages, so the pigeonhole principle puts at least two in one slot. It does not give an efficient way to find them.')},
      {title:L('Считаем вероятность отсутствия совпадений','Count the chance of no matches'),text:L('В модели независимых равномерных отпечатков вторая карточка избегает первой с вероятностью $1-1/N$, третья — двух предыдущих с $1-2/N$. Для k карточек: $$P(\\text{нет коллизии})=\\prod_{i=0}^{k-1}(1-i/N).$$','For independent uniform fingerprints, the second card avoids the first with probability $1-1/N$, the third avoids the first two with $1-2/N$. For k cards: $$P(\\text{no collision})=\\prod_{i=0}^{k-1}(1-i/N).$$')},
      {title:L('Пар много — порядка k²','There are order k² pairs'),text:L('При $k\\ll N$ получаем $P(\\text{коллизия})\\approx1-e^{-k(k-1)/(2N)}$. Заметная вероятность появляется при $k$ порядка $\\sqrt N=2^{n/2}$. Поиск прообраза заданной ячейки сравнивает каждую попытку с одной целью: масштаб уже $2^n$.','For $k\\ll N$, $P(\\text{collision})\\approx1-e^{-k(k-1)/(2N)}$. A substantial chance appears at $k$ of order $\\sqrt N=2^{n/2}$. A preimage search compares each trial with one fixed target instead, giving a scale of $2^n$.')},
    ] },
];
const families = [
  ['table',L('Быстрые некриптографические хеши','Fast non-cryptographic hashes'),L('Например, xxHash: выбор корзины в хеш-таблице, индексация. Хорошее распределение не означает защиты от намеренной подмены.','For example xxHash: hash-table buckets and indexing. Good distribution does not imply resistance to deliberate substitution.')],
  ['checksum',L('Контрольные суммы · CRC32','Checksums · CRC32'),L('Архивы и каналы связи: обнаружить случайное повреждение. CRC основан на остатке от деления двоичного многочлена; противник может пересчитать его.','Archives and communication channels: detect accidental corruption. CRC uses a binary-polynomial division remainder; an adversary can recompute it.')],
  ['crypto',L('Криптографические хеши · SHA-2 / SHA-3','Cryptographic hashes · SHA-2 / SHA-3'),L('Отпечатки файлов, адресация по содержимому, хеширование перед подписью. SHA-256 (256 бит) и SHA-512 (512 бит) — семейство SHA-2; SHA3-256 тоже даёт 256 бит, но использует другую конструкцию — «губку». Стойкость к коллизиям, прообразу и второму прообразу — разные требования.','File fingerprints, content addressing and hashing before signatures. SHA-256 (256 bits) and SHA-512 (512 bits) belong to SHA-2; SHA3-256 also outputs 256 bits but uses a different sponge construction. Collision, preimage and second-preimage resistance are distinct requirements.')],
  ['mac',L('Хеш с секретом · HMAC','Hash with a secret · HMAC'),L('Проверка сообщения между сторонами с общим секретом: API-запросы и протоколы. Это MAC, а не шифрование и не публичная цифровая подпись.','Message verification between parties sharing a secret: API requests and protocols. This is a MAC, not encryption or a public digital signature.')],
  ['password',L('Функции для паролей · Argon2id','Password hashing · Argon2id'),L('Базы паролей: соль и настраиваемая стоимость каждой догадки. Argon2id расходует и память, и время. Также встречаются scrypt, bcrypt и PBKDF2; они не эквивалентны обычному быстрому хешу.','Password databases: salts and a tunable cost per guess. Argon2id costs both memory and time. Other constructions include scrypt, bcrypt and PBKDF2; they are not interchangeable with an ordinary fast hash.')],
];

export default {
  modes,
  mount(ui) {
    const w=workshop(ui,{next:'crypto-signatures',title:L('Что доказывает отпечаток?','What does a fingerprint prove?'),sources:[['https://csrc.nist.gov/projects/hash-functions','NIST · SHA-2 / SHA-3'],['https://www.rfc-editor.org/rfc/rfc2104.html','RFC 2104 · HMAC'],['https://www.rfc-editor.org/rfc/rfc9106.html','RFC 9106 · Argon2id'],['https://www.rfc-editor.org/rfc/rfc6151.html','RFC 6151 · MD5']],note:L('SHA-256 и его раунды вычисляются точно. Для опыта с коллизиями отпечаток намеренно обрезан. Схемы назначения инструментов — объяснение, не исполнение Argon2id.','SHA-256 and its rounds are computed exactly. Collision experiments deliberately truncate the digest. The tool-purpose diagrams explain roles; they do not execute Argon2id.')});
    let mode, message='PAY BOB 100', flippedBit=0, block=0, traceA,traceB, rows,blockSelect,flipInput,stats,job=0,alive=true;
    const rounds=hashRoundProcess(), buckets=hashBucketProcess();
    let items=[],collision=null,bits=8, resultBox, bucketStats, prefixSelect;
    function updateHashes() {
      const data=utf8(message), altered=Uint8Array.from(data);
      if(data.length) { flippedBit=Math.max(0,Math.min(data.length*8-1,flippedBit));altered[Math.floor(flippedBit/8)]^=1<<(7-flippedBit%8); } else flippedBit=0;
      flipInput.max=Math.max(0,data.length*8-1);flipInput.value=flippedBit;flipInput.disabled=data.length===0;
      traceA=sha256Trace(data);traceB=sha256Trace(altered);block=Math.min(block,traceA.blocks.length-1);
      rounds.set({a:traceA,b:traceB,block});
      rows.replaceChildren();
      for(const [label,hash] of [['SHA-256 A',traceA.digest],['SHA-256 B',traceB.digest]]) {const row=el('div','hash-digest');row.append(el('strong','',label),el('code','',hashHex(hash)));rows.append(row);}
      rows.append(el('p','crypto-micro',`CRC32 A: ${crc32(data).toString(16).padStart(8,'0')} · CRC32 B: ${crc32(altered).toString(16).padStart(8,'0')} · ${t(L('контрольная сумма для случайных повреждений, не аутентификация','checksum for accidental corruption, not authentication'))}`));
      stats.textContent=t(L(`${data.length} байт → 256 бит. Изменено на входе: ${data.length?1:0} бит; в отпечатке: ${distance(traceA.digest,traceB.digest)} / 256.`,`${data.length} bytes → 256 bits. Input changed: ${data.length?1:0} bit; digest changed: ${distance(traceA.digest,traceB.digest)} / 256.`));
      blockSelect.replaceChildren();for(let i=0;i<traceA.blocks.length;i++){const o=el('option','',L(`Блок ${i+1}`,`Block ${i+1}`));o.value=i;o.selected=i===block;blockSelect.append(o);}
      w.story({caption:L('Сравниваем сообщение A и его копию B с одним перевёрнутым битом. Перемотка показывает реальные промежуточные состояния.','Compare message A with its copy B with one flipped bit. Scrubbing shows actual intermediate states.')});
    }
    function familyCards() {
      const details=el('details','crypto-inspect');details.append(el('summary','',L('Виды и применение: какой инструмент для чего?','Types and uses: which tool is for what?')));
      for(const [id,title,text]of families){const card=el('article','hash-family');card.dataset.family=id;card.append(el('h3','',title),el('p','',text));details.append(card);}
      details.append(el('p','crypto-known',L('MD5 и SHA-1 встречаются в старых системах, но не подходят там, где требуется стойкость к коллизиям. Это не означает, что их отпечаток можно просто «расшифровать».','MD5 and SHA-1 occur in legacy systems, but are unsuitable where collision resistance is required. That does not mean their digests can simply be “decrypted”.')));return details;
    }
    function free() {
      w.process(rounds);
      const input=field(L('Сообщение A (UTF-8)','Message A (UTF-8)'),{value:message,maxLength:100,name:'hash-message',onInput:v=>{message=v;updateHashes();}});
      const bit=field(L('Перевернуть входной бит № (с нуля)','Flip input bit # (zero-based)'),{type:'number',value:flippedBit,min:0,max:799,name:'hash-flip',onInput:v=>{if(Number.isInteger(v)){flippedBit=v;updateHashes();}}});
      flipInput=bit.input;
      blockSelect=el('select');blockSelect.setAttribute('aria-label',t(L('Блок SHA-256','SHA-256 block')));blockSelect.addEventListener('change',()=>{block=+blockSelect.value;rounds.set({a:traceA,b:traceB,block});w.story({caption:L('Теперь показан выбранный блок. Каждый блок проходит 64 раунда; его итог входит в следующий.','The selected block is shown. Every block takes 64 rounds; its result feeds the next block.')});});
      rows=el('div','hash-digests');stats=el('output','crypto-receipt');
      w.experiment.append(input.el,line(bit.el,blockSelect),stats,rows,el('p','crypto-micro',L('Бит переворачивается в байтах UTF-8, а не в номере символа. Строка B после этого может не быть корректным текстом.','The bit is flipped in UTF-8 bytes, not in a character number. B may no longer be valid text.')),familyCards());updateHashes();
    }
    function drawBuckets() {
      buckets.set({bits,items,collision});w.refresh();
      bucketStats.textContent=t(L(`${items.length} карточек; вероятность хотя бы одной коллизии в идеальной модели ≈ ${(100*collisionProbability(items.length,bits)).toFixed(1)}%.`,`${items.length} cards; ideal-model probability of at least one collision ≈ ${(100*collisionProbability(items.length,bits)).toFixed(1)}%.`));
      if(collision){const [a,b]=collision;resultBox.replaceChildren(el('p','crypto-known',`${a} ≠ ${b}`),el('code','',hashHex(sha256Trace(a).digest)),el('code','',hashHex(sha256Trace(b).digest)),el('p','crypto-micro',L('Совпадает только короткий префикс. Полные отпечатки выше различны.','Only the short prefix matches. The full digests above are different.')));}
      else resultBox.replaceChildren();
    }
    function addCards(n) {
      for(let i=0;i<n&&!collision;i++) {
        const text=`card-${items.length}`,bucket=prefix(sha256Trace(text).digest,bits),old=items.find(x=>x.bucket===bucket);
        items.push({text,bucket});if(old)collision=[old.text,text];
      }
      drawBuckets();w.story({caption:L('Карточки распределяются по первым битам реального SHA-256. Оранжевая ячейка получила два разных документа.','Cards are assigned using the first bits of real SHA-256. An orange slot contains two distinct documents.')},true);
    }
    function collisionLab(proof=false) {
      w.process(buckets);bucketStats=el('output','crypto-receipt');resultBox=el('div','hash-collision-evidence');
      const count=el('select');count.setAttribute('aria-label',t(L('Размер короткого хеша','Short hash size')));
      for(const n of [4,8]){const o=el('option','',`${n} bit · ${2**n} ${t(L('ячеек','slots'))}`);o.value=n;o.selected=n===bits;count.append(o);}
      prefixSelect=count;
      count.addEventListener('change',()=>{bits=+count.value;items=[];collision=null;drawBuckets();});
      const choice=el('select');choice.setAttribute('aria-label',t(L('Что совпало?','What matched?')));
      for(const [id,title]of [['',L('Что совпало?','What matched?')],['prefix',L('Только выбранные первые биты','Only the selected leading bits')],['full',L('Полный SHA-256','Full SHA-256')],['text',L('Тексты документов','The document texts')]]){const o=el('option','',title);o.value=id;choice.append(o);}
      w.experiment.append(count,line(action(L('+1 карточка','+1 card'),()=>addCards(1),true),action(L('+16 карточек','+16 cards'),()=>addCards(16)),action(L('Начать заново','Start again'),()=>{items=[];collision=null;drawBuckets();})),bucketStats,resultBox);
      if(!proof) w.experiment.append(choice,action(L('Проверить вывод','Check conclusion'),()=>{if(collision&&choice.value==='prefix')ui.solve(mode);else ui.status(t(L('Нужны разные документы с одинаковым коротким префиксом. Сравните их полные отпечатки.','Find distinct documents sharing a short prefix. Compare their full digests.')),'fail');},true));
      drawBuckets();w.story({caption:L('Число возможных отпечатков конечно. Чем больше карточек, тем больше пар можно сравнить.','The number of possible fingerprints is finite. More cards create more pairs to compare.')});
    }
    function trustLab() {
      const scene=el('div','hash-trust-process'),flow=el('div','hash-trust-flow'),phase=el('output','process-explanation');
      scene.append(el('h3','',L('Документ → отпечаток → доверенная проверка','Document → fingerprint → trusted check')),flow,phase);
      let state=null,source='page',changed=true,observedWeak=false,observedStrong=false;
      const p={el:scene,label:L('Проследить проверку','Trace verification'),render(progress){if(!state)return;flow.dataset.phase=Math.floor(progress*3);phase.textContent=t(progress<.34?L('Боб получил файл и ожидаемый отпечаток. Откуда взялся второй?','Bob received a file and an expected fingerprint. Where did the second come from?'):progress<.7?L('Боб сам вычисляет отпечаток полученных байтов.','Bob computes the fingerprint of the received bytes.'):state.accepted?L('Значения совпали. Если источник отпечатка контролирует Ева, это не подтверждает подлинность.','The values match. If Eve controls the expected digest, this does not authenticate the file.'):L('Значения различаются. Полученный документ отвергнут.','The values differ. The received document is rejected.'));}};w.process(p);
      const choice=el('select');choice.setAttribute('aria-label',t(L('Источник проверки','Verification source')));
      for(const [id,title]of [['page',L('Хеш рядом с файлом (Ева контролирует оба)','Hash next to the file (Eve controls both)')],['trusted',L('Отпечаток из независимого доверенного источника','Digest from an independent trusted source')],['mac',L('HMAC с общим секретом','HMAC with a shared secret')]]){const o=el('option','',title);o.value=id;choice.append(o);}
      const edit=check(L('Ева заменяет invoice:100 на invoice:900','Eve replaces invoice:100 with invoice:900'),changed,v=>{changed=v;job++;});choice.addEventListener('change',()=>{source=choice.value;job++;});
      const output=el('output','crypto-receipt'),key=randomPad(32);
      const why=el('select');why.setAttribute('aria-label',t(L('Почему первый вариант принял подмену?','Why did the first option accept the substitution?')));
      for(const [id,title]of [['',L('Почему хеш рядом с файлом не помог?','Why did the hash next to the file fail?')],['recomputed',L('Ева пересчитала публичный хеш изменённого файла','Eve recomputed the public hash of the modified file')],['decrypt',L('Ева расшифровала SHA-256','Eve decrypted SHA-256')]]){const o=el('option','',title);o.value=id;why.append(o);}
      async function verify() {
        const token=++job,frozenSource=source,frozenChanged=changed;
        const original=utf8('invoice:100'),received=utf8(frozenChanged?'invoice:900':'invoice:100');
        try{
          const computed=frozenSource==='mac'?await hmac(key,received):sha256Trace(received).digest;
          const expected=frozenSource==='mac'?await hmac(key,original):sha256Trace(frozenSource==='page'?received:original).digest;
          if(!alive||token!==job)return;
          state={accepted:sameBytes(computed,expected)};
          flow.replaceChildren();for(const [title,value]of [[L('Полученный файл','Received file'),frozenChanged?'invoice:900':'invoice:100'],[L('Вычислено Бобом','Computed by Bob'),hashHex(computed)],[L('Ожидается из источника','Expected from source'),hashHex(expected)]]){const c=el('article','hash-trust-card');c.append(el('strong','',title),el('code','',value));flow.append(c);}
          output.textContent=t(state.accepted?L('Проверка совпала. Боб принял файл.','The check matches. Bob accepted the file.'):L('Проверка не совпала. Боб отверг файл.','The check failed. Bob rejected the file.'));
          if(frozenChanged&&frozenSource==='page'&&state.accepted)observedWeak=true;
          if(frozenChanged&&frozenSource!=='page'&&!state.accepted)observedStrong=true;
          w.story({caption:L('Проверка сравнивает реальные отпечатки или HMAC. Секретный ключ в интерфейсе не раскрывается.','The check compares actual digests or HMACs. The secret key is not exposed in the interface.')},true);
        }catch{if(alive&&token===job)output.textContent=t(L('Для HMAC нужен Web Crypto: HTTPS или localhost.','HMAC needs Web Crypto: HTTPS or localhost.'));}
      }
      w.experiment.append(choice,edit.el,action(L('Выполнить проверку','Run verification'),verify,true),output,why,action(L('Проверить вывод','Check conclusion'),()=>{if(observedWeak&&observedStrong&&why.value==='recomputed')ui.solve(mode);else ui.status(t(L('Сначала получите принятую подмену с хешем рядом с файлом, затем отвергнутую с доверенной проверкой; объясните разницу.','First observe an accepted substitution using the adjacent hash, then a rejection using a trusted check; explain the difference.')),'fail');},true));
      w.story({caption:L('Значение хеша публично. Проверьте, кто может заменить ожидаемый отпечаток.','A hash value is public. Check who can replace the expected digest.')});
    }
    function rolesLab() {
      const scene=el('div','hash-purpose-process');scene.innerHTML='<div class="hash-purpose-input">message</div><div class="hash-purpose-machine">H</div><div class="hash-purpose-output">digest</div>';
      const caption=el('output','process-explanation');scene.append(caption);
      let active='crypto';
      w.process({el:scene,label:L('Показать конструкцию','Show construction'),render(p){scene.style.setProperty('--process-progress',p);const descriptions={table:['key','fast hash','bucket'],checksum:['file','CRC32','32 bit'],crypto:['message','SHA-256','256 bit'],mac:['message + secret','HMAC','tag'],password:['password + salt','Argon2id · memory × time','password record']};const row=descriptions[active];scene.querySelector('.hash-purpose-input').textContent=row[0];scene.querySelector('.hash-purpose-machine').textContent=row[1];scene.querySelector('.hash-purpose-output').textContent=row[2];caption.textContent=t(families.find(([id])=>id===active)[2]);}});
      const cases=[['table',L('Найти корзину в словаре по ключу','Find a dictionary bucket for a key')],['checksum',L('Заметить случайное повреждение архива','Detect accidental archive corruption')],['crypto',L('Сравнить файл с доверенным отпечатком издателя','Compare a file with the publisher’s trusted digest')],['mac',L('Проверить API-сообщение с общим секретом','Authenticate an API message using a shared secret')],['password',L('Хранить проверяемые записи паролей','Store verifiable password records')]];
      const selections=[];
      for(const [answer,title]of cases){const card=el('label','hash-role-case');card.append(el('strong','',title));const select=el('select');select.dataset.role=answer;select.setAttribute('aria-label',t(title));const empty=el('option','',L('Выберите инструмент…','Choose a tool…'));empty.value='';select.append(empty);for(const [id,name]of families){const o=el('option','',name);o.value=id;select.append(o);}select.addEventListener('change',()=>{if(select.value){active=select.value;w.story({caption:L('Схема показывает входы и назначение выбранной конструкции.','The diagram shows the inputs and purpose of the selected construction.')},true);}});card.append(select);w.experiment.append(card);selections.push([answer,select]);}
      w.experiment.append(action(L('Проверить подбор','Check matches'),()=>{if(selections.every(([id,s])=>s.value===id))ui.solve(mode);else ui.status(t(L('Смотрите на модель угроз: случайная ошибка, противник без ключа, общий секрет или массовый перебор паролей.','Consider the threat model: accidental error, an adversary without a key, a shared secret, or bulk password guessing.')),'fail');},true),familyCards());
      w.story({caption:L('Выберите инструмент в задаче — его входы и назначение появятся на сцене.','Choose a tool for a task — its inputs and purpose appear in the scene.')});
    }
    return{setMode(id){job++;mode=id;w.experiment.replaceChildren();items=[];collision=null;bits=8;if(id==='free')free();else if(id==='collision'||id==='why')collisionLab(id==='why');else if(id==='trust')trustLab();else rolesLab();},slide(k){bits=k===0?4:8;prefixSelect.value=bits;items=[];collision=null;drawBuckets();},dispose(){alive=false;job++;w.dispose();}};
  },
};
