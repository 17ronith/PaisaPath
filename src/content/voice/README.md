# Voice-over

What is voiced: the Professor (lessons, praise, hints), the explainer animations' captions, and the
characters' opening lines in battles (scam callers, friends, family, shopkeepers). Menus, buttons and
the quiz are not.

- `lines.ts` lists every voiced line straight from the content pack (English + Hindi overlay), with
  the role that says it. Telugu has no clips: it uses the phone's own Telugu voice when it has one.
- `key.ts` turns a line into its clip name (FNV-1a of the exact text). The game looks clips up by the
  text on screen, so an edited line goes silent (or uses the device voice) instead of saying old words.
- `generate.py` makes the clips with **Kokoro-82M** (Apache-2.0, runs offline, free) into
  `public/assets/voice/<key>.mp3`, and writes `manifest.json`.
- `npm run validate:content` warns when a line has no clip.

## Regenerate after editing lines (only new/changed lines are synthesised)

```bash
pip install kokoro-onnx soundfile          # plus ffmpeg on PATH
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.int8.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
npx tsx src/content/voice/lines.ts > /tmp/lines.json
python3 src/content/voice/generate.py /tmp/lines.json --model kokoro-v1.0.int8.onnx --voices voices-v1.0.bin
```

Voices (Kokoro names): Professor `bm_george` · narrator `af_heart` · scam caller `am_fenrir` ·
women `af_bella` · elders `am_michael` · friends `am_puck`; Hindi `hm_psi` / `hm_omega` / `hf_alpha` /
`hf_beta`. Change them in `VOICES` at the top of `generate.py`, delete the clips, regenerate.

Credit: Kokoro-82M by hexgrad (Apache-2.0), ONNX build by thewh1teagle/kokoro-onnx (MIT).
