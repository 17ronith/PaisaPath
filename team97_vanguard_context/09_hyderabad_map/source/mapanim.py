"""Animation + state extras for the overworld map.

- boat sprites (4 directions x 2 frames) and its orbit around the Buddha
- auto-rickshaw sprites (4 directions x 2 frames) and a loop along the roads
- greyed-out "done" versions of landmark icons
- time-of-day tints (multiply / modulate colours)
- a frame renderer used for previews and the animated GIF
"""
import math

import numpy as np
from PIL import Image

from pxlib import C, W, H

# ------------------------------------------------------------------ hand-drawn sprites
AUTO_PAL = {'k': '#141418', 'g': '#fff6a8', 'b': '#f0c418', 'd': '#3a2a30', 'r': '#c84848', 'w': '#a8e0f8',
            'Y': '#fff080', 'y': '#f8d020', 'G': '#c89a10', 'h': '#fff8c0', 'W': '#26262c'}
AUTO_RIGHT = ["..kkkkkkkk..",
              ".kggggggggk.",
              ".kbbbbbbbbbk",
              ".kbdrrddkwwk",
              ".kbdrrddkwwk",
              "kYYYYYYYYYYk",
              "kyyyyyyyyyhk",
              "kGGGGGGGGGGk",
              ".kWWk...kWk.",
              "..kk.....k.."]
AUTO_DOWN = ["...kkkkkk...",
             "..kggggggk..",
             "..kbbbbbbk..",
             "..kbwwwwbk..",
             "..kbwwwwbk..",
             ".kkYYYYYYkk.",
             "kWkyyhhyykWk",
             "kWkGGGGGGkWk",
             ".k.kkWWkk.k.",
             ".....kk....."]
AUTO_UP = ["...kkkkkk...",
           "..kggggggk..",
           "..kbbbbbbk..",
           "..kbbbbbbk..",
           "..kbbbbbbk..",
           ".kkYYYYYYkk.",
           "kWkyyyyyykWk",
           "kWkrGGGGrkWk",
           ".k.kkkkkk.k.",
           "............"]

BOAT_PAL = {'k': '#1e2a3a', 'O': '#ff8a3c', 'o': '#d06020', 'W': '#ffffff', 'R': '#e04040', 'B': '#2a5ab8',
            'p': '#c88a5c', 'f': '#e6f6ff'}
BOAT_RIGHT = ["................",
              ".....kkkkkkk....",
              "....kOOOOOOOk...",
              "....kooooooook..",
              ".....k.p.p.k....",
              ".....k.....k....",
              "..kkkkkkkkkkkkk.",
              ".kWWWWWWWWWWWWWk",
              ".kRRRRRRRRRRRRk.",
              "..kBBBBBBBBBBk..",
              "f..kkkkkkkkkk...",
              ".ff............."]
BOAT_DOWN = ["................",
             "....kkkkkkkk....",
             "...kOOOOOOOOk...",
             "...kooooooook...",
             "....k.p..p.k....",
             "....k......k....",
             "...kkkkkkkkkk...",
             "..kWWWWWWWWWWk..",
             "..kRRRRRRRRRRk..",
             "f..kBBBBBBBBk..f",
             "....kBBBBBBk....",
             ".....kkkkkk....."]
BOAT_UP = ["................",
           "....kkkkkkkk....",
           "...kOOOOOOOOk...",
           "...kooooooook...",
           "....k.p..p.k....",
           "....k......k....",
           "...kkkkkkkkkk...",
           "..kWWWWWWWWWWk..",
           "..kRRRRRRRRRRk..",
           "..kBBBBBBBBBBk..",
           "...kkkkkkkkkk...",
           "..f.f.ff.f.f...."]


def _grid(rows, pal):
    h, w = len(rows), max(len(r) for r in rows)
    a = np.zeros((h, w, 4), np.uint8)
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in pal:
                a[y, x] = C(pal[ch])
    return a


def _mirror(rows):
    return [r[::-1] for r in rows]


def auto_frames(rows):
    """12x11 canvas: frame 0 = at rest, frame 1 = body bounced up 1 px (wheels stay put)."""
    a = _grid(rows, AUTO_PAL)
    h, w = a.shape[:2]
    f0 = np.zeros((h + 1, w, 4), np.uint8)
    f0[1:] = a
    f1 = f0.copy()
    body = h - 2                    # last two rows are wheels
    f1[0:body] = f0[1:body + 1]
    f1[body] = f0[body]
    return [Image.fromarray(f0, 'RGBA'), Image.fromarray(f1, 'RGBA')]


def boat_frames(rows):
    """16x13 canvas: frame 1 bobs the hull down 1 px and shifts the wake."""
    wake_rows = [''.join(ch if ch == 'f' else '.' for ch in r) for r in rows]
    body_rows = [''.join('.' if ch == 'f' else ch for ch in r) for r in rows]
    body, wake = _grid(body_rows, BOAT_PAL), _grid(wake_rows, BOAT_PAL)
    h, w = body.shape[:2]
    out = []
    for k in range(2):
        f = np.zeros((h + 1, w, 4), np.uint8)
        wk = np.roll(wake, k, axis=1)
        f[k:k + h][wk[..., 3] > 0] = wk[wk[..., 3] > 0]
        b = body
        f[k:k + h][b[..., 3] > 0] = b[b[..., 3] > 0]
        out.append(Image.fromarray(f, 'RGBA'))
    return out


def all_sprites():
    sp = {}
    for d, rows in (('right', AUTO_RIGHT), ('left', _mirror(AUTO_RIGHT)), ('down', AUTO_DOWN), ('up', AUTO_UP)):
        for i, im in enumerate(auto_frames(rows)):
            sp[f'auto_{d}_{i}'] = im
    for d, rows in (('right', BOAT_RIGHT), ('left', _mirror(BOAT_RIGHT)), ('down', BOAT_DOWN), ('up', BOAT_UP)):
        for i, im in enumerate(boat_frames(rows)):
            sp[f'boat_{d}_{i}'] = im
    return sp


BIRD_PAL = {'k': '#2a3048', 'w': '#8a94b0'}
BIRD_FRAMES = [["k.......k",       # wings up
                ".k.....k.",
                "..kw.wk..",
                "...kkk...",
                "....k...."],
               [".........",       # wings level
                ".........",
                "kkkwkwkkk",
                "...kkk...",
                "....k...."],
               [".........",       # wings down
                "....k....",
                "...kkk...",
                "..kw.wk..",
                ".k.....k."]]
BIRD_ORDER = [0, 1, 2, 1]           # flap cycle, 100 ms per step
FLOCKS = [
    # leader path: x moves at speed px per 100 ms and wraps over [-30, W + 30); y = y0 + amp * sin(2*pi*x / wave)
    {'dir': 'right', 'y': 62, 'amp': 7, 'wave': 240, 'speed': 3.0, 'x0': 60,
     'formation': [[0, 0], [-9, -5], [-9, 5], [-18, -10], [-18, 10]]},
    {'dir': 'left', 'y': 196, 'amp': 6, 'wave': 200, 'speed': 3.0, 'x0': 380,
     'formation': [[0, 0], [9, -5], [9, 5]]},
]
SPAN = 540                          # wrap distance (W + 60): 180 steps at 3 px


def bird_sprites():
    return [Image.fromarray(_grid(f, BIRD_PAL), 'RGBA') for f in BIRD_FRAMES]


def birds_at(i):
    """Return [(frame_index, x, y)] for every bird at animation step i (100 ms steps)."""
    out = []
    for fi, fl in enumerate(FLOCKS):
        sgn = 1 if fl['dir'] == 'right' else -1
        lx = (fl['x0'] + 30 + sgn * fl['speed'] * i) % SPAN - 30
        ly = fl['y'] + fl['amp'] * math.sin(2 * math.pi * lx / fl['wave'])
        for bi, (dx, dy) in enumerate(fl['formation']):
            out.append((BIRD_ORDER[(i + bi + fi) % 4], lx + dx, ly + dy))
    return out


AUTO_ANCHOR = (6, 10)     # bottom-centre of the wheels on the 12x11 canvas
BOAT_ANCHOR = (8, 10)     # waterline centre on the 16x13 canvas


# ------------------------------------------------------------------ motion data
def direction(dx, dy):
    if abs(dx) >= abs(dy):
        return 'right' if dx >= 0 else 'left'
    return 'down' if dy >= 0 else 'up'


def boat_orbit(cx=344, cy=88, rx=28, ry=24, n=72, pad_y=106):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x, y = cx + rx * math.cos(t), cy + ry * math.sin(t)
        d = direction(-rx * math.sin(t), ry * math.cos(t))
        pts.append([int(round(x)), int(round(y)), d, 'behind' if y < pad_y else 'front'])
    return pts


def auto_loop(paths, n=144):
    """paths: dict (from,to)->list of points. Loop: Durgam bridgehead -> Birla -> Charminar -> Qutb -> back."""
    p1 = paths[('durgam', 'birla')]
    p2 = paths[('birla', 'charminar')]
    p3 = list(reversed(paths[('qutb', 'charminar')]))
    p4 = list(reversed(paths[('durgam', 'qutb')]))
    p1 = [p for p in p1 if not (p[0] < 148 and p[1] < 172)]
    p4 = [p for p in p4 if not (p[0] < 148 and p[1] < 172)]
    raw = p1 + p2[1:] + p3[1:] + p4[1:]
    seg = [math.hypot(raw[(i + 1) % len(raw)][0] - raw[i][0], raw[(i + 1) % len(raw)][1] - raw[i][1]) for i in range(len(raw))]
    total = sum(seg)
    pts, j, acc = [], 0, 0.0
    for k in range(n):
        d = total * k / n
        while acc + seg[j] < d:
            acc += seg[j]
            j += 1
        t = (d - acc) / seg[j] if seg[j] else 0
        a, b = raw[j], raw[(j + 1) % len(raw)]
        pts.append((int(round(a[0] + (b[0] - a[0]) * t)), int(round(a[1] + (b[1] - a[1]) * t))))
    out = []
    for i, (x, y) in enumerate(pts):
        nx, ny = pts[(i + 1) % len(pts)]
        out.append([x, y, direction(nx - x, ny - y)])
    return out


# ------------------------------------------------------------------ states + tints
def done_icon(im):
    """Greyed-out version for finished landmarks (keeps the outline and shading, drops the colour)."""
    a = np.asarray(im.convert('RGBA')).astype(float)
    lum = a[..., 0] * 0.3 + a[..., 1] * 0.59 + a[..., 2] * 0.11
    g = lum * 0.72 + 30
    out = a.copy()
    out[..., 0] = np.clip(g - 4, 0, 255)
    out[..., 1] = np.clip(g - 1, 0, 255)
    out[..., 2] = np.clip(g + 8, 0, 255)
    return Image.fromarray(out.astype(np.uint8), 'RGBA')


TINTS = {'day': '#ffffff', 'evening': '#ffd8bc', 'night': '#7a86c8'}


def apply_tint(im, hexcol):
    c = C(hexcol)[:3].astype(float) / 255.0
    a = np.asarray(im.convert('RGB')).astype(float) * c
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB')


# ------------------------------------------------------------------ frame renderer
def render(base, ripple, icons, nodes, done=(), boat=None, auto=None, tint=None, birds=None):
    """Composite one map frame. nodes: list of (id, (x, y)). boat/auto: (sprite, x, y, anchor)."""
    fr = Image.alpha_composite(base.convert('RGBA'), ripple)
    layers = []
    for nid, (x, y) in nodes:
        ic = icons[nid + '_done'] if nid in done else icons[nid]
        layers.append((y, ic, x - 32, y - 66))
    for item in (boat, auto):
        if item:
            sp, x, y, (ax, ay) = item
            layers.append((y, sp, x - ax, y - ay))
    for _, im, x, y in sorted(layers, key=lambda t: t[0]):
        fr.alpha_composite(im, (int(x), int(y)))
    if birds:
        sprites, pts = birds
        for k, x, y in pts:
            sp = sprites[k]
            bx, by = int(round(x)) - 4, int(round(y)) - 2
            if -sp.width < bx < W and -sp.height < by < H:
                cx0, cy0 = max(0, -bx), max(0, -by)
                piece = sp.crop((cx0, cy0, min(sp.width, W - bx), min(sp.height, H - by)))
                fr.alpha_composite(piece, (bx + cx0, by + cy0))
    fr = fr.convert('RGB')
    return apply_tint(fr, tint) if tint else fr
