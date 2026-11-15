// A line perpendicular to a plane. A pole stands upright: it makes a right angle with every line of the floor
// through its foot. Two such lines are enough to check — a door turns about its hinge and its lower edge sweeps
// the floor. The theorem of three perpendiculars: a line of the floor is perpendicular to a slanted rope exactly
// when it is perpendicular to the rope's shadow.

import { COLORS } from '../core/palette.js';
import { fmt } from '../core/numeric.js';
import { add, sub, mul, dot, len, norm } from '../core/geom.js';

const WHITE = '#ffffff';
const DEG = Math.PI / 180;
const CAMERA = [7, -6, 4.5];
const FLOOR = [[-3.5, -3.5, 0], [3.5, -3.5, 0], [3.5, 3.5, 0], [-3.5, 3.5, 0]];
const O = [0, 0, 0], P = [0, 0, 3], A = [2, 2, 0];
const flat = d => [Math.cos(d * DEG), Math.sin(d * DEG), 0];
const r0 = v => fmt(Math.round(v));

// The angle between two lines with directions u and v, in degrees (0…90)
export const between = (u, v) => Math.acos(Math.min(1, Math.abs(dot(u, v)) / (len(u) * len(v)))) / DEG;

// A small right-angle mark at V between the directions u and w
function corner(p, key, V, u, w, color) {
  const a = add(V, mul(norm(u), 0.35)), b = add(V, mul(norm(w), 0.35));
  p.segment(key + ':1', a, add(a, mul(norm(w), 0.35)), color, { radius: 0.015 });
  p.segment(key + ':2', b, add(b, mul(norm(u), 0.35)), color, { radius: 0.015 });
}
const floor = (p, key) => p.polygon(key, FLOOR, COLORS.blue, { opacity: 0.06, outline: false });
const pole = (p, key) => { p.segment(key, O, P, COLORS.yellow, { radius: 0.06 }); p.point(key + ':O', O, WHITE, 'O'); };

// The pole, the rope PA, its shadow OA and the line l of the floor through A; right-angle marks when l ⊥ OA
function rope(p, s, k) {
  floor(p, `${k}:floor`);
  pole(p, `${k}:OP`);
  const d = flat(s.psi);
  p.segment(`${k}:PA`, P, A, COLORS.red, { radius: 0.04 });
  p.segment(`${k}:OA`, O, A, COLORS.purple, { radius: 0.04 });
  p.segment(`${k}:l`, add(A, mul(d, -2.2)), add(A, mul(d, 2.2)), COLORS.green, { radius: 0.035 });
  p.point(`${k}:A`, A, WHITE, 'A');
  p.point(`${k}:P`, P, COLORS.yellow, 'P');
  if (k === 'three' && Math.abs(between(d, sub(A, O)) - 90) < 0.6) {
    corner(p, `${k}:c1`, A, sub(O, A), d, WHITE);
    corner(p, `${k}:c2`, A, sub(P, A), d, WHITE);
  }
}

export default {
  view: '3d',
  view3d: { R: 4, zmax: 4, camera: CAMERA, axes: false },
  lab: false,

  setup(scene) {
    scene.ensureParam('phi', 30, { min: 0, max: 180, step: 1 }); // the direction of a line on the floor
    scene.ensureParam('psi', 60, { min: 0, max: 180, step: 1 }); // the line through A in the last steps

    scene.custom.push(
      {
        // The pole and a line of the floor through its foot, turning
        id: 'pole',
        draw3d(p, sc, s) {
          floor(p, 'pole:floor');
          pole(p, 'pole:OP');
          const d = flat(s.phi);
          p.segment('pole:l', mul(d, -3), mul(d, 3), COLORS.blue, { radius: 0.035 });
          corner(p, 'pole:c', O, [0, 0, 1], d, WHITE);
        },
        legend: () => '\\angle(\\yellow{OP},\\ \\blue{l}) = 90°',
      },
      {
        // A door on its hinge: its lower edge is a line of the floor through the foot of the hinge
        id: 'door',
        draw3d(p, sc, s) {
          floor(p, 'door:floor');
          pole(p, 'door:OP');
          const d = mul(flat(s.phi), 2);
          p.polygon('door:leaf', [O, d, add(d, [0, 0, 2.8]), [0, 0, 2.8]], COLORS.orange, { opacity: 0.25 });
          p.segment('door:ghost', O, mul(flat(0), 2), COLORS.blue, { radius: 0.03 });
          corner(p, 'door:c1', O, [0, 0, 1], flat(s.phi), WHITE);
          corner(p, 'door:c2', O, [0, 0, 1], flat(0), WHITE);
        },
      },
      {
        // The rope PA, its shadow OA and a line l of the floor through A
        id: 'three',
        draw3d: (p, sc, s) => rope(p, s, 'three'),
        legend: s => {
          const d = flat(s.psi);
          return `\\angle(\\green{l},\\ \\purple{OA}) = ${r0(between(d, A))}°,\\quad \\angle(\\green{l},\\ \\red{PA}) = ${r0(between(d, sub(P, A)))}°`;
        },
      },
      // The task: the same picture without the angles
      { id: 'ropeTask', draw3d: (p, sc, s) => rope(p, s, 'task') },
    );
  },

  steps: [
    {
      title: { en: 'A pole on the floor', ru: 'Столб на полу' },
      text: {
        en: 'A pole stands upright. Draw any line on the floor through its foot $O$: the pole makes a right angle with it — in every direction. That is what «a line perpendicular to a plane» means: <b>perpendicular to every line of the plane</b>. Lines of the floor that miss $O$ count too: slide them to $O$, the angle does not change.',
        ru: 'Столб стоит вертикально. Проведите на полу любую прямую через его основание $O$: столб образует с ней прямой угол — в любом направлении. Это и значит «прямая перпендикулярна плоскости»: <b>перпендикулярна каждой прямой плоскости</b>. Прямые пола, не проходящие через $O$, тоже считаются: сдвиньте их в $O$ — угол не изменится.',
      },
      try: { en: 'Turn the blue line with $\\varphi$.', ru: 'Поворачивайте синюю прямую ползунком $\\varphi$.' },
      state: { show: ['pole'], params: { phi: 30 }, camera: CAMERA, controls: ['phi'] },
    },
    {
      title: { en: 'Two lines are enough: a door', ru: 'Хватит двух прямых: дверь' },
      text: {
        en: 'Checking every line is impossible. The test: <b>if a line is perpendicular to two crossing lines of a plane, it is perpendicular to the plane</b>. A door shows why: the hinge is at right angles to the lower edge of the door in the closed position and in any other — and the lower edge sweeps every direction of the floor. A carpenter checks a post with a set square from two sides, not from all.',
        ru: 'Проверить все прямые невозможно. Признак: <b>если прямая перпендикулярна двум пересекающимся прямым плоскости, то она перпендикулярна плоскости</b>. Дверь показывает почему: петля перпендикулярна нижнему краю двери и в закрытом положении, и в любом другом — а нижний край заметает все направления пола. Плотник проверяет столб угольником с двух сторон, а не со всех.',
      },
      check: {
        q: { en: 'A post is at right angles to <b>one</b> line of the floor. Is it perpendicular to the floor?', ru: 'Столб перпендикулярен <b>одной</b> прямой пола. Перпендикулярен ли он полу?' },
        options: [{ text: { en: 'not necessarily', ru: 'не обязательно' }, ok: true }, { text: { en: 'yes', ru: 'да' } }],
        explain: {
          en: 'A post leaning forward is still at right angles to the line running left–right under it. One direction is not enough, two crossing ones are.',
          ru: 'Столб, наклонённый вперёд, всё ещё перпендикулярен прямой, идущей под ним слева направо. Одного направления мало, двух пересекающихся — достаточно.',
        },
      },
      state: { show: ['door'], params: { phi: 70 }, camera: CAMERA, controls: ['phi'] },
    },
    {
      title: { en: 'Three perpendiculars', ru: 'Три перпендикуляра' },
      text: {
        en: 'A rope $\\red{PA}$ goes from the top of the pole to the floor; under the noon sun its shadow is $\\purple{OA}$. Take a line $\\green{l}$ on the floor through $A$. <b>$l$ is perpendicular to the rope exactly when it is perpendicular to the shadow.</b> Why: if $l \\perp OA$, then $l$ is also perpendicular to the pole (a line of the floor), so to two crossing lines of the plane $OPA$ — so to the whole plane, and $PA$ lies in it.',
        ru: 'Верёвка $\\red{PA}$ идёт с верхушки столба на пол; под полуденным солнцем её тень — $\\purple{OA}$. Возьмём на полу прямую $\\green{l}$ через $A$. <b>$l$ перпендикулярна верёвке тогда и только тогда, когда перпендикулярна тени.</b> Почему: если $l \\perp OA$, то $l$ перпендикулярна и столбу (он перпендикулярен всему полу), то есть двум пересекающимся прямым плоскости $OPA$ — значит, всей этой плоскости, а $PA$ в ней лежит.',
      },
      try: { en: 'Turn $l$ with $\\psi$: the two angles reach $90°$ together.', ru: 'Поворачивайте $l$ ползунком $\\psi$: оба угла становятся $90°$ одновременно.' },
      state: { show: ['three'], params: { psi: 60 }, camera: [9, -6, 6], controls: ['psi'] },
    },
    {
      title: { en: 'Across the rope', ru: 'Поперёк верёвки' },
      text: {
        en: 'Turn the green line $l$ so that it is perpendicular to the rope $PA$.',
        ru: 'Поверните зелёную прямую $l$ так, чтобы она стала перпендикулярна верёвке $PA$.',
      },
      task: {
        kind: 'drag',
        target: { psi: 135 },
        tol: 0.6,
        back: 2,
        right: {
          en: '$l$ is perpendicular to the shadow $OA$ — and by the theorem of three perpendiculars to the rope itself.',
          ru: '$l$ перпендикулярна тени $OA$ — и по теореме о трёх перпендикулярах самой верёвке.',
        },
        mistakes: [
          { params: { psi: 45 }, text: { en: 'Now $l$ runs <b>along</b> the shadow, not across it.', ru: 'Сейчас $l$ идёт <b>вдоль</b> тени, а не поперёк.' } },
        ],
        hints: { psi: { en: 'Easier on the floor: make $l$ perpendicular to the purple shadow.', ru: 'На полу проще: сделайте $l$ перпендикулярной фиолетовой тени.' } },
      },
      state: { show: ['ropeTask'], params: { psi: 20 }, camera: [9, -6, 6], controls: ['psi'] },
    },
  ],
};
