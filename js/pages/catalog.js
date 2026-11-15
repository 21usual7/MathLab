// Catalog pages: all topics (#topics[/<subject>]) and all worlds (#worlds[/<collection>]).
// Both are one pattern — a head, filter chips, then shelves of cards — so new subjects, collections and entries
// are only data (topics/index.js, worlds/index.js) and the pages do not grow by hand.
// The cards are exported for the home page, which shows a few of each.

import { t } from '../core/i18n.js';
import { SUBJECTS, TRACKS, CATALOG, topicMeta } from '../topics/index.js';
import { COLLECTIONS, WORLDS, ready } from '../worlds/index.js';
import { ART } from '../worlds/art.js';
import { solvedIn } from './world.js';

const L = {
  topics: { en: 'Topics', ru: 'Темы' },
  topicsLead: {
    en: 'Step-by-step stories with a live scene. Topics are connected: each one says what it builds on, so you can step back to the real cause of a gap.',
    ru: 'Пошаговые истории с живой сценой. Темы связаны: у каждой написано, на чём она построена, — можно шагнуть назад к настоящей причине пробела.',
  },
  worlds: { en: 'Worlds', ru: 'Миры' },
  worldsLead: {
    en: 'Not pages to read, but systems to play with. The mathematics is the mechanics: you shoot, descend, compress, vaccinate — and the rule shows itself. Free exploration and challenges with a concrete goal.',
    ru: 'Не страницы для чтения, а системы, с которыми можно играть. Математика здесь — сама механика: вы бьёте, спускаетесь, сжимаете, прививаете — и закон проявляется сам. Свободное исследование и испытания с конкретной целью.',
  },
  all: { en: 'All', ru: 'Все' },
  ready: { en: 'ready', ru: 'готово' },
  soon: { en: 'soon', ru: 'скоро' },
};

// ---------- Cards ----------

export function topicNode(m) {
  const needs = (m.prereqs || []).map(id => t(topicMeta(id).title)).join(', ');
  const inner = `<span class="node-title">${t(m.title)}</span>
    ${m.status === 'ready' ? `<span class="node-meta">${m.minutes} min</span>` : '<span class="node-meta">planned</span>'}
    ${needs ? `<span class="node-needs">← ${needs}</span>` : ''}`;
  return m.status === 'ready' ? `<a class="node ready" href="#topic/${m.id}">${inner}</a>` : `<div class="node planned">${inner}</div>`;
}

export function worldCard(w) {
  if (!ready(w)) return `<div class="world-card planned"><span class="world-title">${t(w.title)}</span><span class="node-meta">${t(L.soon)}</span></div>`;
  const done = solvedIn(w.id).length;
  return `
    <a class="world-card" href="#world/${w.id}">
      <span class="world-art">${ART[w.id] || ''}</span>
      <span class="world-kicker">${t(w.kicker)}</span>
      <span class="world-title">${t(w.title)}</span>
      <span class="world-summary">${t(w.summary)}</span>
      <span class="node-meta">${w.minutes} min${done ? ` · ✓ ${done}` : ''}</span>
    </a>`;
}

// ---------- Pages ----------

// Filter chips: «All» and one per group; the active one is in the address
const chips = (base, groups, active) => `
  <nav class="chips" aria-label="Filter">
    <a class="chip${!active ? ' active' : ''}" href="#${base}">${t(L.all)}</a>
    ${groups.map(g => `<a class="chip${g.id === active ? ' active' : ''}" href="#${base}/${g.id}">${t(g.title)}</a>`).join('')}
  </nav>`;

const head = (title, lead) => `<header class="page-head"><h1>${title}</h1><p class="lead">${lead}</p></header>`;

export function mountTopics(root, subjectId) {
  const active = SUBJECTS.some(s => s.id === subjectId) ? subjectId : null;
  root.innerHTML = `
    <div class="home catalog">
      ${head(t(L.topics), t(L.topicsLead))}
      ${chips('topics', SUBJECTS, active)}
      ${SUBJECTS.filter(s => !active || s.id === active).map(sub => {
        const tracks = TRACKS.filter(tr => tr.subject === sub.id);
        const n = CATALOG.filter(m => tracks.some(tr => tr.id === m.track) && m.status === 'ready').length;
        return `
        <section class="subject" id="${sub.id}">
          <div class="subject-head"><h3>${t(sub.title)}</h3><span>${n} ${t(L.ready)}</span></div>
          <div class="tracks" style="--cols: ${tracks.length}">
            ${tracks.map(tr => `
              <div class="track">
                <h3>${t(tr.title)}</h3>
                ${CATALOG.filter(m => m.track === tr.id).map(topicNode).join('')}
              </div>`).join('')}
          </div>
        </section>`;
      }).join('')}
    </div>`;
  return () => {};
}

export function mountWorlds(root, collectionId) {
  const active = COLLECTIONS.some(c => c.id === collectionId) ? collectionId : null;
  root.innerHTML = `
    <div class="home catalog">
      ${head(t(L.worlds), t(L.worldsLead))}
      ${chips('worlds', COLLECTIONS, active)}
      ${COLLECTIONS.filter(c => !active || c.id === active).map(col => `
        <section class="shelf" id="${col.id}">
          <div class="subject-head"><h3>${t(col.title)}</h3><span>${t(col.summary)}</span></div>
          <div class="world-cards">${WORLDS.filter(w => w.collection === col.id).map(worldCard).join('')}</div>
        </section>`).join('')}
    </div>`;
  return () => {};
}
