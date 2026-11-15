import test from 'node:test';
import assert from 'node:assert/strict';
import { XOR_CHAPTERS, XOR_DURATION, chapterStart, storyFrame, initialXorStory, xorStoryValues, microscopeValues, interveneXor } from '../js/worlds/crypto/xor-story-model.js';

test('The story clock has exact, seekable chapter boundaries',()=>{
  assert.equal(storyFrame(-1).id,'message');
  XOR_CHAPTERS.forEach((c,i)=>{const f=storyFrame(chapterStart(i));assert.equal(f.index,i);assert.equal(f.progress,0);});
  assert.equal(storyFrame(XOR_DURATION).id,'fragment');assert.equal(storyFrame(XOR_DURATION).progress,1);
  assert.equal(storyFrame(XOR_DURATION+10).time,XOR_DURATION);
});

test('All small examples recover the original pad from a genuinely known plaintext',()=>{
  for(let message=0;message<16;message++)for(let key=0;key<16;key++)for(let second=0;second<16;second++){
    const s={...initialXorStory(),message,key,second},v=xorStoryValues(s);
    assert.equal(v.recovered,key);assert.equal(v.bobMessage,message);assert.equal(v.opened,second);
    const wrong=xorStoryValues({...s,guess:message^1});assert.equal(wrong.recovered,key^1);assert.equal(wrong.opened,second^1);
  }
});

test('The microscope holds received data fixed and changes only the intended cause',()=>{
  for(const chapter of ['encrypt','unlock','recover'])for(let row=0;row<2;row++)for(let bit=0;bit<4;bit++){
    const s=initialXorStory(),before=microscopeValues(s,chapter),next=interveneXor(s,chapter,row,bit),after=microscopeValues(next,chapter);
    assert.deepEqual(s,initialXorStory(),'interventions must not mutate the previous state');
    if(chapter!=='encrypt'&&row===0){assert.deepEqual(next,s);continue;}
    assert.equal(before.result^after.result,1<<bit);
    if(chapter!=='encrypt')assert.equal(xorStoryValues(s).cipher,xorStoryValues(next).cipher);
    if(chapter==='recover')assert.equal(next.message,s.message,'changing an assumption must not rewrite the actual plaintext');
  }
});

test('A recovered pad cannot decode a different pad; knowing a fragment exposes only that fragment',()=>{
  const s=initialXorStory(),before=xorStoryValues(s),different=xorStoryValues({...s,reuse:false});
  assert.equal(before.recovered,different.recovered);assert.notEqual(before.cipher2,different.cipher2);assert.notEqual(different.opened,different.second);
  assert.deepEqual(before.keyFragment,[7,null,null,null]);
  const more=xorStoryValues({...s,known:2});assert.deepEqual(more.keyFragment,[7,12,null,null]);
  assert.throws(()=>interveneXor(s,'encrypt',0,4),RangeError);
});

test('A deliberately different pad stays different after editing the first pad',()=>{
  for(let key=0;key<16;key++){const s={...initialXorStory(),key,reuse:false},v=xorStoryValues(s);assert.notEqual(v.key,v.alternativeKey);assert.notEqual(v.opened,v.second);}
  const s={...initialXorStory(),reuse:false},v=xorStoryValues(s);
  // A wrong assumed plaintext can coincidentally produce the second pad in a tiny example.
  const coincidence=xorStoryValues({...s,guess:v.cipher^v.alternativeKey});
  assert.equal(coincidence.opened,coincidence.second);assert.notEqual(coincidence.recovered,coincidence.key);
});
