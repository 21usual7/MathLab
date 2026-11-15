// Pinned CPython/WASM. This worker is disposable: stop and deadlines use terminate(),
// including infinite loops; no SharedArrayBuffer or hosting headers are required.
const BASE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let python;
self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'init') {
      importScripts(`${BASE}pyodide.js`);
      python = await loadPyodide({ indexURL: BASE, stdin: () => null });
      self.postMessage({ type: 'ready' }); return;
    }
    let stdout = '';
    const append = line => { if (stdout.length < 4000) stdout += `${line}\n`.slice(0, 4000 - stdout.length); };
    python.setStdout({ batched: append }); python.setStderr({ batched: append });
    python.globals.set('_payload_json', JSON.stringify(data));
    const response = python.runPython(`
import json, traceback, copy
_payload = json.loads(_payload_json)
_scope = {"__name__": "__main__"}
_results = []
try:
    exec(compile(_payload["code"], "student.py", "exec"), _scope)
    _fn = _scope.get(_payload["functionName"])
    if not callable(_fn):
        raise NameError("Define function: " + _payload["functionName"])
    for _args in _payload["cases"]:
        try:
            _value = _fn(*copy.deepcopy(_args))
            _encoded = json.dumps(_value, allow_nan=False)
            if len(_encoded) > 20000:
                raise ValueError("Result too large for a teaching example (20000 characters)")
            _results.append({"value": json.loads(_encoded)})
        except BaseException:
            _results.append({"error": traceback.format_exc(limit=4)})
    _response = {"results": _results}
except BaseException:
    _response = {"error": traceback.format_exc(limit=5)}
json.dumps(_response)
`);
    self.postMessage({ type: 'result', ...JSON.parse(response), stdout });
  } catch (error) { self.postMessage({ type: 'error', error: String(error) }); }
};
