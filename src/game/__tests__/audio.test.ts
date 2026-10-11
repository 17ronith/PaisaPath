import { describe, expect, it } from 'vitest';
import { isMuted, isOn, onChannelChange, onMuteChange, setMuted, setOn } from '../audio';

describe('sound channels', () => {
  it('switch music, sound effects and voice-over independently', () => {
    setMuted(false);
    setOn('voice', false);
    expect(isOn('voice')).toBe(false);
    expect(isOn('music')).toBe(true);
    expect(isOn('sfx')).toBe(true);
    expect(isMuted()).toBe(false);
  });

  it('report each switch and the all-off state to listeners', () => {
    const seen: string[] = [];
    let muted: boolean | null = null;
    onChannelChange((c, on) => seen.push(`${c}:${on}`));
    onMuteChange((m) => (muted = m));
    setMuted(true);
    expect(seen.slice(-3)).toEqual(['music:false', 'sfx:false', 'voice:false']);
    expect(muted).toBe(true);
    setOn('music', true);
    expect(muted).toBe(false);
  });
});
