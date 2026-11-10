// Smooth motion: every change of the scene that the user did not make by hand is animated

export const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Runs onFrame(k) with k going 0 → 1 over ms milliseconds. Returns a function that stops it.
export function tween(ms, onFrame, onDone, ease = easeInOut) {
  let start = null, stopped = false;
  function step(now) {
    if (stopped) return;
    if (start === null) start = now;
    const k = ms <= 0 ? 1 : Math.min(1, (now - start) / ms);
    onFrame(ease(k));
    if (k < 1) requestAnimationFrame(step);
    else if (onDone) onDone();
  }
  requestAnimationFrame(step);
  return () => { stopped = true; };
}

export const lerp = (a, b, k) => a + (b - a) * k;
