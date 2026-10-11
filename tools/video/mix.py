"""The ad's soundtrack, built from the recorder's timeline(s):
  * music bed — the game's own chiptune (notes read from src/game/music.ts), with a pad and a
    soft kick, swelling in after the cold open's stat and ducking under every spoken word;
  * sound effects — the game's blips, ringtone and footsteps at the exact frames they fired,
    plus a soft whoosh on each part change;
  * in-game voices — the scam caller, the 'officer', the Professor — kept only where they
    don't collide with the narration;
  * narration — the Kokoro cues (tools/video/assets/vo).

    python3 tools/video/mix.py --timeline out/timeline-a.json [--timeline out/timeline-b.json]
        [--xfade 0.34] --out out/audio.wav

Several timelines are laid end to end, each overlapping the previous by --xfade seconds (the
video join cross-fades by the same amount), so sounds stay in sync across the join.
"""
import argparse, json, os, re, subprocess

import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SR = 48000

ap = argparse.ArgumentParser()
ap.add_argument('--timeline', action='append', required=True)
ap.add_argument('--xfade', type=float, default=0.34)
ap.add_argument('--out', required=True)
ap.add_argument('--no-music', action='store_true')
args = ap.parse_args()


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def env(n, attack=0.005, release=None):
    e = np.ones(n, dtype=np.float32)
    a = min(n, int(attack * SR))
    if a:
        e[:a] = np.linspace(0, 1, a)
    if release is None:  # exponential decay to silence by the end
        e *= np.exp(np.linspace(0, -7, n)).astype(np.float32)
    return e


def osc(freq, dur, wave='square', freq_end=None):
    n = max(1, int(dur * SR))
    f = np.full(n, freq, dtype=np.float64) if not freq_end else np.geomspace(freq, freq_end, n)
    ph = 2 * np.pi * np.cumsum(f) / SR
    if wave == 'square':
        y = np.sign(np.sin(ph))
    elif wave == 'triangle':
        y = 2 / np.pi * np.arcsin(np.sin(ph))
    elif wave == 'sawtooth':
        y = 2 * ((ph / (2 * np.pi)) % 1) - 1
    else:
        y = np.sin(ph)
    return y.astype(np.float32)


def lowpass(x, cutoff, taps=63):
    """Windowed-sinc FIR low-pass (fast enough on minutes of audio without scipy)."""
    n = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(2 * cutoff / SR * n) * np.hamming(taps)
    h = (h / h.sum()).astype(np.float32)
    return np.convolve(x, h, mode='same').astype(np.float32)


# ---- sound effects (same shapes as src/game/audio.ts / music.ts) ----------------------------
def seq(notes, gain):
    parts = [osc(f, d, w) * env(int(d * SR)) for f, d, w in notes]
    return np.concatenate(parts) * gain


def ring():
    out = []
    for _ in range(2):
        for i in range(10):
            out.append(osc(1480 if i % 2 else 1175, 0.045) * env(int(0.045 * SR)))
        out.append(np.zeros(int(0.2 * SR), dtype=np.float32))
    return np.concatenate(out) * 0.09


def step(f0):
    n = int(0.08 * SR)
    return osc(f0, 0.08, 'triangle', 70) * env(n) * 0.16


def whoosh():
    n = int(0.42 * SR)
    noise = np.random.default_rng(7).standard_normal(n).astype(np.float32)
    shape = np.sin(np.linspace(0, np.pi, n)).astype(np.float32) ** 2
    lo = noise - np.concatenate([[0], noise[:-1]]) * 0.6  # brighten a little
    return lo * shape * 0.035


SFX = {
    'select': seq([(660, 0.05, 'square')], 0.12),
    'good': seq([(523, 0.08, 'square'), (784, 0.12, 'square')], 0.12),
    'bad': seq([(220, 0.1, 'sawtooth'), (165, 0.16, 'sawtooth')], 0.12),
    'coin': seq([(988, 0.06, 'square'), (1319, 0.14, 'square')], 0.1),
    'ring': ring(),
    'stepL': step(180),
    'stepR': step(150),
    'whoosh': whoosh(),
}


# ---- lay the timelines end to end ----------------------------------------------------------
events, offset, total, parts = [], 0.0, 0.0, []
for i, path in enumerate(args.timeline):
    tl = json.load(open(path))
    if i > 0:
        offset -= args.xfade
    for e in tl['events']:
        events.append({**e, 't': e['t'] + offset})
    parts.append((offset, tl['duration']))
    offset += tl['duration']
total = offset
N = int(total * SR) + SR
vo = json.load(open(os.path.join(HERE, 'assets', 'vo.json')))


def place(track, clip, t, gain=1.0):
    i = int(round(t * SR))
    if i >= len(track):
        return
    j = min(len(track), i + len(clip))
    track[i:j] += clip[: j - i] * gain


narr = np.zeros(N, dtype=np.float32)
voice = np.zeros(N, dtype=np.float32)
sfx = np.zeros(N, dtype=np.float32)
windows = []  # narration intervals

for e in events:
    if e['k'] == 'vo':
        clip = decode(os.path.join(HERE, vo[e['n']]['file']))
        place(narr, clip, e['t'], 1.0)
        windows.append((e['t'] - 0.15, e['t'] + len(clip) / SR + 0.15))

voice_free_at = 0.0
for e in sorted((x for x in events if x['k'] == 'voice'), key=lambda x: x['t']):
    path = os.path.join(ROOT, 'public', 'assets', 'voice', f"{e['n']}.mp3")
    if not os.path.exists(path):
        continue
    clip = decode(path)
    t = max(e['t'], voice_free_at)  # one speaker at a time
    end = t + len(clip) / SR
    if any(t < b and end > a for a, b in windows):
        continue  # the narrator has the floor
    place(voice, clip, t, 0.95)
    voice_free_at = end + 0.1

for e in events:
    if e['k'] == 'sfx' and e['n'] in SFX:
        place(sfx, SFX[e['n']], e['t'])
    elif e['k'] == 'part':
        place(sfx, SFX['whoosh'], max(0.0, e['t'] - 0.05))

# ---- music bed ------------------------------------------------------------------------------
music = np.zeros(N, dtype=np.float32)
if not args.no_music:
    src = open(os.path.join(ROOT, 'src', 'game', 'music.ts'), encoding='utf-8').read()
    notes = dict((k, float(v)) for k, v in re.findall(r'\b([A-G]\d):\s*([\d.]+)', src.split('const N = {')[1].split('};')[0]))
    bpm = float(re.search(r'BPM = (\d+)', src).group(1))

    def arr(name):
        body = src.split(f'export const {name}: number[] = [')[1].split('];')[0]
        out = []
        for tok in [t.strip() for t in body.split(',') if t.strip()]:
            out.append(float(eval(tok.replace('N.', ''), {}, notes)))  # our own file: arithmetic only
        return out

    melody, bass = arr('MELODY'), arr('BASS')
    stepd, beat = 60 / bpm / 2, 60 / bpm
    start = 6.6  # the title reveal; a pad swells under the stat before it
    t, k = start, 0
    while t < total:
        m = melody[k % len(melody)]
        if m:
            place(music, osc(m, stepd * 0.9) * env(int(stepd * 0.9 * SR)), t, 0.05)
        if k % 2 == 0:
            b = bass[(k // 2) % len(bass)]
            if b:
                place(music, osc(b, beat * 0.8, 'triangle') * env(int(beat * 0.8 * SR)), t, 0.11)
            if (k // 2) % 2 == 0:  # soft kick on beats 1 and 3
                place(music, osc(110, 0.14, 'sine', 45) * env(int(0.14 * SR)), t, 0.28)
            if (k // 2) % 4 == 0 and b:  # pad: root + fifth, one bar long
                d = beat * 4
                pad = (osc(b * 2, d, 'sine') + 0.6 * osc(b * 3, d, 'sine')) * np.sin(np.linspace(0, np.pi, int(d * SR))).astype(np.float32)
                place(music, pad, t, 0.03)
        else:
            place(music, osc(6000, 0.02) * env(int(0.02 * SR)), t, 0.012)
        k += 1
        t += stepd
    # swell under the cold open's stat
    swell = (osc(110, start, 'sine') + 0.5 * osc(165, start, 'sine')) * np.linspace(0, 1, int(start * SR)).astype(np.float32) ** 2
    place(music, swell, 0.0, 0.05)
    music = lowpass(music, 5200)
    # fades: out over the last 3 s
    fo = int(3 * SR)
    end_i = int(total * SR)
    music[end_i - fo:end_i] *= np.linspace(1, 0, fo).astype(np.float32)
    music[end_i:] = 0

# ---- ducking: the music dips under any speech ---------------------------------------------
# Envelope at 100 Hz: speech activity, held 250 ms, smoothed 150 ms each side (so the dip starts
# just before a word), then interpolated back up to the sample rate.
HOP = SR // 100
speech = np.abs(narr) + np.abs(voice)
frames = len(speech) // HOP
lvl = speech[: frames * HOP].reshape(frames, HOP).mean(axis=1)
active = (lvl > 0.006).astype(np.float32)
active = (np.convolve(active, np.ones(25), mode='same') > 0).astype(np.float32)
k = np.hanning(31)
active = np.convolve(active, k / k.sum(), mode='same')
smooth = np.interp(np.arange(len(speech)) / HOP, np.arange(frames), active).astype(np.float32)
duck = 1 - 0.62 * smooth

mix = music * duck * 0.9 + sfx + voice * 0.9 + narr * 1.0
mix = np.tanh(mix * 1.1) / np.tanh(1.1)  # gentle limiter
mix = mix[: int(total * SR)]
os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
sf.write(args.out, mix, SR, subtype='PCM_16')
kept = sum(1 for e in events if e['k'] == 'voice')
print(f'mixed {total:.2f}s: {len(windows)} narration cues, {kept} in-game voice lines seen, '
      f'{sum(1 for e in events if e["k"] == "sfx")} sound effects → {args.out}')
