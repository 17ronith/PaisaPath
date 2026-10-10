"""Hyderabad overworld map - one 480x270 screen, hop-between-points.

Outputs (out/map/):
    1x|4x/map_base.png        terrain, lakes, river, plain roads, trees (no icons)
    1x|4x/icons/<id>.png      64x72 landmark icons (pad point at 32,66)
    1x|4x/icons/<id>_done.png greyed-out icons for finished landmarks
    1x|4x/water_ripple_N.png  3 ripple overlay frames
    1x|4x/sprites/            boat + auto rickshaw (4 directions x 2 frames)
    previews/                 day / evening / night, done example, animated GIF
    map_data.json             nodes, road paths, boat orbit, auto loop, tints
    README.txt                draw order, timings, anchors

Run:  python hydmap.py
"""
import json
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw

from pxlib import *
from px2 import text, lighten
import mapicons as MI

# ------------------------------------------------------------------ layout (roughly true to real geography)
NODES = [
    ('shilparamam', 'Shilparamam', (54, 112), '05_shilparamam'),
    ('hitec', 'HITEC City', (156, 76), '09_hitec_city'),
    ('durgam', 'Durgam Cheruvu', (124, 168), '02_durgam_cheruvu'),
    ('qutb', 'Qutb Shahi Tombs', (64, 240), '07_qutb_shahi_tombs'),
    ('birla', 'Birla Mandir', (248, 156), '06_birla_mandir'),
    ('tankbund', 'Tank Bund / Hussain Sagar', (344, 106), '03_tank_bund_buddha'),
    ('charminar', 'Charminar', (344, 262), '01_charminar'),
    ('ramoji', 'Film City', (446, 246), '04_film_city'),
]
EDGES = [
    ('shilparamam', 'hitec', [(54, 112), (92, 114), (110, 100), (130, 86), (156, 76)]),
    ('hitec', 'durgam', [(156, 76), (178, 92), (178, 118), (172, 144), (162, 162), (150, 168), (124, 168)]),
    ('durgam', 'qutb', [(124, 168), (148, 168), (158, 176), (156, 192), (136, 206), (112, 222), (94, 234), (64, 240)]),
    ('durgam', 'birla', [(124, 168), (148, 168), (164, 172), (200, 168), (226, 162), (248, 156)]),
    ('birla', 'tankbund', [(248, 156), (282, 150), (300, 136), (318, 126), (334, 120), (342, 110), (344, 106)]),
    ('birla', 'charminar', [(248, 156), (262, 178), (280, 192), (294, 206), (306, 222), (318, 236), (344, 262)]),
    ('qutb', 'charminar', [(64, 240), (110, 240), (150, 238), (178, 236), (204, 250), (244, 258), (290, 264), (344, 262)]),
    ('charminar', 'ramoji', [(344, 262), (378, 264), (400, 262), (418, 254), (446, 246)]),
]
MINOR = [
    [(334, 120), (364, 124), (380, 104), (388, 78), (396, 50), (408, 20), (414, -4)],  # Tank Bund Rd -> Secunderabad
    [(54, 112), (24, 124), (-4, 132)],
    [(96, 168), (80, 164), (66, 152), (58, 134), (54, 112)],                      # Durgam bridge -> Madhapur
]

GR = pal('#c4ec98', '#a8da80', '#8ec668', '#78b058', '#3a6a2a')
ROAD = pal('#fffaf0', '#f2e6c6', '#d6c49c', None, '#a08860')


def catmull(pts):
    Pp = [pts[0]] + list(pts) + [pts[-1]]
    out = []
    for i in range(1, len(Pp) - 2):
        p0, p1, p2, p3 = Pp[i - 1], Pp[i], Pp[i + 1], Pp[i + 2]
        n = max(6, int(math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 2))
        for k in range(n):
            t = k / n
            t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                                    + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3) for j in (0, 1)))
    out.append(tuple(pts[-1]))
    return out


def stroke(samples, r):
    mk = Mk()
    for x, y in samples:
        mk.circ(x, y, r)
    return mk.m


def resample(samples, step):
    out, acc = [samples[0]], 0.0
    for (x0, y0), (x1, y1) in zip(samples, samples[1:]):
        acc += math.hypot(x1 - x0, y1 - y0)
        if acc >= step:
            out.append((x1, y1))
            acc = 0.0
    return out


def icon_zone(x, y, pad=0):
    return R(x - 30 - pad, y - 60 - pad, x + 30 + pad, y + 5 + pad)


ZONES = NONE()
for _n, _nm, (_x, _y), _sc in NODES:
    ZONES |= icon_zone(_x, _y)


# ------------------------------------------------------------------ geography
def m_lake():
    return E(300, 54, 382, 122) | E(318, 46, 376, 96) | E(298, 78, 340, 126)


def m_durgam():
    return E(112, 108, 148, 168) | E(102, 150, 150, 180)


RIVER_PTS = [(-4, 258), (40, 257), (90, 255), (130, 251), (170, 242), (210, 226), (250, 208), (290, 194), (330, 187),
             (372, 186), (404, 180), (440, 172), (484, 166)]


def m_river():
    return stroke(catmull(RIVER_PTS), 3.4)


def water_mask():
    return m_lake() | m_durgam() | m_river()


def ripple_frame(k):
    """Transparent overlay: ripple dashes on every water pixel, phase k of 3 (drifts 4 px per frame)."""
    s = Scene(transparent=True)
    water = water_mask()
    inner = water & shift(water, 0, 2) & shift(water, 0, -2)
    for i, yy in enumerate(range(2, H, 4)):
        for xx in range((i % 2) * 6 + k * 4 - 12, W, 12):
            s.put(R(xx, yy, xx + 3, yy) & inner, WATER['l'])
        if i % 3 == k:
            for xx in range((i * 7) % 24 + k * 4, W, 24):
                s.put(R(xx + 1, yy, xx + 1, yy) & inner, '#ffffff')
    return s.image()


# ------------------------------------------------------------------ sprites
def tree(s, x, y, r=4, p=LEAF):
    s.shadow(E(x - r + 1, y - 1, x + r + 2, y + 2))
    s.put(R(x - 1, y - 2, x, y), TRUNK['b'])
    s.put(R(x, y - 2, x, y), TRUNK['d'])
    cm = O(x, y - r - 2, r)
    s.outline(cm, p['o'])
    s.sh(cm, p, kl=1, kd=2, kdd=1, ol=False)
    s.px(x - r // 2, y - r - 3, mix(p['l'], '#ffffff', 0.35))


def rock_cluster(s, x, y, seed=0):
    rng = random.Random(seed)
    spec = [(x - 5, y - 2, 6, 4), (x + 4, y, 5, 4), (x - 1, y - 6, 4, 3), (x + 9, y + 3, 3, 2), (x - 9, y + 2, 3, 2)]
    for (bx, by, rx, ry) in sorted(spec[:rng.choice([3, 4, 5])], key=lambda b: b[1]):
        bm = E(bx - rx, by - ry, bx + rx, by + ry)
        s.shadow(E(bx - rx + 2, by, bx + rx + 2, by + ry + 2) & ~bm)
        s.outline(bm, '#4a3e34')
        s.sh(bm, GRANITE, kl=1, kd=2, kdd=1, ol=False)
        s.px(bx - rx // 2, by - ry + 1, '#ffffff')


def forest(s, m, seed=0, p=LEAF_DK):
    rng = random.Random(seed)
    ys, xs = np.nonzero(m)
    if not len(ys):
        return
    pts = []
    for gy in range(ys.min(), ys.max() + 8, 6):
        for gx in range(xs.min() - 4 + (gy // 6 % 2) * 4, xs.max() + 6, 8):
            x, y = gx + rng.randint(-1, 1), gy + rng.randint(-1, 1)
            if 0 <= x < W and 0 <= y < H and m[y, x]:
                pts.append((x, y))
    for x, y in sorted(pts, key=lambda t: t[1]):
        cm = O(x, y - 5, 5)
        s.outline(cm, p['o'])
        s.sh(cm, p, kl=1, kd=2, kdd=1, ol=False)
        s.px(x - 2, y - 7, p['l'])


def compass(s, cx, cy):
    r = 16
    s.shadow(O(cx + 2, cy + 2, r + 1))
    ring = O(cx, cy, r)
    s.outline(ring, '#3a2a10')
    s.sh(ring, pal('#fff2b0', '#e8c060', '#c0902c', '#9a6c1c', '#3a2a10'), kl=1, kd=2, kdd=1, ol=False)
    face = O(cx, cy, r - 3)
    s.put(face, '#fff8e8')
    s.put(face & ~shift(face, -1, -1), '#e8dcc0')
    s.put(dilate(face) & ~face, '#8a6a30')
    for a in range(0, 360, 30):
        ra = math.radians(a)
        s.px(cx + (r - 5) * math.cos(ra), cy + (r - 5) * math.sin(ra), '#b8a070')
    # diagonal points
    for a in (45, 135, 225, 315):
        ra = math.radians(a)
        tip = (cx + 9 * math.cos(ra), cy + 9 * math.sin(ra))
        l1 = (cx + 2.4 * math.cos(ra + math.pi / 2), cy + 2.4 * math.sin(ra + math.pi / 2))
        l2 = (cx + 2.4 * math.cos(ra - math.pi / 2), cy + 2.4 * math.sin(ra - math.pi / 2))
        s.put(P([tip, l1, (cx, cy)]), '#d8b050')
        s.put(P([tip, l2, (cx, cy)]), '#a07a28')
    # cardinal points
    for a, cl, cd in ((-90, '#ff6a5a', '#c02828'), (0, '#8a9ac8', '#3a4a7a'), (90, '#8a9ac8', '#3a4a7a'), (180, '#8a9ac8', '#3a4a7a')):
        ra = math.radians(a)
        tip = (cx + 13 * math.cos(ra), cy + 13 * math.sin(ra))
        l1 = (cx + 3.2 * math.cos(ra - math.pi / 2), cy + 3.2 * math.sin(ra - math.pi / 2))
        l2 = (cx + 3.2 * math.cos(ra + math.pi / 2), cy + 3.2 * math.sin(ra + math.pi / 2))
        s.put(P([tip, l1, (cx, cy)]), cl)
        s.put(P([tip, l2, (cx, cy)]), cd)
        s.put(L([tip, (cx, cy)]), '#2a2030')
    s.sh(O(cx, cy, 2), pal('#ffffff', '#ffd23c', '#c08a20', None, '#3a2808'), kl=1, kd=1, kdd=0)
    # N plate
    plate = R(cx - 5, cy - r - 9, cx + 5, cy - r - 1)
    s.outline(plate, '#3a2a10')
    s.sh(plate, pal('#ff8a7a', '#d83030', '#a82020', None, '#3a0808'), kl=1, kd=1, kdd=0, ol=False)
    text(s, 'N', cx - 2, cy - r - 8, '#ffffff')


# ------------------------------------------------------------------ base
def map_base():
    s = Scene(31)
    rng = random.Random(31)
    s.put(R(0, 0, W - 1, H - 1), GR['b'])
    for y in range(4, H, 9):
        for x in range((y // 9 % 2) * 7 + 3, W, 14):
            s.px(x - 1, y - 1, GR['d'])
            s.px(x, y, GR['d'])
            s.px(x + 1, y - 1, GR['d'])
    # soft light patches for variety
    for (x0, y0, x1, y1) in ((180, 70, 300, 140), (20, 140, 120, 230), (380, 120, 470, 200), (190, 200, 300, 260)):
        s.dith(E(x0, y0, x1, y1), GR['l'], 0.22)

    lake, durg, river = m_lake(), m_durgam(), m_river()
    water = lake | durg | river

    trail_roads = NONE()
    for a, b, cp in EDGES:
        trail_roads |= stroke(catmull(cp), 3.0)
    minor = NONE()
    for cp in MINOR:
        minor |= stroke(catmull(cp), 2.0)
    roads = (trail_roads | minor)


    # water: bank, body, ripples
    for m in (lake, durg):
        s.put(dilate(dilate(m)) & ~m, '#a07850')
        s.put(dilate(m) & ~m, '#ecd8a0')
    s.put(dilate(dilate(river)) & ~river & ~lake, '#a07850')
    s.put(dilate(river) & ~river & ~lake, '#ecd8a0')
    s.put(water, WATER['b'])
    deep = water
    for _ in range(4):
        deep = deep & shift(deep, 1, 0) & shift(deep, -1, 0) & shift(deep, 0, 1) & shift(deep, 0, -1)
    s.put(deep & (lake | durg), '#4a94dc')
    s.put(water & ~shift(water, 0, -1), '#e6f6ff')

    # roads
    land_roads = roads & ~water
    s.put(dilate(land_roads) & ~roads & ~water, '#cbb88e')
    s.put(land_roads, '#efe2c0')
    # bridges over the river + jetty into Hussain Sagar
    br = roads & river & ~lake
    s.put(dilate(br) & water & ~br, '#8a8070')
    s.put(br, '#efe2c0')
    jet = stroke(catmull(EDGES[4][2]), 1.6) & lake & R(0, 117, W - 1, H - 1)
    s.put(dilate(jet) & lake & ~jet, '#5a3a20')
    s.put(jet, '#c8905a')
    ys, xs = np.nonzero(jet)
    for y in range(ys.min() if len(ys) else 0, (ys.max() + 1) if len(ys) else 0, 2):
        s.put(R(0, y, W - 1, y) & jet, '#9a6a3a')

    blocked = dilate(dilate(roads)) | dilate(dilate(water)) | ZONES

    # ---- parks and forests (solid patches)
    kbr = E(170, 98, 214, 128)
    uohyd = P([(0, 0), (118, 0), (112, 10), (96, 20), (70, 24), (40, 30), (16, 40), (0, 46)])
    westbelt = P([(0, 46), (14, 50), (18, 70), (12, 92), (16, 120), (8, 150), (0, 156)])
    s.put(kbr & ~blocked, '#62b44e')
    forest(s, (uohyd | westbelt) & ~blocked, seed=3)
    forest(s, kbr & ~blocked, seed=4, p=LEAF)

    sprites = []   # (y, fn)

    # ---- trees: lakeside promenade, river banks, a few singles
    for x, y in resample(catmull([(300, 134), (298, 110), (297, 84), (302, 58)]), 12)[1:]:
        sprites.append((y, lambda x=x, y=y: tree(s, int(x) - 7, int(y), 3)))
    for x, y in resample(catmull(RIVER_PTS), 22):
        tx, ty = int(x), int(y) - 7
        if 0 < tx < W and 0 < ty < H and not blocked[max(0, ty - 6):ty + 1, max(0, tx - 4):tx + 4].any():
            sprites.append((ty, lambda tx=tx, ty=ty: tree(s, tx, ty, 3)))
    for (x, y) in [(110, 64), (100, 140), (166, 96), (226, 100), (232, 136), (200, 184), (150, 214), (30, 250), (110, 262),
                   (380, 120), (400, 140), (478, 70), (310, 170), (160, 120), (36, 168)]:
        if not blocked[y - 8:y + 1, x - 4:x + 4].any():
            sprites.append((y, lambda x=x, y=y: tree(s, x, y, 4)))

    # ---- rocks (Hyderabad boulders)
    for (x, y, sd) in [(172, 72, 1), (154, 150, 2), (100, 196, 3), (38, 150, 5), (232, 122, 6), (472, 236, 7)]:
        if not blocked[y - 6:y + 4, x - 10:x + 12].any():
            sprites.append((y, lambda x=x, y=y, sd=sd: rock_cluster(s, x, y, sd)))

    for _, fn in sorted(sprites, key=lambda t: t[0]):
        fn()

    compass(s, 452, 36)

    # frame
    s.put(R(0, 0, W - 1, H - 1) & ~R(2, 2, W - 3, H - 3), '#2e4a2a')
    s.put(R(2, 2, W - 3, H - 3) & ~R(3, 3, W - 4, H - 4), '#dff4c8')
    for (cx, cy) in ((0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)):
        s.px(cx, cy, '#1a2a18')
    return s


# ------------------------------------------------------------------ road paths (for walking the avatar)
def edge_path(cp, step=4.0):
    pts = [(int(round(x)), int(round(y))) for x, y in resample(catmull(cp), step)]
    if pts[-1] != tuple(cp[-1]):
        pts.append(tuple(cp[-1]))
    return pts


# ------------------------------------------------------------------ export
def save(im, path, scale):
    if scale != 1:
        im = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
    im.save(path)


README = """HYDERABAD MAP - asset guide
===========================
All coordinates are at 1x (480x270). The 4x folder is the same art scaled x4 with
nearest-neighbour; multiply every coordinate/anchor by 4 when you use it.

DRAW ORDER (every frame)
  1. map_base.png
  2. water_ripple_0/1/2.png      cycle 0 -> 1 -> 2 -> 0 ..., 250 ms per frame
  3. icons + boat + auto         y-sorted together (smaller y drawn first):
                                   icon sort-y = node y, sprite sort-y = its point y
  4. birds                       always on top (they're in the sky)
  5. time-of-day tint            multiply the whole map by the tint colour
                                   (Godot: CanvasModulate / Phaser: setTint / Unity: color)

ICONS (64x72)
  icons/<id>.png        normal
  icons/<id>_done.png   greyed out - use once the player has finished that landmark
  Draw at (node.x - 32, node.y - 66) so the pad point lands on the node.

WATER RIPPLES
  water_ripple_0.png, water_ripple_1.png, water_ripple_2.png
  Transparent overlays; each frame shifts the ripple dashes 4 px so the water drifts.

BOAT (circles the Buddha on Hussain Sagar) - sprites/boat_<dir>_<0|1>.png, 16x13
  dir = right | left | up | down (pick from the boat point's "dir")
  Frames 0/1 = bob + wake, swap every 300 ms.
  Anchor (8, 10): draw at (x - 8, y - 10).
  Path: map_data.json -> boat.points (90 points), advance one point every 100 ms (loop).

AUTO RICKSHAW (drives the road loop) - sprites/auto_<dir>_<0|1>.png, 12x11
  Frames 0/1 = engine bounce, swap every 150 ms.
  Anchor (6, 10): draw at (x - 6, y - 10).
  Path: map_data.json -> auto.loop (180 points), advance one point every 100 ms (loop).

BIRDS - sprites/bird_0.png (wings up), bird_1.png (level), bird_2.png (down), 9x5
  Flap order 0 -> 1 -> 2 -> 1, 100 ms per frame; anchor (4, 2).
  Two flocks (5 birds heading east, 3 heading west) drift across in a gentle wave.
  Their motion rule + formation offsets are in map_data.json -> birds.

TIME OF DAY (multiply colours, also in map_data.json -> time_of_day)
  day     #ffffff   (no change)
  evening #ffd8bc
  night   #7a86c8
  Fade between them over ~1 s when the time changes.

PREVIEWS
  previews/map_animated_day.gif, _evening.gif, _night.gif - 18 s seamless loops
  previews/map_day|evening|night.png, map_done_example.png - stills

AVATAR HOPS
  map_data.json -> edges[].path: points every ~4 px along each road, from -> to.
  Tank Bund: the road ends at the jetty; the last few path points cross the water
  to the island (a good spot to show the avatar riding the boat).
"""


def main(outdir='out/map'):
    import mapanim as MA
    for sc in ('1x', '4x'):
        os.makedirs(f'{outdir}/{sc}/icons', exist_ok=True)
        os.makedirs(f'{outdir}/{sc}/sprites', exist_ok=True)
    os.makedirs(f'{outdir}/previews', exist_ok=True)
    im = map_base().image().convert('RGB')
    if len(im.getcolors(1 << 20)) > 160:
        im = im.quantize(colors=160, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGB')
    icons = {k: MI.icon_image(fn) for k, fn in MI.ICONS.items()}
    for k in list(icons):
        icons[k + '_done'] = MA.done_icon(icons[k])
    ripples = [ripple_frame(k) for k in range(3)]
    sprites = MA.all_sprites()
    for sc, k in (('1x', 1), ('4x', 4)):
        save(im, f'{outdir}/{sc}/map_base.png', k)
        for i, r in enumerate(ripples):
            save(r, f'{outdir}/{sc}/water_ripple_{i}.png', k)
        for name, iim in icons.items():
            save(iim, f'{outdir}/{sc}/icons/{name}.png', k)
        for name, sim in sprites.items():
            save(sim, f'{outdir}/{sc}/sprites/{name}.png', k)

    paths = {(a, b): edge_path(cp) for a, b, cp in EDGES}
    boat = MA.boat_orbit(n=90)
    auto = MA.auto_loop(paths, n=180)
    nodes = [(nid, (x, y)) for nid, name, (x, y), sc in NODES]

    birds = MA.bird_sprites()
    for sc, k in (('1x', 1), ('4x', 4)):
        for i, b in enumerate(birds):
            save(b, f'{outdir}/{sc}/sprites/bird_{i}.png', k)

    def frame(i, done=(), tint=None):
        bx, by, bd, _ = boat[i % len(boat)]
        ax, ay, ad = auto[i % len(auto)]
        return MA.render(im, ripples[(i // 3) % 3], icons, nodes, done=done,
                         boat=(sprites[f'boat_{bd}_{(i // 3) % 2}'], bx, by, MA.BOAT_ANCHOR),
                         auto=(sprites[f'auto_{ad}_{(i // 2) % 2}'], ax, ay, MA.AUTO_ANCHOR), tint=tint,
                         birds=(birds, MA.birds_at(i)))

    for name, tint in MA.TINTS.items():
        save(frame(10, tint=None if name == 'day' else tint), f'{outdir}/previews/map_{name}.png', 2)
    save(frame(10, done=('charminar', 'qutb', 'durgam')), f'{outdir}/previews/map_done_example.png', 2)
    n = 180                     # 18 s: boat x2, auto x1, birds x1, ripples x20 - every loop closes cleanly
    for name, tint in MA.TINTS.items():
        gif = [frame(i, tint=None if name == 'day' else tint).resize((W * 2, H * 2), Image.NEAREST) for i in range(n)]
        gif[0].save(f'{outdir}/previews/map_animated_{name}.gif', save_all=True, append_images=gif[1:], duration=100,
                    loop=0, optimize=False, disposal=1)

    data = {
        'size': [W, H],
        'note': 'Coordinates at 1x (480x270); multiply by 4 for 4x assets. See README.txt for draw order and timings.',
        'nodes': [{'id': nid, 'name': name, 'x': x, 'y': y, 'icon': f'icons/{nid}.png', 'icon_done': f'icons/{nid}_done.png',
                   'scene': f'{scene}.png'} for nid, name, (x, y), scene in NODES],
        'edges': [{'from': a, 'to': b, 'path': [list(p) for p in paths[(a, b)]]} for a, b, cp in EDGES],
        'water_ripple': {'frames': [f'water_ripple_{i}.png' for i in range(3)], 'ms_per_frame': 250},
        'boat': {'sprite': 'sprites/boat_<dir>_<frame>.png', 'anchor': list(MA.BOAT_ANCHOR), 'ms_per_point': 100,
                 'ms_per_frame': 300, 'points_format': '[x, y, dir, behind|front of the Buddha icon]', 'points': boat},
        'auto': {'sprite': 'sprites/auto_<dir>_<frame>.png', 'anchor': list(MA.AUTO_ANCHOR), 'ms_per_point': 100,
                 'ms_per_frame': 150, 'loop_format': '[x, y, dir]', 'loop': auto},
        'birds': {'sprite': 'sprites/bird_<frame>.png', 'size': [9, 5], 'anchor': [4, 2], 'flap_order': MA.BIRD_ORDER,
                  'ms_per_frame': 100, 'ms_per_step': 100, 'wrap': [-30, W + 30],
                  'flock_rule': 'leader x += speed (or -= for dir left) each step, wrapping over wrap; '
                                'leader y = y + amp*sin(2*pi*x/wave); birds = leader + formation offsets; '
                                'bird k flaps at flap_order[(step + k) % 4]',
                  'flocks': MA.FLOCKS},
        'time_of_day': {'mode': 'multiply', **MA.TINTS},
    }
    with open(f'{outdir}/map_data.json', 'w') as f:
        json.dump(data, f, indent=1)
    with open(f'{outdir}/README.txt', 'w') as f:
        f.write(README)
    print('map ok,', len(im.getcolors(1 << 20)), 'colours |', len(sprites), 'sprites |', len(boat), 'boat pts |',
          len(auto), 'auto pts')


if __name__ == '__main__':
    main()
