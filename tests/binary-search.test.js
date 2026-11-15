import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boundary, invariant, transition, trace, validInput, checkCounterexample, checkTransfer, TRANSFER, CHAPTERS, DURATION, chapterStart, frameAt, playbackStep } from '../js/worlds/algorithms/binary-search-model.js';

function* sortedArrays(length, prefix = [], min = -1) {
  if (!length) { yield prefix; return; }
  for (let v = min; v <= 2; v++) yield* sortedArrays(length - 1, [...prefix, v], v);
}
test('lower_bound agrees with a linear oracle; every step preserves its invariant and terminates', () => {
  for (let n = 0; n <= 7; n++) for (const a of sortedArrays(n)) for (const x of [-2, -1, -.5, 0, .5, 1, 1.5, 2, 3]) {
    const run = trace(a, x), oracle = a.filter(v => v < x).length;
    assert.equal(run.result, oracle, `${a}, x=${x}`);
    assert.equal(run.reason, 'done'); assert.equal(run.state.lo, run.state.hi);
    assert.ok(run.steps.length <= (n ? Math.floor(Math.log2(n)) + 1 : 0));
    for (const s of run.steps) {
      assert.ok(invariant(a, x, s)); assert.ok(s.valid); assert.ok(s.decreased);
      assert.ok(s.after.lo <= oracle && oracle <= s.after.hi, 'the boundary is in the CLOSED interval');
    }
  }
});
test('duplicates, absent equality, empty inputs, and sentinel n are first-class cases', () => {
  assert.equal(boundary([1, 3, 3, 3, 9], 3), 1);
  assert.equal(trace([1, 3, 3, 3, 9], 4).result, 4);
  assert.equal(trace([], 4).result, 0);
  assert.equal(trace([1, 3], 4).result, 2);
  assert.ok(invariant([1, 3], 4, { lo: 2, hi: 2 }));
});
test('wrong update preserves safety while destroying the strict progress measure', () => {
  const run = trace([1, 3], 3, 'stall'), last = run.steps.at(-1);
  assert.equal(run.reason, 'stalled'); assert.ok(last.valid); assert.equal(last.decreased, false);
  assert.deepEqual(last.after, { lo: 0, hi: 1 });
  assert.deepEqual(transition([1, 3], 3, last.after, 'stall').after, last.after);
  assert.equal(checkCounterexample([1, 3], 3).ok, true);
  assert.equal(checkCounterexample([1, 3], 0).ok, false);
});
test('microscope changes one line from the same snapshot and exposes lost boundaries', () => {
  const a = [1, 3, 3, 5], state = { lo: 0, hi: 4 };
  const correct = transition(a, 3, state), upper = transition(a, 3, state, 'upper'), skip = transition(a, 3, state, 'skip');
  assert.equal(correct.mid, upper.mid); assert.equal(correct.mid, skip.mid);
  assert.equal(correct.valid, true); assert.equal(upper.valid, false);
  const loseFirst = transition([1, 3, 3], 3, { lo: 0, hi: 3 }, 'skip');
  assert.equal(loseFirst.valid, false); assert.equal(loseFirst.after.hi, 0);
  assert.deepEqual(state, { lo: 0, hi: 4 });
});
test('reject unsorted, nonfinite, out-of-range bounds and invalid counterexample inputs', () => {
  assert.equal(validInput([2, 1], 1), false); assert.equal(validInput([Infinity], 1), false);
  assert.throws(() => trace([3, 1], 2), RangeError);
  assert.throws(() => transition([1], 1, { lo: -1, hi: 1 }), RangeError);
  assert.equal(checkCounterexample([], 1).ok, false);
  assert.equal(checkCounterexample(Array(13).fill(1), 2).ok, false);
});
test('transfer does not accept blank input as zero or an arbitrary equal position', () => {
  assert.deepEqual(checkTransfer(['1', '3', '4']), [true, true, true]);
  assert.deepEqual(checkTransfer(['2', '3', '4']), [false, true, true]);
  assert.deepEqual(checkTransfer(['', '', '']), [false, false, false]);
  assert.equal(TRANSFER[0].a[1], TRANSFER[0].a[2]);
});
test('director endpoints and chapters produce deterministic scrubbing', () => {
  assert.equal(frameAt(-10).time, 0); assert.equal(frameAt(Infinity).time, DURATION);
  for (let i = 0; i < CHAPTERS.length; i++) {
    assert.equal(frameAt(chapterStart(i)).id, CHAPTERS[i].id);
    assert.deepEqual(frameAt(chapterStart(i) + .2), frameAt(chapterStart(i) + .2));
  }
  assert.equal(frameAt(DURATION).progress, 1);
});

test('trace playback retains the completed final transition at the exact endpoint', () => {
  const run = trace([1, 3, 3, 5, 8, 8, 12, 17], 8);
  const first = playbackStep(run, 0), last = playbackStep(run, 1);
  assert.equal(first.index, 0); assert.equal(first.progress, 0);
  assert.equal(last.index, run.steps.length - 1); assert.equal(last.progress, 1);
  assert.deepEqual(last.step.after, { lo: 4, hi: 4 });
  assert.equal(playbackStep(run, 1 / run.steps.length).progress, 0);
  assert.equal(playbackStep(run, 3).progress, 1);
  assert.equal(playbackStep(trace([], 8), 1).step, null);
});
