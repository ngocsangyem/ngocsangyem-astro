import { describe, expect, it } from 'vitest';
import { buildTimeline, DEMO_TIMING, pastTense, spinDuration, type Turn } from './terminal-demo';

const turn: Turn = {
  prompt: 'npm test',
  tools: ['Ran 1 shell command'],
  verb: 'Cogitating',
  seconds: 4,
  tokens: 312,
  output: ['✓ 41 passed', '✗ 1 failed'],
  done: '4:20 PM',
};

describe('pastTense', () => {
  it('maps the known spinner verbs', () => {
    expect(pastTense('Cogitating')).toBe('Cogitated');
    expect(pastTense('Brewing')).toBe('Brewed');
    expect(pastTense('Churning')).toBe('Churned');
  });

  it('falls back to Worked for anything else', () => {
    expect(pastTense('Pondering')).toBe('Worked');
    expect(pastTense(undefined)).toBe('Worked');
  });
});

describe('spinDuration', () => {
  it('compresses long waits to at most 2s and never below 0.8s', () => {
    expect(spinDuration(52)).toBe(2000);
    expect(spinDuration(1)).toBe(1000);
    expect(spinDuration(0.2)).toBe(800);
    expect(spinDuration(undefined)).toBe(800);
  });
});

describe('buildTimeline', () => {
  it('plays a turn in the scripted order', () => {
    const { steps } = buildTimeline([turn]);
    const kinds = steps.map((step) => step.kind);
    const order = ['type', 'tool', 'spin', 'line', 'done'];
    const firstIndex = order.map((kind) => kinds.indexOf(kind as never));
    expect(firstIndex).toEqual([...firstIndex].sort((a, b) => a - b));
    expect(kinds.at(-1)).toBe('done');
  });

  it('types the prompt one character per tick', () => {
    const { steps } = buildTimeline([turn]);
    const typed = steps.filter((step) => step.kind === 'type');
    expect(typed).toHaveLength(turn.prompt.length);
    expect(typed[1].at - typed[0].at).toBe(DEMO_TIMING.tick);
    expect(typed.at(-1)?.payload).toMatchObject({ text: 'npm test' });
  });

  it('keeps steps in non-decreasing time order', () => {
    const { steps } = buildTimeline([turn, { ...turn, prompt: 'again' }]);
    for (let i = 1; i < steps.length; i += 1) expect(steps[i].at).toBeGreaterThanOrEqual(steps[i - 1].at);
  });

  it('has a known total for a known script', () => {
    const t = DEMO_TIMING;
    const expected =
      turn.prompt.length * t.tick + // typing
      t.pause + // before the tool line
      1 * t.line + // one tool line
      spinDuration(4) + // spinner
      2 * t.line + // two output lines
      t.line + // completion line
      t.hold; // hold before the next turn
    expect(buildTimeline([turn]).total).toBe(expected);
  });

  it('shows the real seconds while playing a compressed wait', () => {
    const { steps } = buildTimeline([{ ...turn, seconds: 52 }]);
    const spin = steps.find((step) => step.kind === 'spin');
    const done = steps.find((step) => step.kind === 'done');
    expect(spin?.payload).toMatchObject({ seconds: 52, duration: 2000 });
    expect(done?.payload).toMatchObject({ text: '✻ Cogitated for 52s · done 4:20 PM' });
  });

  it('handles a turn with no tools, output or done time', () => {
    const { steps } = buildTimeline([{ prompt: 'hi' }]);
    expect(steps.some((step) => step.kind === 'tool' || step.kind === 'line')).toBe(false);
    expect(steps.find((step) => step.kind === 'done')?.payload).toMatchObject({ text: '✻ Worked for 1s' });
  });

  it('places an optional pane after the output', () => {
    const { steps } = buildTimeline([{ ...turn, pane: { title: '⚠ Blast Radius', lines: ['9 files'] } }]);
    const kinds = steps.map((step) => step.kind);
    expect(kinds.indexOf('pane')).toBeGreaterThan(kinds.lastIndexOf('line'));
    expect(kinds.indexOf('pane')).toBeLessThan(kinds.indexOf('done'));
  });
});
