"""sprites - character sprites drawn with the same pxlib toolkit as the backgrounds:
boolean masks, Scene.sh() ramps lit from the top-left, 1-px outlines, flat colours,
no anti-aliasing. Each sprite is drawn on a transparent Scene and cropped.

Run:  python sprites.py        -> ../sprites/1x/<key>.png, ../sprites/4x/<key>@4x.png,
                                  ../sprites/sprite_sheet.png, ../sprites/battle_preview_sprites.png

Sizes: avatars 48x48 (front for the picker, back for the battle platform), Professor
48x48 portraits + 32x32 walk x2, opponent portraits 48x48 (front, waist-up).
Keys match the game (src/game/ui/Portrait.ts ROLES, PreloadScene).
"""
import os

import numpy as np
from PIL import Image, ImageDraw

from pxlib import *

OUT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'sprites'))
INK = '#1c1418'                      # outer silhouette outline (as px2.person)
EYE = '#1e1420'
MOUTH = '#9a3c34'
BLUSH = '#f2927c'


def cramp(c, k=0.6):
    """Clothing ramp whose 'o' (internal contour) is a dark tone of the same hue."""
    return ramp(c, mix(c, '#140c18', k))


# skin ramps: l / b / d / dd / o
SK = {
    'wheat': pal('#f8cfa4', '#e2aa7e', '#c4865c', '#a46a46', '#5a3020'),
    'tan': pal('#eab486', '#cc8e60', '#aa6e44', '#8a5634', '#4a2616'),
    'brown': pal('#d29a6c', '#b07a4c', '#8e5c36', '#704628', '#3a1e10'),
}
HAIR_BLK = pal('#5c5470', '#2c2430', '#1e181e', '#140e12', '#0c0809')
HAIR_BRN = pal('#7a5444', '#4a3026', '#36221a', '#261610', '#120a06')
HAIR_GRY = pal('#ffffff', '#d6d6dc', '#aeaeb8', '#8c8c98', '#3c3c48')


class Cell:
    """A w x h sprite drawn at (ox, oy) on a transparent Scene, in local coordinates."""

    def __init__(s, w=48, h=48):
        s.sc = Scene(transparent=True)
        s.w, s.h, s.ox, s.oy = w, h, 16, 16
        s.U = NONE()                 # union of all parts, for the silhouette outline

    def R(s, x0, y0, x1, y1): return R(s.ox + x0, s.oy + y0, s.ox + x1, s.oy + y1)
    def E(s, x0, y0, x1, y1): return E(s.ox + x0, s.oy + y0, s.ox + x1, s.oy + y1)
    def P(s, pts): return P([(s.ox + x, s.oy + y) for x, y in pts])
    def L(s, pts, w=1): return L([(s.ox + x, s.oy + y) for x, y in pts], w)

    def part(s, m, p, line=True, **k):
        """Shade one part. Where it sits on earlier parts, its edge gets a contour line in its
        own dark tone (DS-style coloured inner outlines); the silhouette gets INK at the end."""
        k.setdefault('kl', 1)
        k.setdefault('kd', 1)
        k.setdefault('kdd', 0)
        s.sc.sh(m, p, ol=False, **k)
        if line:
            s.sc.put(dilate(m) & ~m & s.U, p.get('o') if p.get('o') is not None else INK)
        s.U |= m
        return m

    def put(s, m, c):
        s.sc.put(m, c)

    def px(s, x, y, c):
        s.sc.px(s.ox + x, s.oy + y, c)

    def pxs(s, pts, c):
        for x, y in pts:
            s.px(x, y, c)

    def image(s):
        s.sc.put(dilate(s.U) & ~s.U, INK)
        a = s.sc.a[s.oy:s.oy + s.h, s.ox:s.ox + s.w]
        return Image.fromarray(a.copy(), 'RGBA')


# ================================================================== avatar body (48x48)
# Chibi proportions (DS overworld/trainer look): head ~19 px, body ~23 px, feet at y 44.
# The figure is symmetric about x = 23.5.

def legs(c, pants, shoes, top=33, bottom=41, sandals=None):
    hip = c.R(17, top, 30, top + 3)
    lm, rm = c.R(17, top, 22, bottom), c.R(25, top, 30, bottom)
    c.part(hip | lm | rm, pants, kd=1)
    if sandals is not None:                                        # bare feet + chappal soles
        ft = c.R(17, bottom + 1, 22, bottom + 3) | c.R(25, bottom + 1, 30, bottom + 3)
        c.part(ft, sandals['skin'], kd=1)
        c.part(c.R(16, bottom + 3, 22, bottom + 3) | c.R(25, bottom + 3, 31, bottom + 3), sandals['sole'], kl=0, kd=0)
        c.put(c.R(18, bottom + 1, 21, bottom + 1) | c.R(26, bottom + 1, 29, bottom + 1), sandals['sole']['b'])
    else:
        sh = c.R(16, bottom + 1, 22, bottom + 3) | c.R(25, bottom + 1, 31, bottom + 3)
        c.part(sh, shoes, kd=1)
        c.put(c.R(16, bottom + 3, 22, bottom + 3) | c.R(25, bottom + 3, 31, bottom + 3), shoes['dd'])
        c.px(17, bottom + 1, shoes['l'])
        c.px(26, bottom + 1, shoes['l'])


def torso(c, top_p, y1=33, flare=0):
    m = c.P([(18, 22), (29, 22), (31, 24), (31 + flare, y1), (16 - flare, y1), (16, 24)])
    c.part(m, top_p, kd=2, kdd=1)
    return m


def arms(c, sleeve, sk, sleeve_to=27, hand_y=35):
    """Arms hang beside the body: sleeve from the shoulder to `sleeve_to`, then a skin
    forearm that ends in a rounded hand at hand_y."""
    for x0, x1, sx in ((12, 15, 1), (32, 35, -1)):
        inner = x1 if sx > 0 else x0
        outer = x0 if sx > 0 else x1
        skin = c.R(x0, sleeve_to, x1, hand_y - 2) | c.E(x0, hand_y - 4, x1, hand_y)
        c.part(skin, sk, kd=1)
        sl = c.P([(inner + 2 * sx, 22), (inner, 22), (outer, 24), (outer, sleeve_to), (inner, sleeve_to)])
        sl |= c.R(min(x0, x1), 24, max(x0, x1), sleeve_to)
        c.part(sl, sleeve, kd=1)


def head(c, sk, ears=True):
    c.part(c.R(21, 19, 26, 22), sk, kl=0, kd=1)                   # neck
    if ears:
        c.part(c.E(12, 11, 16, 16) | c.E(31, 11, 35, 16), sk, kd=1)
    m = c.E(14, 2, 33, 21)
    c.part(m, sk, kl=1, kd=1, kdd=0)
    c.put(m & ~shift(m, 0, -1) & c.R(17, 18, 30, 21), sk['d'])      # soft chin shade
    return m


def face(c, sk, mood='smile', glasses=None):
    for ex in (18, 28):
        c.put(c.R(ex, 11, ex + 1, 14), EYE)
        c.px(ex + 1, 11, '#ffffff')
        c.px(ex, 14, '#5a3e52')
    c.px(23, 15, sk['d'])                                          # nose
    c.pxs([(17, 10), (18, 9), (19, 9), (28, 9), (29, 9), (30, 10)], mix(sk['o'], sk['b'], 0.35))  # brows
    if mood == 'smile':
        c.pxs([(21, 17), (22, 18), (23, 18), (24, 18), (25, 17)], MOUTH)
    elif mood == 'grin':
        c.put(c.R(21, 17, 25, 18), MOUTH)
        c.put(c.R(22, 17, 24, 17), '#ffffff')
    elif mood == 'smirk':
        c.pxs([(22, 18), (23, 18), (24, 17), (25, 17)], MOUTH)
    else:
        c.put(c.R(22, 18, 24, 18), MOUTH)
    c.pxs([(16, 15), (17, 15), (30, 15), (31, 15)], BLUSH)


# ---------------------------------------------------------------- hair styles
def hair_short_front(c, hp):
    cap = c.E(13, 0, 34, 15) & c.R(13, 0, 34, 6)
    fringe = c.P([(13, 5), (34, 5), (33, 8), (31, 7), (29, 9), (27, 7), (24, 9), (22, 7), (19, 9), (17, 7), (15, 9), (13, 8)])
    sides = c.R(13, 5, 15, 11) | c.R(32, 5, 34, 11)
    m = cap | fringe | sides
    c.part(m, hp, kd=1, kdd=0)
    c.put(c.R(17, 2, 21, 2) | c.R(16, 3, 17, 3), hp['l'])          # sheen
    return m


def hair_short_back(c, hp):
    m = (c.E(13, 0, 34, 19) & c.R(13, 0, 34, 16)) | c.P([(14, 15), (33, 15), (31, 18), (16, 18)])
    c.part(m, hp, kd=2, kdd=1)
    c.put(c.R(18, 2, 23, 2) | c.R(16, 3, 18, 3), hp['l'])
    for x in (18, 23, 28):
        c.put(c.L([(x, 6), (x + 1, 12)]) & m, hp['d'])
    return m


# ================================================================== avatars
def avatar_boy_1(back=False):
    """Boy, dark hair, green tee, jeans, red sneakers."""
    c = Cell()
    sk = SK['wheat']
    tee, jeans, shoes = cramp('#3cb46e'), cramp('#4a6cc0'), cramp('#e05048')
    legs(c, jeans, shoes)
    torso(c, tee)
    arms(c, tee, sk)
    head(c, sk)
    if back:
        hair_short_back(c, HAIR_BLK)
    else:
        face(c, sk)
        hair_short_front(c, HAIR_BLK)
        c.put(c.R(21, 22, 26, 22), tee['dd'])                     # collar
    return c.image()


def avatar_boy_2(back=False):
    """Boy, headband, kurta-shirt, cotton pyjama, chappals."""
    c = Cell()
    sk = SK['tan']
    kurta, pyj = cramp('#78c2ea'), cramp('#f0e6cc', 0.5)
    band = cramp('#f0882a')
    legs(c, pyj, None, sandals={'skin': sk, 'sole': cramp('#8a5a32')})
    m = torso(c, kurta, y1=37, flare=1)
    c.put(c.R(15, 37, 32, 37) & m, kurta['d'])                    # hem
    arms(c, kurta, sk, sleeve_to=30)
    head(c, sk)
    if back:
        hair_short_back(c, HAIR_BLK)
        c.part(c.R(13, 7, 34, 8), band, kd=1)
        c.part(c.E(28, 6, 31, 9), band, kd=1)                      # knot
        c.part(c.P([(30, 8), (32, 8), (34, 14), (32, 14)]) | c.P([(28, 9), (30, 9), (30, 15), (28, 15)]), band, kd=1)
    else:
        face(c, sk, mood='grin')
        hair_short_front(c, HAIR_BLK)
        c.part(c.R(13, 4, 34, 5), band, kd=1)
        c.part(c.P([(33, 4), (36, 3), (37, 7), (35, 6), (34, 6)]), band, kd=1)  # knot at the side
        c.put(c.R(23, 22, 24, 28), kurta['d'])                    # placket
        c.pxs([(23, 24), (24, 26)], '#ffffff')
        c.put(c.R(21, 22, 26, 22), kurta['dd'])
    return c.image()


def plait(c, hp, x, y0, y1, ribbon, r=2):
    segs = []
    for i, y in enumerate(range(y0, y1, 3)):
        dx = 0 if i % 2 == 0 else 1
        segs.append(c.E(x - r + dx, y, x + r + dx - (1 if r < 2 else 0), y + 3))
    for sgm in segs:
        c.part(sgm, hp, kd=1)
    c.part(c.R(x - 1, y1, x + 2, y1 + 1), ribbon, kd=0)
    c.part(c.P([(x - 1, y1 + 2), (x + 2, y1 + 2), (x + 3, y1 + 4), (x - 2, y1 + 4)]), hp, kd=1)  # tassel


def avatar_girl_1(back=False):
    """Girl, long plait, salwar-kameez with a dupatta, maroon juttis."""
    c = Cell()
    sk = SK['tan']
    kam, salwar, jut = cramp('#e2508e'), cramp('#f6eedc', 0.5), cramp('#a83448')
    dup, gold = cramp('#f8c43a'), cramp('#f4c848')
    legs(c, salwar, jut, top=34)
    m = torso(c, kam, y1=38, flare=2)
    c.put(c.R(14, 37, 33, 38) & m, gold['b'])                     # gold border
    c.put(c.R(14, 38, 33, 38) & m, gold['d'])
    arms(c, kam, sk, sleeve_to=30)
    if back:
        c.part(c.P([(15, 23), (32, 23), (31, 27), (23, 31), (16, 27)]), dup, kd=1)      # dupatta across the back
    head(c, sk, ears=False)
    if back:
        hm = c.E(13, 1, 34, 20) & c.R(13, 0, 34, 18)
        c.part(hm, HAIR_BLK, kd=2, kdd=1)
        c.put(c.R(18, 2, 23, 2), HAIR_BLK['l'])
        c.put(c.L([(23, 2), (23, 15)]) & hm, HAIR_BLK['dd'])
        plait(c, HAIR_BLK, 23, 17, 36, cramp('#e03a3a'))
    else:
        face(c, sk)
        cap = c.E(13, 0, 34, 15) & c.R(13, 0, 34, 7)
        sides = c.P([(13, 5), (17, 5), (16, 12), (15, 19), (13, 18)]) | c.P([(30, 5), (34, 5), (34, 18), (32, 19), (31, 12)])
        hm = cap | sides
        c.part(hm, HAIR_BLK, kd=1)
        c.put(c.R(23, 1, 23, 6), HAIR_BLK['dd'])                  # centre parting
        c.put(c.R(17, 2, 20, 2) | c.R(27, 2, 29, 2), HAIR_BLK['l'])
        plait(c, HAIR_BLK, 16, 18, 32, cramp('#e03a3a'), r=1)    # plait over the left shoulder
        v = c.P([(17, 22), (20, 22), (24, 29), (27, 22), (30, 22), (25, 32), (22, 32)])
        c.part(v, dup, kd=1)                                     # dupatta V
        c.px(23, 22, sk['b'])
    return c.image()


def avatar_girl_2(back=False):
    """Girl, short bob, hoodie over a kurti, leggings, backpack."""
    c = Cell()
    sk = SK['wheat']
    hood, kurti, leg = cramp('#7a5cd2'), cramp('#f28cac'), cramp('#3c3a5c')
    shoes, bag = cramp('#f2f2f6', 0.45), cramp('#f0a030')
    legs(c, leg, shoes)
    m = torso(c, kurti, y1=37, flare=1)
    c.put(c.R(15, 37, 32, 37) & m, kurti['d'])
    if not back:
        c.part(c.E(16, 17, 31, 25) & c.R(16, 17, 31, 23), hood, kd=1)  # hood behind the neck
    torso(c, hood, y1=33)
    c.put(c.R(16, 33, 31, 33), hood['dd'])                        # ribbed hem
    arms(c, hood, sk, sleeve_to=33)
    c.put(c.R(12, 32, 15, 33) | c.R(32, 32, 35, 33), hood['d'])   # cuffs
    head(c, sk, ears=False)
    if back:
        hm = (c.E(12, 0, 35, 21) & c.R(12, 0, 35, 18)) | c.P([(12, 14), (35, 14), (34, 19), (13, 19)])
        c.part(hm, HAIR_BRN, kd=2, kdd=1)
        c.put(c.R(17, 2, 22, 2), HAIR_BRN['l'])
        c.part(c.E(15, 18, 32, 26) & c.R(15, 20, 32, 26), hood, kd=1)  # hood lying on the back
        b = c.P([(17, 22), (30, 22), (31, 24), (31, 35), (16, 35), (16, 24)])
        c.part(b, bag, kd=2, kdd=1)                               # backpack
        c.part(c.R(18, 29, 29, 34), cramp('#e08a20'), kd=1)       # front pocket
        c.put(c.R(18, 29, 29, 29), '#ffffff')                     # zip
        c.part(c.R(21, 20, 26, 21), cramp('#c8781a'), kd=0)      # handle
    else:
        face(c, sk, mood='smile')
        cap = c.E(12, 0, 35, 15) & c.R(12, 0, 35, 8)
        sides = c.R(12, 5, 16, 18) | c.R(31, 5, 35, 18)
        hm = cap | sides
        c.part(hm, HAIR_BRN, kd=1)
        c.put(c.R(16, 2, 21, 2), HAIR_BRN['l'])
        c.put(c.R(14, 8, 33, 8) & hm, HAIR_BRN['d'])              # blunt fringe edge
        c.put(c.R(21, 23, 21, 27) | c.R(26, 23, 26, 27), '#ffffff')  # drawstrings
        c.put(c.R(18, 29, 29, 32) & ~shift(c.R(18, 29, 29, 32), 1, 1), hood['d'])  # pocket
        c.put(c.R(18, 29, 29, 29), hood['dd'])
        for x in (17, 29):                                        # backpack straps
            c.part(c.R(x, 22, x + 1, 30), bag, kd=0)
    return c.image()


def avatar_neutral(back=False):
    """Oversized tee, joggers, college ID lanyard, tousled hair."""
    c = Cell()
    sk = SK['brown']
    tee, jog, shoes = cramp('#f6c43c'), cramp('#7c8090'), cramp('#4a86e0')
    lan = cramp('#2f6fd6')
    legs(c, jog, shoes)
    c.put(c.R(17, 40, 22, 41) | c.R(25, 40, 30, 41), jog['dd'])   # cuffs
    m = torso(c, tee, y1=36, flare=1)
    arms(c, tee, sk, sleeve_to=30)
    head(c, sk)
    if back:
        hm = (c.E(12, 0, 35, 20) & c.R(12, 0, 35, 16)) | c.P([(12, 13), (35, 13), (36, 17), (31, 18), (27, 17), (23, 19), (19, 17), (11, 17)])
        c.part(hm, HAIR_BRN, kd=2, kdd=1)
        c.put(c.R(17, 2, 22, 2), HAIR_BRN['l'])
        c.put(c.R(19, 22, 28, 22), lan['b'])                      # lanyard round the neck
    else:
        face(c, sk, mood='smile')
        cap = c.E(12, 0, 35, 15) & c.R(12, 0, 35, 6)
        swoop = c.P([(12, 5), (35, 5), (34, 8), (29, 7), (24, 9), (19, 8), (16, 10), (13, 11)])   # side-swept fringe
        sides = c.P([(12, 5), (15, 5), (15, 15), (13, 17), (11, 16)]) | c.P([(32, 5), (35, 5), (36, 16), (34, 17), (32, 15)])
        hm = cap | swoop | sides
        c.part(hm, HAIR_BRN, kd=1)
        c.put(c.R(16, 2, 21, 2) | c.R(27, 3, 30, 3), HAIR_BRN['l'])
        c.put(c.L([(20, 3), (24, 8)]) & hm, HAIR_BRN['d'])
        c.put(c.L([(20, 22), (23, 28)]) | c.L([(27, 22), (24, 28)]), lan['b'])
        card = c.R(21, 28, 26, 33)
        c.part(card, pal('#ffffff', '#f4f6fa', '#d4dae6', None, '#4a5068'), kd=1)
        c.put(c.R(21, 28, 26, 29), lan['b'])
        c.put(c.R(22, 30, 23, 32), sk['d'])                       # tiny photo
        c.put(c.R(24, 31, 25, 31), '#9aa2b4')
    return c.image()


# ================================================================== portraits (48x48, waist-up)
# Bigger head than the avatars; shoulders run off the bottom edge (no outline there).

def bust(c, sk, top, neck=True, wide=0):
    c.part(c.P([(10 - wide, 31), (37 + wide, 31), (40 + wide, 36), (41 + wide, 47), (6 - wide, 47), (7 - wide, 36)]),
           top, kd=2, kdd=1)
    if neck:
        c.part(c.R(19, 24, 28, 30), sk, kl=0, kd=1)
        c.put(c.R(19, 29, 28, 30), sk['d'])
    c.part(c.E(9, 12, 14, 20) | c.E(33, 12, 38, 20), sk, kd=1)   # ears
    m = c.E(11, 3, 36, 28)
    c.part(m, sk, kl=1, kd=1)
    c.put(m & ~shift(m, 0, -1) & c.R(15, 24, 32, 28), sk['d'])
    return m


def pface(c, sk, mood='neutral', eyes=True, blush=True):
    if eyes:
        for ex in (17, 29):
            c.put(c.R(ex, 14, ex + 1, 17), EYE)
            c.px(ex + 1, 14, '#ffffff')
            c.px(ex, 17, '#5a3e52')
        c.pxs([(16, 12), (17, 11), (18, 11), (29, 11), (30, 11), (31, 12)], mix(sk['o'], sk['b'], 0.35))
    c.pxs([(23, 18), (23, 19), (24, 19)], sk['d'])                 # nose
    if mood == 'happy':
        c.put(c.R(20, 22, 27, 23) | c.R(21, 24, 26, 24), MOUTH)
        c.put(c.R(21, 22, 26, 22), '#ffffff')
    elif mood == 'grin':
        c.put(c.R(20, 22, 27, 23), MOUTH)
        c.put(c.R(21, 22, 26, 22), '#ffffff')
        c.pxs([(19, 21), (28, 21)], MOUTH)
    elif mood == 'smirk':
        c.pxs([(21, 23), (22, 23), (23, 23), (24, 22), (25, 22), (26, 21)], MOUTH)
    else:
        c.put(c.R(21, 22, 26, 22), MOUTH)
    if blush:
        c.pxs([(14, 19), (15, 19), (32, 19), (33, 19)], BLUSH)


def happy_eyes(c):
    for ex in (16, 28):
        c.pxs([(ex, 16), (ex + 1, 15), (ex + 2, 15), (ex + 3, 16)], EYE)


def glasses(c, frame='#3a2a26'):
    for x0 in (14, 26):
        ring = c.R(x0, 13, x0 + 7, 18) & ~c.R(x0 + 1, 14, x0 + 6, 17)
        c.put(c.R(x0 + 1, 14, x0 + 6, 17) & ~ring, None)
        c.put(ring, frame)
        c.px(x0 + 1, 14, '#ffffff')
    c.put(c.R(22, 15, 25, 15), frame)
    c.put(c.R(12, 15, 13, 15) | c.R(34, 15, 35, 15), frame)


def side_hair(c, hp, grey=None):
    """Bald on top: a crescent of hair hugging the sides of the head above the ears."""
    m = c.E(9, 2, 38, 26) & ~c.E(12, 0, 35, 24) & c.R(0, 8, 47, 18)
    c.part(m, hp, kd=1)
    if grey is not None:
        c.put(m & c.R(0, 13, 47, 18), grey)
    return m


def professor(happy=False):
    """Glasses, grey side-parted hair, moustache, cream kurta under a tweed jacket, pointer."""
    c = Cell()
    sk = SK['wheat']
    kurta, tweed = cramp('#f2e8cc', 0.45), cramp('#8c6a48')
    bust(c, sk, kurta)
    jk = c.P([(10, 31), (19, 31), (22, 47), (6, 47), (7, 36)]) | c.P([(28, 31), (37, 31), (40, 36), (41, 47), (25, 47)])
    c.part(jk, tweed, kd=2, kdd=1)
    c.sc.dith(jk & ~shift(jk, 1, 1), tweed['d'], 0.25)            # tweed fleck
    c.put(c.R(20, 31, 27, 32), kurta['d'])                        # mandarin collar
    c.pxs([(23, 35), (23, 38), (23, 41)], '#c8a060')              # kurta buttons
    c.part(c.R(9, 37, 13, 38), cramp('#3a6cc0'), kd=0)            # pen in the pocket
    pface(c, sk, 'happy' if happy else 'neutral', eyes=not happy)
    if happy:
        happy_eyes(c)
    hm = (c.E(10, 1, 37, 18) & c.R(10, 0, 37, 9)) | c.P([(10, 6), (14, 6), (13, 14), (10, 13)]) \
        | c.P([(33, 6), (37, 6), (37, 13), (34, 14)]) | c.P([(18, 8), (36, 6), (35, 10), (27, 9), (20, 11)])
    c.part(hm, HAIR_GRY, kd=1)
    c.put(c.L([(17, 2), (18, 8)]) & hm, HAIR_GRY['dd'])          # side parting
    c.put(c.R(21, 3, 30, 3), HAIR_GRY['l'])
    c.part(c.P([(19, 20), (28, 20), (29, 21), (25, 21), (22, 21), (18, 21)]), pal(None, '#bcbcc6', '#9a9aa6', None, '#5a5a68'), kd=0)  # moustache
    if not happy:
        glasses(c)
    else:
        glasses(c)
        c.put(c.R(15, 14, 20, 17) | c.R(27, 14, 32, 17), sk['b'])
        happy_eyes(c)
    # hand holding a pointer, raised at the right
    c.part(c.L([(38, 40), (46, 24)], 2), cramp('#a06a3a'), kd=0)
    c.part(c.E(35, 37, 41, 43), sk, kd=1)
    return c.image()


def professor_walk(frame=0):
    """32x32 side view (facing right), two walk frames."""
    c = Cell(32, 32)
    sk = SK['wheat']
    kurta, tweed, shoe = cramp('#f2e8cc', 0.45), cramp('#8c6a48'), cramp('#5a3a24')
    pants = cramp('#5a5e70')
    if frame == 0:
        lg = c.P([(13, 22), (16, 22), (19, 28), (17, 29)]) | c.P([(13, 22), (16, 22), (12, 29), (10, 28)])
        ft = c.R(17, 28, 21, 30) | c.R(8, 28, 12, 30)
    else:
        lg = c.R(13, 22, 16, 29)
        ft = c.R(13, 28, 18, 30)
    c.part(lg, pants, kd=1)
    c.part(ft, shoe, kd=0)
    c.part(c.P([(11, 13), (19, 13), (20, 23), (10, 23)]), kurta, kd=1)
    c.part(c.P([(11, 13), (17, 13), (17, 22), (10, 22)]), tweed, kd=1)
    hx = 17 if frame == 0 else 14
    arm = c.P([(13, 14), (15, 14), (hx + 1, 19), (hx - 1, 19)])
    c.part(arm, tweed, kd=1)
    c.part(c.R(hx - 1, 19, hx + 1, 21), sk, kd=0)
    c.part(c.R(14, 11, 17, 13), sk, kl=0, kd=0)
    hd = c.E(10, 2, 22, 13)
    c.part(hd, sk, kd=1)
    c.part((c.E(9, 1, 21, 9) & c.R(9, 1, 17, 5)) | c.P([(9, 4), (14, 4), (13, 10), (10, 11), (9, 9)])
           | c.P([(14, 2), (19, 2), (18, 4), (14, 5)]), HAIR_GRY, kd=1)
    c.px(14, 8, sk['d'])                                          # ear
    c.put(c.R(17, 6, 21, 8) & ~c.R(18, 7, 20, 7), '#3a2a26')      # glasses
    c.px(19, 7, EYE)
    c.put(c.R(19, 10, 21, 10), HAIR_GRY['d'])                     # moustache
    return c.image()


def npc_shady(wonky=False):
    """Dodgy caller: hood up, sunglasses, smirk, phone at the ear."""
    c = Cell()
    sk = SK['tan']
    hood = cramp('#4c4e66')
    c.part(c.E(6, 0, 41, 34), hood, kd=2, kdd=1)                 # hood behind the head
    bust(c, sk, hood, wide=1)
    pface(c, sk, 'smirk', eyes=False, blush=False)
    c.sc.dith(c.E(14, 21, 33, 28) & ~c.R(19, 21, 28, 24), sk['d'], 0.15)  # stubble
    glass_m = c.R(13, 13, 34, 17) & ~c.R(23, 17, 24, 17)
    c.part(glass_m, pal('#3a3a48', '#16161e', '#0c0c12', None, '#0c0c12'), kd=0)
    c.pxs([(15, 14), (16, 14), (27, 14), (28, 14)], '#e8f0ff')
    rim = c.E(9, 2, 38, 30) & ~c.E(12, 6, 35, 29)                  # front edge of the hood
    c.part(rim & c.R(0, 0, 47, 25), hood, kd=1)
    c.put(c.R(21, 31, 21, 36) | c.R(26, 31, 26, 36), '#d8dae6')  # drawstrings
    c.part(c.R(36, 9, 41, 22), pal('#5a5e70', '#2a2c38', '#1a1c24', None, '#0c0c12'), kd=1)  # phone
    c.put(c.R(37, 11, 40, 19), '#6ac0f0')
    c.part(c.E(34, 17, 40, 25), sk, kd=1)                         # hand
    im = c.image()
    if wonky:                                                    # call-overlay copy: phone bezel + scanlines
        a = np.array(im)
        a[2::3, :, :3] = (a[2::3, :, :3].astype(float) * 0.82).astype(np.uint8)
        sc = Scene(transparent=True)
        sc.a[16:64, 16:64] = a
        frame_m = R(16, 16, 63, 63) & ~R(18, 18, 61, 61)
        sc.put(frame_m, '#22222c')
        sc.put(R(37, 17, 42, 17), '#5a5a68')
        sc.put(R(56, 58, 59, 61), '#e04848')                    # recording dot
        im = Image.fromarray(sc.a[16:64, 16:64].copy(), 'RGBA')
    return im


def npc_uncle():
    """50s uncle: receding hair, grey temples, big moustache, half-sleeve shirt, gold ring."""
    c = Cell()
    sk = SK['brown']
    shirt = cramp('#9cc4e8')
    bust(c, sk, shirt, wide=2)
    sm = c.P([(8, 31), (39, 31), (42, 36), (43, 47), (4, 47), (5, 36)])
    for x in range(8, 42, 4):
        c.put(c.R(x, 31, x, 47) & sm, shirt['d'])                 # stripes
    c.put(c.P([(19, 31), (23, 37), (24, 37), (28, 31)]), shirt['dd'])   # open collar
    c.put(c.P([(20, 31), (23, 35), (24, 35), (27, 31)]), sk['b'])
    c.part(c.R(31, 36, 33, 40), cramp('#2a2a34'), kd=0)            # pen
    pface(c, sk, 'smile' if False else 'neutral')
    c.put(c.R(21, 22, 26, 22), MOUTH)
    hm = (c.E(10, 1, 37, 16) & c.R(10, 1, 37, 7) & ~c.P([(15, 7), (18, 3), (21, 5), (23, 4), (26, 5), (29, 3), (32, 7)])) \
        | c.P([(10, 6), (14, 6), (13, 13), (10, 12)]) | c.P([(33, 6), (37, 6), (37, 12), (34, 13)])
    c.part(hm, HAIR_BLK, kd=1)                                   # receding M hairline
    c.put(hm & c.R(0, 9, 47, 13), HAIR_GRY['d'])                 # grey temples
    c.put(c.R(20, 2, 27, 2) & hm, HAIR_BLK['l'])
    c.put(c.R(20, 7, 27, 7), SK['brown']['l'])                    # shiny forehead
    c.part(c.P([(16, 19), (31, 19), (32, 22), (29, 21), (24, 21), (23, 21), (18, 21), (15, 22)]), HAIR_BLK, kd=0)
    c.part(c.E(5, 40, 13, 47), sk, kd=1)                          # hand on the belly
    c.part(c.R(9, 42, 10, 43), cramp('#f4c848'), kd=0)            # gold ring
    return c.image()


def npc_friend():
    """Teen friend: messy hair, college tee, grin, phone in hand."""
    c = Cell()
    sk = SK['wheat']
    tee = cramp('#c23a52')
    bust(c, sk, tee)
    c.put(c.R(7, 38, 40, 40) & c.P([(10, 31), (37, 31), (40, 36), (41, 47), (6, 47), (7, 36)]), '#ffffff')  # chest stripe
    c.put(c.R(19, 31, 28, 31), tee['dd'])
    pface(c, sk, 'grin')
    hm = (c.E(9, 0, 38, 16) & c.R(9, 0, 38, 8)) \
        | c.P([(9, 6), (38, 6), (37, 11), (34, 9), (31, 12), (27, 8), (23, 11), (19, 8), (15, 12), (12, 9), (10, 12)]) \
        | c.P([(14, 1), (16, -2), (19, 1)]) | c.P([(25, 0), (28, -2), (30, 1)])
    c.part(hm, HAIR_BLK, kd=1)
    c.put(c.R(15, 3, 20, 3) | c.R(27, 3, 30, 3), HAIR_BLK['l'])
    c.part(c.R(31, 33, 37, 45), pal('#5a5e70', '#2a2c38', '#1a1c24', None, '#0c0c12'), kd=1)  # phone
    c.put(c.R(32, 35, 36, 43), '#7ad0a0')
    c.part(c.E(29, 40, 35, 47), sk, kd=1)
    return c.image()


def npc_shop():
    """Kirana uncle behind the counter: half-sleeve check shirt, moustache, pencil at the ear."""
    c = Cell()
    sk = SK['tan']
    shirt = cramp('#5aa86a')
    bust(c, sk, shirt, wide=1)
    sm = c.P([(9, 31), (38, 31), (41, 36), (42, 47), (5, 47), (6, 36)])
    for y in range(33, 47, 4):
        c.put(c.R(0, y, 47, y) & sm, shirt['d'])
    for x in range(10, 40, 4):
        c.put(c.R(x, 31, x, 47) & sm, shirt['d'])
    c.put(c.P([(20, 31), (23, 35), (24, 35), (27, 31)]), '#f4f2ea')   # vest under the shirt
    pface(c, sk, 'smile')
    hm = (c.E(10, 0, 37, 16) & c.R(10, 0, 37, 6)) | c.P([(10, 5), (14, 5), (13, 13), (10, 12)]) \
        | c.P([(33, 5), (37, 5), (37, 12), (34, 13)])
    c.part(hm, HAIR_GRY, kd=1)                                   # grey, combed back
    for x in (16, 21, 26, 31):
        c.put(c.L([(x, 1), (x - 1, 5)]) & hm, HAIR_GRY['d'])
    c.part(c.P([(19, 20), (28, 20), (29, 21), (18, 21)]), HAIR_BLK, kd=0)   # thin moustache
    c.part(c.L([(34, 8), (40, 3)], 2), cramp('#f4c030'), kd=0)     # pencil behind the ear
    counter = c.R(0, 39, 47, 47)
    c.part(counter, WOOD, kd=2, kdd=1, d=(0, 1))
    c.put(c.R(0, 39, 47, 40), WOOD['l'])
    c.part(c.R(3, 30, 9, 38), pal('#eaf6ff', '#c8e4f4', '#9cc4dc', None, '#4a6278'), kd=1)  # sweet jar
    c.part(c.R(4, 28, 8, 29), cramp('#e05048'), kd=0)
    c.sc.dith(c.R(4, 33, 8, 37), '#f4a03a', 0.5)
    return c.image()


AVATARS = ['avatar_boy_1', 'avatar_boy_2', 'avatar_girl_1', 'avatar_girl_2', 'avatar_neutral']
_AV = {'avatar_boy_1': avatar_boy_1, 'avatar_boy_2': avatar_boy_2, 'avatar_girl_1': avatar_girl_1,
       'avatar_girl_2': avatar_girl_2, 'avatar_neutral': avatar_neutral}

SPRITES = []
for _k in AVATARS:
    SPRITES += [(_k, (lambda f: lambda: f())(_AV[_k])), (f'{_k}_back', (lambda f: lambda: f(True))(_AV[_k]))]
SPRITES += [('professor', lambda: professor()),
            ('professor_happy', lambda: professor(True)),
            ('professor_walk_0', lambda: professor_walk(0)),
            ('professor_walk_1', lambda: professor_walk(1)),
            ('npc_shady', lambda: npc_shady()),
            ('caller_wonky', lambda: npc_shady(True)),
            ('npc_uncle', npc_uncle),
            ('npc_friend', npc_friend),
            ('npc_shop', npc_shop)]


# ================================================================== export
def sheet(items, scale=4, cols=6, bg=(232, 240, 216)):
    pad, lab = 6, 12
    cw = max(im.width for _, im in items) * scale
    chh = max(im.height for _, im in items) * scale
    rows = (len(items) + cols - 1) // cols
    out = Image.new('RGB', (cols * (cw + pad) + pad, rows * (chh + lab + pad) + pad), bg)
    d = ImageDraw.Draw(out)
    for i, (key, im) in enumerate(items):
        x, y = pad + (i % cols) * (cw + pad), pad + (i // cols) * (chh + lab + pad)
        d.text((x, y), key, fill=(40, 40, 60))
        big = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
        out.paste(big, (x, y + lab), big)
    return out


def main(only=None):
    os.makedirs(os.path.join(OUT, '1x'), exist_ok=True)
    os.makedirs(os.path.join(OUT, '4x'), exist_ok=True)
    items = []
    for key, fn in SPRITES:
        if only and key not in only:
            continue
        im = fn()
        im.save(os.path.join(OUT, '1x', f'{key}.png'))
        im.resize((im.width * 4, im.height * 4), Image.NEAREST).save(os.path.join(OUT, '4x', f'{key}@4x.png'))
        items.append((key, im))
        print('ok', key, im.size, len(im.getcolors(4096) or []), 'colours')
    sheet(items).save(os.path.join(OUT, 'sprite_sheet.png'))
    if not only:
        battle_preview()


def battle_preview(bg_slug='12_college', player='avatar_boy_1_back', enemy='npc_shady', scale=2):
    """Background + platform overlay + sprites at `scale` (whole-number, nearest), saved at 2x."""
    here = os.path.dirname(os.path.abspath(__file__))
    bg = Image.open(os.path.join(here, '..', '1x', f'{bg_slug}.png')).convert('RGBA')
    pl = Image.open(os.path.join(here, '..', '1x', 'battle_platforms_overlay.png')).convert('RGBA')
    im = Image.alpha_composite(bg, pl)

    def place(key, cx, foot_y, k):
        sp = Image.open(os.path.join(OUT, '1x', f'{key}.png'))
        sp = sp.resize((sp.width * k, sp.height * k), Image.NEAREST)
        im.alpha_composite(sp, (int(cx - sp.width / 2), int(foot_y - sp.height)))

    place(enemy, 354, 200, scale)        # enemy platform centre (scenes.platforms: disc 354,196)
    place(player, 126, 256, scale + 1)   # player platform centre (disc 126,246); nearer = bigger
    im.convert('RGB').resize((im.width * 2, im.height * 2), Image.NEAREST).save(
        os.path.join(OUT, 'battle_preview_sprites.png'))


if __name__ == '__main__':
    import sys
    main(sys.argv[1:] or None)
