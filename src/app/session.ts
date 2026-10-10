// Monish owns this. API is fixed in docs/plan/CONTRACTS.md §4.1.
// Phase 0: in-memory. Phase 1: IndexedDB persistence + report sending, same API.
import type { ContentPack, Game, Lang, Profile } from '@/shared/types';
import { setLang as i18nSetLang } from '@/shared/i18n';
import { createGame } from '@/engine';
import { loadContent, localize } from '@/content';

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

export function getSession(): Session {
  if (session) return session;
  const base = loadContent();
  const initialLang: Lang = (globalThis.localStorage?.getItem('lang') as Lang) || 'en';
  i18nSetLang(initialLang);
  const s: Session = {
    content: localize(base, initialLang),
    game: null,
    lang: initialLang,
    setLang(l) {
      s.lang = l;
      i18nSetLang(l);
      s.content = localize(base, l);
      globalThis.localStorage?.setItem('lang', l);
    },
    startGame(profile, seed) {
      s.game = createGame(s.content, profile, seed);
      return s.game;
    },
    async save() {
      /* Phase 1: idb */
    },
    async hasSave() {
      return false;
    },
    async resume() {
      return null;
    },
    async reset() {
      s.game = null;
    },
    async sendReport() {
      return { previewUrl: null, pdfBlob: new Blob([], { type: 'application/pdf' }) };
    },
  };
  session = s;
  return s;
}
