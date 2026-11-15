import { t } from '../../core/i18n.js';
import { L, el, action } from './ui.js';
import { XOR_CHAPTERS, XOR_DURATION, chapterStart, storyFrame, initialXorStory, xorStoryValues, microscopeValues, interveneXor } from './xor-story-model.js';

const BLUE='#66cbe9', GOLD='#f0d07b', PURPLE='#bda3ff', GREEN='#87d9ba', WHITE='#ececec', MUTED='#92969d', RED='#ff9d88';
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const beat=(p,a,b)=>ease((p-a)/(b-a));
const mix=(a,b,p)=>a+(b-a)*p;
const clock=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

export function xorStory(host,{onExplore}) {
  const root=el('section','xor-film-root');root.setAttribute('aria-label',t(L('История XOR с микроскопом','XOR story with a microscope')));
  const top=el('header','xor-film-top'),brand=el('span','xor-film-brand','XOR');
  top.append(brand,el('span','xor-film-format',L('История · остановись и исследуй','A story · pause and investigate')),action(L('Открыть лабораторию ↗','Open laboratory ↗'),onExplore));
  const stage=el('div','xor-film-stage'),canvas=el('canvas','xor-film-canvas');canvas.setAttribute('aria-hidden','true');
  const cover=el('div','xor-film-cover');
  cover.append(el('p','',L('Как один известный фрагмент\nраскрывает чужое сообщение','How one known fragment\nexposes another message')),
    action(L('▶ Смотреть историю','▶ Watch the story'),()=>start(),true),el('small','',L('Около минуты. В любой момент можно остановиться и приблизить причину.','About a minute. Pause at any moment and zoom in on the cause.')));
  const caption=el('div','xor-film-caption');caption.setAttribute('aria-live','polite');
  const interventions=el('div','xor-film-interventions');
  const lens=el('section','xor-film-lens');lens.hidden=true;lens.setAttribute('aria-label',t(L('Причина и следствие под микроскопом','Cause and effect under a microscope')));
  stage.append(canvas,cover,lens);
  const footer=el('footer','xor-film-footer'),timeline=el('input','xor-film-timeline');
  timeline.type='range';timeline.min=0;timeline.max=XOR_DURATION;timeline.step=.05;timeline.value=0;timeline.setAttribute('aria-label',t(L('Время истории XOR','XOR story time')));
  const nav=el('div','xor-film-nav'),play=action(L('▶ Смотреть','▶ Play'),()=>running?pause():start()),prev=action('←',()=>jump(frame.index-1)),next=action('→',()=>jump(frame.index+1)),microscope=action(L('⌕ Под микроскопом','⌕ Under the microscope'),()=>openLens());
  prev.setAttribute('aria-label',t(L('Предыдущая сцена','Previous scene')));next.setAttribute('aria-label',t(L('Следующая сцена','Next scene')));
  const chapter=el('select');chapter.setAttribute('aria-label',t(L('Сцена истории','Story scene')));
  XOR_CHAPTERS.forEach((c,i)=>{const o=el('option','',L(c.ru,c.en));o.value=i;chapter.append(o);});
  const time=el('span','xor-film-time');nav.append(play,prev,next,chapter,microscope,time);footer.append(timeline,nav);
  const note=el('p','xor-film-note',L('Маленькие 4-битные числа показывают механику. У реального одноразового блокнота маска такая же длинная, как сообщение.','Small 4-bit numbers show the mechanism. A real one-time pad is as long as its message.'));
  root.append(top,stage,caption,interventions,footer,note);host.append(root);
  const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let state=initialXorStory(),seconds=0,frame=storyFrame(0),running=false,raf=null,last=0,disposed=false,started=false,pausedForQuestion=false;
  let width=0,height=0,stageKey='',captionKey='',selectedBit=0,lensResume=false;
  const answers=new Map();
  function resize(){const r=stage.getBoundingClientRect();width=r.width;height=r.height;const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;draw();}
  const observer=new ResizeObserver(resize);observer.observe(stage);
  function alpha(a,fn){ctx.save();ctx.globalAlpha*=clamp(a);fn();ctx.restore();}
  function text(value,x,y,size=62,color=WHITE,align='center',serif=false){ctx.fillStyle=color;ctx.font=`${serif?'400':'500'} ${size}px ${serif?'Fraunces, Georgia, serif':'Inter, sans-serif'}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(String(value),x,y);}
  function rule(x,y,x2,y2,color=MUTED,w=2){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
  function box(x,y,w,h,color='#151619',stroke='#44464b',r=12){ctx.fillStyle=color;ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();ctx.stroke();}
  function number(value,label,x,y,color,a=1,size=116){alpha(a,()=>{text(label,x,y-size*.72,22,color);text(value,x,y,size,color);});}
  function person(x,y,color,name,eve=false){ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(-35,15,70,55,18);ctx.fill();if(eve){ctx.fillStyle='#68578f';ctx.beginPath();ctx.ellipse(0,-14,33,40,0,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#eac09e';ctx.beginPath();ctx.ellipse(0,-14,22,27,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#352d34';ctx.beginPath();ctx.ellipse(0,-32,24,15,-.2,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#352d34';for(const xx of [-8,8]){ctx.beginPath();ctx.arc(xx,-14,2,0,Math.PI*2);ctx.fill();}box(-36,36,72,40,'#161b24','#4b5563',4);text(name,0,103,24,color);ctx.restore();}
  function envelope(value,x,y,color=PURPLE,a=1){alpha(a,()=>{box(x-75,y-48,150,96,'#15131d',color,10);rule(x-72,y-44,x,y+2,color);rule(x,y+2,x+72,y-44,color);text(value,x,y+18,44,color);});}
  function binaryCalculation(a,b,p){const A=a.toString(2).padStart(4,'0'),B=b.toString(2).padStart(4,'0');for(let i=0;i<4;i++){const x=320+i*120,q=beat(p,.38+i*.045,.54+i*.045);text(A[i],x,166,62,BLUE);text(B[i],x,242,62,GOLD);rule(x-38,284,x+38,284,q?GOLD:'#37383c');alpha(q,()=>text(A[i]^B[i],x,332,62,PURPLE));alpha(1-q,()=>text('?',x,332,46,'#44464b'));}text('⊕',242,242,42,MUTED);}
  function captionFor(f,v){const p=f.progress;switch(f.id){
    case'message':return L(`У Алисы есть сообщение: ${v.message}. Она хочет передать его Бобу.`,`Alice has a message: ${v.message}. She wants to send it to Bob.`);
    case'encrypt':return p<.28?L(`Добавим секретную маску ${v.key}. Боб знает её заранее.`,`Add the secret pad ${v.key}. Bob already knows it.`):p<.78?L('Разложим числа на биты. XOR сравнивает каждый столбец: одинаковые биты дают 0, разные — 1.','Write the numbers as bits. XOR compares each column: equal bits give 0, different bits give 1.'):L(`${v.message} ⊕ ${v.key} = ${v.cipher}. Это новое число отправится по сети.`,`${v.message} ⊕ ${v.key} = ${v.cipher}. This new number will travel across the network.`);
    case'cipher':return p<.45?L(`Теперь по сети идёт ${v.cipher} — шифротекст. Исходного числа на конверте нет.`,`${v.cipher} now travels across the network — the ciphertext. The original number is not on the envelope.`):L('Ева может скопировать конверт. Пока ей неизвестны и сообщение, и маска.','Eve can copy the envelope. For now, she knows neither the message nor the pad.');
    case'unlock':return p<.55?L('У Боба есть перехват и заранее известная маска. Применим к ним тот же XOR.','Bob has the ciphertext and the pad shared beforehand. Apply the same XOR to them.'):v.bobKey!==v.key?L(`Вы изменили ключ, который пробует Боб. Он получил ${v.bobMessage} вместо ${v.message}. Перехват не менялся.`,`You changed the key Bob tries. He obtained ${v.bobMessage} instead of ${v.message}. The ciphertext stayed fixed.`):L(`Боб делает тот же XOR: ${v.cipher} ⊕ ${v.key} = ${v.message}. Два одинаковых применения маски отменили друг друга.`,`Bob uses XOR again: ${v.cipher} ⊕ ${v.key} = ${v.message}. Applying the same pad twice cancelled it.`);
    case'problem':return p<.45?L('Алиса отправила ещё одно сообщение с той же маской. У Евы теперь два шифротекста.','Alice sent another message using the same pad. Eve now has two ciphertexts.'):L(`И Ева узнала: первое сообщение было ${v.message}. Что теперь можно вычислить?`,`And Eve learned that the first message was ${v.message}. What can she compute now?`);
    case'recover':return v.known!==v.message?L(`Вы проверяете другое предположение: M₁ = ${v.known}. Оно даёт кандидат ключа ${v.recovered}. Настоящее сообщение при этом не изменилось.`,`You are testing a different assumption: M₁ = ${v.known}. It gives candidate key ${v.recovered}. The actual message did not change.`):p<.4?L('Подставим в XOR шифротекст и известное сообщение. Секретный ключ пока не подставляем.','XOR the ciphertext with the known message. We do not substitute the secret key.'):p<.8?L('Переставим слагаемые. Два одинаковых значения сообщения дадут ноль — останется K.','Rearrange the terms. The two identical message values give zero — leaving K.'):L(`В выражении (M₁ ⊕ K) ⊕ M₁ сообщение встречается дважды и сокращается. Остаётся ключ: ${v.recovered}.`,`In (M₁ ⊕ K) ⊕ M₁ the message appears twice and cancels. What remains is the key: ${v.recovered}.`);
    case'reuse':return p<.55?(!state.reuse?L('Меняем только маску второго письма. Само сообщение осталось тем же, но перехват изменился. Подойдёт ли старый ключ?','Change only the second letter’s pad. The message stayed the same, but the ciphertext changed. Will the old key work?'):L('У Евы есть кандидат ключа и второе перехваченное число. Подойдёт ли этот ключ?','Eve has a candidate key and the second intercepted number. Will that key work?')):!state.reuse&&v.opened===v.second?L('В маленьком примере кандидат случайно совпал со второй маской. Это совпадение не следует из знания первого сообщения.','In this small example the candidate happened to match the second pad. That coincidence does not follow from knowing the first message.'):!state.reuse?L(`Теперь у второго сообщения другая маска. Старый ключ дал ${v.opened}, а исходное второе число — ${v.second}. Это уже не расшифровка.`,`The second message now has a different pad. The old key gives ${v.opened}, but the actual second number is ${v.second}. This is not a decryption.`):v.known!==v.message?L(`Неверное предположение о первом сообщении дало неверный ключ — и здесь получилось ${v.opened} вместо ${v.second}.`,`A wrong assumption about the first message gave a wrong key — and now produces ${v.opened} instead of ${v.second}.`):L(`Та же маска — значит, найденный ключ подходит и ко второму перехвату: ${v.cipher2} ⊕ ${v.recovered} = ${v.opened}.`,`The same pad means the recovered key also works on the second intercept: ${v.cipher2} ⊕ ${v.recovered} = ${v.opened}.`);
    default:return L('Один известный фрагмент раскрывает только соответствующий фрагмент маски. Нажмите на ещё одну позицию: увидите, где появится новое знание.','One known fragment reveals only the corresponding pad fragment. Select another position and see exactly where new knowledge appears.');}}
  function paint(f,v){const p=f.progress;ctx.save();const scale=Math.min(width/1000,height/560);ctx.translate((width-1000*scale)/2,(height-560*scale)/2);ctx.scale(scale,scale);
    if(f.id==='message'){alpha(beat(p,.05,.25),()=>{person(185,260,BLUE,t(L('Алиса','Alice')));number(v.message,'M',500,mix(265,240,beat(p,.15,.55)),BLUE);});}
    if(f.id==='encrypt'){
      const binary=beat(p,.28,.4)*(1-beat(p,.76,.86));
      alpha(1-binary,()=>{number(v.message,'M',mix(500,300,beat(p,0,.18)),mix(240,185,beat(p,0,.18)),BLUE,1-beat(p,.79,.9));number(v.key,'K',mix(820,650,beat(p,.1,.3)),185,GOLD,beat(p,.1,.25)*(1-beat(p,.79,.9)));alpha(beat(p,.2,.28)*(1-beat(p,.79,.9)),()=>text('⊕',475,185,70,MUTED));});
      alpha(binary,()=>binaryCalculation(v.message,v.key,p));number(v.cipher,'C',500,mix(430,240,beat(p,.84,1)),PURPLE,beat(p,.76,.87));
    }
    if(f.id==='cipher'){
      person(130,260,BLUE,t(L('Алиса','Alice')));person(870,260,GREEN,t(L('Боб','Bob')));alpha(beat(p,.45,.6),()=>person(500,410,PURPLE,t(L('Ева','Eve')),true));
      envelope(v.cipher,mix(500,755,beat(p,.28,.82)),240,PURPLE,beat(p,0,.16));number(v.cipher,'C',500,240,PURPLE,1-beat(p,0,.16));
      alpha(beat(p,.45,.6),()=>envelope(v.cipher,500,mix(240,340,beat(p,.48,.84)),PURPLE,.7));
    }
    if(f.id==='unlock'){
      number(v.cipher,'C',300,210,PURPLE,beat(p,0,.12));number(v.bobKey,'K',650,210,GOLD,beat(p,.12,.3));alpha(beat(p,.28,.4),()=>text('⊕',475,210,72,MUTED));number(v.bobMessage,'M',500,405,v.bobMessage===v.message?BLUE:RED,beat(p,.55,.78));
      alpha(beat(p,.72,.9),()=>text('(M ⊕ K) ⊕ K = M',500,490,30,MUTED));
    }
    if(f.id==='problem'){
      alpha(beat(p,0,.15),()=>envelope(v.cipher,300,210));alpha(beat(p,.18,.34),()=>envelope(v.cipher2,700,210));person(500,390,PURPLE,t(L('Ева','Eve')),true);
      alpha(beat(p,.48,.64),()=>{box(380,54,240,70,'#10222a',BLUE);text(`M₁ = ${v.message}`,500,90,42,BLUE);rule(500,126,500,165,BLUE);});
      alpha(beat(p,.7,.85),()=>text('K = ?',500,260,50,GOLD));
    }
    if(f.id==='recover'){
      number(v.cipher,'C₁',300,180,PURPLE,1-beat(p,.2,.32));number(v.known,'M₁',650,180,BLUE,1-beat(p,.2,.32));alpha(1-beat(p,.2,.32),()=>text('⊕',475,180,72,MUTED));
      alpha(beat(p,.34,.44)*(1-beat(p,.76,.88)),()=>{
        const correct=v.known===v.message,rearrange=correct?beat(p,.44,.64):0,cancel=correct?beat(p,.64,.77):0;
        text('(',200,215,46,MUTED);
        alpha(1-cancel,()=>{text(v.message,mix(285,350,rearrange),215,62,BLUE);text(v.known,mix(735,540,rearrange),215,62,BLUE);text('⊕',mix(375,445,rearrange),215,45,MUTED);if(cancel>0){rule(305,215,395,215,BLUE,3);rule(495,215,585,215,BLUE,3);}});
        alpha(cancel,()=>text('0',445,215,62,BLUE));
        text('K',mix(465,735,rearrange),215,64,GOLD);text('⊕',mix(600,640,rearrange),215,45,MUTED);text(')',820,215,46,MUTED);
      });
      number(v.recovered,v.known===v.message?'K':'K?',500,mix(410,240,beat(p,.85,1)),v.recovered===v.key?GOLD:RED,beat(p,.75,.87));
      alpha(beat(p,.82,.94),()=>text(`${v.cipher} ⊕ ${v.known} = ${v.recovered}`,500,470,32,MUTED));
    }
    if(f.id==='reuse'){
      number(v.recovered,'K?',mix(500,650,beat(p,0,.18)),mix(240,185,beat(p,0,.18)),GOLD);number(v.cipher2,'C₂',300,185,PURPLE,beat(p,.15,.3));alpha(beat(p,.3,.4),()=>text('⊕',475,185,70,MUTED));number(v.opened,state.reuse?'M₂':'M₂?',500,390,state.reuse&&v.opened===v.second?GREEN:RED,beat(p,.55,.78));
      if(!state.reuse)alpha(beat(p,.75,.9),()=>text(`${t(L('На самом деле','Actually'))}: ${v.second}`,500,475,30,GREEN));
    }
    if(f.id==='fragment'){
      text(t(L('Известно → вычислено','Known → computed')),500,78,38,WHITE);
      const labels=['M₁','C₁','K'];for(let r=0;r<3;r++){text(labels[r],140,180+r*104,28,[BLUE,PURPLE,GOLD][r]);for(let i=0;i<4;i++){const value=r===0?v.knownMessage[i]:r===1?v.firstCipher[i]:v.keyFragment[i],x=220+i*160;box(x,140+r*104,130,78,'#101114',value==null?'#33363b':[BLUE,PURPLE,GOLD][r]);text(value==null?'?':value,x+65,180+r*104,44,value==null?'#555b64':[BLUE,PURPLE,GOLD][r]);}}}
    ctx.restore();
  }
  function draw(){if(disposed||!width)return;const d=Math.min(devicePixelRatio||1,2);ctx.setTransform(d,0,0,d,0,0);ctx.fillStyle='#050607';ctx.fillRect(0,0,width,height);frame=storyFrame(seconds);const v=xorStoryValues(state);if(started)paint(frame,v);timeline.value=seconds;time.textContent=`${clock(seconds)} / ${clock(XOR_DURATION)}`;chapter.value=frame.index;prev.disabled=frame.index===0;next.disabled=frame.index===XOR_CHAPTERS.length-1;microscope.disabled=!started;root.dataset.chapter=frame.id;root.dataset.time=seconds;root.dataset.cipher=v.cipher;root.dataset.recovered=v.recovered;root.dataset.opened=v.opened;root.dataset.known=state.known;
    const nextCaption=started?t(captionFor(frame,v)):'';if(nextCaption!==captionKey){caption.textContent=nextCaption;captionKey=nextCaption;}
    const key=frame.id+(frame.id==='problem'&&frame.progress>=.78?'question':'');if(key!==stageKey){stageKey=key;buildInterventions();}
  }
  function pause(){running=false;if(raf!==null)cancelAnimationFrame(raf);raf=null;play.textContent=t(L('▶ Продолжить','▶ Continue'));}
  function tick(now){raf=null;if(!running||disposed)return;seconds=Math.min(XOR_DURATION,seconds+Math.min(.1,(now-last)/1000));last=now;draw();
    if(frame.id==='problem'&&frame.progress>=.92&&!pausedForQuestion&&!answers.has('prediction')){pausedForQuestion=true;pause();buildInterventions();return;}
    if(seconds>=XOR_DURATION){pause();return;}raf=requestAnimationFrame(tick);
  }
  function start(){if(!lens.hidden)return;started=true;cover.hidden=true;if(seconds>=XOR_DURATION)seconds=0;if(reduced.matches){seconds=chapterStart(frame.index)+XOR_CHAPTERS[frame.index].duration-.001;pause();draw();return;}running=true;play.textContent=t(L('❚❚ Пауза','❚❚ Pause'));last=performance.now();draw();if(raf===null)raf=requestAnimationFrame(tick);}
  function jump(index){pause();started=true;cover.hidden=true;index=Math.max(0,Math.min(XOR_CHAPTERS.length-1,index));seconds=chapterStart(index)+(reduced.matches?XOR_CHAPTERS[index].duration-.001:.001);if(!lens.hidden)closeLens(false);draw();}
  timeline.addEventListener('input',()=>{pause();started=true;cover.hidden=true;seconds=+timeline.value;if(!lens.hidden)closeLens(false);draw();});chapter.addEventListener('change',()=>jump(+chapter.value));
  function buildInterventions(){interventions.replaceChildren();if(!started)return;
    if(frame.id==='problem'&&frame.progress>=.78){
      const question=el('div','xor-film-question');question.append(el('span','',L('Теперь Ева может…','Now Eve can…')));
      for(const [id,label]of [['key',L('Найти соответствующий ключ','Find the corresponding key')],['all',L('Прочитать любые чужие сообщения','Read any other messages')]])question.append(action(label,()=>{answers.set('prediction',id);const feedback=el('span','xor-film-feedback',id==='key'?L('Проверим это вычислением в следующей сцене.','Let’s check that by computing it in the next scene.'):L('Известно пока только одно сообщение. Проверим, что именно оно раскрывает.','Only one message is known so far. Let’s check exactly what it reveals.'));question.querySelector('.xor-film-feedback')?.remove();question.append(feedback);pause();}));interventions.append(question);
    }
    if(frame.id==='reuse'){
      const label=el('label','xor-film-switch'),input=el('input');input.type='checkbox';input.checked=state.reuse;input.setAttribute('aria-label',t(L('Повторить маску во втором сообщении','Reuse the pad in the second message')));label.append(input,el('span','',L('Во втором сообщении та же маска','The second message uses the same pad')));input.addEventListener('change',()=>{pause();state.reuse=input.checked;seconds=chapterStart(6);draw();start();});interventions.append(label);
    }
    if(frame.id==='fragment'){
      const row=el('div','xor-film-fragments');row.append(el('span','',L('Сколько позиций M₁ известно?','How many M₁ positions are known?')));for(let i=1;i<=4;i++){const b=action(String(i),()=>{pause();state.known=i;draw();buildInterventions();});b.setAttribute('aria-pressed',String(state.known===i));b.setAttribute('aria-label',t(L(`Известно позиций: ${i}`,`Known positions: ${i}`)));row.append(b);}row.append(action(L('Теперь попробовать самому ↗','Now try it yourself ↗'),onExplore,true));interventions.append(row);
    }
  }
  function openLens(){if(!started)return;lensResume=running;pause();lens.hidden=false;lens.setAttribute('role','dialog');lens.setAttribute('aria-modal','true');for(const node of [top,caption,interventions,footer,note])node.inert=true;root.classList.add('lens-open');renderLens();lens.querySelector('button')?.focus();}
  function closeLens(resume=true){lens.hidden=true;for(const node of [top,caption,interventions,footer,note])node.inert=false;root.classList.remove('lens-open');microscope.focus();draw();if(resume&&lensResume)start();}
  function renderLens(change=null){
    const values=microscopeValues(state,frame.id),v=xorStoryValues(state);lens.replaceChildren();lens.dataset.result=values.result;
    const header=el('header','xor-lens-head');header.append(el('strong','',L('Меняем одну причину','Change one cause')),action(L('Вернуться к истории','Back to the story'),()=>closeLens()));
    const context=el('p','xor-lens-context',values.kind==='encrypt'?L('Здесь меняются реальные входы шифрования. Переключите один бит сообщения или маски.','Here you change the actual encryption inputs. Flip one message or pad bit.'):values.kind==='unlock'?L('Полученный шифротекст зафиксирован. Меняете только ключ, который пробует Боб.','The received ciphertext is held fixed. You change only the key Bob tries.'):L('Перехват зафиксирован. Меняете предположение об известном тексте, а не настоящее сообщение.','The intercept is held fixed. You change the assumed known text, not the actual message.'));
    const rows=el('div','xor-lens-rows');
    for(let r=0;r<3;r++){const row=el('div','xor-lens-row');const colors=values.kind==='encrypt'?[BLUE,GOLD,PURPLE]:values.kind==='unlock'?[PURPLE,GOLD,BLUE]:[PURPLE,BLUE,GOLD];row.style.setProperty('--term',colors[r]);row.append(el('strong','',values.labels[r]));const number=r===0?values.a:r===1?values.b:values.result;for(let bit=3;bit>=0;bit--){const value=(number>>bit)&1,node=r<2?el('button','',String(value)):el('span','',String(value));node.classList.toggle('lit',!!value);node.classList.toggle('affected',change?.bit===bit);node.dataset.row=r;node.dataset.bit=bit;if(r<2){node.type='button';node.disabled=r===0&&values.kind!=='encrypt';node.setAttribute('aria-label',`${values.labels[r]}, ${t(L('переключить бит','flip bit'))} ${bit}`);node.addEventListener('click',()=>{const before=microscopeValues(state,frame.id);state=interveneXor(state,frame.id,r,bit);selectedBit=bit;const after=microscopeValues(state,frame.id);draw();renderLens({bit,before:before.result,after:after.result});lens.querySelector(`[data-row="${r}"][data-bit="${bit}"]`)?.focus();});}row.append(node);}row.append(el('code','',`= ${number}`));rows.append(row);}
    const local=el('div','xor-lens-local'),bitA=(values.a>>selectedBit)&1,bitB=(values.b>>selectedBit)&1;local.append(el('span','',`${t(L('Один столбец','One column'))}: ${bitA} ⊕ ${bitB} = ${bitA^bitB}`),el('small','',bitA===bitB?L('Одинаковые биты → 0.','Equal bits → 0.'):L('Разные биты → 1.','Different bits → 1.')));
    const effect=el('output','xor-lens-effect');effect.setAttribute('aria-live','polite');effect.textContent=change?t(L(`Изменили бит ${change.bit}. Результат: ${change.before} → ${change.after}. Изменился ровно этот разряд; переноса в соседние нет.`,`Changed bit ${change.bit}. Result: ${change.before} → ${change.after}. Only this bit changed; there is no carry into neighboring bits.`)):t(L('Нажмите один входной бит и проследите его столбец до результата.','Click one input bit and follow its column to the output.'));
    lens.append(header,context,rows,local,effect);
    if(values.kind==='recover'){lens.append(el('p','xor-lens-consequence',L(`Следствие для второго перехвата: ${v.cipher2} ⊕ ${v.recovered} = ${v.opened}. Это кандидат сообщения при вашем предположении.`,`Consequence for the second intercept: ${v.cipher2} ⊕ ${v.recovered} = ${v.opened}. This is a candidate message under your assumption.`)));}
    lens.append(action(L('Вернуть исходный пример','Restore the original example'),()=>{state=initialXorStory();draw();buildInterventions();renderLens();}));
  }
  const onKey=e=>{if(e.key==='Tab'&&!lens.hidden){const all=[...lens.querySelectorAll('button:not([disabled])')],first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;}if(e.key==='Escape'&&!lens.hidden){e.preventDefault();closeLens();return;}if(e.target.closest('input, select, button, textarea'))return;if(lens.hidden&&e.code==='Space'){e.preventDefault();running?pause():start();}};
  root.addEventListener('keydown',onKey);const visibility=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',visibility);
  resize();
  return {dispose(){disposed=true;pause();observer.disconnect();document.removeEventListener('visibilitychange',visibility);root.remove();}};
}
