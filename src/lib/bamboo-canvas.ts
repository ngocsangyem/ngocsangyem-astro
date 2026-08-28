/**
 * Drawing backend for BambooBackground.astro, split out so it is a separate
 * chunk: the component ships only a small gate script, and this module -- the
 * brush, the noise tile, the whole render loop, plus bamboo-geometry behind
 * it -- is fetched on demand the first time a wide-enough viewport asks for
 * the grove. A phone never downloads it.
 */
import { compose, n1 } from "./bamboo-geometry";
import type {
    LayerKey,
    Density,
    PathStroke,
    Stroke,
} from "./bamboo-geometry";

type Theme = "light" | "dark";
type Reveal = "ink" | "grow" | "wipe";
type Tint = "ink" | "hoe" | "son";
type DepthKey = "far" | "mid" | "front";

/** Three depth layers. Culms and leaves of one clump sit on the SAME layer,
 *  so they share a wind transform and never drift apart. */
const DEPTHS: {
    key: DepthKey;
    sk: number;
    tx: number;
    sd: number;
    dly: number;
}[] = [
    // Periods share no small common multiple, so the three layers drift
    // through every relative phase instead of realigning every few cycles.
    { key: "far", sk: 0.22, tx: 1, sd: 17.0, dly: -6.4 },
    { key: "mid", sk: 0.38, tx: 2, sd: 13.0, dly: -3.1 },
    { key: "front", sk: 0.55, tx: 3, sd: 11.0, dly: 0.0 },
];
const DEPTH_OF: Record<LayerKey, DepthKey> = {
    far: "far",
    midCulm: "mid",
    midLeaf: "mid",
    frontCulm: "front",
    frontLeaf: "front",
    shootColor: "front",
    shootLine: "front",
};

/** Long strokes have to be cut into chunks, otherwise a whole culm segment
 *  pops out at once and the growth looks jerky. */
const CHUNK = 0.045;
const NT = 256;

type Piece =
    | {
          blob: true;
          depth: DepthKey;
          tint: Tint;
          x: number;
          y: number;
          r: number;
          alpha: number;
          t: number;
      }
    | {
          blob: false;
          depth: DepthKey;
          tint: Tint;
          o: Float32Array;
          alpha: number;
          dry: number;
          ang: number;
          mx: number;
          my: number;
          R: number;
          /** Bounding box in stroke-aligned space: [x0,y0,x1,y1] around (mx,my). */
          qbox: readonly [number, number, number, number];
          t: number;
          /** Where the brush lands: the widest point on the stroke. */
          ox: number;
          oy: number;
          /** Radius needed to cover the stroke, and radius of the first ink drop. */
          maxR: number;
          blotR: number;
          /** Precomputed bleed rim, built LAZILY the first time a stroke is
           *  drawn. Building all 647 up front is ~390k noise calls in one frame. */
          rimSeed: number;
          rx: Float32Array | null;
          ry: Float32Array | null;
          /** Bounding box, so the scratch layer only clears what is dirty. */
          bx: number;
          by: number;
          bw: number;
          bh: number;
      };

let noiseTile: HTMLCanvasElement | null = null;
/** Mean alpha of the noise tile, needed to know how much ink the punch removes. */
let noiseMean = 0.35;
/** Pink-noise tile, streaks along Y. Built once, shared by every instance. */
function getNoise(): HTMLCanvasElement {
    if (noiseTile) return noiseTile;
    const c = document.createElement("canvas");
    c.width = c.height = NT;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(NT, NT);
    const d = img.data;
    for (let y = 0; y < NT; y++)
        for (let x = 0; x < NT; x++) {
            const v =
                n1(x * 1.7) * 0.55 +
                n1(x * 5.1 + 100) * 0.22 +
                n1(x * 0.3 + y * 0.06 + 7) * 0.45;
            const a = Math.max(0, Math.min(1, (v - 0.52) * 3.2));
            const i = (y * NT + x) * 4;
            d[i] = d[i + 1] = d[i + 2] = 255;
            d[i + 3] = Math.round(a * 255);
        }
    ctx.putImageData(img, 0, 0);
    let sum = 0;
    for (let i = 3; i < d.length; i += 4) sum += d[i];
    noiseMean = sum / (255 * NT * NT);
    noiseTile = c;
    return c;
}

function hexToRgb(hex: string): string {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    if (!m) return "25,28,26";
    return `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
}

/** Centreline to tapered polygon, sampled over [t0, t1]. */
function outline(s: PathStroke, t0: number, t1: number, n: number) {
    const p: { x: number; y: number; nx: number; ny: number; w: number }[] =
        [];
    for (let i = 0; i <= n; i++) {
        const u = t0 + (t1 - t0) * (i / n);
        const [x, y] = s.path(u);
        const [x2, y2] = s.path(Math.min(1, u + 1e-3));
        let tx = x2 - x,
            ty = y2 - y;
        const l = Math.hypot(tx, ty) || 1;
        p.push({ x, y, nx: -ty / l, ny: tx / l, w: s.width(u) });
    }
    const o: number[] = [];
    for (const q of p)
        o.push(q.x + q.nx * q.w * 0.5, q.y + q.ny * q.w * 0.5);
    for (let i = p.length - 1; i >= 0; i--)
        o.push(
            p[i].x - p[i].nx * p[i].w * 0.5,
            p[i].y - p[i].ny * p[i].w * 0.5,
        );
    return { o: Float32Array.from(o), p };
}

function build(
    W: number,
    H: number,
    seed: number,
    density: Density,
    shoot: boolean,
    reveal: Reveal,
) {
    const raw: Stroke[] = [];
    compose({ W, H, seed, density, shoot, emit: (s) => raw.push(s) });
    const out: Piece[] = [];

    for (const s of raw) {
        const depth = DEPTH_OF[s.layer] ?? "front";
        if (s.kind === "mist") {
            if (s.layer !== "shootColor") continue;
            out.push({
                blob: true,
                depth,
                tint: s.pigment === "son" ? "son" : "hoe",
                x: s.x,
                y: s.y,
                r: s.r,
                alpha: Math.min(1, s.alpha * 3.0),
                t: s.t0,
            });
            continue;
        }

        const tint: Tint = s.layer === "shootColor" ? "hoe" : "ink";
        const nSample = s.kind === "leaf" ? 14 : 20;

        // direction, centre and reach of the noise tile come from the full stroke
        const full = outline(s, 0, 1, nSample);
        const fp = full.p;
        const ang = Math.atan2(
            fp[fp.length - 1].y - fp[0].y,
            fp[fp.length - 1].x - fp[0].x,
        );
        const mid = fp[fp.length >> 1];
        let x0 = Infinity,
            y0 = Infinity,
            x1 = -Infinity,
            y1 = -Infinity;
        for (let i = 0; i < full.o.length; i += 2) {
            if (full.o[i] < x0) x0 = full.o[i];
            if (full.o[i] > x1) x1 = full.o[i];
            if (full.o[i + 1] < y0) y0 = full.o[i + 1];
            if (full.o[i + 1] > y1) y1 = full.o[i + 1];
        }
        const R = Math.max(24, Math.max(x1 - x0, y1 - y0) * 0.75);
        // Bounding box in stroke-aligned space. It lets the punch draw only the
        // sliver of noise that covers the stroke instead of the full 2Rx2R square.
        // For a 40 px culm, a 374x374 px tile would be about 14x wasted.
        const ca = Math.cos(-(ang + Math.PI / 2)),
            sa = Math.sin(-(ang + Math.PI / 2));
        let qx0 = Infinity,
            qy0 = Infinity,
            qx1 = -Infinity,
            qy1 = -Infinity;
        for (let i = 0; i < full.o.length; i += 2) {
            const dx = full.o[i] - mid.x,
                dy = full.o[i + 1] - mid.y;
            const rx = dx * ca - dy * sa,
                ry = dx * sa + dy * ca;
            if (rx < qx0) qx0 = rx;
            if (rx > qx1) qx1 = rx;
            if (ry < qy0) qy0 = ry;
            if (ry > qy1) qy1 = ry;
        }
        const qpad = 2;
        const qbox = [
            qx0 - qpad,
            qy0 - qpad,
            qx1 + qpad,
            qy1 + qpad,
        ] as const;

        if (reveal === "ink") {
            // The brush lands at the WIDEST point on the stroke, where a writer
            // presses down before pulling. On a leaf that is the belly, not the
            // tip.
            let bi = 0;
            for (let i = 1; i < fp.length; i++)
                if (fp[i].w > fp[bi].w) bi = i;
            const ox = fp[bi].x,
                oy = fp[bi].y;
            let maxR = 0;
            for (let i = 0; i < full.o.length; i += 2)
                maxR = Math.max(
                    maxR,
                    Math.hypot(full.o[i] - ox, full.o[i + 1] - oy),
                );
            out.push({
                blob: false,
                depth,
                tint,
                o: full.o,
                alpha: Math.min(1, s.alpha(0.5) * 3.4),
                dry: 0.3 + 0.55 * s.dryness,
                ang,
                mx: mid.x,
                my: mid.y,
                R,
                qbox,
                ox,
                oy,
                blotR: Math.max(2.5, fp[bi].w * 0.55),
                bx: x0,
                by: y0,
                bw: x1 - x0,
                bh: y1 - y0,
                maxR: maxR / RIM_MIN,
                rimSeed: s.seed,
                rx: null,
                ry: null,
                // slight stagger: leaf clusters otherwise start almost together
                // and p95 spikes when they land in one frame
                t: s.t0 + (n1(s.seed * 3.7) - 0.5) * 0.14,
            });
            continue;
        }

        // 'grow' mode: cut long strokes into chunks so they grow smoothly
        const segs = Math.max(1, Math.ceil(s.dur / CHUNK));
        for (let k = 0; k < segs; k++) {
            const a0 = k / segs,
                a1 = (k + 1) / segs;
            const { o } = outline(
                s,
                a0,
                a1,
                Math.max(3, Math.round(nSample / segs) + 2),
            );
            out.push({
                blob: false,
                depth,
                tint,
                o,
                alpha: Math.min(1, s.alpha((a0 + a1) / 2) * 3.4),
                dry: 0.3 + 0.55 * s.dryness,
                ang,
                mx: mid.x,
                my: mid.y,
                R,
                qbox,
                ox: 0,
                oy: 0,
                maxR: 0,
                blotR: 0,
                rimSeed: 0,
                rx: null,
                ry: null,
                bx: 0,
                by: 0,
                bw: 0,
                bh: 0,
                t: s.t0 + s.dur * a0,
            });
        }
    }
    out.sort((a, b) => a.t - b.t);
    return out;
}

/**
 * Vertex count on the bleed rim has to follow the CIRCUMFERENCE, not sit at
 * a constant. With 28 fixed vertices, a 200 px radius puts them 45 px apart,
 * wider than a culm, so the rim cuts across the stroke as one straight
 * diagonal that reads as a knife slash. Aim for one vertex per ~7 px of arc.
 */

/**
 * Real ink does not spread as a circle. Its edge is ragged, bulging in some
 * places and falling short in others. That edge shape is the one thing worth
 * taking from the mask-with-ink-footage approach. Two angular noise octaves
 * generate it, precomputed so it costs nothing at runtime.
 *
 * maxR has to be widened by the smallest factor, otherwise the deepest
 * notch never covers the stroke.
 */
/** 256-entry sine table. Cheaper than Math.sin when called millions of times. */
const SIN = new Float32Array(256);
for (let i = 0; i < 256; i++) SIN[i] = Math.sin((i / 256) * Math.PI * 2);

/** Rim distortion at one angle. Four octaves: overall shape, lobes, teeth, speckled edge. */
function rimAt(th: number, seed: number): number {
    return (
        0.7 +
        0.2 * n1(seed * 1.7 + th * 1.9) +
        0.18 * n1(seed * 5.3 + th * 9.3) +
        0.13 * n1(seed * 11.1 + th * 28.0) +
        0.07 * n1(seed * 23.7 + th * 71.0) // speckle a few pixels across
    );
}

/**
 * Precompute the bleed rim as unit vectors.
 *
 * Calling four noise functions per vertex per frame ran to more than four
 * million noise calls a second at 82 strokes bleeding, 220 vertices, 60 fps.
 * A slower bleed makes it worse, since strokes sit at a large radius longer
 * and so carry more vertices. Precomputed, a vertex costs two multiplies.
 *
 * maxR also has to be widened by the smallest factor, otherwise the deepest
 * notch never covers the stroke.
 */
/** Lower bound of rimAt, for widening maxR without building the rim yet. */
const RIM_MIN = 0.7;

function bakeRim(maxR: number, seed: number) {
    const n = Math.max(
        24,
        Math.min(120, Math.round((maxR * 6.2832) / 4.5)),
    );
    const rx = new Float32Array(n);
    const ry = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const th = (i / n) * Math.PI * 2;
        const v = rimAt(th, seed);
        rx[i] = Math.cos(th) * v;
        ry[i] = Math.sin(th) * v;
    }
    return { rx, ry };
}

/** Bleed rim outline: a distorted-radius polygon instead of arc(). */
function rimPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    rx: Float32Array,
    ry: Float32Array,
    t: number,
) {
    const n = rx.length;
    // small radius needs fewer vertices: one per ~4.5 px of arc is enough
    const want = Math.max(24, Math.min(n, Math.round((r * 6.2832) / 9)));
    const step = Math.max(1, Math.floor(n / want));
    const ph = ((t * 2.6 * 256) / 6.2832) | 0;
    ctx.beginPath();
    for (let i = 0; i < n; i += step) {
        // ink keeps creeping after it arrives; the scratch layer clears each frame so the rim can retreat
        const rr = r * (1 + 0.045 * SIN[(ph + i * 5) & 255]);
        const px = x + rx[i] * rr,
            py = y + ry[i] * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function trace(ctx: CanvasRenderingContext2D, o: Float32Array) {
    ctx.beginPath();
    ctx.moveTo(o[0], o[1]);
    for (let i = 2; i < o.length; i += 2) ctx.lineTo(o[i], o[i + 1]);
    ctx.closePath();
}

/** Fills the stroke shape only, no dry grain. The caller handles clipping. */
function fillShape(
    ctx: CanvasRenderingContext2D,
    q: Piece,
    colors?: Record<Tint, string>,
    k = 1,
) {
    if (q.blob) return;
    if (colors) ctx.fillStyle = `rgb(${colors[q.tint]})`;
    ctx.globalAlpha = q.alpha * k;
    trace(ctx, q.o);
    ctx.fill();
    ctx.globalAlpha = 1;
}

/**
 * Dry-brush grain: clip to the stroke, then punch it out with a noise tile
 * rotated along the stroke. The punch always stays inside the stroke's own
 * shadow, so it never eats a hole into a neighbour.
 */
function punch(ctx: CanvasRenderingContext2D, q: Piece) {
    if (q.blob) return;
    ctx.save();
    trace(ctx, q.o);
    ctx.clip();
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = q.dry;
    ctx.translate(q.mx, q.my);
    ctx.rotate(q.ang + Math.PI / 2);
    const [bx0, by0, bx1, by1] = q.qbox;
    const k = 256 / (q.R * 2); // noise pixels per paper pixel
    ctx.drawImage(
        getNoise(),
        (bx0 + q.R) * k,
        (by0 + q.R) * k,
        (bx1 - bx0) * k,
        (by1 - by0) * k,
        bx0,
        by0,
        bx1 - bx0,
        by1 - by0,
    );
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
}

function paintFull(
    ctx: CanvasRenderingContext2D,
    q: Piece,
    colors?: Record<Tint, string>,
) {
    ctx.globalCompositeOperation = "source-over";
    if (q.blob) {
        const c = colors ? colors[q.tint] : "0,0,0";
        const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
        g.addColorStop(0, `rgba(${c},${q.alpha.toFixed(3)})`);
        g.addColorStop(0.6, `rgba(${c},${(q.alpha * 0.45).toFixed(3)})`);
        g.addColorStop(1, `rgba(${c},0)`);
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
        ctx.fill();
        return;
    }
    fillShape(ctx, q, colors);
    punch(ctx, q);
}

/**
 * `once` mode: true from the second page of a visit onwards.
 *
 * The key is claimed on the FIRST call, not when the reveal finishes, so a
 * reader who navigates away mid-draw still gets the finished grove next
 * page rather than a second half-draw. sessionStorage, not localStorage:
 * a visit tomorrow should be greeted again.
 */
const DRAWN_KEY = "bamboo-drawn";
function alreadyDrawn(once?: string): boolean {
    if (once !== "1") return false;
    try {
        const seen = sessionStorage.getItem(DRAWN_KEY) === "1";
        sessionStorage.setItem(DRAWN_KEY, "1");
        return seen;
    } catch {
        return false; // storage blocked: draw every time, which is only the old behaviour
    }
}

function detectTheme(): Theme {
    const r = document.documentElement;
    const a =
        r.getAttribute("data-theme") || r.getAttribute("data-color-scheme");
    if (a === "dark" || a === "light") return a;
    if (r.classList.contains("dark")) return "dark";
    if (r.classList.contains("light")) return "light";
    return matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

/** 25 frames, 16:9. The shipped image is GREYSCALE, which compresses far
 *  better than alpha, converted to alpha once on load. */
const WIPE_FRAMES = 25;
let wipeSheet: HTMLCanvasElement | null = null;
let wipePending: Promise<HTMLCanvasElement | null> | null = null;

function loadWipe(src: string): Promise<HTMLCanvasElement | null> {
    if (wipeSheet) return Promise.resolve(wipeSheet);
    if (wipePending) return wipePending;
    wipePending = new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
            const c = document.createElement("canvas");
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const g = c.getContext("2d");
            if (!g) return resolve(null);
            g.drawImage(img, 0, 0);
            const d = g.getImageData(0, 0, c.width, c.height);
            const px = d.data;
            for (let i = 0; i < px.length; i += 4) {
                px[i + 3] = px[i]; // grey level to alpha
                px[i] = px[i + 1] = px[i + 2] = 255;
            }
            g.putImageData(d, 0, 0);
            wipeSheet = c;
            resolve(c);
        };
        img.onerror = () => resolve(null); // missing file shows the grove directly rather than breaking
        img.src = src;
    });
    return wipePending;
}

const instances = new Set<{ destroy: () => void }>();

function init(host: HTMLElement) {
    host.dataset.bambooReady = "1";
    const ds = host.dataset;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cfg = {
        seed: ds.seed ? parseInt(ds.seed, 10) : (Math.random() * 1e9) | 0,
        density: (ds.density || "normal") as Density,
        wind: reduced ? 0 : parseFloat(ds.wind || "1") || 0,
        animate: ds.animate === "1" && !reduced && !alreadyDrawn(ds.once),
        // force to exactly two values: an unknown string must fall back to the
        // default rather than quietly sliding into the other branch
        reveal: (ds.reveal === "grow" || ds.reveal === "wipe"
            ? ds.reveal
            : "ink") as Reveal,
        wipeSrc: ds.wipeSrc || "",
        bleed: Math.max(0.05, parseFloat(ds.bleed || "0.4")),
        duration: Math.max(0.3, parseFloat(ds.duration || "7")),
        shoot: ds.shoot === "1",
        themeMode: (ds.themeMode || "auto") as "light" | "dark" | "auto",
        paperLight: ds.paperLight || "#d3cec4",
        paperDark: ds.paperDark || "#1a2023",
        inkLight: hexToRgb(ds.inkLight || "#191c1a"),
        inkDark: hexToRgb(ds.inkDark || "#e8e6dc"),
        maxPixels: parseFloat(ds.maxPixels || "4000000"),
    };

    const layers = DEPTHS.map((d) => {
        const wrap = document.createElement("div");
        wrap.className = cfg.wind > 0 ? "bb-depth bb-sway" : "bb-depth";
        wrap.style.setProperty(
            "--sk",
            `${(d.sk * cfg.wind).toFixed(3)}deg`,
        );
        wrap.style.setProperty("--tx", `${(d.tx * cfg.wind).toFixed(2)}px`);
        wrap.style.setProperty("--sd", `${d.sd}s`);
        wrap.style.setProperty("--dly", `${d.dly}s`);
        const cv = document.createElement("canvas");
        wrap.appendChild(cv);
        host.appendChild(wrap);
        return {
            key: d.key,
            wrap,
            cv,
            ctx: cv.getContext("2d")!,
            // scratch layer for strokes still bleeding; allocated on demand, released when done
            tmp: null as HTMLCanvasElement | null,
            tctx: null as CanvasRenderingContext2D | null,
            // bounding box of last frame's painting, since clearing whole canvases every frame is wasteful
            d0: 0,
            d1: 0,
            d2: 0,
            d3: 0,
            dirty: false,
        };
    });
    const byKey = Object.fromEntries(
        layers.map((l) => [l.key, l]),
    ) as Record<DepthKey, (typeof layers)[number]>;

    let theme: Theme =
        cfg.themeMode === "auto" ? detectTheme() : cfg.themeMode;
    let colors: Record<Tint, string>;
    let W = 0,
        H = 0;
    let queue: Piece[] = [];
    let head = 0,
        total = 1,
        speed = 1;
    const active: Piece[] = [];
    let raf = 0,
        started = 0,
        running = false,
        visible = false;
    let bleed = 0.3;

    function palette() {
        colors =
            theme === "dark"
                ? { ink: cfg.inkDark, hoe: "220,170,76", son: "212,97,77" }
                : {
                      ink: cfg.inkLight,
                      hoe: "201,147,47",
                      son: "181,64,47",
                  };
        host.style.setProperty(
            "--paper",
            theme === "dark" ? cfg.paperDark : cfg.paperLight,
        );
    }

    function sizeUp() {
        const cw = host.clientWidth || window.innerWidth;
        const ch = host.clientHeight || window.innerHeight;
        const dpr = Math.max(
            1,
            Math.min(
                window.devicePixelRatio || 1,
                1.6,
                Math.sqrt(cfg.maxPixels / (cw * ch)),
            ),
        );
        W = Math.max(2, Math.round(cw * dpr));
        H = Math.max(2, Math.round(ch * dpr));
        for (const l of layers) {
            l.cv.width = W;
            l.cv.height = H;
            if (l.tmp) {
                l.tmp.width = W;
                l.tmp.height = H;
            }
        }
        if (cover) {
            cover.width = W;
            cover.height = H;
        }
    }

    /** Allocate the scratch layer. Only used while the ink animation runs. */
    function openTmp() {
        for (const l of layers) {
            if (l.tmp) continue;
            const c = document.createElement("canvas");
            c.width = W;
            c.height = H;
            l.wrap.appendChild(c);
            l.tmp = c;
            l.tctx = c.getContext("2d");
        }
    }
    /**
     * Wipe mode: a PAPER-COLOURED cover sits on top and each frame gets
     * `destination-out` with one sprite frame of ink. Wherever the ink eats
     * through, the painting shows.
     *
     * Not CSS `mask-image`, because the sprite is greyscale and image masks
     * read the ALPHA channel by default. That would need `mask-mode:
     * luminance`, only Baseline since 12/2023. In canvas the problem does
     * not arise.
     */
    let cover: HTMLCanvasElement | null = null;
    let cctx: CanvasRenderingContext2D | null = null;

    function openCover() {
        if (cover) return;
        const c = document.createElement("canvas");
        c.className = "bb-cover";
        c.width = W;
        c.height = H;
        host.appendChild(c);
        cover = c;
        cctx = c.getContext("2d");
    }
    function closeCover() {
        if (!cover) return;
        cover.remove();
        cover.width = cover.height = 0;
        cover = null;
        cctx = null;
    }
    function drawCover(prog: number) {
        if (!cctx || !cover || !wipeSheet) return;
        const fw = wipeSheet.width / WIPE_FRAMES;
        const fi = Math.min(
            WIPE_FRAMES - 1,
            Math.floor(prog * WIPE_FRAMES),
        );
        cctx.globalCompositeOperation = "source-over";
        cctx.fillStyle = theme === "dark" ? cfg.paperDark : cfg.paperLight;
        cctx.fillRect(0, 0, W, H);
        cctx.globalCompositeOperation = "destination-out";
        cctx.drawImage(
            wipeSheet,
            fi * fw,
            0,
            fw,
            wipeSheet.height,
            0,
            0,
            W,
            H,
        );
        cctx.globalCompositeOperation = "source-over";
    }

    /** Give the memory back: three full-screen canvases are not small. */
    function closeTmp() {
        for (const l of layers) {
            if (!l.tmp) continue;
            l.tmp.remove();
            l.tmp.width = l.tmp.height = 0;
            l.tmp = null;
            l.tctx = null;
        }
    }

    /** Repaint what is already visible, for theme changes. Strokes still
     *  bleeding get `drawn` reset so the next frame redraws from the ink drop. */
    function repaintAll() {
        for (const l of layers) l.ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < head; i++) {
            const p = queue[i];
            if (!p.blob && active.indexOf(p) >= 0) continue; // still bleeding, the scratch layer has it
            paintFull(byKey[p.depth].ctx, p, colors);
        }
    }

    function rebuild(instant: boolean) {
        sizeUp();
        palette();
        queue = build(W, H, cfg.seed, cfg.density, cfg.shoot, cfg.reveal);
        bleed = cfg.reveal === "ink" ? cfg.bleed : 0;
        const last = queue.length ? queue[queue.length - 1].t : 1;
        total = last + bleed;
        speed = total / cfg.duration;
        head = 0;
        active.length = 0;
        started = 0;
        for (const l of layers) l.ctx.clearRect(0, 0, W, H);
        if (cfg.reveal === "wipe") {
            // the whole painting lands at once; the animation lives in the cover layer
            closeTmp();
            flush(total + 1);
            if (!instant && wipeSheet) {
                openCover();
                drawCover(0);
            }
            return;
        }
        if (instant) {
            closeTmp();
            flush(total + 1);
        } else if (bleed > 0) openTmp();
    }
    /**
     * Advance the animation to time t.
     *
     * In 'ink' mode each stroke starts as a drop where the brush lands and
     * bleeds outward. Canvas only accumulates, so a growing stroke cannot be
     * redrawn: each frame paints only the ANNULUS newly exposed. The annuli
     * are disjoint, so ink never stacks alpha. A 0.2 px overlap is the least
     * that closes the AA seam, measuring 0.005 off a single-pass render
     * against 0.047 at 0.4 px.
     */
    /**
     * Land, soak, pull. The first quarter of the radius barely moves so the
     * drop has time to appear, then it bleeds fast.
     */
    const ease = (x: number) =>
        x < 0.34
            ? 0.1 * (x / 0.34)
            : 0.1 + 0.9 * (1 - Math.pow(1 - (x - 0.34) / 0.66, 2.2));

    function flush(t: number) {
        while (head < queue.length && queue[head].t <= t) {
            const p = queue[head++];
            if (p.blob || bleed <= 0)
                paintFull(byKey[p.depth].ctx, p, colors);
            else active.push(p);
        }
        // Wipe the scratch layer every frame. A bleeding stroke is then drawn
        // FROM SCRATCH rather than accumulated, so there is no annulus seam
        // and no stacked alpha. Measured against a single-pass render: 0.0000
        // off. The annulus route gives 0.0049 and leaves visible arcs.
        // Clear only what is dirty, not three full-screen canvases. At
        // 1600x900, three full clearRects a frame is the loop's cost floor.
        for (const l of layers) {
            if (!l.dirty || !l.tctx) continue;
            l.tctx.clearRect(
                l.d0 - 2,
                l.d1 - 2,
                l.d2 - l.d0 + 4,
                l.d3 - l.d1 + 4,
            );
            l.dirty = false;
            l.d0 = l.d1 = Infinity;
            l.d2 = l.d3 = -Infinity;
        }

        for (let i = active.length - 1; i >= 0; i--) {
            const p = active[i];
            if (p.blob) {
                active.splice(i, 1);
                continue;
            }
            const lay = byKey[p.depth];
            const prog = Math.min(1, (t - p.t) / bleed);

            if (prog >= 1) {
                paintFull(lay.ctx, p, colors); // commit: fill, then punch the dry grain
                active.splice(i, 1);
                continue;
            }
            const tctx = lay.tctx;
            if (!tctx) {
                paintFull(lay.ctx, p, colors);
                active.splice(i, 1);
                continue;
            }
            if (!p.rx || !p.ry) {
                const b = bakeRim(p.maxR, p.rimSeed);
                p.rx = b.rx;
                p.ry = b.ry;
            }
            const rNow = p.blotR + (p.maxR - p.blotR) * ease(prog);

            // The ink drop is a CIRCLE that deliberately spills past the stroke
            // shape, the way a brush tip looks when it first touches paper. It
            // lives only on the scratch layer, so committing leaves no lump.
            const fade = Math.pow(1 - prog, 1.6);
            if (fade > 0.01) {
                const rd = p.blotR * (1.15 + prog * 0.5);
                const c = colors[p.tint];
                const g = tctx.createRadialGradient(
                    p.ox,
                    p.oy,
                    0,
                    p.ox,
                    p.oy,
                    rd * 2.3,
                );
                const ka = p.alpha * fade;
                g.addColorStop(0, `rgba(${c},${ka.toFixed(3)})`);
                g.addColorStop(
                    0.42,
                    `rgba(${c},${(ka * 0.85).toFixed(3)})`,
                );
                g.addColorStop(1, `rgba(${c},0)`); // halo soaking into the paper
                tctx.globalAlpha = 1;
                tctx.fillStyle = g;
                rimPath(tctx, p.ox, p.oy, rd * 2.3, p.rx, p.ry, t * 0.6);
                tctx.fill();
            }

            // The scratch layer has to punch the dry grain EXACTLY as the commit
            // does. Compensating with a mean value is not enough: the punch takes
            // up to 54% on individual dabs, so a whole pale culm segment jumps at
            // once and reads as a flicker.
            tctx.save();
            // Past 82% the bleed rim nearly matches the stroke shape, so drop the
            // polygon clip, the most expensive thing in the loop.
            if (prog < 0.82) {
                rimPath(
                    tctx,
                    p.ox,
                    p.oy,
                    Math.max(rNow, p.blotR),
                    p.rx,
                    p.ry,
                    t,
                );
                tctx.clip();
            }
            fillShape(tctx, p, colors);
            punch(tctx, p);
            tctx.restore();

            // union of the bounding boxes: stroke shape plus the drop spilling past it
            const pad = p.blotR * 2.6;
            const ax0 = Math.min(p.bx, p.ox - pad),
                ay0 = Math.min(p.by, p.oy - pad);
            const ax1 = Math.max(p.bx + p.bw, p.ox + pad),
                ay1 = Math.max(p.by + p.bh, p.oy + pad);
            if (!lay.dirty) {
                lay.d0 = ax0;
                lay.d1 = ay0;
                lay.d2 = ax1;
                lay.d3 = ay1;
            } else {
                if (ax0 < lay.d0) lay.d0 = ax0;
                if (ay0 < lay.d1) lay.d1 = ay0;
                if (ax1 > lay.d2) lay.d2 = ax1;
                if (ay1 > lay.d3) lay.d3 = ay1;
            }
            lay.dirty = true;
        }
    }

    function tick(now: number) {
        if (!started) started = now;
        if (cfg.reveal === "wipe") {
            const prog = (now - started) / 1000 / cfg.duration;
            drawCover(prog);
            if (prog < 1 && visible && !document.hidden)
                raf = requestAnimationFrame(tick);
            else {
                running = false;
                if (prog >= 1) {
                    closeCover();
                    io.disconnect();
                }
            }
            return;
        }
        flush(((now - started) / 1000) * speed);
        const done = head >= queue.length && active.length === 0;
        if (!done && visible && !document.hidden)
            raf = requestAnimationFrame(tick);
        else {
            running = false;
            // Done, and no more JavaScript. CSS handles the wind from here.
            if (done) {
                closeTmp();
                io.disconnect();
            }
        }
    }
    function kick() {
        if (cfg.reveal === "wipe") {
            if (running || !cover) return;
            running = true;
            raf = requestAnimationFrame(tick);
            return;
        }
        if (running || (head >= queue.length && active.length === 0))
            return;
        running = true;
        raf = requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver(
        (e) => {
            visible = e[0].isIntersecting;
            if (visible) kick();
        },
        { rootMargin: "120px" },
    );

    let rt = 0;
    const ro = new ResizeObserver(() => {
        clearTimeout(rt);
        // Redrawing from the start on a resize looks wrong, so build the finished grove directly.
        rt = window.setTimeout(() => rebuild(true), 200);
    });

    const retheme = () => {
        const next: Theme =
            cfg.themeMode === "auto" ? detectTheme() : cfg.themeMode;
        if (next === theme) return;
        theme = next;
        palette();
        repaintAll(); // 20-60 ms, far cheaper than baking two sets of images
    };
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const mo = new MutationObserver(retheme);

    /**
     * Hand the layers over to the CSS fade.
     *
     * The transition needs a computed `opacity: 0` to start from, so the
     * zero has to be flushed before the attribute lands. A forced reflow
     * does that synchronously. Waiting a frame would do it too, but
     * requestAnimationFrame is throttled to a standstill in a tab that
     * boots hidden or at zero size, and the grove would sit at opacity 0
     * with nothing scheduled to bring it back.
     */
    function reveal() {
        for (const l of layers) void l.wrap.offsetWidth;
        host.dataset.bambooPainted = "1";
    }

    function boot() {
        if (cfg.reveal === "wipe" && cfg.animate) {
            // load the sprite first; if it fails, show the finished grove
            loadWipe(cfg.wipeSrc).then(() => {
                rebuild(false);
                reveal();
                kick();
            });
        } else {
            rebuild(!cfg.animate);
            reveal();
        }
        io.observe(host);
        ro.observe(host);
        mq.addEventListener("change", retheme);
        if (cfg.themeMode === "auto")
            mo.observe(document.documentElement, {
                attributes: true,
                attributeFilter: [
                    "class",
                    "data-theme",
                    "data-color-scheme",
                ],
            });
        document.addEventListener("visibilitychange", kick);
    }

    // Deferred until after `load`: the growth animation must not compete for
    // the main thread while the page is still coming up.
    if (document.readyState === "complete") requestAnimationFrame(boot);
    else
        addEventListener("load", () =>
            "requestIdleCallback" in window
                ? requestIdleCallback(boot, { timeout: 400 })
                : setTimeout(boot, 60),
        );

    const inst = {
        destroy() {
            cancelAnimationFrame(raf);
            clearTimeout(rt);
            io.disconnect();
            ro.disconnect();
            mo.disconnect();
            mq.removeEventListener("change", retheme);
            document.removeEventListener("visibilitychange", kick);
            closeTmp();
            closeCover();
            host.replaceChildren();
            instances.delete(inst);
        },
    };
    instances.add(inst);
}

/* The viewport gate lives in BambooBackground.astro, ahead of the dynamic
   import that loads this module -- by the time this code runs, the viewport
   has already been ruled wide enough. Idempotent via [data-bamboo-ready], so
   repeated calls (page loads, a window widening) cannot double-init. */
export function initAll() {
    document
        .querySelectorAll<HTMLElement>(
            "[data-bamboo-canvas]:not([data-bamboo-ready])",
        )
        .forEach(init);
}

document.addEventListener("astro:before-swap", () =>
    instances.forEach((i) => i.destroy()),
);
