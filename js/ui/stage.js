// Stage: the scene shown as 2D, 3D or both side by side. Views are created when needed and
// disposed when hidden (a WebGL context is expensive, especially on phones).

import { Plot2D } from '../views/plot2d.js';
import { Plot3D } from '../views/plot3d.js';
import { drawScene2D, drawScene3D } from '../views/draw.js';

export class Stage {
  constructor(container, scene, { mode = '2d', view2d = {}, view3d = {} } = {}) {
    this.scene = scene;
    this.view2d = view2d;
    this.view3d = view3d;
    this.el = document.createElement('div');
    this.el.className = 'stage-views';
    container.appendChild(this.el);
    this.p2 = null;
    this.p3 = null;
    this.off = scene.on(() => this.request());
    this.setMode(mode);
  }

  setMode(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    this.el.dataset.mode = mode;
    if (mode !== '2d' && !this.p3) this.p3 = new Plot3D(this.el, p => drawScene3D(p, this.scene), this.view3d);
    if (mode === '2d' && this.p3) { this.p3.dispose(); this.p3 = null; }
    if (mode !== '3d' && !this.p2) this.p2 = new Plot2D(this.el, p => drawScene2D(p, this.scene), this.view2d);
    if (mode === '3d' && this.p2) { this.p2.dispose(); this.p2 = null; }
    this.request();
  }

  request() {
    if (this.p2) this.p2.request();
    if (this.p3) this.p3.request();
  }

  reset() {
    if (this.p2) this.p2.reset();
    if (this.p3 && this.view3d.camera) this.p3.setCamera(this.view3d.camera);
  }

  dispose() {
    this.off();
    if (this.p2) this.p2.dispose();
    if (this.p3) this.p3.dispose();
    this.el.remove();
  }
}
