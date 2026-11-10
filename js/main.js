// Router: #  ·  #lab?s=...  ·  #topic/<id>
// Every page returns a cleanup function (stops animations, frees WebGL) that runs before the next one.

import { mountHome } from './pages/home.js';
import { mountLab } from './pages/lab.js';
import { mountTopic } from './pages/topic.js';
import { getLang, setLang } from './core/i18n.js';

const app = document.getElementById('app');
let cleanup = null;
let seq = 0;

async function route() {
  const my = ++seq;
  if (cleanup) { cleanup(); cleanup = null; }
  const [path, query] = location.hash.slice(1).split('?');
  const [page, id] = path.split('/');
  document.body.dataset.page = page || 'home';
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === (page || 'home')));
  window.scrollTo(0, 0);

  let c;
  if (page === 'lab') c = mountLab(app, new URLSearchParams(query || ''));
  else if (page === 'topic') c = await mountTopic(app, id);
  else c = mountHome(app);

  // A newer route started while this one was loading
  if (my !== seq) { if (c) c(); return; }
  cleanup = c;
}

// Language of explanations
const langButtons = document.querySelectorAll('[data-lang]');
const showLang = () => langButtons.forEach(b => b.classList.toggle('active', b.dataset.lang === getLang()));
langButtons.forEach(b => b.addEventListener('click', () => {
  if (b.dataset.lang === getLang()) return;
  setLang(b.dataset.lang);
  showLang();
  if (document.body.dataset.page !== 'lab') route();
}));
showLang();

window.addEventListener('hashchange', route);
route();
