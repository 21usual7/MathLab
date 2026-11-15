import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tween } from '../js/core/anim.js';

test('stopping a tween cancels its frame and prevents a restart from onFrame', () => {
  const oldRaf = globalThis.requestAnimationFrame, oldCancel = globalThis.cancelAnimationFrame;
  const frames = new Map(), cancelled = [];
  let next = 0;
  globalThis.requestAnimationFrame = fn => { const id = ++next; frames.set(id, fn); return id; };
  globalThis.cancelAnimationFrame = id => cancelled.push(id);
  try {
    let calls = 0;
    const stop = tween(100, () => calls++);
    stop();
    assert.deepEqual(cancelled, [1]);
    frames.get(1)(0);
    assert.equal(calls, 0);

    let stopInside;
    stopInside = tween(100, () => { calls++; stopInside(); });
    frames.get(2)(10);
    assert.equal(calls, 1);
    assert.equal(frames.size, 2); // no next frame was scheduled after the callback stopped itself
  } finally {
    if (oldRaf === undefined) delete globalThis.requestAnimationFrame;
    else globalThis.requestAnimationFrame = oldRaf;
    if (oldCancel === undefined) delete globalThis.cancelAnimationFrame;
    else globalThis.cancelAnimationFrame = oldCancel;
  }
});
