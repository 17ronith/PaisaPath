// Report service. Phase 0: /health only. Phase 1: POST /api/report → Ethereal sandbox inbox.
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`report service on :${port}`);
});
