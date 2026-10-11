"""Detailed 64x64 landmark icons for the overworld map (3/4 top-down view).

Each icon is drawn around a pad point (IX, IY) on a scratch canvas and cropped to
64x64 so that the pad point lands at (32, 66) inside the icon (64 wide x 72 tall).
"""
import math

import numpy as np

from pxlib import *

IX, IY = W // 2, 200
CROP = (IX - 32, IY - 66, IX + 32, IY + 6)   # 64x72, pad point lands at (32, 66)
OUT = '#3a2a1e'

CM = pal('#fff4dc', '#f2d6a6', '#d8b07a', '#b48858', '#4e3220')
CMB = pal('#ecd2a6', '#dcb886', '#c09868', '#9c7650', '#4e3220')
STN = pal('#fffaf0', '#e8dcc4', '#c8b898', '#a89878', '#4a3e2c')
MB = pal('#ffffff', '#f0f2f8', '#cfd6e4', '#a8b2c8', '#454a66')
QS = pal('#f2eadc', '#d4c8b2', '#ae9f88', '#8a7c68', '#3e3630')
ST = pal('#ffffff', '#f2e8dc', '#d2b8ac', '#a88e92', '#3e2840')
WH = pal('#ffffff', '#eef2f8', '#c6cede', '#9ea8be', '#3e4660')
BRK = pal('#f49a7a', '#d2664a', '#a84a36', '#843828', '#3a160c')
CRM = pal('#fffbf0', '#f6ead4', '#dcc6a2', '#bca480', '#3e2a18')
PNK = pal('#ffe4ec', '#f8bccc', '#e092aa', '#c07090', '#5a2840')
TEAL = pal('#ccf6ee', '#74d2c6', '#4aaca6', '#348886', '#16403e')
GLS = pal('#dcf2ff', '#8ccaf2', '#5aa6e2', '#3d84c8', '#1c3c68')
INNER = ('#7a5038', '#5a3824')


def onion(cx, yt, yb, r, pinch=0.82, p=1.2):
    return P(onion_pts(cx, yt, yb, r, pinch=pinch, p=p))


def plaza(s, rx=24, ry=7, p=STN, tiles=True):
    m = E(IX - rx, IY - ry, IX + rx, IY + ry)
    s.sh(m, p, kl=1, kd=2, kdd=1, d=(0, 1), ol=False)
    if tiles:
        for k in range(IX - rx + 5, IX + rx - 3, 6):
            s.put(L([(k, IY - ry + 2), (k - 2, IY + ry - 2)]) & m & ~(m & ~shift(m, 0, 2)), p['d'])
        s.put(R(IX - rx, IY, IX + rx, IY) & m & ~(m & ~shift(m, 0, -2)) & ~(m & ~shift(m, 0, 2)), p['d'])
    s.outline(m, OUT)
    return m


def water_disc(s, rx, ry, dy=0):
    m = E(IX - rx, IY - ry + dy, IX + rx, IY + ry + dy)
    s.put(m, WATER['b'])
    s.put(m & ~shift(m, 0, -2), WATER['d'])
    for k, yy in enumerate(range(IY - ry + 2 + dy, IY + ry + dy, 3)):
        for xx in range(IX - rx + 4 + (k % 2) * 5, IX + rx - 3, 10):
            s.put(R(xx, yy, xx + 3, yy) & m, WATER['l'])
    return m


def ring_balcony(s, cx, y, hw, p):
    s.put(R(cx - hw, y, cx + hw, y), p['l'])
    s.put(R(cx - hw, y + 1, cx + hw, y + 1), p['d'])
    s.put(R(cx - hw + 1, y + 2, cx + hw - 1, y + 2), p['dd'])
    s.px(cx - hw, y + 1, OUT)
    s.px(cx + hw, y + 1, OUT)


# ------------------------------------------------------------------ CHARMINAR
def ic_charminar(s):
    pl = plaza(s, 27, 7)
    G = IY - 3
    s.shadow(P([(IX + 4, G + 1), (IX + 22, G + 1), (IX + 30, G + 6), (IX + 12, G + 6)]) & pl)
    # back minarets
    for cx in (IX - 11, IX + 11):
        sh_ = R(cx - 1, IY - 47, cx + 1, IY - 33)
        dm = onion(cx, IY - 54, IY - 46, 2.6)
        s.outline(sh_ | dm, OUT)
        s.sh(sh_, CMB, kl=0, kd=1, kdd=0, d=(1, 0), ol=False)
        s.sh(dm, CMB, kl=1, kd=1, kdd=0, ol=False)
        s.px(cx, IY - 55, GOLD['d'])
        s.put(R(cx - 2, IY - 42, cx + 2, IY - 42), CMB['d'])
    # body
    roof = R(IX - 15, IY - 36, IX + 15, IY - 33)
    face = R(IX - 15, IY - 32, IX + 15, G)
    body = roof | face
    s.outline(body, OUT)
    s.put(face, CM['b'])
    s.put(roof, CM['l'])
    s.put(R(IX - 15, IY - 33, IX + 15, IY - 33), CM['d'])
    for k in range(IX - 14, IX + 15, 3):
        s.put(R(k, IY - 37, k + 1, IY - 37), CM['b'])
        s.px(k, IY - 38, OUT)
        s.px(k + 1, IY - 38, OUT)
    # upper gallery
    for i in range(6):
        ax = IX - 13 + i * 5
        a = P(arch_pts(ax, ax + 3, IY - 28, IY - 25, 2))
        s.put(a, INNER[0])
        s.put(a & ~shift(a, 0, 1), INNER[1])
    s.put(R(IX - 15, IY - 24, IX + 15, IY - 24), CM['l'])
    s.put(R(IX - 15, IY - 23, IX + 15, IY - 23), CM['dd'])
    # big arch
    arch = P(arch_pts(IX - 8, IX + 8, IY - 13, G, 8))
    s.put(dilate(arch) & face & ~arch, CM['dd'])
    s.put(arch, INNER[0])
    s.put(arch & ~shift(arch, 0, 3), INNER[1])
    through = P(arch_pts(IX - 4, IX + 4, IY - 8, G, 4))
    s.put(through, '#c8e6f6')
    s.put(through & R(0, G - 3, W - 1, H - 1), STN['b'])
    for mx in (IX - 12, IX + 12):
        s.put(O(mx, IY - 18, 1), CM['dd'])
        s.px(mx, IY - 18, CM['l'])
    s.put(face & ~shift(face, -2, 0), CM['d'])
    s.put(face & ~shift(face, 1, 0), CM['l'])
    # front minarets
    for cx in (IX - 17, IX + 17):
        sh_ = R(cx - 2, IY - 44, cx + 2, G)
        dm = onion(cx, IY - 55, IY - 44, 3.6)
        s.outline(sh_ | dm, OUT)
        s.sh(sh_, CM, kl=1, kd=2, kdd=0, d=(1, 0), ol=False)
        s.put(R(cx, IY - 42, cx, G - 2), CM['d'])
        s.sh(dm, CM, kl=1, kd=2, kdd=1, ol=False)
        for by in (IY - 33, IY - 22, IY - 44):
            ring_balcony(s, cx, by, 3, CM)
        s.put(R(cx, IY - 58, cx, IY - 55), GOLD['d'])
        s.px(cx, IY - 57, GOLD['l'])
    s.sh(R(IX - 21, G, IX + 21, G + 1), CM, kl=1, kd=1, kdd=0, d=(0, 1))


# ------------------------------------------------------------------ TANK BUND BUDDHA
def ic_tankbund(s):
    """Monolithic standing Buddha on Gibraltar Rock in Hussain Sagar (abhaya mudra)."""
    SB = pal('#ffffff', '#efe9e2', '#d2c6c0', '#aa9ea2', '#3a2e3a')
    G = IY - 2
    # rock island
    parts = [E(IX - 25, G - 12, IX - 1, G + 3), E(IX - 4, G - 13, IX + 24, G + 3), E(IX - 15, G - 18, IX + 13, G - 2)]
    rock = NONE()
    for r in parts:
        rock |= r
    rock &= R(0, 0, W - 1, G + 1)
    s.put(R(IX - 27, G + 2, IX + 27, G + 3) & dilate(dilate(dilate(rock))) & ~rock, '#e6f6ff')
    s.outline(rock, '#4a3e34')
    s.sh(rock, GRANITE, kl=1, kd=3, kdd=1, ol=False)
    for r in parts:
        s.put(dilate(r) & ~r & rock & shift(rock, 0, 2) & shift(rock, 0, -2), GRANITE['d'])
    for (x, y) in ((IX - 19, G - 8), (IX + 15, G - 9), (IX - 8, G - 14)):
        s.px(x, y, '#ffffff')
    for (x, y) in ((IX - 21, G - 8), (IX + 19, G - 7)):
        sm = O(x, y, 2)
        s.outline(sm, '#1e3a1e')
        s.sh(sm, LEAF, kl=1, kd=1, kdd=0, ol=False)
    # pedestal
    T = 135                       # top of the ushnisha
    S = T + 13                    # shoulder line
    Hm = T + 41                   # robe hem
    Lt = Hm + 2                   # lotus
    tierB_top, tierB = R(IX - 10, Lt + 8, IX + 10, Lt + 8), R(IX - 10, Lt + 9, IX + 10, Lt + 12)
    tierA_top, tierA = R(IX - 8, Lt + 4, IX + 8, Lt + 4), R(IX - 8, Lt + 5, IX + 8, Lt + 7)
    lot_band = R(IX - 9, Lt + 2, IX + 9, Lt + 3)
    petals = NONE()
    for k in range(IX - 9, IX + 10, 3):
        petals |= P([(k - 1, Lt + 2), (k + 2, Lt + 2), (k + 0.5, Lt - 1)])
    ped = tierB_top | tierB | tierA_top | tierA | lot_band | petals
    s.shadow(R(IX + 11, Lt + 6, IX + 13, Lt + 12) & rock)
    s.outline(ped, SB['o'])
    s.sh(tierB, SB, kl=1, kd=2, kdd=1, ol=False)
    s.put(tierB_top, SB['l'])
    s.sh(tierA, SB, kl=1, kd=2, kdd=1, ol=False)
    s.put(tierA_top, SB['l'])
    s.sh(lot_band, SB, kl=0, kd=1, kdd=0, d=(0, 1), ol=False)
    s.sh(petals, SB, kl=1, kd=1, kdd=0, d=(1, 0), ol=False)
    # statue
    T, S = 134, 148
    ush = R(IX - 1, T, IX + 1, T) | R(IX - 2, T + 1, IX + 2, T + 2)
    head = E(IX - 5, T + 2, IX + 5, T + 12)
    ears = R(IX - 6, T + 6, IX - 6, T + 12) | R(IX + 6, T + 6, IX + 6, T + 12)
    neck = R(IX - 2, T + 13, IX + 2, T + 13)
    robe = P([(IX - 6, S), (IX + 6, S), (IX + 8, S + 3), (IX + 8, S + 14), (IX + 9, S + 24), (IX + 10, Hm),
              (IX - 10, Hm), (IX - 9, S + 24), (IX - 8, S + 14), (IX - 8, S + 3)])
    upper = P([(IX - 8, S + 1), (IX - 6, S + 3), (IX - 9, S + 11), (IX - 12, S + 11), (IX - 11, S + 5)])
    fore = R(IX - 13, S + 1, IX - 11, S + 10)
    palm = R(IX - 14, S - 6, IX - 11, S)
    thumb = R(IX - 10, S - 2, IX - 10, S - 1)
    sleeve = P([(IX - 12, S + 8), (IX - 8, S + 4), (IX - 8, S + 20), (IX - 11, S + 16)])
    larm = P([(IX + 7, S + 1), (IX + 9, S + 3), (IX + 10, S + 15), (IX + 8, S + 16), (IX + 7, S + 8)])
    lhand = R(IX + 8, S + 15, IX + 10, S + 17)
    drape = P([(IX + 8, S + 17), (IX + 11, S + 17), (IX + 12, Hm - 1), (IX + 9, Hm)])
    feet = R(IX - 5, Hm + 1, IX - 3, Hm + 1) | R(IX + 3, Hm + 1, IX + 5, Hm + 1)
    body = [sleeve, upper, fore, robe, drape, larm, lhand, neck, ears, head, ush, palm, thumb, feet]
    U = NONE()
    for mm in body:
        U |= mm
    s.outline(U, SB['o'])
    for mm in body:
        s.sh(mm, SB, kl=1, kd=1, kdd=0, d=(1, 0), ol=False)
    s.put(robe & ~shift(robe, -2, 0), SB['d'])
    s.put(robe & ~shift(robe, 1, 0), SB['l'])
    # deep U-shaped drapes between the arms, straight folds to the hem
    inner = robe & shift(robe, 2, 0) & shift(robe, -3, 0)
    for y0 in (S + 3, S + 8, S + 13, S + 18):
        s.put(L(curve((IX - 6, y0 - 2), (IX + 6, y0 - 2), 5)) & inner, SB['d'])
    for fx, dx in ((IX - 5, -2), (IX - 1, -1), (IX + 3, 0), (IX + 6, 1)):
        s.put(L([(fx, S + 23), (fx + dx, Hm - 1)]) & inner, SB['d'])
    s.put(R(IX - 10, Hm, IX + 10, Hm) & robe, SB['dd'])
    s.put(R(IX - 8, S + 9, IX - 8, S + 19) & sleeve, SB['d'])
    s.put(drape & ~shift(drape, 1, 0), SB['dd'])
    s.put(neck, SB['d'])
    # head: curls, serene face
    hair = (head & R(0, 0, W - 1, T + 5)) | ush
    s.put(hair, SB['d'])
    ys, xs = np.nonzero(hair)
    for x, y in zip(xs, ys):
        if (x + y) % 2 == 0:
            s.px(x, y, SB['b'])
    s.put(R(IX - 4, T + 6, IX + 4, T + 6) & head, SB['dd'])
    s.put(R(IX - 3, T + 8, IX - 2, T + 8) | R(IX + 2, T + 8, IX + 3, T + 8), SB['dd'])
    s.px(IX, T + 9, SB['d'])
    s.put(R(IX - 1, T + 11, IX + 1, T + 11), SB['d'])
    s.put(ears, SB['d'])
    s.px(IX - 6, T + 6, SB['b'])
    # hands
    s.put(R(IX - 13, S - 6, IX - 13, S - 5) | R(IX - 12, S - 6, IX - 12, S - 6), SB['l'])
    s.px(IX - 12, S - 3, SB['d'])
    s.put(lhand & ~shift(lhand, -1, 0), SB['d'])


# ------------------------------------------------------------------ BIRLA MANDIR
def shikhara(s, cx, yb, yt, hw, p, ribs=1, kalash=True):
    right, left, hws = [], [], []
    n = 16
    for i in range(n + 1):
        t = i / n
        y = yb - (yb - yt) * t
        w = hw * (1 + 0.08 * math.sin(math.pi * t)) * (1 - 0.6 * t ** 1.6)
        right.append((cx + w, y))
        left.append((cx - w, y))
        hws.append((y, w))
    m = P(right + left[::-1])
    s.outline(m, p['o'])
    s.sh(m, p, kl=1, kd=max(2, int(hw * 0.35)), kdd=1, d=(1, 0), ol=False)
    for k in range(-ribs, ribs + 1):
        if k:
            s.put(L([(cx + k / (ribs + 1) * w, y) for y, w in hws]) & m, p['d'] if k < 0 else p['dd'])
    for yy in range(int(yb) - 3, int(yt), -3):
        s.dith(R(0, yy, W - 1, yy) & m, p['d'], 0.5)
    tw = hws[-1][1]
    am = E(cx - tw - 1.5, yt - 3, cx + tw + 1.5, yt + 1)
    s.outline(am, p['o'])
    s.sh(am, p, kl=1, kd=1, kdd=0, ol=False)
    if kalash:
        km = onion(cx, yt - 7, yt - 2, 1.6, pinch=0.75, p=1.0)
        s.outline(km, OUT)
        s.sh(km, GOLD, kl=1, kd=1, kdd=0, ol=False)
    return m


def ic_birla(s):
    G = IY - 2
    hill = E(IX - 30, G - 16, IX + 30, G + 8) & R(0, 0, W - 1, IY + 4)
    s.outline(hill, '#1e3a1e')
    s.sh(hill, pal('#a8e080', '#6cc058', '#4ea446', '#3a8a3c', '#1e3a1e'), kl=1, kd=3, kdd=1, ol=False)
    for (bx, by, rx, ry) in ((IX - 23, G - 2, 4, 3), (IX - 17, G + 2, 3, 2), (IX + 21, G - 1, 4, 3)):
        bm = E(bx - rx, by - ry, bx + rx, by + ry)
        s.outline(bm, OUT)
        s.sh(bm, GRANITE, kl=1, kd=1, kdd=0, ol=False)
    for (tx, ty) in ((IX - 26, G - 6), (IX + 26, G - 5)):
        tm = O(tx, ty, 3)
        s.outline(tm, '#1e3a1e')
        s.sh(tm, LEAF, kl=1, kd=1, kdd=0, ol=False)
    stairs = P([(IX - 3, G - 13), (IX + 3, G - 13), (IX + 5, IY + 4), (IX - 5, IY + 4)])
    s.put(stairs, MB['l'])
    for yy in range(G - 12, IY + 4, 2):
        s.put(R(0, yy, W - 1, yy) & stairs, MB['d'])
    s.outline(stairs, MB['o'])
    # platform
    ptop = R(IX - 22, G - 21, IX + 22, G - 19)
    pfront = R(IX - 22, G - 18, IX + 22, G - 14)
    s.outline(ptop | pfront, MB['o'])
    s.put(ptop, MB['l'])
    s.sh(pfront, MB, kl=0, kd=1, kdd=0, d=(0, 1), ol=False)
    for k in range(IX - 21, IX + 22, 2):
        s.px(k, G - 17, MB['dd'])
    # main shikhara (behind)
    shikhara(s, IX, G - 26, G - 52, 9, MB, ribs=2)
    s.put(R(IX, G - 62, IX, G - 54), '#7a5a40')
    flag = P([(IX + 1, G - 62), (IX + 9, G - 59), (IX + 1, G - 56)])
    s.sh(flag, ramp('#ff7a1e'), kl=1, kd=1, kdd=0, d=(0, 1))
    # side shrines
    for cx in (IX - 15, IX + 15):
        base = R(cx - 5, G - 30, cx + 5, G - 21)
        s.outline(base, MB['o'])
        s.sh(base, MB, kl=1, kd=2, kdd=1, ol=False)
        s.put(R(cx - 2, G - 27, cx + 2, G - 21), '#7a7e9c')
        shikhara(s, cx, G - 30, G - 42, 5, MB, ribs=1)
    # mandapa
    md = R(IX - 8, G - 30, IX + 8, G - 21)
    s.outline(md, MB['o'])
    s.sh(md, MB, kl=1, kd=2, kdd=1, ol=False)
    for i in range(3):
        st = R(IX - 9 + i * 2, G - 33 - i * 2, IX + 9 - i * 2, G - 31 - i * 2)
        s.outline(st, MB['o'])
        s.sh(st, MB, kl=1, kd=1, kdd=0, d=(0, 1), ol=False)
    door = P(arch_pts(IX - 3, IX + 3, G - 26, G - 21, 3))
    s.put(door, '#6a6e90')
    s.put(dilate(door) & md & ~door, GOLD['b'])


# ------------------------------------------------------------------ QUTB SHAHI
def ic_qutb(s):
    G = IY - 2
    gr = E(IX - 30, IY - 8, IX + 30, IY + 6)
    s.outline(gr, '#1e3a1e')
    s.sh(gr, pal('#b8e890', '#80cc62', '#62b04e', None, '#1e3a1e'), kl=1, kd=2, kdd=0, d=(0, 1), ol=False)
    # back corner minarets
    for cx in (IX - 13, IX + 13):
        m = R(cx - 1, G - 41, cx + 1, G - 30) | onion(cx, G - 46, G - 40, 2.2, pinch=0.8, p=1.0)
        s.outline(m, OUT)
        s.sh(m, pal('#e2d8c6', '#c4b8a2', '#a09078', None, OUT), kl=0, kd=1, kdd=0, ol=False)
    # platform
    ptop = R(IX - 25, G - 10, IX + 25, G - 8)
    pfr = R(IX - 25, G - 7, IX + 25, G)
    s.outline(ptop | pfr, OUT)
    s.put(ptop, QS['l'])
    s.sh(pfr, QS, kl=0, kd=1, kdd=1, d=(0, 1), ol=False)
    for k in range(IX - 23, IX + 22, 5):
        a = P(arch_pts(k, k + 3, G - 4, G - 1, 2))
        s.put(a, INNER[0])
        s.put(a & ~shift(a, 0, 1), INNER[1])
    # cube
    face = R(IX - 15, G - 31, IX + 15, G - 11)
    rtop = R(IX - 15, G - 34, IX + 15, G - 32)
    s.outline(face | rtop, OUT)
    s.put(face, QS['b'])
    s.put(rtop, QS['l'])
    s.put(face & ~shift(face, -2, 0), QS['d'])
    s.put(face & ~shift(face, 1, 0), QS['l'])
    for k in range(IX - 14, IX + 15, 3):
        s.px(k, G - 35, QS['b'])
        s.px(k, G - 36, OUT)
    big = P(arch_pts(IX - 5, IX + 5, G - 20, G - 11, 6))
    s.put(dilate(big) & face & ~big, QS['dd'])
    s.put(big, INNER[0])
    s.put(big & ~shift(big, 0, 2), INNER[1])
    for cx in (IX - 11, IX + 11):
        for (y0, y1, h) in ((G - 19, G - 12, 3), (G - 28, G - 23, 2)):
            a = P(arch_pts(cx - 2, cx + 2, y0 + h, y1, h))
            s.put(a, INNER[0])
            s.put(a & ~shift(a, 0, 1), INNER[1])
    a = P(arch_pts(IX - 2, IX + 2, G - 25, G - 22, 2))
    s.put(a, INNER[0])
    s.put(R(IX - 15, G - 21, IX + 15, G - 21), QS['dd'])
    # drum + dome
    drum = R(IX - 10, G - 38, IX + 10, G - 34)
    s.outline(drum, OUT)
    s.sh(drum, QS, kl=1, kd=2, kdd=1, d=(1, 0), ol=False)
    pet = NONE()
    for k in range(IX - 10, IX + 11, 3):
        pet |= P([(k - 1, G - 37), (k + 2, G - 37), (k + 0.5, G - 41)])
    dome = onion(IX, G - 60, G - 37, 12.5, pinch=0.78, p=1.05)
    s.outline(dome | pet, OUT)
    s.sh(dome, QS, kl=2, kd=4, kdd=1, ol=False)
    s.dith(dome & ~shift(dome, -6, 0), QS['dd'], 0.3)
    s.sh(pet, QS, kl=0, kd=1, kdd=0, ol=False)
    s.put(R(IX, G - 64, IX, G - 60), QS['dd'])
    s.px(IX, G - 62, GOLD['b'])
    # front corner minarets
    for cx in (IX - 17, IX + 17):
        sh_ = R(cx - 2, G - 38, cx + 2, G - 11)
        dm = onion(cx, G - 45, G - 37, 2.8, pinch=0.8, p=1.0)
        s.outline(sh_ | dm, OUT)
        s.sh(sh_, QS, kl=1, kd=2, kdd=0, d=(1, 0), ol=False)
        s.sh(dm, QS, kl=1, kd=1, kdd=0, ol=False)
        ring_balcony(s, cx, G - 33, 3, QS)
        ring_balcony(s, cx, G - 22, 3, QS)


# ------------------------------------------------------------------ DURGAM CHERUVU BRIDGE
def ic_durgam(s):
    """Cable-stayed bridge; deck sits at the bottom so the pad point is on the bridge."""
    G = IY + 11
    for (bx, by, rx, ry) in ((IX - 29, IY + 1, 4, 3), (IX + 29, IY + 1, 4, 3), (IX - 25, IY + 3, 2, 2)):
        bm = E(bx - rx, by - ry, bx + rx, by + ry)
        s.outline(bm, OUT)
        s.sh(bm, GRANITE, kl=1, kd=1, kdd=1, ol=False)
    deck_top = R(IX - 31, G - 17, IX + 31, G - 15)
    deck_fr = R(IX - 31, G - 14, IX + 31, G - 12)
    pyl = [IX - 13, IX + 13]
    for px_ in pyl:
        for k in range(4):
            for sg in (-1, 1):
                s.put(L([(px_, G - 48 + k * 4), (px_ + sg * (5 + k * 4), G - 18)]), '#e8f0fa' if k % 2 else '#d0dcea')
    s.outline(deck_top | deck_fr, OUT)
    s.put(deck_top, '#b8bcc8')
    s.put(R(IX - 31, G - 17, IX + 31, G - 17), '#d8dce4')
    for k in range(IX - 29, IX + 30, 6):
        s.put(R(k, G - 16, k + 2, G - 16), '#ffffff')
    s.sh(deck_fr, WH, kl=0, kd=1, kdd=0, d=(0, 1), ol=False)
    for k in range(IX - 31, IX + 32, 3):
        s.px(k, G - 18, '#ffffff')
    s.put(R(IX - 31, G - 19, IX + 31, G - 19), '#ffffff')
    for px_ in pyl:
        col = R(px_ - 2, G - 50, px_ + 2, G - 3)
        s.outline(col, OUT)
        s.sh(col, WH, kl=1, kd=2, kdd=0, d=(1, 0), ol=False)
        s.put(R(px_ - 2, G - 50, px_ + 2, G - 49), '#ffffff')


# ------------------------------------------------------------------ HITEC CITY
def tower(s, x0, x1, top, base, p, roofc='#e8eef6'):
    face = R(x0, top, x1, base)
    rf = R(x0, top - 2, x1, top - 1)
    s.outline(face | rf, OUT)
    s.sh(face, p, kl=1, kd=2, kdd=1, d=(1, 0), ol=False)
    s.put(rf, roofc)
    for yy in range(top + 2, base, 3):
        s.put(R(x0 + 1, yy, x1 - 2, yy), p['l'])
    for xx in range(x0 + 3, x1 - 1, 3):
        s.put(R(xx, top + 1, xx, base) & face, p['d'])


def ic_hitec(s):
    plaza(s, 28, 7, p=pal('#ffffff', '#e4e8ee', '#c4cad4', '#a4aab8', '#3a3e48'))
    G = IY - 2
    tower(s, IX + 6, IX + 20, G - 56, G - 6, TEAL)
    s.put(R(IX + 13, G - 62, IX + 13, G - 59), '#4a4e60')
    s.px(IX + 13, G - 63, '#ff4040')
    tower(s, IX - 24, IX - 13, G - 40, G - 4, pal('#e0e8fa', '#a8bce8', '#8aa0d4', '#6a80b8', '#2a3a68'))
    # Cyber Towers drum
    rx, ry, top = 15, 4, G - 30
    body = R(IX - rx, top, IX + rx, G)
    s.outline(body | E(IX - rx, top - ry, IX + rx, top + ry) | E(IX - rx, G - ry, IX + rx, G + ry), OUT)
    for x in range(IX - rx, IX + rx + 1):
        u = (x - IX) / rx
        lv = int(min(4, max(0, (u + 1) / 2 * 4.2)))
        col = ['#dcf2ff', '#a8daf6', '#8ccaf2', '#5aa6e2', '#3d84c8'][lv]
        yb = G + int(ry * math.sqrt(max(0, 1 - u * u)))
        yt = top + int(ry * math.sqrt(max(0, 1 - u * u)))
        s.put(R(x, yt, x, yb), col)
        for k in range(1, 9):
            yy = yt + k * 3
            if yy < yb:
                s.px(x, yy, '#ffffff' if lv < 3 else '#a8d0ee')
    rf = E(IX - rx, top - ry, IX + rx, top + ry)
    s.put(rf, '#eef2f8')
    s.put(E(IX - rx + 3, top - ry + 1, IX + rx - 3, top + ry - 1), '#c8d2e0')
    dome = E(IX - 8, top - 10, IX + 8, top + 4) & R(0, 0, W - 1, top)
    s.outline(dome, OUT)
    s.sh(dome, GLS, kl=1, kd=2, kdd=0, ol=False)
    for k in (-4, 0, 4):
        s.put(L([(IX, top - 9), (IX + k * 1.7, top)]) & dome, '#ffffff')
    for tx in (IX - 27, IX + 26):
        tm = O(tx, G - 3, 3)
        s.outline(tm, '#1e3a1e')
        s.sh(tm, LEAF, kl=1, kd=1, kdd=0, ol=False)


# ------------------------------------------------------------------ SHILPARAMAM
def ic_shilparamam(s):
    G = IY - 2
    gr = E(IX - 31, IY - 8, IX + 31, IY + 6)
    s.outline(gr, '#4a2e18')
    s.sh(gr, pal('#f6c89a', '#e0a070', '#c07a4c', None, '#4a2e18'), kl=1, kd=2, kdd=0, d=(0, 1), ol=False)
    # huts
    for hx, flip in ((IX - 23, False), (IX + 23, True)):
        wall = R(hx - 7, G - 12, hx + 7, G)
        roof = P([(hx - 10, G - 11), (hx, G - 24), (hx + 10, G - 11)])
        s.outline(wall | roof, OUT)
        s.sh(wall, pal('#fad69a', '#eab468', '#c88c48', '#a06c34', OUT), kl=1, kd=2, kdd=0, ol=False)
        for x in range(hx - 6, hx + 7):
            s.px(x, G - 8 + abs((x % 4) - 2) - 1, '#fffaf0')
        s.put(P(arch_pts(hx - 2, hx + 2, G - 4, G, 2)), '#4a2e1e')
        s.sh(roof, pal('#fae49a', '#e2bc62', '#ba9242', '#926e2e', OUT), kl=1, kd=2, kdd=1, ol=False)
        for k in range(-3, 4):
            s.put(L([(hx, G - 22), (hx + k * 3, G - 12)]) & roof & ~(roof & ~shift(roof, -1, -1)), '#ba9242')
    # gate
    op = P(arch_pts(IX - 7, IX + 7, G - 16, G + 1, 8))
    gate = R(IX - 13, G - 32, IX + 13, G) & ~op
    lint = R(IX - 15, G - 35, IX + 15, G - 32)
    cht = R(IX - 9, G - 38, IX + 9, G - 36)
    cols = R(IX - 8, G - 44, IX - 7, G - 39) | R(IX - 3, G - 44, IX - 2, G - 39) | R(IX + 2, G - 44, IX + 3, G - 39) | R(IX + 7, G - 44, IX + 8, G - 39)
    cap = R(IX - 10, G - 46, IX + 10, G - 45)
    dome = onion(IX, G - 59, G - 45, 9, pinch=0.58, p=0.75)
    U = gate | lint | cht | cols | cap | dome
    s.outline(U, OUT)
    s.sh(gate, BRK, kl=1, kd=2, kdd=1, ol=False)
    s.put(dilate(op) & gate, '#fffaf0')
    for x0 in (IX - 12, IX + 8):
        for y in range(G - 30, G - 1):
            s.px(x0 + 2 + abs((y % 6) - 3) - 1, y, '#fffaf0')
    for k in range(IX - 12, IX + 12, 4):
        s.put(P([(k, G - 25), (k + 2, G - 29), (k + 4, G - 25)]) & ~P([(k + 1, G - 25), (k + 2, G - 27), (k + 3, G - 25)]) & gate, '#fffaf0')
    for m in (lint, cht, cols, cap):
        s.sh(m, CRM, kl=1, kd=1, kdd=0, d=(0, 1), ol=False)
    s.put(R(IX - 6, G - 44, IX + 6, G - 39) & ~cols, '#8a5a3a')
    s.sh(dome, CRM, kl=2, kd=3, kdd=1, ol=False)
    s.put(R(IX, G - 64, IX, G - 59), '#5a3a20')
    fl = P([(IX + 1, G - 64), (IX + 8, G - 62), (IX + 1, G - 60)])
    s.sh(fl, ramp('#ff7a1e'), kl=1, kd=1, kdd=0, d=(0, 1))
    # bunting
    for (p0, p1) in (((IX - 22, G - 22), (IX - 13, G - 30)), ((IX + 13, G - 30), (IX + 22, G - 22))):
        pts = curve(p0, p1, 3)
        s.put(L(pts), '#5a4030')
        for i, (x, y) in enumerate(pts[1::2]):
            s.put(R(x, y + 1, x, y + 2), ['#ff4a5a', '#ffc828', '#3ac86a', '#3a8cf0'][i % 4])


# ------------------------------------------------------------------ FILM CITY
def ic_ramoji(s):
    pl = E(IX - 30, IY - 8, IX + 30, IY + 6)
    s.outline(pl, OUT)
    s.put(pl, '#f8e6c4')
    for yy in range(IY - 7, IY + 6, 3):
        for xx in range(IX - 30 + (yy // 3 % 2) * 3, IX + 31, 6):
            s.put(R(xx, yy, xx + 2, yy + 2) & pl, '#f0b48c')
    G = IY - 2
    # side towers
    for cx in (IX - 19, IX + 19):
        tw = R(cx - 4, G - 30, cx + 4, G)
        dm = onion(cx, G - 42, G - 29, 5, pinch=0.8, p=1.15)
        s.outline(tw | dm, OUT)
        s.sh(tw, PNK, kl=1, kd=2, kdd=1, d=(1, 0), ol=False)
        s.sh(dm, pal('#ffffff', '#f4f0f8', '#d0cce0', '#b0aac8', OUT), kl=1, kd=2, kdd=1, ol=False)
        s.put(R(cx, G - 45, cx, G - 42), GOLD['d'])
        w_ = P(arch_pts(cx - 2, cx + 2, G - 20, G - 14, 2))
        s.put(w_, '#58c0d0')
        s.put(w_ & ~shift(w_, 1, 1), '#3a90b0')
    body = R(IX - 15, G - 24, IX + 15, G)
    mer = NONE()
    for k in range(IX - 15, IX + 15, 4):
        mer |= R(k, G - 27, k + 2, G - 25)
    drum = R(IX - 9, G - 31, IX + 9, G - 25)
    dome = onion(IX, G - 58, G - 30, 13, pinch=0.8, p=1.15)
    s.outline(body | mer | drum | dome, OUT)
    s.sh(body, PNK, kl=1, kd=2, kdd=1, ol=False)
    s.sh(mer, PNK, kl=0, kd=1, kdd=0, ol=False)
    s.sh(drum, pal('#ffffff', '#f4f0f8', '#d0cce0', None, OUT), kl=1, kd=1, kdd=0, d=(1, 0), ol=False)
    s.sh(dome, GOLD, kl=2, kd=5, kdd=1, ol=False)
    s.put(R(IX, G - 62, IX, G - 58), GOLD['dd'])
    s.px(IX, G - 63, GOLD['b'])
    door = P(arch_pts(IX - 5, IX + 5, G - 10, G, 5))
    s.put(dilate(door) & body & ~door, GOLD['b'])
    s.put(door, '#5a2848')
    s.put(door & ~shift(door, 0, 2), '#3c1830')
    for wx in (IX - 12, IX + 8):
        w_ = P(arch_pts(wx, wx + 4, G - 17, G - 11, 3))
        s.put(w_, '#58c0d0')
        s.put(w_ & ~shift(w_, 1, 1), '#3a90b0')
    s.put(R(IX - 15, G - 21, IX + 15, G - 21), PNK['l'])
    # camera on tripod
    cx, cy = IX + 27, G - 9
    for p1 in ((cx - 4, IY + 3), (cx + 3, IY + 3), (cx, IY + 4)):
        s.put(L([(cx, cy + 4), p1]), '#2a2a34')
    cam = R(cx - 4, cy - 2, cx + 3, cy + 3) | O(cx - 2, cy - 4, 2) | O(cx + 2, cy - 4, 2) | R(cx - 7, cy - 1, cx - 5, cy + 2)
    s.outline(cam, '#0c0c10')
    s.sh(cam, IRON, kl=1, kd=1, kdd=0, ol=False)
    s.px(cx + 2, cy - 1, '#ff3a3a')


ICONS = {'charminar': ic_charminar, 'tankbund': ic_tankbund, 'birla': ic_birla, 'qutb': ic_qutb,
         'durgam': ic_durgam, 'hitec': ic_hitec, 'shilparamam': ic_shilparamam, 'ramoji': ic_ramoji}


def icon_image(fn):
    s = Scene(transparent=True)
    fn(s)
    return s.image().crop(CROP)
