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
  { id: 'graph', track: 'functions', status: 'planned',
    title: { en: 'A function: a machine and a picture', ru: 'Функция: машина и картинка' } },
  { id: 'transform', track: 'functions', status: 'planned', prereqs: ['graph'],
    title: { en: 'Shifting and stretching graphs', ru: 'Сдвиги и растяжения графиков' } },
  { id: 'exp-log', track: 'functions', status: 'planned', prereqs: ['graph'],
    title: { en: 'Exponent and logarithm', ru: 'Экспонента и логарифм' } },

  { id: 'limit', track: 'limits', status: 'planned', prereqs: ['graph'],
    title: { en: 'What a limit really is', ru: 'Что такое предел на самом деле' } },
  { id: 'e', track: 'limits', status: 'planned', prereqs: ['limit', 'exp-log'],
    title: { en: 'Where the number e comes from', ru: 'Откуда берётся число e' } },

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
  derivative: () => import('./derivative.js'),
  surfaces: () => import('./surfaces.js'),
};

export async function loadTopic(id) {
  return MODULES[id] ? (await MODULES[id]()).default : null;
}
