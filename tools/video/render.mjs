// Encode recorded frames + the mixed soundtrack into the ad MP4.
//
//   node tools/video/render.mjs a            → out/ad-a.mp4 (one recording)
//   node tools/video/render.mjs a b          → out/learning-money-by-living-it.mp4 (halves joined)
//
// Halves are joined with a short cross-fade (XFADE s, default 0.34, the length of a part change's
// pixel wipe), and mix.py lays the soundtrack out with the same overlap, so picture and sound
// stay in sync across the join.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'out');
const tags = process.argv.slice(2);
if (!tags.length) throw new Error('usage: node tools/video/render.mjs <tag> [<tag> …]');
const XFADE = Number(process.env.XFADE || 0.34);
const tl = tags.map((t) => JSON.parse(readFileSync(join(OUT, `timeline-${t}.json`), 'utf8')));
const fps = tl[0].fps;
const name = tags.length > 1 ? 'learning-money-by-living-it' : `ad-${tags[0]}`;
const audio = join(OUT, `audio-${tags.join('')}.wav`);

const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
run('python3', [join(HERE, 'mix.py'), ...tags.flatMap((t) => ['--timeline', join(OUT, `timeline-${t}.json`)]), '--xfade', String(XFADE), '--out', audio]);

const inputs = tags.flatMap((t) => ['-framerate', String(fps), '-i', join(OUT, `frames-${t}`, '%06d.jpg')]);
let filter = '[0:v]format=yuv420p[v0]';
let last = 'v0';
let offset = tl[0].frames / fps;
for (let i = 1; i < tags.length; i++) {
  offset -= XFADE;
  filter += `;[${last}][${i}:v]xfade=transition=fade:duration=${XFADE}:offset=${offset.toFixed(4)},format=yuv420p[v${i}]`;
  last = `v${i}`;
  offset += tl[i].frames / fps;
}
const file = join(OUT, `${name}.mp4`);
run('ffmpeg', [
  '-y', '-v', 'error', '-stats', ...inputs, '-i', audio,
  '-filter_complex', filter, '-map', `[${last}]`, '-map', `${tags.length}:a`,
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-r', String(fps),
  '-c:a', 'aac', '-b:a', '192k', '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11',
  '-movflags', '+faststart', '-shortest', file,
]);
console.log(`\n${file}  (${offset.toFixed(2)} s)`);
