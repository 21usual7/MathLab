// One small, exact example drives the entire story and every microscope intervention.
export const XOR_CHAPTERS = [
  { id:'message', duration:5, ru:'Сообщение', en:'A message' },
  { id:'encrypt', duration:10, ru:'Надеть маску', en:'Put on a mask' },
  { id:'cipher', duration:7, ru:'Шифротекст', en:'Ciphertext' },
  { id:'unlock', duration:7, ru:'Снять маску', en:'Remove the mask' },
  { id:'problem', duration:8, ru:'Что знает Ева?', en:'What does Eve know?' },
  { id:'recover', duration:10, ru:'Найти ключ', en:'Recover the key' },
  { id:'reuse', duration:9, ru:'Второе сообщение', en:'The second message' },
  { id:'fragment', duration:7, ru:'Граница атаки', en:'The limit of the attack' },
];
export const XOR_DURATION = XOR_CHAPTERS.reduce((s,c)=>s+c.duration,0);
export const chapterStart = index => XOR_CHAPTERS.slice(0,index).reduce((s,c)=>s+c.duration,0);
export function storyFrame(seconds) {
  const time=Math.max(0,Math.min(XOR_DURATION,seconds));
  let start=0;
  for(let i=0;i<XOR_CHAPTERS.length;i++) {const c=XOR_CHAPTERS[i];if(time<start+c.duration||i===XOR_CHAPTERS.length-1)return{index:i,id:c.id,progress:(time-start)/c.duration,time};start+=c.duration;}
}
export const initialXorStory = () => ({ message:13, key:7, second:9, secondKey:3, reuse:true, guess:null, bobKey:null, known:1 });
export function xorStoryValues(state) {
  const {message,key,second,secondKey,reuse}=state;
  const alternativeKey=secondKey===key?key^1:secondKey;
  const cipher=message^key, cipher2=second^(reuse?key:alternativeKey);
  const known=state.guess??message, recovered=cipher^known, bobKey=state.bobKey??key;
  const messages=[message,2,14,7], keys=[key,12,5,9];
  return { message,key,second,alternativeKey,cipher,cipher2,known,recovered,bobKey,bobMessage:cipher^bobKey,opened:cipher2^recovered,
    keyFragment:keys.map((k,i)=>i<state.known?k:null),
    firstCipher:messages.map((m,i)=>m^keys[i]),
    knownMessage:messages.map((m,i)=>i<state.known?m:null),
  };
}
export function microscopeValues(state, chapter) {
  const v=xorStoryValues(state);
  if(chapter==='unlock')return{a:v.cipher,b:v.bobKey,result:v.bobMessage,labels:['C','K?', 'M?'],kind:'unlock'};
  if(['problem','recover','reuse','fragment'].includes(chapter))return{a:v.cipher,b:v.known,result:v.recovered,labels:['C₁','M₁?', 'K?'],kind:'recover'};
  return{a:v.message,b:v.key,result:v.cipher,labels:['M','K','C'],kind:'encrypt'};
}
export function interveneXor(state, chapter, row, bit) {
  if(!Number.isInteger(bit)||bit<0||bit>3||![0,1].includes(row))throw new RangeError('Invalid bit intervention');
  const next={...state}, mask=1<<bit, kind=microscopeValues(state,chapter).kind;
  if(kind==='encrypt')next[row===0?'message':'key']^=mask;
  else if(kind==='unlock') {
    if(row===0)return next; // The received ciphertext is held fixed in this experiment.
    next.bobKey=(state.bobKey??state.key)^mask;
  } else {
    if(row===0)return next; // Eve edits an assumption, not the intercept.
    next.guess=(state.guess??state.message)^mask;
  }
  return next;
}
