/**
 * One hand-drawn scene per post, keyed by post id. Each draws the post's core
 * idea on a 1600 x 1000 sheet unless SHEETS gives it another shape: ink for structure, the accent hachure for the
 * one thing the post is about, grey for supporting marks. Coordinates are
 * absolute pixels on that sheet.
 */
import { PALETTE } from './rough-canvas.mjs';

/**
 * Sheets that are not the default 16:10, as [width, height] in sheet pixels.
 * A scene takes the shape its idea draws best in: a funnel and a stacked page
 * stand upright, a single page or snippet sits square. The mix is what lets
 * the gallery board stagger.
 */
export const SHEETS = {
  'why-i-built-meowkit': [1200, 1500],
  'multiple-header-and-footer-elements': [1200, 1500],
  'markdown-fundamentals': [1000, 1000],
  'javascript-hoisting': [1000, 1000],
};

const accentFill = { fill: PALETTE.accent };
const mutedStroke = { stroke: PALETTE.muted, strokeWidth: 3.5 };

export const SCENES = {
  // Boxes from four kits funnel into one.
  'why-i-built-meowkit': (c) => {
    const kits = [110, 370, 630, 890];
    for (const x of kits) {
      c.rect(x, 290, 200, 110, mutedStroke);
      c.arrow(x + 100, 430, 600 + (x - 500) * 0.18, 950, mutedStroke);
    }
    c.rect(360, 980, 480, 220, accentFill);
    c.text(600, 1110, 'one kit', { size: 64, anchor: 'middle' });
  },

  // Call stack, web API and microtask queue, with the loop between them.
  'how-async-await-really-works': (c) => {
    c.rect(160, 160, 300, 640);
    c.text(310, 130, 'call stack', { size: 40, anchor: 'middle', color: PALETTE.muted });
    c.rect(200, 640, 220, 110, accentFill);
    c.text(310, 710, 'await', { size: 44, anchor: 'middle' });
    c.rect(640, 160, 800, 260);
    c.text(1040, 130, 'web apis', { size: 40, anchor: 'middle', color: PALETTE.muted });
    c.ellipse(1040, 290, 300, 130, mutedStroke);
    c.text(1040, 305, 'fetch()', { size: 44, anchor: 'middle' });
    c.text(1040, 790, 'microtask queue', { size: 40, anchor: 'middle', color: PALETTE.muted });
    for (const x of [700, 890, 1080, 1270]) c.rect(x, 600, 150, 120, x === 700 ? accentFill : {});
    c.arrow(1040, 440, 1040, 580);
    c.arrow(680, 660, 460, 690);
  },

  // A counter function carrying its little box of state.
  'javascript-closures': (c) => {
    c.rect(180, 170, 1240, 660, mutedStroke);
    c.text(230, 250, 'function counter()', { size: 48, color: PALETTE.muted });
    c.rect(300, 380, 360, 300, accentFill);
    c.text(480, 545, 'count', { size: 60, anchor: 'middle' });
    c.ellipse(1080, 530, 400, 220);
    c.text(1080, 548, 'count += 1', { size: 48, anchor: 'middle' });
    c.arrow(870, 530, 690, 530, { head: 36 });
  },

  // The read happens above the declaration; the "move" is an illusion.
  'javascript-hoisting': (c) => {
    c.rect(100, 100, 800, 800, mutedStroke);
    c.text(170, 250, 'console.log(x)', { size: 56 });
    c.rect(170, 300, 270, 90, accentFill);
    c.text(305, 362, 'undefined', { size: 40, anchor: 'middle' });
    c.text(170, 800, 'var x = 1', { size: 56 });
    c.arrow(330, 730, 330, 420, mutedStroke);
    c.line(260, 530, 400, 620, { stroke: PALETTE.accent, strokeWidth: 6 });
    c.line(400, 530, 260, 620, { stroke: PALETTE.accent, strokeWidth: 6 });
  },

  // One page of every block the renderer knows.
  'markdown-fundamentals': (c) => {
    c.rect(100, 110, 800, 780);
    c.text(170, 220, '# Heading', { size: 56 });
    for (const [y, w] of [[290, 600], [340, 520]]) c.line(170, y, 170 + w, y, mutedStroke);
    c.rect(170, 400, 22, 120, accentFill);
    c.text(220, 450, '[!NOTE]', { size: 40, color: PALETTE.accent });
    c.line(220, 500, 750, 500, mutedStroke);
    c.rect(170, 570, 660, 150, { fill: PALETTE.muted, hachureGap: 26, fillWeight: 1.5 });
    c.text(200, 800, '- [x] done', { size: 40 });
  },

  // A page with sectioning elements, each wearing its own header and footer.
  'multiple-header-and-footer-elements': (c) => {
    c.rect(120, 110, 960, 1280, mutedStroke);
    c.rect(160, 150, 880, 90, accentFill);
    c.text(200, 210, '<header>', { size: 40 });
    for (const y of [300, 790]) {
      c.rect(180, y, 840, 430);
      c.rect(210, y + 30, 780, 80, accentFill);
      c.rect(210, y + 320, 780, 80);
      c.text(240, y + 377, '<footer>', { size: 36, color: PALETTE.muted });
    }
    c.text(600, 1300, '<article> × 2', { size: 40, anchor: 'middle', color: PALETTE.muted });
  },

  // An object, its method, and the copy that keeps pointing at the original.
  'object-dot-notation': (c) => {
    c.rect(170, 220, 520, 480, accentFill);
    c.text(430, 190, 'user', { size: 52, anchor: 'middle' });
    c.text(220, 380, 'name', { size: 48 });
    c.text(220, 470, 'score', { size: 48 });
    c.text(220, 600, '.addPoint()', { size: 48 });
    c.rect(910, 220, 520, 480, mutedStroke);
    c.text(1170, 190, 'copy', { size: 52, anchor: 'middle', color: PALETTE.muted });
    c.arrow(720, 460, 880, 460, mutedStroke);
    c.path('M 1150 600 C 1050 860, 600 860, 480 640', { stroke: PALETTE.accent, strokeWidth: 5 });
  },

  // A laptop running the install steps, one prompt at a time.
  'set-up-jekyll-on-macos': (c) => {
    c.rect(300, 130, 1000, 620);
    c.rect(340, 170, 920, 540, { fill: PALETTE.muted, hachureGap: 30, fillWeight: 1.5 });
    c.path('M 180 770 L 1420 770 L 1340 860 L 260 860 Z');
    const lines = ['$ brew install rbenv', '$ gem install bundler', '$ jekyll serve'];
    lines.forEach((line, i) => {
      c.rect(380, 230 + i * 150, 840, 100, i === 2 ? accentFill : { fill: PALETTE.paper, fillStyle: 'solid' });
      c.text(420, 297 + i * 150, line, { size: 44 });
    });
  },

  // Two script blocks in one file: one runs once, one runs per instance.
  'vue-script-setup-tradeoffs': (c) => {
    c.rect(170, 140, 640, 720, mutedStroke);
    c.text(210, 110, 'Component.vue', { size: 40, color: PALETTE.muted });
    c.rect(220, 200, 540, 240);
    c.text(260, 290, '<script>', { size: 48 });
    c.rect(220, 520, 540, 280, accentFill);
    c.text(260, 610, '<script setup>', { size: 48 });
    c.ellipse(1180, 320, 300, 150);
    c.text(1180, 337, 'once', { size: 48, anchor: 'middle' });
    c.arrow(790, 320, 1010, 320);
    for (const [i, y] of [560, 680, 800].entries()) {
      c.rect(1060 + i * 30, y - 60, 240, 90, mutedStroke);
    }
    c.arrow(790, 660, 1040, 660);
  },
};
