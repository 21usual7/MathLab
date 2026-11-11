// On-screen math keyboard: type formulas with a mouse or a finger. Works for every input marked with
// data-keypad (the Lab's rows, the formulas of tasks). One keypad for the page; it types into the input
// that had the focus last. Pressing its keys never takes the focus away, so an edited row stays open.
// While it is open, the page gives it room at the bottom (--kb), and on touch screens the system
// keyboard is held back (inputmode="none") so the two do not fight.

// [label, text]; "|" in the text is where the cursor goes: "sqrt(|)" puts it inside the brackets
const TABS = {
  '123': [
    ['x', 'x', 'var'], ['y', 'y', 'var'], ['a', 'a', 'var'], ['b', 'b', 'var'], ['7', '7'], ['8', '8'], ['9', '9'], ['÷', '/'],
    ['x²', '^2'], ['xⁿ', '^'], ['√', 'sqrt(|)'], ['π', 'pi'], ['4', '4'], ['5', '5'], ['6', '6'], ['×', '*'],
    ['(', '('], [')', ')'], ['|x|', 'abs(|)'], ['e', 'e', 'var'], ['1', '1'], ['2', '2'], ['3', '3'], ['−', '-'],
    ['=', ' = '], [',', ', '], ['←', 'LEFT'], ['→', 'RIGHT'], ['0', '0'], ['.', '.'], ['⌫', 'DEL'], ['+', '+'],
  ],
  'f(x)': [
    ['sin', 'sin(|)'], ['cos', 'cos(|)'], ['tg', 'tan(|)'], ['ctg', 'cot(|)'], ['t', 't', 'var'], ['c', 'c', 'var'], ['k', 'k', 'var'], ['h', 'h', 'var'],
    ['arcsin', 'asin(|)'], ['arccos', 'acos(|)'], ['arctg', 'atan(|)'], ['ln', 'log(|)'], ['f(x)', 'f(x) = '], ['f( )', 'f(|)'], ['f′( )', "f'(|)"], ['z', 'z', 'var'],
    ['logₐ', 'log(|, 2)'], ['eˣ', 'e^(|)'], ['ⁿ√', 'nthRoot(|, 3)'], ['⌊x⌋', 'floor(|)'], ['<', ' < '], ['≤', ' <= '], ['>', ' > '], ['≥', ' >= '],
    ['{ }', ' {|}'], ['( ; )', '(|; )'], ['←', 'LEFT'], ['→', 'RIGHT'], [';', '; '], ['°', '*pi/180'], ['⌫', 'DEL'], ['^', '^'],
  ],
};

let panel = null, target = null, tab = '123';
const coarse = () => matchMedia('(pointer: coarse)').matches;

document.addEventListener('focusin', e => {
  if (e.target.matches && e.target.matches('input[data-keypad]')) target = e.target;
});

// The input to type into: the last focused one if it is still on the page, otherwise the first visible one
function input() {
  if (target && document.body.contains(target) && target.offsetParent !== null) return target;
  target = [...document.querySelectorAll('input[data-keypad]')].find(el => el.offsetParent !== null) || null;
  return target;
}

function insert(text) {
  const el = input();
  if (!el) return;
  if (document.activeElement !== el) el.focus();
  const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? s;
  if (text === 'LEFT' || text === 'RIGHT') {
    const p = text === 'LEFT' ? Math.max(0, s - (s === e ? 1 : 0)) : Math.min(el.value.length, e + (s === e ? 1 : 0));
    el.setSelectionRange(p, p);
    return;
  }
  if (text === 'DEL') {
    const from = s === e ? Math.max(0, s - 1) : s;
    el.value = el.value.slice(0, from) + el.value.slice(e);
    el.setSelectionRange(from, from);
  } else {
    const caret = text.indexOf('|'), clean = text.replace('|', '');
    el.value = el.value.slice(0, s) + clean + el.value.slice(e);
    const p = s + (caret >= 0 ? caret : clean.length);
    el.setSelectionRange(p, p);
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

// Enter: submit the input's form, or send the Enter key (the Lab's row editor listens for it)
function enter() {
  const el = input();
  if (!el) return;
  if (el.form) el.form.requestSubmit();
  else el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
}

function render() {
  panel.querySelector('.kp-keys').innerHTML = TABS[tab].map(([label, text, cls]) =>
    `<button type="button" class="kp-key${cls ? ` kp-${cls}` : ''}${text === 'DEL' ? ' kp-del' : ''}${label.length > 4 ? ' kp-small' : ''}" data-text="${text.replace(/"/g, '&quot;')}">${label}</button>`).join('');
  panel.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
}

function build() {
  panel = document.createElement('div');
  panel.className = 'keypad';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Math keyboard');
  panel.innerHTML = `
    <div class="kp-inner">
      <div class="kp-keys"></div>
      <div class="kp-bar">
        ${Object.keys(TABS).map(name => `<button type="button" class="kp-tab" data-tab="${name}">${name}</button>`).join('')}
        <span class="spacer"></span>
        <button type="button" class="kp-enter" data-act="enter">↵</button>
        <button type="button" class="kp-close" data-act="close" aria-label="Close the keyboard">✕</button>
      </div>
    </div>`;
  document.body.appendChild(panel);
  // Keep the focus (and the caret) in the input: keys act on click, not on focus
  panel.addEventListener('pointerdown', e => { if (e.target.closest('button')) e.preventDefault(); });
  panel.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.tab) { tab = b.dataset.tab; render(); return; }
    if (b.dataset.act === 'close') { closeKeypad(); return; }
    if (b.dataset.act === 'enter') { enter(); return; }
    insert(b.dataset.text);
  });
  render();
}

export function isKeypadOpen() { return !!panel && !panel.hidden; }

export function openKeypad(el) {
  if (!panel) build();
  if (el) target = el;
  panel.hidden = false;
  document.body.classList.add('keypad-open');
  document.body.style.setProperty('--kb', `${panel.offsetHeight}px`);
  if (coarse()) document.querySelectorAll('input[data-keypad]').forEach(i => { i.inputMode = 'none'; });
  const i = input();
  if (i) { i.focus(); i.scrollIntoView({ block: 'nearest' }); }
  document.querySelectorAll('.kp-toggle').forEach(b => b.setAttribute('aria-pressed', 'true'));
}

export function closeKeypad() {
  if (!panel) return;
  panel.hidden = true;
  document.body.classList.remove('keypad-open');
  document.querySelectorAll('input[data-keypad]').forEach(i => { i.inputMode = ''; });
  document.querySelectorAll('.kp-toggle').forEach(b => b.setAttribute('aria-pressed', 'false'));
}

// A ⌨ button next to an input: opens the keypad for it, or closes it
export function keypadButton(el) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'kp-toggle';
  b.title = 'Math keyboard';
  b.setAttribute('aria-label', 'Math keyboard');
  b.setAttribute('aria-pressed', String(isKeypadOpen()));
  b.textContent = '⌨';
  b.addEventListener('pointerdown', e => e.preventDefault());
  b.addEventListener('click', () => (isKeypadOpen() ? closeKeypad() : openKeypad(el)));
  return b;
}

// New inputs created while the keypad is open (an edited Lab row) also hold back the system keyboard
export function prepareInput(el) {
  el.dataset.keypad = '';
  if (isKeypadOpen() && coarse()) el.inputMode = 'none';
}
