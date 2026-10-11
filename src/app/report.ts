// Progress report PDF (client-side, jsPDF) + send-to-facilitator over the report service.
// Contents per CONTEXT.md §2.12: scores, before/after quiz, pillar progress, mistakes fixed.
// The in-game "what if" is deliberately NOT included.
// ISSUES #35: one A4 page in the game's pixel palette, a chart per section, and a one-line
// "why this is reported" under every heading so a facilitator can read it without training.
// Built-in PDF fonts have no ₹ glyph, so the report never prints rupee amounts.
import { jsPDF } from 'jspdf';
import type { ContentPack, Pillar, Report } from '@/shared/types';

const PILLAR_NAMES: Record<Pillar, string> = {
  budget: 'Plan & budget',
  save: 'Save & manage',
  invest: 'Understand investing',
  safety: 'Stay financially safe',
};
const PILLARS = Object.keys(PILLAR_NAMES) as Pillar[];

/** The game's palette (src/game/ui/theme.ts), so the report looks like the game. */
const C = {
  navy: '#1b1b2f',
  navy2: '#283040',
  accent: '#9fd3c7',
  panel: '#f8f8f0',
  edge: '#283040',
  shadow: '#c8ccd2',
  ink: '#202028',
  muted: '#606878',
  good: '#48b048',
  warn: '#f0b030',
  bad: '#e04848',
  money: '#3878d8',
  happy: '#e8a020',
  grey: '#d4d8de',
  white: '#ffffff',
};
const PILLAR_COLOR: Record<Pillar, string> = {
  budget: C.money,
  save: C.good,
  invest: C.happy,
  safety: '#9a5cc8',
};
const PERSONA_NAMES: Record<string, string> = {
  pocket_money: 'Pocket money',
  scholarship: 'Scholarship',
  earner: 'Earner',
};

const M = 14; // page margin (mm)
const PAGE_W = 210;
const COL_GAP = 6;
const HALF = (PAGE_W - 2 * M - COL_GAP) / 2;

export function buildReportPdf(report: Report, content: ContentPack): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const s = report.summary;
  const conceptName = (id: string) => content.concepts.find((c) => c.id === id)?.name ?? id;

  // ---- drawing helpers ------------------------------------------------------------------
  const fill = (hex: string) => doc.setFillColor(hex);
  const ink = (hex: string) => doc.setTextColor(hex);
  const font = (
    size: number,
    style: 'normal' | 'bold' | 'italic' = 'normal',
    face = 'helvetica',
  ) => {
    doc.setFont(face, style);
    doc.setFontSize(size);
  };
  const say = (
    str: string | string[],
    x: number,
    y: number,
    opts?: { maxWidth?: number; align?: 'left' | 'center' | 'right' },
  ) => doc.text(str, x, y, opts);
  /** A pixel-style panel: square corners, 0.7 mm dark edge, offset block shadow. */
  const panel = (x: number, y: number, w: number, h: number) => {
    fill(C.shadow);
    doc.rect(x + 1.2, y + 1.2, w, h, 'F');
    fill(C.edge);
    doc.rect(x, y, w, h, 'F');
    fill(C.panel);
    doc.rect(x + 0.7, y + 0.7, w - 1.4, h - 1.4, 'F');
  };
  /** Section heading in the retro monospace face + the italic "why" line under it. */
  const heading = (title: string, why: string, x: number, y: number, w: number): number => {
    fill(C.navy);
    doc.rect(x + 3, y + 3, 2.4, 2.4, 'F');
    font(11, 'bold', 'courier');
    ink(C.ink);
    say(title.toUpperCase(), x + 7.5, y + 5.6);
    font(7.5, 'italic');
    ink(C.muted);
    const lines = doc.splitTextToSize(why, w - 7) as string[];
    say(lines, x + 3.5, y + 10);
    return y + 10 + lines.length * 3.2;
  };
  /** A row of square pixel blocks, `filled` of `total` coloured (partial last block allowed). */
  const blocks = (
    x: number,
    y: number,
    total: number,
    filled: number,
    color: string,
    size = 4.2,
    gap = 0.9,
  ) => {
    for (let i = 0; i < total; i++) {
      const bx = x + i * (size + gap);
      fill(C.grey);
      doc.rect(bx, y, size, size, 'F');
      const part = Math.max(0, Math.min(1, filled - i));
      if (part > 0) {
        fill(color);
        doc.rect(bx, y, size * part, size, 'F');
      }
    }
  };
  /** A filled pie wedge from angle a0 to a1 (radians, 0 = 3 o'clock, clockwise on paper). */
  const wedge = (cx: number, cy: number, r: number, a0: number, a1: number, color: string) => {
    if (a1 - a0 <= 0.0001) return;
    const steps = Math.max(2, Math.ceil(((a1 - a0) * 180) / Math.PI / 4));
    const pts: [number, number][] = [[cx, cy]];
    for (let i = 0; i <= steps; i++) {
      const a = a0 + ((a1 - a0) * i) / steps;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    const rel = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
    fill(color);
    doc.lines(rel, cx, cy, [1, 1], 'F', true);
  };
  /** Donut chart: parts → wedges, a hole of `hole` × r, optional centre label. */
  const donut = (
    cx: number,
    cy: number,
    r: number,
    parts: { v: number; color: string }[],
    centre?: string,
    sub?: string,
  ) => {
    const total = parts.reduce((a, p) => a + p.v, 0);
    let a = -Math.PI / 2;
    if (total <= 0) {
      fill(C.grey);
      doc.circle(cx, cy, r, 'F');
    } else {
      for (const p of parts) {
        const b = a + (p.v / total) * Math.PI * 2;
        wedge(cx, cy, r, a, b, p.color);
        a = b;
      }
    }
    fill(C.panel);
    doc.circle(cx, cy, r * 0.56, 'F');
    if (centre) {
      font(12, 'bold', 'courier');
      ink(C.ink);
      say(centre, cx, cy + (sub ? 0.6 : 1.6), { align: 'center' });
    }
    if (sub) {
      font(6.5);
      ink(C.muted);
      say(sub, cx, cy + 4.2, { align: 'center' });
    }
  };
  /** Pixel strip: a row of small squares cycling through the palette (header/footer trim). */
  const pixelStrip = (y: number, size = 2.2) => {
    const cols = [C.accent, C.money, C.good, C.happy, C.bad, '#9a5cc8'];
    for (let i = 0, x = 0; x < PAGE_W; i++, x += size) {
      fill(cols[i % cols.length]);
      doc.rect(x, y, size, size, 'F');
    }
  };

  // ---- header ---------------------------------------------------------------------------
  fill(C.navy);
  doc.rect(0, 0, PAGE_W, 38, 'F');
  pixelStrip(0);
  pixelStrip(35.8);
  font(20, 'bold', 'courier');
  ink(C.white);
  say('PROGRESS REPORT', M, 15);
  font(9.5);
  ink(C.accent);
  say('Learning Money by Living It  ·  a game about everyday money', M, 21.5);
  font(8.5);
  ink(C.white);
  const persona = PERSONA_NAMES[report.persona] ?? report.persona;
  say(
    `Student: ${report.nickname}${report.joinCode ? `   ·   Batch ${report.joinCode}` : ''}`,
    M,
    28.5,
  );
  say(`Story: ${persona}   ·   Difficulty: ${report.difficulty}`, M, 32.8);
  font(8);
  ink(C.accent);
  say(
    new Date(report.generatedAt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    PAGE_W - M,
    15,
    {
      align: 'right',
    },
  );
  // status badge, top right
  const lit = s.ncfe.literate;
  fill(lit ? C.good : C.warn);
  doc.rect(PAGE_W - M - 46, 21, 46, 9, 'F');
  font(9, 'bold', 'courier');
  ink(C.navy);
  say(lit ? 'LITERATE (NCFE)' : 'STILL LEARNING', PAGE_W - M - 23, 27, { align: 'center' });

  // ---- how to read this ------------------------------------------------------------------
  let y = 44;
  panel(M, y, PAGE_W - 2 * M, 20);
  font(9, 'bold', 'courier');
  ink(C.ink);
  say('HOW TO READ THIS REPORT', M + 4, y + 5.5);
  font(7.8);
  ink(C.muted);
  say(
    'The student played a life simulation: about 10 months of money decisions across three life stages. ' +
      'Every number below comes from those choices or from the same five-concept quiz at the start and the end. ' +
      'Each section says why it is measured. Use the lowest bars to choose what to discuss next session.',
    M + 4,
    y + 10,
    { maxWidth: PAGE_W - 2 * M - 8 },
  );

  // ---- row 1: learning gain | NCFE yardstick ------------------------------------------------
  y = 70;
  const rowH1 = 50;
  panel(M, y, HALF, rowH1);
  let cy = heading(
    'Learning gain',
    'The same five concepts are tested at the start and the end, asked a different way the second time, so the gain shows understanding, not memory.',
    M,
    y,
    HALF,
  );
  const after = s.quizAfter;
  const gain = s.learningGain;
  const barX = M + 8;
  font(8, 'bold');
  ink(C.ink);
  say('Before', barX, cy + 6);
  blocks(barX + 16, cy + 3, 5, s.quizBefore, C.muted, 5, 1.2);
  say(`${s.quizBefore}/5`, barX + 49, cy + 6.6);
  say('After', barX, cy + 15);
  blocks(barX + 16, cy + 12, 5, after ?? 0, C.good, 5, 1.2);
  say(after == null ? 'not taken' : `${after}/5`, barX + 49, cy + 15.6);
  // gain badge
  const gainTxt = gain == null ? '—' : `${gain >= 0 ? '+' : ''}${gain}`;
  fill(gain != null && gain > 0 ? C.good : gain === 0 ? C.warn : C.grey);
  doc.rect(M + HALF - 22, cy + 1, 15, 16, 'F');
  font(13, 'bold', 'courier');
  ink(C.navy);
  say(gainTxt, M + HALF - 14.5, cy + 10.5, { align: 'center' });
  font(6);
  say('GAIN', M + HALF - 14.5, cy + 14.8, { align: 'center' });

  const rx = M + HALF + COL_GAP;
  panel(rx, y, HALF, rowH1);
  cy = heading(
    'Financial literacy',
    "Scored on NCFE's national yardstick (2019 survey): literate means knowledge 6+ of 8, behaviour 6+ of 9 and attitude 3+ of 5. Only 27% of Indian adults meet all three.",
    rx,
    y,
    HALF,
  );
  const ncfeRow = (
    label: string,
    v: number,
    total: number,
    pass: number,
    color: string,
    ry: number,
  ) => {
    font(7.5, 'bold');
    ink(C.ink);
    say(label, rx + 4, ry + 3.3);
    blocks(rx + 22, ry, total, v, color, 3.6, 0.8);
    // threshold marker
    const tx = rx + 22 + pass * 4.4 - 0.4;
    fill(C.navy);
    doc.rect(tx, ry - 1.2, 0.6, 6, 'F');
    font(7.5);
    say(`${Number.isInteger(v) ? v : v.toFixed(1)}/${total}`, rx + 22 + total * 4.4 + 2, ry + 3.3);
  };
  ncfeRow('Knowledge', s.ncfe.knowledge, 8, 6, C.money, cy + 2);
  ncfeRow('Behaviour', s.ncfe.behaviour, 9, 6, C.good, cy + 9);
  ncfeRow('Attitude', s.ncfe.attitude, 5, 3, C.happy, cy + 16);
  font(6.5, 'italic');
  ink(C.muted);
  say('Dark tick = pass mark. An in-game proxy, not a certification.', rx + 4, y + rowH1 - 3.5);

  // ---- row 2: decisions by pillar (donut + bars) ----------------------------------------------
  y = 126;
  const rowH2 = 60;
  panel(M, y, PAGE_W - 2 * M, rowH2);
  cy = heading(
    'Decisions by pillar',
    "The programme's four pillars. The ring shows how the student's decisions were spread; the bars show the share of good choices in each. A short bar is the next topic to revisit.",
    M,
    y,
    PAGE_W - 2 * M,
  );
  const totalDecisions = PILLARS.reduce((a, p) => a + s.perPillar[p].total, 0);
  const goodDecisions = PILLARS.reduce((a, p) => a + s.perPillar[p].good, 0);
  donut(
    M + 26,
    cy + 19,
    17,
    PILLARS.map((p) => ({ v: s.perPillar[p].total, color: PILLAR_COLOR[p] })),
    `${goodDecisions}/${totalDecisions}`,
    'good choices',
  );
  PILLARS.forEach((p, i) => {
    const v = s.perPillar[p];
    const by = cy + 3 + i * 9;
    const bx = M + 54;
    fill(PILLAR_COLOR[p]);
    doc.rect(bx, by, 3, 3, 'F');
    font(8, 'bold');
    ink(C.ink);
    say(PILLAR_NAMES[p], bx + 5, by + 2.7);
    const pct = v.total ? v.good / v.total : 0;
    const trackX = bx + 44;
    const trackW = 62;
    fill(C.grey);
    doc.rect(trackX, by - 0.2, trackW, 3.6, 'F');
    fill(PILLAR_COLOR[p]);
    if (pct > 0) doc.rect(trackX, by - 0.2, trackW * pct, 3.6, 'F');
    // pixel notches every 10%
    fill(C.panel);
    for (let k = 1; k < 10; k++)
      doc.rect(trackX + (trackW * k) / 10 - 0.25, by - 0.2, 0.5, 3.6, 'F');
    font(7.5);
    ink(C.muted);
    say(v.total ? `${v.good}/${v.total} good` : 'not played', trackX + trackW + 3, by + 2.7);
  });

  // ---- row 3: scam safety | mistakes -----------------------------------------------------------
  y = 192;
  const rowH3 = 52;
  panel(M, y, HALF, rowH3);
  cy = heading(
    'Scam safety',
    "Fraud isn't in NCFE's survey, so it is tracked on its own. Every scam in the game is one Hyderabad students really receive: OTP requests, fake officials, task scams.",
    M,
    y,
    HALF,
  );
  const { spotted, faced } = s.safety;
  donut(
    M + 20,
    cy + 13,
    11,
    faced
      ? [
          { v: spotted, color: C.good },
          { v: faced - spotted, color: C.bad },
        ]
      : [],
    faced ? `${spotted}/${faced}` : '—',
  );
  font(8, 'bold');
  ink(C.ink);
  say(faced ? `Spotted ${spotted} of ${faced} scams` : 'No scams met yet', M + 36, cy + 10);
  font(7.5);
  ink(C.muted);
  say(
    faced && spotted < faced
      ? 'Fell for at least one: worth repeating "money in never needs money out".'
      : 'Never paid a scammer or shared a PIN/OTP.',
    M + 36,
    cy + 14.5,
    { maxWidth: HALF - 40 },
  );

  panel(rx, y, HALF, rowH3);
  cy = heading(
    'Mistakes fixed',
    'A mistake counts as fixed only when the same concept came back later in a new situation and the student got it right.',
    rx,
    y,
    HALF,
  );
  const chips = (names: string[], color: string, startY: number, empty: string): number => {
    let x = rx + 4;
    let yy = startY;
    font(7);
    if (!names.length) {
      ink(C.muted);
      say(empty, x, yy + 3);
      return yy + 6;
    }
    for (const n of names) {
      const w = doc.getTextWidth(n) + 4;
      if (x + w > rx + HALF - 3) {
        x = rx + 4;
        yy += 5.6;
      }
      fill(color);
      doc.rect(x, yy, w, 4.4, 'F');
      ink(C.navy);
      say(n, x + 2, yy + 3.1);
      x += w + 1.6;
    }
    return yy + 6.4;
  };
  font(7, 'bold');
  ink(C.ink);
  say('Fixed', rx + 4, cy + 3);
  let ny = chips(s.mistakesFixed.map(conceptName), C.good, cy + 4.5, 'none yet');
  font(7, 'bold');
  ink(C.ink);
  say('Still learning', rx + 4, ny + 3);
  ny = chips(s.mistakesOpen.map(conceptName), C.warn, ny + 4.5, 'nothing open');
  font(7);
  ink(C.muted);
  say(`Detours taken: ${s.detoursTaken}   ·   Restarts: ${s.restarts}`, rx + 4, y + rowH3 - 3.5);

  // ---- suggested next step -----------------------------------------------------------------------
  y = 250;
  const played = PILLARS.filter((p) => s.perPillar[p].total > 0);
  const weakest = played.sort(
    (a, b) =>
      s.perPillar[a].good / s.perPillar[a].total - s.perPillar[b].good / s.perPillar[b].total,
  )[0];
  const nextOpen = s.mistakesOpen[0];
  fill(C.navy);
  doc.rect(M, y, PAGE_W - 2 * M, 10, 'F');
  font(8.5, 'bold', 'courier');
  ink(C.accent);
  say('NEXT SESSION', M + 4, y + 6.3);
  font(8);
  ink(C.white);
  say(
    nextOpen
      ? `Revisit "${conceptName(nextOpen)}"${weakest ? ` and the ${PILLAR_NAMES[weakest]} pillar` : ''}.`
      : weakest
        ? `Start with the ${PILLAR_NAMES[weakest]} pillar, the student's lowest share of good choices.`
        : 'Play through the first stage together.',
    M + 34,
    y + 6.3,
    { maxWidth: PAGE_W - 2 * M - 38 },
  );

  // ---- footer ----------------------------------------------------------------------------------
  font(6.5, 'italic');
  ink(C.muted);
  say(
    'In-game behaviour is a proxy for real behaviour. All projections in the game assume a fixed yearly rate; real returns vary and can be negative. Simulations are assumptions, not promises. No real products are recommended. Student identified by nickname only; guardian consent collected at NGO enrolment.',
    M,
    268,
    { maxWidth: PAGE_W - 2 * M },
  );
  pixelStrip(294.8);
  return doc.output('blob');
}

export const REPORT_SERVICE_URL =
  (import.meta.env?.VITE_REPORT_SERVICE_URL as string | undefined) ?? 'http://localhost:8787';

export async function postReport(
  report: Report,
  pdf: Blob,
  facilitatorEmail: string,
  guardianEmail?: string,
): Promise<string | null> {
  try {
    const pdfBase64 = await blobToBase64(pdf);
    const res = await fetch(`${REPORT_SERVICE_URL}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ report, pdfBase64, facilitatorEmail, guardianEmail }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { previewUrl?: string };
    return json.previewUrl ?? null;
  } catch {
    return null; // offline: caller offers the download instead
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1] ?? '');
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
