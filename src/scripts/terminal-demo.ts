/**
 * Plays every <TerminalDemo> on the page. The server rendered the finished
 * session with each line stamped `data-at` (ms from the start), so playback
 * is one question asked every frame: what is visible at elapsed time t?
 * Pausing freezes t, replaying resets it, and nothing is rebuilt.
 *
 * Starts when half the frame is in view (unless `autoplay` is false), pauses
 * off-screen and in a hidden tab, and remembers a reader's own pause.
 * Reduced motion: no player at all; the finished session stays as rendered.
 */
import { DEMO_TIMING, spinnerText } from '../lib/terminal-demo';

const SPIN_FRAMES = ['·', '✢', '✳', '✶', '✻', '✽'];
/** Mirrors --spinner-frame in tokens.css; change both together. */
const SPIN_FRAME_MS = 110;
/** A frame gap longer than this is a stall, not reading time; never skip ahead. */
const MAX_FRAME_GAP = 100;

/** Ping-pong through the spinner glyphs: · ✢ ✳ ✶ ✻ ✽ ✻ ✶ ✳ ✢ · … */
function spinGlyph(elapsedInSpin: number): string {
  const cycle = SPIN_FRAMES.length * 2 - 2;
  const step = Math.floor(elapsedInSpin / SPIN_FRAME_MS) % cycle;
  return SPIN_FRAMES[step < SPIN_FRAMES.length ? step : cycle - step];
}

function setup(root: HTMLElement): void {
  const stage = root.querySelector<HTMLElement>('[data-stage]');
  const frameEl = root.querySelector<HTMLElement>('[data-frame]') ?? root;
  const control = root.querySelector<HTMLButtonElement>('[data-demo-control]');
  const status = root.querySelector<HTMLElement>('[data-demo-status]');
  if (!stage || !control) return;

  const total = Number(root.dataset.total) || 0;
  // Spinners own their visibility (a window, not a start time), so they are
  // left out of the plain show-from-t pass.
  const timed = [...stage.querySelectorAll<HTMLElement>('[data-at]:not([data-spin])')];
  const typed = [...stage.querySelectorAll<HTMLElement>('[data-type]')];
  const spinners = [...stage.querySelectorAll<HTMLElement>('[data-spin]')];

  const autoplay = root.dataset.autoplay !== 'false';
  let started = false;
  let elapsed = total; // the rendered state is the finished one
  let playing = false;
  let userPaused = false;
  let inView = false;
  let last = 0;
  let frame = 0;

  /** The whole visible state as a function of t; writes only what changed. */
  function render(t: number): void {
    for (const el of timed) {
      const hidden = Number(el.dataset.at) > t;
      if (el.hidden !== hidden) el.hidden = hidden;
    }
    for (const el of typed) {
      const row = el.closest<HTMLElement>('[data-at]');
      const start = Number(row?.dataset.at ?? 0);
      // By code point, so a character outside the BMP is never split mid-frame.
      const full = Array.from(el.dataset.type ?? '');
      const chars = Math.max(0, Math.min(full.length, Math.floor((t - start) / DEMO_TIMING.tick) + 1));
      const text = full.slice(0, chars).join('');
      if (el.textContent !== text) el.textContent = text;
    }
    for (const el of spinners) {
      const start = Number(el.dataset.at);
      const duration = Number(el.dataset.duration);
      const active = t >= start && t < start + duration;
      if (el.hidden === active) el.hidden = !active;
      if (!active) continue;
      // The real seconds count up across the compressed wait.
      const seconds = Number(el.dataset.seconds);
      const shown = Math.max(1, Math.ceil(((t - start) / duration) * seconds));
      const tokens = el.dataset.tokens ? Number(el.dataset.tokens) : undefined;
      const glyph = el.querySelector('[data-spin-glyph]');
      const words = el.querySelector('[data-spin-text]');
      if (glyph) glyph.textContent = spinGlyph(t - start);
      if (words) words.textContent = spinnerText({ verb: el.dataset.verb, tokens }, shown);
    }
  }

  function label(): void {
    control!.textContent = playing ? 'Pause' : elapsed >= total ? 'Replay' : 'Play';
  }

  function tick(now: number): void {
    if (!playing) return;
    elapsed = Math.min(total, elapsed + Math.min(now - last, MAX_FRAME_GAP));
    last = now;
    render(elapsed);
    if (elapsed >= total) {
      playing = false;
      label();
      if (status) status.textContent = 'Demo finished';
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  function play(): void {
    if (playing) return;
    started = true;
    if (elapsed >= total) {
      elapsed = 0;
      if (status) status.textContent = '';
    }
    playing = true;
    last = performance.now();
    label();
    frame = requestAnimationFrame(tick);
  }

  function pause(): void {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(frame);
    label();
  }

  /*
   * Hold the finished height so the page never shifts while lines appear.
   * Measured on the finished state in one task (no paint in between), and
   * again once fonts have swapped in and whenever the width changes, since
   * long lines wrap differently.
   */
  function reserveHeight(): void {
    stage!.style.minBlockSize = '';
    render(total);
    stage!.style.minBlockSize = `${stage!.getBoundingClientRect().height}px`;
    render(elapsed);
  }
  reserveHeight();
  void document.fonts?.ready.then(reserveHeight);
  let lastWidth = stage.getBoundingClientRect().width;
  new ResizeObserver(() => {
    const width = stage!.getBoundingClientRect().width;
    if (width === lastWidth) return;
    lastWidth = width;
    reserveHeight();
  }).observe(stage);

  // An autoplay demo starts empty, so the finished transcript is never wiped
  // in front of the reader when playback begins.
  if (autoplay) {
    elapsed = 0;
    render(0);
  }

  control.addEventListener('click', () => {
    if (playing) {
      userPaused = true;
      pause();
    } else {
      userPaused = false;
      play();
    }
  });


  /*
   * "In view" means half the frame, or half the viewport for a frame taller
   * than two screens, which could otherwise never reach the 0.5 ratio.
   */
  new IntersectionObserver(
    ([entry]) => {
      const viewport = entry.rootBounds?.height ?? window.innerHeight;
      inView = entry.intersectionRatio >= 0.5 || entry.intersectionRect.height >= viewport / 2;
      if (!inView) return pause();
      if (userPaused) return;
      if (!started && autoplay) {
        play();
      } else if (started && elapsed < total) {
        play();
      }
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  ).observe(frameEl);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else if (inView && started && !userPaused && elapsed < total) play();
  });

  control.hidden = false;
  label();
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  for (const root of document.querySelectorAll<HTMLElement>('[data-terminal-demo]')) setup(root);
}
