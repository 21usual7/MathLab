import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Run the actual page entry points with controllable import completion and no browser.
// Any stale DOM write or scene allocation fails immediately.
for (const page of ['topic', 'world']) {
  test(`${page}: cancelled import cannot overwrite the current page`, async () => {
    const cap = page[0].toUpperCase() + page.slice(1);
    let resolve;
    const loaded = new Promise(r => { resolve = r; });
    const context = vm.createContext({
      [`${page}Meta`]: () => ({ status: 'ready' }),
      [`load${cap}`]: () => loaded,
    });
    const source = readFileSync(new URL(`../js/pages/${page}.js`, import.meta.url), 'utf8')
      .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
    vm.runInContext(`${source}\nglobalThis.mount = mount${cap};`, context);
    const controller = new AbortController();
    const root = new Proxy({}, { set() { assert.fail('stale page wrote to DOM'); } });
    const pending = context.mount(root, 'example', 0, { signal: controller.signal });
    controller.abort();
    resolve({ setup() { assert.fail('stale page created a scene'); } });
    const cleanup = await pending;
    assert.equal(typeof cleanup, 'function');
    cleanup();
  });
}
