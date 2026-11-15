import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256Trace, hashHex, utf8, distance, prefix, collisionProbability, findPrefixCollision, crc32 } from '../js/worlds/crypto/hash-math.js';

test('SHA-256 trace agrees with Web Crypto across padding boundaries, multiblock inputs and UTF-8', async () => {
  const examples=['','abc','Привет, Боб!','🔐 Alice → Bob'];
  for(const length of [1,55,56,63,64,65,119,120,127,128,255,1024]) examples.push('a'.repeat(length));
  for(const text of examples) {
    const trace=sha256Trace(text), reference=new Uint8Array(await crypto.subtle.digest('SHA-256',utf8(text)));
    assert.equal(hashHex(trace.digest),hashHex(reference),`input ${text.length}`);
    assert.equal(trace.paddedLength%64,0);
    for(const block of trace.blocks) {
      assert.equal(block.frames.length,65);assert.equal(block.words.length,64);
      assert.deepEqual(block.frames[0],block.before);
      assert.deepEqual(block.after,block.before.map((x,i)=>(x+block.frames[64][i])>>>0));
      assert(block.frames.every(f=>f.length===8&&f.every(x=>Number.isInteger(x)&&x>=0&&x<=0xffffffff)));
    }
  }
  assert.equal(hashHex(sha256Trace('abc').digest),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.throws(()=>sha256Trace(new Uint8Array(4097)),RangeError);
});

test('A one-bit input perturbation is shown as actual round-state differences, not an invented avalanche',()=>{
  const a=utf8('PAY BOB 100'),b=Uint8Array.from(a);b[0]^=128;
  assert.equal(distance(a,b),1);
  const A=sha256Trace(a),B=sha256Trace(b);
  assert.equal(distance(A.blocks[0].frames[0],B.blocks[0].frames[0]),0);
  assert.notEqual(distance(A.blocks[0].frames[1],B.blocks[0].frames[1]),0);
  assert(distance(A.digest,B.digest)>0);
  // The displayed counts are computed; exactly 128 changed bits is not an invariant.
  assert.equal(distance([0xffffffff],[0]),32);
});

test('A short-prefix collision does not imply equality of the full SHA-256 digests',()=>{
  for(const bits of [4,8]) {
    const found=findPrefixCollision(bits);
    assert(found);assert.notEqual(found.first.text,found.second.text);
    assert.equal(prefix(found.first.digest,bits),prefix(found.second.digest,bits));
    assert.notEqual(hashHex(found.first.digest),hashHex(found.second.digest));
  }
  assert.equal(collisionProbability(0,8),0);assert.equal(collisionProbability(1,8),0);
  assert(Math.abs(collisionProbability(2,8)-1/256)<1e-15);
  assert(collisionProbability(19,8)>.49&&collisionProbability(19,8)<.5);
  assert.equal(collisionProbability(257,8),1);
  assert.throws(()=>prefix(new Uint8Array(32),0),RangeError);
});

test('CRC32 matches the standard check value, illustrating a different primitive from SHA-256',()=>{
  assert.equal(crc32('123456789'),0xcbf43926);
  assert.equal(crc32(''),0);
  assert.notEqual(crc32('PAY BOB 100'),crc32('PAY BOB 900'));
});
