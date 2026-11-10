// KaTeX with the palette macros: \blue{f}, \yellow{f'} ... match the colors on the plots

import { TEX_MACROS } from '../core/palette.js';

const OPTIONS = { throwOnError: false, macros: TEX_MACROS };

export function renderTex(el, tex, display = false) {
  try {
    katex.render(tex, el, { ...OPTIONS, displayMode: display });
  } catch (e) {
    el.textContent = tex; // KaTeX did not load (offline): show the raw formula
  }
}

// $...$ and $$...$$ inside an element
export function renderMath(el) {
  if (!window.renderMathInElement) return;
  renderMathInElement(el, {
    ...OPTIONS,
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
    ],
  });
}
