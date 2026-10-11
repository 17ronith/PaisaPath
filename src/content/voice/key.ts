// Voice-over clips are matched by the exact text on screen, not by an id: if a line is edited and
// the clip wasn't regenerated, the key changes and the game stays silent instead of saying
// something different from what the player reads. generate.py computes the same key.

/** Collapse whitespace and Unicode-normalise so trivial formatting never breaks a match. */
export function normaliseLine(text: string): string {
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** FNV-1a (32-bit) over the normalised line's code points, as 8 hex digits. */
export function voiceKey(text: string): string {
  let h = 0x811c9dc5;
  for (const ch of normaliseLine(text)) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
