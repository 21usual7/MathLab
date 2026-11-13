// 3D view (three.js). Coordinates: x and y on the floor, z up; the box is [-R, R]² × [-zmax, zmax].
// Like the 2D view it is drawn in "immediate mode": onDraw(plot) calls surface / tube / sphere / plane
// with a key; objects are cached by key and objects not drawn this time are removed.
// The scene renders only when something changed or the camera moves.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { THEME } from '../core/palette.js';
import { tween, lerp } from '../core/anim.js';
import { facesOf, frontFaces } from '../core/geom.js';

const WHITE = new THREE.Color('#ffffff');

// Solid geometry is drawn as in a school book: edges you can see are solid, edges behind the solid are
// dashed, and this is recomputed as the camera turns (objects may have onCamera(eye)).

export class Plot3D {
  constructor(container, onDraw, { R = 4, zmax = 4, camera = [7, -9, 6], axes = true } = {}) {
    this.onDraw = onDraw;
    this.R = R;
    this.zmax = zmax;

    this.el = document.createElement('div');
    this.el.className = 'plot3d';
    container.appendChild(this.el);

    const renderer = this.renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(THEME.bg);
    renderer.localClippingEnabled = true;
    this.el.appendChild(renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.className = 'plot3d-labels';
    this.el.appendChild(this.labelRenderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(...camera);

    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 60;
    this.controls.autoRotateSpeed = 0.6;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.25);
    key.position.set(6, -7, 12);
    const rim = new THREE.DirectionalLight(0x8fb4ff, 0.45);
    rim.position.set(-8, 6, -4);
    this.scene.add(key, rim);

    // Keep surfaces inside the box: cut above zmax and below -zmax
    this.clip = [new THREE.Plane(new THREE.Vector3(0, 0, -1), zmax), new THREE.Plane(new THREE.Vector3(0, 0, 1), zmax)];

    if (axes) this.buildAxes();
    this.objs = new Map();
    this.handles = [];
    this.bindHandles();
    this.needBuild = true;
    this.dirty = true;

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.el);
    this.resize();

    const tick = () => {
      this.raf = requestAnimationFrame(tick);
      if (this.needBuild) this.build();
      const moved = this.controls.update();
      if (moved || this.dirty) {
        this.dirty = false;
        const eye = this.camera.position.toArray();
        for (const o of this.objs.values()) if (o.onCamera) o.onCamera(eye);
        renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
      }
    };
    tick();
  }

  request() { this.needBuild = true; }

  resize() {
    const w = this.el.clientWidth, h = this.el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.labelRenderer.setSize(w, h);
    this.camera.aspect = w / h;
    // Narrow view: widen the vertical angle so the horizontal one stays the same and nothing is cropped
    const FOV = 38, WIDE = 1.25;
    this.camera.fov = this.camera.aspect >= WIDE ? FOV : 2 * Math.atan(Math.tan(FOV * Math.PI / 360) * WIDE / this.camera.aspect) * 180 / Math.PI;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
  }

  build() {
    this.needBuild = false;
    this.seen = new Set();
    this.handles = [];
    this.onDraw(this);
    for (const [key, o] of this.objs) {
      if (!this.seen.has(key)) { this.disposeObj(o.group); this.scene.remove(o.group); this.objs.delete(key); }
    }
    this.dirty = true;
  }

  // Text label in HTML over the 3D view; "A1" is written A₁
  label(text, pos, cls = 'axis-label') {
    const div = document.createElement('div');
    div.className = cls;
    div.innerHTML = String(text).replace(/^([A-Z])(\d+)$/, '$1<sub>$2</sub>');
    const obj = new CSS2DObject(div);
    obj.position.set(...pos);
    return obj;
  }

  buildAxes() {
    const R = this.R, Z = this.zmax, group = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0x5c6678 });
    const axis = (a, b) => new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]), mat);
    group.add(axis([-R, 0, 0], [R, 0, 0]), axis([0, -R, 0], [0, R, 0]), axis([0, 0, -Z], [0, 0, Z]));

    const coneGeo = new THREE.ConeGeometry(0.06, 0.22, 16);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0x8b95a7 });
    const cone = (pos, rot) => { const m = new THREE.Mesh(coneGeo, coneMat); m.position.set(...pos); m.rotation.set(...rot); return m; };
    group.add(cone([R, 0, 0], [0, 0, -Math.PI / 2]), cone([0, R, 0], [0, 0, 0]), cone([0, 0, Z], [Math.PI / 2, 0, 0]));

    group.add(this.label('x', [R + 0.4, 0, 0]), this.label('y', [0, R + 0.4, 0]), this.label('z', [0, 0, Z + 0.4]));
    const step = R > 5 ? 2 : 1;
    for (let v = -R; v <= R; v += step) {
      if (v === 0) continue;
      group.add(this.label(String(v), [v, -0.3, 0], 'tick-label'), this.label(String(v), [-0.3, v, 0], 'tick-label'));
    }
    for (let v = -Z; v <= Z; v += step) if (v !== 0) group.add(this.label(String(v), [-0.3, -0.3, v], 'tick-label'));

    // Floor grid on z = 0
    const grid = new THREE.GridHelper(2 * R, 2 * R, 0x3a4352, 0x252c38);
    grid.rotation.x = Math.PI / 2;
    grid.material.transparent = true;
    grid.material.opacity = 0.7;
    group.add(grid);
    this.scene.add(group);
  }

  entry(key, create) {
    this.seen.add(key);
    let o = this.objs.get(key);
    if (!o) {
      o = create();
      this.objs.set(key, o);
      this.scene.add(o.group);
    }
    return o;
  }

  // ---------- Primitives ----------

  // z = f(x, y) on [-R, R]²; colored by height, with a light grid on top
  surface(key, f, color, n = 72) {
    const R = this.R, Z = this.zmax, N = n;
    const o = this.entry(key, () => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((N + 1) ** 2 * 3), 3));
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array((N + 1) ** 2 * 3), 3));
      const index = [];
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
          index.push(a, b, d, a, d, c);
        }
      }
      geo.setIndex(index);
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        vertexColors: true, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.05,
        clippingPlanes: this.clip, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
      }));
      // Grid lines every few samples, along x and along y
      const every = N / 12, lines = [];
      for (let j = 0; j <= N; j += every) for (let i = 0; i < N; i++) lines.push(j * (N + 1) + i, j * (N + 1) + i + 1);
      for (let i = 0; i <= N; i += every) for (let j = 0; j < N; j++) lines.push(j * (N + 1) + i, (j + 1) * (N + 1) + i);
      const wireGeo = new THREE.BufferGeometry();
      wireGeo.setAttribute('position', geo.getAttribute('position'));
      wireGeo.setIndex(lines);
      const wire = new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0.16, clippingPlanes: this.clip,
      }));
      const group = new THREE.Group();
      group.add(mesh, wire);
      return { group, mesh };
    });

    const geo = o.mesh.geometry;
    const pos = geo.getAttribute('position'), col = geo.getAttribute('color');
    const base = new THREE.Color(color);
    const low = base.clone().multiplyScalar(0.28), high = base.clone().lerp(WHITE, 0.3), c = new THREE.Color();
    for (let j = 0, k = 0; j <= N; j++) {
      for (let i = 0; i <= N; i++, k++) {
        const x = -R + 2 * R * i / N, y = -R + 2 * R * j / N;
        let z = f(x, y);
        // Undefined or far away: push outside the box, the clipping planes hide it
        if (!isFinite(z)) z = 3 * Z;
        z = Math.max(-3 * Z, Math.min(3 * Z, z));
        pos.setXYZ(k, x, y, z);
        c.copy(low).lerp(high, Math.max(0, Math.min(1, (z + Z) / (2 * Z))));
        col.setXYZ(k, c.r, c.g, c.b);
      }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  }

  // Thick curve through points [[x, y, z], ...]; breaks where points are undefined or leave the box
  tube(key, pts, color, radius = 0.045) {
    const o = this.entry(key, () => ({ group: new THREE.Group() }));
    this.disposeObj(o.group);
    o.group.clear();
    const mat = new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.35), roughness: 0.4, clippingPlanes: this.clip });
    const limit = 2 * Math.max(this.R, this.zmax);
    let seg = [];
    const flush = () => {
      if (seg.length >= 2) {
        const curve = new THREE.CatmullRomCurve3(seg);
        o.group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(400, seg.length * 2), radius, 8, false), mat));
      }
      seg = [];
    };
    for (const [x, y, z] of pts) {
      if ([x, y, z].every(v => isFinite(v) && Math.abs(v) < limit)) seg.push(new THREE.Vector3(x, y, z));
      else flush();
    }
    flush();
  }

  sphere(key, [x, y, z], color, r = 0.09) {
    const o = this.entry(key, () => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshStandardMaterial({ color, roughness: 0.3 }));
      const group = new THREE.Group();
      group.add(mesh);
      return { group, mesh };
    });
    const ok = [x, y, z].every(isFinite);
    o.group.visible = ok;
    if (!ok) return;
    o.mesh.position.set(x, y, z);
    o.mesh.scale.setScalar(r);
    o.mesh.material.color.set(color);
  }

  // Vertical plane x = value or y = value, translucent, with an outline
  plane(key, axis, value, color, opacity = 0.14) {
    const R = this.R, Z = this.zmax;
    const o = this.entry(key, () => {
      const geo = new THREE.PlaneGeometry(2 * R, 2 * Z);
      if (axis === 'y') geo.rotateX(Math.PI / 2);
      else { geo.rotateX(Math.PI / 2); geo.rotateZ(Math.PI / 2); }
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 }));
      const group = new THREE.Group();
      group.add(mesh, edges);
      return { group };
    });
    o.group.position.set(axis === 'x' ? value : 0, axis === 'y' ? value : 0, 0);
  }

  // ---------- Solid geometry ----------

  // Segment that is solid where seen and dashed where hidden. With `poly` its visibility follows the faces
  // it lies on (inside the solid: always dashed); `hidden: true` makes it always dashed.
  segment(key, a, b, color, { poly = null, hidden = false, radius = 0.028 } = {}) {
    const o = this.entry(key, () => ({ group: new THREE.Group() }));
    this.disposeObj(o.group);
    o.group.clear();
    const solid = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(...a), new THREE.Vector3(...b)), 1, radius, 8, false),
      new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.35), roughness: 0.45 }));
    const dashed = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]),
      new THREE.LineDashedMaterial({ color, dashSize: 0.14, gapSize: 0.1, transparent: true, opacity: 0.75 }));
    dashed.computeLineDistances();
    o.group.add(solid, dashed);
    const faces = poly ? facesOf(poly, a).filter(i => facesOf(poly, b).includes(i)) : [];
    o.onCamera = eye => {
      const front = poly ? frontFaces(poly, eye) : [];
      const seen = !hidden && (!poly || faces.some(i => front[i]));
      solid.visible = seen;
      dashed.visible = !seen;
    };
    o.onCamera(this.camera.position.toArray());
  }

  // Convex polyhedron (from geom.js): faint faces, edges solid or dashed, vertex labels A, B, A₁ …
  polyhedron(key, poly, color, { fill = 0.06, labels = true } = {}) {
    const o = this.entry(key, () => ({ group: new THREE.Group() }));
    this.disposeObj(o.group);
    o.group.clear();
    const V = poly.V;
    const pos = [];
    for (const f of poly.faces) for (let k = 1; k + 1 < f.pts.length; k++) pos.push(...f.pts[0], ...f.pts[k], ...f.pts[k + 1]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    o.group.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: fill, side: THREE.DoubleSide, depthWrite: false })));
    if (labels) {
      for (const [name, p] of Object.entries(V)) {
        const out = new THREE.Vector3(...p).sub(new THREE.Vector3(...poly.center)).normalize().multiplyScalar(0.32);
        o.group.add(this.label(name, [p[0] + out.x, p[1] + out.y, p[2] + out.z], 'vertex-label'));
      }
    }
    poly.edges.forEach(e => {
      const sub = `${key}:${e.a}${e.b}`;
      this.segment(sub, V[e.a], V[e.b], color, { poly });
    });
  }

  // Filled flat polygon (a section), its sides drawn as segments on the faces of `poly`
  polygon(key, pts, color, { opacity = 0.35, poly = null, outline = true } = {}) {
    const o = this.entry(key, () => ({ group: new THREE.Group() }));
    this.disposeObj(o.group);
    o.group.clear();
    if (pts.length >= 3) {
      const pos = [];
      for (let k = 1; k + 1 < pts.length; k++) pos.push(...pts[0], ...pts[k], ...pts[k + 1]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
      mesh.renderOrder = 1;
      o.group.add(mesh);
    }
    if (outline) pts.forEach((p, i) => this.segment(`${key}:${i}`, p, pts[(i + 1) % pts.length], color, { poly, radius: 0.034 }));
  }

  // A named point: a small ball and its label
  point(key, p, color, name = null, r = 0.075) {
    this.sphere(key, p, color, r);
    if (!name) return;
    const o = this.entry(`${key}:label`, () => {
      const group = new THREE.Group();
      const l = this.label('', [0, 0, 0], 'vertex-label');
      group.add(l);
      return { group, l };
    });
    o.l.element.innerHTML = name;
    o.l.element.style.color = color;
    o.l.position.set(p[0], p[1], p[2] + 0.28);
  }

  // A point the user drags along the segment a–b (an edge, a diagonal); onDrag(t) gets its new place, 0 at a, 1 at b
  handle(key, a, b, t, color, onDrag, name = null) {
    const p = [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t);
    this.point(key, p, color, name, 0.12);
    this.handles.push({ key, a, b, p, onDrag });
  }

  // Dragging handles. The pointer is taken before the camera controls see it (capture on the parent), so the
  // view does not turn while a point is dragged. The new place is the point of the segment's line closest to
  // the ray under the pointer: exact at any angle of view.
  bindHandles() {
    const canvas = this.renderer.domElement, ray = new THREE.Raycaster();
    const at = e => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * 2 - 1, y: 1 - (e.clientY - r.top) / r.height * 2, r };
    };
    const near = e => {
      const { x, y, r } = at(e);
      let best = null, bestD = 20;
      for (const h of this.handles) {
        const v = new THREE.Vector3(...h.p).project(this.camera);
        const d = Math.hypot((v.x - x) * r.width / 2, (v.y - y) * r.height / 2);
        if (d < bestD) { bestD = d; best = h; }
      }
      return best;
    };
    let drag = null;
    this.el.addEventListener('pointerdown', e => {
      const h = near(e);
      if (!h) return;
      e.stopPropagation();
      e.preventDefault();
      drag = h.key;
      this.el.setPointerCapture(e.pointerId);
    }, true);
    this.el.addEventListener('pointermove', e => {
      if (!drag) { canvas.style.cursor = near(e) ? 'grab' : ''; return; }
      const h = this.handles.find(q => q.key === drag);
      if (!h) return;
      const { x, y } = at(e);
      ray.setFromCamera(new THREE.Vector2(x, y), this.camera);
      const P = new THREE.Vector3(...h.a), u = new THREE.Vector3(...h.b).sub(P), d = ray.ray.direction;
      const w = P.clone().sub(ray.ray.origin);
      const A = u.dot(u), B = u.dot(d), C = d.dot(d), D = u.dot(w), E = d.dot(w), den = A * C - B * B;
      if (den < 1e-9) return; // the segment points straight at the eye
      h.onDrag(Math.max(0, Math.min(1, (B * E - C * D) / den)));
    });
    const up = () => { drag = null; };
    this.el.addEventListener('pointerup', up);
    this.el.addEventListener('pointercancel', up);
  }

  // ---------- Camera ----------

  setCamera(pos, ms = 1200) {
    if (this.stopTween) this.stopTween();
    const from = this.camera.position.clone(), to = new THREE.Vector3(...pos);
    this.stopTween = tween(ms, k => {
      this.camera.position.set(lerp(from.x, to.x, k), lerp(from.y, to.y, k), lerp(from.z, to.z, k));
      this.dirty = true;
    });
  }

  autoRotate(on) { this.controls.autoRotate = on; }

  disposeObj(group) {
    group.traverse(m => {
      if (m.geometry) m.geometry.dispose();
      if (m.material) m.material.dispose();
      // An HTML label is not removed with its parent group: take it out of the page
      if (m.isCSS2DObject) m.element.remove();
    });
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    if (this.stopTween) this.stopTween();
    this.ro.disconnect();
    this.controls.dispose();
    this.disposeObj(this.scene);
    this.renderer.dispose();
    this.el.remove();
  }
}
