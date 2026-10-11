// The demo ad's director. Plays every part of the ad in the studio page (tools/video/studio.html)
// with the game in the iPhone frame, frame by frame under Playwright's fake clock, so the video is
// perfectly smooth on any machine. Writes out/frames/*.jpg, out/timeline.json (narration cues and
// every in-game sound, for the mix) and out/report.png (the PDF report page shown in part 9).
//
//   npm run dev -- --port 5174          (the dev server: the recorder uses its dev-only hooks)
//   node tools/video/record.mjs         (FPS=30 default; FPS=10 for a quick preview)
//
// Then: python3 tools/video/mix.py && bash tools/video/render.sh   (or just tools/video/make.sh)
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIND, FIND_IMAGES, FORWARD, SCENES, SETUP } from './lib.mjs';

const require = createRequire(import.meta.url);
let pw;
try {
  pw = require('playwright');
} catch {
  pw = require(process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright');
}

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
const GAME = process.env.GAME || 'http://localhost:5174';
const FPS = Number(process.env.FPS || 30);
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null; // record some parts only
// TAG names this run's outputs (out/frames-<TAG>, out/timeline-<TAG>.json) so two halves can render
// in parallel; T0 continues the studio's clock (background drift) from where the previous half ended.
const TAG = process.env.TAG || 'full';
const T0 = Number(process.env.T0 || 0);
const FRAMES = join(OUT, `frames-${TAG}`);
const SCRIPT = JSON.parse(readFileSync(join(HERE, 'script.json'), 'utf8'));
const VO = JSON.parse(readFileSync(join(HERE, 'assets', 'vo.json'), 'utf8'));
const SEG = Object.fromEntries(SCRIPT.segments.map((s) => [s.id, s]));

rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });

const browser = await pw.chromium.launch({ args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await context.clock.install({ time: new Date('2026-10-11T09:41:00+05:30') });
// Mute the dev server's hot-reload socket: an edited file must not reload the page mid-recording.
await context.routeWebSocket(/.*/, () => {});
const page = await context.newPage();
const cdp = await context.newCDPSession(page); // direct frame capture: faster than page.screenshot
page.on('pageerror', (e) => console.error('  [page error]', e.message));
page.on('console', (m) => {
  if (m.type() === 'error' && !/GL Driver|WebGL/.test(m.text())) console.error('  [console]', m.text().slice(0, 300));
});
await page.goto(`${GAME}/tools/video/studio.html`, { waitUntil: 'load' });
await page.evaluate((src) => window.studio.loadGame(src), `${GAME}/?seed=8`);
await context.clock.resume(); // real time while everything boots
await page.waitForTimeout(6000);
await page.evaluate(() => document.fonts.ready);
const game = page.frames().find((f) => f.url().includes('seed=8'));
if (!game) throw new Error('game iframe not found');
await game.waitForFunction(() => globalThis.__lmGame && globalThis.__lmSession && globalThis.__lmRoute, null, { timeout: 30000 });
await game.waitForFunction(() => globalThis.__lmGame.scene.isActive('Title'), null, { timeout: 30000 });
await game.evaluate(() => {
  globalThis.__lmTaps = [];
  globalThis.__lmAudioTap = (k, n) => globalThis.__lmTaps.push({ k, n });
  try { localStorage.clear(); } catch { /* fine */ }
});
await context.clock.pauseAt(new Date('2026-10-11T09:45:00+05:30'));

// ---------------------------------------------------------------------------------------------
// Time: `rec` captures frames (video time moves); `off` lets the game run unseen (it doesn't).
// ---------------------------------------------------------------------------------------------
let frame = 0;
const vt = () => frame / FPS;
const timeline = [];
let voEnd = 0;
const studio = (fn, ...args) => page.evaluate(([f, a]) => window.studio[f](...a), [fn, args]);

async function step(capture) {
  await context.clock.runFor(1000 / FPS);
  const taps = await game.evaluate(() => (globalThis.__lmTaps || []).splice(0));
  if (!capture) return;
  for (const t of taps) timeline.push({ t: vt(), k: t.k, n: t.n });
  await page.evaluate((t) => window.studio.frame(t), T0 + vt());
  const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93, optimizeForSpeed: true });
  writeFileSync(join(FRAMES, `${String(frame).padStart(6, '0')}.jpg`), Buffer.from(shot.data, 'base64'));
  frame += 1;
  if (frame % (FPS * 5) === 0) process.stdout.write(`  ${vt().toFixed(0)}s`);
}
const rec = async (sec) => { for (let i = 0, n = Math.round(sec * FPS); i < n; i++) await step(true); };
const off = async (sec) => { for (let i = 0, n = Math.round(sec * FPS); i < n; i++) await step(false); };
async function until(test, max = 8, capture = true) {
  for (let i = 0; i < max * FPS; i++) {
    if (i % 3 === 0 && (await test())) return true;
    await step(capture);
  }
  console.warn(`\n  ! waited ${max}s for a condition`);
  return false;
}
const scenes = () => game.evaluate(`(${SCENES})()`);
const onScene = (key) => async () => (await scenes()).includes(key);
const offScene = (key) => async () => !(await scenes()).includes(key);
const find = (re, flags = '', minAlpha = 0.05) =>
  game.evaluate(`(${FIND})(${JSON.stringify(re)}, ${JSON.stringify(flags)}, ${minAlpha})`);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Tap a label (exact text, or a regex string) or a {x, y} point; ripple in the studio; then hold. */
async function tap(target, hold = 0.6, { regex = false, capture = true } = {}) {
  let hit = target;
  if (typeof target === 'string') {
    // wait (filming) until the label is fully faded in, so the tap lands on a live button
    const re = regex ? target : `^${esc(target)}$`;
    let found = [];
    for (let i = 0; i < 8 * FPS; i++) {
      found = await find(re, '', 0.5); // dimmed-but-live buttons (language toggle) count; a fading-in map doesn't
      if (found.length) break;
      await step(capture);
    }
    if (!found.length) throw new Error(`tap: "${target}" not on screen (scenes: ${await scenes()})`);
    hit = found[0];
  }
  const box = await game.locator('canvas').boundingBox();
  if (capture) await studio('tap', hit.x, hit.y);
  await page.mouse.click(box.x + (hit.x * box.width) / 360, box.y + (hit.y * box.height) / 640);
  if (capture) await rec(hold);
  else await off(hold);
}
async function typeText(s) {
  await game.locator('input').first().click();
  for (const ch of s) {
    await page.keyboard.type(ch);
    await rec(0.12);
  }
}
/** Start a narration cue now (or `offset` seconds from now) with its captions. */
async function vo(cue, { offset = 0, captions = true } = {}) {
  const v = VO[cue];
  if (!v) throw new Error(`no narration cue ${cue}; run narrate.py`);
  const t = vt() + offset;
  timeline.push({ t, k: 'vo', n: cue });
  if (captions) await studio('captions', v.lines.filter((l) => l.show).map((l) => ({ text: l.show, start: T0 + t + l.start, end: T0 + t + l.end })));
  voEnd = Math.max(voEnd, t + v.dur);
}
const voDone = async (pad = 0.3) => { while (vt() < voEnd + pad) await step(true); };
/** Cut between shots: pixel blocks cover the screen, the game changes unseen, blocks clear. */
async function cut(work, color = '#0b0d1c') {
  await studio('wipeIn', 0.3, color);
  await rec(0.34);
  await work();
  await studio('wipeOut', 0.36);
  await rec(0.2);
}
/** A new part: side panel swaps; the game is set up for it behind a cut. */
async function part(id, setup) {
  const s = SEG[id];
  timeline.push({ t: vt(), k: 'part', n: id });
  await studio('segment', { n: s.n, title: s.title, pillar: s.pillar, measures: s.measures, line: s.line, color: s.color, night: id === 'police' });
  if (setup) await cut(setup);
}
async function setup(spec) {
  const r = await game.evaluate(`(${SETUP})(${JSON.stringify(spec)})`);
  await off(0.6);
  if (process.env.DEBUG) console.log('\n  setup', JSON.stringify(r), '→', await scenes());
  return r;
}
const profile = (persona, difficulty, avatar = 'avatar_girl_1') => ({
  nickname: 'Riya', lang: 'en', avatar, persona, difficulty, pocketMoneyMonthly: 2000,
  flags: ['has_bank_account', 'upi_own'], quizBefore: 2, quizBeforeAnswers: [0, 0, 0, 0, 0],
});
/** Battle choice by its exact button text; the Professor's line and the bars play out. */
const choose = (label, hold = 2.6) => tap(label, hold);
const next = (hold = 0.8) => tap('^NEXT', hold, { regex: true });
const enterLandmark = async () => {
  await until(onScene('Landmark'), 8);
  await rec(0.6);
  await tap('^PLAY MISSION', 0.4, { regex: true });
  await until(onScene('Battle'), 6);
};

// ---------------------------------------------------------------------------------------------
// The parts. Times in comments are targets; narration length decides the rest.
// ---------------------------------------------------------------------------------------------
const PARTS = {
  // 0:00 — cold open: the 27% stat, the question, the title; the phone rises in.
  async cold() {
    await studio('phone', 'py', 1180, 0);
    await studio('sideOff', 0);
    await studio('coldOpen');
    await rec(0.3);
    await vo('cold', { captions: false });
    await rec(8.4);
    await studio('phone', 'py', 73, 1.3, 0, 'out');
    await rec(1.1);
  },

  // 0:10 — onboarding: Telugu toggle, who's setting up, avatar, nickname, life questions,
  // persona card + "Not me? Switch", the before-quiz and its score.
  async onboard() {
    await part('onboard');
    await vo('onboard');
    await rec(1.2);
    await tap('తెలుగు', 1.1);
    await tap('English', 0.6);
    await tap('START', 0.9);
    await tap("I'm the student", 0.9);
    const av = (await game.evaluate(`(${FIND_IMAGES})('^avatar_girl_1$')`))[0];
    await tap(av, 0.5);
    await tap('NEXT', 0.6);
    await typeText('Riya');
    await tap('NEXT', 0.7);
    await tap('My family gives it', 0.5);
    await tap('₹100–300', 0.5);
    await tap('Yes', 0.5);
    await tap('My own', 1.2);
    await studio('zoom', 180, 270, 1.35, 0.7);
    await tap('Not me? Switch', 1.4);
    await tap('Not me? Switch', 1.0);
    await studio('unzoom', 0.6);
    await tap('CONFIRM', 0.8);
    await tap('START', 0.7);
    await tap('₹1,000 today', 0.7);
    await cut(async () => {
      for (const y of [289, 289, 289, 289]) await tap({ x: 180, y }, 0.5, { capture: false });
      await off(1.2);
    });
    await studio('zoom', 180, 250, 1.45, 0.7);
    await rec(1.8);
    await studio('unzoom', 0.5);
    await voDone(0.2);
  },

  // 0:30 — the whole city, Charminar, Food Craving: the impulse, the lesson, needs vs wants.
  async food() {
    await part('food', () =>
      setup({ profile: profile('pocket_money', 'simple'), keep: { taskId: 'budget_simple_s1_01' }, until: { kind: 'chapter_start', chapter: 1 } }),
    );
    await vo('food');
    await rec(2.6);
    await tap('^Enter ', 0.2, { regex: true });
    await enterLandmark();
    await rec(1.6);
    await studio('zoom', 180, 470, 1.25, 0.6);
    await rec(0.5);
    await studio('unzoom', 0.4);
    await choose('ORDER THE ₹300 BIRYANI', 0.6);
    await studio('zoom', 250, 210, 1.5, 0.6);
    await rec(1.6);
    await studio('unzoom', 0.6);
    await rec(1.6);
    await next(0.4);
    await until(onScene('Explainer'), 5);
    await rec(3.4);
    await voDone(0.2);
  },

  // 0:52 — the scholarship scam: it rings, only the caller speaks, you pay, the lesson.
  async scam() {
    await part('scam', () =>
      setup({ profile: profile('scholarship', 'medium'), keep: { taskId: 'safety_medium_s1_01' }, until: { task: 'safety_medium_s1_01' } }),
    );
    await enterLandmark();
    await until(onScene('IncomingCall'), 5);
    await vo('scam', { offset: 0.2 });
    await studio('zoom', 180, 330, 1.35, 0.8);
    await rec(2.8);
    await studio('unzoom', 0.5);
    await rec(0.4);
    await tap('Answer', 0.8);
    await studio('zoom', 180, 420, 1.3, 0.8);
    await until(offScene('IncomingCall'), 14);
    await studio('unzoom', 0.6);
    await rec(1.2);
    await choose('PAY ₹500', 0.4);
    await vo('scam_2', { offset: 0.3 });
    await rec(2.6);
    await next(0.4);
    await until(onScene('Explainer'), 5);
    await rec(4.2);
    await voDone(0.3);
  },

  // 1:25 — the cracked screen: the savings jar saves the day; the borrowed path flashes past.
  async buffer() {
    await part('buffer', () =>
      setup({ profile: profile('pocket_money', 'hard'), keep: { taskId: 'save_hard_s1_01' }, until: { task: 'save_hard_s1_01' }, patch: { savings: 800 } }),
    );
    await vo('buffer');
    await enterLandmark();
    await rec(1.4);
    await choose('USE MY SAVINGS JAR', 2.4);
    await cut(async () => {
      await setup({ profile: profile('pocket_money', 'hard'), keep: { taskId: 'save_hard_s1_01' }, until: { task: 'save_hard_s1_01' } });
      await until(onScene('Landmark'), 6, false);
      await tap('^PLAY MISSION', 0.2, { regex: true, capture: false });
      await until(onScene('Battle'), 6, false);
      await off(1.2);
    }, '#3a1020');
    await choose('BORROW FROM A FRIEND', 2.2);
    await next(0.4);
    await until(onScene('Explainer'), 5);
    await rec(3.2);
    await voDone(0.2);
  },

  // 1:45 — five years later, the no-cost EMI, and the bill that keeps coming.
  async emi() {
    await part('emi', () =>
      setup({ profile: profile('pocket_money', 'medium'), keep: { taskId: 'budget_medium_s2_01' }, until: { kind: 'stage_end' } }),
    );
    await vo('emi');
    await rec(3.0);
    await cut(() =>
      setup({ profile: profile('pocket_money', 'medium'), keep: { taskId: 'budget_medium_s2_01' }, until: { task: 'budget_medium_s2_01' } }),
    );
    await enterLandmark();
    await rec(1.4);
    await choose('SIGN THE EMI', 2.4);
    await next(0.4);
    await until(onScene('Explainer'), 5);
    await rec(1.8);
    // next month: the EMI comes back on the map card
    await cut(async () => {
      await game.evaluate(`(${FORWARD})({ kind: 'chapter_start' })`);
      await until(onScene('WorldMap'), 6, false);
      await off(2.6);
    });
    await rec(0.6);
    await studio('zoom', 140, 540, 1.45, 0.7);
    await rec(2.2);
    await studio('unzoom', 0.5);
    await voDone(0.2);
  },

  // 2:05 — start early: the banyan grows; the invest screen's made-up assets and assumptions.
  async banyan() {
    await part('banyan', () =>
      setup({ profile: profile('pocket_money', 'simple'), keep: { taskId: 'invest_simple_s2_01' }, until: { task: 'invest_simple_s2_01' } }),
    );
    await vo('banyan');
    await enterLandmark();
    await rec(1.6);
    await choose('START AT 33, ENJOY NOW', 2.0);
    await next(0.4);
    await until(onScene('Explainer'), 5);
    await rec(1.0);
    await studio('zoom', 180, 300, 1.25, 1.2);
    await rec(6.5);
    await studio('unzoom', 0.6);
    await cut(() => setup({ profile: profile('pocket_money', 'medium'), keep: { allEvents: false }, until: { kind: 'invest' } }));
    await rec(2.0);
    await studio('zoom', 180, 600, 1.4, 0.7);
    await rec(2.0);
    await studio('unzoom', 0.5);
    await voDone(0.2);
  },

  // 2:28 — Charminar Market: diversify, skip the hot tip, hold through the crash, the checks.
  async market() {
    await part('market', async () => {
      await setup({ profile: profile('pocket_money', 'medium'), until: { kind: 'chapter_start', chapter: 5 }, patch: { savings: 20000 } });
      await game.evaluate(() => {
        const m = globalThis.__lmSession().game.market;
        m.start('paper', 0);
        for (let i = 0; i < 12 && !m.current().finished && m.current().turn < m.current().turns; i++) m.nextTurn();
        m.finish();
      });
      await off(0.6);
    });
    await vo('market');
    await rec(1.0);
    await tap('MARKET', 0.2, { regex: true });
    await until(onScene('Market'), 4);
    await rec(1.0);
    await tap('^REAL RUN', 0.8, { regex: true });
    for (const y of [289, 421, 377]) await tap({ x: 318, y }, 0.45);
    for (let q = 1; q <= 8; q++) {
      await tap('^NEXT QUARTER', 0.25, { regex: true });
      const news = (await find('^(FORWARDED|BREAKING)$')).length > 0;
      if (news) {
        await studio('zoom', 180, 210, 1.4, 0.5);
        await rec(1.4);
        await studio('unzoom', 0.4);
      }
      await rec(news ? 0.3 : 0.7);
    }
    await until(async () => (await find('^RESULTS')).length > 0 || (await find('What you did')).length > 0, 3);
    if ((await find('^RESULTS')).length) await tap('^RESULTS', 0.6, { regex: true });
    await studio('zoom', 180, 330, 1.25, 0.6);
    await rec(2.6);
    await studio('unzoom', 0.5);
    await voDone(0.2);
  },

  // 2:55 — the police video call, by night: answer, the threat, hang up and report to 1930.
  async police() {
    await part('police', () =>
      setup({ profile: profile('pocket_money', 'hard'), keep: { taskId: 'safety_hard_s3_01' }, until: { kind: 'chapter_start', chapter: 8 } }),
    );
    await vo('police');
    await until(async () => (await find('^(Walk to|Enter) ', '', 0.95)).length > 0, 6);
    await rec(0.8);
    await cut(() =>
      setup({ profile: profile('pocket_money', 'hard'), keep: { taskId: 'safety_hard_s3_01' }, until: { task: 'safety_hard_s3_01' } }),
    );
    await enterLandmark();
    await until(onScene('IncomingCall'), 5);
    await rec(2.2);
    await tap('Answer', 0.8);
    await studio('zoom', 180, 250, 1.3, 0.8);
    await until(offScene('IncomingCall'), 14);
    await studio('unzoom', 0.5);
    await rec(1.0);
    await choose('HANG UP, CALL 1930', 0.5);
    await vo('police_2', { offset: 0.2 });
    await rec(2.8);
    await voDone(0.4);
  },

  // 3:18 — measured learning: the after-quiz gain, the report, the PDF, the NGO dashboard.
  async measure() {
    await part('measure', () =>
      setup({ profile: profile('pocket_money', 'medium'), until: { kind: 'epilogue' } }),
    );
    await vo('measure');
    await rec(1.6);
    await next(0.6);
    await until(onScene('Quiz'), 5);
    await rec(0.6);
    await tap('START', 0.5);
    await tap({ x: 180, y: 289 }, 0.6);
    await cut(async () => {
      for (const i of [1, 0, 2, 1]) await tap({ x: 180, y: 289 + 84 * i }, 0.5, { capture: false });
      await off(1.2);
    });
    await studio('zoom', 180, 250, 1.45, 0.6);
    await rec(1.6);
    await studio('unzoom', 0.5);
    await next(0.5);
    await until(onScene('EndReport'), 5);
    await rec(1.2);
    // the one-page PDF report, beside the phone
    const pdf = await game.evaluate(async () => {
      const { buildReportPdf } = await import('/src/app/report.ts');
      const s = globalThis.__lmSession();
      const blob = buildReportPdf(s.game.report(), s.content);
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    });
    writeFileSync(join(OUT, 'report.pdf'), Buffer.from(pdf));
    execFileSync('pdftoppm', ['-png', '-r', '110', '-singlefile', join(OUT, 'report.pdf'), join(OUT, 'report')]);
    await studio('zoom', 180, 540, 1.3, 0.6);
    await rec(1.0);
    await studio('unzoom', 0.5);
    await studio('sideOff', 0.4);
    await studio('pdf', true, '/tools/video/out/report.png');
    await rec(3.4);
    await studio('pdf', false, null, 0.5);
    // the facilitator's dashboard on a laptop; the phone steps aside
    await studio('phone', 'px', 300, 0.9);
    await studio('laptop', true, '/ngo/index.html');
    await studio('captionsX', 860, 0.6);
    await rec(4.4);
    await voDone(0.3);
  },

  // 3:45 — end card.
  async end() {
    await studio('laptop', false);
    await studio('phone', 'phoneA', 0, 0.6);
    await studio('endCard');
    await rec(0.6);
    await vo('end', { captions: false });
    await rec(6.0);
  },
};

const order = ['cold', 'onboard', 'food', 'scam', 'buffer', 'emi', 'banyan', 'market', 'police', 'measure', 'end'];
for (const id of order) {
  if (ONLY && !ONLY.includes(id)) continue;
  const t0 = vt();
  process.stdout.write(`\n▶ ${id.padEnd(8)} at ${t0.toFixed(1)}s`);
  await PARTS[id]();
  process.stdout.write(`  (${(vt() - t0).toFixed(1)}s)`);
}
const duration = vt();
writeFileSync(join(OUT, `timeline-${TAG}.json`), JSON.stringify({ fps: FPS, frames: frame, duration, t0: T0, events: timeline }, null, 1));
console.log(`\n\nrecorded ${frame} frames = ${duration.toFixed(2)} s at ${FPS} fps → ${FRAMES}`);
if (duration > 240) console.warn('!! over 4:00 — trim holds in record.mjs');
await browser.close();
