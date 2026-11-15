import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Scene } from '../js/core/scene.js';

test('parameter updates only touch active parameter rows', () => {
  const previousRAF = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = () => 1;
  try {
    const scene = new Scene();
    const first = scene.add('a = 1');
    const second = scene.add('a = 2');
    scene.setParam('a', 3);
    assert.equal(first.text, 'a = 3');
    assert.equal(second.text, 'a = 3');

    scene.setText(first, 'b = 4');
    scene.setParam('a', 5);
    assert.equal(first.text, 'b = 4');
    scene.setParam('b', 6);
    assert.equal(first.text, 'b = 6');

    scene.remove(second);
    scene.setParam('a', 7);
    assert.equal(second.text, 'a = 5');
    scene.dispose();
  } finally {
    if (previousRAF) globalThis.requestAnimationFrame = previousRAF;
    else delete globalThis.requestAnimationFrame;
  }
});
