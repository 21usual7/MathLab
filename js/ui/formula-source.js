// The scene and shared links keep plain math. The editor is only a view of it.
import { normalize, definedName, symTex } from '../core/expr.js';

function splitTop(text, separator) {
  let depth = 0, start = 0;
  const result = [];
  for (let i = 0; i < text.length; i++) {
    if ('(['.includes(text[i])) depth++;
    if (')]'.includes(text[i])) depth--;
    if (!depth && text[i] === separator) {
      result.push(text.slice(start, i)); start = i + 1;
    }
  }
  result.push(text.slice(start));
  return result;
}

// Unlike the display formatter, this must never round the user's constants.
export function sourceToLatex(source, names = new Set()) {
  names = new Set(names);
  const ownName = definedName(source);
  if (ownName) names.add(ownName);
  let text = source.trim(), domain = '';
  const range = text.match(/^(.*?)\{([^{}]*)\}\s*$/);
  const texOptions = {
    parenthesis: 'keep', implicit: 'hide',
    handler(node) {
      if (node.isSymbolNode) return ` ${symTex(node.name)} `;
      if ((node.isOperatorNode && node.fn === 'mod') || (node.isFunctionNode && ['sign', 'round', 'mod', 'acot'].includes(node.fn.name))) {
        const name = node.isOperatorNode ? node.fn : node.fn.name;
        return `\\operatorname{${name}}\\left(${node.args.map(a => a.toTex(texOptions)).join(',')}\\right)`;
      }
      if (!node.isFunctionNode) return;
      const d = node.fn.name.match(/^([A-Za-z][A-Za-z0-9]*)_d(\d+)$/);
      if (d) return `${d[1]}^{${'\\prime '.repeat(+d[2])}}\\left(${node.args.map(a => a.toTex(texOptions)).join(',')}\\right)`;
      if (names.has(node.fn.name)) return `${symTex(node.fn.name)}\\left(${node.args.map(a => a.toTex(texOptions)).join(',')}\\right)`;
      const inverse = { asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan' }[node.fn.name];
      if (inverse) return `${inverse}\\left(${node.args[0].toTex(texOptions)}\\right)`;
    },
  };
  const nodeTex = s => math.parse(normalize(s, names)).toTex(texOptions);
  if (range) { text = range[1].trim(); domain = `\\;\\left\\{${nodeTex(range[2])}\\right\\}`; }
  if (text.includes(';')) text = text.replace(/(\d),(\d)/g, '$1.$2').replace(/;/g, ',');
  const convert = value => {
    const s = value.trim();
    if (!s) return '';
    const named = s.match(/^([A-Z])\s*(\(.*\))$/);
    if (named) return `${named[1]}${convert(named[2])}`;
    if ((s[0] === '[' && s.at(-1) === ']') || (s[0] === '(' && s.at(-1) === ')')) {
      const parts = splitTop(s.slice(1, -1), ',');
      if (s[0] === '[' || parts.length > 1) {
        return `\\left${s[0]}${parts.map(convert).join(',\\,')}\\right${s.at(-1)}`;
      }
    }
    return nodeTex(s);
  };
  // Equality is a declaration; comparisons inside a range stay in nodeTex().
  const eq = text.search(/(?<![<>=!])=(?!=)/);
  return (eq < 0 ? convert(text) : `${convert(text.slice(0, eq))}=${convert(text.slice(eq + 1))}`) + domain;
}

function groupAt(text, start) {
  if (text[start] !== '(') return null;
  let depth = 1, end = start + 1;
  while (end < text.length && depth) {
    if (text[end] === '(') depth++;
    if (text[end] === ')') depth--;
    end++;
  }
  return depth ? null : { body: text.slice(start + 1, end - 1), end };
}

function fenceEnd(text, start) {
  const bars = text[start] === '|';
  let depth = 1, needsOperand = true;
  for (let i = start + 1; i < text.length; i++) {
    const c = text[i];
    if (bars && c === '|') {
      if (needsOperand) depth++;
      else if (!--depth) return i;
    } else if (!bars && '⌊⌈'.includes(c)) depth++;
    else if (!bars && '⌋⌉'.includes(c) && !--depth) return i;
    if (!/\s/.test(c) && c !== '|') needsOperand = '+-*/^(,='.includes(c);
  }
  return -1;
}

// MathLive's ASCII output is almost the scene syntax. These constructs have
// different conventions: nth roots, log bases, |x|, and function powers.
export function asciiToSource(ascii, latex = '') {
  // ASCII serialization separates the letters of upright multi-letter names.
  // Restore only names explicitly marked as operators/upright in the TeX;
  // a user writing s·i·g·n must still mean multiplication.
  for (const match of latex.matchAll(/\\(?:operatorname|mathrm)\{([A-Za-z]{2,})\}/g)) {
    const name = match[1];
    ascii = ascii.replace(new RegExp(`\\b${[...name].join('\\s+')}\\s*(?=\\()`, 'g'), name);
  }
  let text = ascii.replace(/\\([{}])/g, '$1')
    .replace(/\\lfloor/g, '⌊').replace(/\\rfloor/g, '⌋').replace(/\\lceil/g, '⌈').replace(/\\rceil/g, '⌉')
    .replace(/″/g, "''").replace(/\\prime|′/g, "'").replace(/\^\(?('+)\)?/g, '$1')
    .replace(/−/g, '-').replace(/(?:\\leq?|≤)/g, '<=').replace(/(?:\\geq?|≥)/g, '>=')
    .replace(/-:/g, '/').replace(/\bvarepsilon\b/g, 'epsilon').replace(/\bvarphi\b/g, 'phi');
  let result = '';
  for (let i = 0; i < text.length;) {
    const root = text.slice(i).match(/^root\s*/);
    const fn = text.slice(i).match(/^(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|log|ln)\s*([_^])\s*/);
    if (root || fn) {
      const prefix = root || fn;
      let pos = i + prefix[0].length;
      let argument = groupAt(text, pos);
      if (!argument && !root && text[pos]) {
        const atom = text.slice(pos).match(/^(?:\d+(?:\.\d+)?|[A-Za-z])/);
        if (atom) argument = { body: atom[0], end: pos + atom[0].length };
      }
      if (argument) {
        pos = argument.end;
        while (text[pos] === ' ') pos++;
        let body = groupAt(text, pos);
        if (!body && fn && fn[2] === '^') {
          const atom = text.slice(pos).match(/^(?:\d+(?:\.\d+)?)?\s*[A-Za-z]\b/);
          if (atom) body = { body: atom[0], end: pos + atom[0].length };
        }
        if (body) {
          const a = asciiToSource(argument.body), b = asciiToSource(body.body);
          const inverse = fn && a === '-1' && ['sin', 'cos', 'tan', 'cot'].includes(fn[1]);
          result += root ? `nthRoot(${b},${a})` : fn[2] === '_' ? `log(${b},${a})` : inverse ? `a${fn[1]}(${b})` : `(${fn[1]}(${b}))^(${a})`;
          i = body.end; continue;
        }
      }
    }
    if (text[i] === '(') {
      const group = groupAt(text, i);
      if (group) { result += `(${asciiToSource(group.body)})`; i = group.end; continue; }
    }
    const fences = { '|': ['|', 'abs'], '⌊': ['⌋', 'floor'], '⌈': ['⌉', 'ceil'] };
    if (fences[text[i]]) {
      let [, name] = fences[text[i]], end = fenceEnd(text, i);
      if (text[i] === '⌊' && text[end] === '⌉') name = 'round';
      if (end > i) { result += `${name}(${asciiToSource(text.slice(i + 1, end))})`; i = end + 1; continue; }
    }
    result += text[i++];
  }
  return result.replace(/\b([A-Za-z]+)_\(([A-Za-z0-9]+)\)/g, '$1_$2').trim();
}
