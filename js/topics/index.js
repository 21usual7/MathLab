import { ALGORITHMS_SUBJECT, ALGORITHM_TOPICS, loadAlgorithmTopic } from './algorithms/catalog.js';

// The map: tracks and topics. A topic lists what it needs (prereqs) and where it leads (next),
// so a student can step back to the real cause of a gap. Planned topics are shown on the map too.

// Subjects and their learning tracks.
export const SUBJECTS = [
  ALGORITHMS_SUBJECT,
  { id: 'basics', title: { en: 'Foundations (grades 7–9)', ru: 'Основы (7–9 класс)' } },
  { id: 'algebra', title: { en: 'Algebra and calculus', ru: 'Алгебра и начала анализа' } },
  { id: 'geometry', title: { en: 'Geometry', ru: 'Геометрия' } },
  { id: 'linalg', title: { en: 'Linear algebra', ru: 'Линейная алгебра' } },
  { id: 'crypto', title: { en: 'Cryptography', ru: 'Криптография' } },
  { id: 'ml', title: { en: 'Machine learning', ru: 'Машинное обучение' } },
];

export const TRACKS = [
  { id: 'patterns', subject: 'algorithms', title: { en: 'Start here · arrays, pairs, memory', ru: 'Начните здесь · массивы, пары, память' } },
  { id: 'search', subject: 'algorithms', title: { en: 'Search and invariants', ru: 'Поиск и инварианты' } },
  { id: 'b-geom', subject: 'basics', title: { en: 'Geometry 7–9', ru: 'Геометрия 7–9' } },
  { id: 'b-alg', subject: 'basics', title: { en: 'Algebra 7–9', ru: 'Алгебра 7–9' } },
  { id: 'functions', subject: 'algebra', title: { en: 'Functions', ru: 'Функции' } },
  { id: 'trig', subject: 'algebra', title: { en: 'Trigonometry', ru: 'Тригонометрия' } },
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
  { id: 'remainders', subject: 'crypto', title: { en: 'Remainders and ciphers', ru: 'Остатки и шифры' } },
  { id: 'publickey', subject: 'crypto', title: { en: 'Public keys', ru: 'Открытый ключ' } },
  { id: 'learn', subject: 'ml', title: { en: 'Learning from data', ru: 'Учиться на данных' } },
  { id: 'nets', subject: 'ml', title: { en: 'Neural networks', ru: 'Нейросети' } },
  { id: 'structure', subject: 'ml', title: { en: 'Finding structure', ru: 'Найти структуру' } },
];

export const CATALOG = [
  ...ALGORITHM_TOPICS,
  // Foundations: the key theorems and patterns of grades 7–9, each with a short proof and links to grades 10–11
  { id: 'angles-parallel', track: 'b-geom', status: 'ready', minutes: 8, next: ['congruent', 'pythagoras', 'inscribed'],
    title: { en: 'Parallel lines and the angles of a triangle', ru: 'Параллельные прямые и углы треугольника' },
    summary: {
      en: 'Slide one rail onto the other and its angles land on the other\'s angles. Then a line through the apex collects the three angles of any triangle into a straight one: 180°.',
      ru: 'Сдвиньте один рельс на другой — и его углы лягут на углы другого. А прямая через вершину собирает три угла любого треугольника в развёрнутый: 180°.',
    } },
  { id: 'congruent', track: 'b-geom', status: 'ready', minutes: 8, prereqs: ['angles-parallel'], next: ['similar', 'areas'],
    title: { en: 'Congruent triangles', ru: 'Равенство треугольников' },
    summary: {
      en: 'Four sticks wobble, three do not. Why three numbers fix a triangle — and why two sides with an angle not between them are not enough.',
      ru: 'Четыре палочки шатаются, три — нет. Почему три числа задают треугольник — и почему двух сторон с углом не между ними мало.',
    } },
  { id: 'law-of-cosines', track: 'b-geom', status: 'ready', minutes: 10, prereqs: ['pythagoras', 'unit-circle', 'inscribed'], next: ['dot', 'trig-formulas'],
    title: { en: 'Laws of cosines and sines', ru: 'Теоремы косинусов и синусов' },
    summary: {
      en: 'Pythagoras with a correction for any angle: c² = a² + b² − 2ab cos γ from one height and the Ferris wheel. And every side over the sine of its angle is the diameter of one circle.',
      ru: 'Пифагор с поправкой на любой угол: c² = a² + b² − 2ab cos γ из одной высоты и колеса обозрения. А каждая сторона, делённая на синус своего угла, — диаметр одной окружности.',
    } },
  { id: 'pythagoras', track: 'b-geom', status: 'ready', minutes: 5, next: ['vectors', 'dot', 'axioms', 'unit-circle'],
    title: { en: 'The Pythagorean theorem', ru: 'Теорема Пифагора' },
    summary: {
      en: 'Why a² + b² = c²: four triangles moved inside one square. And where it lives later — distances, vector lengths, circles.',
      ru: 'Почему a² + b² = c²: четыре треугольника, переложенные внутри одного квадрата. И где это живёт дальше — расстояния, длины векторов, окружности.',
    } },
  { id: 'similar', track: 'b-geom', status: 'ready', minutes: 8, prereqs: ['congruent'], next: ['areas', 'law-of-cosines', 'unit-circle'],
    title: { en: 'Similar triangles', ru: 'Подобные треугольники' },
    summary: {
      en: 'A lamp and a shadow: sides grow k times, angles stay. A one-metre stick measures a tree, and a map at 1 : 1000 shrinks areas a million times.',
      ru: 'Лампа и тень: стороны растут в k раз, углы остаются. Метровая палка измеряет дерево, а карта 1 : 1000 уменьшает площади в миллион раз.',
    } },
  { id: 'areas', track: 'b-geom', status: 'ready', minutes: 8, prereqs: ['congruent'], next: ['similar', 'volumes', 'area'],
    title: { en: 'Areas by cutting and moving', ru: 'Площади: разрезать и переложить' },
    summary: {
      en: 'A parallelogram is a rectangle in disguise, a triangle is half of a parallelogram, two trapezoids make one parallelogram — no formula to memorise.',
      ru: 'Параллелограмм — переодетый прямоугольник, треугольник — половина параллелограмма, две трапеции дают один параллелограмм. Ни одной формулы наизусть.',
    } },
  { id: 'inscribed', track: 'b-geom', status: 'ready', minutes: 8, prereqs: ['angles-parallel'], next: ['law-of-cosines', 'unit-circle'],
    title: { en: 'Circles and inscribed angles', ru: 'Окружность и вписанный угол' },
    summary: {
      en: 'From every point of an arc a goal is seen at the same angle — half of the central one. And a set square fits into any semicircle.',
      ru: 'С любой точки дуги ворота видны под одним углом — половиной центрального. А угольник входит в любой полукруг.',
    } },
  { id: 'quadratic', track: 'b-alg', status: 'ready', minutes: 6, next: ['transform', 'derivative', 'limit', 'ecc'],
    title: { en: 'The quadratic equation and Vieta', ru: 'Квадратное уравнение и Виет' },
    summary: {
      en: 'The formula for the roots proved by completing a square with areas — and why the roots add up to −b and multiply to c.',
      ru: 'Формула корней, доказанная достраиванием квадрата из площадей, — и почему сумма корней равна −b, а произведение c.',
    } },
  { id: 'progressions', track: 'b-alg', status: 'ready', minutes: 6, next: ['e', 'exp-log', 'limit'],
    title: { en: 'Progressions', ru: 'Прогрессии' },
    summary: {
      en: 'Gauss\'s staircase for 1 + 2 + … + n, the shift that sums 1 + q + q² + …, and an infinite sum that stays finite.',
      ru: 'Лесенка Гаусса для 1 + 2 + … + n, сдвиг, который суммирует 1 + q + q² + …, и бесконечная сумма, которая остаётся конечной.',
    } },
  { id: 'powers', track: 'b-alg', status: 'planned', title: { en: 'Powers and roots', ru: 'Степени и корни' } },
  { id: 'graph', track: 'functions', status: 'ready', minutes: 8, next: ['transform', 'exp-log', 'limit'],
    title: { en: 'A function: a machine and a picture', ru: 'Функция: машина и картинка' },
    summary: {
      en: 'A function turns an input into an output; its graph is every answer drawn at once. How to read it forward and backward.',
      ru: 'Функция превращает вход в выход, а её график — все ответы, нарисованные разом. Как читать его вперёд и назад.',
    } },
  { id: 'transform', track: 'functions', status: 'ready', minutes: 10, prereqs: ['quadratic', 'graph'], next: ['exp-log', 'derivative'],
    title: { en: 'Shifting and stretching graphs', ru: 'Сдвиги и растяжения графиков' },
    summary: {
      en: 'Why f(x − 2) moves right, f(2x) squeezes, and the vertex of a(x − h)² + k is simply (h, k).',
      ru: 'Почему f(x − 2) сдвигает вправо, f(2x) сжимает, а вершина a(x − h)² + k — просто (h, k).',
    } },
  { id: 'exp-log', track: 'functions', status: 'ready', minutes: 10, prereqs: ['progressions', 'graph'], next: ['e', 'derivative'],
    title: { en: 'Exponent and logarithm', ru: 'Экспонента и логарифм' },
    summary: {
      en: 'An exponent multiplies by the same number at every step; a logarithm counts the steps. The same curve, seen in a mirror.',
      ru: 'Экспонента на каждом шаге умножает на одно и то же число, логарифм считает шаги. Это одна кривая, увиденная в зеркале.',
    } },

  { id: 'unit-circle', track: 'trig', status: 'ready', minutes: 10, prereqs: ['pythagoras', 'graph'], next: ['trig-formulas', 'limit', 'dot'],
    title: { en: 'Sine and cosine on a Ferris wheel', ru: 'Синус и косинус на колесе обозрения' },
    summary: {
      en: 'The sine is how high the cabin is, the cosine how far to the right. Pythagoras gives sin² + cos² = 1, a thread on the rim gives radians, and the turning wheel draws the sine wave.',
      ru: 'Синус — насколько кабинка выше оси, косинус — насколько правее. Пифагор даёт sin² + cos² = 1, нитка на ободе — радианы, а вращающееся колесо рисует синусоиду.',
    } },
  { id: 'trig-formulas', track: 'trig', status: 'ready', minutes: 12, prereqs: ['unit-circle'], next: ['trig-equations', 'law-of-cosines'],
    title: { en: 'Reduction and addition formulas', ru: 'Формулы приведения и сложения' },
    summary: {
      en: 'Minus an angle is a mirror, a quarter turn swaps the legs — two questions instead of a table. And cos(α − β) from one chord measured twice.',
      ru: 'Минус угол — зеркало, четверть оборота меняет катеты местами: два вопроса вместо таблицы. И cos(α − β) из одной хорды, измеренной дважды.',
    } },
  { id: 'trig-equations', track: 'trig', status: 'ready', minutes: 10, prereqs: ['unit-circle'], next: ['trig-formulas', 'derivative'],
    title: { en: 'Trigonometric equations', ru: 'Тригонометрические уравнения' },
    summary: {
      en: 'Which cabins are at height a? A line cuts the wheel twice, every turn brings them back: arcsin, arccos and + 2πn.',
      ru: 'Какие кабинки на высоте a? Прямая режет колесо дважды, каждый оборот возвращает их снова: arcsin, arccos и + 2πn.',
    } },

  { id: 'limit', track: 'limits', status: 'ready', minutes: 12, prereqs: ['graph'], next: ['derivative', 'e', 'area'],
    title: { en: 'What a limit really is', ru: 'Что такое предел на самом деле' },
    summary: {
      en: 'A hole in a graph, values closing in from both sides, the ε–δ corridor — and limits that do not exist.',
      ru: 'Дырка в графике, значения, подбирающиеся с двух сторон, коридор «эпсилон–дельта» — и пределы, которых нет.',
    } },
  { id: 'e', track: 'limits', status: 'ready', minutes: 10, prereqs: ['progressions', 'limit', 'exp-log'], next: ['derivative', 'taylor'],
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
  { id: 'chain', track: 'derivatives', status: 'ready', minutes: 12, prereqs: ['derivative'], next: ['gradient', 'network', 'backprop'],
    title: { en: 'Chain rule: machines inside machines', ru: 'Производная сложной функции' },
    summary: {
      en: 'Gears ×2 and ×3 make ×6. Three rulers tied by threads: a tiny piece is stretched by one machine, then by the next — two magnifiers multiply. Why (f(g(x)))′ = f′(g(x))·g′(x), and why one silent neuron stops a whole chain from learning.',
      ru: 'Шестерёнки ×2 и ×3 дают ×6. Три линейки, связанные нитями: крошечный кусок растягивает одна машина, потом следующая — две лупы перемножаются. Почему (f(g(x)))′ = f′(g(x))·g′(x) и почему один молчащий нейрон останавливает обучение целой цепочки.',
    } },
  { id: 'optimization', track: 'derivatives', status: 'planned', prereqs: ['derivative'],
    title: { en: 'Peaks, valleys and optimization', ru: 'Вершины, впадины и оптимизация' } },
  { id: 'taylor', track: 'derivatives', status: 'planned', prereqs: ['derivative'],
    title: { en: 'Taylor series: polynomials that imitate', ru: 'Ряд Тейлора: многочлены-подражатели' } },

  { id: 'area', track: 'integrals', status: 'planned', prereqs: ['limit'],
    title: { en: 'Integral as accumulated area', ru: 'Интеграл как накопленная площадь' } },
  { id: 'ftc', track: 'integrals', status: 'planned', prereqs: ['area', 'derivative'],
    title: { en: 'Why derivative and integral undo each other', ru: 'Почему производная и интеграл взаимно обратны' } },

  { id: 'surfaces', track: 'multivar', status: 'ready', minutes: 12, prereqs: ['graph', 'derivative'], next: ['gradient', 'regression'],
    title: { en: 'Surfaces and slices', ru: 'Поверхности и сечения' },
    summary: {
      en: 'A function of two variables is a landscape. Cut it with planes and you are back to ordinary graphs — and to partial derivatives.',
      ru: 'Функция двух переменных — это ландшафт. Разрежьте его плоскостями, и вы снова увидите обычные графики, а с ними и частные производные.',
    } },
  { id: 'gradient', track: 'multivar', status: 'ready', minutes: 12, prereqs: ['surfaces', 'dot'], next: ['regression', 'network', 'backprop'],
    title: { en: 'Gradient: the steepest way up', ru: 'Градиент: самый крутой подъём' },
    summary: {
      en: 'A hiker\'s map, rain that runs across the level lines, a plank laid on the slope in any direction. Why the steepest way is the gradient and the flat one is at a right angle to it — and why ∇f = 0 at a pass, not only at a top.',
      ru: 'Карта туриста, дождь, бегущий поперёк горизонталей, доска на склоне в любом направлении. Почему самый крутой путь — градиент, а ровный — под прямым углом к нему, и почему ∇f = 0 бывает на перевале, а не только на вершине.',
    } },

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
  { id: 'parallel', track: 'space', status: 'ready', minutes: 8, prereqs: ['axioms'], next: ['perpendicular', 'cube-sections'],
    title: { en: 'Parallel lines and planes', ru: 'Параллельность прямых и плоскостей' },
    summary: {
      en: 'A ruler held level never meets the table; tilt it and it pierces the floor. Floor and shelf are cut by a third plane along parallel lines.',
      ru: 'Линейка, которую держат ровно, никогда не встретит стол; наклоните — и она проткнёт пол. Пол и полку третья плоскость режет по параллельным прямым.',
    } },
  { id: 'perpendicular', track: 'space', status: 'ready', minutes: 8, prereqs: ['parallel'], next: ['angles', 'distances'],
    title: { en: 'A line perpendicular to a plane', ru: 'Перпендикуляр к плоскости' },
    summary: {
      en: 'A pole is at right angles to every line of the floor, and a door shows why two lines are enough. A rope, its shadow and the theorem of three perpendiculars.',
      ru: 'Столб перпендикулярен каждой прямой пола, а дверь показывает, почему хватит двух. Верёвка, её тень и теорема о трёх перпендикулярах.',
    } },

  { id: 'angles', track: 'measure', status: 'ready', minutes: 8, prereqs: ['perpendicular'], next: ['distances', 'polyhedra'],
    title: { en: 'Angles between lines and planes', ru: 'Углы между прямыми и плоскостями' },
    summary: {
      en: 'The angle with a plane is the angle with your own shadow; the angle between planes is read off an open book. The diagonal of a cube rises at 35°.',
      ru: 'Угол с плоскостью — это угол с собственной тенью, угол между плоскостями читают по открытой книге. Диагональ куба поднимается под 35°.',
    } },
  { id: 'distances', track: 'measure', status: 'ready', minutes: 8, prereqs: ['perpendicular'], next: ['polyhedra', 'volumes'],
    title: { en: 'Distances in space', ru: 'Расстояния в пространстве' },
    summary: {
      en: 'A lamp hangs on the shortest cord, straight down. Between skew lines the shortest bridge is perpendicular to both.',
      ru: 'Лампа висит на самом коротком шнуре — отвесном. Между скрещивающимися прямыми самый короткий мост перпендикулярен обеим.',
    } },

  { id: 'polyhedra', track: 'solids', status: 'ready', minutes: 8, prereqs: ['axioms'], next: ['volumes'],
    title: { en: 'Prisms and pyramids', ru: 'Призмы и пирамиды' },
    summary: {
      en: 'Prisms and pyramids, Euler\'s V − E + F = 2 for all of them, and a cube unfolding into a flat net.',
      ru: 'Призмы и пирамиды, формула Эйлера V − E + F = 2 для всех, и куб, разворачивающийся в плоскую развёртку.',
    } },
  { id: 'volumes', track: 'solids', status: 'ready', minutes: 10, prereqs: ['polyhedra'], next: ['area'],
    title: { en: 'Volumes: prism, pyramid, ball', ru: 'Объёмы: призма, пирамида, шар' },
    summary: {
      en: 'A pushed stack of paper keeps its volume, a cube splits into three pyramids, and Archimedes\' ball plus cone fill a cylinder.',
      ru: 'Сдвинутая стопка бумаги сохраняет объём, куб распадается на три пирамиды, а шар и конус Архимеда вместе заполняют цилиндр.',
    } },

  { id: 'vectors', track: 'vecs', status: 'ready', minutes: 12, prereqs: ['pythagoras'], next: ['dot', 'matrix'],
    title: { en: 'Vectors: arrows and numbers', ru: 'Векторы: стрелки и числа' },
    summary: {
      en: 'An arrow is a move; adding is walking, multiplying stretches. Two arrows make a slanted grid over the whole plane — unless they lie on one line.',
      ru: 'Стрелка — это перемещение; сложение — прогулка, умножение — растяжение. Две стрелки дают косую сетку на всю плоскость — если только не лежат на одной прямой.',
    } },
  { id: 'dot', track: 'vecs', status: 'ready', minutes: 10, prereqs: ['vectors'], next: ['det', 'classify'],
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
  { id: 'eigen', track: 'maps', status: 'ready', minutes: 12, prereqs: ['matrix'], next: ['pca'],
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

  { id: 'mod', track: 'remainders', status: 'ready', minutes: 12, next: ['caesar', 'dh'],
    title: { en: 'Remainders: arithmetic on a clock face', ru: 'Остатки: арифметика на циферблате' },
    summary: {
      en: 'Adding is walking around a clock, multiplying is jumping. Why jumps of 5 draw a star through all 12 marks and jumps of 4 only a triangle, how to divide without fractions, and why powers come back to 1.',
      ru: 'Сложение — шаги по кругу, умножение — прыжки. Почему прыжки по 5 рисуют звезду через все 12 отметок, а по 4 — только треугольник, как делить без дробей и почему степени возвращаются к 1.',
    } },
  { id: 'caesar', track: 'remainders', status: 'ready', minutes: 10, prereqs: ['mod'], next: ['dh'],
    title: { en: 'Caesar cipher and letter frequencies', ru: 'Шифр Цезаря и частоты букв' },
    summary: {
      en: 'Encrypting is adding a key on a clock of letters. Why there are too few keys, how letter frequencies give the key away at a glance — and what a real cipher must do better.',
      ru: 'Зашифровать — прибавить ключ на часах из букв. Почему ключей слишком мало, как частоты букв выдают ключ с первого взгляда — и что настоящий шифр должен делать лучше.',
    } },
  { id: 'dh', track: 'publickey', status: 'ready', minutes: 12, prereqs: ['mod'], next: ['rsa', 'ecc'],
    title: { en: 'A shared secret in public: Diffie–Hellman', ru: 'Общий секрет у всех на виду: Диффи — Хеллман' },
    summary: {
      en: 'Powers on a clock of a prime are easy to compute and hopeless to undo. Two people swap g^a and g^b in public and both get g^(ab) — while the listener gets nothing.',
      ru: 'Степени на часах из простого числа легко вычислить и безнадёжно обратить. Двое обмениваются g^a и g^b у всех на виду и оба получают g^(ab) — а подслушивающий не получает ничего.',
    } },
  { id: 'rsa', track: 'publickey', status: 'ready', minutes: 12, prereqs: ['dh'], next: ['ecc'],
    title: { en: 'RSA: a lock anyone can close', ru: 'RSA: замок, который закроет любой' },
    summary: {
      en: 'Powers on a clock of n = p·q come back after (p − 1)(q − 1) steps. So a public e and a secret d with e·d ≡ 1 lock and unlock — and finding d means factoring n.',
      ru: 'Степени на часах из n = p·q возвращаются через (p − 1)(q − 1) шагов. Поэтому открытое e и секретное d с e·d ≡ 1 запирают и отпирают — а найти d значит разложить n на множители.',
    } },
  { id: 'ecc', track: 'publickey', status: 'ready', minutes: 15, prereqs: ['quadratic', 'dh', 'derivative'],
    title: { en: 'Elliptic curves: adding points', ru: 'Эллиптические кривые: сложение точек' },
    summary: {
      en: 'A line through two points of y² = x³ + ax + b meets the curve once more — reflect that point and you have the sum. The same curve on a clock of a prime turns into a cloud of points, and steps kG are the Diffie–Hellman of today\'s internet.',
      ru: 'Прямая через две точки кривой y² = x³ + ax + b встречает её ещё раз — отразите эту точку, и получится сумма. Та же кривая на часах из простого числа становится облаком точек, а шаги kG — это Диффи — Хеллман сегодняшнего интернета.',
    } },

  // Machine learning: the same linear algebra and derivatives, now learning from data
  { id: 'ml-intro', track: 'learn', status: 'ready', minutes: 10, prereqs: [], next: ['regression', 'classify', 'network'],
    title: { en: 'An introduction to machine learning', ru: 'Введение в машинное обучение' },
    summary: {
      en: 'A film first: why rules fail and examples work, how a nerve cell fires, how an artificial neuron is made of numbers, why knowledge lives in weights, and how a neuron learns from its mistakes. Then decide, train and tune it yourself.',
      ru: 'Сначала ролик: почему правила не справляются, а примеры — да, как срабатывает нервная клетка, как из неё получается искусственный нейрон, почему знания живут в весах и как нейрон учится на ошибках. Потом — решайте, обучайте и настраивайте его сами.',
    } },
  { id: 'regression', track: 'learn', status: 'ready', minutes: 15, prereqs: ['derivative', 'surfaces'], next: ['classify', 'overfit', 'gradient'],
    title: { en: 'Linear regression: learning is rolling downhill', ru: 'Линейная регрессия: учиться — значит катиться вниз' },
    summary: {
      en: 'A line through a cloud of points. Its error is the mean area of squares, every line is a point of a map, the error over the map is a bowl — and learning is gradient descent to its bottom.',
      ru: 'Прямая сквозь облако точек. Её ошибка — средняя площадь квадратов, каждая прямая — точка на карте, ошибка над картой — чаша, а обучение — градиентный спуск на её дно.',
    } },
  { id: 'classify', track: 'learn', status: 'ready', minutes: 15, prereqs: ['regression', 'dot'], next: ['network', 'overfit'],
    title: { en: 'Classification: a line that separates', ru: 'Классификация: прямая, которая разделяет' },
    summary: {
      en: 'Spam or not: the side of a line is the sign of a dot product, the sigmoid turns it into a probability — a smooth step over the plane — and the log loss makes a confident mistake the most expensive thing there is.',
      ru: 'Спам или нет: сторона прямой — знак скалярного произведения, сигмоида превращает его в вероятность — плавную ступеньку над плоскостью, — а log loss делает уверенную ошибку самой дорогой.',
    } },
  { id: 'overfit', track: 'learn', status: 'ready', minutes: 14, prereqs: ['regression'], next: ['network'],
    title: { en: 'Overfitting: a model that memorises', ru: 'Переобучение: модель, которая зубрит' },
    summary: {
      en: 'A polynomial of degree 9 passes through all ten points — and through their noise. Why exactly one curve fits (Lagrange), the error on new points as a U, bias against variance, and two cures: a penalty and more data.',
      ru: 'Многочлен степени 9 проходит через все десять точек — и через их шум. Почему подходит ровно одна кривая (Лагранж), ошибка на новых точках буквой U, смещение против разброса и два лекарства: штраф и больше данных.',
    } },
  { id: 'network', track: 'nets', status: 'ready', minutes: 18, prereqs: ['classify', 'matrix3', 'rank'], next: ['backprop', 'overfit'],
    title: { en: 'A neural network folds the plane', ru: 'Нейросеть сгибает плоскость' },
    summary: {
      en: 'No line separates a ring. A neuron is a line and a fold; three neurons lift the plane into space, ReLU folds it into a corner, and a flat cut there is a bent boundary back in the plane. Then training finds the folds by itself.',
      ru: 'Кольцо не отделить прямой. Нейрон — это прямая и сгиб; три нейрона поднимают плоскость в пространство, ReLU складывает её в угол, и плоский срез там — изогнутая граница на плоскости. А потом обучение само находит сгибы.',
    } },
  { id: 'backprop', track: 'nets', status: 'ready', minutes: 14, prereqs: ['network', 'chain', 'gradient'], next: ['overfit', 'conv'],
    title: { en: 'Backpropagation: the chain rule on a graph', ru: 'Обратное распространение: цепное правило на графе' },
    summary: {
      en: 'A computation as a graph of tiny machines: numbers run forward, the blame for the error runs back. Along a path the local stretches multiply, where paths split they add, a silent ReLU stops the blame — and all the derivatives cost 2 runs instead of N + 1.',
      ru: 'Вычисление как граф маленьких машин: числа бегут вперёд, вина за ошибку — назад. Вдоль пути местные растяжения перемножаются, где пути расходятся — складываются, молчащий ReLU останавливает вину. И все производные стоят 2 прогона вместо N + 1.',
    } },
  { id: 'conv', track: 'nets', status: 'planned', prereqs: ['network'],
    title: { en: 'Convolution: how a network sees a picture', ru: 'Свёртка: как сеть видит картинку' } },
  { id: 'pca', track: 'structure', status: 'ready', minutes: 14, prereqs: ['eigen', 'regression', 'pythagoras'], next: ['kmeans'],
    title: { en: 'Principal components: where a cloud is stretched', ru: 'Главные компоненты: куда вытянуто облако' },
    summary: {
      en: 'Shadows of a cloud on a line: the widest shadows are also the closest line (Pythagoras for every point). The spread over directions is a wave whose top is an eigenvector of the covariance matrix — and a pancake in space squeezed into a plane.',
      ru: 'Тени облака на прямой: самые широкие тени дают и ближайшую прямую (Пифагор для каждой точки). Разброс по направлениям — волна, вершина которой — собственный вектор матрицы ковариации. И блин в пространстве, прижатый к плоскости.',
    } },
  { id: 'kmeans', track: 'structure', status: 'planned', prereqs: ['pca'],
    title: { en: 'Clusters: k-means', ru: 'Кластеры: метод k-средних' } },
];

export const topicMeta = id => CATALOG.find(x => x.id === id);

const MODULES = {
  pythagoras: () => import('./pythagoras.js'),
  'angles-parallel': () => import('./angles-parallel.js'),
  congruent: () => import('./congruent.js'),
  similar: () => import('./similar.js'),
  areas: () => import('./areas.js'),
  inscribed: () => import('./inscribed.js'),
  'law-of-cosines': () => import('./law-of-cosines.js'),
  quadratic: () => import('./quadratic.js'),
  progressions: () => import('./progressions.js'),
  graph: () => import('./graph.js'),
  transform: () => import('./transform.js'),
  'exp-log': () => import('./exp-log.js'),
  'unit-circle': () => import('./unit-circle.js'),
  'trig-formulas': () => import('./trig-formulas.js'),
  'trig-equations': () => import('./trig-equations.js'),
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
  mod: () => import('./mod.js'),
  caesar: () => import('./caesar.js'),
  dh: () => import('./dh.js'),
  rsa: () => import('./rsa.js'),
  ecc: () => import('./ecc.js'),
  'cube-sections': () => import('./cube-sections.js'),
  parallel: () => import('./parallel.js'),
  perpendicular: () => import('./perpendicular.js'),
  angles: () => import('./angles.js'),
  distances: () => import('./distances.js'),
  polyhedra: () => import('./polyhedra.js'),
  volumes: () => import('./volumes.js'),
  derivative: () => import('./derivative.js'),
  chain: () => import('./chain.js'),
  surfaces: () => import('./surfaces.js'),
  gradient: () => import('./gradient.js'),
  'ml-intro': () => import('./ml-intro.js'),
  regression: () => import('./regression.js'),
  classify: () => import('./classify.js'),
  network: () => import('./network.js'),
  backprop: () => import('./backprop.js'),
  overfit: () => import('./overfit.js'),
  pca: () => import('./pca.js'),
};

export async function loadTopic(id) {
  return MODULES[id] ? (await MODULES[id]()).default : loadAlgorithmTopic(id);
}
