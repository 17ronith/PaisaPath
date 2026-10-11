"""Generate the game's voice-over clips with Kokoro-82M (Apache-2.0, offline, free).

    npx tsx src/content/voice/lines.ts > /tmp/lines.json
    python3 src/content/voice/generate.py /tmp/lines.json --model kokoro-v1.0.int8.onnx --voices voices-v1.0.bin

Needs: pip install kokoro-onnx soundfile; ffmpeg on PATH. Model files from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
Writes public/assets/voice/<key>.m4a (AAC, mono) for every line that doesn't have one yet, and
src/content/voice/manifest.json listing the keys that exist. Keys must match key.ts (FNV-1a).
"""
import argparse, json, os, re, subprocess, sys, tempfile, unicodedata

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT_DIR = os.path.join(ROOT, 'public', 'assets', 'voice')
MANIFEST = os.path.join(ROOT, 'src', 'content', 'voice', 'manifest.json')

# Kokoro voice per role, per language, and speaking speed.
VOICES = {
    'en': {
        'professor': ('bm_george', 0.95),
        'narrator': ('af_heart', 1.0),
        'scammer': ('am_fenrir', 1.05),
        'female': ('af_bella', 1.0),
        'elder': ('am_michael', 0.97),
        'young': ('am_puck', 1.05),
    },
    'hi': {
        'professor': ('hm_psi', 0.95),
        'narrator': ('hf_alpha', 1.0),
        'scammer': ('hm_omega', 1.05),
        'female': ('hf_beta', 1.0),
        'elder': ('hm_omega', 0.97),
        'young': ('hm_omega', 1.05),
    },
}
ESPEAK_LANG = {'en': {'b': 'en-gb', 'a': 'en-us'}, 'hi': 'hi'}


def normalise(text):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', text)).strip()


def key(text):
    """FNV-1a over code points — identical to key.ts voiceKey()."""
    h = 0x811C9DC5
    for ch in normalise(text):
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f'{h:08x}'


EN_ACRONYMS = {'OTP': 'O.T.P.', 'UPI': 'U.P.I.', 'KYC': 'K.Y.C.', 'EMI': 'E.M.I.', 'EMIs': 'E.M.I.s',
               'VIP': 'V.I.P.', 'SMS': 'S.M.S.', 'HR': 'H.R.', 'PIN': 'pin', 'ePASS': 'e-pass',
               'NGO': 'N.G.O.', 'SIP': 'S.I.P.'}
HI_ACRONYMS = {'OTP': 'ओ टी पी', 'UPI': 'यू पी आई', 'KYC': 'के वाई सी', 'EMI': 'ई एम आई', 'PIN': 'पिन',
               'ePASS': 'ई-पास', 'VIP': 'वी आई पी', 'SMS': 'एस एम एस'}


def speakable(text, lang):
    """What the TTS reads: the on-screen line with money, symbols and acronyms spelled out."""
    t = normalise(text)
    rupees = 'रुपये' if lang == 'hi' else 'rupees'
    per = {'day': 'a day', 'mo': 'a month', 'month': 'a month'} if lang == 'en' else {
        'day': 'रोज़', 'mo': 'हर महीने', 'month': 'हर महीने'}
    # ₹1,00,627 / ₹2 lakh / ₹5,000/day
    t = re.sub(r'₹\s?(\d(?:[\d,]*\d)?(?:\.\d+)?)(\s?(?:lakh|crore|लाख|करोड़))?(?:/(day|mo|month))?',
               lambda m: f"{m.group(1).replace(',', '')}{m.group(2) or ''} {rupees}"
               + (f" {per[m.group(3)]}" if m.group(3) else ''), t)
    t = t.replace('×', ' times ' if lang == 'en' else ' गुणा ').replace('→', ' to ' if lang == 'en' else ' से ')
    t = re.sub(r'(\d)\s?[–-]\s?(\d)', r'\1 to \2' if lang == 'en' else r'\1 से \2', t)
    t = re.sub(r'\b1930\b', 'one nine three zero' if lang == 'en' else 'एक नौ तीन शून्य', t)
    for a, say in (EN_ACRONYMS if lang == 'en' else HI_ACRONYMS).items():
        t = re.sub(rf'\b{re.escape(a)}\b', say, t)
    t = t.replace('…', '...').replace('/', ' or ' if lang == 'en' else ' या ')
    return re.sub(r'\s+', ' ', t).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('lines')
    ap.add_argument('--model', required=True)
    ap.add_argument('--voices', required=True)
    ap.add_argument('--bitrate', default='40k')
    args = ap.parse_args()

    from kokoro_onnx import Kokoro
    import soundfile as sf

    lines = json.load(open(args.lines))
    os.makedirs(OUT_DIR, exist_ok=True)
    kokoro = Kokoro(args.model, args.voices)
    made = skipped = 0
    for i, line in enumerate(lines):
        k = key(line['text'])
        assert k == line['key'], f"key mismatch for {line['where']}: {k} != {line['key']}"
        out = os.path.join(OUT_DIR, f'{k}.m4a')
        if os.path.exists(out):
            skipped += 1
            continue
        lang = line['lang'] if line['lang'] in VOICES else 'en'
        voice, speed = VOICES[lang][line['role']]
        espeak = ESPEAK_LANG[lang] if lang == 'hi' else ESPEAK_LANG['en'][voice[0]]
        samples, sr = kokoro.create(speakable(line['text'], lang), voice=voice, speed=speed, lang=espeak)
        with tempfile.NamedTemporaryFile(suffix='.wav') as wav:
            sf.write(wav.name, samples, sr)
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav.name, '-ac', '1', '-ar', '24000',
                            '-af', 'loudnorm=I=-18:TP=-2', '-c:a', 'aac', '-b:a', args.bitrate,
                            '-movflags', '+faststart', out], check=True)
        made += 1
        if made % 25 == 0:
            print(f'{i + 1}/{len(lines)} …', file=sys.stderr, flush=True)

    keys = sorted(f[:-4] for f in os.listdir(OUT_DIR) if f.endswith('.m4a'))
    wanted = {l['key'] for l in lines}
    manifest = {
        'engine': 'Kokoro-82M v1.0 (Apache-2.0) via kokoro-onnx',
        'keys': [k for k in keys if k in wanted],
    }
    with open(MANIFEST, 'w') as f:
        json.dump(manifest, f, indent=1)
        f.write('\n')
    print(f'made {made}, kept {skipped}, manifest {len(manifest["keys"])}/{len(wanted)} lines',
          file=sys.stderr)


if __name__ == '__main__':
    main()
