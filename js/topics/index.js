// The map: tracks and topics. A topic lists what it needs (prereqs) and where it leads (next),
// so a student can step back to the real cause of a gap. Planned topics are shown on the map too.

export const TRACKS = [
  { id: 'functions', title: { en: 'Functions', ru: 'Функции' } },
  { id: 'limits', title: { en: 'Limits', ru: 'Пределы' } },
  { id: 'derivatives', title: { en: 'Derivatives', ru: 'Производные' } },
  { id: 'integrals', title: { en: 'Integrals', ru: 'Интегралы' } },
  { id: 'multivar', title: { en: 'Several variables', ru: 'Несколько переменных' } },
];

export const CATALOG = [
  { id: 'graph', track: 'functions', status: 'ready', minutes: 8, next: ['transform', 'exp-log', 'limit'],
    title: { en: 'A function: a machine and a picture', ru: 'Функция: машина и картинка' },
    summary: {
      en: 'A function turns an input into an output; its graph is every answer drawn at once. How to read it forward and backward.',
      ru: 'Функция превращает вход в выход, а её график — все ответы, нарисованные разом. Как читать его вперёд и назад.',
    } },
  { id: 'transform', track: 'functions', status: 'ready', minutes: 10, prereqs: ['graph'], next: ['exp-log', 'derivative'],
    title: { en: 'Shifting and stretching graphs', ru: 'Сдвиги и растяжения графиков' },
    summary: {
      en: 'Why f(x − 2) moves right, f(2x) squeezes, and the vertex of a(x − h)² + k is simply (h, k).',
      ru: 'Почему f(x − 2) сдвигает вправо, f(2x) сжимает, а вершина a(x − h)² + k — просто (h, k).',
    } },
  { id: 'exp-log', track: 'functions', status: 'ready', minutes: 10, prereqs: ['graph'], next: ['e', 'derivative'],
    title: { en: 'Exponent and logarithm', ru: 'Экспонента и логарифм' },
    summary: {
      en: 'An exponent multiplies by the same number at every step; a logarithm counts the steps. The same curve, seen in a mirror.',
      ru: 'Экспонента на каждом шаге умножает на одно и то же число, логарифм считает шаги. Это одна кривая, увиденная в зеркале.',
    } },

  { id: 'limit', track: 'limits', status: 'ready', minutes: 12, prereqs: ['graph'], next: ['derivative', 'e', 'area'],
    title: { en: 'What a limit really is', ru: 'Что такое предел на самом деле' },
    summary: {
      en: 'A hole in a graph, values closing in from both sides, the ε–δ corridor — and limits that do not exist.',
      ru: 'Дырка в графике, значения, подбирающиеся с двух сторон, коридор «эпсилон–дельта» — и пределы, которых нет.',
    } },
  { id: 'e', track: 'limits', status: 'ready', minutes: 10, prereqs: ['limit', 'exp-log'], next: ['derivative', 'taylor'],
    title: { en: 'Where the number e comes from', ru: 'Откуда берётся число e' },
    summary: {
      en: 'A bank paying interest more and more often hits a ceiling of 2.718… — and the exponent with that base is its own slope.',
      ru: 'Банк, начисляющий проценты всё чаще, упирается в потолок 2.718… — а экспонента с таким основанием сама себе наклон.',
    } },

  { id: 'derivative', track: 'derivatives', status: 'ready', minutes: 10, prereqs: ['graph', 'limit'], next: ['chain', 'optimization', 'surfaces'],
    title: { en: 'The derivative: a slope you can see', ru: 'Производная: наклон, который видно' },
    summary: {
      en: 'From the steepness between two points to the steepness at one point — and why the slopes of a curve form a new function.',
      ru: 'От крутизны между двумя точками — к крутизне в одной точке. И почему наклоны кривой сами образуют новую функцию.',
    } },
  { id: 'chain', track: 'derivatives', status: 'planned', prereqs: ['derivative'],
    title: { en: 'Chain rule: machines inside machines', ru: 'Производная сложной функции' } },
  { id: 'optimization', track: 'derivatives', status: 'planned', prereqs: ['derivative'],
    title: { en: 'Peaks, valleys and optimization', ru: 'Вершины, впадины и оптимизация' } },
  { id: 'taylor', track: 'derivatives', status: 'planned', prereqs: ['derivative'],
    title: { en: 'Taylor series: polynomials that imitate', ru: 'Ряд Тейлора: многочлены-подражатели' } },

  { id: 'area', track: 'integrals', status: 'planned', prereqs: ['limit'],
    title: { en: 'Integral as accumulated area', ru: 'Интеграл как накопленная площадь' } },
  { id: 'ftc', track: 'integrals', status: 'planned', prereqs: ['area', 'derivative'],
    title: { en: 'Why derivative and integral undo each other', ru: 'Почему производная и интеграл взаимно обратны' } },

  { id: 'surfaces', track: 'multivar', status: 'ready', minutes: 12, prereqs: ['graph', 'derivative'], next: ['gradient'],
    title: { en: 'Surfaces and slices', ru: 'Поверхности и сечения' },
    summary: {
      en: 'A function of two variables is a landscape. Cut it with planes and you are back to ordinary graphs — and to partial derivatives.',
      ru: 'Функция двух переменных — это ландшафт. Разрежьте его плоскостями, и вы снова увидите обычные графики, а с ними и частные производные.',
    } },
  { id: 'gradient', track: 'multivar', status: 'planned', prereqs: ['surfaces'],
    title: { en: 'Gradient: the steepest way up', ru: 'Градиент: самый крутой подъём' } },
];

export const topicMeta = id => CATALOG.find(x => x.id === id);

const MODULES = {
  graph: () => import('./graph.js'),
  transform: () => import('./transform.js'),
  'exp-log': () => import('./exp-log.js'),
  limit: () => import('./limit.js'),
  e: () => import('./e.js'),
  derivative: () => import('./derivative.js'),
  surfaces: () => import('./surfaces.js'),
};

export async function loadTopic(id) {
  return MODULES[id] ? (await MODULES[id]()).default : null;
}
