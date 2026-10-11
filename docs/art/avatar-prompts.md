# Character art prompts (ISSUES #27, #2, #10, #19)

> Why: the four avatars are 16×16 frames from the Kenney urban pack. They read as generic, there
> is no boy/girl choice (#2), the guide is still the dungeon "aunty" (#10), and the scam caller
> has no face (#19). This file is the brief for replacing all of them.
> **Owner:** Ronith generates and imports. Prompts by Monish. Review: whole team (same gate as content).

## 1. What to make

| Key | Who | Views | Used in |
| --- | --- | --- | --- |
| `avatar_b1` … `avatar_b3` | 3 boys, 16–17 | front, back, side | avatar picker, map walk, battle (back view) |
| `avatar_g1` … `avatar_g3` | 3 girls, 16–17 | front, back, side | same |
| `npc_professor` | the guide (replaces Aunty, #10) | front | every lesson and hint |
| `npc_amma`, `npc_nanna` | parents | front | family tasks |
| `npc_shop` | kirana uncle | front | shop, Kirana Rush |
| `npc_friend` | classmate | front | peer-pressure tasks |
| `npc_clerk` | bank officer | front | bank, college, clinic |
| `npc_shady` | the scam caller (#19) | front + phone-call portrait | scam tasks and calls |

**Size:** 32×32 px canvas, character about 28 px tall, feet on the bottom row, transparent background.
That's twice the detail of today's 16×16 frames at the same size on screen.

## 2. The style block — paste this before every prompt

```
True pixel art game sprite, 32x32 pixel canvas, every pixel a crisp square, no anti-aliasing,
no gradients, no blur, no dithering noise. Full body, centred, feet touching the bottom edge,
transparent background. Chibi proportions: big head (about one third of the height), short body.
1-pixel dark brown outline (#3a2a1e) around the whole figure. Flat colours: each colour has one
lighter highlight and one darker shadow shade, at most 16 colours in total. Warm, friendly,
Game Boy Advance / Pokemon Emerald overworld style. Indian teenager from Hyderabad, realistic
brown skin tone, respectful and non-caricatured. No text, no logos, no brand names.
```

For the players, ask for a **turnaround sheet** so the three views match:

```
Character turnaround sheet on one row: front view, back view, right side view (walking pose),
same character, same palette, same size, evenly spaced, each view on its own 32x32 cell.
```

## 3. Player avatars

Varied skin tones, body types and dress on purpose: every student should find someone who looks
like them. Keep them all in everyday clothes; nobody is "the rich one" or "the poor one".

**B1: the junior-college regular**
```
[STYLE] [TURNAROUND] A 16-year-old boy, medium brown skin, short neat black hair with a side
parting. Light-blue half-sleeve college uniform shirt, untucked, navy trousers, black school
backpack on both shoulders, simple black sandals. Calm, slightly shy smile.
```

**B2: the cricket kid**
```
[STYLE] [TURNAROUND] A 16-year-old boy, deep brown skin, short curly black hair. Plain white
sports T-shirt with a thin green stripe on the sleeves (no team, no logo), dark grey track pants,
white sneakers, a wristband. Energetic grin, slightly lanky build.
```

**B3: the thinker**
```
[STYLE] [TURNAROUND] A 17-year-old boy, light brown skin, wavy black hair, thin black rectangular
glasses. Cream cotton kurta with rolled sleeves over blue jeans, brown chappals, a cloth tote bag
on one shoulder. Stocky build, friendly confident look.
```

**G1: the topper**
```
[STYLE] [TURNAROUND] A 16-year-old girl, medium brown skin, long black hair in a single braid
with a small red ribbon. Teal salwar kameez with a white salwar and a light yellow dupatta over
one shoulder, small silver earrings, flat sandals, holding a notebook to her chest. Bright smile.
```

**G2: the go-getter**
```
[STYLE] [TURNAROUND] A 17-year-old girl, light brown skin, shoulder-length black hair in a high
ponytail. Mustard-yellow T-shirt, blue jeans, white sneakers, a small crossbody sling bag, a
black digital watch. Confident, mid-stride.
```

**G3: the calm one**
```
[STYLE] [TURNAROUND] A 16-year-old girl, deep brown skin, wearing a neat maroon hijab, a long
lavender kurta over black leggings, black flat shoes, a phone in one hand. Gentle, warm
expression.
```

## 4. NPC portraits (front view only)

**npc_professor: the guide (#10)**
```
[STYLE] A kind retired professor in his 60s, brown skin, short grey hair and a neat grey
moustache, round glasses. Off-white kurta under a brown sleeveless Nehru jacket, a piece of
chalk in one hand raised like he is about to explain something, a pen in the jacket pocket.
Warm, encouraging face. Stands slightly taller than the students.
```

**npc_amma**
```
[STYLE] An Indian mother in her 40s, brown skin, black hair in a low bun with a few grey
strands, a cotton saree in green with an orange border, small bindi, glass bangles, a steel
tiffin box in one hand. Caring but practical expression.
```

**npc_nanna**
```
[STYLE] An Indian father in his late 40s, brown skin, short black-and-grey hair, thick moustache,
checked half-sleeve shirt tucked into grey trousers, a leather wallet in one hand, reading
glasses in his shirt pocket. Thoughtful expression.
```

**npc_shop: the kirana uncle**
```
[STYLE] A friendly neighbourhood grocery shopkeeper in his 50s, brown skin, balding with a grey
fringe, round belly, white vest under an open blue checked shirt, a pencil behind one ear, a
small notebook ledger in one hand. Big welcoming smile.
```

**npc_friend: the classmate**
```
[STYLE] A 16-year-old classmate, medium brown skin, messy spiky black hair, oversized orange
hoodie, black jeans, earphones around the neck, phone in hand, cheeky grin. Looks like they
are about to suggest something fun and expensive.
```

**npc_clerk: the bank officer**
```
[STYLE] A bank officer in her 30s, brown skin, black hair in a neat bun, formal light-grey
blouse, dark trousers, an ID card on a blue lanyard, a file folder under one arm. Polite,
professional expression.
```

**npc_shady: the scam caller (#19)**
```
[STYLE] A shifty fake "customer care" caller, brown skin, slicked-back hair, thin pencil
moustache, oversized mirrored sunglasses, a shiny fake gold chain over a loud purple shirt, a
fake ID card on a red lanyard, phone pressed to his ear, a too-wide smile. Comic and suspicious,
NOT tied to any religion, region or community. Clearly untrustworthy at a glance.
```
For the incoming-call screen, also make a **48×48 head-and-shoulders portrait** of the same
character, framed like a phone contact photo.

## 5. Turning a generated image into a game sprite

Most image models paint "pixel-style" pictures at 1024 px, not real 32 px sprites. Two options:

- **A pixel-art tool** (e.g. PixelLab or Retro Diffusion) that outputs true 32×32 sprites and
  directional views. Easiest and most consistent.
- **Any image model + cleanup:** crop the image to one view, then
  `magick in.png -filter box -resize 32x32 +dither -colors 16 out.png`. Open it in
  Piskel or Aseprite and fix the outline, eyes and hands by hand. 10 minutes per sprite.

**Checks before import:**
- Transparent background with no halo.
- Outline colour `#3a2a1e`.
- At most 16 colours.
- Feet on the bottom row.
- It reads at 1× on a phone.
- It sits naturally next to the Hyderabad map icons.

## 6. Dropping them in (Ronith)

1. Save the files as `public/assets/characters/<key>.png`, plus `<key>_back.png` and `<key>_side.png` for players.
2. In `PreloadScene.preload()`, add `this.load.image(key, …)` for each one.
   `characterFromSheet` skips any key that's already loaded, so the Kenney frames fall away automatically.
3. These sprites are 32 px, not 16 px. Halve every `setScale` on avatar and NPC images: battle 6 → 3, onboarding 5 → 2.5, map 3 → 1.5.
   Or add one `CHAR_SCALE` constant.
4. `AVATARS` becomes the six keys. The picker shows two rows, **Boys** and **Girls**, three each (#2).
5. `Portrait.ts` maps the speaker to the portrait:
   - `professor|sir|teacher` → `npc_professor`
   - `amma|mother` → `npc_amma`
   - `nanna|father` → `npc_nanna`
