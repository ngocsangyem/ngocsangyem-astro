/* Generative geometry for the luỹ tre ambient ornament.
 *
 * A luỹ tre is the dense bamboo hedge planted at the edge of a Vietnamese
 * village: a picket of near-parallel culms, ringed with nodes, bowing over at
 * the top under the weight of their own leaves. Three things carry that read
 * and none of them are optional — verticality in numbers, the node rings, and
 * the arch. A single stalk is not a luỹ tre.
 *
 * Everything here is pure and seeded, so the same seed yields the same grove on
 * every build. The SVG is emitted at build time and ships as markup: no client
 * script, no layout shift, no hydration.
 *
 * Canonical space: x = 0 is the OUTER page edge and the grove leans toward +x,
 * i.e. in over the reader. The right-hand grove renders the same geometry
 * through a horizontal flip, so only one generator exists.
 */

/** Back plane sits furthest out and carries no detail; front plane carries all of it. */
export type Plane = 0 | 1 | 2;

export interface Fan {
  /** One subpath per leaf, so a whole fan is a single DOM node. */
  d: string;
  /** Position along the parent culm, 0 at the base and 1 at the tip. */
  s: number;
  /** When this fan fades in — as the growth front reaches its node. */
  delay: number;
}

export interface Culm {
  /** Centreline, authored base → tip so a dash offset draws it upward. */
  d: string;
  /** Node rings as one path, one subpath each. Empty on the back plane. */
  nodes: string;
  fans: Fan[];
  plane: Plane;
  /** Sway pivot, in viewBox units — the culm's base. */
  originX: number;
  originY: number;
  /** Sway amplitude in degrees. Kept sub-degree; see DESIGN.md motion stance. */
  amp: number;
  /** Sway period in seconds. */
  period: number;
  drawDelay: number;
  drawDur: number;
  /** Sway begins as the draw ends, so a culm never bends before it exists. */
  swayDelay: number;
  /** Leaf lag period — shorter than the culm's, so the leaves trail it. */
  lagPeriod: number;
  nodeDelay: number;
  nodeDur: number;
}

export interface Grove {
  width: number;
  height: number;
  culms: Culm[];
  /** When the last culm finishes drawing, so the sway can start after it. */
  settleAt: number;
}

export interface GroveOptions {
  seed: number;
  /** Culm count per plane, back to front. */
  density?: [number, number, number];
  width?: number;
  height?: number;
}

const WIDTH = 260;
const HEIGHT = 900;

interface PlaneSpec {
  /** Height as a fraction of the viewBox, min and max. */
  height: [number, number];
  stroke: number;
  /** How far out from the page edge this plane's culms cluster. */
  spread: [number, number];
  nodes: boolean;
  fans: number;
  /** Sway amplitude multiplier — distant culms read as moving less. */
  swayScale: number;
}

const PLANES: Record<Plane, PlaneSpec> = {
  0: { height: [0.42, 0.7], stroke: 0.9, spread: [0.0, 0.62], nodes: false, fans: 0, swayScale: 0.65 },
  1: { height: [0.6, 0.88], stroke: 1.2, spread: [0.05, 0.82], nodes: true, fans: 3, swayScale: 0.85 },
  2: { height: [0.76, 1.06], stroke: 1.55, spread: [0.1, 1.0], nodes: true, fans: 4, swayScale: 1 },
};

/** mulberry32 — small, fast, and good enough for ornament placement. */
function makeRandom(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/* Precision is a payload decision. The grove is inlined into every page it
   appears on, so every surplus decimal is shipped thousands of times. The
   viewBox renders at roughly 1:1, which makes a whole unit sub-pixel: culms and
   node rings round to integers with no visible cost. Leaves are only a couple
   of units wide, so those keep a decimal. */

/** Integer, for culm centrelines and node rings. */
function r0(value: number): number {
  return Math.round(value);
}

/** One decimal, for leaf geometry, which is too small to round flat. */
function r1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Two decimals, for timings and sway amplitude. Rounding here also keeps
 *  binary-float tails like 0.45299999999999996 out of the markup. */
function r2(value: number): number {
  return Math.round(value * 100) / 100;
}

interface Point {
  x: number;
  y: number;
}

/** A culm's centreline, as the deflection curve of a tapering cantilever.
 *
 *  The exponent is what makes this bamboo rather than grass. At 2.4 the bend
 *  spreads down the whole culm and the thing sweeps like a reed; at 3.4 nearly
 *  all of it lands in the top third, so the culm stands plumb and then bows.
 *  That standing-then-bowing silhouette is the whole read — a luỹ tre is a
 *  picket, not a fountain. */
function centreline(
  baseX: number,
  baseY: number,
  height: number,
  bend: number,
  arch: number,
): (s: number) => Point {
  return (s) => ({
    x: baseX + bend * Math.pow(s, 3.4),
    y: baseY - height * (s - arch * Math.pow(s, 5)),
  });
}

/** Forward unit tangent, by central difference — cheaper than differentiating
 *  the curve by hand and accurate enough at this scale. */
function tangentAt(curve: (s: number) => Point, s: number): Point {
  const h = 0.004;
  const a = curve(Math.max(0, s - h));
  const b = curve(Math.min(1, s + h));
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/** Catmull-Rom through the samples, converted to cubics. Nine samples of a
 *  smooth analytic curve beat forty line segments on both bytes and looks. */
function smoothPath(points: Point[]): string {
  const first = points[0];
  let d = `M${r0(first.x)} ${r0(first.y)}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d += `C${r0(c1x)} ${r0(c1y)} ${r0(c2x)} ${r0(c2y)} ${r0(p2.x)} ${r0(p2.y)}`;
  }

  return d;
}

/** Node ring: a short tick across the culm, bowing toward the base the way a
 *  ring on a cylinder does. Ticks run a few multiples of the stroke wide — the
 *  same notation the hand-drawn mark uses, not a literal diameter. */
function nodeRing(curve: (s: number) => Point, s: number, half: number): string {
  const p = curve(s);
  const t = tangentAt(curve, s);
  // Normal, i.e. across the culm.
  const nx = -t.y;
  const ny = t.x;

  const ax = p.x - nx * half;
  const ay = p.y - ny * half;
  const bx = p.x + nx * half;
  const by = p.y + ny * half;
  // Control point sits down-culm, so the ring reads as bowed, not straight.
  const cx = p.x - t.x * half * 0.55;
  const cy = p.y - t.y * half * 0.55;

  return `M${r0(ax)} ${r0(ay)}Q${r0(cx)} ${r0(cy)} ${r0(bx)} ${r0(by)}`;
}

/** One lanceolate leaf: long, narrow, pointed at both ends, and asymmetric so a
 *  fan never reads as a repeated stamp. Rounded almonds read as plum, not
 *  bamboo, so the width stays well under a sixth of the length. */
function leaf(from: Point, dir: Point, length: number, width: number): string {
  const tipX = from.x + dir.x * length;
  const tipY = from.y + dir.y * length;
  const px = -dir.y;
  const py = dir.x;

  const pt = (along: number, across: number) => ({
    x: from.x + dir.x * length * along + px * width * across,
    y: from.y + dir.y * length * along + py * width * across,
  });

  // Quadratics, not cubics: a leaf a couple of units wide is indistinguishable
  // either way, and this is a third fewer numbers on the hundreds of leaves the
  // grove ships. Offsetting the two controls unequally keeps the blade
  // asymmetric, so a fan never reads as one stamp repeated.
  const c1 = pt(0.42, 1.15);
  const c2 = pt(0.42, -0.85);

  return (
    `M${r1(from.x)} ${r1(from.y)}` +
    `Q${r1(c1.x)} ${r1(c1.y)} ${r1(tipX)} ${r1(tipY)}` +
    `Q${r1(c2.x)} ${r1(c2.y)} ${r1(from.x)} ${r1(from.y)}Z`
  );
}

/** Where the node rings sit. Internodes lengthen up the culm, which is the
 *  cheapest cue that the thing has grown rather than been drawn. There have to
 *  be enough of them to register as bamboo: a culm with four rings reads as a
 *  stick, one with a dozen reads as the plant. */
function nodePositions(random: () => number): number[] {
  const positions: number[] = [];
  let s = 0.06 + random() * 0.03;
  let step = 0.066;

  while (s < 0.94) {
    positions.push(s);
    s += step;
    step += 0.009;
  }

  return positions;
}

function buildFan(
  curve: (s: number) => Point,
  s: number,
  random: () => number,
  delay: number,
): Fan {
  const attach = curve(s);
  const leaves: string[] = [];
  const count = 2 + Math.floor(random() * 3);

  for (let i = 0; i < count; i += 1) {
    // Leaves spring out either side of the culm and hang. Measured off
    // horizontal, positive pointing down the screen — bamboo leaves droop, so
    // the range is weighted below the horizon rather than centred on it.
    const side = random() < 0.5 ? -1 : 1;
    const angle = (2 + random() * 62) * (Math.PI / 180);
    const dir = { x: side * Math.cos(angle), y: Math.sin(angle) };
    // Small relative to the culm. Oversized leaves are what turned the first
    // pass into feather dusters.
    const length = 13 + random() * 13;
    const width = 2.1 + random() * 1.5;

    leaves.push(leaf(attach, dir, length, width));
  }

  return { d: leaves.join(''), s: r2(s), delay: r2(delay) };
}

/** Build one grove in canonical space. Deterministic in `seed`. */
export function generateGrove(options: GroveOptions): Grove {
  const { seed, density = [7, 5, 3], width = WIDTH, height = HEIGHT } = options;
  const random = makeRandom(seed);
  const culms: Culm[] = [];
  let settleAt = 0;

  ([0, 1, 2] as Plane[]).forEach((plane) => {
    const spec = PLANES[plane];

    for (let i = 0; i < density[plane]; i += 1) {
      // Biased toward the outer edge, so the hedge is dense at the page margin
      // and thins as it approaches the reading column.
      const across = Math.pow(random(), 1.35);
      const baseX = width * (spec.spread[0] + across * (spec.spread[1] - spec.spread[0]));
      // The base sits just off-frame; a visible foot would read as a potted plant.
      const baseY = height + 24;

      const culmHeight = height * (spec.height[0] + random() * (spec.height[1] - spec.height[0]));
      // Kept small on purpose. Paired with the cubic-plus exponent above, this
      // is a culm that leans in at the tip, not one that arcs over the page.
      const bend = culmHeight * (0.05 + random() * 0.11);
      const arch = 0.04 + random() * 0.09;
      const curve = centreline(baseX, baseY, culmHeight, bend, arch);

      // Seven segments is enough for a curve this gentle, and a third cheaper
      // in path bytes than the ten the first pass emitted.
      const samples: Point[] = [];
      const steps = 7;
      for (let k = 0; k <= steps; k += 1) {
        samples.push(curve(k / steps));
      }

      const positions = spec.nodes ? nodePositions(random) : [];
      // Ticks a few multiples of the stroke wide — the notation the hand-drawn
      // mark already uses, rather than a literal culm diameter.
      const half = spec.stroke * 3.2;
      const nodes = positions
        .map((s) => nodeRing(curve, s, half * (1 - 0.35 * s)))
        .join('');

      const drawDur = 1.8 + (culmHeight / height) * 1.6;
      const drawDelay = plane * 0.85 + i * 0.22 + random() * 0.4;
      const period = r2(13 + random() * 9);

      // Fans hang off the topmost nodes, where a real culm carries its leaves,
      // and each lights up as the growth front reaches its node.
      const fanAnchors = positions.filter((s) => s > 0.55).slice(-spec.fans);
      const fans = fanAnchors.map((s) => buildFan(curve, s, random, drawDelay + s * drawDur));

      settleAt = Math.max(settleAt, drawDelay + drawDur);

      culms.push({
        d: smoothPath(samples),
        nodes,
        fans,
        plane,
        originX: r0(baseX),
        originY: r0(baseY),
        amp: r2((0.2 + (culmHeight / height) * 0.42 + random() * 0.14) * spec.swayScale),
        period,
        drawDelay: r2(drawDelay),
        drawDur: r2(drawDur),
        swayDelay: r2(drawDelay + drawDur),
        lagPeriod: r2(period * 0.72),
        nodeDelay: r2(drawDelay + drawDur * 0.45),
        nodeDur: r2(drawDur * 0.6),
      });
    }
  });

  return { width, height, culms, settleAt: r2(settleAt) };
}

/** Stroke width for a plane, exposed so the renderer stays free of magic numbers. */
export function planeStroke(plane: Plane): number {
  return PLANES[plane].stroke;
}
