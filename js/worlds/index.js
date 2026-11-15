// Worlds: small research spaces where mathematics is the mechanics. Not steps to read, but a system to
// play with: free exploration plus a few challenges with a concrete goal. Each world module exports
//   { modes: [{ id, title, text, goal?, after? }], mount(ui) → { setMode(id), dispose() } }
// where the first mode is free exploration and the others are challenges; ui is given by pages/world.js.

export const WORLDS = [
  { id: 'billiard', minutes: 15, kicker: { en: 'Geometry · reflections · chaos', ru: 'Геометрия · отражения · хаос' },
    title: { en: 'Billiards on strange tables', ru: 'Бильярд на странных столах' },
    summary: {
      en: 'Shoot a ball on a rectangle, a circle, an ellipse and a stadium. Mirrors turn bank shots into straight lines, an ellipse sends every shot from one focus to the other — and a stadium is chaos.',
      ru: 'Ударьте шар на прямоугольнике, круге, эллипсе и стадионе. Зеркала превращают удар от бортов в прямую, эллипс отправляет любой удар из фокуса в фокус, а стадион — это хаос.',
    } },
  { id: 'descent', minutes: 15, kicker: { en: 'Several variables · gradient · optimisation', ru: 'Несколько переменных · градиент · оптимизация' },
    title: { en: 'Descent in the fog', ru: 'Спуск в тумане' },
    summary: {
      en: 'A landscape z = f(x, y) and a walker who only feels the slope underfoot. Find the bottom of a canyon, learn why a too long step throws you up the wall — and get lost among false valleys in the fog.',
      ru: 'Ландшафт z = f(x, y) и путник, который чувствует только наклон под ногами. Найдите дно каньона, поймите, почему слишком длинный шаг забрасывает на стену, — и поблуждайте в тумане среди ложных долин.',
    } },
  { id: 'epidemic', minutes: 15, kicker: { en: 'Probability · percolation · thresholds', ru: 'Вероятность · перколяция · пороги' },
    title: { en: 'An epidemic on a grid', ru: 'Эпидемия на решётке' },
    summary: {
      en: 'Each sick cell infects a neighbour with probability p. Below one number the outbreak dies out, above it it sweeps the city. Find that number by experiment, vaccinate a city — and stop a live outbreak with your own hands.',
      ru: 'Каждая больная клетка заражает соседа с вероятностью p. Ниже одного числа вспышка гаснет, выше — накрывает город. Найдите это число опытом, привейте город и остановите живую вспышку своими руками.',
    } },
];

export const worldMeta = id => WORLDS.find(w => w.id === id);

const MODULES = {
  billiard: () => import('./billiard.js'),
  descent: () => import('./descent.js'),
  epidemic: () => import('./epidemic.js'),
};

export async function loadWorld(id) {
  return MODULES[id] ? (await MODULES[id]()).default : null;
}
