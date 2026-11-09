/**
 * The script of a <TerminalDemo>: pure timing and text, unit-tested. The
 * component renders the final state from the same text helpers, and the
 * runtime in scripts/terminal-demo.ts plays the Step[] built here.
 *
 * The beat follows claude-dev-design.md §Terminal demo script: type the
 * prompt one character per tick, pause, show the tool lines, run the spinner
 * (real seconds shown, wait compressed), print the output line by line, show
 * the completion line, hold, then the next turn.
 */

export type PaneTone = 'blue' | 'cyan' | 'green' | 'magenta' | 'yellow' | 'red';

export interface Pane {
  /** Glyph plus words, e.g. "⚠ Blast Radius". */
  title: string;
  tone?: PaneTone;
  lines?: string[];
  /** Numbered choices, rendered as text: "1: Proceed  2: Cancel". */
  choices?: string[];
}

/** A link printed in the reply, e.g. a profile. */
export interface TurnLink {
  label: string;
  href: string;
  rel?: string;
}

export interface Turn {
  prompt: string;
  /** Collapsed tool calls, e.g. "Read 4 files". */
  tools?: string[];
  /** Present participle for the spinner, e.g. "Cogitating". */
  verb?: string;
  /** Real seconds the work took; shown as-is, played compressed. */
  seconds?: number;
  tokens?: number;
  output?: string[];
  /**
   * Stream each output line one character at a time, in reading order (the
   * browser lays right-to-left scripts out from the right), instead of
   * printing it whole.
   */
  stream?: boolean;
  /** Links printed as one row after the output. */
  links?: TurnLink[];
  /** Clock time for the completion line, e.g. "4:20 PM". */
  done?: string;
  pane?: Pane;
}

export type StepKind = 'type' | 'tool' | 'spin' | 'line' | 'links' | 'pane' | 'done';

export interface Step {
  /** Milliseconds from the start of playback. */
  at: number;
  kind: StepKind;
  turn: number;
  payload: Record<string, unknown>;
}

/**
 * Durations mirroring the motion tokens in tokens.css (--motion-tick 20ms,
 * --motion-line 90ms); pause and hold come from claude-dev-design.md. Change
 * the token and this table together.
 */
export const DEMO_TIMING = {
  tick: 20,
  /** Per character of streamed output: replies arrive faster than typing. */
  stream: 8,
  line: 90,
  pause: 300,
  hold: 2500,
  spinMin: 800,
  spinMax: 2000,
} as const;

const PAST: Record<string, string> = {
  Cogitating: 'Cogitated',
  Brewing: 'Brewed',
  Churning: 'Churned',
  Baking: 'Baked',
  Cooking: 'Cooked',
  Working: 'Worked',
  Thinking: 'Thought',
  Reading: 'Read',
};

export function pastTense(verb: string | undefined): string {
  // Own keys only, so a verb like "constructor" cannot reach Object.prototype.
  return verb && Object.hasOwn(PAST, verb) ? PAST[verb] : 'Worked';
}

/** Played spinner length: the real wait, capped at 2s, never under 0.8s. */
export function spinDuration(seconds: number | undefined): number {
  const real = Math.max(0, seconds ?? 0) * 1000;
  return Math.min(DEMO_TIMING.spinMax, Math.max(DEMO_TIMING.spinMin, real));
}

/** Real seconds as displayed; a turn with no figure says 1s. */
export function displaySeconds(turn: Pick<Turn, 'seconds'>): number {
  return Math.max(1, Math.round(turn.seconds ?? 1));
}

export function doneText(turn: Turn): string {
  const base = `✻ ${pastTense(turn.verb)} for ${displaySeconds(turn)}s`;
  return turn.done ? `${base} · done ${turn.done}` : base;
}

/** The spinner's words at a given shown second, without the glyph. */
export function spinnerText(turn: Pick<Turn, 'verb' | 'tokens'>, shownSeconds: number): string {
  const tokens = turn.tokens === undefined ? '' : ` · ↓ ${turn.tokens} tokens`;
  // An empty verb falls back the same way pastTense does ("Working"/"Worked").
  return `${turn.verb || 'Working'}… (${shownSeconds}s${tokens})`;
}

export function choicesText(choices: string[]): string {
  return choices.map((choice, index) => `${index + 1}: ${choice}`).join('  ');
}

/** Every line a finished turn shows, in order: the transcript for AT. */
export function finalLines(turn: Turn): string[] {
  return [
    `❯ ${turn.prompt}`,
    ...(turn.tools ?? []),
    ...(turn.output ?? []),
    ...(turn.pane
      ? [turn.pane.title, ...(turn.pane.lines ?? []), ...(turn.pane.choices ? [choicesText(turn.pane.choices)] : [])]
      : []),
    doneText(turn),
  ];
}

/**
 * User-perceived characters (grapheme clusters), so a base letter and its
 * combining marks, an emoji sequence, or an Arabic letter with its harakat
 * appear together rather than one code point at a time.
 */
export function graphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (part) => part.segment);
  }
  return Array.from(text);
}

export function buildTimeline(turns: Turn[]): { steps: Step[]; total: number } {
  const t = DEMO_TIMING;
  const steps: Step[] = [];
  let at = 0;

  turns.forEach((turn, index) => {
    for (let i = 1; i <= turn.prompt.length; i += 1) {
      steps.push({ at, kind: 'type', turn: index, payload: { text: turn.prompt.slice(0, i) } });
      at += t.tick;
    }
    at += t.pause;

    for (const tool of turn.tools ?? []) {
      steps.push({ at, kind: 'tool', turn: index, payload: { text: tool } });
      at += t.line;
    }

    const duration = spinDuration(turn.seconds);
    steps.push({ at, kind: 'spin', turn: index, payload: { duration, seconds: displaySeconds(turn) } });
    at += duration;

    for (const line of turn.output ?? []) {
      steps.push({ at, kind: 'line', turn: index, payload: { text: line } });
      at += turn.stream ? graphemes(line).length * t.stream + t.line : t.line;
    }

    if (turn.links?.length) {
      steps.push({ at, kind: 'links', turn: index, payload: {} });
      at += t.line;
    }

    if (turn.pane) {
      steps.push({ at, kind: 'pane', turn: index, payload: {} });
      at += t.line;
    }

    steps.push({ at, kind: 'done', turn: index, payload: { text: doneText(turn) } });
    at += t.line + t.hold;
  });

  return { steps, total: at };
}
