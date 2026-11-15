import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('3D view renders its first frame, sleeps when idle and coalesces redraws', () => {
  const frames = new Map();
  let id = 0, builds = 0, renders = 0;
  const vector = () => ({ set() {}, toArray: () => [7, -9, 6] });
  const element = () => ({ appendChild() {}, addEventListener() {}, clientWidth: 0, clientHeight: 0 });
  const context = vm.createContext({
    document: { createElement: element }, window: { devicePixelRatio: 1 },
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; },
    ResizeObserver: class { observe() {} },
    THEME: { bg: '#000' },
    THREE: {
      Color: class {},
      WebGLRenderer: class {
        domElement = element();
        setPixelRatio() {} setClearColor() {}
        render() { renders++; }
      },
      PerspectiveCamera: class { up = vector(); position = vector(); },
      Scene: class { add() {} remove() {} },
      AmbientLight: class {},
      DirectionalLight: class { position = vector(); },
      Plane: class {}, Vector3: class {}, Raycaster: class {},
    },
    OrbitControls: class { update() { return false; } addEventListener() {} },
    CSS2DRenderer: class { domElement = element(); render() {} },
  });
  const source = readFileSync(new URL('../js/views/plot3d.js', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export class Plot3D', 'class Plot3D');
  vm.runInContext(`${source}\nglobalThis.Plot3D = Plot3D;`, context);
  const plot = new context.Plot3D(element(), () => { builds++; }, { axes: false });
  const frame = () => {
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(fn => fn(0));
  };
  assert.equal(frames.size, 1, 'constructor must schedule the first frame');
  frame();
  assert.equal(builds, 1);
  assert.equal(renders, 1);
  assert.equal(frames.size, 0, 'idle view should not keep rendering');
  plot.request(); plot.request();
  assert.equal(frames.size, 1);
  frame();
  assert.equal(builds, 2);
  assert.equal(renders, 2);
});
