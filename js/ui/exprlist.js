// Lab expressions stay typeset while editing and update the scene as you type.
// A free letter in an expression gets its own parameter row ("a = 1") with a slider and ▶.

import { paramControl } from './params.js';
import { fmt } from '../core/numeric.js';
import { derivative } from '../core/expr.js';
import { mathEditor } from './mathfield.js';

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
    this.el.innerHTML = `<div class="expression-toolbar"><span>Expressions</span><button type="button" class="add-expression" aria-label="Add expression">+ Add</button></div><div class="rows"></div><div class="expression-hint">Enter · next expression <span>/ · fraction &nbsp; ^ · power</span></div>`;
    container.appendChild(this.el);
    this.rowsEl = this.el.querySelector('.rows');
    this.rows = new Map();
    this.draft = null;
    this.el.querySelector('.add-expression').addEventListener('click', () => this.ensureDraft().editor.focus());
    for (const item of [...scene.items]) this.autoParams(item);
    this.rebuild();
    this.off = scene.on(() => {
      for (const row of this.rows.values()) row.update();
    });
  }

  add(text) {
    const item = this.scene.add(text);
    this.autoParams(item);
    this.rebuild();
    this.onStructure();
    return item;
  }

  autoParams(item) {
    for (const name of item.info.params || []) {
      const exists = this.scene.items.some(i => i.info.kind === 'param' && i.info.name === name);
      if (!exists) this.scene.add(`${name} = ${fmt(this.scene.params.get(name).value)}`).auto = true;
    }
    this.scene.items.filter(i => i.auto && this.scene.defs.has(i.text.split('=')[0].trim())).forEach(i => this.scene.remove(i));
  }

  insertAfter(after, text) {
    const item = this.scene.add(text);
    const list = this.scene.items;
    list.splice(list.indexOf(item), 1);
    list.splice(list.indexOf(after) + 1, 0, item);
    this.autoParams(item);
    this.rebuild();
    this.onStructure();
    this.rows.get(item.id)?.editor.focus();
  }

  ensureDraft() {
    if (!this.draft) this.draft = this.makeRow(null);
    if (this.rowsEl.lastElementChild !== this.draft.el) this.rowsEl.appendChild(this.draft.el);
    return this.draft;
  }

  // Reconcile rows without replacing the focused editor or its undo history.
  rebuild() {
    const ids = new Set(this.scene.items.map(item => item.id));
    for (const [id, row] of this.rows) {
      if (!ids.has(id)) { row.dispose(); this.rows.delete(id); }
    }
    this.scene.items.forEach((item, index) => {
      let row = this.rows.get(item.id);
      if (!row) { row = this.makeRow(item); this.rows.set(item.id, row); }
      row.update();
      row.number.textContent = index + 1;
      if (this.rowsEl.children[index] !== row.el) this.rowsEl.insertBefore(row.el, this.rowsEl.children[index] || null);
    });
    this.ensureDraft();
  }

  makeRow(initial) {
    let item = initial, timer = null, snapshot = initial?.text || '', control = null, controlName = null;
    const row = document.createElement('div');
    row.className = 'row expression-row';
    row.innerHTML = `<div class="expression-gutter"><span class="expression-number"></span><button class="swatch" type="button" title="Show / hide" aria-label="Show or hide expression" aria-pressed="true"></button></div><div class="row-body"><div class="expression-editor-host"></div><div class="row-error" role="status"></div></div><div class="expression-actions"><button class="deriv" type="button" title="Add derivative" aria-label="Add derivative">f′</button><button class="del" type="button" title="Remove" aria-label="Remove expression">×</button></div>`;
    const number = row.querySelector('.expression-number'), swatch = row.querySelector('.swatch');
    const body = row.querySelector('.row-body'), error = row.querySelector('.row-error');
    const deriv = row.querySelector('.deriv'), del = row.querySelector('.del');
    const promote = text => {
      if (item || !text.trim()) return;
      item = this.scene.add(text);
      this.rows.set(item.id, api);
      this.draft = null;
      number.textContent = this.scene.items.indexOf(item) + 1;
      this.ensureDraft();
    };
    const apply = () => {
      clearTimeout(timer); timer = null;
      const text = editor.value;
      promote(text);
      if (!item) return;
      if (item.text !== text) this.scene.setText(item, text);
      update();
      this.onStructure();
    };
    const finish = () => {
      apply();
      if (!item) return;
      // Renaming a function can also introduce free letters in dependent rows.
      for (const candidate of [...this.scene.items]) this.autoParams(candidate);
      this.rebuild();
      this.onStructure();
    };
    const remove = () => {
      const index = item ? this.scene.items.indexOf(item) : this.scene.items.length;
      clearTimeout(timer);
      if (item) this.scene.remove(item);
      else { this.draft = null; editor.dispose(); row.remove(); }
      this.rebuild();
      this.onStructure();
      const previous = this.scene.items[Math.max(0, index - 1)];
      (this.rows.get(previous?.id) || this.ensureDraft()).editor.focus();
    };
    const editor = mathEditor({
      value: initial?.text || '', names: () => this.scene.defs,
      label: initial ? `Expression ${this.scene.items.indexOf(initial) + 1}` : 'New expression',
      onFocus: () => {
        if (!row.classList.contains('editing')) snapshot = editor.value;
        if (item?.info.kind === 'param') this.scene.play(item.info.name, false);
        row.classList.add('editing');
      },
      onInput: () => { clearTimeout(timer); timer = setTimeout(apply, 100); },
      onBlur: () => { row.classList.remove('editing'); finish(); },
      onEnter: () => {
        finish();
        const next = item && this.scene.items[this.scene.items.indexOf(item) + 1];
        (this.rows.get(next?.id) || this.ensureDraft()).editor.focus();
      },
      onEscape: () => {
        if (!initial && !snapshot && item) { remove(); return; }
        editor.setValue(snapshot); apply();
      },
      onEmptyBackspace: () => { if (item || this.scene.items.length) remove(); },
      onNavigate: direction => {
        const index = item ? this.scene.items.indexOf(item) : this.scene.items.length;
        const next = index + direction;
        if (next < 0 || next > this.scene.items.length) return false;
        finish();
        (this.rows.get(this.scene.items[next]?.id) || this.ensureDraft()).editor.focus();
        return true;
      },
    });
    row.querySelector('.expression-editor-host').appendChild(editor.el);
    swatch.addEventListener('click', () => {
      if (!item) { editor.focus(); return; }
      item.visible = !item.visible;
      this.scene.changed(); update();
    });
    deriv.addEventListener('click', () => {
      finish();
      const text = derivativeText(item);
      if (text) this.insertAfter(item, text);
      else error.textContent = "Name it first: f(x) = …, then add y = f'(x)";
    });
    del.addEventListener('click', remove);
    const update = () => {
      row.classList.toggle('is-draft', !item);
      row.style.setProperty('--c', item?.color || 'var(--blue)');
      row.classList.toggle('off', item ? !item.visible : false);
      row.classList.toggle('is-param', item?.info.kind === 'param');
      row.classList.toggle('is-function', item?.info.kind === 'function');
      row.classList.toggle('has-error', item?.info.kind === 'error');
      swatch.setAttribute('aria-pressed', String(item?.visible ?? true));
      error.textContent = item?.info.kind === 'error' ? item.info.message : '';
      if (!item) { number.textContent = '+'; return; }
      if (!editor.focused && !timer) editor.setValue(item.text);
      const name = item.info.kind === 'param' ? item.info.name : null;
      if (name !== controlName) {
        control?.el.remove(); control = null; controlName = name;
        if (name) { control = paramControl(this.scene, name); body.appendChild(control.el); }
      }
      control?.update();
    };
    const api = { el: row, number, editor, update, dispose: () => { clearTimeout(timer); editor.dispose(); row.remove(); } };
    update();
    return api;
  }

  dispose() {
    this.off();
    for (const row of this.rows.values()) row.dispose();
    this.draft?.dispose();
    this.el.remove();
  }
}
