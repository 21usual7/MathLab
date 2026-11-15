import { t } from '../../core/i18n.js';
import { L, el, actor, esc } from './ui.js';

export function exchangeProcess() {
  const root=el('div','exchange-process');
  root.innerHTML=`<h3>${esc(t(L('Один обмен или два разговора с Евой?','One exchange or two conversations with Eve?')))}</h3><svg viewBox="0 0 800 300" role="img" aria-label="${esc(t(L('Обмен публичными значениями между Алисой, Евой и Бобом','Public-share exchanges between Alice, Eve and Bob')))}">
    <path class="exchange-honest" d="M120 82H680" stroke="#58c4dd" stroke-width="3" stroke-dasharray="7 6"/>
    <path class="exchange-left" d="M120 82Q250 10 380 82" stroke="#ff9f81" stroke-width="3" fill="none"/>
    <path class="exchange-right" d="M420 82Q550 10 680 82" stroke="#b69df8" stroke-width="3" fill="none"/>
    ${actor('alice',80,145,.6)}${actor('bob',720,145,.6)}<g class="exchange-eve">${actor('eve',400,145,.6)}</g>
    <text x="80" y="235" text-anchor="middle">${esc(t(L('Алиса','Alice')))}</text><text x="720" y="235" text-anchor="middle">${esc(t(L('Боб','Bob')))}</text><text class="exchange-eve-name" x="400" y="235" text-anchor="middle">${esc(t(L('Ева','Eve')))}</text>
    <g class="exchange-token-left"><rect x="-45" y="-17" width="90" height="34" rx="8" fill="#f4d35e"/><text text-anchor="middle" y="5" fill="#15212a"></text></g>
    <g class="exchange-token-right"><rect x="-45" y="-17" width="90" height="34" rx="8" fill="#b69df8"/><text text-anchor="middle" y="5" fill="#15212a"></text></g>
    <text class="exchange-key-left" x="200" y="278" text-anchor="middle"></text><text class="exchange-key-right" x="600" y="278" text-anchor="middle"></text>
    <g class="exchange-block" transform="translate(400 82)"><rect x="-68" y="-22" width="136" height="44" rx="9" fill="#18362c" stroke="#83c167"/><text y="5" text-anchor="middle" fill="#83c167">${esc(t(L('Подпись ✗','Signature ✗')))}</text></g>
  </svg>`;
  const explanation=el('output','process-explanation');root.append(explanation);
  let data=null;
  function render(p){
    if(!data)return;
    const {s,attack,authenticated,hideKeys}=data;
    root.querySelector('.exchange-honest').style.opacity=attack?'0':'1';
    for(const cls of ['exchange-left','exchange-right','exchange-eve','exchange-eve-name'])root.querySelector('.'+cls).style.opacity=attack?'1':'0';
    const left=root.querySelector('.exchange-token-left'),right=root.querySelector('.exchange-token-right');
    const q=p<.5?p*2:(p-.5)*2;
    left.setAttribute('transform',attack?`translate(${p<.5?120+260*q:380-260*q} ${82-Math.sin(q*Math.PI)*36})`:`translate(${120+560*p} 82)`);
    right.setAttribute('transform',attack?`translate(${p<.5?680-260*q:420+260*q} ${82-Math.sin(q*Math.PI)*36})`:`translate(${680-560*p} 122)`);
    left.querySelector('text').textContent=attack&&p>=.5?`E₁ = ${s.toAlice}`:`A = ${s.A}`;
    right.querySelector('text').textContent=attack&&p>=.5?`E₂ = ${s.toBob}`:`B = ${s.B}`;
    left.style.opacity=right.style.opacity=authenticated&&!s.valid&&p>=.5?'0':'1';
    root.querySelector('.exchange-block').style.opacity=authenticated&&!s.valid&&p>=.5?'1':'0';
    root.querySelector('.exchange-key-left').textContent=p<.9?'':!s.accepted?'':attack?`K_AE = ${hideKeys?'A³ mod 23':s.alice}`:`K_AB = ${s.alice}`;
    root.querySelector('.exchange-key-right').textContent=p<.9?'':!s.accepted?'':attack?`K_EB = ${hideKeys?'B⁷ mod 23':s.bob}`:`K_BA = ${s.bob}`;
    explanation.textContent=t(authenticated&&!s.valid&&p>=.5?L('Доверенные подписи не подтвердили подставленные значения. Обмен остановлен до выработки принятого ключа.','Trusted signatures did not authenticate the substituted values. The exchange stops before accepting a key.'):attack?(p<.5?L('Ева получает настоящие A и B, но не пересылает их собеседнику.','Eve receives the real A and B, but does not forward them.') :L('Влево идёт E₁ = g³, вправо E₂ = g⁷. У Евы два отдельных обмена и два вычисляемых ею секрета.','E₁ = g³ goes left, E₂ = g⁷ goes right. Eve has two separate exchanges and can compute both secrets.')):L('A и B доходят без замены. Оба конца вычисляют один секрет g^(ab), хотя показатели a и b не передавались.','A and B arrive unchanged. Both endpoints compute g^(ab), although exponents a and b were never transmitted.'));
  }
  return{el:root,label:L('Проследить обмен','Trace the exchange'),phase:p=>p<.5?L('Публичные значения','Public values'):p<.9?L('Что получил собеседник?','What did the peer receive?'):L('Принятые ключи','Accepted keys'),render,set(next){data=next;}};
}
