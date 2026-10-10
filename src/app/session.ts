// Monish owns this. API is fixed in docs/plan/CONTRACTS.md §4.1.
import type { ContentPack, Game, Lang, Profile } from '@/shared/types';
import { setLang as i18nSetLang } from '@/shared/i18n';
import { createGame, loadGame } from '@/engine';
import { loadContent, localize } from '@/content';
import { clearProfileDraft, clearState, loadState, saveState } from './storage';
import { buildReportPdf, postReport } from './report';

export interface Session {
  content: ContentPack;
  game: Game | null;
  lang: Lang;
  setLang(l: Lang): void;
  startGame(profile: Profile, seed?: number): Game;
  save(): Promise<void>;
  hasSave(): Promise<boolean>;
  resume(): Promise<Game | null>;
  reset(): Promise<void>;
  sendReport(opts: {
    facilitatorEmail: string;
    guardianEmail?: string;
  }): Promise<{ previewUrl: string | null; pdfBlob: Blob }>;
}

let session: Session | null = null;
const LANGS: Lang[] = ['en', 'te', 'hi'];

function readLang(): Lang {
  try {
    const l = globalThis.localStorage?.getItem('lang') as Lang | null;
    return l && LANGS.includes(l) ? l : 'en';
  } catch {
    return 'en';
  }
}

export function getSession(): Session {
  if (session) return session;
  const base = loadContent();
  const initialLang = readLang();
  i18nSetLang(initialLang);
  const s: Session = {
    content: localize(base, initialLang),
    game: null,
    lang: initialLang,
    setLang(l) {
      s.lang = l;
      i18nSetLang(l);
      s.content = localize(base, l);
      try {
        globalThis.localStorage?.setItem('lang', l);
      } catch {
        /* ignore */
      }
      if (s.game) s.game = loadGame(s.content, s.game.toJSON()); // re-bind to localized content
    },
    startGame(profile, seed) {
      s.game = createGame(s.content, profile, seed ?? Date.now() % 2147483647);
      void clearProfileDraft();
      void s.save();
      return s.game;
    },
    async save() {
      if (s.game) await saveState(s.game.toJSON());
    },
    async hasSave() {
      return (await loadState()) !== null;
    },
    async resume() {
      const state = await loadState();
      if (!state) return null;
      if (state.profile.lang !== s.lang) s.setLang(state.profile.lang);
      s.game = loadGame(s.content, state);
      return s.game;
    },
    async reset() {
      s.game = null;
      await clearState();
      await clearProfileDraft();
    },
    async sendReport({ facilitatorEmail, guardianEmail }) {
      if (!s.game) throw new Error('no game to report');
      const report = s.game.report();
      const pdfBlob = buildReportPdf(report, s.content);
      const previewUrl = await postReport(report, pdfBlob, facilitatorEmail, guardianEmail);
      return { previewUrl, pdfBlob };
    },
  };
  session = s;
  return s;
}

/** Trigger a browser download of a Blob (used by the EndReport screen's "Download report"). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
