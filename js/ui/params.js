// Parameter control: ▶ (play), name, slider, value. update() syncs it with the scene.

import { symTex } from '../core/expr.js';
import { fmt } from '../core/numeric.js';
import { renderTex } from './tex.js';

export function paramControl(scene, name, labelTex = symTex(name)) {
  const p = scene.params.get(name);
  const el = document.createElement('div');
  el.className = 'param';
  el.innerHTML = `
    <button class="play" type="button" aria-label="Play ${name}"></button>
    <span class="pname"></span>
    <input type="range" aria-label="${name}">
    <span class="pval"></span>`;
  const [play, pname, slider, pval] = el.children;
  renderTex(pname, labelTex);
  slider.min = p.min;
  slider.max = p.max;
  slider.step = p.step;

  slider.addEventListener('input', () => {
    scene.play(name, false);
    scene.setParam(name, +slider.value);
  });
  play.addEventListener('click', () => scene.play(name, !p.playing));

  function update() {
    slider.min = p.min;
    slider.max = p.max;
    if (document.activeElement !== slider) slider.value = p.value;
    pval.textContent = fmt(Math.round(p.value * 1000) / 1000);
    play.textContent = p.playing ? '❚❚' : '▶';
    el.classList.toggle('playing', p.playing);
  }
  update();
  return { el, update };
}
