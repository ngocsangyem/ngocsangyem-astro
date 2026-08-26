/**
 * Bamboo grove geometry.
 *
 * compose() draws nothing. It calls emit() once per stroke with a centreline,
 * a width profile, a layer and a timestamp. The backend decides whether that
 * becomes a brush stamp, an SVG path or a mask.
 */

export type LayerKey =
    | 'far'
    | 'midCulm'
    | 'midLeaf'
    | 'frontCulm'
    | 'frontLeaf'
    | 'shootColor'
    | 'shootLine';

export type Density = 'sparse' | 'normal' | 'dense';
export type Pigment = 'hoe' | 'son';
export type Pt = readonly [number, number];

/** Strokes that have a centreline: culms, nodes, branches, leaves, shoot edges and sheaths. */
export interface PathStroke {
    kind: 'culm' | 'node' | 'branch' | 'leaf' | 'shootEdge' | 'shootSheath';
    layer: LayerKey;
    path: (t: number) => Pt;
    width: (t: number) => number;
    alpha: (t: number) => number;
    t0: number;
    dur: number;
    seed: number;
    dryness: number;
    /** Culms only. An SVG backend needs it to join the segments into one path. */
    culmId?: string;
}

/** Shapeless washes: morning mist, and the shoot's colour block. */
export interface BlobStroke {
    kind: 'mist';
    layer: LayerKey;
    x: number;
    y: number;
    r: number;
    alpha: number;
    t0: number;
    dur: number;
    pigment?: Pigment;
}

export type Stroke = PathStroke | BlobStroke;

export interface ComposeOptions {
    W: number;
    H: number;
    seed?: number;
    density?: Density;
    shoot?: boolean;
    emit: (s: Stroke) => void;
}

export interface ComposeResult {
    /** Latest timestamp in the scene. */
    total: number;
    /** Foot of each clump, where the first drop of ink belongs. */
    roots: Pt[];
}

interface Clump {
    x: number;
    n: number;
    w: number;
    ink: number;
    dry: number;
    top: number;
    lo: number;
    hi: number;
    band: 'front' | 'mid' | 'far';
    leafBelow?: number;
}

interface CulmNode {
    x: number;
    y: number;
    w: number;
    side: number;
    t: number;
}

const DENSITY: Record<Density, Clump[]> = {
    sparse: [
        { x: 0.52, n: 3, w: 0.034, ink: 0.225, dry: 0.46, top: -0.06, lo: -0.5, hi: 1.0, band: 'front' },
        { x: 0.86, n: 2, w: 0.024, ink: 0.13, dry: 0.54, top: 0.08, lo: -0.6, hi: 0.9, band: 'mid' },
        { x: 0.085, n: 1, w: 0.028, ink: 0.19, dry: 0.5, top: -0.12, lo: -1.0, hi: -0.55, band: 'mid', leafBelow: 0.26 },
    ],
    normal: [
        { x: 0.455, n: 4, w: 0.037, ink: 0.235, dry: 0.44, top: -0.1, lo: -0.55, hi: 1.0, band: 'front' },
        { x: 0.815, n: 3, w: 0.026, ink: 0.145, dry: 0.52, top: 0.02, lo: -0.85, hi: 0.95, band: 'mid' },
        { x: 0.975, n: 2, w: 0.016, ink: 0.055, dry: 0.66, top: 0.26, lo: 0.1, hi: 1.0, band: 'far' },
        { x: 0.075, n: 2, w: 0.031, ink: 0.2, dry: 0.48, top: -0.14, lo: -1.0, hi: -0.1, band: 'mid', leafBelow: 0.26 },
    ],
    dense: [
        { x: 0.3, n: 4, w: 0.036, ink: 0.235, dry: 0.44, top: -0.12, lo: -0.9, hi: 0.8, band: 'front' },
        { x: 0.66, n: 4, w: 0.03, ink: 0.175, dry: 0.48, top: -0.04, lo: -0.9, hi: 1.0, band: 'mid' },
        { x: 0.93, n: 3, w: 0.02, ink: 0.075, dry: 0.62, top: 0.18, lo: -0.4, hi: 1.0, band: 'far' },
        { x: 0.055, n: 2, w: 0.03, ink: 0.21, dry: 0.48, top: -0.16, lo: -1.0, hi: -0.2, band: 'mid', leafBelow: 0.22 },
    ],
};

export const LAYERS: LayerKey[] = [
    'far',
    'midCulm',
    'midLeaf',
    'frontCulm',
    'frontLeaf',
    'shootColor',
    'shootLine',
];

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export function mulberry32(a: number): () => number {
    return function (): number {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** 1D value noise, for dry-brush grain. */
export function n1(x: number): number {
    const i = Math.floor(x);
    const f = x - i;
    const s = f * f * (3 - 2 * f);
    const h = (k: number): number => {
        let t = Math.imul(k ^ 0x9e3779b9, 0x85ebca6b);
        t ^= t >>> 13;
        return ((t >>> 0) % 1000) / 1000;
    };
    return lerp(h(i), h(i + 1), s);
}

export function compose({
    W,
    H,
    seed = 19540507,
    density = 'normal',
    shoot = true,
    emit,
}: ComposeOptions): ComposeResult {
    const rnd = mulberry32(seed);
    const S = Math.min(W, H * 1.15);
    const bui = DENSITY[density] ?? DENSITY.normal;
    const roots: Pt[] = [];
    let total = 0;

    const push = (s: Stroke): void => {
        total = Math.max(total, s.t0 + s.dur);
        emit(s);
    };

    // morning mist over the field
    for (let i = 0; i < 5; i++) {
        push({
            kind: 'mist',
            layer: 'far',
            x: rnd() * W,
            y: H * (0.34 + rnd() * 0.5),
            r: S * (0.26 + rnd() * 0.22),
            alpha: 0.007 + rnd() * 0.006,
            t0: 0.05 + i * 0.02,
            dur: 0,
        });
    }

    interface Built {
        B: Clump;
        bi: number;
        j: number;
        nodes: CulmNode[];
        cw: number;
        ik: number;
        culmLayer: LayerKey;
        leafLayer: LayerKey;
    }
    const built: Built[] = [];

    bui.forEach((B, bi) => {
        const xb = W * B.x;
        roots.push([xb, H * 0.99] as const);

        for (let j = 0; j < B.n; j++) {
            const dir = lerp(B.lo, B.hi, B.n === 1 ? 0.5 : j / (B.n - 1)) + (rnd() - 0.5) * 0.28;
            const ik = B.ink * (0.74 + 0.52 * rnd());
            const cw = S * B.w * (0.78 + rnd() * 0.44);
            const yB = H * 1.06;
            const yT = H * (B.top + rnd() * 0.14) - Math.abs(dir) * H * 0.06;
            const x0 = xb + dir * S * 0.045 + (rnd() - 0.5) * S * 0.02;
            const arch = dir * S * (0.17 + rnd() * 0.15);
            const bend = (rnd() - 0.5) * S * 0.05;
            const ph = rnd() * 6.28;
            const px = (yy: number): number => {
                const f = (yB - yy) / (yB - yT);
                return x0 + arch * Math.pow(Math.max(0, f), 1.8) + bend * Math.sin(f * 2.0 + ph);
            };

            const culmLayer: LayerKey = B.band === 'far' ? 'far' : B.band === 'mid' ? 'midCulm' : 'frontCulm';
            const leafLayer: LayerKey = B.band === 'far' ? 'far' : B.band === 'mid' ? 'midLeaf' : 'frontLeaf';

            const rate = H / 0.8;
            let tCur = 0.02 + rnd() * 0.2;
            let grown = 0;
            const segs = 4 + Math.floor(rnd() * 3);
            const nodes: CulmNode[] = [];
            let y = yB;

            for (let s = 0; s < segs; s++) {
                const len = ((yB - yT) / segs) * (0.86 + rnd() * 0.3);
                const y1 = Math.max(yT, y - len);
                const f0 = 1 - (yB - y) / (yB - yT);
                const f1 = 1 - (yB - y1) / (yB - yT);
                const w0 = cw * (0.6 + 0.4 * f0);
                const w1 = cw * (0.6 + 0.4 * f1);
                const gap = cw * 0.28;
                const ya = y - gap;
                const yb2 = y1 + gap * 0.4;
                const bow = (rnd() - 0.5) * cw * 0.3;

                const segLen = Math.max(1, ya - yb2);
                const hf = grown / Math.max(1, yB - yT);
                const segDur = (segLen / rate) * (1 + 0.5 * hf);

                push({
                    kind: 'culm',
                    layer: culmLayer,
                    culmId: `${bi}-${j}`,
                    path: (t) => {
                        const yy = lerp(ya, yb2, t);
                        return [px(yy) + bow * Math.sin(Math.PI * t), yy] as const;
                    },
                    width: (t) => lerp(w0, w1, t) * (0.9 + 0.12 * Math.sin(Math.PI * t)),
                    alpha: (t) => ik * (0.72 + 0.5 * Math.min(1, t * 7)) * (1 - 0.18 * t),
                    t0: tCur,
                    dur: segDur,
                    seed: bi * 29 + j * 7 + s,
                    dryness: B.dry,
                });
                tCur += segDur;
                grown += segLen;
                nodes.push({ y: yb2, x: px(yb2), w: w1, side: dir >= 0 ? 1 : -1, t: tCur });
                y = y1;
                if (y1 <= yT) break;
            }

            nodes.forEach((n, k) => {
                const hw = n.w * 0.62;
                push({
                    kind: 'node',
                    layer: culmLayer,
                    path: (t) => [n.x - hw + 2 * hw * t, n.y + n.w * 0.1 - Math.sin(Math.PI * t) * n.w * 0.14] as const,
                    width: () => n.w * 0.34,
                    alpha: () => ik * 1.25,
                    t0: n.t + 0.02,
                    dur: 0.05,
                    seed: bi * 61 + j * 11 + k,
                    dryness: 0.25,
                });
            });

            built.push({ B, bi, j, nodes, cw, ik, culmLayer, leafLayer });
        }
    });

    built.forEach(({ B, bi, j, nodes, cw, ik, culmLayer, leafLayer }) => {
        if (B.ink < 0.08 && rnd() < 0.45) return;

        nodes.forEach((n, k) => {
            if (rnd() < 0.1) return;
            if (B.leafBelow !== undefined && n.y < H * B.leafBelow) return;

            const side = rnd() < 0.42 ? -n.side : n.side;
            const bl = cw * (1.6 + rnd() * 3.0);
            const ang = side * (0.9 + rnd() * 0.5);
            const bx = n.x;
            const by = n.y - cw * 0.1;
            const ex = bx + Math.sin(ang) * bl;
            const ey = by - Math.cos(ang) * bl + bl * 0.12;
            const mx = (bx + ex) / 2 - side * bl * 0.1;
            const my = (by + ey) / 2 - bl * 0.18;

            const bT0 = n.t + 0.28 + rnd() * 0.48;
            const bDur = 0.2 + (bl / W) * 0.22;

            push({
                kind: 'branch',
                layer: culmLayer,
                path: (t) => {
                    const u = 1 - t;
                    return [
                        u * u * bx + 2 * u * t * mx + t * t * ex,
                        u * u * by + 2 * u * t * my + t * t * ey,
                    ] as const;
                },
                width: (t) => cw * 0.26 * Math.min(1, t * 9) * Math.pow(1 - t, 0.7),
                alpha: () => ik * 1.05,
                t0: bT0,
                dur: bDur,
                seed: bi * 83 + j * 13 + k,
                dryness: 0.28,
            });

            const clusters: { t: number; n: number }[] = [{ t: 1.0, n: 4 + Math.floor(rnd() * 3) }];
            if (rnd() < 0.85) clusters.push({ t: 0.58, n: 3 + Math.floor(rnd() * 3) });
            if (rnd() < 0.5) clusters.push({ t: 0.32, n: 2 + Math.floor(rnd() * 2) });

            clusters.forEach((cl, ci2) => {
                const u = 1 - cl.t;
                const ax = u * u * bx + 2 * u * cl.t * mx + cl.t * cl.t * ex;
                const ay = u * u * by + 2 * u * cl.t * my + cl.t * cl.t * ey;
                const clStart = bT0 + bDur * cl.t + 0.05;

                for (let i = 0; i < cl.n; i++) {
                    const spread = (i - (cl.n - 1) / 2) * 0.44 + (rnd() - 0.5) * 0.2;
                    const la = ang + spread + side * 0.38;
                    const ll = cw * (1.5 + rnd() * 2.5);
                    const droop = ll * (0.34 + rnd() * 0.4);
                    const lx = ax + Math.sin(la) * ll;
                    const ly = ay - Math.cos(la) * ll + droop;
                    const cx = (ax + lx) / 2 + Math.sin(la + 1.57) * ll * 0.16;
                    const cy = (ay + ly) / 2 + Math.cos(la + 1.57) * ll * 0.16;
                    const lw = cw * (0.18 + rnd() * 0.12);

                    push({
                        kind: 'leaf',
                        layer: leafLayer,
                        path: (t) => {
                            const v = 1 - t;
                            return [
                                v * v * ax + 2 * v * t * cx + t * t * lx,
                                v * v * ay + 2 * v * t * cy + t * t * ly,
                            ] as const;
                        },
                        width: (t) => lw * Math.min(1, t * 5.5) * Math.pow(1 - t, 1.35) * 1.6,
                        alpha: (t) => ik * (1.15 - 0.35 * t),
                        t0: clStart + i * 0.05,
                        dur: 0.1 + (ll / W) * 0.14,
                        seed: bi * 151 + j * 17 + k * 7 + i + ci2 * 3,
                        dryness: 0.34,
                    });
                }
            });
        });
    });

    if (shoot) {
        const t0 = total + 0.15;
        const mx0 = W * bui[0].x - S * (0.1 + rnd() * 0.06);
        const mh = H * (0.21 + rnd() * 0.06);
        const mw = S * 0.042;
        mang(push, mx0, H * 0.99, mh, mw, t0, 1);
        if (rnd() < 0.75) mang(push, mx0 - mw * 2.4, H * 1.01, mh * 0.6, mw * 0.76, t0 + 0.08, -1);
    }

    return { total, roots };
}

/** Shoot: colour block prints first, linework second, always a little off register. */
function mang(
    push: (s: Stroke) => void,
    x0: number,
    yBase: number,
    h: number,
    hw: number,
    t0: number,
    tilt: number
): void {
    const tipX = x0 + tilt * hw * 0.55;
    const tipY = yBase - h;

    const edge =
        (s: number) =>
            (t: number): Pt => {
                const y = lerp(yBase, tipY, t);
                const wdt = hw * Math.pow(1 - t, 0.72);
                const cx = lerp(x0, tipX, t) + Math.sin(t * 2.1) * hw * 0.12 * tilt;
                return [cx + s * wdt, y] as const;
            };

    let t = t0;
    const rows = 13;
    for (let i = 0; i < rows; i++) {
        const f = i / (rows - 1);
        const y = lerp(yBase, tipY, f);
        const wdt = hw * Math.pow(1 - f, 0.72) * 0.92;
        const cx = lerp(x0, tipX, f) + Math.sin(f * 2.1) * hw * 0.12 * tilt;
        const per = Math.max(1, Math.round(wdt / (hw * 0.3)));
        for (let k = 0; k < per; k++) {
            const u = per === 1 ? 0 : (k / (per - 1)) * 2 - 1;
            push({
                kind: 'mist',
                layer: 'shootColor',
                pigment: f > 0.7 && k === 0 ? 'son' : 'hoe',
                x: cx + u * wdt * 0.7,
                y,
                r: Math.max(3, wdt * 0.62),
                alpha: 0.19,
                t0: t + f * 0.2,
                dur: 0,
            });
        }
    }
    t += 0.26;

    for (const [s, sd] of [
        [-1, 911],
        [1, 912],
    ] as const) {
        push({
            kind: 'shootEdge',
            layer: 'shootLine',
            path: edge(s),
            width: (tt) => hw * 0.2 * Math.min(1, tt * 8) * Math.pow(1 - tt, 0.35),
            alpha: () => 0.34,
            t0: t,
            dur: 0.12,
            seed: sd,
            dryness: 0.3,
        });
        t += 0.15;
    }

    for (let i = 0; i < 4; i++) {
        const f = 0.14 + i * 0.19;
        const L = edge(-1)(f);
        const R = edge(1)(f);
        const sag = hw * 0.3 * (1 - f);
        push({
            kind: 'shootSheath',
            layer: 'shootLine',
            path: (tt) => {
                const u = 1 - tt;
                const mxp = (L[0] + R[0]) / 2;
                const myp = (L[1] + R[1]) / 2 + sag;
                return [
                    u * u * L[0] + 2 * u * tt * mxp + tt * tt * R[0],
                    u * u * L[1] + 2 * u * tt * myp + tt * tt * R[1],
                ] as const;
            },
            width: () => hw * 0.14 * (1 - f * 0.4),
            alpha: () => 0.29,
            t0: t,
            dur: 0.05,
            seed: 920 + i,
            dryness: 0.35,
        });
        t += 0.065;
    }
}
