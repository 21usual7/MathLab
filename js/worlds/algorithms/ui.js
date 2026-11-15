import { t } from '../../core/i18n.js';
export const L = (ru, en) => ({ ru, en });
export function el(tag, cls = '', text) { const node = document.createElement(tag); node.className = cls; if (text != null) node.textContent = t(text); return node; }
export function button(text, fn) { const node = el('button', 'btn', text); node.type = 'button'; node.addEventListener('click', fn); return node; }
export function input(label, name, value = '') { const wrap = el('label', 'algorithm-field', label), node = el('input'); node.dataset.field = name; node.value = value; node.autocomplete = 'off'; wrap.append(node); return { wrap, node }; }
