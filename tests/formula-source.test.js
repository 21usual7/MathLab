import test from 'node:test';
import assert from 'node:assert/strict';
import * as mathjs from 'mathjs';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { sourceToLatex, asciiToSource } from '../js/ui/formula-source.js';
import { analyze, compile } from '../js/core/expr.js';

globalThis.math = mathjs;

test('editor import preserves precision, declarations, domains and array shapes', () => {
  assert.match(sourceToLatex('a = 1.234567891234'), /1\.234567891234/);
  assert.match(sourceToLatex('f(x) = x^2'), /f.*left\(/);
  assert.match(sourceToLatex("y = f''(x)", new Set(['f'])), /f\^\{\\prime \\prime /);
  assert.match(sourceToLatex('y = 1/x {0 < x <= 4}'), /\\frac.*\\left\\\{/);
  assert.equal((sourceToLatex('M = [[2,1],[0,1]]').match(/\\left\[/g) || []).length, 3);
  assert.match(sourceToLatex('A(1; 2,5)'), /A.*2\.5/);
  assert.doesNotThrow(() => sourceToLatex('(cos(t), sin(t))'));
  assert.doesNotThrow(() => sourceToLatex('y = (x+1)*(x-1)'));
});

test('structured fractions and nested powers retain their evaluation', () => {
  for (const [input, value] of [
    ['y=(x+1)/(x-1)', 2],
    ['y=(1)/(1+(1)/(x))', .75],
    ['y=x^(2+1)', 27],
    ['y=sin^2(x)', Math.sin(3) ** 2],
    ['y=sin^(2)(3x)', Math.sin(9) ** 2],
    ['y=cos^2 x', Math.cos(3) ** 2],
    ['y=root(3)(x+5)', 2],
    ['y=log_(2)(x+1)', 2],
    ['y=log_(10)(x+7)', 1],
    ['y=|x-5|', 2],
    ['y=⌊x/2⌋', 1],
    ['y=⌈x/2⌉', 2],
  ]) {
    const source = asciiToSource(input), info = analyze(source);
    assert.equal(info.kind, 'function', `${input} → ${source}: ${info.message}`);
    assert.ok(Math.abs(compile(info.node)({ x: 3 }) - value) < 1e-10, input);
  }
});

test('derivative primes, ranges and subscripts survive export', () => {
  assert.equal(asciiToSource("y=f^('')(x)"), "y=f''(x)");
  assert.equal(asciiToSource('a_(12)=2'), 'a_12=2');
  const info = analyze(asciiToSource('y=sqrt(x) {0≤x≤4}'));
  assert.equal(info.kind, 'function');
  assert.equal(compile(info.domain.hi)({}), 4);
  assert.equal(analyze(asciiToSource('M=[[2,1],[0,1]]')).kind, 'matrix2');
});

test('incomplete input remains incomplete rather than inventing operands', () => {
  for (const s of ['y=()/()', 'y=sqrt()', 'y=x^()', 'y=root()(x)', 'y=log_()(x)']) {
    assert.equal(analyze(asciiToSource(s)).kind, 'error', s);
  }
});

test('real bundled MathLive round trips preserve kind, parameters and numerical meaning', () => {
  // Only the pure conversion API is exercised here. HTMLElement is never
  // instantiated; the browser integration is in check-expressions.mjs.
  const context = vm.createContext({ HTMLElement: class {}, URL, console: { log() {}, warn() {}, error() {} } });
  const library = new URL('../vendor/mathlive/mathlive.min.js', import.meta.url);
  vm.runInContext(readFileSync(library, 'utf8'), context, { filename: library.pathname });
  const convert = context.MathLive.convertLatexToAsciiMath;
  const names = new Set(['f', 'wave']);
  const scope = { x: .4, y: 2, t: .7, a: 1.2, b: .8, c: -2, p: .5, h: 1, k: 2, T: 4,
    f: x => x * x - 2, f_d1: x => 2 * x, f_d2: () => 2, wave: x => Math.sin(x) };
  const sources = [
    'y = a sin(b x)', 'z = a sin(x) cos(b y)', 'a = 1.23456789123',
    'y=x^3-3x', 'y=e^(-x^2)', 'y=sin(x)/x', 'y=a x^2+b x+c',
    'f(x)=x^2-2', "y=f'(x)", "y=f''(x)", 'y=wave(x)',
    'y=sqrt(x) {0<=x<=4}', '(t cos(t)/4,t sin(t)/4) {0<=t<=T}',
    'v=[a,2]', 'M=[[cos(p),-sin(p)],[sin(p),cos(p)]]', 'A(1;2,5)',
    'y=log(x,2)', 'y=log10(x)', 'y=log2(x)', 'y=abs(x)',
    'y=floor(x)', 'y=ceil(x)', 'y=nthRoot(x,3)', 'y=sin(x)^2', 'y=exp(x)',
    'y=1e-7*x', 'y=atan(x)', 'y=asin(x)', 'y=acos(x)', 'y=acot(x)',
    'y=cbrt(x)', 'y=sign(x)', 'y=round(x)', 'y=min(x,2)', 'y=max(x,2)',
    'y=mod(x,2)', 'y=x % 2', 'y=sec(x)', 'y=csc(x)', 'y=round(atan(x),2)',
    'y=abs(abs(x)-2)', 'y=abs(x+abs(x))', 'y=floor(floor(x)/2)',
  ];
  for (const source of sources) {
    const latex = sourceToLatex(source, names), ascii = convert(latex);
    const exported = asciiToSource(ascii, latex);
    const before = analyze(source, names), after = analyze(exported, names);
    assert.notEqual(before.kind, 'error', source);
    assert.equal(after.kind, before.kind, `${source} → ${ascii} → ${exported}: ${after.message}`);
    assert.deepEqual(after.params, before.params, `${source}: parameter names changed`);
    const originalNodes = before.nodes || (before.node ? [before.node] : []);
    const resultNodes = after.nodes || (after.node ? [after.node] : []);
    originalNodes.forEach((node, i) => {
      const a = compile(node)(scope), b = compile(resultNodes[i])(scope);
      assert.ok(Number.isNaN(a) && Number.isNaN(b) || Math.abs(a - b) < 1e-12, `${source}: ${a} became ${b} (${exported})`);
    });
    if (before.value !== undefined) assert.equal(after.value, before.value, source);
    if (before.domain) {
      for (const key of ['lo', 'hi']) if (before.domain[key]) assert.equal(compile(after.domain[key])(scope), compile(before.domain[key])(scope), source);
    }
  }
});
