import { renderTex } from './tex.js';
import { sourceToLatex, asciiToSource } from './formula-source.js';
import { keypadButton, prepareInput } from './keypad.js';

let library;
function loadMathfield() {
  if (customElements.get('math-field')) return Promise.resolve();
  if (!library) library = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('../../vendor/mathlive/mathlive.min.js', import.meta.url).href;
    script.async = true;
    script.onload = () => {
      customElements.get('math-field').soundsDirectory = null;
      customElements.whenDefined('math-field').then(resolve);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return library;
}

export function mathEditor({ value = '', names = () => new Set(), label, onInput, onEnter, onEscape, onBlur, onFocus, onEmptyBackspace, onNavigate }) {
  const el = document.createElement('div');
  el.className = 'math-editor';
  const preview = document.createElement('div');
  preview.className = 'math-preview';
  preview.setAttribute('aria-hidden', 'true');
  const raw = document.createElement('textarea');
  raw.className = 'math-source';
  raw.rows = 1;
  raw.spellcheck = false;
  raw.autocapitalize = 'off';
  raw.autocomplete = 'off';
  raw.setAttribute('aria-label', label);
  raw.placeholder = 'y = x² + 1';
  prepareInput(raw);
  const field = document.createElement('math-field');
  field.className = 'math-entry';
  field.setAttribute('aria-label', label);
  field.setAttribute('math-virtual-keyboard-policy', 'manual');
  field.hidden = true;
  field.dataset.keypad = '';
  const tools = document.createElement('div');
  tools.className = 'math-editor-tools';
  const sourceButton = document.createElement('button');
  sourceButton.type = 'button';
  sourceButton.className = 'math-source-toggle';
  sourceButton.textContent = '</>';
  sourceButton.title = 'Edit as text';
  sourceButton.setAttribute('aria-label', 'Edit as text');
  sourceButton.setAttribute('aria-pressed', 'false');
  sourceButton.hidden = true;
  const keyboard = keypadButton(raw);
  tools.append(sourceButton, keyboard);
  el.append(preview, raw, field, tools);
  let source = value, ready = false, textMode = false, changing = false, disposed = false;
  let fieldBaseline = '';

  const showPreview = () => {
    try { renderTex(preview, sourceToLatex(source, names())); }
    catch { preview.textContent = source; }
    preview.hidden = !source.trim();
  };
  const writeField = () => {
    if (!ready) return false;
    try {
      changing = true;
      field.setValue(sourceToLatex(source, names()), { silenceNotifications: true });
      fieldBaseline = field.value;
      return true;
    } catch { return false; }
    finally { changing = false; }
  };
  const mode = () => {
    const visual = ready && !textMode;
    field.hidden = !visual;
    raw.hidden = visual;
    preview.hidden = visual || !source.trim();
    el.classList.toggle('is-visual', visual);
    el.classList.toggle('is-empty', !source.trim());
    sourceButton.hidden = !ready;
    sourceButton.setAttribute('aria-pressed', String(textMode));
    keyboard.mathTarget = visual ? field : raw;
  };
  const change = next => {
    source = next;
    raw.value = next;
    showPreview();
    mode();
    onInput?.(next);
  };
  const focus = () => (ready && !textMode ? field : raw).focus();
  sourceButton.addEventListener('pointerdown', e => e.preventDefault());
  sourceButton.addEventListener('click', () => {
    if (textMode && !writeField()) return;
    textMode = !textMode;
    mode(); focus();
  });
  raw.addEventListener('input', () => change(raw.value));
  field.addEventListener('input', () => {
    if (changing || field.value === fieldBaseline) return;
    fieldBaseline = field.value;
    // The graph engine has no sums/integrals. Keep unsupported TeX explicit
    // so the parser reports it instead of treating e.g. "int" as i·n·t.
    const unsupported = /\\(?:int|iint|iiint|oint|sum|prod|lim|binom|overline|overrightarrow)\b/.test(field.value);
    change(unsupported ? field.value : asciiToSource(field.getValue('ascii-math'), field.value));
  });
  field.addEventListener('paste', e => {
    const text = e.clipboardData?.getData('text/plain');
    if (!text || text.includes('\\')) return;
    try {
      const latex = sourceToLatex(text, names());
      e.preventDefault(); e.stopPropagation();
      field.insert(latex, { format: 'latex', focus: true });
    } catch { /* Let MathLive handle LaTeX and incomplete clipboard input. */ }
  }, true);
  el.addEventListener('focusin', e => {
    if (e.target === raw || e.target === field) onFocus?.();
  });
  el.addEventListener('focusout', () => {
    queueMicrotask(() => { if (!el.contains(document.activeElement) && !disposed) onBlur?.(); });
  });
  const keydown = e => {
    if (e.isComposing) return;
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); onEnter?.(); }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onEscape?.(); }
    if (e.key === 'Backspace' && !source.trim()) { e.preventDefault(); e.stopPropagation(); onEmptyBackspace?.(); }
  };
  raw.addEventListener('keydown', keydown);
  // Handle row commands before the keyboard sink inside MathLive's shadow DOM.
  field.addEventListener('keydown', keydown, true);
  field.addEventListener('move-out', e => {
    const direction = { upward: -1, downward: 1 }[e.detail.direction];
    if (direction && onNavigate?.(direction)) e.preventDefault();
  });
  raw.addEventListener('keydown', e => {
    const direction = e.key === 'ArrowUp' && raw.selectionStart === 0 ? -1 : e.key === 'ArrowDown' && raw.selectionEnd === raw.value.length ? 1 : 0;
    if (direction && onNavigate?.(direction)) e.preventDefault();
  });
  // The existing on-screen keyboard can now address structured fields, too.
  field.mathEditor = {
    insert(text) {
      if (text === 'LEFT' || text === 'RIGHT' || text === 'DEL') {
        field.executeCommand({ LEFT: 'moveToPreviousChar', RIGHT: 'moveToNextChar', DEL: 'deleteBackward' }[text]);
        return;
      }
      const templates = {
        '/': '\\frac{#@}{#?}', '^': '^{#?}', '^2': '^{2}', 'sqrt(|)': '\\sqrt{#0}', 'abs(|)': '\\left|#0\\right|',
        'e^(|)': 'e^{#0}', 'nthRoot(|, 3)': '\\sqrt[3]{#0}', 'log(|, 2)': '\\log_{2}\\left(#0\\right)',
        'floor(|)': '\\lfloor#0\\rfloor', ' {|}': '\\left\\{#0\\right\\}',
      };
      const latex = templates[text] || (text.includes('|') ? text.replace('|', '#0').replace(/\b(sin|cos|tan|cot|asin|acos|atan|log)\(/, (_, fn) => `\\${({ log: 'ln', asin: 'arcsin', acos: 'arccos', atan: 'arctan' })[fn] || fn}(`) : null);
      if (latex) field.insert(latex, { format: 'latex', focus: true });
      else field.insert(text, { format: 'ascii-math', focus: true });
    },
    enter: () => onEnter?.(),
  };
  raw.value = source;
  showPreview(); mode();
  loadMathfield().then(() => {
    if (disposed) return;
    const hadFocus = document.activeElement === raw;
    ready = true;
    field.smartFence = true;
    field.smartSuperscript = true;
    field.inlineShortcuts = { ...field.inlineShortcuts, tg: '\\tan', ctg: '\\cot', ln: '\\ln' };
    textMode = !writeField();
    mode();
    if (hadFocus) focus();
  }).catch(() => { el.classList.add('text-fallback'); });
  return {
    el, focus,
    get value() { return source; },
    get focused() { return el.contains(document.activeElement); },
    setValue(next) {
      if (next === source) return;
      source = next; raw.value = next; showPreview();
      if (!writeField()) textMode = true;
      mode();
    },
    dispose() { disposed = true; el.remove(); },
  };
}
