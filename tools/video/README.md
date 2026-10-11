# Demo ad — recorded, not edited

A 1920×1080 ad of the real game, built by a script: the game runs in an iPhone-style frame on a
"studio" page with part titles, captions, punch-in zooms and pixel-wipe cuts. The narration
is Kokoro TTS, the music is the game's own chiptune, and the sound effects are the game's blips at
the frames they fired. Every frame is captured under Playwright's fake clock, so the video is
perfectly smooth on any machine, however slow.

| File | What it does |
| --- | --- |
| `script.json` | The parts: titles, pillar, success measures, and narration. `say` is spoken; `show` is the caption. |
| `narrate.py` | Kokoro narration, one WAV per cue, timed per sentence → `assets/vo/`, `assets/vo.json` (committed). |
| `studio.html` | The stage: background, side panel, iPhone, captions, cold open, end card. It is driven frame by frame through `studio.frame(t)`. |
| `lib.mjs` | Helpers that run inside the game. `SETUP` builds a game that serves exactly the step we want to film; `FORWARD` plays on to a later step; `FIND` locates on-screen labels so taps hit buttons by name. |
| `record.mjs` | The director: plays every part and writes `out/frames-<TAG>/` plus `out/timeline-<TAG>.json`. |
| `mix.py` | The soundtrack: music bed (ducking under speech), sound effects, in-game voices, narration. |
| `render.mjs` | Mixes and encodes. Two or more recordings are joined with a 0.34 s crossfade. |

## Run it

```bash
npm run dev -- --port 5174          # the recorder needs the dev build's hooks
node tools/video/record.mjs         # whole ad, 30 fps → out/frames-full
node tools/video/render.mjs full    # → out/ad-full.mp4
```

### Faster: two halves in parallel

```bash
TAG=a ONLY=cold,onboard,food,scam,buffer node tools/video/record.mjs
TAG=b T0=<half a's seconds> ONLY=emi,banyan,market,police,measure,end node tools/video/record.mjs
node tools/video/render.mjs a b     # → out/learning-money-by-living-it.mp4
```

`T0` carries on the studio's clock (the background's slow drift) from the end of the first half, so
the crossfade at the join is invisible.

### Useful switches

- `FPS=10` gives a quick preview.
- `ONLY=scam` records just one part.
- `DEBUG=1` prints each setup.
- Re-voice: `python3 tools/video/narrate.py --model kokoro-v1.0.int8.onnx --voices voices-v1.0.bin [--voice bf_emma]`.
  The model files are on the kokoro-onnx GitHub release `model-files-v1.0`.

Needs Node, Playwright with Chromium, Python 3 with numpy and soundfile, ffmpeg, and pdftoppm
(poppler) for the report page.

## Double-blind checks

- The nickname is "Riya".
- No team or college names appear; the end card says "Team 97".
- No browser chrome or repo URLs are on screen.
