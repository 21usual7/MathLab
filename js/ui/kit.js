// Small controls for worlds: a slider, a segmented switch, a toggle, a button, a row of them.
// Each returns { el, … } so a world can place it anywhere in its panel.

import { renderTex } from './tex.js';
import { fmt } from '../core/numeric.js';

const tag = (name, cls, html = '') => { const el = document.createElement(name); if (cls) el.className = cls; el.innerHTML = html; return el; };

// A slider with a TeX label and the value at the right
export function slider({ label, min, max, step = 0.01, value, format = v => fmt(v), onInput }) {
  const el = tag('div', 'param', '<span class="pname"></span><input type="range"><span class="pval"></span>');
  const [name, input, val] = el.children;
  renderTex(name, label);
  input.setAttribute('aria-label', label.replace(/\\[a-z]+|[{}]/g, ''));
  Object.assign(input, { min, max, step });
  input.value = value;
  const show = () => { val.textContent = format(+input.value); };
  input.addEventListener('input', () => { show(); onInput(+input.value); });
  show();
  return {
    el,
    get: () => +input.value,
    set(v) { input.value = v; show(); },
    disable(off) { input.disabled = off; el.classList.toggle('off', off); },
  };
}

// One of several: [{ id, label }]
export function seg(options, value, onChange) {
  const el = tag('div', 'seg');
  options.forEach(o => {
    const b = tag('button', o.id === value ? 'active' : '', o.label);
    b.type = 'button';
    b.addEventListener('click', () => {
      if (b.classList.contains('active')) return;
      el.querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
      onChange(o.id);
    });
    el.appendChild(b);
  });
  return { el, set(id) { [...el.children].forEach((b, i) => b.classList.toggle('active', options[i].id === id)); } };
}

export function toggle(label, value, onChange) {
  const el = tag('button', 'ghost', label);
  el.type = 'button';
  el.setAttribute('aria-pressed', String(!!value));
  el.addEventListener('click', () => {
    const on = el.getAttribute('aria-pressed') !== 'true';
    el.setAttribute('aria-pressed', String(on));
    onChange(on);
  });
  return { el, set(on) { el.setAttribute('aria-pressed', String(!!on)); } };
}

export function button(label, onClick, { primary = false } = {}) {
  const el = tag('button', primary ? 'btn primary' : 'btn', label);
  el.type = 'button';
  el.addEventListener('click', onClick);
  return { el, label(html) { el.innerHTML = html; }, disable(off) { el.disabled = off; } };
}

export function row(...items) {
  const el = tag('div', 'kit-row');
  items.filter(Boolean).forEach(x => el.appendChild(x.el || x));
  return el;
}
