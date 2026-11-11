// Expression list of the Lab: every row is shown as typeset math; click it to edit the text.
// A free letter in an expression gets its own parameter row ("a = 1") with a slider and ▶.

import { renderTex } from './tex.js';
import { paramControl } from './params.js';
import { fmt } from '../core/numeric.js';
import { derivative } from '../core/expr.js';
import { keypadButton, prepareInput } from './keypad.js';

// Text of the derivative of a function row: y = f'(x) for the user's f, the formula itself otherwise
function derivativeText(item) {
  if (item.info.name) return `y = ${item.info.name}'(x)`;
  // null when the formula calls the user's function: math.js cannot differentiate f(x - 1)
  const d = derivative(item.info.node);
  if (!d) return null;
  return `y = ${d.toString({ implicit: 'hide' }).replace(/ \^ /g, '^')}`;
}

export class ExprList {
  constructor(container, scene, { onStructure } = {}) {
    this.scene = scene;
    this.onStructure = onStructure || (() => {});
    this.el = document.createElement('div');
    this.el.className = 'exprlist';
    this.el.innerHTML = `
      <div class="rows"></div>
      <form class="add-row">
        <span class="plus">+</span>
        <input placeholder="y = sin(a x),  z = x^2 - y^2,  (cos(t), sin(t))" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="New expression">
      </form>`;
    container.appendChild(this.el);
    this.rowsEl = this.el.querySelector('.rows');
    this.rows = [];

    const form = this.el.querySelector('form'), input = form.querySelector('input');
    prepareInput(input);
    form.appendChild(keypadButton(input));
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!input.value.trim()) return;
      this.add(input.value);
      input.value = '';
      input.scrollIntoView({ block: 'nearest' }); // the new row pushed it down; keep typing visible
    });

    this.off = scene.on(() => this.rows.forEach(r => r.update()));
    for (const item of scene.items) this.autoParams(item);
    this.rebuild();
  }

  add(text) {
    const item = this.scene.add(text);
    this.autoParams(item);
    this.rebuild();
    this.onStructure();
    return item;
  }

  // Desmos-style: a new letter in a formula creates its slider row
  autoParams(item) {
    for (const name of item.info.params || []) {
      const exists = this.scene.items.some(i => i.info.kind === 'param' && i.info.name === name);
      if (!exists) this.scene.add(`${name} = ${fmt(this.scene.params.get(name).value)}`).auto = true;
    }
    // "y = f(x)" typed before "f(x) = …" made f a slider; now f is a function and the slider goes
    this.scene.items.filter(i => i.auto && this.scene.defs.has(i.text.split('=')[0].trim())).forEach(i => this.scene.remove(i));
  }

  // A new row right under `after`
  insertAfter(after, text) {
    const item = this.scene.add(text);
    const list = this.scene.items;
    list.splice(list.indexOf(item), 1);
    list.splice(list.indexOf(after) + 1, 0, item);
    this.autoParams(item);
    this.rebuild();
    this.onStructure();
  }

  rebuild() {
    this.rowsEl.innerHTML = '';
    this.rows = this.scene.items.map(item => this.makeRow(item));
  }

  makeRow(item) {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <button class="swatch" type="button" title="Show / hide"></button>
      <div class="row-body">
        <div class="formula" tabindex="0" title="Click to edit"></div>
        <input class="edit" spellcheck="false" autocomplete="off" autocapitalize="off">
        <div class="row-error"></div>
      </div>
      <button class="deriv" type="button" title="Add the derivative of this function">f′</button>
      <button class="del" type="button" title="Remove" aria-label="Remove">×</button>`;
    this.rowsEl.appendChild(row);
    const [swatch, body, deriv, del] = row.children;
    const [formula, edit, error] = body.children;
    prepareInput(edit);
    let control = null, shownTex = null;

    const render = () => {
      row.style.setProperty('--c', item.color);
      row.classList.toggle('off', !item.visible);
      row.classList.toggle('is-param', item.info.kind === 'param');
      row.classList.toggle('is-function', item.info.kind === 'function');
      if (item.info.kind === 'error') {
        formula.textContent = item.text;
        formula.classList.add('raw');
        error.textContent = item.info.message;
        shownTex = null;
      } else {
        formula.classList.remove('raw');
        error.textContent = '';
        if (shownTex !== item.info.tex) { renderTex(formula, item.info.tex); shownTex = item.info.tex; }
      }
      if (item.info.kind === 'param' && !control) {
        control = paramControl(this.scene, item.info.name);
        body.appendChild(control.el);
      }
    };

    const startEdit = () => {
      row.classList.add('editing');
      edit.value = item.text;
      edit.focus();
    };
    let cancelled = false;
    const commit = () => {
      if (!row.classList.contains('editing')) return;
      row.classList.remove('editing');
      if (cancelled) { cancelled = false; return; }
      if (edit.value === item.text) return;
      const before = item.info.kind;
      this.scene.setText(item, edit.value);
      this.autoParams(item);
      // A different kind or new parameters change the list; otherwise just redraw this row
      if (before !== item.info.kind || this.rows.length !== this.scene.items.length) { this.rebuild(); this.onStructure(); }
      else render();
    };

    formula.addEventListener('click', startEdit);
    formula.addEventListener('keydown', e => { if (e.key === 'Enter') startEdit(); });
    edit.addEventListener('keydown', e => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') { cancelled = true; commit(); }
    });
    edit.addEventListener('blur', commit);
    swatch.addEventListener('click', () => {
      item.visible = !item.visible;
      this.scene.changed();
      render();
    });
    deriv.addEventListener('click', () => {
      const text = derivativeText(item);
      if (text) this.insertAfter(item, text);
      else { error.textContent = 'Name it first: f(x) = …, then add y = f\'(x)'; }
    });
    del.addEventListener('click', () => {
      this.scene.remove(item);
      this.rebuild();
      this.onStructure();
    });

    render();
    return {
      update: () => {
        if (item.info.kind === 'param' && shownTex !== item.info.tex) { renderTex(formula, item.info.tex); shownTex = item.info.tex; }
        if (control) control.update();
      },
    };
  }

  dispose() {
    this.off();
    this.el.remove();
  }
}
