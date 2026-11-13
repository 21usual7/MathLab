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
  { id: 'space3', subject: 'linalg', title: { en: 'Three dimensions', ru: 'Три измерения' } },
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
  { id: 'dot', track: 'vecs', status: 'ready', minutes: 10, prereqs: ['vectors'], next: ['det'],
    title: { en: 'Dot product: how much one arrow goes along another', ru: 'Скалярное произведение: насколько одна стрелка идёт вдоль другой' },
    summary: {
      en: 'The shadow of one arrow on another, times its length — or simply x·x + y·y. Zero means a right angle; the cosine of the angle comes for free.',
      ru: 'Тень одной стрелки на другую, умноженная на её длину, — или просто x·x + y·y. Ноль — значит прямой угол, а косинус угла получается сам.',
    } },
  { id: 'matrix', track: 'maps', status: 'ready', minutes: 12, prereqs: ['vectors'], next: ['compose', 'det', 'eigen'],
    title: { en: 'A matrix moves the whole plane', ru: 'Матрица двигает всю плоскость' },
    summary: {
      en: 'A linear map is fixed by where two arrows land. Written as columns, they are the matrix — and multiplying by it is just stepping along them.',
      ru: 'Линейное преобразование задаётся тем, куда попадают две стрелки. Записанные столбцами, они и есть матрица, а умножение на неё — шаги вдоль них.',
    } },
  { id: 'compose', track: 'maps', status: 'ready', minutes: 10, prereqs: ['matrix'], next: ['inverse'],
    title: { en: 'Product of matrices: one move, then another', ru: 'Произведение матриц: одно движение, потом другое' },
    summary: {
      en: 'Two moves in a row are one move with its own matrix. Why the columns of BA are B applied to the columns of A, why BA ≠ AB, and why determinants multiply.',
      ru: 'Два движения подряд — одно движение со своей матрицей. Почему столбцы BA — это B от столбцов A, почему BA ≠ AB и почему определители перемножаются.',
    } },
  { id: 'inverse', track: 'maps', status: 'ready', minutes: 12, prereqs: ['compose', 'det'], next: ['matrix3', 'planes3'],
    title: { en: 'Inverse matrix and systems of equations', ru: 'Обратная матрица и системы уравнений' },
    summary: {
      en: 'A system asks which arrow a matrix moves onto b. Count steps on the slanted grid, cross two lines, or play the move backwards — and why det = 0 means no answer or infinitely many.',
      ru: 'Система спрашивает, какую стрелку матрица переносит в b. Сосчитать шаги по косой сетке, пересечь две прямые или отмотать движение назад — и почему при det = 0 решений нет или их бесконечно много.',
    } },
  { id: 'det', track: 'maps', status: 'ready', minutes: 10, prereqs: ['matrix'], next: ['eigen', 'det3'],
    title: { en: 'Determinant: how areas change', ru: 'Определитель: во сколько раз меняется площадь' },
    summary: {
      en: 'A matrix multiplies every area by the same number. Why it is ad − bc, why it is zero when the plane collapses and negative when it turns over.',
      ru: 'Матрица умножает любую площадь на одно и то же число. Почему оно равно ad − bc, почему ноль, когда плоскость схлопнулась, и минус, когда перевернулась.',
    } },
  { id: 'eigen', track: 'maps', status: 'ready', minutes: 12, prereqs: ['matrix'],
    title: { en: 'Eigenvectors: arrows that keep their line', ru: 'Собственные векторы: стрелки, которые не сходят со своей прямой' },
    summary: {
      en: 'A matrix turns almost every arrow — but some lines stay, only stretched: M·v = λ·v. A rotation has none, a shear one; repeated, a matrix turns everything towards the biggest λ.',
      ru: 'Матрица поворачивает почти каждую стрелку — но некоторые прямые остаются, только растягиваются: M·v = λ·v. У поворота таких нет, у сдвига одна; повторённая, матрица разворачивает всё к самому большому λ.',
    } },

  { id: 'matrix3', track: 'space3', status: 'ready', minutes: 10, prereqs: ['matrix'], next: ['det3', 'planes3'],
    title: { en: 'A 3×3 matrix moves space', ru: 'Матрица 3×3 двигает пространство' },
    summary: {
      en: 'One dimension up: three arrows î, ĵ, k̂ decide everything, the cube becomes a slanted box — and when k̂′ falls into the plane of the other two, all of space is squashed flat.',
      ru: 'На одно измерение выше: всё решают три стрелки î, ĵ, k̂, куб становится косым ящиком — а когда k̂′ падает в плоскость двух других, всё пространство сплющивается.',
    } },
  { id: 'det3', track: 'space3', status: 'ready', minutes: 10, prereqs: ['matrix3', 'det'], next: ['planes3', 'rank'],
    title: { en: 'Determinant in space: how volumes change', ru: 'Определитель в пространстве: во сколько раз меняется объём' },
    summary: {
      en: 'A 3×3 matrix multiplies every volume by one number — the volume of the box on its columns. Base times height, zero when space goes flat, minus when a right hand turns into a left one.',
      ru: 'Матрица 3×3 умножает любой объём на одно число — объём ящика на её столбцах. Основание на высоту, ноль, когда пространство стало плоским, и минус, когда правая рука стала левой.',
    } },
  { id: 'planes3', track: 'space3', status: 'ready', minutes: 12, prereqs: ['det3', 'inverse'], next: ['rank'],
    title: { en: 'Three equations — three planes', ru: 'Три уравнения — три плоскости' },
    summary: {
      en: 'Each equation is a plane, two meet along a line, the third cuts it at the solution. And why with det = 0 the planes form a prism (no solutions) or a book (infinitely many).',
      ru: 'Каждое уравнение — плоскость, две пересекаются по прямой, третья режет её в точке-решении. И почему при det = 0 плоскости образуют призму (решений нет) или книжку (их бесконечно много).',
    } },
  { id: 'rank', track: 'space3', status: 'ready', minutes: 10, prereqs: ['det3', 'planes3'],
    title: { en: 'Rank and kernel: what a matrix loses', ru: 'Ранг и ядро: что матрица теряет' },
    summary: {
      en: 'Squashed space lands on a plane or a line — the rank. What lands at zero is the kernel; lost plus left is always 3. And why a system with det = 0 has a whole line of solutions or none.',
      ru: 'Сплющенное пространство ложится на плоскость или прямую — это ранг. То, что попадает в ноль, — ядро; потеряно плюс осталось всегда 3. И почему у системы с det = 0 целая прямая решений или ни одного.',
    } },
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
  matrix: () => import('./matrix.js'),
  det: () => import('./det.js'),
  dot: () => import('./dot.js'),
  eigen: () => import('./eigen.js'),
  compose: () => import('./compose.js'),
  inverse: () => import('./inverse.js'),
  matrix3: () => import('./matrix3.js'),
  det3: () => import('./det3.js'),
  planes3: () => import('./planes3.js'),
  rank: () => import('./rank.js'),
  'cube-sections': () => import('./cube-sections.js'),
  derivative: () => import('./derivative.js'),
  surfaces: () => import('./surfaces.js'),
};

export async function loadTopic(id) {
  return MODULES[id] ? (await MODULES[id]()).default : null;
}
