# Background music

Played in this order, then round again: `a.mp3` → `b.mp3` → `c.mp3` (see `src/game/music.ts`).
If none of them loads, the game plays its built-in synthesised chiptune instead.

| File    | Track                                | Author                                       | Licence   | Source                                          |
| ------- | ------------------------------------ | -------------------------------------------- | --------- | ----------------------------------------------- |
| `a.mp3` | Town Theme RPG                       | cynicmusic (cynicmusic.com, pixelsphere.org) | CC0       | https://opengameart.org/content/town-theme-rpg  |
| `b.mp3` | [Chiptune] Medieval: The Bard's Tale | RandomMind                                   | CC0       | https://opengameart.org/node/94347              |
| `c.mp3` | Chill Overworld                      | ATMANAN                                      | CC-BY 4.0 | https://opengameart.org/content/chill-overworld |

Files are 96 kbps MP3, loudness-normalised to −20 LUFS (`ffmpeg -af loudnorm=I=-20:TP=-2`).
