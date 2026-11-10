// One palette for graphs, formulas and the interface (3Blue1Brown-like colors on a dark background).
// The same name means the same color everywhere: \blue{f} in a formula is the blue curve on the plot.

export const COLORS = {
  blue: '#58c4dd',
  yellow: '#f4d35e',
  green: '#83c167',
  red: '#fc6255',
  purple: '#b69df8',
  teal: '#5cd0b3',
  orange: '#ff9f5a',
  pink: '#f48fb1',
  grey: '#8b95a7',
};

// Order in which new objects get their colors
export const CYCLE = ['blue', 'yellow', 'green', 'red', 'purple', 'teal', 'orange', 'pink'];

// Plot chrome (canvas cannot read CSS variables cheaply on every frame)
export const THEME = {
  bg: '#0d1117',
  grid: 'rgba(255, 255, 255, 0.05)',
  gridMajor: 'rgba(255, 255, 255, 0.09)',
  axis: 'rgba(255, 255, 255, 0.38)',
  label: '#6f7a8c',
  text: '#e6e9ef',
};

// KaTeX macros: \blue{...}, \yellow{...} ...
// The color is written without "#": inside a macro "#5…" would mean "argument 5"
export const TEX_MACROS = Object.fromEntries(
  Object.entries(COLORS).map(([name, hex]) => [`\\${name}`, `\\textcolor{${hex.slice(1)}}{#1}`])
);

export const color = name => COLORS[name] || name;
