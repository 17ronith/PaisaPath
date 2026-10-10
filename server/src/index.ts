// Report service: emails the progress-report PDF to the NGO facilitator (guardian in CC)
// via an Ethereal sandbox inbox, and returns a preview URL. No student PII beyond nickname.
import express from 'express';
import cors from 'cors';
import nodemailer, { type Transporter } from 'nodemailer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

let transporter: Transporter | null = null;
let fromAddress = 'reports@example.test';
let outboxMode = false;
const OUTBOX = join(process.cwd(), 'outbox');

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (process.env.SMTP_HOST && user && pass) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: { user, pass },
    });
    fromAddress = process.env.SMTP_FROM ?? user;
  } else {
    try {
      const acct = await nodemailer.createTestAccount(); // Ethereal sandbox: nothing is really delivered
      transporter = nodemailer.createTransport({
        host: acct.smtp.host,
        port: acct.smtp.port,
        secure: acct.smtp.secure,
        auth: { user: acct.user, pass: acct.pass },
      });
      fromAddress = acct.user;
      console.log(`ethereal inbox: ${acct.web} (user ${acct.user})`);
    } catch (err) {
      // No network (or Ethereal down): keep the demo alive by writing .eml files to server/outbox/.
      console.warn('ethereal unavailable, falling back to outbox/', (err as Error).message);
      mkdirSync(OUTBOX, { recursive: true });
      transporter = nodemailer.createTransport({
        streamTransport: true,
        buffer: true,
        newline: 'unix',
      });
      outboxMode = true;
    }
  }
  return transporter;
}

const isEmail = (s: unknown): s is string =>
  typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/report', async (req, res) => {
  const { report, pdfBase64, facilitatorEmail, guardianEmail } = req.body ?? {};
  if (!isEmail(facilitatorEmail))
    return res.status(400).json({ error: 'facilitatorEmail invalid' });
  if (guardianEmail && !isEmail(guardianEmail))
    return res.status(400).json({ error: 'guardianEmail invalid' });
  if (typeof pdfBase64 !== 'string' || !pdfBase64)
    return res.status(400).json({ error: 'pdfBase64 missing' });
  const nickname = String(report?.nickname ?? 'student').slice(0, 40);
  const s = report?.summary ?? {};
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: `"Learning Money by Living It" <${fromAddress}>`,
      to: facilitatorEmail,
      cc: guardianEmail || undefined,
      subject: `Progress report — ${nickname}`,
      text: [
        `Progress report for ${nickname}.`,
        `Before/after quiz: ${s.quizBefore ?? '?'}/5 → ${s.quizAfter ?? '—'}/5.`,
        `NCFE-aligned in-game score: K ${s.ncfe?.knowledge ?? '?'}/8 · B ${s.ncfe?.behaviour ?? '?'}/9 · A ${s.ncfe?.attitude ?? '?'}/5.`,
        `Scams spotted: ${s.safety?.spotted ?? '?'}/${s.safety?.faced ?? '?'}.`,
        '',
        'Full report attached (PDF). Simulations are assumptions, not promises.',
      ].join('\n'),
      attachments: [
        {
          filename: `report-${nickname}.pdf`,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf',
        },
      ],
    });
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    console.log(
      `report sent → ${facilitatorEmail}${guardianEmail ? ` cc ${guardianEmail}` : ''} ${previewUrl ?? ''}`,
    );
    let outboxPath: string | null = null;
    if (outboxMode) {
      outboxPath = join(OUTBOX, `${Date.now()}-${nickname.replace(/[^a-z0-9]/gi, '_')}.eml`);
      writeFileSync(outboxPath, (info as unknown as { message: Buffer }).message);
      console.log(`saved to ${outboxPath}`);
    }
    res.json({ previewUrl, outboxPath, messageId: info.messageId });
  } catch (err) {
    console.error('send failed', err);
    res.status(502).json({ error: 'send failed' });
  }
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`report service on :${port}`);
});
