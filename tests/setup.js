// The engine expects math.js as a global (in the browser it is loaded from a CDN)
import * as math from 'mathjs';
globalThis.math = math;
