// Progress report PDF (client-side, jsPDF) + send-to-facilitator over the report service.
// Contents per CONTEXT.md §2.12: scores, before/after quiz, pillar progress, mistakes fixed.
// The in-game "what if" is deliberately NOT included.
import { jsPDF } from 'jspdf';
import type { ContentPack, Pillar, Report } from '@/shared/types';

const PILLAR_NAMES: Record<Pillar, string> = {
  budget: 'Plan & budget',
  save: 'Save & manage',
  invest: 'Understand investing',
  safety: 'Stay financially safe',
};

export function buildReportPdf(report: Report, content: ContentPack): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const s = report.summary;
  let y = 18;
  const line = (text: string, size = 11, bold = false) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(text, 16, y);
    y += size * 0.55;
  };
  const gap = (n = 4) => (y += n);

  line('Progress report — Learning Money by Living It', 16, true);
  line(
    `Student: ${report.nickname}${report.joinCode ? ` · Batch ${report.joinCode}` : ''} · Generated ${new Date(report.generatedAt).toLocaleString('en-IN')}`,
    9,
  );
  line(`Story: ${report.persona.replace('_', ' ')} · Difficulty: ${report.difficulty}`, 9);
  gap(6);

  line('Before / after quiz', 13, true);
  const after = s.quizAfter == null ? '—' : `${s.quizAfter}/5`;
  const gain = s.learningGain == null ? '—' : (s.learningGain >= 0 ? '+' : '') + s.learningGain;
  line(`Before: ${s.quizBefore}/5    After: ${after}    Learning gain: ${gain}`);
  gap(6);

  line('NCFE-aligned in-game score (measurement lens, not a certification)', 13, true);
  line(
    `Knowledge ${s.ncfe.knowledge}/8 · Behaviour ${s.ncfe.behaviour}/9 · Attitude ${s.ncfe.attitude.toFixed(1)}/5`,
  );
  line(
    `Literate by NCFE's yardstick (K≥6, B≥6, A≥3): ${s.ncfe.literate ? 'YES' : 'not yet'} · National reference: 27% of adults (NCFE-FLIS 2019)`,
    10,
  );
  line(`Scams spotted: ${s.safety.spotted} of ${s.safety.faced} faced`);
  gap(6);

  line('Progress by pillar', 13, true);
  for (const p of Object.keys(PILLAR_NAMES) as Pillar[]) {
    const v = s.perPillar[p];
    line(`${PILLAR_NAMES[p].padEnd(24)} ${v.good}/${v.total} good choices`);
  }
  gap(6);

  const name = (id: string) => content.concepts.find((c) => c.id === id)?.name ?? id;
  line('Mistakes fixed', 13, true);
  line(s.mistakesFixed.length ? s.mistakesFixed.map(name).join(', ') : 'none yet');
  line('Still learning', 13, true);
  line(s.mistakesOpen.length ? s.mistakesOpen.map(name).join(', ') : 'nothing open');
  line(`Detours taken: ${s.detoursTaken} · Restarts: ${s.restarts}`);
  gap(8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'In-game behaviour is a proxy for real behaviour. All projections in the game assume a fixed yearly rate; real returns vary and can be negative. Simulations are assumptions, not promises. No real products are recommended. Student identified by nickname only; guardian consent collected at NGO enrolment.',
    16,
    280,
    { maxWidth: 178 },
  );
  return doc.output('blob');
}

export const REPORT_SERVICE_URL =
  (import.meta.env.VITE_REPORT_SERVICE_URL as string | undefined) ?? 'http://localhost:8787';

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
