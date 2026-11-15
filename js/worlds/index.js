import { CRYPTO_COLLECTION, CRYPTO_WORLDS, loadCryptoWorld } from './crypto/catalog.js';

// Worlds: small research spaces where mathematics is the mechanics. Not steps to read, but a system to
// play with: free exploration plus a few challenges with a concrete goal. Worlds are grouped into collections;
// planned ones are listed too (status: 'planned'), so the catalog shows where it leads. Each world module exports
//   { modes: [{ id, title, text, goal?, after? }], mount(ui) → { setMode(id), dispose() } }
// where the first mode is free exploration and the others are challenges; ui is given by pages/world.js.

export const COLLECTIONS = [
  CRYPTO_COLLECTION,
  { id: 'inside', title: { en: 'Inside your things', ru: 'Внутри твоих вещей' },
    summary: {
      en: 'Things you use every day, opened up: the mathematics that makes them work — on your own photo, your own voice.',
      ru: 'Вещи, которыми вы пользуетесь каждый день, вскрытые: математика, на которой они работают, — на вашей собственной фотографии, вашем голосе.',
    } },
  { id: 'sims', title: { en: 'Simulations', ru: 'Симуляции' },
    summary: {
      en: 'Systems with one simple rule and surprising behaviour: reflections, descent, contagion.',
      ru: 'Системы с одним простым правилом и неожиданным поведением: отражения, спуск, заражение.',
    } },
];

export const WORLDS = [
  ...CRYPTO_WORLDS,
  { id: 'jpeg', collection: 'inside', minutes: 15, kicker: { en: 'Trigonometry · waves · compression', ru: 'Тригонометрия · волны · сжатие' },
    title: { en: 'How a photo shrinks tenfold', ru: 'Как фото худеет в десять раз' },
    summary: {
      en: 'Every 8×8 block of a photo is a sum of 64 cosine waves. Throw away the waves the eye does not notice — and a picture weighs ten times less. Try it on your own photo; it never leaves your device.',
      ru: 'Каждый блок 8×8 фотографии — сумма 64 косинусных волн. Выбросьте волны, которых глаз не замечает, — и картинка весит в десять раз меньше. Попробуйте на своём фото: оно не покидает ваше устройство.',
    } },
  { id: 'gps', collection: 'inside', status: 'planned', title: { en: 'GPS: found by three spheres', ru: 'GPS: найден тремя сферами' } },
  { id: 'pagerank', collection: 'inside', minutes: 10, kicker: { en: 'Linear algebra · eigenvectors · probability', ru: 'Линейная алгебра · собственные векторы · вероятность' },
    title: { en: 'Search: importance as an eigenvector', ru: 'Поиск: важность как собственный вектор' },
    summary: {
      en: 'Why is one page above another in a search? A random surfer clicks links on a little internet you draw yourself — and the share of time on each page turns out to be an eigenvector. Get your own site into the top three.',
      ru: 'Почему одна страница в поиске выше другой? Случайный сёрфер щёлкает ссылки маленького интернета, который вы рисуете сами, — и доля времени на каждой странице оказывается собственным вектором. Выведите свой сайт в тройку.',
    } },
  { id: 'shazam', collection: 'inside', status: 'planned', title: { en: 'Shazam: a melody as a picture of frequencies', ru: 'Shazam: мелодия как картинка частот' } },
  { id: 'billiard', collection: 'sims', minutes: 15, kicker: { en: 'Geometry · reflections · chaos', ru: 'Геометрия · отражения · хаос' },
    title: { en: 'Billiards on strange tables', ru: 'Бильярд на странных столах' },
    summary: {
      en: 'Shoot a ball on a rectangle, a circle, an ellipse and a stadium. Mirrors turn bank shots into straight lines, an ellipse sends every shot from one focus to the other — and a stadium is chaos.',
      ru: 'Ударьте шар на прямоугольнике, круге, эллипсе и стадионе. Зеркала превращают удар от бортов в прямую, эллипс отправляет любой удар из фокуса в фокус, а стадион — это хаос.',
    } },
  { id: 'descent', collection: 'sims', minutes: 15, kicker: { en: 'Several variables · gradient · optimisation', ru: 'Несколько переменных · градиент · оптимизация' },
    title: { en: 'Descent in the fog', ru: 'Спуск в тумане' },
    summary: {
      en: 'A landscape z = f(x, y) and a walker who only feels the slope underfoot. Find the bottom of a canyon, learn why a too long step throws you up the wall — and get lost among false valleys in the fog.',
      ru: 'Ландшафт z = f(x, y) и путник, который чувствует только наклон под ногами. Найдите дно каньона, поймите, почему слишком длинный шаг забрасывает на стену, — и поблуждайте в тумане среди ложных долин.',
    } },
  { id: 'epidemic', collection: 'sims', minutes: 15, kicker: { en: 'Probability · percolation · thresholds', ru: 'Вероятность · перколяция · пороги' },
    title: { en: 'An epidemic on a grid', ru: 'Эпидемия на решётке' },
    summary: {
      en: 'Each sick cell infects a neighbour with probability p. Below one number the outbreak dies out, above it it sweeps the city. Find that number by experiment, vaccinate a city — and stop a live outbreak with your own hands.',
      ru: 'Каждая больная клетка заражает соседа с вероятностью p. Ниже одного числа вспышка гаснет, выше — накрывает город. Найдите это число опытом, привейте город и остановите живую вспышку своими руками.',
    } },
];

export const worldMeta = id => WORLDS.find(w => w.id === id);
export const ready = w => w.status !== 'planned';

WORLDS.push(
  { id: 'orbits', collection: 'sims', status: 'planned', title: { en: 'Orbits and a gravity assist', ru: 'Орбиты и гравитационный манёвр' } },
  { id: 'buffon', collection: 'sims', status: 'planned', title: { en: 'Throwing needles to find π', ru: 'Найти π, бросая иглы' } },
);

const MODULES = {
  jpeg: () => import('./jpeg.js'),
  pagerank: () => import('./pagerank.js'),
  billiard: () => import('./billiard.js'),
  descent: () => import('./descent.js'),
  epidemic: () => import('./epidemic.js'),
};

export async function loadWorld(id) {
  return MODULES[id] ? (await MODULES[id]()).default : loadCryptoWorld(id);
}
