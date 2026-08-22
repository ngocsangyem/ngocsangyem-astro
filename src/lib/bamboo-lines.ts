/* Procedural line-art bamboo for the ambient layer behind the page.
 *
 * The grove is drawn as a pen sketch, not an illustration: every mark is a
 * stroked polyline of uniform weight, and nothing is filled. Two planes carry
 * the depth —
 *
 *   - `ink`  · crisp tubes. A culm is its two outlines plus a collar at each
 *              node, so the joint is drawn rather than implied, and the leaves
 *              are outlined lanceolate blades with a midrib.
 *   - `haze` · the same geometry restated as wide soft strokes, meant to be
 *              painted onto a CSS-blurred canvas behind the ink. Out-of-focus
 *              culms and leaf masses, no contour detail.
 *
 * Everything here is pure and seeded: the same seed and canvas size yield the
 * same grove, so the artwork never surprises a returning reader. The module
 * knows nothing about the DOM — it produces stroke geometry with timing baked
 * in, and drawPlane() paints any moment of the growth onto a 2D context.
 *
 * Growth is the page-load moment and nothing more. A culm rises out of its own
 * foot as a partial trace of its outlines — real elongation, not a scale
 * transform — and each leaf cluster unfurls just after the tip clears its node.
 * Timing lives on the geometry as fractions of the settle budget: a stalk draws
 * from `delay` to `delay + dur` of the global timeline, and a stroke from
 * `from` to `to` of its own stalk's local progress.
 */

/** The page-load moment. Nothing in the grove may animate past it. */
export const SETTLE_MS = 1900;

/** How far the haze canvas overhangs the viewport, in CSS px. The blur is
 *  computed from geometry that continues past every edge, so the soft plane
 *  never fades into a vignette along the frame. */
export const HAZE_PAD = 32;

/** One stroked polyline, sampled at generation time. */
export interface Stroke {
  /** Flat [x0, y0, x1, y1, …] in CSS px. */
  pts: Float32Array;
  /** Stalk-local progress at which this stroke starts drawing. */
  from: number;
  /** …and at which it is complete. */
  to: number;
}

/** Strokes sharing one pen weight, so a frame paints them in a single path. */
export interface StrokeGroup {
  width: number;
  strokes: Stroke[];
}

export interface Stalk {
  groups: StrokeGroup[];
  /** Per-stalk opacity multiplier — depth without a second colour. */
  alpha: number;
  /** Fractions of the settle budget. */
  delay: number;
  dur: number;
}

export interface Grove {
  width: number;
  height: number;
  /** Crisp pen strokes, painted on the sharp canvas. */
  ink: Stalk[];
  /** Wide soft strokes, painted on the blurred canvas behind. */
  haze: Stalk[];
}

export interface GroveOptions {
  seed: number;
  width: number;
  height: number;
}

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

interface Point {
  x: number;
  y: number;
}

type Curve = (u: number) => Point;

function span(random: () => number, range: [number, number]): number {
  return range[0] + random() * (range[1] - range[0]);
}

/** A quadratic bézier as a curve. */
function quad(a: Point, c: Point, b: Point): Curve {
  return (u) => {
    const v = 1 - u;
    return {
      x: v * v * a.x + 2 * v * u * c.x + u * u * b.x,
      y: v * v * a.y + 2 * v * u * c.y + u * u * b.y,
    };
  };
}

/** Sample a curve into a flat polyline of `steps + 1` points. */
function sample(curve: Curve, steps: number): Float32Array {
  const out = new Float32Array((steps + 1) * 2);
  for (let i = 0; i <= steps; i++) {
    const p = curve(i / steps);
    out[i * 2] = p.x;
    out[i * 2 + 1] = p.y;
  }
  return out;
}

function segment(a: Point, b: Point): Float32Array {
  return new Float32Array([a.x, a.y, b.x, b.y]);
}

/** Unit tangent of a curve at u, by central difference. */
function tangentAt(curve: Curve, u: number): Point {
  const h = 0.01;
  const a = curve(Math.max(0, u - h));
  const b = curve(Math.min(1, u + h));
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/** Unit normal across a curve at u. */
function normalAt(curve: Curve, u: number): Point {
  const t = tangentAt(curve, u);
  return { x: -t.y, y: t.x };
}

/* ---------------------------------------------------------------- the pen */

interface RawStroke extends Stroke {
  width: number;
}

/** Collects marks, then hands them back bucketed by pen weight. Timings are
 *  clamped on the way in: a stroke whose window ran past the stalk's own
 *  finish would stay half-drawn in the settled grove for good. */
function makePen() {
  const marks: RawStroke[] = [];
  return {
    mark(pts: Float32Array, width: number, from: number, to: number): void {
      const end = Math.min(1, to);
      marks.push({ pts, width, from: Math.min(from, end - 0.001), to: end });
    },
    groups(): StrokeGroup[] {
      const byWidth = new Map<number, Stroke[]>();
      for (const m of marks) {
        /* Quantised so near-identical weights share one path. A pen weight is
           held to a twentieth of a pixel, because a hairline's weight is the
           whole of its character; a mass on the blurred plane is rounded to
           the pixel, because there nothing survives that reads it. */
        const key = m.width < 3 ? Math.round(m.width * 20) / 20 : Math.round(m.width);
        let list = byWidth.get(key);
        if (!list) byWidth.set(key, (list = []));
        list.push({ pts: m.pts, from: m.from, to: m.to });
      }
      return [...byWidth].map(([width, strokes]) => ({ width, strokes }));
    },
  };
}

type Pen = ReturnType<typeof makePen>;

/* ------------------------------------------------------------- the culm */

/** How a plane draws. The geometry is shared; only the marks differ. */
interface Style {
  /** 'outline' draws the culm as a tube — two edges plus a collar at each
   *  node. 'band' restates it as one wide stroke for the blurred plane. */
  body: 'outline' | 'band';
  /** Pen weight for the culm outline, or for node marks on a band. */
  weight: number;
  /** Pen weight for twigs and leaf outlines. */
  fine: number;
  /** Blades as soft masses — one thick stroke — instead of outlines. */
  mass: boolean;
}

const INK: Style = { body: 'outline', weight: 1.3, fine: 1, mass: false };
const INK_FAR: Style = { body: 'outline', weight: 1.1, fine: 0.9, mass: false };
const HAZE: Style = { body: 'band', weight: 2.4, fine: 2.6, mass: true };

interface CulmSpec {
  /** Culm length, as a fraction of the viewport height. */
  length: [number, number];
  /** Culm diameter at the foot, as a fraction of the drawing unit. */
  girth: [number, number];
  /** Leaf and twig scale, as a fraction of the drawing unit. */
  reach: [number, number];
  /** How much of the canopy this plane carries, against the near plane's full
   *  share. Distance costs detail: a far culm reads as a few soft masses, and
   *  a full canopy back there only washes the margin into a flat mid-tone. */
  canopy: number;
  alpha: [number, number];
  style: Style;
}

/* Front plane: tall enough that most culms leave through the top of the frame,
   which is what makes the hedge feel taller than the window. */
const NEAR: CulmSpec = {
  length: [1, 1.4],
  girth: [0.024, 0.033],
  reach: [0.075, 0.105],
  canopy: 1,
  alpha: [0.85, 1],
  style: INK,
};

const MID: CulmSpec = {
  length: [0.55, 1.05],
  girth: [0.016, 0.023],
  reach: [0.058, 0.085],
  canopy: 0.9,
  alpha: [0.5, 0.74],
  style: INK_FAR,
};

/* The soft plane carries its depth in the token's alpha, not here: these
   multipliers only separate one blurred culm from the next. */
const FAR: CulmSpec = {
  length: [1.02, 1.45],
  girth: [0.03, 0.058],
  reach: [0.06, 0.09],
  canopy: 0.5,
  alpha: [0.35, 0.95],
  style: HAZE,
};

/** A culm's centreline. It stands plumb and leans as one, so the drawing never
 *  wobbles: a steady splay away from the middle of the frame, plus a whisper of
 *  bow. Bamboo, not grass. */
function centreline(
  footX: number,
  footY: number,
  length: number,
  splay: number,
  bow: number,
): Curve {
  return (s) => ({
    x: footX + splay * Math.pow(s, 1.2) + bow * Math.sin(Math.PI * s),
    y: footY - length * s,
  });
}

/** Relative internode length along the culm — the "slow-fast-slow" rhythm:
 *  short at the foot, longest a little past mid-culm, shortest of all at the
 *  tip. Spacing that simply widens upward is the most common way a drawing of
 *  bamboo goes wrong. */
function internodeFactor(s: number): number {
  return Math.max(0.35, 0.72 + 0.52 * Math.sin(Math.PI * Math.min(1, s)) - 0.45 * s ** 3);
}

/** Node positions from foot to tip, walked by the rhythm above. */
function nodePositions(length: number, base: number, random: () => number): number[] {
  const nodes: number[] = [];
  let d = base * (0.4 + random() * 0.35);

  while (d < length) {
    nodes.push(d / length);
    d += base * internodeFactor(d / length) * (0.9 + random() * 0.22);
  }

  return nodes;
}

/** Half the culm's diameter at s: a steady taper, a slight swelling at every
 *  node — the knuckle that makes a joint read as a joint — and a hard pinch
 *  over the last few percent so a culm that ends inside the frame comes to a
 *  point instead of a cut pipe. */
function halfWidth(hw0: number, nodes: number[], sigma: number, s: number): number {
  let knuckle = 0;
  for (const n of nodes) {
    const d = (s - n) / sigma;
    if (d > -3 && d < 3) knuckle = Math.max(knuckle, Math.exp(-d * d));
  }
  const pinch = s > 0.96 ? 1 - 0.55 * ((s - 0.96) / 0.04) : 1;
  return hw0 * (1 - 0.32 * s) * (1 + 0.22 * knuckle) * pinch;
}

/** The pen weights the blurred plane is allowed to use for a leaf mass. Four
 *  rungs, spaced widely enough that an 8px blur cannot tell them apart, so the
 *  whole canopy of a culm paints in a handful of paths no matter how the blades
 *  happen to be sized. */
const SPINE_LADDER = [6, 9, 13, 18];

function rung(width: number): number {
  let best = SPINE_LADDER[0];
  for (const step of SPINE_LADDER) {
    if (Math.abs(step - width) < Math.abs(best - width)) best = step;
  }
  return best;
}

/** One blade: a narrow lanceolate leaf, drawn as two edges meeting at a point
 *  with a midrib between them. Oversized or rounded blades read as plum. */
function blade(
  pen: Pen,
  base: Point,
  dir: Point,
  len: number,
  style: Style,
  at: number,
  random: () => number,
): void {
  const n = { x: -dir.y, y: dir.x };
  const w = len * (0.17 + random() * 0.06);
  /* A touch of sickle in the tip — a blade is never a perfect spindle. */
  const curl = (random() - 0.5) * 0.18;
  const tip = {
    x: base.x + dir.x * len + n.x * len * curl,
    y: base.y + dir.y * len + n.y * len * curl,
  };
  const shoulder = (off: number): Point => ({
    x: base.x + dir.x * len * 0.44 + n.x * off,
    y: base.y + dir.y * len * 0.44 + n.y * off,
  });

  if (style.mass) {
    /* One fat stroke down the blade's spine is a leaf once the plane is
       blurred. Snapped to the ladder so a whole canopy shares four or five pen
       weights however the blades are sized — the blur was going to swallow the
       difference either way, and a path per blade would not. */
    pen.mark(sample(quad(base, shoulder(w * 0.2), tip), 5), rung(w * 1.7), at, at + 0.03);
    return;
  }

  pen.mark(sample(quad(base, shoulder(w), tip), 7), style.fine, at, at + 0.035);
  pen.mark(sample(quad(base, shoulder(-w * 0.68), tip), 7), style.fine, at, at + 0.035);
  /* The midrib is detail, and detail on a 10px blade is just soot. */
  if (len > 13) {
    pen.mark(sample(quad(base, shoulder(w * 0.14), tip), 6), style.fine, at, at + 0.035);
  }
}

/** A branch: one twig arcing out and up from a node, blades fanning off it.
 *  The arc is concave-down — steep as it leaves the culm, flattening as it
 *  reaches out — which is how a bamboo branch actually carries its load. */
function branch(
  pen: Pen,
  origin: Point,
  side: number,
  reach: number,
  style: Style,
  at: number,
  random: () => number,
): void {
  const lean = (42 + random() * 26) * (Math.PI / 180);
  const len = reach * (0.85 + random() * 0.45);
  const end = {
    x: origin.x + side * len * Math.sin(lean),
    y: origin.y - len * Math.cos(lean),
  };
  const control = {
    x: origin.x + side * len * Math.sin(lean) * 0.42,
    y: origin.y - len * Math.cos(lean) * 0.42 - len * 0.17,
  };
  const twig = quad(origin, control, end);
  pen.mark(sample(twig, 10), style.fine, at, at + 0.05);

  const blades = 6 + Math.floor(random() * 4);
  for (let k = 0; k < blades; k++) {
    const u = 0.26 + (k / blades) * 0.68 + random() * 0.06;
    const foot = twig(u);
    const t = tangentAt(twig, u);
    /* Blades lift out of the twig rather than following it: the tangent is
       tilted toward the sky before the fan spreads either side of it. Left to
       the tangent alone the far end of the branch would hang its leaves
       sideways, which reads as willow. */
    const lift = { x: t.x, y: t.y - 0.45 };
    const scale = Math.hypot(lift.x, lift.y) || 1;
    const flip = k % 2 === 0 ? 1 : -1;
    const angle = flip * (14 + random() * 38) * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dir = {
      x: (lift.x * cos - lift.y * sin) / scale,
      y: (lift.x * sin + lift.y * cos) / scale,
    };
    blade(pen, foot, dir, len * (0.5 - 0.22 * u) * (0.85 + random() * 0.3), style, at + k * 0.006, random);
  }

  /* A blade carrying on past the twig's end closes the fan. */
  blade(pen, end, tangentAt(twig, 1), len * 0.23, style, at + 0.03, random);
}

/** How big a culm is drawn, as against how tall it grows. Length answers to the
 *  viewport height — a culm has to clear the frame. Everything else answers to
 *  this: on a phone the height alone would give a 27px-thick culm across a
 *  375px screen, which is a log, not a hedge. */
export function drawingUnit(width: number, height: number): number {
  return Math.min(height, width * 0.78);
}

function makeCulm(
  spec: CulmSpec,
  width: number,
  height: number,
  footX: number,
  random: () => number,
): Stalk {
  const style = spec.style;
  const pen = makePen();
  const unit = drawingUnit(width, height);

  const length = height * span(random, spec.length);
  const footY = height + height * 0.012;
  /* The grove fans: culms near an edge lean away from the middle of the frame,
     the ones in the centre stand up. */
  const drift = (footX / width - 0.5) * 0.34 + (random() - 0.5) * 0.17;
  const curve = centreline(footX, footY, length, drift * length * 0.5, (random() - 0.5) * length * 0.05);

  const hw0 = (unit * span(random, spec.girth)) / 2;
  const nodes = nodePositions(length, unit * 0.105 * (0.85 + random() * 0.35), random);
  const sigma = 6 / length;

  if (style.body === 'outline') {
    /* The tube: two edges walking the centreline at ±halfWidth. Sampling is
       uniform in s, so a partial trace is a partial culm. */
    const steps = Math.max(28, Math.round(length / 5));
    const left = new Float32Array((steps + 1) * 2);
    const right = new Float32Array((steps + 1) * 2);
    for (let i = 0; i <= steps; i++) {
      const s = i / steps;
      const p = curve(s);
      const n = normalAt(curve, s);
      const w = halfWidth(hw0, nodes, sigma, s);
      left[i * 2] = p.x - n.x * w;
      left[i * 2 + 1] = p.y - n.y * w;
      right[i * 2] = p.x + n.x * w;
      right[i * 2 + 1] = p.y + n.y * w;
    }
    pen.mark(left, style.weight, 0, 1);
    pen.mark(right, style.weight, 0, 1);

    /* The collar: two lines across the culm a few px apart. The swelling in
       halfWidth carries the ring between them. */
    const band = Math.min(0.02, 5 / length);
    for (const s of nodes) {
      if (s < 0.02 || s > 0.99) continue;
      /* The lines run a hair past the tube, the way a pen overshoots a join —
         which is most of what makes the collar visible at all. */
      for (const at of [s, Math.min(0.995, s + band)]) {
        const p = curve(at);
        const n = normalAt(curve, at);
        const w = halfWidth(hw0, nodes, sigma, at) * 1.22;
        pen.mark(
          segment({ x: p.x - n.x * w, y: p.y - n.y * w }, { x: p.x + n.x * w, y: p.y + n.y * w }),
          style.weight,
          s,
          s + 0.014,
        );
      }
    }
  } else {
    /* The soft plane keeps only the mass: one wide stroke down the centreline,
       with a darker mark at each node so the joints survive the blur. */
    const steps = Math.max(20, Math.round(length / 12));
    pen.mark(sample(curve, steps), hw0 * 2, 0, 1);
    for (const s of nodes) {
      if (s < 0.03 || s > 0.99) continue;
      const p = curve(s);
      const n = normalAt(curve, s);
      const w = halfWidth(hw0, nodes, sigma, s) * 0.95;
      pen.mark(
        segment({ x: p.x - n.x * w, y: p.y - n.y * w }, { x: p.x + n.x * w, y: p.y + n.y * w }),
        style.weight,
        s,
        s + 0.014,
      );
    }
  }

  /* Branches gather toward the crown, where a real culm carries its canopy. */
  const reach = unit * span(random, spec.reach);
  let side = random() < 0.5 ? -1 : 1;
  for (const s of nodes) {
    if (s < 0.18 || s > 0.985) continue;
    if (random() > (0.52 + 0.45 * s) * spec.canopy) continue;
    const p = curve(s);
    const n = normalAt(curve, s);
    const w = halfWidth(hw0, nodes, sigma, s) * 0.85;
    const at = Math.min(0.95, s + 0.02);
    const grade = reach * (0.55 + 0.55 * s);
    branch(pen, { x: p.x + n.x * w * side, y: p.y + n.y * w * side }, side, grade, style, at, random);
    /* Now and then the node carries a second branch, opposite the first. */
    if (random() < 0.4) {
      branch(pen, { x: p.x - n.x * w * side, y: p.y - n.y * w * side }, -side, grade * 0.85, style, at + 0.01, random);
    }
    side = -side;
  }

  /* A taller culm takes longer to rise, and every stalk finishes inside the
     budget — the delay is what is left over, never more. */
  const dur = 0.5 + (length / height) * 0.22;
  return {
    groups: pen.groups(),
    alpha: span(random, spec.alpha),
    delay: random() * Math.max(0, 1 - dur - 0.04),
    dur,
  };
}

/** A whip: one thin blade of new growth arcing up out of the floor, a small
 *  cluster of leaves at its tip. Two or three per screen keep the hedge from
 *  reading as a fence. */
function makeWhip(width: number, height: number, footX: number, random: () => number): Stalk {
  const pen = makePen();
  const unit = drawingUnit(width, height);
  const length = height * (0.45 + random() * 0.4);
  const side = footX < width / 2 ? 1 : -1;
  const foot = { x: footX, y: height + 4 };
  const end = { x: footX + side * length * 0.42, y: height - length };
  const arc = quad(foot, { x: footX + side * length * 0.04, y: height - length * 0.62 }, end);

  pen.mark(sample(arc, 24), 0.9, 0, 0.9);
  branch(pen, arc(0.72), side, unit * 0.05, INK, 0.74, random);
  branch(pen, end, side, unit * 0.07, INK, 0.9, random);

  const dur = 0.55 + (length / height) * 0.2;
  return {
    groups: pen.groups(),
    alpha: 0.6 + random() * 0.3,
    delay: random() * Math.max(0, 1 - dur - 0.04),
    dur,
  };
}

/** Feet spread across the frame in even strata, jittered inside each one, so
 *  the hedge is dense everywhere without ever queueing up. The band runs a
 *  little past both edges: a culm leaving the frame is what tells the reader
 *  the grove does not end at the window. */
function feet(count: number, width: number, random: () => number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.push((-0.06 + 1.12 * ((i + 0.03 + random() * 0.94) / count)) * width);
  }
  return out;
}

/** The grove: counts scale with width, so a wide screen stays evenly planted
 *  and a narrow one never turns into a thicket. */
export function generateGrove(options: GroveOptions): Grove {
  const { seed, width, height } = options;
  const random = makeRandom(seed);

  const plant = (spec: CulmSpec, count: number): Stalk[] =>
    feet(count, width, random).map((x) => makeCulm(spec, width, height, x, random));

  return {
    width,
    height,
    ink: [
      ...plant(MID, Math.max(4, Math.round(width / 112))),
      ...plant(NEAR, Math.max(3, Math.round(width / 152))),
      ...feet(Math.max(1, Math.round(width / 900)), width, random).map((x) =>
        makeWhip(width, height, x, random),
      ),
    ],
    haze: plant(FAR, Math.max(3, Math.round(width / 148))),
  };
}

/* --------------------------------------------------------------- painting */

/** Smoothstep: eases out of nothing, holds a steady rate through the middle,
 *  settles without a stop. A culm that shoots up and brakes reads as a UI
 *  transition; growth is the slow part being long. */
function smoothstep(x: number): number {
  return x * x * (3 - 2 * x);
}

/** Local progress of a stalk at global time t, both 0..1. */
function stalkProgress(stalk: Stalk, t: number): number {
  return smoothstep(Math.min(1, Math.max(0, (t - stalk.delay) / stalk.dur)));
}

/** Append the revealed part of a stroke to the current path. */
function trace(ctx: CanvasRenderingContext2D, stroke: Stroke, p: number): void {
  const u = (p - stroke.from) / (stroke.to - stroke.from);
  if (u <= 0) return;

  const pts = stroke.pts;
  const last = pts.length / 2 - 1;
  const cursor = Math.min(1, u) * last;
  const whole = Math.floor(cursor);

  ctx.moveTo(pts[0], pts[1]);
  for (let k = 1; k <= whole; k++) ctx.lineTo(pts[k * 2], pts[k * 2 + 1]);

  const part = cursor - whole;
  if (part > 0 && whole < last) {
    const i = whole * 2;
    ctx.lineTo(
      pts[i] + (pts[i + 2] - pts[i]) * part,
      pts[i + 1] + (pts[i + 3] - pts[i + 1]) * part,
    );
  }
}

/**
 * Paint one plane at global time t ∈ [0, 1] in the given ink. The context is
 * assumed already translated and scaled for its canvas; `color` carries the
 * theme's low base alpha, and per-stalk depth multiplies on top of it.
 *
 * Marks of one weight go down as a single path, which is both faster and
 * truer: overlapping strokes composite once instead of stacking into a
 * darker blot wherever a leaf crosses a culm.
 */
export function drawPlane(
  ctx: CanvasRenderingContext2D,
  stalks: Stalk[],
  t: number,
  color: string,
): void {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stalk of stalks) {
    const p = stalkProgress(stalk, t);
    if (p <= 0) continue;
    ctx.globalAlpha = stalk.alpha;

    for (const group of stalk.groups) {
      ctx.beginPath();
      let inked = false;
      for (const stroke of group.strokes) {
        if (p <= stroke.from) continue;
        trace(ctx, stroke, p);
        inked = true;
      }
      if (inked) {
        ctx.lineWidth = group.width;
        ctx.stroke();
      }
    }
  }

  ctx.globalAlpha = 1;
}
