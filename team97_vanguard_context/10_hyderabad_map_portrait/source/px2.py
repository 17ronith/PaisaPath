"""px2 - extra helpers for scenes 10-20: a 5x7 pixel font, interior room shell,
small people sprites, and common props (fan, tube light, switchboard, clock...).

Layout contract shared with scenes 01-09 (so battle_platforms_overlay.png fits):
    interiors: wall/floor line at FL = 180
    exteriors: ground starts between y 180 and 190
    enemy platform  ~ x 294-414, y 183-213
    player platform ~ x 24-228,  y 224-270
"""
import math
import random

import numpy as np

from pxlib import *

FL = 180

# ---------------------------------------------------------------- 5x7 font
_F = {
    'A': [" ### ", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
    'B': ["#### ", "#   #", "#   #", "#### ", "#   #", "#   #", "#### "],
    'C': [" ### ", "#   #", "#    ", "#    ", "#    ", "#   #", " ### "],
    'D': ["#### ", "#   #", "#   #", "#   #", "#   #", "#   #", "#### "],
    'E': ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#####"],
    'F': ["#####", "#    ", "#    ", "#### ", "#    ", "#    ", "#    "],
    'G': [" ### ", "#   #", "#    ", "# ###", "#   #", "#   #", " ####"],
    'H': ["#   #", "#   #", "#   #", "#####", "#   #", "#   #", "#   #"],
    'I': [" ### ", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", " ### "],
    'J': ["  ###", "   # ", "   # ", "   # ", "   # ", "#  # ", " ##  "],
    'K': ["#   #", "#  # ", "# #  ", "##   ", "# #  ", "#  # ", "#   #"],
    'L': ["#    ", "#    ", "#    ", "#    ", "#    ", "#    ", "#####"],
    'M': ["#   #", "## ##", "# # #", "# # #", "#   #", "#   #", "#   #"],
    'N': ["#   #", "##  #", "# # #", "#  ##", "#   #", "#   #", "#   #"],
    'O': [" ### ", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
    'P': ["#### ", "#   #", "#   #", "#### ", "#    ", "#    ", "#    "],
    'R': ["#### ", "#   #", "#   #", "#### ", "# #  ", "#  # ", "#   #"],
    'S': [" ####", "#    ", "#    ", " ### ", "    #", "    #", "#### "],
    'T': ["#####", "  #  ", "  #  ", "  #  ", "  #  ", "  #  ", "  #  "],
    'U': ["#   #", "#   #", "#   #", "#   #", "#   #", "#   #", " ### "],
    'V': ["#   #", "#   #", "#   #", "#   #", "#   #", " # # ", "  #  "],
    'W': ["#   #", "#   #", "#   #", "# # #", "# # #", "# # #", " # # "],
    'Y': ["#   #", "#   #", " # # ", "  #  ", "  #  ", "  #  ", "  #  "],
    '0': [" ### ", "#   #", "#  ##", "# # #", "##  #", "#   #", " ### "],
    '1': ["  #  ", " ##  ", "  #  ", "  #  ", "  #  ", "  #  ", " ### "],
    '2': [" ### ", "#   #", "    #", "   # ", "  #  ", " #   ", "#####"],
    '3': ["#####", "   # ", "  #  ", "   # ", "    #", "#   #", " ### "],
    '4': ["   # ", "  ## ", " # # ", "#  # ", "#####", "   # ", "   # "],
    '5': ["#####", "#    ", "#### ", "    #", "    #", "#   #", " ### "],
    '6': ["  ## ", " #   ", "#    ", "#### ", "#   #", "#   #", " ### "],
    '7': ["#####", "    #", "   # ", "  #  ", " #   ", " #   ", " #   "],
    '8': [" ### ", "#   #", "#   #", " ### ", "#   #", "#   #", " ### "],
    '9': [" ### ", "#   #", "#   #", " ####", "    #", "   # ", " ##  "],
    '/': ["    #", "    #", "   # ", "  #  ", " #   ", "#    ", "#    "],
    '.': ["  ", "  ", "  ", "  ", "  ", "##", "##"],
    ' ': ["   "] * 7,
}


def text_w(txt, sc=1, sp=1):
    return sum(len(_F[ch][0]) * sc + sp * sc for ch in txt) - sp * sc


def text_mask(txt, x, y, sc=1, sp=1):
    m = NONE()
    cx = int(x)
    for ch in txt:
        g = _F[ch]
        for r, row in enumerate(g):
            for c, v in enumerate(row):
                if v == '#':
                    x0, y0 = cx + c * sc, int(y) + r * sc
                    if 0 <= x0 < W and 0 <= y0 < H:
                        m[y0:y0 + sc, x0:x0 + sc] = True
        cx += len(g[0]) * sc + sp * sc
    return m


def text(s, txt, x, y, col, sc=1, sp=1, shadow=None, center=False):
    """Draw pixel text. With center=True, x is the centre line."""
    if center:
        x = int(round(x - text_w(txt, sc, sp) / 2))
    m = text_mask(txt, x, y, sc, sp)
    if shadow is not None:
        s.put(shift(m, 1, 1) & ~m, shadow)
    s.put(m, col)
    return m


# ---------------------------------------------------------------- tints
def lighten(s, m, amt, col='#ffffff'):
    c = C(col)[:3].astype(float)
    sub = s.a[m][:, :3].astype(float)
    s.a[m, :3] = np.clip(sub + (c - sub) * amt, 0, 255).astype(np.uint8)


def tint_all(s, f):
    s.a[..., :3] = np.clip(s.a[..., :3].astype(float) * np.array(f), 0, 255).astype(np.uint8)


def blend(s, m, col, a):
    lighten(s, m, a, col)


def glow(s, cx, cy, r, col, lvl=0.35):
    s.dith(O(cx, cy, r) & ~O(cx, cy, r * 0.55), col, lvl * 0.55)
    s.dith(O(cx, cy, r * 0.55), col, lvl)


# ---------------------------------------------------------------- room shell
def room(s, wall, ceil=('#f6f3ec', '#ddd8cc'), floor=('#efe2c8', '#e6d6b8', '#c8b494'), skirt='#b89c78',
         CE=12, su=5.0, sv=900.0, vy_off=70):
    s.put(R(0, 0, W - 1, CE - 1), ceil[0])
    s.put(R(0, CE - 2, W - 1, CE - 1), ceil[1])
    s.put(R(0, CE, W - 1, FL - 1), wall['b'])
    for i, lv in enumerate((0.75, 0.5, 0.3, 0.15)):
        s.dith(R(0, CE + i, W - 1, CE + i), wall['d'], lv)
    persp_tiles(s, FL, H, 240, FL - vy_off, *floor, su=su, sv=sv)
    if skirt:
        s.put(R(0, FL - 5, W - 1, FL - 1), skirt)
        s.put(R(0, FL - 5, W - 1, FL - 5), mix(skirt, '#ffffff', 0.3))
    s.put(R(0, FL, W - 1, FL), mix(floor[2], '#000000', 0.25))
    s.dith(R(0, FL + 1, W - 1, FL + 3), mix(floor[2], '#000000', 0.15), 0.5)


def dado_tiles(s, y0, y1, c, grout, tw=10, th=8):
    s.put(R(0, y0, W - 1, y1), c)
    for y in range(y0, y1 + 1, th):
        s.put(R(0, y, W - 1, y), grout)
    for y in range(y0, y1 + 1, th):
        off = 0
        for x in range(off, W, tw):
            s.put(R(x, y, x, min(y1, y + th)), grout)
    s.put(R(0, y0, W - 1, y0), mix(grout, '#000000', 0.15))


# ---------------------------------------------------------------- props
def ceiling_fan(s, cx, CE=12, col=pal('#ffffff', '#ecebe4', '#c8c6bc', '#a4a298', '#4a4840')):
    s.sh(E(cx - 5, CE - 2, cx + 5, CE + 2) & R(0, CE - 1, W - 1, H - 1), col, kl=1, kd=1, kdd=0)
    s.sh(R(cx - 1, CE + 1, cx + 1, CE + 11), col, kl=0, kd=1, kdd=0, d=(1, 0))
    blades = [P([(cx - 6, CE + 14), (cx - 54, CE + 12), (cx - 58, CE + 15), (cx - 54, CE + 18), (cx - 6, CE + 18)]),
              P([(cx + 5, CE + 16), (cx + 42, CE + 24), (cx + 44, CE + 27), (cx + 38, CE + 28), (cx + 3, CE + 19)]),
              P([(cx + 4, CE + 13), (cx + 40, CE + 8), (cx + 45, CE + 9), (cx + 42, CE + 12), (cx + 6, CE + 16)])]
    for b in blades:
        s.sh(b, col, kl=1, kd=1, kdd=0, d=(0, 1))
    mot = E(cx - 9, CE + 10, cx + 9, CE + 20)
    s.sh(mot, col, kl=1, kd=2, kdd=1)
    s.put(R(cx - 8, CE + 15, cx + 8, CE + 15) & mot, col['d'])


def tube_light(s, x0, x1, y, lit=False):
    s.sh(R(x0, y, x1, y + 3), pal('#ffffff', '#e8e6e0', '#c4c0b6', None, '#5a5850'), kl=1, kd=1, kdd=0, d=(0, 1))
    tube = R(x0 + 3, y + 4, x1 - 3, y + 5)
    if lit:
        s.dith(R(x0 - 10, y - 6, x1 + 10, y + 16) & ~R(x0, y, x1, y + 5), '#fffbe8', 0.3)
        s.dith(R(x0 - 4, y - 2, x1 + 4, y + 9) & ~R(x0, y, x1, y + 5), '#fffbe8', 0.5)
        s.put(tube, '#ffffff')
    else:
        s.put(tube, '#f2f2f6')
        s.put(R(x0 + 3, y + 5, x1 - 3, y + 5), '#d0d4dc')
    s.put(R(x0 + 1, y + 3, x0 + 3, y + 6) | R(x1 - 3, y + 3, x1 - 1, y + 6), '#9a988e')


def switchboard(s, x, y, w=20, h=16, n=4):
    m = R(x, y, x + w, y + h)
    s.sh(m, pal('#ffffff', '#f2f0ea', '#d4d0c4', None, '#6a665c'), kl=1, kd=1, kdd=0)
    sp = (w - 4) // n
    for i in range(n):
        sx = x + 3 + i * sp
        s.put(R(sx, y + 3, sx + 2, y + 6), '#3a3a40' if i % 2 else '#c03030')
        s.px(sx + 1, y + 3, '#ffffff')
    s.put(R(x + 4, y + 10, x + 5, y + 11), '#5a5850')
    s.put(R(x + 9, y + 10, x + 10, y + 11), '#5a5850')
    s.put(R(x + 7, y + 13, x + 7, y + 13), '#5a5850')


def wall_clock(s, cx, cy, r, frame='#7a4a2a', face='#fffdf4', t=(10, 2)):
    s.shadow(O(cx + 1, cy + 2, r))
    s.sh(O(cx, cy, r), pal(mix(frame, '#ffffff', 0.3), frame, mix(frame, '#000000', 0.3), None, '#1e140c'), kl=1, kd=1, kdd=0)
    s.put(O(cx, cy, r - 2), face)
    for a in range(0, 360, 90):
        s.px(cx + (r - 3) * math.cos(math.radians(a)), cy + (r - 3) * math.sin(math.radians(a)), '#5a5a5a')
    hh, mm = t
    ah = math.radians(hh * 30 + mm * 0.5 - 90)
    am = math.radians(mm * 6 - 90)
    s.put(L([(cx, cy), (cx + (r - 5) * math.cos(ah), cy + (r - 5) * math.sin(ah))]), '#2a2a2a')
    s.put(L([(cx, cy), (cx + (r - 3) * math.cos(am), cy + (r - 3) * math.sin(am))]), '#2a2a2a')
    s.px(cx, cy, '#c03030')


def potted_plant(s, x, y, h=24, leaf=LEAF, potc=TERRA, seed=0, kind='round'):
    rng = random.Random(seed)
    s.shadow(E(x - 8, y - 2, x + 12, y + 2))
    pm = P([(x - 7, y - 12), (x + 7, y - 12), (x + 5, y), (x - 5, y)])
    s.sh(pm, potc, kl=1, kd=2, kdd=1)
    s.put(R(x - 7, y - 12, x + 7, y - 11), potc['l'])
    if kind == 'tall':
        leaves = []
        for i in range(7):
            a = rng.uniform(-0.35, 0.35)
            ln = rng.uniform(h * 0.6, h)
            bx = x + rng.randint(-4, 4)
            leaves.append(P([(bx - 2, y - 12), (bx + 2, y - 12), (bx + ln * math.sin(a) + 1, y - 12 - ln),
                             (bx + ln * math.sin(a) - 1, y - 12 - ln + 2)]))
        um = NONE()
        for lm in leaves:
            um |= lm
        s.outline(um, leaf['o'])
        for lm in leaves:
            s.sh(lm, leaf, kl=1, kd=1, kdd=0, d=(1, 0), ol=False)
            s.put(lm & ~shift(lm, 0, -3) & shift(lm, 0, 3), mix(leaf['l'], '#fff0a0', 0.4))
    else:
        cl = [(x + rng.randint(-8, 8), y - 14 - rng.randint(0, h - 10), rng.randint(5, 8)) for _ in range(6)]
        um = NONE()
        for c in cl:
            um |= O(*c)
        s.outline(um, leaf['o'])
        for c in cl:
            s.sh(O(*c), leaf, kl=1, kd=2, kdd=1, ol=False)


def plastic_chair(s, x, y, col='#d83a3a', facing=1):
    """Moulded plastic chair, front-ish view. (x, y) = front-left foot."""
    p = ramp(col)
    s.shadow(E(x - 2, y - 2, x + 22, y + 2))
    back = P([(x + 2, y - 30), (x + 18, y - 30), (x + 19, y - 18), (x + 1, y - 18)])
    seat = P([(x - 1, y - 18), (x + 21, y - 18), (x + 20, y - 14), (x, y - 14)])
    legs = R(x, y - 14, x + 2, y) | R(x + 18, y - 14, x + 20, y) | R(x + 4, y - 14, x + 5, y - 3) | R(x + 15, y - 14, x + 16, y - 3)
    s.sh(back | seat | legs, p, kl=1, kd=2, kdd=1)
    for k in range(3):
        s.put(R(x + 5 + k * 4, y - 27, x + 6 + k * 4, y - 22), p['dd'])


# ---------------------------------------------------------------- people
SKIN = ['#c88a5c', '#b07446', '#d89a6c', '#9a6440']
HAIR = '#1e1618'


def person(s, x, y, shirt, pants, skin=SKIN[0], hair=HAIR, kind='boy', bag=None, cap=None, hold=None, outline='#1a1418'):
    """~26 px tall background NPC; (x, y) = point between the feet."""
    sk = ramp(skin, outline)
    U = NONE()
    parts = []
    head = O(x, y - 22, 4)
    if kind in ('girl', 'nurse'):
        lower = P([(x - 4, y - 9), (x + 4, y - 9), (x + 5, y - 1), (x - 5, y - 1)])
        legs = R(x - 3, y - 1, x - 2, y) | R(x + 2, y - 1, x + 3, y)
    else:
        lower = R(x - 4, y - 9, x - 1, y - 1) | R(x + 1, y - 9, x + 4, y - 1)
        legs = R(x - 4, y - 1, x - 1, y) | R(x + 1, y - 1, x + 4, y)
    body = R(x - 4, y - 17, x + 4, y - 9)
    arms = R(x - 6, y - 16, x - 5, y - 10) | R(x + 5, y - 16, x + 6, y - 10)
    hands = R(x - 6, y - 9, x - 5, y - 9) | R(x + 5, y - 9, x + 6, y - 9)
    neck = R(x - 1, y - 18, x + 1, y - 18)
    if bag:
        bm = R(x - 7, y - 17, x - 5, y - 9) | R(x + 5, y - 17, x + 7, y - 9)
        parts.append((bm, ramp(bag)))
    parts += [(legs, pal(None, '#2a2a30', '#1a1a20')), (lower, ramp(pants)), (body, ramp(shirt)),
              (arms, ramp(shirt)), (hands, sk), (neck, sk), (head, sk)]
    for m, _ in parts:
        U |= m
    hairm = head & R(0, 0, W - 1, y - 23)
    if kind in ('girl', 'nurse'):
        hairm |= head & (R(0, 0, x - 3, H - 1) | R(x + 3, 0, W - 1, H - 1))
        braid = R(x + 4, y - 22, x + 5, y - 13) if kind == 'girl' else O(x, y - 27, 2)
        U |= braid
        parts.append((braid, ramp(hair)))
    U |= hairm
    s.shadow(E(x - 6, y - 1, x + 7, y + 2))
    s.outline(U, outline)
    for m, p in parts:
        s.sh(m, p, kl=1, kd=1, kdd=0, ol=False)
    s.put(hairm, hair)
    s.put(hairm & ~shift(hairm, -1, -1), mix(hair, '#ffffff', 0.25))
    s.px(x - 2, y - 21, '#1a1418')
    s.px(x + 1, y - 21, '#1a1418')
    if kind == 'girl':
        s.put(L([(x - 4, y - 17), (x + 4, y - 10)], 2) & body, mix(pants, '#ffffff', 0.25))
    if kind == 'nurse' or cap:
        cm = R(x - 4, y - 27, x + 4, y - 25)
        s.sh(cm, pal('#ffffff', '#f4f4f8', '#d0d4e0', None, outline), kl=0, kd=1, kdd=0)
    if hold:
        hm = R(x + 4, y - 15, x + 9, y - 9)
        s.sh(hm, ramp(hold, outline), kl=1, kd=1, kdd=0)
        s.put(R(x + 5, y - 13, x + 8, y - 13) | R(x + 5, y - 11, x + 8, y - 11), '#ffffff')
    return U


def bicycle(s, x, y, col='#2a2a30', frame='#c83838'):
    """Side-view bicycle, rear wheel at x, wheels touching y."""
    r = 6
    for wx in (x, x + 17):
        ring = O(wx, y - r, r) & ~O(wx, y - r, r - 1)
        s.put(ring, col)
        s.px(wx, y - r, '#a0a0a8')
    fr = L([(x, y - r), (x + 7, y - r)]) | L([(x + 7, y - r), (x + 13, y - 12)]) | L([(x, y - r), (x + 5, y - 13)]) \
        | L([(x + 5, y - 13), (x + 13, y - 12)]) | L([(x + 5, y - 13), (x + 7, y - r)]) | L([(x + 13, y - 12), (x + 17, y - r)])
    s.put(fr, frame)
    s.put(R(x + 3, y - 15, x + 7, y - 14), '#2a2a30')
    s.put(L([(x + 13, y - 12), (x + 12, y - 16), (x + 15, y - 16)]), '#3a3a40')


def fake_qr(s, x, y, n=17, seed=7):
    """Decorative QR-like pattern (random modules - not a real, scannable code)."""
    rng = random.Random(seed)
    s.put(R(x - 2, y - 2, x + n + 1, y + n + 1), '#ffffff')
    for j in range(n):
        for i in range(n):
            if rng.random() < 0.48:
                s.px(x + i, y + j, '#1a1a22')
    for fx, fy in ((0, 0), (n - 5, 0), (0, n - 5)):
        s.put(R(x + fx, y + fy, x + fx + 4, y + fy + 4), '#1a1a22')
        s.put(R(x + fx + 1, y + fy + 1, x + fx + 3, y + fy + 3), '#ffffff')
        s.put(R(x + fx + 2, y + fy + 2, x + fx + 2, y + fy + 2), '#1a1a22')
        s.put(R(x + fx - 1, y + fy + 5, x + fx + 5, y + fy + 5) | R(x + fx + 5, y + fy - 1, x + fx + 5, y + fy + 5), '#ffffff')


def glass(s, m, tint='#cfe8f6', a=0.25, streaks=True):
    lighten(s, m, a, tint)
    if streaks:
        ys, xs = np.nonzero(m)
        if len(xs):
            x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
            for k in range(x0 - (y1 - y0), x1, 26):
                st = P([(k, y1), (k + 6, y1), (k + 6 + (y1 - y0), y0), (k + (y1 - y0), y0)]) & m
                lighten(s, st, 0.35)


def steel_glass(s, x, y, h=6):
    m = P([(x - 2, y - h), (x + 2, y - h), (x + 1, y), (x - 1, y)])
    s.sh(m, pal('#ffffff', '#c8ccd6', '#9aa0ae', None, '#3a3e48'), kl=1, kd=1, kdd=0, d=(1, 0))
    s.px(x - 1, y - h + 1, '#ffffff')
