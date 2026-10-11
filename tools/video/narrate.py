"""Narration for the demo ad, with Kokoro-82M (offline, Apache-2.0) — the same engine as the game's
voice-over. One WAV per narration cue, sentence by sentence, so captions switch exactly when the
narrator starts each sentence.

    pip install kokoro-onnx soundfile
    python3 tools/video/narrate.py --model kokoro-v1.0.int8.onnx --voices voices-v1.0.bin

Model files: https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
Reads tools/video/script.json; writes tools/video/assets/vo/<cue>.wav and tools/video/assets/vo.json
({cue: {file, dur, lines: [{show, start, end}]}}). Cues are "<segment>" and "<segment>_2" (vo2).
"""
import argparse, json, os

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
GAP = 0.32  # seconds of breath between sentences

ap = argparse.ArgumentParser()
ap.add_argument('--model', required=True)
ap.add_argument('--voices', required=True)
ap.add_argument('--voice', help='override script.json voice, e.g. af_heart, bf_emma, am_michael')
args = ap.parse_args()

script = json.load(open(os.path.join(HERE, 'script.json'), encoding='utf-8'))
voice = args.voice or script['voice']['name']
speed = script['voice'].get('speed', 1.0)
kokoro = Kokoro(args.model, args.voices)
out_dir = os.path.join(HERE, 'assets', 'vo')
os.makedirs(out_dir, exist_ok=True)

index = {}
for seg in script['segments']:
    for group, suffix in (('vo', ''), ('vo2', '_2')):
        lines = seg.get(group)
        if not lines:
            continue
        cue = seg['id'] + suffix
        chunks, timing, t, sr = [], [], 0.0, 24000
        for i, line in enumerate(lines):
            samples, sr = kokoro.create(line['say'], voice=voice, speed=speed, lang='en-us')
            samples = np.asarray(samples, dtype=np.float32)
            # trim near-silence at both ends so the gaps are ours
            loud = np.where(np.abs(samples) > 0.01)[0]
            if len(loud):
                samples = samples[max(0, loud[0] - int(0.03 * sr)): loud[-1] + int(0.08 * sr)]
            dur = len(samples) / sr
            timing.append({'show': line['show'], 'start': round(t, 3), 'end': round(t + dur, 3)})
            chunks.append(samples)
            t += dur
            if i < len(lines) - 1:
                chunks.append(np.zeros(int(GAP * sr), dtype=np.float32))
                t += GAP
        audio = np.concatenate(chunks)
        audio = audio / max(1e-6, float(np.max(np.abs(audio)))) * 0.89  # peak-normalise
        path = os.path.join(out_dir, cue + '.wav')
        sf.write(path, audio, sr)
        index[cue] = {'file': f'assets/vo/{cue}.wav', 'dur': round(t, 3), 'lines': timing}
        print(f'{cue:12s} {t:5.1f}s  {len(lines)} line(s)')

json.dump(index, open(os.path.join(HERE, 'assets', 'vo.json'), 'w'), indent=1, ensure_ascii=False)
print('total narration:', round(sum(v['dur'] for v in index.values()), 1), 's')
