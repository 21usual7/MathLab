import { t } from '../../core/i18n.js';

export const L = (ru, en) => ({ ru, en });
export const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function el(tag, cls, text) {
  const e = document.createElement(tag); if (cls) e.className = cls;
  if (text != null) e.textContent = t(text); return e;
}
export function action(text, fn, primary = false) {
  const b = el('button', `btn${primary ? ' primary' : ''}`, text); b.type = 'button'; b.addEventListener('click', fn); return b;
}
export function field(label, { value = '', type = 'text', min, max, step, maxLength, onInput, name } = {}) {
  const wrap = el('label', 'crypto-field'), title = el('span', '', label), input = el('input');
  input.type = type; input.value = value;
  for (const [k, v] of Object.entries({ min, max, step, maxLength })) if (v != null) input[k] = v;
  input.autocomplete = 'off'; input.spellcheck = false;
  if (name) input.dataset.field = name;
  input.addEventListener('input', () => onInput?.(type === 'range' || type === 'number' ? +input.value : input.value));
  wrap.append(title, input); return { el: wrap, input };
}
export function check(label, value, fn) {
  const f = field(label, { type: 'checkbox' }); f.input.checked = value;
  f.el.classList.add('crypto-check'); f.input.addEventListener('change', () => fn(f.input.checked)); return f;
}
export function line(...nodes) { const d = el('div', 'crypto-actions'); d.append(...nodes); return d; }
export function output(label, value = '') { const e = el('div', 'crypto-output'); e.append(el('span', '', label), el('strong', '', value)); return e; }

// Original vector characters: faces, hair, clothes, arms and laptops. No plot axes or abstract endpoint dots.
export function actor(who, x, y, size = 1) {
  const eve = who === 'eve', bob = who === 'bob';
  const color = eve ? '#b69df8' : bob ? '#58c4dd' : '#ff9f81';
  return `<g transform="translate(${x} ${y}) scale(${size})" class="crypto-person ${who}">
    <ellipse cx="0" cy="104" rx="69" ry="10" fill="#000" opacity=".2"/>
    <path d="M-49 83Q-48 25 0 25Q48 25 49 83" fill="${color}"/>
    ${eve ? '<path d="M-37 22Q-47-53 0-57Q47-53 37 22L27 39H-27Z" fill="#70619b"/>' : ''}
    <rect x="-9" y="14" width="18" height="24" rx="7" fill="#d7a17e"/>
    <ellipse cy="-8" rx="28" ry="33" fill="#efc29f"/>
    <path d="M-28-8Q-38-50 0-47Q38-44 29-8L20-24Q0-15-17-30L-26-1Z" fill="${bob ? '#624b41' : '#322b39'}"/>
    ${!eve && !bob ? '<path d="M-26-20Q-47 13-29 40L-18 32L-21-8" fill="#322b39"/>' : ''}
    <circle cx="-10" cy="-6" r="2.4" fill="#332e37"/><circle cx="10" cy="-6" r="2.4" fill="#332e37"/>
    ${bob ? '<g stroke="#3d4b59" fill="none" stroke-width="2"><rect x="-21" y="-14" width="17" height="14" rx="5"/><rect x="4" y="-14" width="17" height="14" rx="5"/><path d="M-4-8H4"/></g>' : ''}
    <path d="M-7 9Q0 15 7 9" fill="none" stroke="#925e52" stroke-width="2" stroke-linecap="round"/>
    <path d="M-33 51L-18 76M33 51L18 76" stroke="#efc29f" stroke-width="14" stroke-linecap="round"/>
    <path d="M-41 55H41L34 91H-34Z" fill="#1b2a38" stroke="#526171" stroke-width="2"/>
    <path d="M-47 93H47" stroke="#64768a" stroke-width="5" stroke-linecap="round"/>
    <path d="M-7 72L-2 77L8 65" fill="none" stroke="${color}" stroke-width="2"/>
  </g>`;
}
export const envelope = `<rect x="-19" y="-13" width="38" height="26" rx="5" fill="#f4d35e"/><path d="M-17-10L0 3L17-10" fill="none" stroke="#8b7330" stroke-width="2"/>`;

export function workshop(ui, { title, note, links = [], sources = [], next }) {
  const world = ui.host.closest('.world'); world.classList.add('crypto-world');
  const root = el('div', 'crypto-lab');
  root.innerHTML = `<div class="crypto-theatre">
    <div class="crypto-scene-head"><span class="crypto-eyebrow">${esc(t(L('Переписка под наблюдением', 'A conversation under observation')))}</span><span class="crypto-play-state"></span></div>
    <svg class="crypto-cast" viewBox="0 0 800 292" role="img" aria-label="${esc(t(L('Алиса и Боб за ноутбуками; Ева наблюдает за каналом', 'Alice and Bob at laptops; Eve watches the channel')))}">
      <path class="crypto-wire" d="M200 100H600" fill="none" stroke="#415463" stroke-width="2" stroke-dasharray="5 8"/>
      <path class="crypto-tap" d="M400 100V202" fill="none" stroke="#b69df8" stroke-width="2" stroke-dasharray="4 6"/>
      ${actor('alice', 115, 94)}${actor('bob', 685, 94)}${actor('eve', 400, 205, .62)}
      <g class="crypto-packet" transform="translate(207 100)">${envelope}<text class="crypto-packet-label" y="-22" text-anchor="middle"></text></g>
      <g class="crypto-second" transform="translate(207 135)">${envelope}<text class="crypto-packet-label" y="25" text-anchor="middle">C₂</text></g>
      <g class="crypto-copy" transform="translate(400 165)">${envelope}</g>
      <text x="115" y="222" text-anchor="middle" class="crypto-name">${esc(t(L('Алиса', 'Alice')))}</text>
      <text x="685" y="222" text-anchor="middle" class="crypto-name">${esc(t(L('Боб', 'Bob')))}</text>
      <text x="460" y="280" class="crypto-name eve-name">${esc(t(L('Ева', 'Eve')))}</text>
      <text x="115" y="244" text-anchor="middle" class="crypto-badge alice-badge"></text>
      <text x="685" y="244" text-anchor="middle" class="crypto-badge bob-badge"></text>
      <text x="400" y="65" text-anchor="middle" class="crypto-channel-label"></text>
      <g class="crypto-stop" transform="translate(540 100)"><circle r="19" fill="#142e29" stroke="#83c167" stroke-width="2"/><path d="M-8 0L-2 6L9-7" fill="none" stroke="#83c167" stroke-width="3"/></g>
    </svg>
    <div class="crypto-caption" aria-live="polite"></div>
    <div class="crypto-transport"><button type="button" class="ghost crypto-play">▶ ${esc(t(L('Отправить письмо', 'Send a letter')))}</button><input type="range" min="0" max="100" value="0" aria-label="${esc(t(L('Ход доставки письма', 'Letter delivery progress')))}"><button type="button" class="ghost crypto-rewind" aria-label="${esc(t(L('Вернуть письмо', 'Rewind letter')))}">↺</button></div>
  </div>
  <section class="crypto-workspace" aria-label="${esc(t(title))}"><div class="crypto-work-head"><span class="crypto-eyebrow">${esc(t(L('Ваш эксперимент', 'Your experiment')))}</span><h2>${esc(t(title))}</h2></div><div class="crypto-experiment"></div></section>
  <footer class="crypto-foot">${esc(t(note || L('Учебные числа и сообщения. Всё происходит в браузере.', 'Small teaching examples. Everything happens in your browser.')))}<span class="crypto-links">${links.map(([id, label]) => `<a href="#topic/${id}">${esc(t(label))} ↗</a>`).join('')}${sources.map(([href, label]) => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`).join('')}${next ? `<a href="#world/${esc(next)}">${esc(t(L('Следующая лаборатория →', 'Next laboratory →')))}</a>` : '<a href="#worlds/crypto">'+esc(t(L('Все лаборатории →', 'All laboratories →')))+'</a>'}</span></footer>`;
  ui.host.append(root);
  const $ = s => root.querySelector(s), experiment = $('.crypto-experiment');
  let raf = null, progress = 0, running = false, disposed = false, story = {}, start = 0, startProgress = 0;
  let process = null;
  let idleLabel = L('Отправить письмо', 'Send a letter');
  const slider = $('.crypto-transport input'), play = $('.crypto-play');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function draw() {
    const fromEve = story.sender === 'eve';
    $('.crypto-packet').setAttribute('transform', fromEve ? `translate(${400 + 193 * progress} ${170 - 70 * progress})` : `translate(${207 + 386 * progress} 100)`);
    $('.crypto-packet-label').textContent = t(progress > .5 && story.substitute ? (story.forwarded || 'C′') : (story.sent || 'C'));
    $('.crypto-packet rect').setAttribute('fill', progress > .5 && story.substitute ? '#b69df8' : '#f4d35e');
    $('.crypto-second').style.opacity = story.multiple ? '1' : '0';
    $('.crypto-second').setAttribute('transform', `translate(${207 + 386 * Math.max(0, (progress - .12) / .88)} 135)`);
    $('.crypto-copy').style.opacity = story.attack && !fromEve && progress >= .48 ? '1' : '0';
    $('.crypto-tap').style.opacity = story.attack && !fromEve ? '.8' : '.2';
    $('.crypto-stop').style.opacity = story.blocked && progress >= .8 ? '1' : '0';
    $('.crypto-packet').style.opacity = story.blocked && progress >= .8 ? '0' : '1';
    $('.crypto-copy').setAttribute('transform', `translate(400 ${100 + 70 * Math.min(1, Math.max(0, (progress - .48) * 3))})`);
    if (process) process.render(progress, story);
    slider.value = Math.round(progress * 100);
    $('.crypto-play-state').textContent = t(progress >= 1 ? L('Доставлено', 'Delivered') : progress ? L('В пути', 'In transit') : L('Готово к отправке', 'Ready to send'));
    if (story.blocked && progress >= .8) $('.crypto-play-state').textContent = t(L('Отклонено Бобом', 'Rejected by Bob'));
    if (process) $('.crypto-play-state').textContent = t(process.phase?.(progress) || (progress >= 1 ? L('Вычислено', 'Computed') : L('Вычисление по шагам', 'Step through the computation')));
    $('.bob-badge').textContent = progress >= .8 ? t(story.bob || L('Письмо получено', 'Letter received')) : t(L('Ждёт письмо', 'Waiting for a letter'));
  }
  function stop() { if (raf !== null) cancelAnimationFrame(raf); raf = null; running = false; play.textContent = `▶ ${t(idleLabel)}`; }
  function tick(now) {
    if (disposed) return;
    progress = Math.min(1, startProgress + (now - start) / 2600); draw();
    if (progress < 1) raf = requestAnimationFrame(tick); else stop();
  }
  function run() {
    if (running) return stop();
    if (progress >= 1) progress = 0;
    if (reduced.matches) { progress = 1; draw(); return; }
    startProgress = progress; start = performance.now(); running = true;
    play.textContent = `❚❚ ${t(L('Пауза', 'Pause'))}`; raf = requestAnimationFrame(tick);
  }
  play.addEventListener('click', run);
  slider.addEventListener('input', () => { stop(); progress = +slider.value / 100; draw(); });
  $('.crypto-rewind').addEventListener('click', () => { stop(); progress = 0; draw(); });
  return {
    root, experiment,
    play: run,
    refresh() { draw(); },
    process(next) {
      stop(); process?.el.remove(); process = next; progress = 0;
      if (next) $('.crypto-cast').setAttribute('hidden', '');
      else $('.crypto-cast').removeAttribute('hidden');
      $('.crypto-scene-head > .crypto-eyebrow').textContent = t(next ? L('Математика процесса', 'Inside the computation') : L('Переписка под наблюдением', 'A conversation under observation'));
      root.classList.toggle('has-process', !!next);
      if (next) $('.crypto-cast').after(next.el);
      idleLabel = next?.label || L('Отправить письмо', 'Send a letter');
      slider.setAttribute('aria-label', t(next ? L('Ход вычисления', 'Computation progress') : L('Ход доставки письма', 'Letter delivery progress')));
      $('.crypto-rewind').setAttribute('aria-label', t(next ? L('Вернуть вычисление к началу', 'Rewind computation') : L('Вернуть письмо', 'Rewind letter')));
      stop(); draw();
    },
    story(next, send = false) {
      stop(); story = next; progress = 0;
      $('.alice-badge').textContent = t(next.alice || L('Пишет Бобу', 'Writing to Bob'));
      $('.crypto-channel-label').textContent = t(next.channel || L('Открытая сеть', 'Public network'));
      $('.crypto-caption').textContent = t(next.caption || ''); draw(); if (send) run();
    },
    dispose() { disposed = true; stop(); root.remove(); world.classList.remove('crypto-world'); },
  };
}
