# Contract changelog

Additive changes to `src/shared/types.ts` / `schema.ts` after `v0-skeleton`.
Format: time · who asked · what · why.

- 23:50 · Monish · `export declare function` lines became `CreateGame` / `LoadGame` / `ScaleToCoins` types · ambient declarations in a module would lie at runtime; the engine's `index.ts` is the real export.
- 00:10 · Monish · server `/api/report` also returns `outboxPath` (string|null) · offline fallback writes the .eml locally when Ethereal is unreachable. Client API unchanged.
