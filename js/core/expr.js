// Expressions: user text → math.js node → kind (function, surface, curve, point, parameter),
// compiled evaluators and clean TeX.
// math.js is loaded as a classic script and is available as the global `math`.

// Variables with a fixed meaning; any other free letter becomes a parameter (slider)
export const VARIABLES = new Set(['x', 'y', 'z', 't']);
const CONSTANTS = new Set(['e', 'pi', 'tau']);

const GREEK = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda',
  'mu', 'nu', 'xi', 'rho', 'sigma', 'upsilon', 'phi', 'chi', 'psi', 'omega'];

const FUNCTIONS = ['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'asin', 'acos', 'atan', 'acot', 'sinh', 'cosh', 'tanh',
  'sqrt', 'cbrt', 'nthRoot', 'exp', 'log', 'log10', 'log2', 'abs', 'sign', 'floor', 'ceil', 'round', 'min', 'max', 'mod'];

// Words that are never split into letters
const WORDS = [...FUNCTIONS, ...GREEK, 'pi', 'tau'].sort((a, b) => b.length - a.length);

// "xsin" → "x*sin", "ax" → "a*x", "pix" → "pi*x": Desmos-style implicit multiplication of letters
function splitWord(w) {
  if (WORDS.includes(w) || w.length === 1 || /[\d_]/.test(w)) return w;
  const parts = [];
  for (let i = 0; i < w.length;) {
    const word = WORDS.find(k => k.length > 1 && w.startsWith(k, i));
    parts.push(word || w[i]);
    i += word ? word.length : 1;
  }
  return parts.join('*');
}

// Typing conveniences → math.js syntax
export function normalize(text) {
  return String(text).trim()
    .replace(/[−–]/g, '-')
    .replace(/[×·]/g, '*')
    .replace(/π/g, 'pi')
    .replace(/√\s*\(/g, 'sqrt(')
    .replace(/\bln\s*\(/g, 'log(')
    .replace(/\btg\b/g, 'tan')
    .replace(/\bctg\b/g, 'cot')
    .replace(/\barc(sin|cos|tan)\b/g, 'a$1')
    .replace(/[A-Za-z_][A-Za-z0-9_]*/g, splitWord)
    // a single letter before "(" is multiplication: a(x + 1), x(x - 1), e^x(…)
    .replace(/\b([A-Za-z])\s*\(/g, '$1*(');
}

// Split on a separator at bracket depth 0 ("=" is skipped when part of <=, >=, ==, !=)
function splitTop(s, sep) {
  const parts = [];
  let depth = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === sep && depth === 0) {
      if (sep === '=' && ('<>=!'.includes(s[i - 1]) || s[i + 1] === '=')) continue;
      parts.push(s.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(s.slice(start));
  return parts;
}

// "(f, g)" / "(f, g, h)" → components; null if not a tuple
function splitTuple(s) {
  if (!s.startsWith('(') || !s.endsWith(')')) return null;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    if (depth === 0 && i < s.length - 1) return null; // the first "(" closes early: "(x+1)*(x-1)"
  }
  const parts = splitTop(s.slice(1, -1), ',');
  return parts.length >= 2 ? parts : null;
}

// Parse one expression and check that every function is a known one
export function parseNode(s) {
  if (!s.trim()) throw new Error('Empty expression');
  const node = math.parse(s);
  node.traverse((n, path, parent) => {
    if (n.isFunctionNode && !FUNCTIONS.includes(n.fn.name)) {
      throw new Error(`Unknown function "${n.fn.name}"`);
    }
    if (n.isSymbolNode && FUNCTIONS.includes(n.name) && !(parent && parent.isFunctionNode && path === 'fn')) {
      throw new Error(`Write ${n.name}(…) with parentheses`);
    }
    if (n.isAssignmentNode || n.isFunctionAssignmentNode) throw new Error('Unexpected "="');
  });
  return node;
}

export function freeSymbols(node) {
  const names = new Set();
  node.traverse((n, path, parent) => {
    if (n.isSymbolNode && !(parent && parent.isFunctionNode && path === 'fn') && !CONSTANTS.has(n.name)) names.add(n.name);
  });
  return names;
}

const paramsOf = syms => [...syms].filter(s => !VARIABLES.has(s));

// Text → { kind, ... }. Kinds: function (y = f(x)), surface (z = f(x, y)), curve2/curve3 ((f(t), g(t)[, h(t)])),
// point2/point3, param (a = 1.5), empty, error. Never throws.
export function analyze(text) {
  try {
    const s = normalize(text);
    if (!s) return { kind: 'empty' };

    const sides = splitTop(s, '=');
    if (sides.length > 2) throw new Error('Too many "="');
    const lhs = sides.length === 2 ? sides[0].trim() : null;
    const rhs = sides[sides.length - 1].trim();

    const tuple = splitTuple(rhs);
    if (tuple) {
      if (lhs !== null) throw new Error('A point or a curve has no left side');
      if (tuple.length > 3) throw new Error('Use 2 or 3 coordinates');
      const nodes = tuple.map(parseNode);
      const syms = new Set(nodes.flatMap(n => [...freeSymbols(n)]));
      if (['x', 'y', 'z'].some(v => syms.has(v))) throw new Error('A curve uses t as its parameter: (cos(t), sin(t))');
      const curve = syms.has('t');
      const kind = (curve ? 'curve' : 'point') + nodes.length;
      return { kind, nodes, params: paramsOf(syms), tex: `\\left(${nodes.map(tex).join(',\\ ')}\\right)` };
    }

    const node = parseNode(rhs);
    const syms = freeSymbols(node);

    if (lhs !== null && lhs !== 'y' && lhs !== 'z') {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(lhs) || VARIABLES.has(lhs) || CONSTANTS.has(lhs) || FUNCTIONS.includes(lhs)) {
        throw new Error(lhs === 'x' ? 'Vertical lines x = c are not supported yet' : 'Write y = …, z = … or a = number');
      }
      if (syms.size) throw new Error(`A parameter needs a number: ${lhs} = 1`);
      const value = node.evaluate();
      if (typeof value !== 'number' || !isFinite(value)) throw new Error('A parameter needs a real number');
      return { kind: 'param', name: lhs, value, params: [], tex: paramTex(lhs, value) };
    }

    if (syms.has('t')) throw new Error('t is for curves: (cos(t), sin(t))');
    if (lhs === 'y' && (syms.has('y') || syms.has('z'))) throw new Error('y = … can only use x');
    if (lhs === 'z' || syms.has('y')) {
      if (syms.has('z')) throw new Error('z = … can only use x and y');
      return { kind: 'surface', node, params: paramsOf(syms), tex: `z = ${tex(node)}` };
    }
    if (syms.has('z')) throw new Error('Write z = f(x, y) for a surface');
    return { kind: 'function', node, params: paramsOf(syms), tex: `y = ${tex(node)}` };
  } catch (e) {
    return { kind: 'error', message: e.message.replace(/\(char \d+\)/, '').trim() };
  }
}

// Compiled evaluator: scope → number (NaN for complex values and errors)
export function compile(node) {
  const code = node.compile();
  return scope => {
    try {
      const v = code.evaluate(scope);
      return typeof v === 'number' ? v : NaN;
    } catch (e) {
      return NaN;
    }
  };
}

// Symbolic derivative (simplified) or null
export function derivative(node, variable = 'x') {
  try {
    return math.simplify(math.derivative(node, variable));
  } catch (e) {
    return null;
  }
}

// ---------- Clean TeX ----------

const FN_TEX = {
  sin: '\\sin', cos: '\\cos', tan: '\\tan', cot: '\\cot', sec: '\\sec', csc: '\\csc',
  asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan', sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh', log: '\\ln',
};

export function symTex(name) {
  if (name === 'pi') return '\\pi';
  if (name === 'tau') return '\\tau';
  if (name === 'phi') return '\\varphi';
  if (GREEK.includes(name)) return '\\' + name;
  const sub = name.match(/^([A-Za-z]+)_?(\d+)$/) || name.match(/^([A-Za-z]+)_(\w+)$/);
  if (sub) return `${symTex(sub[1])}_{${sub[2]}}`;
  return name.length === 1 ? name : `\\mathrm{${name}}`;
}

export function numTex(v) {
  if (!isFinite(v)) return v > 0 ? '\\infty' : v < 0 ? '-\\infty' : '\\text{undefined}';
  const s = String(Number(v.toPrecision(6)));
  const m = s.match(/^(-?[\d.]+)e([+-]\d+)$/);
  return m ? `${m[1]} \\cdot 10^{${+m[2]}}` : s;
}

const paramTex = (name, v) => `${symTex(name)} = ${numTex(v)}`;
const par = s => `\\left(${s}\\right)`;
// Wrap in parentheses when the expression binds weaker than needed
const at = (e, p) => (e.p < p ? par(e.s) : e.s);

// Precedence: sum 1, negation 2, product 3, function/fraction 6, power 7, atom 9
function emit(n) {
  if (n.isParenthesisNode) return emit(n.content);
  if (n.isConstantNode) return { s: numTex(n.value), p: n.value < 0 ? 2 : 9, k: 'num' };
  if (n.isSymbolNode) return { s: symTex(n.name), p: 9, k: 'atom' };
  if (n.isOperatorNode) return emitOp(n);
  if (n.isFunctionNode) return emitFn(n);
  return { s: n.toTex(), p: 9, k: 'atom' };
}

// sin x, sin 2x, sin πx — but sin(x + 1), sin(x²)
function fnArg(node) {
  const a = emit(node);
  const simple = (a.k === 'atom' || a.k === 'num' || a.k === 'prod') && a.p >= 3 && /^[\w\\ ]+$/.test(a.s);
  return simple ? ` ${a.s}` : par(a.s);
}

function product(A, B) {
  // x·3 is written 3x
  if (B.isConstantNode && !A.isConstantNode) [A, B] = [B, A];
  const a = emit(A), b = emit(B);
  const left = at(a, 3), right = at(b, 3);
  // A number on the right, or a bare function on the left (sin x · y), needs a visible dot
  const bare = a.k === 'fn' && !left.endsWith('\\right)');
  const dot = /^[\d.]/.test(right) || (bare && b.k !== 'fn');
  return { s: left + (dot ? ' \\cdot ' : ' ') + right, p: 3, k: 'prod' };
}

function emitOp(n) {
  const [A, B] = n.args;
  switch (n.fn) {
    case 'add': {
      const a = emit(A);
      if (B.isOperatorNode && B.fn === 'unaryMinus') return { s: `${a.s} - ${at(emit(B.args[0]), 3)}`, p: 1, k: 'sum' };
      if (B.isConstantNode && B.value < 0) return { s: `${a.s} - ${numTex(-B.value)}`, p: 1, k: 'sum' };
      return { s: `${a.s} + ${at(emit(B), 2)}`, p: 1, k: 'sum' };
    }
    case 'subtract':
      return { s: `${emit(A).s} - ${at(emit(B), 3)}`, p: 1, k: 'sum' };
    case 'unaryMinus':
      return { s: `-${at(emit(A), 3)}`, p: 2, k: 'neg' };
    case 'unaryPlus':
      return emit(A);
    case 'multiply': {
      // (-a)·b is written -ab
      if (A.isOperatorNode && A.fn === 'unaryMinus') {
        const r = product(A.args[0], B);
        return { s: `-${r.s}`, p: 2, k: 'neg' };
      }
      return product(A, B);
    }
    case 'divide':
      // (-a)/b is written -a/b with the minus in front of the fraction
      if (A.isOperatorNode && A.fn === 'unaryMinus') return { s: `-\\frac{${emit(A.args[0]).s}}{${emit(B).s}}`, p: 2, k: 'neg' };
      return { s: `\\frac{${emit(A).s}}{${emit(B).s}}`, p: 6, k: 'frac' };
    case 'pow': {
      const b = emit(B);
      // sin(x)^2 → sin² x
      if (A.isFunctionNode && FN_TEX[A.fn.name] && A.fn.name !== 'log') {
        return { s: `${FN_TEX[A.fn.name]}^{${b.s}}${fnArg(A.args[0])}`, p: 6, k: 'fn' };
      }
      const a = emit(A);
      const base = a.p < 9 || a.k === 'frac' || a.k === 'pow' ? par(a.s) : a.s;
      return { s: `${base}^{${b.s}}`, p: 7, k: 'pow' };
    }
    case 'factorial':
      return { s: `${at(emit(A), 9)}!`, p: 7, k: 'pow' };
    case 'mod':
      return { s: `${at(emit(A), 3)} \\bmod ${at(emit(B), 3)}`, p: 3, k: 'prod' };
    default:
      return { s: n.toTex(), p: 1, k: 'sum' };
  }
}

function emitFn(n) {
  const name = n.fn.name, args = n.args;
  const arg = i => emit(args[i]).s;
  switch (name) {
    case 'sqrt': return { s: `\\sqrt{${arg(0)}}`, p: 9, k: 'atom' };
    case 'cbrt': return { s: `\\sqrt[3]{${arg(0)}}`, p: 9, k: 'atom' };
    case 'nthRoot': return { s: `\\sqrt[${arg(1)}]{${arg(0)}}`, p: 9, k: 'atom' };
    case 'abs': return { s: `\\left|${arg(0)}\\right|`, p: 9, k: 'atom' };
    case 'exp': return { s: `e^{${arg(0)}}`, p: 7, k: 'pow' };
    case 'floor': return { s: `\\lfloor ${arg(0)} \\rfloor`, p: 9, k: 'atom' };
    case 'ceil': return { s: `\\lceil ${arg(0)} \\rceil`, p: 9, k: 'atom' };
    case 'log10': return { s: `\\log_{10}${fnArg(args[0])}`, p: 6, k: 'fn' };
    case 'log2': return { s: `\\log_{2}${fnArg(args[0])}`, p: 6, k: 'fn' };
    case 'log':
      if (args.length === 2) return { s: `\\log_{${arg(1)}}${fnArg(args[0])}`, p: 6, k: 'fn' };
  }
  if (FN_TEX[name] && args.length === 1) return { s: FN_TEX[name] + fnArg(args[0]), p: 6, k: 'fn' };
  return { s: `\\operatorname{${name}}${par(args.map(a => emit(a).s).join(', '))}`, p: 6, k: 'fn' };
}

export function tex(node) {
  return emit(node).s;
}
