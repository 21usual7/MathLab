// The voice of the films: node scripts/narrate.mjs [--list] [film ...]
// Every caption of a film (as it reads with the knobs untouched) becomes an mp3 in audio/films/<film>/,
// and audio/films/<film>.json says from which moment of which chapter it plays and how long it is.
// A chapter may give its own `say: [{ at, ru }]` instead of its captions (when the caption counts something live).
// Needs Piper (https://github.com/OHF-Voice/piper1-gpl) and the voice ru_RU-dmitri-medium:
//   PIPER=/path/to/piper PIPER_MODEL=/path/to/ru_RU-dmitri-medium.onnx node scripts/narrate.mjs
// Files are named by a hash of their text, so only changed phrases are generated again.

import '../tests/setup.js';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';

const FILMS = ['intro', 'regression', 'network', 'backprop'];
const args = process.argv.slice(2), list = args.includes('--list');
const only = args.filter(a => !a.startsWith('--'));
const root = new URL('../', import.meta.url);

// What a reader says instead of the signs of a formula
const LETTERS = { x: 'икс', y: 'игрек', w: 'вэ', b: 'бэ', t: 'тэ', p: 'пэ', u: 'у', m: 'эм', k: 'ка', L: 'эль', T: 'тэ', N: 'эн' };
// 0,25 → «ноль целых 25 сотых»: the voice reads plain numbers well, decimal commas badly
const FRAC = ['', 'десят', 'сот', 'тысячн'], FEM = ['ноль', 'одна', 'две'];
function decimal(m, whole, frac) {
  const n = +frac, last = n % 10, tail = n % 100 >= 11 && n % 100 <= 14 ? 'ых' : last === 1 ? 'ая' : 'ых';
  const w = whole === '1' ? 'одна целая' : `${whole} целых`, f = n < 3 ? FEM[n] : n % 10 < 3 && n % 100 > 20 ? `${n - last} ${FEM[last]}` : String(n);
  return `${w} ${f} ${FRAC[frac.length]}${tail}`;
}
export function speakable(s) {
  return s
    .replace(/(\d)\.(\d)/g, '$1,$2')
    .replace(/(\d+),(\d{1,3})(?!\d)/g, decimal)
    .replace(/1960-е/g, 'шестидесятые годы')
    .replace(/(\d+)°/g, '$1 градусов')
    .replace(/\(×(\d)\)/g, ', то есть умножает на $1,')
    .replace(/×/g, 'умножить на ')
    .replace(/[₁₂₃]/g, c => ' ' + ['один', 'два', 'три']['₁₂₃'.indexOf(c)])
    .replace(/²/g, ' в квадрате')
    .replace(/w ← w − η·наклон/g, 'новое вэ равно старому вэ минус эта, умноженное на наклон')
    .replace(/≈/g, 'примерно ')
    .replace(/ → /g, ', ')
    .replace(/→/g, ', ')
    .replace(/·/g, ' на ')
    .replace(/ − /g, ' минус ')
    .replace(/−(\d)/g, 'минус $1')
    .replace(/ \+ /g, ' плюс ')
    .replace(/ = /g, ' равно ')
    .replace(/ > /g, ' больше ')
    .replace(/ ≤ /g, ' не больше ')
    .replace(/θ/g, 'тэта').replace(/η/g, 'эта').replace(/Σ/g, 'сумма')
    .replace(/\b([xywbtpumkLTN])\b/g, (m, c) => LETTERS[c])
    .replace(/[«»"()]/g, '')
    .replace(/\s+/g, ' ').trim();
}

// The phrases of a chapter: its own `say`, or every new caption as the chapter runs with the knobs untouched
function phrases(c, st) {
  if (c.say) return c.say.map(s => ({ at: s.at, text: s.ru, match: false }));
  const out = [];
  for (let i = 0; i <= 200; i++) {
    const p = i / 200, text = c.caption(p, st).ru;
    if (!out.length || out[out.length - 1].text !== text) out.push({ at: p, text, match: true });
  }
  return out;
}

const sh = (cmd, a, input) => execFileSync(cmd, a, { input, stdio: [input == null ? 'ignore' : 'pipe', 'pipe', 'pipe'] }).toString();

for (const name of FILMS.filter(f => !only.length || only.includes(f))) {
  const film = (await import(`../js/topics/films/${name}.js`)).default, st = film.state();
  const dir = new URL(`audio/films/${name}/`, root), manifest = { film: name, lang: 'ru', chapters: {} }, used = new Set();
  if (!list) mkdirSync(dir, { recursive: true });
  for (const c of film.chapters) {
    const segs = phrases(c, st);
    manifest.chapters[c.id] = [];
    for (const s of segs) {
      const say = speakable(s.text), hash = createHash('sha1').update(say).digest('hex').slice(0, 12), file = `${hash}.mp3`;
      if (list) { console.log(`${name}/${c.id} @${s.at.toFixed(2)}  ${say}`); continue; }
      const mp3 = new URL(file, dir);
      if (!existsSync(mp3)) {
        const wav = new URL(`${hash}.wav`, dir);
        sh(process.env.PIPER || 'piper', ['-m', process.env.PIPER_MODEL, '--length-scale', '1.05', '--sentence-silence', '0.25', '-f', wav.pathname], say);
        sh('ffmpeg', ['-loglevel', 'error', '-y', '-i', wav.pathname, '-ac', '1', '-b:a', '48k', mp3.pathname]);
        unlinkSync(wav);
      }
      const sec = +sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3.pathname]).trim();
      used.add(file);
      manifest.chapters[c.id].push({ at: s.at, file, sec: Math.round(sec * 100) / 100, ...(s.match ? { text: s.text } : {}) });
    }
  }
  if (list) continue;
  for (const f of readdirSync(dir)) if (!used.has(f)) unlinkSync(new URL(f, dir)); // phrases that are no longer said
  writeFileSync(new URL(`audio/films/${name}.json`, root), JSON.stringify(manifest, null, 1) + '\n');
  const total = Object.values(manifest.chapters).flat().reduce((s, x) => s + x.sec, 0);
  console.log(`${name}: ${used.size} phrases, ${Math.round(total)} s of speech`);
}
