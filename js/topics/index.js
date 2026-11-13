// The map: tracks and topics. A topic lists what it needs (prereqs) and where it leads (next),
// so a student can step back to the real cause of a gap. Planned topics are shown on the map too.

// Two subjects, as at school: algebra with the beginnings of calculus, and geometry
export const SUBJECTS = [
  { id: 'algebra', title: { en: 'Algebra and calculus', ru: 'Алгебра и начала анализа' } },
  { id: 'geometry', title: { en: 'Geometry', ru: 'Геометрия' } },
  { id: 'linalg', title: { en: 'Linear algebra', ru: 'Линейная алгебра' } },
];

export const TRACKS = [
  { id: 'functions', subject: 'algebra', title: { en: 'Functions', ru: 'Функции' } },
  { id: 'limits', subject: 'algebra', title: { en: 'Limits', ru: 'Пределы' } },
  { id: 'derivatives', subject: 'algebra', title: { en: 'Derivatives', ru: 'Производные' } },
  { id: 'integrals', subject: 'algebra', title: { en: 'Integrals', ru: 'Интегралы' } },
  { id: 'multivar', subject: 'algebra', title: { en: 'Several variables', ru: 'Несколько переменных' } },
  { id: 'space', subject: 'geometry', title: { en: 'Lines and planes in space', ru: 'Прямые и плоскости' } },
  { id: 'measure', subject: 'geometry', title: { en: 'Angles and distances', ru: 'Углы и расстояния' } },
  { id: 'solids', subject: 'geometry', title: { en: 'Solids and volumes', ru: 'Тела и объёмы' } },
  { id: 'vecs', subject: 'linalg', title: { en: 'Vectors', ru: 'Векторы' } },
  { id: 'maps', subject: 'linalg', title: { en: 'Linear maps', ru: 'Линейные преобразования' } },
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

  { id: 'axioms', track: 'space', status: 'ready', minutes: 10, next: ['cube-sections', 'parallel'],
    title: { en: 'Points, lines and planes in space', ru: 'Точки, прямые и плоскости в пространстве' },
    summary: {
      en: 'Three points fix a plane, two planes meet along a line, a line pierces a plane at its trace — and lines that neither meet nor are parallel.',
      ru: 'Три точки задают плоскость, две плоскости пересекаются по прямой, прямая протыкает плоскость в следе — и прямые, которые не пересекаются и не параллельны.',
    } },
  { id: 'cube-sections', track: 'space', status: 'ready', minutes: 10, prereqs: ['axioms'], next: ['parallel', 'angles'],
    title: { en: 'Sections of a cube', ru: 'Сечения куба' },
    summary: {
      en: 'A plane through three points cuts a cube into a polygon: from a triangle to a hexagon. How to see it and how to build it.',
      ru: 'Плоскость через три точки режет куб по многоугольнику — от треугольника до шестиугольника. Как его увидеть и как построить.',
    } },
  { id: 'parallel', track: 'space', status: 'planned', prereqs: ['axioms'],
    title: { en: 'Parallel and skew lines', ru: 'Параллельные и скрещивающиеся прямые' } },
  { id: 'perpendicular', track: 'space', status: 'planned', prereqs: ['parallel'],
    title: { en: 'A line perpendicular to a plane', ru: 'Перпендикуляр к плоскости' } },

  { id: 'angles', track: 'measure', status: 'planned', prereqs: ['perpendicular'],
    title: { en: 'Angles between lines and planes', ru: 'Углы между прямыми и плоскостями' } },
  { id: 'distances', track: 'measure', status: 'planned', prereqs: ['perpendicular'],
    title: { en: 'Distances in space', ru: 'Расстояния в пространстве' } },

  { id: 'polyhedra', track: 'solids', status: 'planned', prereqs: ['axioms'],
    title: { en: 'Prisms and pyramids', ru: 'Призмы и пирамиды' } },
  { id: 'volumes', track: 'solids', status: 'planned', prereqs: ['polyhedra'],
    title: { en: 'Why a pyramid is one third of a prism', ru: 'Почему пирамида — треть призмы' } },

  { id: 'vectors', track: 'vecs', status: 'ready', minutes: 12, next: ['dot', 'matrix'],
    title: { en: 'Vectors: arrows and numbers', ru: 'Векторы: стрелки и числа' },
    summary: {
      en: 'An arrow is a move; adding is walking, multiplying stretches. Two arrows make a slanted grid over the whole plane — unless they lie on one line.',
      ru: 'Стрелка — это перемещение; сложение — прогулка, умножение — растяжение. Две стрелки дают косую сетку на всю плоскость — если только не лежат на одной прямой.',
    } },
  { id: 'dot', track: 'vecs', status: 'planned', prereqs: ['vectors'],
    title: { en: 'Dot product: how much one arrow goes along another', ru: 'Скалярное произведение: насколько одна стрелка идёт вдоль другой' } },
  { id: 'matrix', track: 'maps', status: 'planned', prereqs: ['vectors'],
    title: { en: 'A matrix moves the whole plane', ru: 'Матрица двигает всю плоскость' } },
  { id: 'det', track: 'maps', status: 'planned', prereqs: ['matrix'],
    title: { en: 'Determinant: how areas change', ru: 'Определитель: во сколько раз меняется площадь' } },
  { id: 'eigen', track: 'maps', status: 'planned', prereqs: ['matrix'],
    title: { en: 'Eigenvectors: arrows that keep their line', ru: 'Собственные векторы: стрелки, которые не сходят со своей прямой' } },
];

export const topicMeta = id => CATALOG.find(x => x.id === id);

const MODULES = {
  graph: () => import('./graph.js'),
  transform: () => import('./transform.js'),
  'exp-log': () => import('./exp-log.js'),
  limit: () => import('./limit.js'),
  e: () => import('./e.js'),
  axioms: () => import('./axioms.js'),
  vectors: () => import('./vectors.js'),
  'cube-sections': () => import('./cube-sections.js'),
  derivative: () => import('./derivative.js'),
  surfaces: () => import('./surfaces.js'),
};

export async function loadTopic(id) {
  return MODULES[id] ? (await MODULES[id]()).default : null;
}
