import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import manifest from '../voice/manifest.json';
import { normaliseLine, voiceKey } from '../voice/key';
import { speakerRole, voiceLines } from '../voice/lines';

describe('voice-over keys', () => {
  it('is FNV-1a over the normalised line (generate.py computes the same)', () => {
    expect(voiceKey('a')).toBe('e40c292c'); // the standard FNV-1a 32-bit test vector
    expect(voiceKey('  Pay ₹500\n now ')).toBe(voiceKey('Pay ₹500 now'));
    expect(normaliseLine('a\t b')).toBe('a b');
  });

  it('gives different lines different keys', () => {
    const lines = voiceLines();
    expect(new Set(lines.map((l) => l.key)).size).toBe(lines.length);
  });
});

describe('voice-over lines', () => {
  const lines = voiceLines();

  it('covers the Professor, the explainers and the battle openings, in English and Hindi', () => {
    const where = lines.map((l) => l.where);
    expect(where.some((w) => w.endsWith('.lesson'))).toBe(true);
    expect(where.some((w) => w.startsWith('exp_'))).toBe(true);
    expect(where).toContain('safety_medium_s1_01.framings.scholarship.text');
    expect(lines.some((l) => l.lang === 'hi')).toBe(true);
    for (const l of lines.filter((x) => x.where.endsWith('.lesson')))
      expect(l.role).toBe('professor');
  });

  it('casts scam callers, friends, family and narration differently', () => {
    expect(speakerRole("'ePASS officer'", true)).toBe('scammer');
    expect(speakerRole('Friend', true)).toBe('young');
    expect(speakerRole('Mom', false)).toBe('female');
    expect(speakerRole('Uncle', false)).toBe('elder');
    expect(speakerRole('Your wallet', false)).toBe('narrator');
    expect(speakerRole('Insurance agent', false)).toBe('elder');
  });
});

describe('voice-over clips', () => {
  it('every clip in the manifest exists as a small file under public/assets/voice', () => {
    for (const k of manifest.keys) {
      const file = resolve(__dirname, '../../../public/assets/voice', `${k}.m4a`);
      expect(existsSync(file), k).toBe(true);
      expect(statSync(file).size).toBeLessThan(150_000);
    }
  });
});
