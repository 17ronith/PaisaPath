"""Money-flow set - sprites for the explainer "coins" animation (wallet, savings jar, outside).

Original pixel art, same pxlib shading rules as market.py (1-px dark outlines, light from the
top-left, 2-3 tones per material). No lettering; the only glyph is a pixel "%" on the lender's sack.

    python money.py        -> out/1x/money/*.png, out/4x/money/*.png, out/money_contact_sheet.png

Strips are horizontal, frames left to right:
    ex_wallet      40x32 x4   closed thin, closed fat (notes peeking), ajar, open
    ex_jar         32x40 x6   savings jar, coin level 0..5
    ex_out_salary  40x32 x2   pay envelope sealed / open with notes
    ex_out_lender  40x32 x2   lender's sack with % / % turns red
    ex_out_scam    40x32 x2   phone with a hooded caller / red flash and grin
    ex_out_shop    40x32 x2   kirana stall / lit with a coin on the counter
    ex_coin        12x12 x4   spinning coin
    ex_poof        16x16 x4   landing sparkle
    ex_moth        10x8  x2   moth (empty wallet gag)
"""
import os

import numpy as np
from PIL import Image

from pxlib import mix, shift, dilate
from market import Cv, OUT, coin, strip, save_gif, _scale

LEATHER = '#9a5a34'
LEATHER_L = mix(LEATHER, '#ffffff', 0.28)
LEATHER_D = mix(LEATHER, '#1a1020', 0.28)
LEATHER_DD = mix(LEATHER, '#1a1020', 0.5)
TAN = '#d8a870'
TAN_D = '#b88450'
STITCH = '#eac48e'
GOLD = '#f4c848'
GOLD_D = '#a87420'
GOLD_L = '#fff0a0'
NOTE_G = '#86c87a'
NOTE_G_D = '#4e9a50'
NOTE_P = '#e8a0b8'
NOTE_P_D = '#b86a88'


def shade(s, m, base, light, dark, o=OUT, kd=2):
    """Flat base, dark bottom band, light top-left rim, outline."""
    s.put(m, base)
    s.put(m & ~shift(m, 0, -kd), dark)
    s.put(m & ~shift(m, 0, 1), light)
    s.put(m & ~shift(m, 1, 0), light)
    if o:
        s.outline(m, o)


def note(s, pts, c, cd):
    m = s.P(pts)
    s.put(m, c)
    s.put(m & ~shift(m, 0, -1), cd)
    s.outline(m, OUT)
    return m


# ------------------------------------------------------------------ wallet
def wallet(kind):
    s = Cv(40, 32)
    fat = kind == 'fat'
    if kind == 'fat':
        note(s, [(22, 3), (31, 0), (33, 9), (24, 11)], NOTE_G, NOTE_G_D)
        note(s, [(7, 3), (15, 1), (17, 9), (8, 11)], NOTE_P, NOTE_P_D)
    if kind == 'ajar':
        note(s, [(20, 2), (30, 1), (31, 8), (21, 9)], NOTE_G, NOTE_G_D)
        note(s, [(9, 2), (18, 3), (18, 9), (9, 9)], NOTE_P, NOTE_P_D)
    if kind == 'open':
        # flap folded up behind: inner lining
        flap = s.P([(4, 12), (35, 12), (35, 5), (22, 1), (17, 1), (4, 5)])
        s.put(flap, TAN)
        s.put(flap & ~shift(flap, 0, 1), mix(TAN, '#ffffff', 0.3))
        s.put(s.L([(6, 6), (17, 3), (22, 3), (33, 6)]), TAN_D)
        s.outline(flap, OUT)
        note(s, [(9, 6), (19, 6), (19, 13), (9, 13)], NOTE_G, NOTE_G_D)
        note(s, [(18, 5), (29, 7), (28, 13), (17, 13)], NOTE_P, NOTE_P_D)
    body = s.RR(3, 8, 36, 29, 5) if fat else s.RR(4, 11, 35, 28, 3)
    shade(s, body, LEATHER, LEATHER_L, LEATHER_D)
    top = 8 if fat else 11
    bot = 29 if fat else 28
    for x in range(7, 33, 2):                                   # bottom stitching
        s.px(x, bot - 3, STITCH, body)
    if kind in ('thin', 'fat'):
        flap = s.P([(3, top), (36, top), (36, top + 6), (22, top + 10), (17, top + 10), (3, top + 6)]) & body
        s.put(flap, LEATHER_L)
        s.put(flap & ~shift(flap, 0, 1), mix(LEATHER_L, '#ffffff', 0.25))
        s.put(dilate(flap) & ~flap & body, LEATHER_DD)
        for x in range(7, 33, 2):
            s.px(x, top + 2, STITCH, flap)
        snap = s.O(19.5, top + 8, 1.6)
        s.put(snap, GOLD)
        s.outline(snap, GOLD_D)
        s.px(19, top + 7, GOLD_L)
    elif kind == 'ajar':
        lip = s.P([(4, 11), (35, 11), (33, 6), (6, 6)])
        s.put(lip, TAN)
        s.put(lip & ~shift(lip, 0, -1), TAN_D)
        s.outline(lip, OUT)
        s.put(s.R(6, 11, 33, 12), '#3a2018')
    else:                                                       # open: pocket mouth
        s.put(s.R(6, 11, 33, 12), '#3a2018')
        s.put(s.R(6, 13, 33, 13), LEATHER_L)
        snap = s.O(19.5, 17, 1.6)
        s.put(snap, GOLD)
        s.outline(snap, GOLD_D)
    return s.image()


# ------------------------------------------------------------------ savings jar
def jar(level):
    s = Cv(32, 40)
    body = s.RR(4, 10, 27, 38, 6)
    inner = body & ~dilate(~body)
    # glass: faint tint, partly transparent
    s.a[body] = [196, 232, 255, 70]
    # coins inside, stacked from the bottom
    for L in range(level):
        y = 34 - L * 5
        for j, x in enumerate((8, 13, 18, 23)):
            cx = x + (2 if L % 2 else 0) - (1 if j == 3 and L % 2 else 0)
            m = s.E(cx - 3, y - 2, cx + 3, y + 2) & inner
            s.put(m, GOLD)
            s.put(m & ~shift(m, 0, -1), GOLD_D)
            s.put(m & ~shift(m, 0, 1), GOLD_L)
    # glass rim + outline
    s.put(body & ~inner, '#e8f6ff')
    s.outline(body, OUT)
    # highlights
    s.put(s.R(7, 14, 7, 32) & inner, '#ffffff')
    s.put(s.R(8, 13, 8, 15) & inner, '#ffffff')
    s.put(s.R(24, 30, 24, 34) & inner, '#d8f0ff')
    # neck + lid (banyan green) + a sprouting leaf
    neck = s.R(9, 8, 22, 10)
    s.a[neck] = [196, 232, 255, 110]
    s.outline(neck, OUT)
    lid = s.RR(7, 3, 24, 8, 1)
    shade(s, lid, '#4c9e46', '#7ccc6a', '#357e3c')
    for x in range(9, 23, 3):
        s.px(x, 6, '#2c6a30', lid)
    s.put(s.R(15, 0, 15, 2), '#357e3c')
    for pts in ([(15, 1), (11, 0), (13, 2)], [(16, 1), (20, 0), (18, 2)]):
        s.put(s.P(pts), '#7ccc6a')
    return s.image()


# ------------------------------------------------------------------ outside
def out_salary(i):
    s = Cv(40, 32)
    env = s.R(6, 11, 33, 28)
    if i == 1:
        flap = s.P([(6, 11), (33, 11), (19.5, 0)])
        s.put(flap, '#f0dcb0')
        s.put(flap & ~shift(flap, 0, -1), '#d8c090')
        s.outline(flap, OUT)
        note(s, [(11, 7), (24, 4), (26, 12), (12, 13)], NOTE_G, NOTE_G_D)
        note(s, [(16, 6), (29, 8), (28, 13), (15, 13)], NOTE_G, NOTE_G_D)
    shade(s, env, '#fff3d6', '#ffffff', '#e0caa0')
    s.put(s.L([(6, 27), (17, 19)]), '#d8c090')
    s.put(s.L([(33, 27), (22, 19)]), '#d8c090')
    if i == 0:
        s.put(s.L([(6, 11), (19.5, 21), (33, 11)]), '#c8ae80')
        seal = s.O(19.5, 20, 2.6)
        s.put(seal, '#d04848')
        s.outline(seal, '#7a2020')
        s.px(19, 19, '#f08080')
    return s.image()


def out_lender(i):
    s = Cv(40, 32)
    sack = s.E(7, 10, 32, 31)
    shade(s, sack, '#c8a070', '#e0c090', '#9a7448')
    for y in range(14, 30, 3):                                  # burlap weave
        for x in range(9 + (y % 2), 31, 4):
            s.px(x, y, '#b08858', sack)
    tuft = s.P([(13, 2), (26, 2), (23, 7), (16, 7)])
    shade(s, tuft, '#c8a070', '#e0c090', '#9a7448')
    rope = s.R(14, 7, 25, 9)
    s.put(rope, '#6a4226')
    s.px(16, 8, '#8a5a32')
    s.px(20, 8, '#8a5a32')
    pc = '#e04848' if i else '#5a3620'
    for cx, cy in ((15, 17), (24, 25)):
        o = s.O(cx, cy, 2)
        s.put(o & ~s.O(cx, cy, 0.6), pc)
    s.put(s.L([(25, 15), (14, 27)], 2), pc)
    return s.image()


def out_scam(i):
    s = Cv(40, 32)
    ph = s.RR(12, 1, 27, 31, 2)
    shade(s, ph, '#3a3a48', '#5a5a6a', '#24242e')
    scr = s.R(14, 4, 25, 26)
    s.put(scr, '#a02838' if i else '#30406a')
    hood = s.P([(15, 26), (15, 15), (17, 10), (19.5, 8), (22, 10), (24, 15), (24, 26)])
    s.put(hood, '#141420')
    face = s.E(17, 12, 22, 19)
    s.put(face, '#0a0a10')
    s.px(18, 15, '#ffffff')
    s.px(21, 15, '#ffffff')
    if i:
        s.put(s.L([(18, 17), (19, 18), (20, 18), (21, 17)]), '#ffffff')
    s.put(s.R(18, 28, 21, 28), '#5a5a6a')
    badge = s.O(27, 4, 3)
    s.put(badge, '#e04848')
    s.outline(badge, OUT)
    s.put(s.R(27, 2, 27, 4), '#ffffff')
    s.px(27, 6, '#ffffff')
    return s.image()


def out_shop(i):
    s = Cv(40, 32)
    for x in (5, 33):
        post = s.R(x, 9, x + 1, 29)
        s.put(post, '#8a5a32')
        s.outline(post, OUT)
    if i:
        glow = s.O(19.5, 16, 7)
        s.a[glow & (s.a[..., 3] == 0)] = [255, 236, 160, 90]
    for k, c in enumerate(('#e8c048', '#86c87a', '#e8a0b8', '#80b8e8')):
        jx = 9 + k * 6
        jm = s.RR(jx, 14, jx + 4, 20, 1)
        s.put(jm, c)
        s.put(jm & ~shift(jm, 0, -1), mix(c, '#1a1020', 0.3))
        s.outline(jm, OUT)
    awn = s.R(2, 3, 37, 9)
    for x in range(2, 38):
        for y in range(3, 12):
            band = ((x - 2) // 4) % 2
            inside = y <= 9 or (y <= 11 and ((x - 2) % 4) in (1, 2))
            if inside:
                s.px(x, y, '#e04848' if band == 0 else '#fff3d6')
    s.outline(awn | s.R(2, 10, 37, 11), OUT)
    counter = s.R(2, 21, 37, 29)
    shade(s, counter, '#b07c48', '#d8a068', '#8a5a32')
    for x in range(6, 36, 6):
        s.put(s.R(x, 23, x, 28), '#8a5a32')
    if i:
        coin(s, 30, 18, 0)
    return s.image()


# ------------------------------------------------------------------ small fx
def coin_spin(i):
    s = Cv(12, 12)
    coin(s, 6, 6, i)
    return s.image()


def poof(i):
    s = Cv(16, 16)
    r = (2, 4, 6, 7)[i]
    c = ('#ffffff', GOLD_L, GOLD, GOLD_D)[i]
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        for k in range(max(1, r - 2), r + 1):
            s.px(7.5 + dx * k, 7.5 + dy * k, c)
    for dx, dy in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
        k = max(1, r * 0.7)
        s.px(7.5 + dx * k, 7.5 + dy * k, GOLD_L if i < 3 else GOLD_D)
    if i < 2:
        s.put(s.O(7.5, 7.5, 1.2), '#ffffff')
    return s.image()


def moth(i):
    s = Cv(10, 8)
    wing = s.P([(1, 1), (4, 4), (1, 6)] if i == 0 else [(0, 4), (4, 4), (2, 7)]) | \
        s.P([(8, 1), (5, 4), (8, 6)] if i == 0 else [(9, 4), (5, 4), (7, 7)])
    s.put(wing, '#c8c0b0')
    s.outline(wing, '#5a5048')
    body = s.R(4, 2, 5, 6)
    s.put(body, '#8a7a68')
    s.px(3, 1, '#5a5048')
    s.px(6, 1, '#5a5048')
    return s.image()


STRIPS = {
    'ex_wallet': ([wallet(k) for k in ('thin', 'fat', 'ajar', 'open')], 120),
    'ex_jar': ([jar(L) for L in range(6)], 120),
    'ex_out_salary': ([out_salary(i) for i in range(2)], 400),
    'ex_out_lender': ([out_lender(i) for i in range(2)], 400),
    'ex_out_scam': ([out_scam(i) for i in range(2)], 300),
    'ex_out_shop': ([out_shop(i) for i in range(2)], 400),
    'ex_coin': ([coin_spin(i) for i in range(4)], 90),
    'ex_poof': ([poof(i) for i in range(4)], 70),
    'ex_moth': ([moth(i) for i in range(2)], 120),
}


def build(out='out'):
    for sc, k in (('1x', 1), ('4x', 4)):
        d = f'{out}/{sc}/money'
        os.makedirs(d, exist_ok=True)
        for name, (frames, ms) in STRIPS.items():
            _scale(strip(frames), k).save(f'{d}/{name}.png')
            if len(frames) > 1 and name in ('ex_coin', 'ex_poof', 'ex_moth', 'ex_out_scam'):
                save_gif([_scale(f, k) for f in frames], f'{d}/{name}.gif', ms)
    # contact sheet at 4x on the explainer background colour
    rows = list(STRIPS.items())
    sw = max(strip(f).width for f, _ in STRIPS.values()) * 4 + 24
    sh = sum(f[0].height * 4 + 16 for f, _ in STRIPS.values()) + 16
    sheet = Image.new('RGBA', (sw, sh), (27, 27, 47, 255))
    y = 12
    for name, (frames, _) in rows:
        im = _scale(strip(frames), 4)
        sheet.alpha_composite(im, (12, y))
        y += im.height + 16
    sheet.save(f'{out}/money_contact_sheet.png')
    print('money ok:', len(STRIPS), 'strips')


if __name__ == '__main__':
    build()
