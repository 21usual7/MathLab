// Language of explanations (the interface itself is English). Remembered in this browser.

const KEY = 'mathlab-lang';
const listeners = new Set();

let lang = 'ru';
try {
  lang = localStorage.getItem(KEY) || 'ru';
} catch (e) {}

export const getLang = () => lang;

export function setLang(next) {
  lang = next;
  try {
    localStorage.setItem(KEY, next);
  } catch (e) {}
  listeners.forEach(f => f(lang));
}

export function onLang(f) {
  listeners.add(f);
  return () => listeners.delete(f);
}

// t({ en, ru }) → text in the current language; plain strings pass through
export const t = obj => (obj == null || typeof obj === 'string' ? obj : obj[lang] ?? obj.en);
