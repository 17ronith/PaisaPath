"""Hyderabad side-quest backgrounds - DS-era pixel art at 480x270 (x4 = 1920x1080).

Run:  python scenes.py          -> writes everything into ./out
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from pxlib import *

# ------------------------------------------------------------------ shared props
HOUSES = [pal('#ffdce4', '#f8bccb', '#de94ab', '#bc7390', '#5a2c40'),
          pal('#fff2bc', '#f8dc88', '#d9b45f', '#b08c40', '#5a4420'),
          pal('#d4f6ea', '#a8e4d0', '#80c4b0', '#5f9f8e', '#2c5048'),
          pal('#ffe2cc', '#f8c8a0', '#d9a077', '#b07850', '#583820'),
          pal('#e2e9ff', '#c2cdf8', '#9aa9e0', '#7888c0', '#343c68')]
AWN = [('#f05454', '#fff4e8'), ('#34b06a', '#fff2b4'), ('#f8b830', '#e84848'), ('#4a88e8', '#ffffff')]
BANGLE = ['#f04870', '#f8c030', '#40c0f0', '#a060e0', '#40d080', '#ff8040', '#ff60c0']
FLOWER = ['#ff5a7a', '#ffd23c', '#ff8a3c', '#ffffff', '#c070f0']
MARIGOLD = ['#ff9a1e', '#ffc81e', '#ff7a1e']
MARBLE = pal('#ffffff', '#f1f3f9', '#d0d8e6', '#aab4ca', '#4a4e6c')
FT = pal('#d6e6f4', '#bed4ea', '#a8c2de')


def old_house(s, x0, x1, top, G, pc, floors):
    m = R(x0, top, x1, G)
    for bx in range(x0 + 2, x1 - 2, 6):
        m |= R(bx, top - 3, bx + 2, top)
    s.sh(m, pc, kl=1, kd=2, kdd=1)
    s.put(R(x0, top + 2, x1, top + 2), pc['d'])
    fh = ((G - 36) - (top + 5)) / floors
    for f in range(floors):
        wy = int(top + 5 + f * fh)
        for wx in range(x0 + 5, x1 - 8, 11):
            win = P(arch_pts(wx, wx + 6, wy + 4, wy + 11, 4))
            s.put(win, '#3e4e74')
            s.put(win & ~shift(win, 1, 1), '#2a3454')
            s.px(wx + 4, wy + 7, '#7c96c8')
            s.outline(win, pc['dd'])
            s.put(R(wx - 1, wy + 12, wx + 7, wy + 12), pc['l'])


def stall(s, x0, x1, G, ai, seed=0):
    rng = random.Random(seed)
    top = G - 34
    s.put(R(x0 + 2, top + 4, x1 - 2, G - 11), '#4e3236')
    for hx in range(x0 + 5, x1 - 4, 4):
        c = rng.choice(BANGLE)
        s.px(hx, top + 8, '#d8c0a0')
        for hy in range(top + 9, G - 14, 2):
            s.px(hx, hy, c)
    for px_ in (x0, x1 - 1):
        s.sh(R(px_, top, px_ + 1, G), WOOD, kl=0, kd=1, kdd=0, d=(1, 0))
    s.sh(R(x0 + 1, G - 11, x1 - 1, G), WOOD, kl=1, kd=2, kdd=1)
    s.put(R(x0 + 3, G - 6, x1 - 3, G - 6), WOOD['d'])
    for gx in range(x0 + 3, x1 - 3, 3):
        c = rng.choice(BANGLE)
        for dx, dy in ((0, -13), (1, -13), (0, -12)):
            s.px(gx + dx, G + dy, c)
        s.px(gx + 1, G - 12, mix(c, '#000000', 0.3))
    a0, a1 = AWN[ai]
    am = P([(x0 - 1, top - 4), (x1 + 1, top - 4), (x1 + 4, top + 5), (x0 - 4, top + 5)])
    for sx in range(x0 - 4, x1 + 4, 4):
        am |= O(sx + 2, top + 5, 2)
    s.put(am, a0)
    for sx in range(x0 - 6, x1 + 6, 6):
        s.put(am & R(sx, 0, sx + 2, H - 1), a1)
    s.shadow(am & ~shift(am, 0, -2), f=(0.78, 0.78, 0.84))
    s.outline(am, '#3a2428')


def pigeon(s, x, y, flip=False):
    d = -1 if flip else 1
    s.px(x + d, y + 1, '#c8a890')
    for dx, dy, c in ((0, 0, '#8e90a8'), (d, 0, '#8e90a8'), (2 * d, 0, '#8e90a8'), (d, -1, '#c4c6d6'),
                      (2 * d, -1, '#8e90a8'), (3 * d, -2, '#5c5e78'), (3 * d, -1, '#6c6e88'), (-d, 0, '#5c5e78'),
                      (4 * d, -1, '#e8a060')):
        s.px(x + dx, y + dy, c)


# ================================================================== 1. CHARMINAR
def charminar():
    s = Scene(1)
    G = 188
    s.sky(SKY_DAY, 0, G)
    for x, y, w, sd in [(14, 58, 78, 1), (338, 44, 96, 2), (414, 98, 50, 3), (116, 106, 44, 4)]:
        cloud(s, x, y, w, seed=sd)
    rng = random.Random(7)
    x = -6
    while x < W:
        bw, bh = rng.randint(14, 30), rng.randint(22, 50)
        m = R(x, G - bh, x + bw, G)
        if rng.random() < 0.3:
            m |= O(x + bw / 2, G - bh, bw * 0.28)
        s.sh(m, FAR, kl=0, kd=2, kdd=0, d=(1, 0), ol=False)
        x += bw - 2
    mq = (R(54, G - 66, 92, G) | O(73, G - 66, 15) | R(46, G - 98, 50, G) | R(96, G - 98, 100, G)
          | O(48, G - 99, 3) | O(98, G - 99, 3))
    s.sh(mq, FAR, kl=0, kd=2, kdd=0, d=(1, 0), ol=False)
    persp_tiles(s, G, H, 240, G - 60, '#f0dcb8', '#e7cfa6', '#cfb38c')

    for x0, x1, top, ci, fl in [(-2, 40, G - 80, 0, 3), (40, 86, G - 66, 1, 2), (86, 134, G - 88, 2, 3),
                                (134, 178, G - 64, 3, 2), (302, 350, G - 72, 4, 2), (350, 398, G - 90, 0, 3),
                                (398, 442, G - 66, 2, 2), (442, 482, G - 82, 1, 3)]:
        old_house(s, x0, x1, top, G, HOUSES[ci], fl)
    for i, (x0, x1) in enumerate([(4, 44), (48, 92), (96, 138), (142, 174),
                                  (306, 340), (344, 390), (394, 436), (440, 478)]):
        stall(s, x0, x1, G, i % 4, seed=i)

    # ---- the monument
    cx = 240
    CM = pal('#fff3d8', '#f4d8aa', '#d9b07c', '#b4885a', '#5a3a24')
    IN1, IN2 = '#8c6040', '#5e3c26'
    s.shadow(P([(cx - 60, G + 1), (cx + 66, G + 1), (cx + 108, G + 20), (cx - 20, G + 20)]))
    U = [NONE()]

    def part(m, **kw):
        U[0] |= m
        kw.setdefault('ol', False)
        s.sh(m, CM, **kw)

    lx0, lx1, rx0, rx1 = cx - 60, cx - 47, cx + 47, cx + 60
    bx0, bx1 = cx - 47, cx + 47
    part(R(cx - 65, G - 5, cx + 65, G), kl=1, kd=2, kdd=1, d=(0, 1))
    part(R(bx0, G - 100, bx1, G - 6), kl=0, kd=0, kdd=0)
    pn = R(cx - 26, G - 63, cx + 26, G - 6)
    s.put(pn & ~shift(pn, 0, 2), CM['d'])
    s.put(pn & ~shift(pn, 2, 0), CM['d'])
    s.put(pn & ~shift(pn, -1, 0), CM['l'])
    ga = P(arch_pts(cx - 21, cx + 21, G - 41, G - 6, 20))
    s.put(ga, IN1)
    s.put(ga & R(0, 0, W - 1, G - 33), IN2)
    see = P(arch_pts(cx - 11, cx + 11, G - 24, G - 6, 11))
    s.put(see, '#bfe2fb')
    s.put(see & R(0, G - 13, W - 1, H - 1), '#e7cfa6')
    s.put(see & R(0, G - 13, W - 1, G - 13), '#cfb38c')
    s.outline(see, IN2)
    s.outline(ga, CM['dd'])
    for rx_ in (cx - 19, cx + 19):
        s.sh(O(rx_, G - 56, 3), CM, kl=1, kd=1, kdd=0, ol=False)
        s.px(rx_, G - 56, CM['dd'])
    for nx in (cx - 43, cx + 32):
        ni = P(arch_pts(nx, nx + 11, G - 38, G - 14, 9))
        s.put(ni, CM['d'])
        s.put(ni & ~shift(ni, 1, 1), CM['dd'])
        s.put(R(nx - 1, G - 13, nx + 12, G - 13), CM['l'])

    def ledge(y):
        part(R(bx0 - 2, y, bx1 + 2, y + 2), kl=1, kd=1, kdd=0, d=(0, 1))
        s.put(R(bx0, y + 3, bx1, y + 3), CM['d'])

    ledge(G - 66)
    for i in range(7):
        ax = bx0 + 5 + i * 12.5
        a = P(arch_pts(ax, ax + 7, G - 74, G - 69, 5))
        s.put(a, IN1)
        s.put(a & ~shift(a, 0, 2), IN2)
    s.put(R(bx0, G - 69, bx1, G - 69), CM['l'])
    ledge(G - 84)
    for i in range(9):
        ax = bx0 + 4 + i * 10
        a = P(arch_pts(ax, ax + 5, G - 91, G - 87, 3))
        s.put(a, IN1)
        s.put(a & ~shift(a, 0, 2), IN2)
    ledge(G - 100)
    for ox in range(bx0 + 3, bx1 - 1, 6):
        part(P([(ox - 2, G - 100), (ox, G - 106), (ox + 2, G - 100)]), kl=0, kd=1, kdd=0, d=(1, 0))

    for m0, m1 in ((lx0, lx1), (rx0, rx1)):
        mc = (m0 + m1) // 2
        part(R(m0, G - 102, m1, G - 5), kl=2, kd=4, kdd=1, d=(1, 0))
        for fx in (m0 + 5, m0 + 9):
            s.put(R(fx, G - 100, fx, G - 8), CM['d'])
        for yy in (G - 67, G - 85, G - 102):
            part(R(m0 - 1, yy, m1 + 1, yy + 3), kl=1, kd=1, kdd=0, d=(0, 1))
        part(R(m0 + 1, G - 134, m1 - 1, G - 102), kl=2, kd=3, kdd=1, d=(1, 0))
        part(R(m0 + 2, G - 152, m1 - 2, G - 134), kl=1, kd=3, kdd=1, d=(1, 0))
        for by in (G - 108, G - 136):
            part(P([(m0 - 2, by + 2), (m1 + 2, by + 2), (m1, by + 7), (m0, by + 7)]), kl=0, kd=2, kdd=1, d=(0, 1))
            part(R(m0 - 3, by - 2, m1 + 3, by + 2), kl=1, kd=1, kdd=0, d=(0, 1))
            for hx in range(m0 - 2, m1 + 3, 2):
                s.px(hx, by, CM['dd'])
        part(P(onion_pts(mc, G - 177, G - 154, 8, pinch=0.82, p=1.3)), kl=2, kd=3, kdd=1)
        pr = R(m0, G - 154, m1, G - 151)
        for ppx in range(m0, m1 + 1, 3):
            pr |= P([(ppx - 1, G - 153), (ppx + 1, G - 158), (ppx + 3, G - 153)])
        part(pr, kl=0, kd=2, kdd=0, d=(1, 0))
        fin = R(mc, G - 184, mc, G - 177)
        U[0] |= fin
        s.put(fin, CM['dd'])
        g = O(mc, G - 181, 1)
        U[0] |= g
        s.put(g, '#f0c048')
    s.outline(U[0], CM['o'])

    for px_, py_, f in [(150, 212, 0), (160, 218, 1), (304, 232, 0), (320, 226, 1), (334, 240, 0),
                        (118, 248, 1), (382, 214, 0), (96, 226, 0)]:
        pigeon(s, px_, py_, f)
    for bx_, by_ in [(150, 34), (160, 26), (318, 30), (332, 40), (300, 20)]:
        bird(s, bx_, by_, '#5a6078')
    return s


# ================================================================== 2. DURGAM CHERUVU
def durgam():
    s = Scene(2)
    HZ, DY, WB = 138, 150, 224
    s.sky(SKY_DAY, 0, HZ)
    for x, y, w, sd in [(150, 40, 80, 5), (300, 66, 60, 6), (190, 92, 40, 7)]:
        cloud(s, x, y, w, seed=sd)
    for x, w, h in [(112, 14, 30), (126, 18, 50), (146, 12, 38), (160, 22, 62), (184, 14, 44), (200, 18, 76),
                    (220, 12, 56), (234, 24, 40), (260, 16, 68), (278, 12, 46), (292, 20, 58), (314, 14, 36),
                    (330, 18, 48), (350, 14, 30)]:
        m = R(x, HZ - h, x + w, HZ)
        s.sh(m, FT, kl=1, kd=2, kdd=0, d=(1, 0), ol=False)
        for yy in range(HZ - h + 3, HZ, 3):
            s.put(R(x + 2, yy, x + w - 3, yy) & m, '#cfe0f0')
    # granite hills (Hyderabad's famous boulders)
    s.sh(P([(-2, HZ), (-2, 64), (24, 52), (60, 66), (100, 92), (132, 118), (146, HZ)]), LEAF_DK, kl=1, kd=0, kdd=0)
    s.sh(P([(482, HZ), (482, 70), (450, 64), (420, 84), (390, 110), (372, HZ)]), LEAF_DK, kl=1, kd=0, kdd=0)
    rocks = [(26, 62, 16, 12), (54, 76, 14, 11), (10, 88, 22, 16), (44, 98, 22, 15), (84, 104, 16, 12),
             (20, 118, 28, 18), (66, 122, 24, 15), (104, 126, 16, 11), (128, 132, 12, 7), (6, 134, 16, 10),
             (446, 74, 16, 12), (466, 92, 20, 15), (424, 96, 14, 11), (448, 112, 24, 16), (402, 118, 16, 11),
             (474, 126, 18, 14), (424, 130, 20, 10), (384, 133, 12, 6)]
    for i, (bx, by, rx, ry) in enumerate(rocks):
        boulder(s, bx, by, rx, ry, seed=i)
    for bx, by, w in [(38, 84, 12), (92, 114, 10), (120, 122, 8), (454, 100, 12), (406, 124, 10), (66, 108, 9)]:
        bush(s, bx, by, w, p=LEAF_DK)
    # lake
    wm = R(0, HZ, W - 1, WB)
    s.put(wm, WATER['b'])
    s.reflect(HZ, WB, WATER['b'], alpha=0.48, m=wm)
    water_streaks(s, wm, seed=3)
    # cable-stayed bridge
    CON = pal('#ffffff', '#e8ecf4', '#c2c9da', '#9aa3b9', '#3e4660')
    for pxn in (168, 312):
        for i in range(7):
            ay = 54 + i * 5
            reach = 70 - i * 8
            for sg in (-1, 1):
                s.put(L([(pxn + sg * 2, ay), (pxn + sg * reach, DY - 2)]), '#f6faff')
    s.put(R(0, DY - 3, W - 1, DY - 3), CON['d'])
    for rx_ in range(0, W, 4):
        s.put(R(rx_, DY - 2, rx_, DY - 1), CON['d'])
    s.sh(R(0, DY, W - 1, DY + 4), CON, kl=1, kd=2, kdd=1, d=(0, 1), ol=False)
    s.put(R(0, DY + 5, W - 1, DY + 5), CON['o'])
    for pxn in range(36, W, 72):
        if min(abs(pxn - 168), abs(pxn - 312)) < 20:
            continue
        s.sh(R(pxn - 2, DY + 6, pxn + 2, DY + 12), CON, kl=1, kd=2, kdd=0, d=(1, 0))
        s.put(R(pxn - 4, DY + 13, pxn + 4, DY + 13), '#d8eeff')
    for pxn in (168, 312):
        pm = P([(pxn - 4, DY + 13), (pxn + 4, DY + 13), (pxn + 2, 50), (pxn - 2, 50)]) | R(pxn - 3, 46, pxn + 3, 50)
        s.sh(pm, CON, kl=1, kd=2, kdd=1, d=(1, 0))
        s.put(R(pxn - 6, DY + 14, pxn + 6, DY + 14), '#d8eeff')
        for yy in range(DY + 16, DY + 66, 2):
            j = int(round(math.sin(yy * 0.8) * 1.5))
            s.put(R(pxn - 2 + j, yy, pxn + 2 + j, yy), mix(WATER['b'], '#ffffff', 0.32))
    # near bank
    s.sh(R(0, WB, W - 1, WB + 5), STONE, kl=1, kd=1, kdd=0, d=(0, 1), ol=False)
    s.put(R(0, WB - 1, W - 1, WB - 1), STONE['o'])
    for ex in range(6, W, 16):
        s.put(R(ex, WB + 1, ex, WB + 4), STONE['dd'])
    grass_tex(s, R(0, WB + 6, W - 1, H - 1), seed=4)
    palm(s, 444, 238, 96, lean=-0.14)
    for i, (bx, by, rx, ry) in enumerate([(18, 252, 26, 17), (52, 262, 14, 9), (462, 248, 26, 19), (430, 263, 14, 8)]):
        boulder(s, bx, by, rx, ry, seed=20 + i)
    flowers(s, 96, 250, 7, FLOWER, seed=1)
    flowers(s, 380, 258, 7, FLOWER, seed=2)
    for bx_, by_ in [(250, 28), (262, 22), (276, 30)]:
        bird(s, bx_, by_)
    return s


# ================================================================== 3. TANK BUND / BUDDHA
def streak(s, x, y, w, c=('#ffd2b4', '#f8a4a4', '#d8789a')):
    m = E(x, y - 3, x + w, y + 3) | E(x + w * 0.2, y - 6, x + w * 0.62, y + 1)
    s.put(m, c[1])
    s.put(m & ~shift(m, 0, 1), c[0])
    s.put(m & ~shift(m, 0, -2), c[2])


def tankbund():
    s = Scene(3)
    HZ, WB = 142, 222
    s.sky(['#34388a', '#563f98', '#8c4896', '#c8548a', '#ec6c78', '#f69062', '#fab25c', '#fcd06c'], 0, HZ, sharp=3.5)
    sky0 = s.a.copy()
    sx, sy, sr = 330, 124, 20
    s.dith(O(sx, sy, sr + 10) & ~O(sx, sy, sr), '#ffd890', 0.25)
    s.dith(O(sx, sy, sr + 4) & ~O(sx, sy, sr), '#ffe0a0', 0.6)
    sun = O(sx, sy, sr)
    s.put(sun, '#fff3b4')
    s.put(sun & ~shift(sun, 0, -6), '#ffe08a')
    for i, yy in enumerate((sy + 6, sy + 11, sy + 15)):
        st = sun & R(0, yy, W - 1, yy + i // 2)
        s.a[st] = sky0[st]
    for x, y, w in [(30, 62, 96), (160, 38, 64), (372, 76, 100), (250, 98, 64), (12, 106, 64), (410, 30, 54)]:
        streak(s, x, y, w)
    for bx_, by_ in [(270, 84), (282, 78), (294, 88), (120, 70)]:
        bird(s, bx_, by_, '#3a2a5a')
    rng = random.Random(9)
    SK = pal(None, '#5c4280', '#4e3672')
    x = -4
    while x < W:
        bw, bh = rng.randint(10, 26), rng.randint(6, 30)
        if rng.random() < 0.18:
            bh += 18
        m = R(x, HZ - bh, x + bw, HZ)
        s.sh(m, SK, kl=0, kd=2, kdd=0, d=(1, 0), ol=False)
        for _ in range(bw * bh // 40):
            s.px(rng.randint(x + 1, x + bw - 2), rng.randint(HZ - bh + 2, HZ - 2),
                 rng.choice(['#f8d070', '#ffe6a0', '#e8a860']))
        x += bw - 1
    wm = R(0, HZ, W - 1, WB)
    s.reflect(HZ, WB, '#6a4c9c', alpha=0.38, m=wm)
    rng = random.Random(4)
    for y in range(HZ + 1, WB, 2):
        hw = 6 + (y - HZ) * 0.35
        for _ in range(3):
            xx = sx + rng.uniform(-hw, hw)
            ln = rng.randint(2, 6)
            s.put(R(xx, y, xx + ln, y), rng.choice(['#fff2b0', '#ffd080', '#ffe6a0']))
    water_streaks(s, wm, seed=6, dens=0.02, cols=['#d898c0', '#e8a8c0', '#b080b8'])

    # Buddha on Gibraltar Rock
    bx = 206
    ST = pal('#fff6ea', '#f0dcca', '#cfa9a4', '#a37c8e', '#3c2440')
    GS = pal('#f6dcc8', '#d8b4a4', '#ae8890', '#82647c', '#3a2440')
    WL = 180
    subs = [E(bx - 44, 158, bx + 4, 186), E(bx - 8, 150, bx + 32, 186), E(bx + 16, 160, bx + 60, 188),
            E(bx - 60, 168, bx - 26, 190), E(bx + 44, 168, bx + 72, 190)]
    rock = NONE()
    for m_ in subs:
        rock |= m_
    rock &= R(0, 0, W - 1, WL)
    s.sh(rock, GS, kl=2, kd=4, kdd=1)
    for m_ in subs:
        s.put(dilate(m_) & ~m_ & rock, GS['d'])
        s.put(m_ & rock & ~shift(m_, 0, 1) & shift(rock, 0, 1), GS['l'])
    s.put(R(bx - 62, WL + 1, bx + 74, WL + 1), '#f0b8d0')
    for k in range(bx - 60, bx + 72, 9):
        s.put(R(k, WL + 3, k + 4, WL + 3), '#e0a0c8')
    U = NONE()
    plinth = R(bx - 20, 140, bx + 20, 156)
    s.sh(plinth, ST, kl=1, kd=3, kdd=1, ol=False)
    s.put(R(bx - 20, 144, bx + 20, 144), ST['d'])
    U |= plinth
    lotus = P([(bx - 18, 132), (bx + 18, 132), (bx + 15, 140), (bx - 15, 140)])
    for k in range(-16, 17, 5):
        lotus |= P([(bx + k - 3, 132), (bx + k, 127), (bx + k + 3, 132)])
    s.sh(lotus, ST, kl=1, kd=2, kdd=1, ol=False)
    for k in range(-16, 17, 5):
        s.put(L([(bx + k + 2, 131), (bx + k + 2, 138)]) & lotus, ST['d'])
    U |= lotus
    parts = {
        'robe': P([(bx - 12, 70), (bx - 9, 66), (bx - 3, 64), (bx + 3, 64), (bx + 9, 66), (bx + 12, 70),
                   (bx + 13, 100), (bx + 15, 129), (bx + 8, 131), (bx, 130), (bx - 8, 131), (bx - 15, 129), (bx - 13, 100)]),
        'larm': P([(bx + 11, 67), (bx + 16, 72), (bx + 18, 101), (bx + 14, 103), (bx + 12, 80)]),
        'drape': P([(bx + 13, 101), (bx + 19, 101), (bx + 20, 127), (bx + 18, 125), (bx + 16, 128), (bx + 14, 125)]),
        'rarm': P([(bx - 11, 67), (bx - 16, 73), (bx - 18, 93), (bx - 13, 93), (bx - 12, 80)]),
        'neck': R(bx - 3, 60, bx + 3, 65),
        'ears': R(bx - 7, 51, bx - 6, 60) | R(bx + 6, 51, bx + 7, 60),
        'head': E(bx - 6, 46, bx + 6, 61),
        'ush': E(bx - 3, 42, bx + 3, 49),
        'fore': R(bx - 19, 77, bx - 15, 92),
        'palm': R(bx - 20, 68, bx - 14, 77) & ~R(bx - 19, 68, bx - 19, 68) & ~R(bx - 17, 68, bx - 17, 68) & ~R(bx - 15, 68, bx - 15, 68),
    }
    for k, m in parts.items():
        U |= m
        s.sh(m, ST, kl=1, kd=2 if k in ('robe', 'head') else 1, kdd=1, ol=False)
        if k in ('fore', 'palm', 'larm'):
            s.put(dilate(m) & ~m & U, ST['dd'])
    for k, yy in enumerate(range(78, 126, 9)):
        hw = 8 + k * 0.7
        s.put(L(curve((bx - hw, yy - 5), (bx + hw * 0.8, yy - 1), 5)) & parts['robe'], ST['d'])
    s.put(L([(bx + 4, 70), (bx + 6, 128)]) & parts['robe'], ST['d'])
    s.put(R(bx - 14, 126, bx + 14, 127) & parts['robe'], ST['d'])
    hair = (parts['head'] | parts['ush']) & R(0, 0, W - 1, 51)
    s.dith(hair, ST['d'], 0.5)
    s.put(R(bx - 4, 54, bx - 2, 54), ST['dd'])
    s.put(R(bx + 2, 54, bx + 4, 54), ST['dd'])
    s.px(bx, 56, ST['d'])
    s.put(R(bx - 1, 58, bx + 1, 58), ST['d'])
    s.outline(U, ST['o'])
    # reflection of rock + statue in the lake
    full = rock | dilate(U)
    refl = NONE()
    for y in range(WL + 2, 198):
        sy = 2 * WL + 3 - y
        if sy >= 0:
            refl[y] = full[sy]
    s.reflect(WL + 2, 198, '#6a4c9c', alpha=0.55, m=refl)
    water_streaks(s, refl, seed=12, dens=0.08, cols=['#d898c0', '#b080b8'])
    # sailboat
    s.sh(P([(388, 186), (420, 186), (415, 191), (393, 191)]), pal('#f8b880', '#c8705a', '#9a4c4a', '#6a3440', '#2a1428'), d=(0, 1))
    s.put(R(403, 156, 403, 186), '#4a2a40')
    sail = P([(405, 158), (405, 184), (420, 184)]) | P([(401, 163), (401, 184), (390, 184)])
    s.sh(sail, pal('#fff6e6', '#ffe4cc', '#e8b8a8', '#c89098', '#3a2440'))
    s.put(R(386, 193, 422, 193), '#e8a0c0')
    # promenade balustrade
    BAL = pal('#f8d8b8', '#e6b494', '#ba8682', '#8e6274', '#3a2238')
    for x in range(3, W, 7):
        s.sh(R(x + 1, 204, x + 2, 222) | E(x, 207, x + 3, 214) | R(x, 219, x + 3, 222), BAL, kl=1, kd=1, kdd=0, d=(1, 0))
    s.sh(R(0, 198, W - 1, 203), BAL, kl=1, kd=2, kdd=1, d=(0, 1))
    s.sh(R(0, 223, W - 1, 228), BAL, kl=1, kd=2, kdd=1, d=(0, 1))
    for x in range(30, W, 84):
        s.sh(R(x - 4, 194, x + 4, 226) | R(x - 6, 191, x + 6, 194), BAL, kl=1, kd=2, kdd=1)
    persp_tiles(s, 229, H, 240, 160, '#8e6c90', '#80628a', '#5e4670', su=4, sv=1400)
    lamp(s, 72, 236, 106, glow='#ffd890')
    lamp(s, 408, 236, 106, glow='#ffd890')
    return s


# ================================================================== 4. FILM CITY
def ramoji():
    s = Scene(4)
    G = 180
    s.sky(SKY_DAY, 0, G)
    for x, y, w, sd in [(60, 42, 80, 11), (366, 30, 90, 12), (226, 18, 50, 13)]:
        cloud(s, x, y, w, seed=sd)
    HANG = pal('#f2f4fa', '#d8dde9', '#b6bed0', '#99a2b9', '#4a5068')
    for x0, x1, top in [(2, 136, 102), (330, 478, 110)]:
        roof = E(x0, top, x1, top + 36) & R(x0, top, x1, top + 18)
        m = roof | R(x0, top + 18, x1, G)
        s.sh(m, HANG, kl=1, kd=3, kdd=1)
        for rx_ in range(x0 + 10, x1 - 4, 12):
            s.put(R(rx_, top, rx_, top + 18) & roof, HANG['d'])
        s.put(R(x0, top + 18, x1, top + 19), HANG['dd'])
        dx0 = x1 - 56 if x0 > 200 else x0 + 14
        door = R(dx0, top + 30, dx0 + 38, G)
        s.sh(door, pal('#f8c868', '#f0a838', '#c88020', '#a06018'), kl=1, kd=2, kdd=0, ol=False)
        for yy in range(top + 34, G, 5):
            s.put(R(dx0 + 1, yy, dx0 + 37, yy), '#c88020')
    # wooden struts behind the palace facade (it's a film set!)
    for p0, p1 in [((316, 90), (346, G)), ((316, 128), (336, G)), ((316, 150), (342, 150))]:
        s.put(L([p0, p1], 2), WOOD['b'])
        s.put(L([(p0[0] + 1, p0[1] + 1), (p1[0] + 1, p1[1] + 1)]), WOOD['dd'])
    # palace set
    PALC = pal('#ffe0e8', '#f8b8c8', '#e090a8', '#c07090', '#5a2840')
    WHITE = pal('#ffffff', '#f4f0f8', '#d0cce0', '#b0aac8', '#4a4660')
    cx = 240
    for tx in (176, 304):
        s.sh(R(tx - 13, 86, tx + 13, G), PALC, kl=1, kd=3, kdd=1)
        s.sh(P(onion_pts(tx, 58, 88, 14, pinch=0.8, p=1.2)), WHITE, kl=2, kd=4, kdd=1)
        s.put(R(tx, 50, tx, 58), GOLD['d'])
        s.put(O(tx, 52, 1), GOLD['b'])
        for wy in (100, 128):
            w_ = P(arch_pts(tx - 5, tx + 5, wy + 6, wy + 16, 6))
            s.put(w_, '#58c0d0')
            s.put(w_ & ~shift(w_, 1, 1), '#3a90b0')
            s.outline(w_, PALC['dd'])
    s.sh(R(cx - 50, 104, cx + 50, G), PALC, kl=1, kd=3, kdd=1)
    for mx in range(cx - 48, cx + 49, 8):
        s.sh(R(mx, 98, mx + 4, 104), PALC, kl=1, kd=1, kdd=0)
    s.sh(R(cx - 26, 92, cx + 26, 104), WHITE, kl=1, kd=2, kdd=1, d=(1, 0))
    s.sh(P(onion_pts(cx, 34, 96, 34, pinch=0.8, p=1.15)), GOLD, kl=2, kd=6, kdd=2)
    s.put(R(cx, 22, cx, 34), GOLD['dd'])
    s.sh(O(cx, 26, 2), GOLD, kl=1, kd=1, kdd=0)
    door = P(arch_pts(cx - 16, cx + 16, 142, G, 18))
    s.put(door, '#5a2848')
    s.put(door & ~shift(door, 0, 4), '#3c1830')
    s.outline(door, GOLD['b'])
    for wx in (cx - 40, cx - 26, cx + 16, cx + 30):
        w_ = P(arch_pts(wx, wx + 10, 122, 140, 7))
        s.put(w_, '#58c0d0')
        s.put(w_ & ~shift(w_, 1, 1), '#3a90b0')
        s.outline(w_, PALC['dd'])
    s.put(R(cx - 50, 112, cx + 50, 113), PALC['l'])
    # street-set facades
    FAC = [pal('#a8d4ff', '#68aef0', '#4888d0', '#3468b0', '#1c3460'),
           pal('#ffc8a0', '#f09460', '#c86c40', '#a05030', '#4a2410'),
           pal('#c8f4c0', '#88d880', '#60b060', '#469048', '#1e4a24')]
    for x0, x1, top, pc, kind in [(8, 52, 124, FAC[0], 0), (52, 98, 112, FAC[1], 1), (98, 146, 128, FAC[2], 2)]:
        m = R(x0, top, x1, G)
        if kind == 0:
            m |= R(x0 + 8, top - 8, x1 - 8, top)
        if kind == 1:
            m |= E(x0 + 6, top - 12, x1 - 6, top + 10)
        s.sh(m, pc, kl=1, kd=2, kdd=1)
        s.sh(R(x0 + 6, top + 3, x1 - 6, top + 9), pal('#fff8c8', '#f8e070', '#d8b840', None, '#4a3a10'), kl=1, kd=1, kdd=0)
        mid = (x0 + x1) // 2
        s.put(R(mid - 5, G - 22, mid + 5, G), '#3a2a40')
        s.outline(R(mid - 5, G - 22, mid + 5, G), pc['dd'])
        for wx in (x0 + 5, x1 - 13):
            s.put(R(wx, top + 16, wx + 8, top + 26), '#bfe6fb')
            s.put(R(wx, top + 16, wx + 8, top + 17), '#ffffff')
            s.outline(R(wx, top + 16, wx + 8, top + 26), pc['dd'])
        if kind == 2:
            aw = P([(x0 + 2, G - 30), (x1 - 2, G - 30), (x1 + 1, G - 24), (x0 - 1, G - 24)])
            s.put(aw, '#ffffff')
            for sx in range(x0 - 1, x1 + 2, 6):
                s.put(aw & R(sx, 0, sx + 2, H - 1), '#f05454')
            s.outline(aw, '#3a1a1a')
    # plaza
    persp_tiles(s, G, H, 240, G - 70, '#f8e6c4', '#f0b48c', '#d89c78')
    for fx in range(4, W, 14):
        flowers(s, fx, G + 3, 1, FLOWER, seed=fx, spread=(2, 1))
    palm(s, 154, G + 4, 84, lean=0.1)
    palm(s, 462, G + 6, 76, lean=-0.18)
    # fountain
    fx, fy = 240, 206
    s.shadow(E(fx - 44, fy - 4, fx + 54, fy + 16))
    s.sh(E(fx - 46, fy - 10, fx + 46, fy + 12), STONE, kl=1, kd=2, kdd=1)
    inner = E(fx - 40, fy - 7, fx + 40, fy + 6)
    s.put(inner, WATER['b'])
    s.put(inner & ~shift(inner, 0, 2), WATER['dd'])
    water_streaks(s, inner, seed=8, dens=0.3)
    s.sh(R(fx - 3, fy - 24, fx + 3, fy), STONE, kl=1, kd=2, kdd=0, d=(1, 0))
    s.sh(E(fx - 14, fy - 30, fx + 14, fy - 22), STONE, kl=1, kd=2, kdd=1)
    s.put(R(fx - 1, fy - 46, fx + 1, fy - 30), '#e8f8ff')
    for sg in (-1, 1):
        s.put(L(curve((fx, fy - 44), (fx + sg * 16, fy - 26), -6)), '#d8f0ff')
        s.put(L(curve((fx, fy - 40), (fx + sg * 30, fy - 4), -8)), '#c0e4ff')
    for dx, dy in ((-22, -10), (18, -14), (-8, -48), (8, -50), (30, -6), (-30, -4)):
        s.px(fx + dx, fy + dy, '#ffffff')
    # spotlight + beam (left)
    beam = P([(62, 202), (196, 150), (214, 196), (64, 214)])
    sub = s.a[beam][:, :3].astype(float)
    s.a[beam, :3] = (sub + (255 - sub) * 0.22).astype(np.uint8)
    for p1 in ((34, 250), (60, 250), (48, 254)):
        s.put(L([(48, 222), p1], 2), IRON['b'])
    head = P([(34, 204), (54, 196), (60, 212), (40, 220)])
    s.sh(head, IRON, kl=1, kd=2, kdd=1)
    s.put(P([(54, 197), (59, 211), (62, 210), (57, 196)]), '#fff6b0')
    # camera on tripod (right)
    for p1 in ((414, 254), (446, 254), (432, 258)):
        s.put(L([(430, 226), p1], 2), IRON['b'])
    cam = R(412, 206, 446, 224) | O(420, 198, 8) | O(438, 196, 9) | R(398, 209, 412, 221) | R(394, 207, 398, 223)
    s.sh(cam, IRON, kl=1, kd=2, kdd=1)
    for c_ in ((420, 198), (438, 196)):
        s.put(O(c_[0], c_[1], 3), IRON['l'])
        s.px(c_[0], c_[1], IRON['dd'])
    s.put(R(395, 211, 396, 219), '#88c8f8')
    s.px(444, 209, '#ff3a3a')
    # director's chair
    RED = pal('#ff9a8a', '#e84a4a', '#b83232', '#902424', '#3a1010')
    s.shadow(E(338, 254, 388, 262))
    for p0, p1 in (((344, 242), (372, 262)), ((372, 242), (344, 262))):
        s.put(L([p0, p1], 2), WOOD['b'])
    s.sh(R(344, 228, 372, 235), RED, kl=1, kd=1, kdd=0)
    s.sh(R(342, 242, 374, 246), RED, kl=1, kd=1, kdd=0)
    s.put(R(342, 236, 343, 242) | R(373, 236, 374, 242), WOOD['b'])
    # clapperboard
    s.shadow(E(124, 262, 166, 268))
    s.sh(R(128, 250, 158, 266), pal('#4a4a58', '#2a2a34', '#1a1a22', None, '#0a0a10'), kl=1, kd=1, kdd=0)
    for yy in (255, 259, 263):
        s.put(R(131, yy, 155, yy), '#e8e8f0')
    clap = P([(126, 245), (158, 239), (159, 244), (127, 250)])
    s.put(clap, '#2a2a34')
    for k in range(0, 34, 6):
        s.put(clap & P([(126 + k, 252), (130 + k, 252), (134 + k, 238), (130 + k, 238)]), '#f4f4fa')
    s.outline(clap, '#0a0a10')
    return s


# ================================================================== 5. SHILPARAMAM
MUD = pal('#fad69a', '#eab468', '#c88c48', '#a06c34', '#4e3016')
STRAW = pal('#fae49a', '#e2bc62', '#ba9242', '#926e2e', '#4a3410')
BRICK = pal('#f49878', '#d6684c', '#ac4a36', '#883628', '#3e1810')
CREAM = pal('#fffaf0', '#f6ead6', '#dcc8a8', '#bca684', '#3e2a18')
LIME = '#fffaf0'


def hut(s, x0, x1, wall_top, G, peak):
    s.shadow(E(x0, G - 3, x1 + 26, G + 6))
    s.sh(R(x0, wall_top, x1, G), MUD, kl=1, kd=3, kdd=1)
    zy = wall_top + 9
    for x in range(x0 + 2, x1 - 1):
        s.px(x, zy + abs((x % 6) - 3) - 1, LIME)
    for x in range(x0 + 4, x1 - 2, 6):
        s.px(x, zy + 6, LIME)
        s.px(x + 3, zy + 9, LIME)
    dc = (x0 + x1) // 2
    door = P(arch_pts(dc - 7, dc + 7, G - 16, G, 7))
    s.put(door, '#4a2e1e')
    s.put(door & ~shift(door, 0, 3), '#2e1c12')
    s.outline(door, LIME)
    cx = (x0 + x1) / 2
    rm = P([(x0 - 12, wall_top + 6), (cx, peak), (x1 + 12, wall_top + 6)])
    for fx in range(int(x0 - 12), int(x1 + 12), 3):
        rm |= R(fx, wall_top + 4, fx + 1, wall_top + 8 + (fx % 2))
    s.sh(rm, STRAW, kl=1, kd=3, kdd=1)
    span = x1 - x0 + 24
    for k in range(-6, 7):
        ex = cx + k * span / 13
        s.put(L([(cx + (ex - cx) * 0.15, peak + 4), (ex, wall_top + 4)]) & rm & ~shift(rm, -1, -1), STRAW['d'])


def bunting(s, p0, p1, sag, cols, step=7):
    pts = curve(p0, p1, sag)
    s.put(L(pts), '#5a4030')
    for k, i in enumerate(range(3, len(pts) - 3, step)):
        x, y = pts[i]
        c = cols[k % len(cols)]
        s.sh(P([(x - 3, y + 1), (x + 3, y + 1), (x, y + 7)]), pal(mix(c, '#ffffff', 0.35), c, mix(c, '#000000', 0.25)),
             kl=1, kd=1, kdd=0, ol=False)


def shilparamam():
    s = Scene(5)
    G = 184
    s.sky(SKY_DAY, 0, G)
    for x, y, w, sd in [(30, 40, 70, 21), (330, 30, 90, 22), (200, 60, 44, 23)]:
        cloud(s, x, y, w, seed=sd)
    for i, x in enumerate(range(-10, W + 20, 26)):
        r = 22 + (i * 7) % 10
        tree(s, x, G - 6 - (i % 3) * 3, r, p=LEAF_DK, th=int(r * 0.3), shadow=False)
    grass_tex(s, R(0, G, W - 1, H - 1), seed=5)
    EARTH = pal('#f0b48a', '#dc9466', '#bc7450', '#9a5a3c', '#5a3020')
    path = P([(206, G), (274, G), (340, H), (140, H)])
    s.put(path, EARTH['b'])
    s.put(path & ~shift(path, 2, 0), EARTH['d'])
    s.put(path & ~shift(path, -2, 0), EARTH['d'])
    rng = random.Random(3)
    for _ in range(160):
        xx, yy = rng.randint(140, 340), rng.randint(G, H - 1)
        if path[yy, xx]:
            s.px(xx, yy, rng.choice([EARTH['l'], EARTH['d'], EARTH['l']]))
    # huts
    hut(s, 26, 112, 140, G, 96)
    hut(s, 404, 466, 150, G, 116)
    # craft stall
    BAMBOO = pal('#f8e8a8', '#e0c070', '#b89448', None, '#4a3410')
    for pxn in (318, 388):
        s.sh(R(pxn, 116, pxn + 2, G), BAMBOO, kl=1, kd=1, kdd=0, d=(1, 0))
    for i, c in enumerate(['#ff4a8a', '#ffc828', '#2ec8b4', '#9a5ae8', '#ff7a2a', '#3a8cf0']):
        x = 322 + i * 11
        fm = R(x, 124, x + 8, 154)
        for zx in range(x, x + 9, 3):
            fm |= R(zx, 155, zx + 1, 157)
        s.sh(fm, ramp(c), kl=1, kd=2, kdd=0, d=(1, 0))
        for yy in range(127, 154, 4):
            s.px(x + 2 + (yy // 4) % 2 * 3, yy, mix(c, '#ffffff', 0.6))
    s.sh(P([(310, 112), (396, 112), (402, 123), (304, 123)]), STRAW, kl=1, kd=2, kdd=1, d=(0, 1))
    s.sh(R(314, 160, 392, 168), WOOD, kl=1, kd=2, kdd=1)
    for px_, r in ((326, 4), (340, 5), (356, 4), (372, 5)):
        pot(s, px_, 159, r)
    # gate
    gate = R(180, 78, 300, G) & ~P(arch_pts(206, 274, 120, G + 4, 24))
    s.shadow(P([(180, G), (306, G), (322, G + 10), (196, G + 10)]) & ~path)
    s.sh(gate, BRICK, kl=1, kd=3, kdd=1)
    op = P(arch_pts(206, 274, 120, G + 4, 24))
    s.put(dilate(op) & gate, LIME)
    for x0 in (184, 278):
        for y in range(104, G - 4):
            s.px(x0 + 9 + abs((y % 8) - 4) - 2, y, LIME)
        for y in range(108, G - 6, 10):
            s.px(x0 + 3, y, LIME)
            s.px(x0 + 15, y, LIME)
    for x in range(184, 298, 8):
        s.put(P([(x, 92), (x + 4, 84), (x + 8, 92)]) & ~P([(x + 2, 91), (x + 4, 87), (x + 6, 91)]), LIME)
    for yy in (96, 82):
        s.put(R(182, yy, 298, yy), LIME)
    s.sh(R(176, 72, 304, 77), CREAM, kl=1, kd=2, kdd=1, d=(0, 1))
    for x0 in (176, 270):
        s.sh(R(x0, 98, x0 + 34, 101), CREAM, kl=1, kd=1, kdd=0, d=(0, 1))
    for tx in (186, 294):
        s.sh(P(onion_pts(tx, 56, 72, 7, pinch=0.7, p=1.0)), CREAM, kl=1, kd=2, kdd=1)
        s.put(R(tx, 51, tx, 56), GOLD['d'])
    # chhatri
    s.sh(R(218, 66, 262, 71), CREAM, kl=1, kd=1, kdd=0, d=(0, 1))
    for px_ in (222, 233, 246, 257):
        s.sh(R(px_, 52, px_ + 2, 66), CREAM, kl=1, kd=1, kdd=0, d=(1, 0))
    s.put(R(224, 54, 256, 64), '#7a4a3a')
    s.sh(R(214, 48, 266, 52), CREAM, kl=1, kd=1, kdd=0, d=(0, 1))
    s.sh(P(onion_pts(240, 22, 50, 19, pinch=0.56, p=0.75)), CREAM, kl=2, kd=4, kdd=1)
    s.put(R(240, 10, 240, 22), GOLD['dd'])
    s.sh(O(240, 16, 2), GOLD, kl=1, kd=1, kdd=0, ol=False)
    s.sh(P([(241, 4), (252, 7), (241, 10)]), ramp('#ff7a1e'), kl=1, kd=1, kdd=0, d=(0, 1))
    s.put(R(240, 3, 240, 10), '#5a3a20')
    # bunting
    cols = ['#ff4a5a', '#ffc828', '#3ac86a', '#3a8cf0', '#ff7ab8']
    bunting(s, (-2, 96), (186, 80), 16, cols)
    bunting(s, (294, 80), (482, 100), 16, cols[::-1])
    bunting(s, (112, 104), (180, 98), 6, cols[1:])
    # foreground
    for px_, r in ((132, 190), (148, 196)):
        pot(s, px_, r, 6)
    pot(s, 118, 200, 5)
    for fx in range(10, 140, 22):
        flowers(s, fx, 214 + (fx % 3) * 10, 4, MARIGOLD, seed=fx)
    for fx in range(350, 476, 22):
        flowers(s, fx, 220 + (fx % 3) * 10, 4, MARIGOLD, seed=fx)
    return s


# ================================================================== 6. BIRLA MANDIR
def shikhara(s, cx, ybase, ytop, hw0, p, ribs=2, kalash=True):
    n = 30
    hws = []
    right, left = [], []
    for i in range(n + 1):
        t = i / n
        y = ybase - (ybase - ytop) * t
        hw = hw0 * (1 + 0.1 * math.sin(math.pi * t)) * (1 - 0.58 * t ** 1.7)
        hws.append((y, hw))
        right.append((cx + hw, y))
        left.append((cx - hw, y))
    m = P(right + left[::-1])
    s.sh(m, p, kl=2, kd=max(3, int(hw0 * 0.35)), kdd=1, d=(1, 0), ld=(1, 1))
    for k in range(-ribs, ribs + 1):
        if k == 0:
            continue
        s.put(L([(cx + k / (ribs + 1) * hw, y) for y, hw in hws]) & m, p['d'] if k < 0 else p['dd'])
    for yy in range(int(ybase) - 5, int(ytop) + 2, -5):
        s.dith(R(0, yy, W - 1, yy) & m, p['d'], 0.5)
    top_hw = hws[-1][1]
    am = E(cx - top_hw * 1.35, ytop - 7, cx + top_hw * 1.35, ytop + 1)
    s.sh(am, p, kl=1, kd=2, kdd=1)
    for ax in range(int(cx - top_hw * 1.3), int(cx + top_hw * 1.3) + 1, 2):
        s.put(R(ax, ytop - 6, ax, ytop) & am & ~shift(am, 0, 1) | (R(ax, ytop - 5, ax, ytop - 1) & am), p['d'])
    if kalash:
        ks = max(3, top_hw * 0.55)
        s.sh(P(onion_pts(cx, ytop - 7 - ks * 2.4, ytop - 6, ks, pinch=0.75, p=1.0)), GOLD, kl=1, kd=2, kdd=1)
    return m


def birla():
    s = Scene(6)
    s.sky(SKY_DAY, 0, 210)
    for x, y, w, sd in [(24, 50, 84, 31), (360, 40, 94, 32), (300, 96, 44, 33), (110, 110, 40, 34)]:
        cloud(s, x, y, w, seed=sd)
    for x, w, h in [(0, 16, 26), (14, 22, 40), (34, 14, 30), (52, 20, 46), (74, 16, 34), (92, 12, 22),
                    (380, 14, 28), (394, 20, 44), (414, 16, 32), (430, 22, 50), (452, 14, 34), (466, 18, 40)]:
        m = R(x, 206 - h, x + w, 210)
        s.sh(m, FT, kl=1, kd=2, kdd=0, d=(1, 0), ol=False)
        for yy in range(206 - h + 3, 206, 3):
            s.put(R(x + 2, yy, x + w - 3, yy) & m, '#cfe0f0')
    hill = P([(-2, H), (-2, 214), (40, 202), (86, 184), (116, 168), (132, 162), (348, 162), (364, 168),
              (396, 184), (440, 200), (482, 210), (482, H)])
    grass_tex(s, hill, seed=6)
    s.outline(hill, GRASS['o'])
    s.put(hill & ~shift(hill, 0, 2), GRASS['l'])
    for i, (bx, by, rx, ry) in enumerate([(40, 214, 18, 12), (70, 200, 12, 8), (96, 228, 20, 13), (24, 246, 24, 15),
                                          (420, 214, 20, 13), (452, 232, 22, 14), (392, 236, 16, 10), (466, 258, 20, 12)]):
        boulder(s, bx, by, rx, ry, seed=40 + i)
    for tx, ty, r in [(146, 222, 16), (338, 224, 16), (122, 186, 11), (360, 190, 12), (60, 252, 14), (414, 256, 15)]:
        tree(s, tx, ty, r)
    for bx, by, w in [(176, 176, 12), (304, 178, 12), (184, 246, 14), (296, 248, 14)]:
        bush(s, bx, by, w)
    # terrace wall + balustrade
    s.sh(R(128, 150, 352, 164), MARBLE, kl=1, kd=2, kdd=1)
    for yy in (155, 159):
        s.dith(R(130, yy, 350, yy), MARBLE['d'], 0.5)
    # mandapas (side halls with stepped roofs)
    for x0 in (136, 308):
        s.sh(R(x0, 126, x0 + 36, 150), MARBLE, kl=1, kd=2, kdd=1)
        for gx in range(x0 + 4, x0 + 33, 8):
            s.put(R(gx, 132, gx + 4, 150), '#6a6e90')
            s.put(R(gx, 132, gx + 4, 133), '#4a4e70')
        for i in range(5):
            s.sh(R(x0 - 2 + i * 3, 122 - 4 * i, x0 + 38 - i * 3, 125 - 4 * i), MARBLE, kl=1, kd=1, kdd=0, d=(0, 1))
        s.sh(P(onion_pts(x0 + 18, 96, 104, 4, pinch=0.75, p=1.0)), GOLD, kl=1, kd=1, kdd=0)
    # side shikharas
    for c in (188, 292):
        s.sh(R(c - 13, 118, c + 13, 150), MARBLE, kl=1, kd=2, kdd=1)
        s.put(R(c - 4, 134, c + 4, 150), '#6a6e90')
        shikhara(s, c, 118, 78, 12, MARBLE, ribs=1)
    # main shikhara
    shikhara(s, 240, 114, 42, 23, MARBLE, ribs=2)
    for sg in (-1, 1):
        shikhara(s, 240 + sg * 19, 114, 84, 8, MARBLE, ribs=1, kalash=False)
    s.sh(R(214, 112, 266, 150), MARBLE, kl=1, kd=2, kdd=1)
    for yy in (118, 124):
        s.put(R(215, yy, 265, yy), MARBLE['d'])
    door = P(arch_pts(232, 248, 136, 150, 8))
    s.put(door, '#6a6e90')
    s.put(door & ~shift(door, 0, 2), '#4a4e70')
    s.outline(door, GOLD['b'])
    s.put(R(240, 6, 240, 26), '#7a5a40')
    s.sh(P([(241, 6), (258, 10), (241, 15)]), ramp('#ff7a1e'), kl=1, kd=1, kdd=0, d=(0, 1))
    # balustrade on the terrace
    s.put(R(128, 145, 352, 146), MARBLE['b'])
    for x in range(129, 352, 6):
        s.sh(R(x, 147, x + 1, 150), MARBLE, kl=0, kd=1, kdd=0, d=(1, 0), ol=False)
    s.outline(R(128, 145, 352, 146), MARBLE['o'])
    # stairs
    st = P([(226, 165), (254, 165), (284, H), (196, H)])
    s.put(st, '#eef0f6')
    y = 166
    gap = 3
    while y < H:
        s.put(R(0, y, W - 1, y) & st, '#c8cede')
        s.put(R(0, y + 1, W - 1, y + 1) & st, '#ffffff')
        y += gap
        gap = min(9, gap + 0.35)
        y = int(y)
    for sg in (-1, 1):
        edge = P([(240 + sg * 14, 165), (240 + sg * 18, 165), (240 + sg * 48, H), (240 + sg * 44, H)])
        s.sh(edge, MARBLE, kl=1, kd=1, kdd=0)
    return s


# ================================================================== 7. QUTB SHAHI TOMBS
QS = pal('#efe6d6', '#cfc4b0', '#a89c88', '#82776a', '#3e3832')
QS_FAR = pal('#e2e2dc', '#ccd0cc', '#b4bab8', '#a0a8a8', '#7a8488')


def qs_tomb(s, cx, base, sc, p, inn=('#5a5048', '#3e3630'), detail=True):
    def X(v): return cx + v * sc
    def Y(v): return base - v * sc
    U = NONE()

    def part(m, **kw):
        nonlocal U
        U |= m
        kw.setdefault('ol', False)
        s.sh(m, p, **kw)

    part(R(X(-110), Y(20), X(110), Y(0)), kl=1, kd=2, kdd=1)
    for i in range(11):
        ax = X(-104 + i * 19.2)
        a = P(arch_pts(ax, ax + 10 * sc, Y(10), Y(1), 6 * sc))
        s.put(a, inn[0])
        s.put(a & ~shift(a, 0, 2), inn[1])
    part(R(X(-82), Y(23), X(82), Y(20)), kl=1, kd=1, kdd=0, d=(0, 1))
    part(R(X(-80), Y(72), X(80), Y(23)), kl=1, kd=3, kdd=1)
    pn = R(X(-24), Y(70), X(24), Y(23))
    s.put(pn & ~shift(pn, 0, 2), p['d'])
    s.put(pn & ~shift(pn, 2, 0), p['d'])
    ga = P(arch_pts(X(-17), X(17), Y(50), Y(23), 16 * sc))
    s.put(ga, inn[0])
    s.put(ga & ~shift(ga, 0, 3), inn[1])
    if detail:
        s.outline(ga, p['l'])
    for c in (-52, 52):
        a = P(arch_pts(X(c - 12), X(c + 12), Y(46), Y(23), 12 * sc))
        s.put(a, inn[0])
        s.put(a & ~shift(a, 0, 2), inn[1])
        if detail:
            for c2 in (c - 9, c + 9):
                a2 = P(arch_pts(X(c2 - 4), X(c2 + 4), Y(64), Y(58), 4 * sc))
                s.put(a2, inn[0])
    part(R(X(-84), Y(76), X(84), Y(72)), kl=1, kd=1, kdd=0, d=(0, 1))
    part(R(X(-80), Y(82), X(80), Y(76)), kl=1, kd=1, kdd=1, d=(0, 1))
    step = max(4, 8 * sc)
    xx = X(-78)
    while xx < X(78):
        part(P([(xx, Y(82)), (xx + step * 0.4, Y(87)), (xx + step * 0.8, Y(82))]), kl=0, kd=1, kdd=0, d=(1, 0))
        xx += step
    for c in (-80, 80):
        part(R(X(c - 5), Y(98), X(c + 5), Y(20)), kl=1, kd=3, kdd=1, d=(1, 0))
        part(P(onion_pts(X(c), Y(110), Y(97), 6 * sc, pinch=0.8, p=1.1)), kl=1, kd=2, kdd=1)
    part(R(X(-40), Y(96), X(40), Y(84)), kl=1, kd=3, kdd=1, d=(1, 0))
    part(P(onion_pts(cx, Y(170), Y(96), 46 * sc, pinch=0.76, p=1.1)), kl=max(1, int(3 * sc)), kd=max(2, int(9 * sc)), kdd=1)
    pr = R(X(-44), Y(99), X(44), Y(94))
    k = -44.0
    while k <= 44:
        pr |= P([(X(k - 3.5), Y(97)), (X(k), Y(104)), (X(k + 3.5), Y(97))])
        k += 7
    part(pr, kl=1, kd=2, kdd=0, d=(1, 0))
    fin = R(cx, Y(184), cx, Y(170))
    U |= fin
    s.put(fin, p['dd'])
    g = O(cx, Y(178), max(1, 2 * sc))
    U |= g
    s.put(g, GOLD['b'])
    s.outline(U, p['o'])
    return U


def qutb():
    s = Scene(7)
    G = 190
    s.sky(SKY_DAY, 0, G)
    for x, y, w, sd in [(290, 40, 90, 41), (400, 90, 56, 42), (10, 30, 60, 43)]:
        cloud(s, x, y, w, seed=sd)
    GH = pal('#c8dad6', '#b0c8c4', '#9cb6b4')
    s.sh(P([(-2, 186), (16, 126), (48, 104), (84, 96), (120, 108), (156, 140), (190, 186)]), GH, kl=0, kd=3, kdd=0, d=(1, 0), ol=False)
    rng = random.Random(5)
    for _ in range(14):
        bx, by = rng.randint(20, 150), rng.randint(118, 180)
        m = E(bx - 6, by - 4, bx + 6, by + 4) & P([(-2, 186), (16, 126), (48, 104), (84, 96), (120, 108), (156, 140), (190, 186)])
        s.put(m, '#bed2ce')
        s.put(m & ~shift(m, -1, -1), '#a2bcba')
    wall = R(30, 104, 132, 108)
    for x in range(30, 132, 5):
        wall |= R(x, 101, x + 2, 104)
    s.put(wall, '#a8bebc')
    s.put(R(70, 84, 96, 100) | O(83, 84, 6), '#a8bebc')
    s.put(R(90, 86, 96, 100), '#98b0ae')
    qs_tomb(s, 420, 186, 0.48, QS_FAR, detail=False)
    qs_tomb(s, 80, 190, 0.42, QS_FAR, detail=False)
    grass_tex(s, R(0, G, W - 1, H - 1), seed=7)
    for tx, ty, r in [(130, 192, 16), (356, 194, 14), (466, 200, 16)]:
        tree(s, tx, ty, r)
    s.shadow(P([(135, G), (360, G), (400, G + 18), (175, G + 18)]))
    qs_tomb(s, 245, 190, 1.0, QS)
    path = P([(225, 191), (265, 191), (318, H), (172, H)])
    s.put(path, STONE['b'])
    yy, gap = 194, 3.0
    while yy < H:
        s.put(R(0, int(yy), W - 1, int(yy)) & path, STONE['d'])
        yy += gap
        gap = min(12, gap * 1.18)
    s.put(L([(245, 191), (245, H)]) & path, STONE['d'])
    s.put(path & ~shift(path, 1, 0), STONE['dd'])
    s.put(path & ~shift(path, -1, 0), STONE['dd'])
    HEDGE = pal('#7ac85a', '#4a9c44', '#337a38', '#245e30', '#143420')
    for sg in (-1, 1):
        for i, yh in enumerate((206, 228, 254)):
            xh = 245 + sg * (34 + (yh - 191) * 0.55)
            hm = R(xh - 14, yh - 6, xh + 14, yh + 2)
            s.shadow(R(xh - 10, yh + 3, xh + 18, yh + 5))
            s.sh(hm, HEDGE, kl=1, kd=2, kdd=1)
    palm(s, 34, 228, 96, lean=0.15)
    palm(s, 452, 236, 100, lean=-0.12)
    for fx, fy in [(90, 214), (390, 220), (120, 252), (370, 256)]:
        flowers(s, fx, fy, 6, FLOWER, seed=fx)
    for bx_, by_ in [(200, 22), (212, 16), (228, 26)]:
        bird(s, bx_, by_)
    return s


# ================================================================== 8. BUS STOP
def apartment(s, x0, x1, top, base, pc):
    s.sh(R(x0, top, x1, base), pc, kl=1, kd=3, kdd=1)
    s.put(R(x0, top, x1, top + 2), pc['l'])
    for fy in range(top + 6, base - 12, 14):
        for wx in range(x0 + 5, x1 - 8, 12):
            w_ = R(wx, fy, wx + 6, fy + 6)
            s.put(w_, '#5a7ab0')
            s.put(w_ & ~shift(w_, 1, 1), '#3c5a90')
            s.px(wx + 4, fy + 2, '#a8c8f0')
            s.outline(w_, pc['dd'])
        s.put(R(x0 + 2, fy + 9, x1 - 2, fy + 10), pc['dd'])
        for gx in range(x0 + 3, x1 - 2, 3):
            s.px(gx, fy + 8, pc['d'])
    for tx in range(x0 + 6, x1 - 10, 24):
        tm = R(tx, top - 8, tx + 7, top - 1)
        s.sh(tm, pal('#5a5a68', '#34343e', '#222228', None, '#0c0c10'), kl=1, kd=2, kdd=0, d=(1, 0))
        for yy in (top - 6, top - 3):
            s.put(R(tx, yy, tx + 7, yy), '#222228')


def busstop():
    s = Scene(8)
    FT_, G = 178, 198
    s.sky(SKY_DAY, 0, FT_)
    for x, y, w, sd in [(220, 40, 90, 51), (390, 24, 70, 52), (20, 20, 50, 53)]:
        cloud(s, x, y, w, seed=sd)
    for x, w, h in [(140, 20, 90), (160, 26, 70), (250, 18, 96), (268, 30, 80), (296, 20, 66)]:
        m = R(x, FT_ - h, x + w, FT_)
        s.sh(m, FAR, kl=0, kd=2, kdd=0, d=(1, 0), ol=False)
        for yy in range(FT_ - h + 4, FT_, 5):
            s.put(R(x + 3, yy, x + w - 4, yy + 1) & m, '#cddff0')
    for x0, x1, top, ci in [(-4, 74, 72, 0), (70, 160, 100, 3), (300, 384, 88, 2), (380, 484, 64, 1)]:
        apartment(s, x0, x1, top, FT_, HOUSES[ci])
    # billboard
    for pxn in (90, 140):
        s.sh(R(pxn, 76, pxn + 2, 100), IRON, kl=0, kd=1, kdd=0, d=(1, 0))
    bb = R(76, 38, 156, 76)
    s.sh(bb, IRON, kl=1, kd=1, kdd=0)
    inner = R(79, 41, 153, 73)
    s.put(inner, '#ffd23c')
    s.put(inner & P([(118, 41), (153, 41), (153, 73), (98, 73)]), '#ff6a4a')
    s.sh(O(100, 57, 10), pal('#ffffff', '#fff6e8', '#f0d8c0'), kl=1, kd=2, kdd=0, ol=False)
    for yy, ln in ((50, 26), (56, 20), (62, 24)):
        s.put(R(122, yy, 122 + ln, yy + 2), '#ffffff')
    # power pole + wires
    s.sh(R(176, 56, 179, G - 4), pal('#e0e0e8', '#c0c0cc', '#9a9aa8', None, '#4a4a58'), kl=1, kd=1, kdd=0, d=(1, 0))
    s.sh(R(164, 60, 191, 62), pal('#e0e0e8', '#c0c0cc', '#9a9aa8', None, '#4a4a58'), kl=1, kd=1, kdd=0, d=(0, 1))
    for wy in (59, 63, 67):
        s.put(L(curve((-2, wy + 8), (166 if wy != 63 else 177, wy), 9)), '#2e3040')
        s.put(L(curve((189 if wy != 63 else 177, wy), (482, wy + 4), 12)), '#2e3040')
    for bxn in (200, 212, 300):
        bird(s, bxn, 66 + (bxn % 5) - 2 + int(12 * 4 * ((bxn - 177) / 305) * (1 - (bxn - 177) / 305)), '#3a3c50')
    tree(s, 356, FT_ + 2, 28)
    # footpath, curb, road
    fp = R(0, FT_, W - 1, G - 1)
    for yy in range(FT_, G, 5):
        for xx in range(-10 + (yy // 5 % 2) * 6, W, 12):
            s.put(R(xx, yy, xx + 10, yy + 3) & fp, '#cdc6be' if (xx // 12 + yy // 5) % 3 else '#dc8e6e')
            s.put(R(xx, yy + 4, xx + 11, yy + 4) & fp, '#a8a098')
            s.put(R(xx + 11, yy, xx + 11, yy + 4) & fp, '#a8a098')
    for xx in range(0, W, 10):
        c = '#f8d030' if (xx // 10) % 2 else '#34343e'
        s.put(R(xx, G, xx + 9, G + 6), c)
        s.put(R(xx, G, xx + 9, G), '#ffffff' if c == '#f8d030' else '#5a5a68')
    road = R(0, G + 7, W - 1, H - 1)
    s.put(road, '#727280')
    rng = random.Random(8)
    for _ in range(900):
        s.px(rng.randint(0, W - 1), rng.randint(G + 7, H - 1), rng.choice(['#62626e', '#82828e', '#686876']))
    s.put(R(0, G + 7, W - 1, G + 9), '#5a5a66')
    for xx in range(10, W, 46):
        s.put(R(xx, 240, xx + 22, 241), '#f4f4f4')
    # bus shelter
    TEAL = pal('#7ae0e8', '#30a8b8', '#20808e', '#186270', '#0c2c34')
    s.shadow(P([(206, 192), (334, 192), (346, 198), (218, 198)]))
    s.put(R(218, 128, 322, 176), '#b8e4f2')
    for k in range(3):
        s.put(P([(222 + k * 28, 176), (230 + k * 28, 176), (254 + k * 28, 128), (246 + k * 28, 128)]) & R(218, 128, 274, 176), '#e2f6fc')
    ad = R(276, 130, 318, 174)
    s.put(ad, '#ff8a3c')
    s.sh(R(288, 146, 304, 164) | R(304, 150, 309, 158), pal('#ffffff', '#fff6ec', '#f0d8c0', None, '#7a3a14'), kl=1, kd=1, kdd=0)
    s.put(R(305, 152, 306, 156), '#ff8a3c')
    s.put(R(290, 149, 302, 151), '#b0602c')
    for k, sx_ in enumerate((291, 296, 301)):
        for yy in range(134, 144):
            s.px(sx_ + (1 if (yy + k) % 4 < 2 else 0), yy, '#ffffff')
    s.outline(R(218, 128, 322, 176), TEAL['o'])
    for pxn in (214, 268, 322):
        s.sh(R(pxn, 118, pxn + 2, 192), TEAL, kl=1, kd=1, kdd=0, d=(1, 0))
    s.sh(P([(204, 112), (336, 112), (342, 122), (198, 122)]), TEAL, kl=1, kd=2, kdd=1, d=(0, 1))
    s.sh(R(222, 168, 304, 171), pal('#d8e0ea', '#a8b2c2', '#7e8898', None, '#2a2e38'), kl=1, kd=1, kdd=0, d=(0, 1))
    for lx in (226, 300):
        s.put(R(lx, 172, lx + 1, 190), '#4a5060')
    # bus-stop sign
    s.sh(R(195, 104, 197, 194), pal('#e0e4ec', '#b0b6c4', '#868c9c', None, '#3a3e4a'), kl=1, kd=1, kdd=0, d=(1, 0))
    sg = O(196, 100, 9)
    s.put(sg, '#ffffff')
    s.put(O(196, 100, 7), '#2a6ad0')
    s.outline(sg, '#1a2a50')
    s.put(R(191, 96, 201, 103), '#ffffff')
    s.put(R(192, 97, 200, 98), '#2a6ad0')
    s.px(193, 104, '#ffffff')
    s.px(199, 104, '#ffffff')
    # chai cart
    s.shadow(E(68, 188, 160, 198))
    s.sh(R(76, 160, 146, 182), WOOD, kl=1, kd=2, kdd=1)
    s.put(R(78, 168, 144, 168), WOOD['d'])
    for wx in (88, 134):
        w_ = O(wx, 186, 8)
        s.put(w_, '#2e2e36')
        s.put(O(wx, 186, 5), '#8a8a96')
        s.px(wx, 186, '#2e2e36')
        s.outline(w_, '#101014')
    STEEL = pal('#ffffff', '#d8dce6', '#a8b0c0', '#8890a4', '#2e3240')
    s.sh(E(84, 142, 106, 160) | R(92, 138, 98, 143) | P([(106, 148), (114, 142), (115, 144), (106, 152)]), STEEL, kl=2, kd=3, kdd=1)
    for gx in (114, 121, 128, 135):
        s.sh(R(gx, 152, gx + 4, 159), pal('#fff6dc', '#f0c070', '#c89040', None, '#5a3a14'), kl=1, kd=1, kdd=0)
    s.put(R(111, 106, 112, 160), '#5a4030')
    umb = P([(76, 120), (146, 120), (140, 110), (126, 104), (96, 104), (82, 110)])
    s.put(umb, '#ff4a4a')
    for k in range(0, 72, 18):
        s.put(umb & P([(76 + k, 121), (85 + k, 121), (111, 100)]), '#ffd23c')
    s.shadow(umb & ~shift(umb, 0, -2), f=(0.8, 0.8, 0.85))
    s.outline(umb, '#3a1414')
    # auto rickshaw
    YEL = pal('#fff080', '#f8d020', '#d0a810', '#a88008', '#3a2c08')
    BLK = pal('#5a5a68', '#34343e', '#222228', '#18181c', '#0c0c10')
    # auto rickshaw (three-wheeler, side view, facing left)
    s.shadow(E(366, 235, 456, 243))
    s.put(R(390, 197, 437, 214), '#3a2a34')                       # open passenger bay
    s.sh(R(416, 200, 436, 214), pal('#e07070', '#b84848', '#8a3434', None, '#2a1010'), kl=1, kd=1, kdd=0)
    s.put(R(404, 209, 416, 214), '#8a3434')
    s.put(R(398, 202, 399, 214), '#c8c8d0')                       # grab pole
    can = P([(381, 199), (387, 187), (396, 183), (440, 182), (446, 186), (447, 214), (438, 214), (438, 197), (390, 197)])
    can &= ~R(390, 197, 437, 214)
    s.sh(can, BLK, kl=1, kd=2, kdd=1)
    ws = P([(379, 212), (382, 200), (387, 189), (390, 189), (390, 211)])
    s.put(ws, '#a8e0f8')
    s.put(L([(383, 198), (387, 192)]), '#ffffff')
    s.outline(ws, BLK['o'])
    body = P([(388, 213), (446, 213), (448, 230), (444, 234), (388, 234)])
    s.sh(body, YEL, kl=1, kd=2, kdd=1, d=(0, 1))
    s.put(R(389, 226, 447, 228) & body, '#2aa050')
    s.put(R(389, 229, 447, 229) & body, '#1e7a3c')
    cowl = P([(378, 213), (388, 211), (389, 231), (380, 232), (375, 225)])
    s.sh(cowl, YEL, kl=1, kd=1, kdd=0)
    s.put(R(376, 219, 378, 221), '#fff8c0')
    s.px(377, 218, '#ffffff')
    s.put(L([(386, 208), (383, 205)]), '#4a4a58')                 # handlebar
    for wx, r in ((381, 4), (430, 6)):
        mg = E(wx - r - 2, 233 - r - 2, wx + r + 2, 236 + r) & R(0, 0, W - 1, 233)
        s.sh(mg, BLK, kl=1, kd=1, kdd=0, d=(0, 1))
        w_ = O(wx, 236, r)
        s.put(w_, '#28282c')
        s.put(O(wx, 236, max(1, r - 4)), '#b0b0b8')
        s.outline(w_, '#0c0c10')
    return s


# ================================================================== 9. HITEC CITY
GLASS = pal('#a8dcf8', '#6ab4e8', '#4a90d0', '#3470b0', '#1c3c68')


def glass_tower(s, x0, x1, top, base, p=GLASS, slant=0):
    m = P([(x0, top + slant), (x1, top), (x1, base), (x0, base)])
    s.sh(m, p, kl=2, kd=6, kdd=2, d=(1, 0), ld=(1, 1))
    for yy in range(top + 4, base, 6):
        s.put(R(x0, yy, x1, yy) & m & ~shift(m, -6, 0), p['l'])
    for xx in range(x0 + 6, x1, 8):
        s.put(R(xx, top, xx, base) & m, p['d'])
    for k, ya in enumerate((base - 10, base - 70)):
        band = P([(x0, ya), (x0, ya + 12), (x1, ya - 48 + 12), (x1, ya - 48)]) & m
        s.dith(band, '#dcf4ff', 0.5)
    return m


def hitec():
    s = Scene(9)
    G = 202
    s.sky(SKY_DAY, 0, G)
    for x, y, w, sd in [(150, 26, 70, 61), (330, 36, 60, 62), (20, 70, 44, 63)]:
        cloud(s, x, y, w, seed=sd)
    for x, w, h in [(120, 18, 120), (146, 22, 96), (300, 20, 110), (330, 24, 86), (0, 24, 80), (440, 30, 96)]:
        m = R(x, G - h, x + w, G)
        s.sh(m, FT, kl=1, kd=2, kdd=0, d=(1, 0), ol=False)
        for yy in range(G - h + 3, G, 4):
            s.put(R(x + 2, yy, x + w - 3, yy) & m, '#cfe0f0')
    glass_tower(s, 24, 104, 24, G, slant=18)
    glass_tower(s, 372, 446, 44, G, p=pal('#b8f0e8', '#70d0c4', '#4aaaa4', '#348886', '#16403e'))
    s.put(R(408, 30, 408, 44), '#4a4e60')
    s.px(408, 29, '#ff4040')
    WHT = pal('#ffffff', '#eef2f8', '#cfd8e6', '#aab6cc', '#2c3a58')
    s.sh(R(446, 90, 482, G), WHT, kl=1, kd=2, kdd=1)
    for yy in range(96, G, 7):
        s.put(R(450, yy, 482, yy + 3), '#5a8ac8')
    # Cyber Towers - round glass drum
    cx, rx, ry, top = 240, 78, 9, 76
    GL = [C(c) for c in ('#c6eafc', '#8acaf2', '#5aa6e2', '#3d84c8', '#2c66a8')]
    SL = [C(c) for c in ('#ffffff', '#eef2f8', '#d2dae8', '#aeb8cc', '#8e9ab4')]
    for x in range(cx - rx, cx + rx + 1):
        u = (x - cx) / rx
        sq = math.sqrt(max(0.0, 1 - u * u))
        lv = (u + 1) / 2 * 4.0 - 0.3
        ang = math.asin(max(-1.0, min(1.0, u)))
        mull = (ang / 0.2) % 1.0 < (1.0 / max(1.0, rx * math.cos(ang))) / 0.2
        front = top + ry * sq
        for y in range(int(front), G):
            idx = int(min(4, max(0, math.floor(lv + BT[y, x] - 0.5))))
            k = (y - front) % 12
            if k < 2:
                s.a[y, x] = SL[idx]
            else:
                s.a[y, x] = GL[min(4, idx + 1)] if mull else GL[idx]
    body = R(cx - rx, top, cx + rx, G) & ~P([(cx - rx - 1, top - 1)] + [(cx + rx * math.cos(t), top + ry * math.sin(t)) for t in np.linspace(math.pi, 0, 40)] + [(cx + rx + 1, top - 1)])
    roof = E(cx - rx, top - ry, cx + rx, top + ry)
    s.put(roof, '#dfe6f0')
    s.put(roof & ~shift(roof, 0, 1), '#ffffff')
    s.put(E(cx - rx + 8, top - ry + 2, cx + rx - 8, top + ry - 3), '#b8c4d6')
    dome = P(onion_pts(cx, top - 24, top + 1, 30, pinch=0.52, p=0.7))
    s.sh(dome, pal('#d0f0ff', '#78c0f0', '#4a94d4', '#3070b0', '#1c3c68'), kl=2, kd=6, kdd=1)
    for k in range(-2, 3):
        s.put(L([(cx, top - 23), (cx + k * 11, top)]) & dome, '#ffffff' if k < 0 else '#a8d8f8')
    s.outline(body | roof, WHT['o'])
    s.sh(P([(cx - 30, G - 22), (cx + 30, G - 22), (cx + 36, G - 16), (cx - 36, G - 16)]), WHT, kl=1, kd=2, kdd=1, d=(0, 1))
    s.put(R(cx - 22, G - 15, cx + 22, G), '#28406a')
    for pxn in (cx - 28, cx - 10, cx + 8, cx + 26):
        s.sh(R(pxn, G - 15, pxn + 2, G), WHT, kl=1, kd=1, kdd=0, d=(1, 0))
    # metro viaduct + train
    VIA = pal('#f6f6f8', '#dcdce4', '#b8b8c6', '#9898aa', '#44444e')
    for pxn in (70, 236, 402):
        s.sh(R(pxn - 6, 170, pxn + 6, G), VIA, kl=1, kd=3, kdd=1, d=(1, 0))
        s.sh(P([(pxn - 18, 168), (pxn + 18, 168), (pxn + 7, 177), (pxn - 7, 177)]), VIA, kl=1, kd=2, kdd=1, d=(0, 1))
    s.sh(R(0, 160, W - 1, 168), VIA, kl=1, kd=2, kdd=1, d=(0, 1), ol=False)
    s.put(R(0, 169, W - 1, 169), VIA['o'])
    TR = pal('#ffffff', '#f2f4f8', '#cfd4e0', '#aab0c2', '#2a3048')
    for k in range(3):
        x0 = -30 + k * 86
        x1 = x0 + 82
        car = R(x0, 140, x1, 158) & ~R(x0, 140, x0, 140) & ~R(x1, 140, x1, 140)
        if k == 2:
            car |= P([(x1, 140), (x1 + 6, 144), (x1 + 10, 152), (x1 + 10, 158), (x1, 158)])
        s.sh(car, TR, kl=1, kd=2, kdd=1, d=(0, 1))
        s.put(R(x0 + 3, 144, x1 - 3, 148), '#2a3a5a')
        s.put(R(x0 + 3, 144, x1 - 3, 144), '#5a7ab0')
        for wx in range(x0 + 8, x1 - 6, 14):
            s.put(R(wx, 145, wx + 1, 146), '#7a9ad0')
        s.put(R(x0, 151, x1 + (8 if k == 2 else 0), 152) & car, '#2a68d8')
        s.put(R(x0, 153, x1 + (8 if k == 2 else 0), 153) & car, '#e84a6a')
        for dxn in (x0 + 20, x1 - 22):
            s.put(R(dxn, 143, dxn, 157), TR['d'])
        if k == 2:
            s.put(P([(x1 + 1, 142), (x1 + 6, 145), (x1 + 8, 150), (x1 + 1, 150)]), '#2a3a5a')
            s.px(x1 + 9, 155, '#fff6b0')
    # ground
    s.put(R(0, G, W - 1, G + 7), '#d8d4ce')
    for xx in range(0, W, 8):
        s.put(R(xx, G, xx, G + 7), '#b8b2aa')
    s.put(R(0, G + 7, W - 1, G + 8), '#9a948c')
    s.put(R(0, G + 9, W - 1, H - 1), '#727280')
    rng = random.Random(11)
    for _ in range(800):
        s.px(rng.randint(0, W - 1), rng.randint(G + 9, H - 1), rng.choice(['#62626e', '#82828e']))
    for xx in range(0, W, 10):
        s.put(R(xx, 236, xx + 9, 239), '#f8d030' if (xx // 10) % 2 else '#34343e')
    s.put(R(0, 232, W - 1, 235), GRASS['b'])
    for bxn in range(16, W, 48):
        bush(s, bxn, 234, 14)
    for xx in range(20, W, 46):
        s.put(R(xx, 254, xx + 22, 255), '#f4f4f4')
        s.put(R(xx + 10, 220, xx + 30, 221), '#f4f4f4')
    for tx in (150, 330):
        tree(s, tx, G + 5, 13)
    return s


# ================================================================== battle platforms
def platforms():
    s = Scene(transparent=True)

    def disc(cx, cy, rx, ry):
        top = E(cx - rx, cy - ry, cx + rx, cy + ry)
        side = E(cx - rx, cy - ry + 4, cx + rx, cy + ry + 4) & ~top
        s.put(side, '#8a5a34')
        s.put(side & ~shift(side, 0, -2), '#5e3c22')
        s.put(top, GRASS['b'])
        s.put(top & ~E(cx - rx * 0.86, cy - ry * 0.8, cx + rx * 0.86, cy + ry * 0.8), GRASS['d'])
        s.put(top & ~shift(top, 0, 1), GRASS['l'])
        grass_tex(s, E(cx - rx * 0.8, cy - ry * 0.7, cx + rx * 0.8, cy + ry * 0.7), seed=cx, sx=10, sy=5, dens=0.4)
        s.outline(top | side, '#2c3a20')

    disc(354, 196, 60, 13)
    disc(126, 246, 102, 22)
    return s


# ================================================================== export
SCENES = [('01_charminar', 'Charminar', charminar),
          ('02_durgam_cheruvu', 'Durgam Cheruvu', durgam),
          ('03_tank_bund_buddha', 'Tank Bund / Hussain Sagar', tankbund),
          ('04_film_city', 'Film City (Ramoji-style)', ramoji),
          ('05_shilparamam', 'Shilparamam', shilparamam),
          ('06_birla_mandir', 'Birla Mandir', birla),
          ('07_qutb_shahi_tombs', 'Qutb Shahi Tombs', qutb),
          ('08_bus_stop', 'Bus stop', busstop),
          ('09_hitec_city', 'HITEC City', hitec)]

# scenes 10-20 live in scenes2.py (helpers in px2.py)
import scenes2 as S2  # noqa: E402

SCENES += [('10_home', 'Home', S2.home),
           ('11_kirana', 'Kirana store', S2.kirana),
           ('12_college', 'Junior college', S2.college),
           ('13_bank', 'Bank branch', S2.bank),
           ('14_mobile_shop', 'Mobile shop', S2.mobile_shop),
           ('15_clinic', 'Clinic reception', S2.clinic),
           ('16_canteen', 'College canteen', S2.canteen),
           ('17_turf', 'Turf cricket (night)', S2.turf),
           ('18_campus', 'University gate', S2.campus),
           ('19_home_age60', 'Home, decades later (epilogue)', S2.home_age60),
           ('20_office_lobby', 'Office lobby (5 years later)', S2.office_lobby),
           ('21_market_terminal', 'Market terminal (night)', S2.market_terminal)]
PREVIEW_SCENE = '10_home'
PALETTE_CAP = 160   # max colours per background (scenes 01-09 sit at 59-142)


def cap_palette(sc, n=PALETTE_CAP):
    im = sc.image().convert('RGB')
    if len(im.getcolors(1 << 20)) <= n:
        return
    q = im.quantize(colors=n, method=Image.Quantize.MAXCOVERAGE, dither=Image.Dither.NONE).convert('RGB')
    sc.a[..., :3] = np.asarray(q)


def main(only=None):
    os.makedirs('out/1x', exist_ok=True)
    os.makedirs('out/4x', exist_ok=True)
    tiles = []
    for slug, name, fn in SCENES:
        if only and slug not in only:
            continue
        sc = fn()
        cap_palette(sc)
        sc.save(f'out/1x/{slug}.png')
        sc.save(f'out/4x/{slug}@4x.png', 4)
        tiles.append((sc.image().convert('RGB'), f'{slug[:2]}  {name}', slug))
        print('ok', slug)
    if only:
        return
    pl = platforms()
    pl.save('out/1x/battle_platforms_overlay.png')
    pl.save('out/4x/battle_platforms_overlay@4x.png', 4)
    # contact sheet
    pad, lab, cols = 8, 14, 4
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (W + pad) + pad, rows * (H + lab + pad) + pad), (26, 26, 40))
    d = ImageDraw.Draw(sheet)
    for i, (im, name, _) in enumerate(tiles):
        x, y = pad + (i % cols) * (W + pad), pad + (i // cols) * (H + lab + pad)
        d.text((x + 1, y + 1), name, fill=(240, 240, 255))
        sheet.paste(im, (x, y + lab))
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save('out/contact_sheet.png')
    # battle preview: one scene + platforms
    base = next(im for im, _, slug in tiles if slug == PREVIEW_SCENE)
    prev = Image.alpha_composite(base.convert('RGBA'), pl.image())
    prev.resize((W * 2, H * 2), Image.NEAREST).save('out/battle_preview.png')
    # Charminar Market UI set (icons, 9-slices, device frame, sprite strips) + its contact sheet
    import market
    market.build('out')


if __name__ == '__main__':
    import sys
    main(sys.argv[1:] or None)
