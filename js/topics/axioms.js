// Points, lines and planes in space. Three points fix a plane (a stool on three legs does not wobble), a line
// with two points in a plane lies in it, two planes meet along a line. A line and a plane: the point where the
// line pierces the plane (its trace) runs away as the line turns parallel. Two lines: crossing, parallel, skew.

import { COLORS } from '../core/palette.js';
import { cube, plane3, section, lerp, add, sub, mul, avg } from '../core/geom.js';
import { t } from '../core/i18n.js';

const CUBE = cube(3);
const V = CUBE.V;
const EDGE = '#c9d1dc';
const WHITE = '#ffffff';
const CAMERA = [7.5, -6, 4.5];
const h = 1.5;

// The bottom plane ABCD, much wider than the cube: lines may pierce it outside the cube
const FLOOR = [[-6, -6, -h], [6, -6, -h], [6, 6, -h], [-6, 6, -h]];
// A whole line through a and b, drawn from a − s·ab to a + e·ab
const line = (a, b, s, e) => [add(a, mul(sub(b, a), -s)), add(a, mul(sub(b, a), e))];

// K on AA₁ at two thirds of the edge; L on CC₁ at the part u; the trace of KL on ABCD (λ along K → L)
const K = lerp(V.A, V.A1, 2 / 3);
const L = u => lerp(V.C, V.C1, u);
const traceAt = u => (Math.abs(2 - 3 * u) < 0.03 ? null : 2 / (2 - 3 * u));

// Pairs of lines on the cube: crossing, parallel, skew
const PAIRS = [['A', 'B', 'A', 'D'], ['A', 'B', 'D1', 'C1'], ['A', 'B', 'C', 'C1']];

export default {
  view: '3d',
  view3d: { R: 4, zmax: 4, camera: CAMERA, axes: false },
  lab: false,

  setup(scene) {
    scene.ensureParam('u', 0.2, { min: 0, max: 1 }); // L on CC₁
    scene.ensureParam('w', 0.3, { min: 0, max: 1 }); // the student's trace T on the line AC
    scene.ensureParam('v', 0.3, { min: 0, max: 1 }); // P on B₁C₁
    scene.ensureParam('k', 0, { min: 0, max: 2, step: 1 }); // which pair of lines

    const floor = (p, key) => p.polygon(key, FLOOR, COLORS.blue, { opacity: 0.05, outline: false });

    scene.custom.push(
      { id: 'cube', draw3d(p) { p.polyhedron('cube', CUBE, EDGE); } },
      {
        // Three points and their plane; a fourth point is off it
        id: 'three',
        draw3d(p) {
          const tri = section(CUBE, plane3(V.A, V.C, V.B1));
          p.polygon('three:sec', tri, COLORS.yellow, { opacity: 0.3, poly: CUBE });
          ['A', 'C', 'B1'].forEach(n => p.point(`three:${n}`, V[n], COLORS.red));
          p.point('three:D1', V.D1, COLORS.purple);
        },
        legend: () => t({ en: '\\text{plane } \\yellow{(ACB_1)}: \\ \\purple{D_1} \\notin (ACB_1)', ru: '\\text{плоскость } \\yellow{(ACB_1)}: \\ \\purple{D_1} \\notin (ACB_1)' }),
      },
      {
        // A line through two points of the floor lies in the floor
        id: 'inPlane',
        draw3d(p) {
          floor(p, 'inPlane:floor');
          const M = lerp(V.A, V.B, 0.5), N = lerp(V.B, V.C, 0.5);
          const [a, b] = line(M, N, 3, 4);
          p.segment('inPlane:MN', a, b, COLORS.green, { radius: 0.03 });
          p.point('inPlane:M', M, COLORS.red, 'M');
          p.point('inPlane:N', N, COLORS.red, 'N');
        },
        legend: () => t({ en: 'M,\\ N \\in (ABC) \\;\\Rightarrow\\; \\green{MN} \\subset (ABC)', ru: 'M,\\ N \\in (ABC) \\;\\Rightarrow\\; \\green{MN} \\subset (ABC)' }),
      },
      {
        // Two diagonal planes of the cube meet along the line through the centres of the bottom and the top
        id: 'twoPlanes',
        draw3d(p) {
          p.polygon('twoPlanes:a', [V.A, V.C, V.C1, V.A1], COLORS.yellow, { opacity: 0.25, poly: CUBE });
          p.polygon('twoPlanes:b', [V.B, V.D, V.D1, V.B1], COLORS.teal, { opacity: 0.25, poly: CUBE });
          const O = avg([V.A, V.C]), O1 = avg([V.A1, V.C1]);
          p.segment('twoPlanes:OO1', add(O, [0, 0, -1.2]), add(O1, [0, 0, 1.2]), WHITE, { radius: 0.04 });
          p.point('twoPlanes:O', O, WHITE, 'O');
          p.point('twoPlanes:O1', O1, WHITE, 'O<sub>1</sub>');
        },
        legend: () => '\\yellow{(ACC_1)} \\cap \\teal{(BDD_1)} = OO_1',
      },
      {
        // The line KL and its trace on the floor; L is dragged along CC₁
        id: 'trace',
        draw3d(p, sc, s) {
          floor(p, 'trace:floor');
          const Lp = L(s.u), lam = traceAt(s.u);
          const [a, b] = line(K, Lp, lam !== null && lam < 0 ? Math.min(6, -lam + 0.6) : 1.5, lam !== null && lam > 0 ? Math.min(6, lam + 0.6) : 3);
          p.segment('trace:KL', a, b, COLORS.green, { radius: 0.03 });
          p.point('trace:K', K, COLORS.red, 'K');
          if (lam !== null && Math.abs(lam) < 5.5) {
            const T = add(K, mul(sub(Lp, K), lam));
            p.point('trace:T', T, COLORS.yellow, 'T', 0.1);
            p.segment('trace:AT', V.A, T, COLORS.yellow, { radius: 0.02 });
          }
          p.handle('trace:L', V.C, V.C1, s.u, WHITE, u => sc.setParam('u', u), 'L');
        },
        legend: s => {
          const lam = traceAt(s.u);
          return lam === null
            ? t({ en: '\\green{KL} \\parallel (ABC)', ru: '\\green{KL} \\parallel (ABC)' })
            : Math.abs(lam) < 5.5 ? '\\green{KL} \\cap (ABC) = \\yellow{T}' : t({ en: '\\yellow{T} \\text{ is far away}', ru: '\\yellow{T} \\text{ далеко}' });
        },
      },
      {
        // Two lines of the cube: crossing, parallel or skew
        id: 'pairs',
        draw3d(p, sc, s) {
          const [a, b, c, d] = PAIRS[Math.round(s.k)];
          const [p1, p2] = line(V[a], V[b], 0.4, 1.4), [q1, q2] = line(V[c], V[d], 0.4, 1.4);
          p.segment('pairs:1', p1, p2, COLORS.red, { radius: 0.035 });
          p.segment('pairs:2', q1, q2, COLORS.blue, { radius: 0.035 });
        },
        legend: s => {
          const k = Math.round(s.k), [a, b, c, d] = PAIRS[k].map(n => n.replace(/(\d)/, '_$1'));
          const word = t([{ en: 'cross', ru: 'пересекаются' }, { en: 'are parallel', ru: 'параллельны' }, { en: 'are skew', ru: 'скрещиваются' }][k]);
          return `\\red{${a}${b}},\\ \\blue{${c}${d}}:\\ \\text{${word}}`;
        },
      },
      // ---- Tasks ----
      {
        // A₁L with L at a third of CC₁; the student drags T along the line AC to where A₁L pierces the floor
        id: 'findT',
        draw3d(p, sc, s) {
          floor(p, 'findT:floor');
          const Lp = L(1 / 3), far = add(V.A, mul(sub(V.C, V.A), 2));
          const [a, b] = line(V.A1, Lp, 0.6, 2);
          p.segment('findT:KL', a, b, COLORS.green, { radius: 0.03 });
          p.segment('findT:AC', V.A, far, COLORS.grey, { radius: 0.015 });
          p.point('findT:L', Lp, COLORS.red, 'L');
          p.handle('findT:T', V.A, far, s.w, WHITE, w => sc.setParam('w', w), 'T');
        },
      },
      {
        // The same KL, its trace hidden: the student turns it parallel to the floor
        id: 'turnL',
        draw3d(p, sc, s) {
          floor(p, 'turnL:floor');
          const [a, b] = line(K, L(s.u), 1.5, 3);
          p.segment('turnL:KL', a, b, COLORS.green, { radius: 0.03 });
          p.point('turnL:K', K, COLORS.red, 'K');
          p.handle('turnL:L', V.C, V.C1, s.u, WHITE, u => sc.setParam('u', u), 'L');
        },
      },
      {
        // AB and D₁P, P on B₁C₁
        id: 'lineP',
        draw3d(p, sc, s) {
          const P = lerp(V.B1, V.C1, s.v);
          const [p1, p2] = line(V.A, V.B, 0.4, 1.4), [q1, q2] = line(V.D1, P, 0.4, 2);
          p.segment('lineP:AB', p1, p2, COLORS.red, { radius: 0.035 });
          p.segment('lineP:D1P', q1, q2, COLORS.blue, { radius: 0.035 });
          p.handle('lineP:P', V.B1, V.C1, s.v, WHITE, v => sc.setParam('v', v), 'P');
        },
      },
    );
  },

  steps: [
    {
      title: { en: 'Three points make a plane', ru: 'Три точки задают плоскость' },
      text: {
        en: 'Space has three basic things: points, lines and planes. Through any three points that are not on one line there is exactly one plane. Here it is the plane through $A$, $C$ and $B_1$ — it cuts the cube along the <span class="c-yellow">triangle</span>. A fourth point, $\\purple{D_1}$, is off it: four points do not have to lie in one plane.',
        ru: 'В пространстве три главных объекта: точки, прямые и плоскости. Через любые три точки, не лежащие на одной прямой, проходит ровно одна плоскость. Здесь это плоскость через $A$, $C$ и $B_1$ — она режет куб по <span class="c-yellow">треугольнику</span>. А четвёртая точка, $\\purple{D_1}$, в неё не попала: четыре точки не обязаны лежать в одной плоскости.',
      },
      try: { en: 'Turn the cube until the triangle becomes a line: you look along the plane.', ru: 'Поверните куб так, чтобы треугольник стал отрезком: вы смотрите вдоль плоскости.' },
      check: {
        q: { en: 'Why does a stool on three legs never wobble, and a table on four may?', ru: 'Почему табуретка на трёх ножках никогда не качается, а стол на четырёх может?' },
        options: [
          { text: { en: 'three ends of legs always lie in one plane', ru: 'три конца ножек всегда лежат в одной плоскости' }, ok: true },
          { text: { en: 'three legs are stronger', ru: 'три ножки прочнее' } },
          { text: { en: 'it is about the weight', ru: 'дело в весе' } },
        ],
        explain: {
          en: 'The floor is a plane, and three ends always fit one plane — the floor. Four ends fit one plane only if the fourth happens to be in the plane of the other three; if one leg is a bit short, it is not.',
          ru: 'Пол — плоскость, а три конца всегда помещаются в одну плоскость — в пол. Четыре конца помещаются в одну плоскость, только если четвёртый случайно попал в плоскость трёх других; чуть короче ножка — и нет.',
        },
      },
      state: { show: ['cube', 'three'], camera: CAMERA, controls: [] },
    },
    {
      title: { en: 'A line in a plane', ru: 'Прямая в плоскости' },
      text: {
        en: 'If two points of a line lie in a plane, the whole line lies in it. $M$ and $N$ are the midpoints of $AB$ and $BC$, both in the bottom plane $(ABC)$, so the <span class="c-green">line $MN$</span> lies in that plane all the way, even far outside the cube. This is the rule 1 of building sections: two points on one face are simply joined.',
        ru: 'Если две точки прямой лежат в плоскости, то и вся прямая лежит в ней. $M$ и $N$ — середины $AB$ и $BC$, обе в нижней плоскости $(ABC)$, значит <span class="c-green">прямая $MN$</span> лежит в этой плоскости целиком — даже далеко за кубом. Это правило 1 построения сечений: две точки одной грани просто соединяем.',
      },
      check: {
        q: { en: 'The line through the midpoints of $AA_1$ and $BB_1$ lies in which plane?', ru: 'Прямая через середины $AA_1$ и $BB_1$ лежит в какой плоскости?' },
        options: [{ text: '$(ABB_1)$', ok: true }, { text: '$(ABC)$' }, { text: '$(A_1B_1C_1)$' }],
        explain: {
          en: 'Both midpoints lie on the front face $ABB_1A_1$: on its edges $AA_1$ and $BB_1$. So the line lies in the plane of that face. It is parallel to the other two planes, but not in them.',
          ru: 'Обе середины лежат на передней грани $ABB_1A_1$ — на её рёбрах $AA_1$ и $BB_1$. Значит, прямая лежит в плоскости этой грани. Двум другим плоскостям она параллельна, но в них не лежит.',
        },
      },
      state: { show: ['cube', 'inPlane'], camera: CAMERA, controls: [] },
    },
    {
      title: { en: 'Two planes meet along a line', ru: 'Две плоскости пересекаются по прямой' },
      text: {
        en: 'If two planes have one common point, they have a whole common line through it. The two diagonal planes of the cube, $\\yellow{(ACC_1)}$ and $\\teal{(BDD_1)}$, share the centre $O$ of the bottom and the centre $O_1$ of the top — so they meet along the line $OO_1$.',
        ru: 'Если у двух плоскостей есть общая точка, то у них есть и общая прямая через неё. Две диагональные плоскости куба, $\\yellow{(ACC_1)}$ и $\\teal{(BDD_1)}$, обе проходят через центр $O$ нижней грани и центр $O_1$ верхней — значит, пересекаются по прямой $OO_1$.',
      },
      try: { en: 'Turn the cube and look from above: the two planes become two crossing lines.', ru: 'Поверните куб и посмотрите сверху: две плоскости превратятся в две пересекающиеся прямые.' },
      check: {
        q: { en: 'Can two different planes have exactly one common point?', ru: 'Могут ли две разные плоскости иметь ровно одну общую точку?' },
        options: [{ text: { en: 'yes', ru: 'да' } }, { text: { en: 'no', ru: 'нет' }, ok: true }],
        explain: {
          en: 'No: one common point brings a whole common line. Two planes either do not meet (they are parallel) or meet along a line.',
          ru: 'Нет: одна общая точка тянет за собой целую общую прямую. Две плоскости либо не встречаются (параллельны), либо пересекаются по прямой.',
        },
      },
      state: { show: ['cube', 'twoPlanes'], camera: [7, -5.5, 6], controls: [] },
    },
    {
      title: { en: 'Where a line pierces a plane', ru: 'Где прямая протыкает плоскость' },
      text: {
        en: '$K$ is on $AA_1$, two thirds up; drag $L$ along $CC_1$. The <span class="c-green">line $KL$</span> goes down and pierces the bottom plane at the point <span class="c-yellow">$T$</span>, its <i>trace</i>. The closer $L$ gets to the height of $K$, the flatter the line and the further away $T$. At the same height $KL$ never meets the plane: it is <b>parallel</b> to it. Higher still — and $T$ comes back from the other side, behind $A$.',
        ru: '$K$ стоит на $AA_1$ на двух третях высоты; тяните $L$ вдоль $CC_1$. <span class="c-green">Прямая $KL$</span> спускается и протыкает нижнюю плоскость в точке <span class="c-yellow">$T$</span> — это её <i>след</i>. Чем ближе $L$ к высоте $K$, тем положе прямая и тем дальше $T$. На одной высоте $KL$ плоскость вообще не встречает: она ей <b>параллельна</b>. Ещё выше — и $T$ возвращается с другой стороны, из-за $A$.',
      },
      try: { en: 'Drag the white point $L$; turn the cube to see $T$.', ru: 'Тяните белую точку $L$; поворачивайте куб, чтобы видеть $T$.' },
      check: {
        q: { en: 'A line and a plane: how many common points can they have?', ru: 'Сколько общих точек может быть у прямой и плоскости?' },
        options: [{ text: { en: '0 or 1', ru: '0 или 1' } }, { text: { en: '0, 1 or infinitely many', ru: '0, 1 или бесконечно много' }, ok: true }, { text: '1' }],
        explain: {
          en: 'One — the line pierces the plane (a trace). None — the line is parallel to it. Infinitely many — the line lies in the plane (two common points are enough for that).',
          ru: 'Одна — прямая протыкает плоскость (след). Ни одной — прямая ей параллельна. Бесконечно много — прямая лежит в плоскости (для этого хватит двух общих точек).',
        },
      },
      state: { show: ['cube', 'trace'], params: { u: 0.2 }, camera: [8.5, -3.5, 6.5], controls: ['u'] },
    },
    {
      title: { en: 'Two lines: crossing, parallel, skew', ru: 'Две прямые: пересекаются, параллельны, скрещиваются' },
      text: {
        en: 'On a plane two lines either cross or are parallel. In space there is a third way. $AB$ and $AD$ cross at $A$. $AB$ and $D_1C_1$ are parallel: they lie in one plane and never meet. And $AB$ and $CC_1$ do not meet <b>and</b> are not parallel — no plane contains both. Such lines are called <i>skew</i>.',
        ru: 'На плоскости две прямые либо пересекаются, либо параллельны. В пространстве есть третий случай. $AB$ и $AD$ пересекаются в $A$. $AB$ и $D_1C_1$ параллельны: лежат в одной плоскости и не встречаются. А $AB$ и $CC_1$ не встречаются <b>и</b> не параллельны — нет плоскости, в которой лежат обе. Такие прямые называют <i>скрещивающимися</i>.',
      },
      try: { en: 'Press ▶ next to $k$ to go through the three cases.', ru: 'Нажмите ▶ возле $k$, чтобы перебрать три случая.' },
      check: {
        q: { en: 'And $AA_1$ and $BC$?', ru: 'А $AA_1$ и $BC$?' },
        options: [{ text: { en: 'cross', ru: 'пересекаются' } }, { text: { en: 'parallel', ru: 'параллельны' } }, { text: { en: 'skew', ru: 'скрещиваются' }, ok: true }],
        explain: {
          en: '$AA_1$ goes up, $BC$ runs along the floor sideways: not parallel. And they do not meet: $AA_1$ touches the floor only at $A$, which is not on $BC$. So they are skew.',
          ru: '$AA_1$ идёт вверх, $BC$ — вбок по полу: не параллельны. И не встречаются: $AA_1$ касается пола только в $A$, а $A$ не на $BC$. Значит, скрещиваются.',
        },
      },
      state: { show: ['cube', 'pairs'], params: { k: 0 }, camera: CAMERA, controls: ['k'] },
    },
    {
      title: { en: 'Your turn', ru: 'Теперь сами' },
      text: {
        en: 'Go back to the trace: put $L$ low on $CC_1$ and find $T$; then raise $L$ and watch $T$ run away. On the cube find more skew pairs: there are $24$ pairs of skew edges. Then go to <a href="#topic/cube-sections">sections of a cube</a> — every section is built from traces and lines in faces.',
        ru: 'Вернитесь к следу: поставьте $L$ низко на $CC_1$ и найдите $T$; потом поднимайте $L$ и смотрите, как $T$ убегает. Найдите на кубе ещё скрещивающиеся пары: пар скрещивающихся рёбер — $24$. А дальше — <a href="#topic/cube-sections">сечения куба</a>: любое сечение строится из следов и прямых в гранях.',
      },
      state: { show: ['cube', 'trace'], params: { u: 0.1 }, camera: [8.5, -3.5, 6.5], controls: ['u'] },
    },
    {
      title: { en: 'Find the trace', ru: 'Найдите след' },
      text: {
        en: '$L$ is one third up $CC_1$. Where does the line $A_1L$ pierce the bottom plane? Drag $T$ along the grey line $AC$ to that place. Turn the cube to check from the side.',
        ru: '$L$ — на трети $CC_1$. Где прямая $A_1L$ протыкает нижнюю плоскость? Тяните $T$ вдоль серой прямой $AC$ в это место. Поверните куб, чтобы проверить сбоку.',
      },
      task: {
        kind: 'drag',
        target: { w: 0.75 },
        tol: 0.03,
        back: 3,
        right: {
          en: 'From $A_1$ to $L$ the line goes one $AC$ forward and drops from height $3$ to $1$ — by $2$. To drop the last $1$ it needs half of that: $AT = 1.5\\,AC$. The triangles $A_1AT$ and $LCT$ are similar.',
          ru: 'От $A_1$ до $L$ прямая проходит одно $AC$ вперёд и опускается с высоты $3$ до $1$ — на $2$. Чтобы опуститься ещё на $1$, нужна половина такого шага: $AT = 1.5\\,AC$. Треугольники $A_1AT$ и $LCT$ подобны.',
        },
        mistakes: [
          { params: { w: 0.5 }, text: {
            en: '$C$ is under $L$, but the line is still at height $1$ there. It keeps going down beyond $L$ and reaches the plane later.',
            ru: '$C$ — под $L$, но прямая там ещё на высоте $1$. За $L$ она продолжает спускаться и доходит до плоскости позже.' } },
        ],
        hints: {
          w: w => (2 * w < 1.5
            ? { en: 'Too close: here the line $A_1L$ is still above the plane. Each $AC$ forward it drops by $2$, and from $A_1$ it has to drop by $3$.', ru: 'Слишком близко: здесь прямая $A_1L$ ещё над плоскостью. За каждое $AC$ вперёд она опускается на $2$, а от $A_1$ ей нужно опуститься на $3$.' }
            : { en: 'Too far: the line has already gone under the plane here.', ru: 'Слишком далеко: здесь прямая уже ушла под плоскость.' }),
        },
      },
      state: { show: ['cube', 'findT'], params: { w: 0.15 }, camera: [10, -7, 8.5], controls: [] },
    },
    {
      title: { en: 'Make it parallel', ru: 'Сделайте параллельной' },
      text: {
        en: 'Drag $L$ along $CC_1$ so that the line $KL$ becomes parallel to the bottom plane $(ABC)$.',
        ru: 'Тяните $L$ вдоль $CC_1$ так, чтобы прямая $KL$ стала параллельной нижней плоскости $(ABC)$.',
      },
      task: {
        kind: 'drag',
        target: { u: 2 / 3 },
        tol: 0.03,
        back: 3,
        right: {
          en: 'At the same height as $K$, two thirds of the edge, the line neither goes down nor up: it never meets the bottom plane. In fact $KL \\parallel AC$, and a line parallel to a line of a plane is parallel to the plane.',
          ru: 'На той же высоте, что $K$, — две трети ребра — прямая не спускается и не поднимается и нижнюю плоскость не встречает. Ведь $KL \\parallel AC$, а прямая, параллельная прямой плоскости, параллельна и самой плоскости.',
        },
        mistakes: [
          { params: { u: 0 }, text: {
            en: 'Now $L = C$ lies in the bottom plane itself: the line $KC$ meets the plane right at $C$.',
            ru: 'Теперь $L = C$ лежит в самой нижней плоскости: прямая $KC$ встречает плоскость прямо в $C$.' } },
        ],
        hints: {
          u: u => (u < 2 / 3
            ? { en: '$L$ is lower than $K$: the line goes down and pierces the plane beyond $C$. Raise $L$.', ru: '$L$ ниже $K$: прямая спускается и протыкает плоскость за $C$. Поднимите $L$.' }
            : { en: '$L$ is higher than $K$: the line goes down the other way and pierces the plane behind $A$. Lower $L$.', ru: '$L$ выше $K$: прямая спускается в другую сторону и протыкает плоскость за $A$. Опустите $L$.' }),
        },
      },
      state: { show: ['cube', 'turnL'], params: { u: 0.15 }, camera: [8.5, -3.5, 6.5], controls: [] },
    },
    {
      title: { en: 'Parallel or skew?', ru: 'Параллельны или скрещиваются?' },
      text: {
        en: '$P$ slides along the top edge $B_1C_1$. Put it so that the line $\\blue{D_1P}$ is parallel to $\\red{AB}$.',
        ru: '$P$ скользит по верхнему ребру $B_1C_1$. Поставьте её так, чтобы прямая $\\blue{D_1P}$ была параллельна $\\red{AB}$.',
      },
      task: {
        kind: 'drag',
        target: { v: 1 },
        tol: 0.03,
        back: 4,
        right: {
          en: 'With $P = C_1$ the line is $D_1C_1$, and $D_1C_1 \\parallel DC \\parallel AB$. Anywhere else on $B_1C_1$ the line $D_1P$ is skew to $AB$: they are in parallel planes, but go in different directions.',
          ru: 'При $P = C_1$ это прямая $D_1C_1$, а $D_1C_1 \\parallel DC \\parallel AB$. В любом другом месте $B_1C_1$ прямая $D_1P$ скрещивается с $AB$: они в параллельных плоскостях, но идут в разные стороны.',
        },
        mistakes: [
          { params: { v: 0 }, text: {
            en: '$D_1B_1$ lies in the top plane, $AB$ in the bottom one, and the planes are parallel — so the lines never meet. But that is not enough to be parallel: they go in different directions. They are skew.',
            ru: '$D_1B_1$ лежит в верхней плоскости, $AB$ — в нижней, плоскости параллельны — значит, прямые не встречаются. Но этого мало для параллельности: они идут в разные стороны. Они скрещиваются.' } },
        ],
        hints: {
          v: { en: 'Now $D_1P$ and $AB$ do not meet, but go in different directions: they are skew. Parallel means one direction — like the edges of the cube that run along $AB$.', ru: 'Сейчас $D_1P$ и $AB$ не встречаются, но идут в разные стороны — скрещиваются. Параллельны — значит идут в одну сторону, как рёбра куба вдоль $AB$.' },
        },
      },
      state: { show: ['cube', 'lineP'], params: { v: 0.35 }, camera: CAMERA, controls: [] },
    },
  ],
};
