"""Scenes 10-20 for the Hyderabad game (same style/pipeline as scenes 01-09)."""
import math
import random

import numpy as np

from pxlib import *
from px2 import *

ALM = pal('#f2f6fc', '#c4cede', '#9aa6ba', '#7a879e', '#2e3646')
CLOTH = pal('#ffffff', '#f6f2ea', '#ddd6c8', None, '#8a8070')


# ================================================================== 10 / 19  HOME
def _window(s, x0, y0, x1, y1, evening=False, frame=pal('#6ac49a', '#3f9a6e', '#2e7854', '#225e42', '#123424')):
    """Iron-grill window with mosquito mesh. Returns (inner mask, redraw-view fn)."""
    inner = R(x0 + 5, y0 + 5, x1 - 5, y1 - 5)
    grill = NONE()
    for gx in range(x0 + 12, x1 - 6, 9):
        grill |= R(gx, y0 + 5, gx, y1 - 5)
    grill |= R(x0 + 5, (y0 + y1) // 2, x1 - 5, (y0 + y1) // 2)
    mid = (x0 + x1) // 2
    grill |= R(mid - 1, y0 + 5, mid + 1, y1 - 5)

    def view():
        ix0, iy0, ix1, iy1 = x0 + 5, y0 + 5, x1 - 5, y1 - 5
        if evening:
            cols = ['#5a4a98', '#a8549a', '#e8708a', '#f8a070', '#fcc878']
        else:
            cols = ['#8ac8f8', '#a6d6fa', '#c4e6fc', '#d8f0fe']
        sub = Scene()
        sub.sky(cols, iy0, iy1 + 1)
        s.a[inner] = sub.a[inner]
        bw = R(ix0, iy0 + 30, ix0 + 34, iy1)
        bc = pal('#ffd8de', '#f4b8c4', '#d896a8') if not evening else pal('#a87a98', '#8a5a80', '#6a4466')
        s.sh(bw & inner, bc, kl=1, kd=2, kdd=0, d=(1, 0), ol=False)
        for wy in range(iy0 + 36, iy1, 14):
            w_ = R(ix0 + 8, wy, ix0 + 16, wy + 7) & inner
            s.put(w_, '#ffe08a' if evening and wy % 28 < 14 else ('#4a5a80' if not evening else '#3a3050'))
        for c in ((ix1 - 6, iy0 + 6, 9), (ix1 - 16, iy0 + 2, 8), (ix1 - 2, iy0 + 18, 8)):
            lm = O(*c) & inner
            s.sh(lm, LEAF if not evening else pal('#5a7a5a', '#3a5a48', '#2a4438'), kl=1, kd=2, kdd=0, ol=False)
        mesh = inner & ~grill & (((np.indices((H, W))[0] + np.indices((H, W))[1]) % 2) == 0)
        sub2 = s.a[mesh][:, :3].astype(float) * 0.86
        s.a[mesh, :3] = sub2.astype(np.uint8)
        s.put(grill & inner, frame['d'])
        s.put(grill & inner & ~shift(grill, 1, 0), frame['b'])

    s.shadow(R(x0 + 2, y0 + 3, x1 + 3, y1 + 4))
    s.sh(R(x0, y0, x1, y1) & ~inner, frame, kl=1, kd=1, kdd=0)
    s.outline(inner, frame['dd'])
    view()
    s.sh(R(x0 - 5, y1 + 1, x1 + 5, y1 + 5), STONE, kl=1, kd=1, kdd=0, d=(0, 1))
    return inner, view


def _curtain(s, x0, x1, y0, y1, c0, c1, seed=0):
    rng = random.Random(seed)
    s.put(R(x0 - 6, y0 - 2, x1 + 100, y0 - 1), '#5a4030')
    m = R(x0, y0, x1, y1)
    for x in range(x0, x1 + 1):
        m[y1 + 1 + (x % 4 == 0):y1 + 3, x] = True
    s.put(m, c0)
    for x in range(x0 + 2, x1, 4):
        s.put(R(x, y0, x + 1, y1) & m, c1)
    s.put(m & ~shift(m, -2, 0), mix(c1, '#000000', 0.2))
    s.outline(m, mix(c1, '#000000', 0.55))
    for _ in range(10):
        s.px(rng.randint(x0 + 1, x1 - 1), rng.randint(y0 + 4, y1 - 2), '#fff4c0')


def _puja(s, x0, y0, lit=True):
    WD = pal('#c88a50', '#9a5e30', '#7a4420', '#5e321a', '#24140a')
    back = R(x0 + 4, y0 + 14, x0 + 44, y0 + 56) | P(arch_pts(x0 + 4, x0 + 44, y0 + 22, y0 + 56, 14))
    s.shadow(shift(back, 2, 2) & ~back)
    s.sh(back, WD, kl=1, kd=2, kdd=1)
    dome = P(onion_pts(x0 + 24, y0 - 4, y0 + 10, 9, pinch=0.7, p=0.9))
    s.sh(dome, WD, kl=1, kd=2, kdd=1)
    s.sh(O(x0 + 24, y0 - 6, 1), GOLD, kl=0, kd=0, kdd=0)
    niche = R(x0 + 8, y0 + 22, x0 + 40, y0 + 54) | P(arch_pts(x0 + 8, x0 + 40, y0 + 26, y0 + 54, 10))
    s.put(niche, '#7a2a2a')
    s.put(niche & ~shift(niche, 0, 3), '#5a1a1e')
    for fx in (x0 + 10, x0 + 25):
        fm = R(fx, y0 + 30, fx + 12, y0 + 48)
        s.sh(fm, GOLD, kl=1, kd=1, kdd=0)
        im = R(fx + 2, y0 + 32, fx + 10, y0 + 46)
        s.put(im, '#f08a30')
        s.put(im & R(0, y0 + 40, W - 1, H - 1), '#d84a3a')
        s.put(O(fx + 6, y0 + 37, 2), '#ffe070')
        s.put(R(fx + 5, y0 + 40, fx + 7, y0 + 45), '#3a6ad0')
    pts = curve((x0 + 8, y0 + 24), (x0 + 40, y0 + 24), 7)
    for i, (gx, gy) in enumerate(pts[::2]):
        s.px(gx, gy, MARI[i % 3])
        s.px(gx, gy + 1, MARI[(i + 1) % 3])
    for gx in (x0 + 8, x0 + 40):
        for gy in range(y0 + 24, y0 + 40, 2):
            s.px(gx, gy, MARI[(gy // 2) % 3])
    s.sh(R(x0, y0 + 56, x0 + 48, y0 + 60), WD, kl=1, kd=1, kdd=0, d=(0, 1))
    dx, dy = x0 + 20, y0 + 55
    s.sh(E(dx - 4, dy - 3, dx + 4, dy + 1), GOLD, kl=1, kd=1, kdd=0)
    if lit:
        glow(s, dx, dy - 7, 10, '#ffd060', 0.45)
        fl = P([(dx - 2, dy - 3), (dx + 2, dy - 3), (dx, dy - 10)])
        s.put(fl, '#ffb020')
        s.put(R(dx, dy - 6, dx, dy - 4), '#fff8c0')
    s.put(L([(x0 + 34, dy), (x0 + 36, dy - 14)]), '#6a3a20')
    for k, (sx, sy) in enumerate([(x0 + 36, dy - 16), (x0 + 37, dy - 18), (x0 + 36, dy - 20), (x0 + 35, dy - 22), (x0 + 36, dy - 25)]):
        s.px(sx, sy, '#d8d0d8')
    s.px(x0 + 36, dy - 14, '#ff6030')


MARI = ['#ff9a1e', '#ffc81e', '#ff7a1e']
FLOWER = ['#ff5a7a', '#ffd23c', '#ff8a3c', '#ffffff', '#c070f0']


def _almirah(s, x0, y0, x1, old=False):
    p = ALM if not old else pal('#e2e6ea', '#b4bcc6', '#8e98a6', '#727c8c', '#2e3442')
    s.shadow(R(x1 + 1, y0 + 6, x1 + 6, FL - 1))
    s.shadow(E(x0 - 2, FL - 2, x1 + 10, FL + 5))
    body = R(x0, y0 + 4, x1, FL - 4)
    s.sh(body, p, kl=1, kd=3, kdd=1, d=(1, 0))
    s.sh(R(x0 - 2, y0, x1 + 2, y0 + 4), p, kl=1, kd=1, kdd=0, d=(0, 1))
    s.sh(R(x0 + 2, FL - 4, x0 + 5, FL) | R(x1 - 5, FL - 4, x1 - 2, FL), p, kl=0, kd=1, kdd=0)
    mid = (x0 + x1) // 2
    s.put(R(mid, y0 + 6, mid, FL - 6), p['dd'])
    for dx0, dx1 in ((x0 + 4, mid - 4), (mid + 4, x1 - 4)):
        pn = R(dx0, y0 + 12, dx1, FL - 12)
        s.put(pn & ~shift(pn, 1, 1), p['l'])
        s.put(pn & ~shift(pn, -1, -1), p['d'])
    for hx in (mid - 4, mid + 3):
        s.sh(R(hx, y0 + 50, hx + 1, y0 + 70), pal('#ffffff', '#d8dee8', '#6a7488', None, '#2a3040'), kl=1, kd=1, kdd=0)
    s.put(R(mid - 1, y0 + 42, mid + 1, y0 + 44), '#3a3a44')
    s.px(mid, y0 + 43, '#d8c060')
    s.put(R(x0 + 8, y0 + 10, x0 + 9, FL - 14), mix(p['l'], '#ffffff', 0.5))
    if old:
        s.put(L([(x1 - 14, y0 + 80), (x1 - 8, y0 + 86)]), p['dd'])
        s.dith(R(x0, FL - 14, x1, FL - 5), '#9a7a5a', 0.25)
    # suitcase + bundle on top
    SC = pal('#c86858', '#9a3c34', '#7a2c28', '#5a2020', '#2a0e0e') if not old else pal('#a07868', '#7a5448', '#5e3e36', '#46302a', '#20120e')
    sm = R(x0 + 4, y0 - 16, x1 - 10, y0 - 1)
    s.sh(sm, SC, kl=1, kd=2, kdd=1)
    for k in range(x0 + 10, x1 - 12, 8):
        s.put(R(k, y0 - 15, k, y0 - 2), SC['d'])
    s.put(R((x0 + x1) // 2 - 6, y0 - 19, (x0 + x1) // 2 + 2, y0 - 17) & ~R((x0 + x1) // 2 - 4, y0 - 18, (x0 + x1) // 2, y0 - 18), SC['o'])
    bm = E(x1 - 18, y0 - 12, x1 + 2, y0 + 1)
    s.sh(bm, pal('#f8e0a0', '#e8b860', '#c08a40', '#a07030', '#4a3010'), kl=1, kd=2, kdd=1)
    s.put(R(x1 - 12, y0 - 11, x1 - 11, y0) & bm, '#c03838')


def _tv_stand(s, x0, x1):
    s.shadow(E(x0 - 2, FL - 3, x1 + 10, FL + 5))
    st = R(x0, 146, x1, FL - 1)
    s.sh(st, WOOD, kl=1, kd=2, kdd=1)
    sh_ = R(x0 + 5, 158, x0 + 40, FL - 6)
    s.put(sh_, '#3e2616')
    s.put(sh_ & ~shift(sh_, 0, 2), '#2a180c')
    s.sh(R(x0 + 8, 168, x0 + 34, FL - 6), pal('#4a4a52', '#2a2a30', '#18181c', None, '#0a0a0c'), kl=1, kd=1, kdd=0)
    s.px(x0 + 30, 171, '#40f070')
    s.put(R(x0 + 10, 160, x0 + 30, 163), '#c8b080')
    dr = R(x0 + 46, 154, x1 - 5, FL - 6)
    s.put(dr & ~shift(dr, 1, 1), WOOD['l'])
    s.put(dr & ~shift(dr, -1, -1), WOOD['dd'])
    s.put(R((x0 + 46 + x1 - 5) // 2 - 1, 164, (x0 + 46 + x1 - 5) // 2 + 1, 165), GOLD['b'])
    # TV
    tx0, tx1 = x0 + 16, x1 - 16
    s.sh(R((tx0 + tx1) // 2 - 10, 140, (tx0 + tx1) // 2 + 10, 145), pal('#5a5a64', '#34343c', '#202026', None, '#0c0c10'), kl=1, kd=1, kdd=0)
    tv = R(tx0, 106, tx1, 139)
    s.sh(tv, pal('#5a5a66', '#26262e', '#18181e', '#101014', '#060608'), kl=1, kd=1, kdd=0)
    scr = R(tx0 + 3, 109, tx1 - 3, 135)
    s.put(scr, '#1e2c4a')
    s.put(scr & ~shift(scr, 0, -3), '#18223a')
    for k in range(3):
        band = P([(tx0 + 6 + k * 6, 135), (tx0 + 10 + k * 6, 135), (tx0 + 30 + k * 6, 109), (tx0 + 26 + k * 6, 109)]) & scr
        lighten(s, band, 0.12 if k else 0.2)
    s.px(tx1 - 4, 137, '#ff4040')
    # lace cloth on the stand
    lc = R(x0 + 2, 146, x1 - 2, 149)
    for k in range(x0 + 3, x1 - 2, 4):
        lc |= O(k + 1, 150, 1)
    s.put(lc, '#fffaf2')
    s.outline(lc, '#c8bca8')
    for k in range(x0 + 4, x1 - 3, 4):
        s.px(k, 147, '#d8ccb8')


def _side_table(s, x0, x1, top=152):
    s.shadow(E(x0, FL - 2, x1 + 10, FL + 4))
    tt = P([(x0 + 3, top), (x1 - 3, top), (x1, top + 6), (x0, top + 6)])
    s.sh(tt, WOOD, kl=1, kd=1, kdd=1, d=(0, 1))
    s.sh(R(x0, top + 7, x1, top + 9), WOOD, kl=0, kd=1, kdd=0, d=(0, 1))
    for lx in (x0 + 2, x1 - 4):
        s.sh(R(lx, top + 10, lx + 2, FL), WOOD, kl=0, kd=1, kdd=0, d=(1, 0))
    s.put(R(x0 + 3, FL - 10, x1 - 3, FL - 9), WOOD['d'])


def _photo(s, x0, y0, x1, y1, bg, figs, frame='#3a2414', sepia=False):
    s.shadow(R(x0 + 2, y0 + 2, x1 + 2, y1 + 2))
    s.sh(R(x0, y0, x1, y1), pal(mix(frame, '#ffffff', 0.35), frame, mix(frame, '#000000', 0.3), None, '#140a04'), kl=1, kd=1, kdd=0)
    inner = R(x0 + 2, y0 + 2, x1 - 2, y1 - 2)
    s.put(inner, bg)
    s.put(inner & R(0, (y0 + y1) // 2 + 2, W - 1, H - 1), mix(bg, '#000000', 0.12))
    for fx, fy, c, hh in figs:
        s.put(P([(fx - 2, fy), (fx + 2, fy), (fx + 3, fy + hh), (fx - 3, fy + hh)]) & inner, c)
        s.put(O(fx, fy - 2, 2), '#c08a64' if not sepia else '#c8a882')
        s.put(R(fx - 1, fy - 4, fx + 1, fy - 4) | R(fx - 2, fy - 3, fx - 2, fy - 3), '#2a1a14' if not sepia else '#5a4430')
    s.put(L([((x0 + x1) // 2, y0 - 6), (x0 + 2, y0)]) | L([((x0 + x1) // 2, y0 - 6), (x1 - 2, y0)]), '#5a4a40')
    s.px((x0 + x1) // 2, y0 - 6, '#3a3a3a')


def _sofa(s, x0, x1):
    SO = pal('#b8705e', '#8e4c42', '#703832', '#562a28', '#2a1212')
    s.shadow(E(x0 - 2, FL - 4, x1 + 12, FL + 5))
    back = R(x0 + 8, 118, x1 - 8, 150)
    s.sh(back, SO, kl=1, kd=2, kdd=1)
    for k in range(3):
        cx0 = x0 + 12 + k * (x1 - x0 - 24) // 3
        cx1 = cx0 + (x1 - x0 - 24) // 3 - 2
        cm = R(cx0, 122, cx1, 148)
        s.put(cm & ~shift(cm, 0, 2), SO['dd'])
        s.put(cm & ~shift(cm, 1, 1), SO['l'])
        seat = R(cx0, 148, cx1, 160)
        s.sh(seat, SO, kl=1, kd=2, kdd=1, d=(0, 1))
        if k == 1:
            s.put(O(cx0 + 18, 154, 3), '#a85a4a')
            s.outline(O(cx0 + 18, 154, 3), SO['dd'])
    lace = R(x0 + 30, 116, x1 - 30, 128)
    for k in range(x0 + 31, x1 - 30, 4):
        lace |= O(k + 1, 129, 1)
    s.put(lace, '#fffaf2')
    for yy in range(118, 128, 3):
        for k in range(x0 + 32 + (yy % 2) * 2, x1 - 31, 4):
            s.px(k, yy, '#d8ccb8')
    s.outline(lace, '#c8bca8')
    for ax0, ax1 in ((x0, x0 + 10), (x1 - 10, x1)):
        arm = R(ax0, 132, ax1, 166)
        s.sh(arm, SO, kl=1, kd=2, kdd=1)
        s.sh(R(ax0, 130, ax1, 134), WOOD, kl=1, kd=1, kdd=0, d=(0, 1))
    s.sh(R(x0 + 2, 160, x1 - 2, 168), SO, kl=0, kd=2, kdd=1, d=(0, 1))
    for lx in (x0 + 3, x1 - 6):
        s.sh(R(lx, 168, lx + 3, FL - 1), WOOD, kl=0, kd=1, kdd=0, d=(1, 0))
    sh = P([(x1 - 10, 132), (x1 + 1, 132), (x1 + 2, 154), (x1 - 4, 158), (x1 - 10, 150)])
    s.sh(sh, pal('#f8d878', '#e8a840', '#c08030', None, '#4a2a10'), kl=1, kd=1, kdd=0)
    for yy in range(136, 154, 4):
        s.put(R(x1 - 9, yy, x1, yy) & sh, '#c03838')


def _calendar(s, x0, y0, pic='hill'):
    s.px(x0 + 11, y0 - 4, '#3a3a3a')
    s.put(L([(x0 + 11, y0 - 4), (x0 + 3, y0)]) | L([(x0 + 11, y0 - 4), (x0 + 19, y0)]), '#5a5050')
    s.shadow(R(x0 + 1, y0 + 1, x0 + 23, y0 + 38))
    s.put(R(x0, y0, x0 + 22, y0 + 37), '#fffdf6')
    s.outline(R(x0, y0, x0 + 22, y0 + 37), '#8a8478')
    im = R(x0 + 2, y0 + 2, x0 + 20, y0 + 17)
    if pic == 'hill':
        s.put(im, '#8ac8f8')
        s.put(im & E(x0 - 4, y0 + 10, x0 + 16, y0 + 26), '#5cb84c')
        s.put(im & E(x0 + 8, y0 + 12, x0 + 28, y0 + 26), '#3e9640')
        s.put(O(x0 + 15, y0 + 6, 2), '#fff4a0')
    else:
        s.put(im, '#f8b060')
        s.put(im & R(0, y0 + 12, W - 1, H - 1), '#d86a3a')
        s.put(im & P([(x0 + 6, y0 + 12), (x0 + 11, y0 + 4), (x0 + 16, y0 + 12)]), '#fff2d0')
    for r in range(5):
        for c in range(7):
            cx, cy = x0 + 2 + c * 3, y0 + 21 + r * 3
            s.put(R(cx, cy, cx + 1, cy + 1), '#c8c4bc' if (r, c) != (2, 4) else '#e04040')


def _rug(s, x0, x1, y0, y1, c0, c1):
    m = P([(x0 + 6, y0), (x1 - 6, y0), (x1, y1), (x0, y1)])
    s.put(m, c0)
    for k in range(3):
        yy = y0 + 2 + k * (y1 - y0 - 3) // 2
        s.put(R(0, yy, W - 1, yy + 1) & m, c1)
    s.put(m & ~shift(m, 0, -1), mix(c0, '#000000', 0.25))
    for x in range(x0 + 1, x1, 3):
        s.px(x, y1 + 1, mix(c0, '#ffffff', 0.4))


def home(aged=False):
    s = Scene(10 if not aged else 19)
    wall = pal('#e4f4ec', '#cfe6dc', '#b6d2c6') if not aged else pal('#e6e4d2', '#d6d2bc', '#bcb8a0')
    room(s, wall, floor=('#efe2c8', '#e6d6b8', '#c8b494') if not aged else ('#e6d8bc', '#dccdb0', '#bca88a'))
    if aged:
        rng = random.Random(4)
        for cx, cy, r in ((150, 30, 14), (462, 150, 18), (24, 168, 10)):
            s.dith(E(cx - r * 1.4, cy - r, cx + r * 1.4, cy + r), '#c8c0a0', 0.35)
    tube_light(s, 34, 104, 26, lit=aged)
    inner, view = _window(s, 22, 40, 116, 132, evening=aged)
    _curtain(s, 12, 34, 38, 134, '#f6c8a0', '#e89a70', seed=2)
    # money plant in a bottle on the sill
    bt = R(98, 118, 104, 132) | R(100, 114, 102, 118)
    s.sh(bt, pal('#d8f8e0', '#a8e0c0', '#80c0a0', None, '#3a6a50'), kl=1, kd=1, kdd=0)
    for (lx, ly) in ((101, 112), (98, 108), (104, 106), (100, 102), (106, 114), (95, 116), (108, 120), (93, 122)):
        lm = O(lx, ly, 2)
        s.sh(lm, LEAF, kl=1, kd=1, kdd=0)
    s.put(L([(101, 113), (100, 102)]) | L([(102, 116), (108, 121)]) | L([(100, 116), (93, 123)]), '#3e8a3c')
    switchboard(s, 302, 112, 20, 16)
    _puja(s, 330, 58, lit=True)
    _almirah(s, 396, 60, 452, old=aged)
    wall_clock(s, 200, 62, 9, t=(10, 10) if not aged else (6, 35))
    _calendar(s, 132, 54, 'hill' if not aged else 'temple')
    ceiling_fan(s, 268)
    if not aged:
        _rug(s, 150, 250, 184, 200, '#d85a4a', '#f2c040')
        _tv_stand(s, 152, 240)
        _side_table(s, 252, 296)
        ph = P([(264, 151), (282, 151), (284, 155), (262, 155)])
        s.put(ph, '#1c1c24')
        s.put(P([(266, 152), (280, 152), (281, 154), (265, 154)]), '#4a8ad8')
        s.px(267, 152, '#a8d8ff')
        cable = L(curve((284, 153), (306, 128), -6)) | L([(306, 128), (306, 125)])
        s.put(cable, '#2a2a30')
        s.sh(R(303, 125, 309, 131), pal('#ffffff', '#f4f4f4', '#cfcfcf', None, '#5a5a5a'), kl=0, kd=1, kdd=0)
        s.px(306, 128, '#40d070')
        steel_glass(s, 258, 151, 6)
        # sunbeam from the window
        beam = P([(30, FL + 1), (110, FL + 1), (200, H - 1), (92, H - 1)])
        lighten(s, beam, 0.16, '#fff6dc')
        wb = P([(116, 60), (134, 60), (150, 132), (126, 132)])
        lighten(s, wb, 0.10, '#fff6dc')
    else:
        _rug(s, 140, 268, 184, 200, '#8a6a9a', '#d8b860')
        for (x0, y0, x1, y1, bg, figs, sep) in [
                (144, 74, 166, 102, '#d8c8a8', [(151, 86, '#7a5a40', 12), (159, 86, '#a87050', 12)], True),
                (226, 70, 262, 100, '#a8d0f0', [(233, 84, '#d84a4a', 12), (241, 83, '#3a6ad0', 13), (249, 88, '#e8a030', 8), (255, 90, '#40a060', 6)], False),
                (172, 82, 188, 104, '#e8e0f0', [(180, 92, '#2a2a40', 10)], False)]:
            _photo(s, x0, y0, x1, y1, bg, figs, frame='#5a3420' if sep else '#2a2a30', sepia=sep)
        s.put(R(177, 87, 183, 88), '#1a1a28')
        s.px(180, 86, '#1a1a28')
        _sofa(s, 140, 262)
        _side_table(s, 268, 308)
        npm = P([(272, 151), (290, 151), (292, 156), (270, 156)])
        s.put(npm, '#ecebe2')
        for yy in (152, 154):
            s.put(R(274, yy, 288, yy) & npm, '#a8a8a0')
        s.outline(npm, '#8a8a80')
        for gx in (294, 300):
            s.put(E(gx - 3, 150, gx + 2, 154) & ~E(gx - 2, 151, gx + 1, 153), '#2a1c18')
            s.put(E(gx - 2, 151, gx + 1, 153), '#d8e8f0')
        s.put(R(296, 151, 297, 151), '#2a1c18')
        s.put(L([(291, 151), (288, 149)]), '#2a1c18')
        steel_glass(s, 280, 150, 6)
        # evening: dim the room, then bring back the light sources
        tint_all(s, (0.86, 0.76, 0.74))
        view()
        beam = P([(30, FL + 1), (110, FL + 1), (240, H - 1), (120, H - 1)])
        lighten(s, beam, 0.14, '#ffb070')
        wb = P([(116, 60), (140, 60), (170, 132), (130, 132)])
        lighten(s, wb, 0.10, '#ffb070')
        tube_light(s, 34, 104, 26, lit=True)
        lighten(s, E(0, 0, 160, 120), 0.08, '#fff8e0')
        glow(s, 350, 106, 14, '#ffc050', 0.4)
        fl = P([(348, 110), (352, 110), (350, 103)])
        s.put(fl, '#ffb020')
        s.put(R(350, 107, 350, 109), '#fff8c0')
    return s


def home_age60():
    return home(aged=True)


# ================================================================== 11  KIRANA
def _sack(s, x, y, w, h, grain, seed=0, scoop=False):
    rng = random.Random(seed)
    JUTE = pal('#e8c890', '#c8a46a', '#a6804c', '#86643a', '#3e2c14')
    s.shadow(E(x - w // 2 - 2, y - 3, x + w // 2 + 6, y + 3))
    body = P([(x - w // 2 + 3, y - h + 6), (x + w // 2 - 3, y - h + 6), (x + w // 2, y - 6), (x + w // 2 - 3, y),
              (x - w // 2 + 3, y), (x - w // 2, y - 6)])
    s.sh(body, JUTE, kl=1, kd=3, kdd=1)
    for yy in range(y - h + 9, y - 1, 3):
        s.dith(R(0, yy, W - 1, yy) & body, JUTE['d'], 0.5)
    rim = E(x - w // 2 - 1, y - h + 2, x + w // 2 + 1, y - h + 12)
    s.sh(rim, JUTE, kl=1, kd=2, kdd=1, d=(0, 1))
    mound = E(x - w // 2 + 3, y - h - 2, x + w // 2 - 3, y - h + 8) & R(0, 0, W - 1, y - h + 6)
    gp = pal(mix(grain, '#ffffff', 0.45), grain, mix(grain, '#000000', 0.18), None, mix(grain, '#000000', 0.55))
    s.sh(mound | (E(x - w // 2 + 2, y - h + 3, x + w // 2 - 2, y - h + 9)), gp, kl=1, kd=1, kdd=0, ol=False)
    ys, xs = np.nonzero(mound)
    for _ in range(len(xs) // 5):
        i = rng.randrange(len(xs))
        s.px(xs[i], ys[i], gp['d'] if rng.random() < 0.6 else gp['l'])
    if scoop:
        s.sh(P([(x + 2, y - h - 2), (x + 10, y - h - 6), (x + 12, y - h - 2), (x + 6, y - h + 2)]),
             pal('#ffffff', '#c8ccd6', '#8a90a0', None, '#2e3240'), kl=1, kd=1, kdd=0)


def _sachet_strip(s, x, y0, n, c0, c1):
    for i in range(n):
        yy = y0 + i * 7
        m = R(x, yy, x + 6, yy + 5)
        s.put(m, c0 if i % 2 == 0 else c1)
        s.put(R(x, yy, x + 6, yy), mix(c0 if i % 2 == 0 else c1, '#ffffff', 0.45))
        s.px(x + 4, yy + 2, '#ffffff')
        s.put(R(x, yy + 5, x + 6, yy + 5), mix(c0, '#000000', 0.4))
    s.put(R(x + 3, y0 - 3, x + 3, y0 - 1), '#7a7a80')


def _pack(s, x0, y0, x1, y1, c, mark='stripe'):
    p = ramp(c, '#2a1e1a')
    m = R(x0, y0, x1, y1)
    s.sh(m, p, kl=1, kd=1, kdd=0)
    if mark == 'stripe':
        s.put(R(x0 + 1, (y0 + y1) // 2, x1 - 1, (y0 + y1) // 2 + 1) & m, '#fff4e0')
    elif mark == 'dot':
        s.put(O((x0 + x1) // 2, (y0 + y1) // 2, max(1, (y1 - y0) // 4)), '#fff4e0')
    elif mark == 'band':
        s.put(R(x0 + 1, y0 + 1, x1 - 1, y0 + 2), '#fff4e0')


def _chips(s, x, y, c):
    m = P([(x - 5, y - 14), (x + 5, y - 14), (x + 6, y - 7), (x + 5, y), (x - 5, y), (x - 6, y - 7)])
    s.sh(m, ramp(c, '#2a1e1a'), kl=2, kd=2, kdd=1)
    s.put(R(x - 5, y - 14, x + 5, y - 13) | R(x - 5, y - 1, x + 5, y), mix(c, '#000000', 0.25))
    s.put(O(x, y - 7, 2), '#ffe070')


def _scale(s, x, y):
    BR = pal('#fff2b0', '#e0b850', '#b88a30', '#8a6420', '#3a2808')
    s.sh(R(x - 4, y - 4, x + 4, y), BR, kl=1, kd=1, kdd=0)
    s.sh(R(x - 1, y - 26, x + 1, y - 4), BR, kl=0, kd=1, kdd=0, d=(1, 0))
    s.sh(R(x - 20, y - 27, x + 20, y - 26), BR, kl=0, kd=1, kdd=0, d=(0, 1))
    s.sh(P([(x - 2, y - 30), (x + 2, y - 30), (x, y - 26)]), BR, kl=0, kd=1, kdd=0)
    for px_ in (x - 18, x + 18):
        s.put(L([(px_, y - 26), (px_ - 6, y - 10)]) | L([(px_, y - 26), (px_ + 6, y - 10)]), '#6a6060')
        pan = E(px_ - 8, y - 12, px_ + 8, y - 7) & R(0, y - 10, W - 1, H - 1)
        s.sh(pan | R(px_ - 8, y - 11, px_ + 8, y - 10), BR, kl=1, kd=1, kdd=0)
    s.sh(R(x + 26, y - 6, x + 31, y) | R(x + 27, y - 8, x + 30, y - 7), IRON, kl=1, kd=1, kdd=0)
    s.sh(R(x + 33, y - 4, x + 36, y) | R(x + 34, y - 5, x + 35, y - 5), IRON, kl=1, kd=1, kdd=0)


def kirana():
    s = Scene(11)
    rng = random.Random(11)
    FAC = pal('#fff0c0', '#f4d690', '#d8b468', '#b89048', '#4a3818')
    s.sky(SKY_DAY, 0, 40)
    s.put(R(0, 0, W - 1, 30), FAC['b'])
    s.put(R(0, 0, W - 1, 2), FAC['l'])
    # signboard (pictures only, no lettering)
    sb = R(24, 4, 456, 26)
    s.sh(sb, pal('#7ab8ff', '#2a74d8', '#1e58b0', '#18489a', '#0c2050'), kl=1, kd=2, kdd=1)
    s.put(R(28, 7, 452, 23) & ~R(29, 8, 451, 22), '#ffd23c')
    for bx in (60, 420):
        bk = P([(bx - 10, 12), (bx + 10, 12), (bx + 7, 21), (bx - 7, 21)])
        s.sh(bk, pal('#ffe08a', '#f0b040', '#c88a28', None, '#3a2408'), kl=1, kd=1, kdd=0)
        s.put(L(curve((bx - 7, 12), (bx + 7, 12), -9)), '#ffe08a')
        for k, c in enumerate(('#ff5a3a', '#40c060', '#ffd23c')):
            s.put(O(bx - 5 + k * 5, 11, 2), c)
    for k in range(9):
        cx = 110 + k * 33
        s.sh(O(cx, 15, 5), ramp(['#ff6a4a', '#ffd23c', '#5ad070', '#ff9a3c', '#ffffff'][k % 5]), kl=1, kd=1, kdd=0)
    # rolled-up shutter
    for yy in range(28, 40):
        s.put(R(26, yy, 454, yy), '#b8bcc6' if yy % 3 else '#8a8e9a')
    s.put(R(26, 39, 454, 40), '#5a5e6a')
    # pillars
    for x0, x1 in ((0, 25), (455, 479)):
        s.sh(R(x0, 28, x1, FL - 1), FAC, kl=1, kd=3, kdd=1, d=(1, 0))
        s.put(R(x0, FL - 22, x1, FL - 1), '#c86a4a')
        for yy in range(FL - 22, FL, 6):
            s.put(R(x0, yy, x1, yy), '#a8503a')
    # interior
    inside = R(26, 41, 454, FL - 1)
    s.put(inside, '#dccaa4')
    for i, lv in enumerate((0.8, 0.6, 0.4, 0.2)):
        s.dith(R(26, 41 + i * 2, 454, 42 + i * 2), '#8a7454', lv)
    tube_light(s, 200, 280, 44, lit=True)
    WD = pal('#d8a068', '#b07c48', '#8a5a32', '#6a4226', '#2e1a10')
    for sy in (72, 100, 126):
        s.sh(R(30, sy, 450, sy + 3), WD, kl=1, kd=1, kdd=0, d=(0, 1))
        s.shadow(R(30, sy + 4, 450, sy + 6))
    # shelf 1: candy jars
    for k, x in enumerate(range(44, 440, 18)):
        jm = R(x, 56, x + 12, 71)
        lid = R(x + 1, 52, x + 11, 55)
        s.put(jm, '#e8f4f8')
        for _ in range(14):
            s.px(rng.randint(x + 1, x + 11), rng.randint(60, 70), rng.choice(['#ff5a6a', '#ffd23c', '#5ad070', '#ff9a3c', '#a070f0']))
        s.put(R(x + 2, 57, x + 2, 69), '#ffffff')
        s.outline(jm, '#8aa0a8')
        s.sh(lid, ramp(['#e83a3a', '#2a9a4a', '#f0b020', '#3a6ad0'][k % 4]), kl=1, kd=1, kdd=0)
    # shelf 2: boxes, bottles
    x = 34
    k = 0
    while x < 440:
        kind = k % 4
        if kind == 3:
            for b in range(2):
                bm = R(x + b * 7, 84, x + b * 7 + 5, 99) | R(x + b * 7 + 2, 80, x + b * 7 + 3, 84)
                s.sh(bm, pal('#fff6a0', '#f4d040', '#d0a828', None, '#5a4410'), kl=1, kd=1, kdd=0)
                s.put(R(x + b * 7 + 1, 90, x + b * 7 + 4, 93), '#e04a3a')
            x += 16
        else:
            w = rng.randint(10, 16)
            hh = rng.randint(12, 18)
            _pack(s, x, 99 - hh, x + w, 99, ['#e05a4a', '#3aa0e0', '#f0a030', '#8a50c8', '#40b070', '#f070a0'][rng.randrange(6)],
                  rng.choice(['stripe', 'dot', 'band']))
            x += w + 3
        k += 1
    # shelf 3: big packets
    x = 34
    while x < 440:
        w = rng.randint(14, 20)
        _pack(s, x, 106, x + w, 125, rng.choice(['#ffffff', '#f0f0f0', '#3a7ad8', '#40b060', '#f4c030']), 'band')
        if rng.random() < 0.5:
            s.put(R(x + 2, 112, x + w - 2, 116), rng.choice(['#e04a3a', '#f08a30', '#2a5ab0']))
        x += w + 2
    # hanging bananas + sachet strips
    s.put(R(40, 41, 40, 50), '#6a5a40')
    for k, (bx, by) in enumerate([(36, 52), (40, 51), (44, 52), (34, 58), (38, 58), (42, 58), (46, 58), (37, 64), (42, 64)]):
        bm = E(bx - 2, by - 3, bx + 2, by + 4)
        s.sh(bm, pal('#fff6a0', '#f4d040', '#c8a028', None, '#4a3808'), kl=1, kd=1, kdd=0)
    s.put(R(40, 47, 40, 50), '#5a8a30')
    cols = [('#ff4a6a', '#ffd23c'), ('#3a8af0', '#ffffff'), ('#40c070', '#f0f040'), ('#ff8a3a', '#a050e0'), ('#e83a3a', '#40c0f0')]
    s.put(R(56, 43, 132, 43) | R(350, 43, 440, 43), '#7a7a80')
    for i, x in enumerate([60, 72, 82, 96, 110, 122, 356, 368, 382, 394, 408, 420, 432]):
        _sachet_strip(s, x, 46, [9, 6, 8, 5, 7, 9][i % 6], *cols[i % 5])
    # counter
    CT = pal('#e8b880', '#c8915a', '#a06c3c', '#7e5230', '#2e1a10')
    s.shadow(R(118, FL - 2, 410, FL + 3))
    top = P([(116, 128), (398, 128), (402, 134), (112, 134)])
    s.sh(top, CT, kl=1, kd=1, kdd=1, d=(0, 1))
    front = R(114, 135, 400, FL - 1)
    s.sh(front, CT, kl=1, kd=2, kdd=1)
    case = R(120, 138, 394, 160)
    s.put(case, '#3a2e2a')
    x = 122
    while x < 390:
        c = rng.choice(['#e05a4a', '#3aa0e0', '#f0a030', '#40b070', '#f070a0', '#ffd23c'])
        for row in range(3):
            yy = 158 - row * 6
            _pack(s, x, yy - 5, x + 10, yy, c, 'stripe' if row % 2 else 'band')
        x += 13
    glass(s, case, '#d8ecf4', 0.18)
    s.outline(case, CT['dd'])
    for px_ in range(120, 395, 46):
        s.put(R(px_, 162, px_ + 40, 176) & ~shift(R(px_, 162, px_ + 40, 176), 1, 1), CT['l'])
    # things on the counter
    _scale(s, 150, 128)
    for k, x in enumerate(range(212, 290, 14)):
        h = 12 + (k % 2) * 4
        for row in range(3 if k % 2 else 4):
            _pack(s, x, 127 - (row + 1) * 5, x + 11, 127 - row * 5, ['#c86a3a', '#e8a040', '#d84a5a', '#4a8ad0', '#58a850', '#a868d0'][k], 'stripe')
    for k, (cx, cy) in enumerate([(350, 127), (362, 127), (374, 127), (356, 113), (368, 113), (362, 99)]):
        _chips(s, cx, cy, ['#f0c030', '#e84a4a', '#40a0e8', '#f08a30', '#58c060', '#a860e0'][k])
    # QR board
    s.sh(R(306, 96, 330, 127), pal('#ffffff', '#f4f6fa', '#d0d6e2', None, '#2a3040'), kl=1, kd=1, kdd=0)
    s.put(R(307, 97, 329, 101), '#3a6ad0')
    s.put(R(316, 98, 320, 100), '#ffffff')
    fake_qr(s, 310, 105, n=15, seed=3)
    s.sh(R(312, 127, 324, 128), IRON, kl=0, kd=1, kdd=0)
    # shopkeeper's stool
    STL = pal('#f0b878', '#c8884c', '#a06838', '#7a4c28', '#2e1a0c')
    s.shadow(E(406, FL - 3, 440, FL + 4))
    s.sh(R(406, 146, 434, 151), STL, kl=1, kd=1, kdd=1, d=(0, 1))
    for lx in (408, 430):
        s.sh(R(lx, 152, lx + 2, FL), STL, kl=0, kd=1, kdd=0, d=(1, 0))
    s.put(R(410, 166, 430, 167), STL['d'])
    s.put(P([(410, 145), (428, 145), (430, 147), (408, 147)]), '#d84a4a')
    # step + pavement (customer side)
    s.sh(R(0, FL, W - 1, FL + 5), STONE, kl=1, kd=2, kdd=1, d=(0, 1), ol=False)
    s.put(R(0, FL + 6, W - 1, FL + 6), STONE['o'])
    persp_tiles(s, FL + 7, H, 240, FL - 60, '#c8c4bc', '#c0bbb2', '#a8a298', su=3.0, sv=1400)
    for _ in range(300):
        s.px(rng.randint(0, W - 1), rng.randint(FL + 8, H - 1), rng.choice(['#b4aea4', '#d4d0c8']))
    # sacks in front of the counter
    _sack(s, 30, FL + 4, 34, 36, '#f6f2e6', seed=1, scoop=True)
    _sack(s, 66, FL + 6, 34, 34, '#f2c030', seed=2)
    _sack(s, 102, FL + 4, 32, 30, '#78b848', seed=3)
    # onion crate (right)
    cr = R(436, 168, 476, FL + 4)
    s.shadow(E(432, FL + 1, 482, FL + 8))
    s.sh(cr, WD, kl=1, kd=2, kdd=1)
    for yy in (174, 180):
        s.put(R(437, yy, 475, yy), WD['dd'])
    for k in range(12):
        ox, oy = 440 + (k % 6) * 6 + (k // 6) * 3, 166 - (k // 6) * 4
        om = O(ox, oy, 3)
        s.sh(om, pal('#f0a0c0', '#c86890', '#a04c70', None, '#4a1830'), kl=1, kd=1, kdd=0)
    return s


# ================================================================== 12  JUNIOR COLLEGE
def neem(s, x, y, r, seed=0):
    rng = random.Random(seed)
    NL = pal('#8ad070', '#4ea446', '#3a8a3c', '#2a6e32', '#163a1e')
    TR = pal('#a08670', '#7a6452', '#5c4a3c', '#463830', '#221a14')
    s.shadow(E(x - r * 0.8, y - 2, x + r * 1.1, y + 6))
    tm = P([(x - 5, y), (x + 5, y), (x + 3, y - r * 0.7), (x + 8, y - r * 1.1), (x + 5, y - r * 1.15), (x, y - r * 0.85),
            (x - 6, y - r * 1.2), (x - 8, y - r * 1.1), (x - 3, y - r * 0.7)])
    s.sh(tm, TR, kl=1, kd=3, kdd=1, d=(1, 0))
    for yy in range(int(y - r * 0.7), y, 4):
        s.px(x + rng.randint(-2, 2), yy, TR['dd'])
    cl = []
    for _ in range(48):
        a = rng.uniform(0, 2 * math.pi)
        d = rng.uniform(0, 1) ** 0.5
        cl.append((x + math.cos(a) * r * 1.45 * d, y - r * 1.5 + math.sin(a) * r * 0.55 * d, rng.uniform(r * 0.13, r * 0.22)))
    cl.sort(key=lambda c: c[1])
    um = NONE()
    for c in cl:
        um |= O(*c)
    s.outline(um, NL['o'])
    for c in cl:
        s.sh(O(*c), NL, kl=max(1, int(c[2] * 0.25)), kd=max(2, int(c[2] * 0.4)), kdd=1, ol=False)
    ys, xs = np.nonzero(um)
    for _ in range(len(xs) // 6):
        i = rng.randrange(len(xs))
        if um[min(H - 1, ys[i] + 1), xs[i]]:
            s.px(xs[i], ys[i], NL['l'] if rng.random() < 0.45 else NL['d'])
    edge = um & ~shift(um, 0, 1)
    ey, ex = np.nonzero(edge)
    for i in range(0, len(ex), 3):
        s.px(ex[i], ey[i] + 1, NL['o'])


def college():
    s = Scene(12)
    G = 184
    s.sky(SKY_DAY, 0, G)
    for x, y, w, sd in [(20, 34, 70, 71), (400, 22, 64, 72)]:
        cloud(s, x, y, w, seed=sd)
    YEL = pal('#fff8cc', '#f6e8a4', '#dcc884', '#bca866', '#4e4224')
    MAR = pal('#e07a60', '#b0503c', '#8c3a2c', '#6e2a20', '#2e100a')
    GRN = pal('#6ac49a', '#3f9a6e', '#2e7854', '#225e42', '#123424')
    bx0, bx1 = 140, 482
    # building body
    s.sh(R(bx0, 60, bx1, G - 4), YEL, kl=1, kd=0, kdd=0)
    for (y0, y1) in ((66, 116), (124, G - 8)):
        s.put(R(bx0 + 4, y0, bx1, y1), YEL['d'])
        s.dith(R(bx0 + 4, y0, bx1, y0 + 3), YEL['dd'], 0.6)
        for dx in range(bx0 + 14, bx1, 34):
            door = (dx // 34) % 3 == 1
            if door:
                dm = R(dx + 4, y1 - 34 if y1 > 140 else y1 - 30, dx + 18, y1)
                s.sh(dm, GRN, kl=1, kd=1, kdd=1)
                s.put(R(dx + 11, dm.nonzero()[0].min(), dx + 11, y1), GRN['dd'])
            else:
                wm = R(dx + 3, y0 + 10, dx + 19, y0 + 26)
                s.put(wm, '#3a4a6a')
                for gx in range(dx + 5, dx + 19, 3):
                    s.put(R(gx, y0 + 10, gx, y0 + 26), '#6a7a9a')
                s.outline(wm, GRN['b'])
                s.put(R(dx + 1, y0 + 10, dx + 2, y0 + 26) | R(dx + 20, y0 + 10, dx + 21, y0 + 26), GRN['b'])
        for px_ in range(bx0, bx1 + 1, 34):
            s.sh(R(px_, y0 - 2, px_ + 6, y1 + 2), YEL, kl=1, kd=2, kdd=1, d=(1, 0))
    s.sh(R(bx0 - 2, 116, bx1, 123), MAR, kl=1, kd=2, kdd=1, d=(0, 1))
    par = R(bx0 + 2, 102, bx1, 116)
    s.sh(par, YEL, kl=1, kd=1, kdd=0, d=(0, 1))
    for k in range(bx0 + 6, bx1, 8):
        s.put(R(k, 106, k + 4, 112) & par, YEL['dd'])
    s.sh(R(bx0 - 2, 54, bx1, 60), MAR, kl=1, kd=2, kdd=1, d=(0, 1))
    for k in range(bx0, bx1, 10):
        s.sh(R(k, 48, k + 5, 54), YEL, kl=1, kd=1, kdd=0)
    s.sh(R(bx0 - 2, G - 8, bx1, G - 1), MAR, kl=1, kd=1, kdd=1, d=(0, 1))
    # name board
    bd = R(232, 26, 414, 50)
    for px_ in (246, 400):
        s.sh(R(px_, 50, px_ + 3, 56), IRON, kl=0, kd=1, kdd=0, d=(1, 0))
    s.sh(bd, pal('#6aa0f0', '#2a5ab8', '#1e4590', '#183a78', '#0a1a3a'), kl=1, kd=2, kdd=1)
    s.put(R(235, 29, 411, 47) & ~R(236, 30, 410, 46), '#ffd23c')
    text(s, 'JUNIOR COLLEGE', 323, 31, '#ffffff', sc=2, sp=1, shadow='#0a1a3a', center=True)
    # entrance steps
    for k in range(3):
        s.sh(R(296 - k * 4, G - 6 + k * 3, 350 + k * 4, G - 4 + k * 3), STONE, kl=1, kd=1, kdd=0, d=(0, 1))
    # ground
    GR = '#dcae7a'
    gm = R(0, G, W - 1, H - 1)
    s.put(gm, GR)
    rng = random.Random(12)
    for _ in range(900):
        s.px(rng.randint(0, W - 1), rng.randint(G, H - 1), rng.choice(['#c89a68', '#e8c08c', '#c89a68']))
    for _ in range(40):
        gx, gy = rng.randint(0, W - 1), rng.randint(G + 6, H - 1)
        for dx, dy in ((-1, 0), (0, -1), (1, 0), (0, 0)):
            s.px(gx + dx, gy + dy, GRASS['d'])
    s.dith(R(0, G, W - 1, G + 3), '#b88a5a', 0.5)
    # compound wall + gate (left)
    CW = pal('#f8f0d8', '#e8dcc0', '#c8b898', '#a89878', '#4a4030')
    s.sh(R(0, 140, 21, G - 1) | R(77, 140, 136, G - 1), CW, kl=1, kd=0, kdd=0)
    s.put(R(0, 140, 21, 143) | R(77, 140, 136, 143), MAR['b'])
    s.put(R(22, 166, 76, G - 1), '#8a8a96')
    s.put(R(22, 166, 76, 166), '#6a6a76')
    s.sh(R(26, 146, 40, 166), pal(None, '#e8d8e8', '#cfc0d0'), kl=0, kd=1, kdd=0, d=(1, 0), ol=False)
    s.sh(R(48, 150, 70, 166), pal(None, '#d8e8d8', '#c0d0c0'), kl=0, kd=1, kdd=0, d=(1, 0), ol=False)
    for gx0, gx1 in ((10, 22), (76, 88)):
        s.sh(R(gx0, 124, gx1, G - 1), CW, kl=1, kd=3, kdd=1, d=(1, 0))
        s.sh(R(gx0 - 2, 120, gx1 + 2, 124), MAR, kl=1, kd=1, kdd=0, d=(0, 1))
        s.sh(O((gx0 + gx1) // 2, 117, 3), MAR, kl=1, kd=1, kdd=0)
    for (hx, dirn) in ((22, 1), (76, -1)):
        for k in range(7):
            xx = hx + dirn * (2 + k * 2)
            s.put(R(xx, 150 - k, xx, G - 2 - k // 2), GRN['d'])
        s.put(L([(hx, 150), (hx + dirn * 14, 143)]) | L([(hx, G - 3), (hx + dirn * 14, G - 6)]), GRN['b'])
    # neem tree with a round platform
    s.shadow(E(98, G - 2, 178, G + 10))
    plat = E(102, G - 6, 168, G + 6)
    s.sh(R(102, G - 2, 168, G + 2) | (E(102, G - 2, 168, G + 8) & R(0, G, W - 1, H - 1)), CW, kl=0, kd=2, kdd=1, d=(0, 1))
    s.sh(plat, CW, kl=1, kd=1, kdd=0)
    s.put(plat & ~E(104, G - 5, 166, G + 5), MAR['b'])
    neem(s, 135, G - 2, 38, seed=5)
    # notice board
    s.shadow(E(198, G - 2, 244, G + 4))
    for lx in (202, 234):
        s.sh(R(lx, 150, lx + 2, G), WOOD, kl=0, kd=1, kdd=0, d=(1, 0))
    nb = R(194, 128, 242, 156)
    s.sh(nb, WOOD, kl=1, kd=1, kdd=1)
    cork = R(197, 131, 239, 153)
    s.put(cork, '#d8b07a')
    for (x0, y0, x1, y1, c) in ((199, 133, 211, 147, '#ffffff'), (213, 135, 223, 151, '#fff6a0'), (225, 132, 237, 142, '#ffffff'),
                                 (226, 144, 237, 152, '#ffd8e0')):
        s.shadow(R(x0 + 1, y0 + 1, x1 + 1, y1 + 1) & cork)
        s.put(R(x0, y0, x1, y1), c)
        for yy in range(y0 + 3, y1 - 1, 2):
            s.put(R(x0 + 2, yy, x1 - 2 - (yy % 3), yy), '#9a9aa8')
        s.px((x0 + x1) // 2, y0 + 1, '#e03030')
    s.sh(P([(190, 128), (246, 128), (240, 122), (196, 122)]), pal('#e07a60', '#b0503c', '#8c3a2c', None, '#2e100a'), kl=1, kd=1, kdd=0)
    # cycle stand
    s.shadow(R(380, G - 2, 480, G + 4))
    for px_ in (384, 430, 476):
        s.sh(R(px_, 140, px_ + 2, G - 1), IRON, kl=0, kd=1, kdd=0, d=(1, 0))
    roof = P([(372, 132), (482, 124), (482, 134), (372, 142)])
    s.sh(roof, pal('#d8e0e8', '#a8b4c4', '#8090a4', '#687890', '#28303c'), kl=1, kd=1, kdd=1, d=(0, 1))
    for k in range(376, 482, 5):
        s.put(L([(k, 141 - (k - 372) * 8 // 110), (k, 133 - (k - 372) * 8 // 110)]) & roof, '#8090a4')
    for k, bxx in enumerate(range(388, 470, 14)):
        bicycle(s, bxx, G - 1, frame=['#c83838', '#2a6ad0', '#2a2a30', '#d8a020', '#3a9a5a', '#c83838'][k % 6])
    # students near the gate
    person(s, 34, G + 10, '#ffffff', '#2a3a6a', SKIN[0], kind='boy', bag='#c83838')
    person(s, 48, G + 12, '#ffffff', '#2a3a6a', SKIN[2], kind='girl', bag='#3a6ad0')
    person(s, 92, G + 8, '#ffffff', '#2a3a6a', SKIN[1], kind='boy', bag='#2a9a5a')
    person(s, 106, G + 14, '#ffffff', '#2a3a6a', SKIN[3], kind='girl')
    return s


# ================================================================== 13  BANK
def _stanchion(s, x, y):
    CH = pal('#ffffff', '#c8ccd6', '#8a90a0', '#6a7080', '#2a2e38')
    s.shadow(E(x - 6, y - 1, x + 9, y + 3))
    s.sh(E(x - 6, y - 3, x + 6, y + 1), CH, kl=1, kd=1, kdd=0)
    s.sh(R(x - 1, y - 26, x + 1, y - 2), CH, kl=0, kd=1, kdd=0, d=(1, 0))
    s.sh(O(x, y - 27, 2), CH, kl=1, kd=1, kdd=0)


def bank():
    s = Scene(13)
    wall = pal('#fbf6ea', '#efe6d2', '#d8ccb2')
    room(s, wall, ceil=('#ffffff', '#d8dce4'), floor=('#d6d0d6', '#cbc4cb', '#aaa2aa'), skirt='#6a5a5a', CE=16, su=3.5, sv=1100)
    for x in range(20, W, 60):
        s.put(R(x, 4, x + 30, 9), '#fffde8')
        s.outline(R(x, 4, x + 30, 9), '#c8ccd4')
    s.put(R(0, 14, W - 1, 15), '#c8ccd4')
    # wall panelling band
    s.put(R(0, 128, W - 1, FL - 6), '#c8a888')
    for x in range(0, W, 24):
        s.put(R(x, 128, x, FL - 6), '#a8886a')
    s.put(R(0, 128, W - 1, 128), '#e8d0b0')
    # counters
    cx0, cx1 = 96, 398
    behind = R(cx0, 62, cx1, 132)
    s.put(behind, '#e2ecf4')
    for (fx0, fx1) in ((cx0 + 4, cx0 + 44), (cx1 - 70, cx1 - 30)):
        rack = R(fx0, 70, fx1, 104)
        s.put(rack, '#c8b090')
        for ry in (80, 92):
            s.put(R(fx0, ry, fx1, ry), '#8a6a4a')
        rng = random.Random(fx0)
        for ry in (71, 81, 93):
            x = fx0 + 1
            while x < fx1 - 2:
                s.put(R(x, ry + 1, x + 2, ry + 8), rng.choice(['#3a6ad0', '#d84a4a', '#40a060', '#f0b030']))
                x += 4
    for mx in range(cx0 + 52, cx1 - 20, 100):
        s.sh(R(mx, 104, mx + 24, 122), pal('#5a5a64', '#34343c', '#202026', None, '#0c0c10'), kl=1, kd=1, kdd=0)
        s.put(R(mx + 10, 122, mx + 14, 130), '#34343c')
        s.sh(R(mx + 30, 108, mx + 48, 132), pal('#4a4a56', '#2a2a32', '#1a1a20', None, '#0a0a0e'), kl=1, kd=1, kdd=0)
    glass(s, behind, '#d8eef8', 0.22)
    for px_ in range(cx0, cx1 + 1, 100):
        s.sh(R(px_ - 2, 58, px_ + 2, 132), pal('#ffffff', '#d4d8e0', '#a4aab8', None, '#4a505c'), kl=1, kd=1, kdd=0, d=(1, 0))
        if px_ < cx1:
            hc = px_ + 30
            ring = O(hc, 118, 5) & ~O(hc, 118, 4)
            s.put(ring, '#a4aab8')
            for hx, hy in [(hc + i, 118 + j) for i in (-2, 0, 2) for j in (-2, 0, 2)]:
                s.px(hx, hy, '#7a808e')
    s.sh(R(cx0 - 2, 56, cx1 + 2, 60), pal('#ffffff', '#d4d8e0', '#a4aab8', None, '#4a505c'), kl=1, kd=1, kdd=0, d=(0, 1))
    top = P([(cx0 - 4, 132), (cx1 + 4, 132), (cx1 + 8, 138), (cx0 - 8, 138)])
    s.sh(top, pal('#8a8a96', '#5a5a66', '#44444e', '#34343c', '#16161a'), kl=1, kd=1, kdd=1, d=(0, 1))
    for px_ in range(cx0, cx1, 100):
        s.put(R(px_ + 20, 133, px_ + 40, 135), '#2a2a32')
    front = R(cx0 - 6, 139, cx1 + 6, FL - 1)
    CF = pal('#d8b48c', '#b88e64', '#9a7250', '#7c5a3e', '#2e1e12')
    s.sh(front, CF, kl=1, kd=2, kdd=1)
    for px_ in range(cx0 + 4, cx1, 50):
        s.put(R(px_, 142, px_, FL - 4), CF['d'])
    s.put(R(cx0 - 6, 150, cx1 + 6, 152), '#2a5ab8')
    # sign
    for wx in (150, 330):
        s.put(R(wx, 16, wx, 24), '#6a6a74')
    sg = R(126, 24, 354, 46)
    s.sh(sg, pal('#6aa0f0', '#1e4fa8', '#183e88', '#123270', '#08142e'), kl=1, kd=2, kdd=1)
    text(s, 'SAVINGS / DEPOSITS', 240, 29, '#ffffff', sc=2, sp=1, shadow='#08142e', center=True)
    # token display + dispenser (left)
    td = R(26, 62, 84, 88)
    s.sh(td, pal('#4a4a56', '#22222a', '#16161c', None, '#060608'), kl=1, kd=1, kdd=0)
    s.put(R(29, 65, 81, 85), '#0c0c10')
    lm = text(s, '024', 55, 68, '#ff3030', sc=2, sp=1, center=True)
    s.dith(dilate(lm, True) & ~lm & R(29, 65, 81, 85), '#801818', 0.5)
    s.shadow(E(36, FL - 2, 76, FL + 5))
    kio = R(42, 112, 70, FL)
    s.sh(kio, pal('#ffffff', '#e8eaf0', '#c4c8d4', '#a4aab8', '#3a3e4a'), kl=1, kd=2, kdd=1)
    scr = R(46, 118, 66, 132)
    s.put(scr, '#3a8ad8')
    s.put(scr & ~shift(scr, 0, 2), '#2a6ab8')
    s.put(R(48, 121, 58, 122) | R(48, 125, 62, 126), '#a8d8ff')
    s.put(R(50, 140, 62, 142), '#2a2a32')
    s.put(R(53, 143, 59, 150), '#ffffff')
    s.outline(R(53, 143, 59, 150), '#a4aab8')
    s.put(R(42, 112, 70, 115), '#1e4fa8')
    # queue rope
    posts = [(116, 198), (166, 198), (216, 198), (266, 198)]
    for i in range(len(posts) - 1):
        (x0, y0), (x1, y1) = posts[i], posts[i + 1]
        rope = L(curve((x0, y0 - 24), (x1, y1 - 24), 7), 2)
        s.put(rope, '#c82838')
        s.put(L(curve((x0, y0 - 25), (x1, y1 - 25), 7)), '#e84858')
    for x, y in posts:
        _stanchion(s, x, y)
    # glass door with the ATM behind it
    dx0, dx1 = 410, 474
    vest = R(dx0, 58, dx1, FL - 1)
    s.put(vest, '#eef2f8')
    s.put(R(dx0, FL - 20, dx1, FL - 1), '#d0d4dc')
    atm = R(428, 92, 460, FL - 2)
    s.sh(atm, pal('#e8eef8', '#b8c4d8', '#8a98b0', '#6a7890', '#2a3242'), kl=1, kd=2, kdd=1)
    s.put(R(428, 84, 460, 92), '#2a5ab8')
    s.outline(R(428, 84, 460, 92), '#1a2a50')
    s.put(R(432, 98, 456, 114), '#2a3a5a')
    s.put(R(434, 100, 454, 112), '#40c8e8')
    s.put(R(436, 103, 448, 104) | R(436, 107, 452, 108), '#d8f8ff')
    for ky in range(120, 132, 3):
        for kx in range(436, 448, 4):
            s.put(R(kx, ky, kx + 2, ky + 1), '#4a5468')
    s.put(R(450, 120, 454, 122), '#2a2a32')
    s.px(452, 119, '#40f070')
    s.put(R(434, 136, 454, 138), '#2a2a32')
    glass(s, vest, '#c8e4f4', 0.3)
    s.sh(R(dx0 - 4, 54, dx1 + 4, 58) | R(dx0 - 4, 54, dx0, FL - 1) | R(dx1, 54, dx1 + 4, FL - 1),
         pal('#ffffff', '#d4d8e0', '#a4aab8', None, '#4a505c'), kl=1, kd=1, kdd=0, d=(1, 0))
    s.put(R(dx0 + 1, 58, dx0 + 2, FL - 1), '#a4aab8')
    s.sh(R(dx0 + 6, 104, dx0 + 7, 140), pal('#ffffff', '#e8ecf4', '#9aa0ae', None, '#3a3e48'), kl=1, kd=1, kdd=0)
    wall_clock(s, 384, 36, 8, frame='#3a3a44', t=(11, 5))
    potted_plant(s, 92, FL + 2, h=26, kind='tall', seed=4)
    # floor shine
    for x0 in (60, 250, 430):
        lighten(s, P([(x0, FL + 2), (x0 + 10, FL + 2), (x0 + 6, H - 1), (x0 - 4, H - 1)]), 0.12)
    return s


# ================================================================== 14  MOBILE SHOP
def _phone_icon(s, x, y, w, h, screen, bezel='#1c1c24'):
    m = R(x, y, x + w, y + h) & ~R(x, y, x, y) & ~R(x + w, y, x + w, y) & ~R(x, y + h, x, y + h) & ~R(x + w, y + h, x + w, y + h)
    s.put(m, bezel)
    sc = R(x + 1, y + 2, x + w - 1, y + h - 2)
    if isinstance(screen, (list, tuple)):
        sub = Scene()
        sub.sky(screen, y + 2, y + h - 1)
        s.a[sc] = sub.a[sc]
    else:
        s.put(sc, screen)
    s.px(x + w // 2, y + 1, '#5a5a66')


def _scooter(s, x, y, col='#2ab0a8'):
    p = ramp(col, '#10201e')
    s.shadow(E(x - 2, y - 2, x + 56, y + 4))
    for wx in (x + 8, x + 46):
        s.put(O(wx, y - 6, 6), '#26262c')
        s.put(O(wx, y - 6, 2), '#b0b0b8')
        s.outline(O(wx, y - 6, 6), '#0c0c10')
    body = P([(x + 1, y - 18), (x + 26, y - 18), (x + 32, y - 11), (x + 28, y - 6), (x + 4, y - 6), (x, y - 12)])
    s.sh(body, p, kl=1, kd=2, kdd=1)
    s.sh(R(x + 26, y - 9, x + 42, y - 6), pal('#4a4a52', '#2a2a30', '#18181c', None, '#0a0a0c'), kl=1, kd=1, kdd=0)
    ap = P([(x + 38, y - 7), (x + 44, y - 32), (x + 49, y - 32), (x + 47, y - 7)])
    s.sh(ap, p, kl=1, kd=1, kdd=1)
    fg = E(x + 38, y - 14, x + 54, y - 4) & R(0, 0, W - 1, y - 9)
    s.sh(fg, p, kl=1, kd=1, kdd=0)
    s.sh(P([(x + 4, y - 22), (x + 26, y - 22), (x + 24, y - 18), (x + 6, y - 18)]), pal('#5a5a64', '#2a2a30', '#18181c', None, '#0a0a0c'), kl=1, kd=1, kdd=0)
    s.put(R(x + 42, y - 36, x + 54, y - 34), '#2a2a30')
    s.put(L([(x + 44, y - 36), (x + 42, y - 42)]), '#2a2a30')
    s.put(O(x + 42, y - 43, 1), '#c8d0d8')
    s.put(R(x + 49, y - 32, x + 52, y - 29), '#fff8c0')
    s.put(R(x + 1, y - 15, x + 3, y - 14), '#e04040')


def mobile_shop():
    s = Scene(14)
    rng = random.Random(14)
    FT = FL
    UP = pal('#fbf4ec', '#ece2d4', '#d2c4b2', '#b2a490', '#4a4034')
    s.put(R(0, 0, W - 1, FT - 1), UP['b'])
    s.put(R(0, 0, W - 1, 0), UP['d'])
    for wx in (90, 250):
        wm = R(wx, 0, wx + 40, 12)
        s.put(wm, '#5a7ab0')
        s.put(wm & ~shift(wm, 1, 1), '#3c5a90')
        s.outline(wm, UP['dd'])
    s.sh(R(386, 0, 420, 13), pal('#ffffff', '#e8eaee', '#c4c8d0', None, '#4a4e58'), kl=1, kd=1, kdd=0)
    s.put(O(396, 6, 4) & ~O(396, 6, 3), '#9aa0ac')
    for k in range(403, 418, 2):
        s.put(R(k, 3, k, 10), '#b4b8c2')
    # fascia sign (graphics only)
    fas = R(36, 17, 444, 50)
    s.sh(fas, pal('#7ae0f0', '#1e9cc0', '#16809c', '#10627a', '#062430'), kl=1, kd=2, kdd=1)
    for k, (sag, c) in enumerate([(10, '#48c4e0'), (-8, '#0e6e8a'), (6, '#7ae0f0')]):
        s.put(L(curve((40, 30 + k * 6), (440, 26 + k * 6), sag), 2) & fas, c)
    for ix in (56, 410):
        _phone_icon(s, ix, 22, 14, 24, ['#ff6a9a', '#ffb050', '#ffe070'])
        s.outline(R(ix, 22, ix + 14, 46), '#ffffff')
    for k in range(5):
        sx, sy = rng.randint(90, 390), rng.randint(22, 44)
        s.put(R(sx - 2, sy, sx + 2, sy) | R(sx, sy - 2, sx, sy + 2), '#ffffff')
    # pillars + neighbours
    PIL = pal('#e8dccf', '#d2c4b2', '#b4a690', '#968a76', '#3a3226')
    for x0, x1 in ((26, 39), (441, 454)):
        s.sh(R(x0, 14, x1, FT - 1), PIL, kl=1, kd=3, kdd=1, d=(1, 0))
    for yy in range(40, FT):
        s.put(R(0, yy, 24, yy), '#a8acb6' if yy % 3 else '#82868f')
    s.put(R(0, 36, 24, 40), '#6a6e78')
    s.put(R(456, 20, W - 1, FT - 1), '#5aa0d8')
    for yy in range(20, FT, 8):
        s.put(R(456, yy, W - 1, yy), '#3a80b8')
    for xx in range(456, W, 8):
        s.put(R(xx, 20, xx, FT - 1), '#3a80b8')
    # interior
    inn = R(40, 52, 440, FT - 1)
    s.put(inn, '#f2f6fc')
    for k in range(5):
        cx = 70 + k * 85
        glow(s, cx, 56, 9, '#fff6d0', 0.4)
        s.put(R(cx - 2, 53, cx + 2, 54), '#fffbe8')
    for sy in (80, 104, 128):
        s.put(R(46, sy, 434, sy + 1), '#c4d0e0')
        s.put(R(46, sy + 2, 434, sy + 2), '#dfe6f0')
        for x in range(50, 428, 11):
            scr = rng.choice([['#ff6a9a', '#ffb050'], ['#4a8af0', '#a070f0'], ['#30d0b0', '#3a8af0'], ['#ffd040', '#ff7040'], '#1e2a4a'])
            _phone_icon(s, x, sy - 15, 6, 13, scr)
    ct = R(46, 140, 434, FT - 1)
    s.put(ct, '#e6eef8')
    s.put(R(46, 138, 434, 140), '#ffffff')
    for x in range(52, 428, 14):
        _phone_icon(s, x, 146, 8, 14, rng.choice([['#ff6a9a', '#ffb050'], ['#4a8af0', '#a070f0'], ['#30d0b0', '#3a8af0']]))
    s.put(R(46, FT - 6, 434, FT - 5), '#40c8ff')
    s.put(R(46, FT - 4, 434, FT - 1), '#c4d0e0')
    glass(s, inn, '#d8eef8', 0.16)
    # posters on the glass
    for (x0, x1, bg, phones) in [(50, 120, ['#ffd040', '#ff9a40', '#ff6a5a'], [(68, 76, 34, 64, ['#ff5aa0', '#a050f0', '#3a8af0'])]),
                                 (360, 430, ['#3a8af0', '#5a5ae0', '#8a4ad8'], [(366, 84, 26, 50, ['#40e0c0', '#3a8af0']), (392, 74, 28, 58, ['#ffd040', '#ff6a9a'])])]:
        pm = R(x0, 66, x1, 152)
        sub = Scene()
        sub.sky(bg, 66, 153, sharp=2.5)
        s.a[pm] = sub.a[pm]
        for k in range(6):
            sx, sy = rng.randint(x0 + 4, x1 - 4), rng.randint(70, 148)
            s.put(R(sx - 1, sy, sx + 1, sy) | R(sx, sy - 1, sx, sy + 1), '#ffffff')
        for (px_, py_, pw, ph, scr) in phones:
            s.shadow(R(px_ + 3, py_ + 3, px_ + pw + 3, py_ + ph + 3) & pm)
            m = R(px_, py_, px_ + pw, py_ + ph)
            s.put(m, '#16161c')
            s.put(m & ~shift(m, -1, -1), '#4a4a56')
            sub2 = Scene()
            sub2.sky(scr, py_ + 3, py_ + ph - 3, sharp=2)
            sc = R(px_ + 2, py_ + 4, px_ + pw - 2, py_ + ph - 4)
            s.a[sc] = sub2.a[sc]
            s.put(L(curve((px_ + 2, py_ + ph * 0.6), (px_ + pw - 2, py_ + ph * 0.45), -6)) & sc, '#ffffff')
            s.put(O(px_ + pw // 2, py_ + 2, 1), '#2a2a34')
        s.outline(pm, '#ffffff')
    # door + EASY EMI board
    door = R(204, 90, 276, FT - 1)
    lighten(s, door, 0.08, '#ffffff')
    # aluminium frame
    AL = pal('#ffffff', '#c8ccd4', '#9aa0ac', None, '#3a3e48')
    frame = R(40, 50, 440, 52) | R(40, 50, 42, FT - 1) | R(438, 50, 440, FT - 1)
    for mx in (128, 204, 276, 352):
        frame |= R(mx - 1, 52, mx + 1, FT - 1)
    frame |= R(204, 88, 276, 89)
    frame |= R(239, 90, 241, FT - 1)
    s.sh(frame, AL, kl=1, kd=1, kdd=0, d=(1, 0))
    bd = R(182, 60, 298, 86)
    s.shadow(shift(bd, 2, 2) & ~bd)
    s.sh(bd, pal('#ff8a7a', '#e02a2a', '#b81e1e', '#901818', '#3a0808'), kl=1, kd=2, kdd=1)
    s.put(R(185, 63, 295, 83) & ~R(186, 64, 294, 82), '#ffd23c')
    text(s, 'EASY EMI', 240, 67, '#ffffff', sc=2, sp=1, shadow='#901818', center=True)
    for hx in (234, 245):
        s.sh(R(hx, 120, hx + 1, 150), pal('#ffffff', '#e0e4ec', '#8a909c', None, '#2a2e38'), kl=1, kd=1, kdd=0)
    # footpath, curb, road
    for yy in range(FT, 198, 5):
        for xx in range(-10 + (yy // 5 % 2) * 6, W, 12):
            s.put(R(xx, yy, xx + 10, yy + 3), '#cdc6be' if (xx // 12 + yy // 5) % 3 else '#dc8e6e')
            s.put(R(xx, yy + 4, xx + 11, yy + 4), '#a8a098')
            s.put(R(xx + 11, yy, xx + 11, yy + 4), '#a8a098')
    s.put(R(196, FT, 284, FT + 4), '#8a8278')
    s.put(R(196, FT, 284, FT), '#a8a098')
    s.sh(R(200, FT + 6, 280, FT + 11), pal('#7a6a5a', '#5a4a3e', '#44382e', None, '#20180e'), kl=1, kd=1, kdd=0)
    for xx in range(0, W, 10):
        c = '#f8d030' if (xx // 10) % 2 else '#34343e'
        s.put(R(xx, 198, xx + 9, 204), c)
        s.put(R(xx, 198, xx + 9, 198), '#ffffff' if c == '#f8d030' else '#5a5a68')
    s.put(R(0, 205, W - 1, H - 1), '#727280')
    for _ in range(900):
        s.px(rng.randint(0, W - 1), rng.randint(205, H - 1), rng.choice(['#62626e', '#82828e', '#686876']))
    s.put(R(0, 205, W - 1, 207), '#5a5a66')
    for xx in range(10, W, 46):
        s.put(R(xx, 248, xx + 22, 249), '#f4f4f4')
    _scooter(s, 418, 238)
    potted_plant(s, 288, FT + 2, h=20, seed=3)
    return s


# ================================================================== 15  CLINIC
def _chair_row(s, x0, n, col='#2f7fd0'):
    p = ramp(col)
    STL = pal('#e8ecf2', '#b0b8c4', '#8a94a4', None, '#2e3440')
    s.shadow(R(x0, FL - 1, x0 + n * 30 + 4, FL + 3))
    s.sh(R(x0, 168, x0 + n * 30, 171), STL, kl=1, kd=1, kdd=0, d=(0, 1))
    for lx in (x0 + 6, x0 + n * 15, x0 + n * 30 - 8):
        s.sh(R(lx, 171, lx + 2, FL), STL, kl=0, kd=1, kdd=0, d=(1, 0))
        s.sh(R(lx - 4, FL - 1, lx + 6, FL), STL, kl=0, kd=0, kdd=0)
    for k in range(n):
        cx = x0 + k * 30
        back = P([(cx + 4, 136), (cx + 24, 136), (cx + 26, 140), (cx + 25, 156), (cx + 3, 156), (cx + 2, 140)])
        seat = P([(cx + 2, 157), (cx + 26, 157), (cx + 28, 166), (cx, 166)])
        s.sh(back, p, kl=1, kd=2, kdd=1)
        s.sh(seat, p, kl=1, kd=2, kdd=1, d=(0, 1))
        for hx in range(cx + 8, cx + 22, 4):
            s.put(R(hx, 140, hx + 1, 143), p['dd'])


def clinic():
    s = Scene(15)
    wall = pal('#f2fbf8', '#dcf2ec', '#bedcd4')
    room(s, wall, ceil=('#ffffff', '#d8dcd8'), floor=('#eef0f4', '#e2e6ec', '#c4c8d0'), skirt='#6aa0b0', su=4, sv=1000)
    dado_tiles(s, 118, FL - 6, '#f8fbfc', '#d4dee2', tw=12, th=10)
    s.put(R(0, 115, W - 1, 117), '#4a9ab8')
    tube_light(s, 30, 100, 22, lit=True)
    tube_light(s, 200, 270, 22, lit=True)
    wall_clock(s, 40, 68, 9, frame='#3a6ab0', t=(10, 15))
    # hand-washing poster
    hp = R(66, 46, 124, 98)
    s.shadow(shift(hp, 2, 2) & ~hp)
    s.put(hp, '#ffffff')
    s.outline(hp, '#4a9ab8')
    s.put(R(67, 47, 123, 52), '#4a9ab8')
    for k in range(6):
        px_, py_ = 70 + (k % 3) * 18, 56 + (k // 3) * 20
        s.put(R(px_, py_, px_ + 14, py_ + 16), '#d8eefa')
        s.put(E(px_ + 3, py_ + 5, px_ + 11, py_ + 13), '#f0c8a0')
        s.put(R(px_ + 4 + (k % 2) * 2, py_ + 3, px_ + 5 + (k % 2) * 2, py_ + 6) | R(px_ + 8, py_ + 3, px_ + 9, py_ + 6), '#f0c8a0')
        for d in range(3):
            s.px(px_ + 3 + d * 4, py_ + 2 + (d % 2), '#7ac8f0')
    _chair_row(s, 10, 4, '#2f7fd0')
    # water dispenser
    s.shadow(E(140, FL - 2, 172, FL + 4))
    s.sh(R(142, 128, 166, FL - 1), pal('#ffffff', '#eef0f4', '#c8ccd6', '#a8aeba', '#3a3e48'), kl=1, kd=2, kdd=1)
    bot = R(145, 100, 163, 127) & ~R(145, 100, 145, 100) & ~R(163, 100, 163, 100)
    s.sh(bot, pal('#d8f0ff', '#8ac8f0', '#5aa0d8', None, '#2a5a8a'), kl=2, kd=2, kdd=0)
    s.put(R(150, 96, 158, 100), '#4a8ad0')
    s.put(R(148, 140, 150, 144), '#e04040')
    s.put(R(158, 140, 160, 144), '#3a7ad8')
    s.put(R(146, 150, 162, 152), '#a8aeba')
    # wall chart: body diagram
    ch = R(172, 46, 212, 106)
    s.shadow(shift(ch, 2, 2) & ~ch)
    s.put(ch, '#ffffff')
    s.outline(ch, '#4a9ab8')
    s.put(R(173, 47, 211, 51), '#e04a4a')
    bodym = O(192, 60, 4) | R(187, 65, 197, 84) | R(188, 85, 191, 100) | R(193, 85, 196, 100) | R(183, 66, 185, 82) | R(199, 66, 201, 82)
    s.put(bodym, '#a8d4f4')
    s.outline(bodym, '#6aa8d8')
    s.put(R(190, 69, 192, 71), '#e03a3a')
    s.put(R(188, 74, 196, 80), '#f0b0a0')
    for (lx, ly, ex) in ((176, 62, 188), (176, 72, 189), (204, 70, 195), (204, 88, 194)):
        s.put(L([(lx, ly), (ex, ly)]), '#b8c0cc')
        s.put(R(lx - 2 if lx < 192 else lx, ly - 1, lx + (0 if lx < 192 else 4), ly - 1), '#9aa0ac')
    # door
    DR = pal('#e8c494', '#c89a64', '#a07848', '#7e5a34', '#2e1e10')
    s.sh(R(218, 62, 262, FL - 1), DR, kl=1, kd=2, kdd=1)
    fr = R(224, 70, 256, 110)
    s.put(fr, '#e8f0f4')
    s.dith(fr, '#d0dce4', 0.5)
    s.outline(fr, DR['dd'])
    s.put(R(232, 116, 248, 124), '#f8f8f0')
    s.outline(R(232, 116, 248, 124), DR['dd'])
    s.sh(R(253, 130, 257, 132), pal('#ffffff', '#d8dce4', '#8a909c', None, '#2a2e38'), kl=0, kd=1, kdd=0)
    s.sh(R(214, 58, 266, 62), DR, kl=1, kd=1, kdd=0, d=(0, 1))
    # billing counter
    cx0, cx1 = 306, 476
    behind = R(cx0 + 4, 68, cx1, 126)
    s.put(behind, '#d8e8f8')
    for k in range(3):
        s.put(R(cx0 + 90, 76 + k * 14, cx1 - 6, 77 + k * 14), '#a8b8cc')
        x = cx0 + 92
        rng = random.Random(k)
        while x < cx1 - 8:
            s.put(R(x, 66 + k * 14 + 1, x + 2, 76 + k * 14 - 1), rng.choice(['#e04a4a', '#3a6ad0', '#40a060', '#f0b030', '#ffffff']))
            x += 4
    s.sh(R(cx0 + 20, 102, cx0 + 46, 122), pal('#5a5a64', '#34343c', '#202026', None, '#0c0c10'), kl=1, kd=1, kdd=0)
    s.sh(R(cx0 + 54, 110, cx0 + 76, 124), pal('#ffffff', '#e4e6ea', '#b8bcc4', None, '#3a3e48'), kl=1, kd=1, kdd=0)
    glass(s, behind, '#e0f2fa', 0.22)
    for px_ in (cx0 + 4, cx0 + 86, cx1):
        s.sh(R(px_ - 1, 66, px_ + 1, 126), pal('#ffffff', '#d4d8e0', '#a4aab8', None, '#4a505c'), kl=0, kd=1, kdd=0, d=(1, 0))
    s.sh(R(cx0 + 2, 64, cx1, 67), pal('#ffffff', '#d4d8e0', '#a4aab8', None, '#4a505c'), kl=1, kd=1, kdd=0, d=(0, 1))
    hc = cx0 + 60
    ring = O(hc, 112, 5) & ~O(hc, 112, 4)
    s.put(ring, '#a4aab8')
    for hx, hy in [(hc + i, 112 + j) for i in (-2, 0, 2) for j in (-2, 0, 2)]:
        s.px(hx, hy, '#7a808e')
    s.sh(P([(cx0, 126), (cx1, 126), (cx1, 132), (cx0 - 4, 132)]), pal('#ffffff', '#f0f2f4', '#cdd2d8', None, '#4a505c'), kl=1, kd=1, kdd=1, d=(0, 1))
    s.put(R(hc - 12, 127, hc + 12, 129), '#9aa0ac')
    CF = pal('#f4e2c8', '#e2c8a4', '#c4a882', '#a68a66', '#3a2e1e')
    s.sh(R(cx0 - 4, 133, cx1, FL - 1), CF, kl=1, kd=2, kdd=1)
    s.put(R(cx0 - 4, 146, cx1, 149), '#4a9ab8')
    for px_ in range(cx0 + 30, cx1, 42):
        s.put(R(px_, 151, px_, FL - 4), CF['d'])
    sg = R(318, 38, 470, 60)
    for wx in (334, 454):
        s.put(R(wx, 12, wx, 38), '#7a7a84')
    s.sh(sg, pal('#ff8a7a', '#d83030', '#b02424', '#8a1c1c', '#3a0808'), kl=1, kd=2, kdd=1)
    text(s, 'CASH COUNTER', 394, 42, '#ffffff', sc=2, sp=1, shadow='#8a1c1c', center=True)
    # nurse
    person(s, 282, FL + 8, '#ffffff', '#ffffff', SKIN[2], kind='nurse', hold='#c8a070')
    potted_plant(s, 470, FL + 4, h=22, kind='tall', seed=9)
    return s


# ================================================================== 16  CANTEEN
def _samosa(s, x, y):
    m = P([(x - 4, y), (x + 4, y), (x, y - 7)])
    s.sh(m, pal('#ffe08a', '#e8a840', '#c07a28', None, '#5a3410'), kl=1, kd=1, kdd=0)
    s.px(x - 1, y - 3, '#ffe8b0')


def _long_table(s, x0, x1, items, seed=0):
    rng = random.Random(seed)
    TOP = pal('#a8c8b8', '#86a898', '#6a8a7c', '#526e62', '#1e2c26')
    STL = pal('#e8ecf2', '#b0b8c4', '#8a94a4', None, '#2e3440')
    s.shadow(R(x0, FL - 1, x1 + 8, FL + 4))
    for lx in (x0 + 6, x1 - 8):
        s.sh(R(lx, 156, lx + 2, FL), STL, kl=0, kd=1, kdd=0, d=(1, 0))
    tt = P([(x0 + 6, 146), (x1 - 6, 146), (x1, 153), (x0, 153)])
    s.sh(tt, TOP, kl=1, kd=1, kdd=1, d=(0, 1))
    s.sh(R(x0, 154, x1, 156), TOP, kl=0, kd=1, kdd=0, d=(0, 1))
    for it in items:
        kind, ix = it
        if kind == 'g':
            steel_glass(s, ix, 151, 6)
        elif kind == 'c':
            m = P([(ix - 2, 145), (ix + 2, 145), (ix + 1, 151), (ix - 1, 151)])
            s.put(m, '#e8f4f8')
            s.put(m & R(0, 147, W - 1, H - 1), '#a8642c')
            s.outline(m, '#7a8a90')
        elif kind == 'p':
            pm = E(ix - 7, 147, ix + 7, 151)
            s.sh(pm, pal('#ffffff', '#d0d4dc', '#a0a6b2', None, '#3a3e48'), kl=1, kd=1, kdd=0)
            _samosa(s, ix - 2, 149)
            _samosa(s, ix + 3, 150)
    bench = R(x0 + 4, 166, x1 - 4, 170)
    WD = pal('#d8a068', '#b07c48', '#8a5a32', '#6a4226', '#2e1a10')
    s.shadow(R(x0 + 4, FL + 4, x1 + 6, FL + 8))
    s.sh(bench, WD, kl=1, kd=1, kdd=1, d=(0, 1))
    for lx in (x0 + 8, x1 - 10):
        s.sh(R(lx, 171, lx + 2, FL + 5), WD, kl=0, kd=1, kdd=0, d=(1, 0))


def canteen():
    s = Scene(16)
    wall = pal('#fff6dc', '#f8e4a8', '#e0c88a')
    room(s, wall, floor=('#bcb8b0', '#b0aca4', '#8e8a82'), skirt=None, su=4, sv=1000)
    dado_tiles(s, 104, FL - 1, '#f4f6f8', '#c8d0d6', tw=10, th=10)
    s.put(R(0, 101, W - 1, 103), '#3a8ac8')
    tube_light(s, 190, 250, 20, lit=True)
    _window(s, 18, 30, 102, 96)
    # chalk board with pictures only
    bd = R(186, 32, 296, 74)
    s.shadow(shift(bd, 2, 2) & ~bd)
    s.sh(bd, WOOD, kl=1, kd=1, kdd=1)
    s.put(R(189, 35, 293, 71), '#2a3a34')
    s.dith(R(189, 35, 293, 71), '#34463e', 0.3)
    cup = R(198, 44, 208, 56) | (O(210, 50, 3) & ~O(210, 50, 1))
    s.put(cup & ~R(199, 45, 207, 56), '#f0f0e8')
    for k in range(3):
        s.px(201 + k * 3, 41 - (k % 2), '#f0f0e8')
    s.put(P([(226, 56), (240, 56), (233, 43)]) & ~P([(228, 55), (238, 55), (233, 46)]), '#f8d8a0')
    s.put(E(254, 50, 274, 58) & ~E(256, 51, 272, 57), '#f0f0e8')
    s.put(R(260, 46, 268, 50) & ~R(261, 47, 267, 50), '#f8d8a0')
    for yy in (62, 66):
        for x0 in (196, 226, 256):
            s.put(R(x0, yy, x0 + 18, yy), '#c8d0c8')
    # counter
    STEEL = pal('#ffffff', '#cdd2da', '#a4acb8', '#8890a0', '#2e3440')
    hatch = R(214, 80, 268, 116)
    s.put(hatch, '#6a5444')
    s.put(hatch & ~shift(hatch, 0, 3), '#4a3a30')
    s.sh(R(216, 100, 266, 102), WOOD, kl=0, kd=1, kdd=0, d=(0, 1))
    for (px_, r) in ((226, 6), (242, 5), (256, 6)):
        s.sh(E(px_ - r, 92, px_ + r, 100) & R(0, 0, W - 1, 99) | R(px_ - r, 98, px_ + r, 99), pal('#e0e4ec', '#a8b0bc', '#7a8290', None, '#2a2e36'), kl=1, kd=1, kdd=0)
    for lx in (230, 238, 250):
        s.put(R(lx, 82, lx, 88), '#9aa0ac')
        s.put(E(lx - 2, 88, lx + 2, 91), '#9aa0ac')
    s.dith(hatch & R(0, 104, W - 1, H - 1), '#ffb060', 0.2)
    s.sh(R(212, 78, 270, 80) | R(212, 78, 213, 116) | R(269, 78, 270, 116), STEEL, kl=0, kd=1, kdd=0)
    s.sh(R(148, 124, 334, 129), STEEL, kl=1, kd=1, kdd=1, d=(0, 1))
    front = R(150, 130, 332, FL - 1)
    s.sh(front, STEEL, kl=1, kd=2, kdd=1)
    for px_ in range(156, 330, 20):
        s.put(R(px_, 132, px_ + 1, FL - 3), STEEL['l'])
    s.put(R(150, 150, 332, 151), STEEL['dd'])
    # samosa display
    box = R(158, 98, 226, 123)
    s.sh(R(156, 120, 228, 123), WOOD, kl=1, kd=1, kdd=0, d=(0, 1))
    s.put(R(159, 99, 225, 119), '#f4ecd8')
    for row, yy in enumerate((119, 112, 105)):
        for k in range(7 - row):
            _samosa(s, 166 + k * 9 + row * 4, yy)
    glass(s, R(159, 99, 225, 119), '#e0f2fa', 0.18)
    s.outline(R(158, 98, 226, 119), '#8aa0a8')
    # steel glasses tray
    s.sh(R(232, 121, 276, 123), STEEL, kl=1, kd=1, kdd=0, d=(0, 1))
    for row in range(2):
        for k in range(7):
            steel_glass(s, 236 + k * 6 + row * 3, 120 - row * 4, 6)
    # stove + kettle
    s.sh(R(282, 117, 330, 123), pal('#5a5a64', '#2a2a30', '#18181c', None, '#0a0a0c'), kl=1, kd=1, kdd=0)
    for fx in range(296, 318, 3):
        s.px(fx, 116, '#4a9aff')
        s.px(fx + 1, 115, '#9ad0ff')
    k = E(290, 92, 324, 118) & R(0, 96, W - 1, 116)
    s.sh(k | R(294, 92, 320, 96), STEEL, kl=2, kd=3, kdd=1)
    s.sh(P([(322, 104), (334, 92), (336, 94), (324, 108)]), STEEL, kl=1, kd=1, kdd=0)
    s.sh(R(303, 87, 311, 92) | R(306, 84, 308, 87), STEEL, kl=1, kd=1, kdd=0)
    s.put(L(curve((292, 96), (322, 96), -14)), '#4a4a52')
    for st, (sx, sy) in enumerate([(336, 89), (338, 85), (337, 81), (339, 77), (338, 73), (308, 80), (310, 76), (309, 72)]):
        s.px(sx, sy, '#ffffff' if st % 2 else '#e0e6ee')
    # water purifier
    s.sh(R(420, 50, 446, 96), pal('#ffffff', '#eef2f6', '#c8d0da', '#a8b2c0', '#3a4250'), kl=1, kd=2, kdd=1)
    s.put(R(424, 58, 442, 70), '#4aa8e8')
    s.put(R(426, 60, 432, 62), '#c8e8ff')
    s.sh(R(431, 96, 435, 100), STEEL, kl=0, kd=1, kdd=0)
    wall_clock(s, 380, 50, 9, t=(1, 20))
    ceiling_fan(s, 110)
    ceiling_fan(s, 370)
    # long tables
    _long_table(s, 6, 134, [('g', 20), ('c', 34), ('p', 60), ('g', 88), ('c', 100), ('g', 118)], seed=1)
    _long_table(s, 346, 474, [('c', 360), ('g', 372), ('p', 400), ('g', 428), ('g', 440), ('c', 458)], seed=2)
    return s


# ================================================================== 17  TURF (night)
def turf():
    s = Scene(17)
    G = 182
    rng = random.Random(17)
    s.sky(['#080c26', '#0e1438', '#16204a', '#202a5e', '#2e3470'], 0, G, sharp=3)
    for _ in range(90):
        x, y = rng.randint(0, W - 1), rng.randint(0, 110)
        s.px(x, y, rng.choice(['#ffffff', '#c8d8ff', '#8a9ad8']))
    for (x, y) in ((60, 20), (300, 14), (420, 40)):
        s.put(R(x - 1, y, x + 1, y) | R(x, y - 1, x, y + 1), '#ffffff')
    moon = O(392, 26, 9) & ~O(396, 23, 8)
    s.put(moon, '#fff4c8')
    # city silhouette
    x = -4
    while x < W:
        bw, bh = rng.randint(12, 26), rng.randint(14, 48)
        m = R(x, G - 18 - bh, x + bw, G)
        s.put(m, '#141836')
        for _ in range(bw * bh // 30):
            s.px(rng.randint(x + 1, x + bw - 1), rng.randint(G - 16 - bh, G - 20), rng.choice(['#f8d070', '#ffe6a0', '#8a90c8']))
        x += bw + rng.randint(-2, 3)
    s.put(R(0, G - 20, W - 1, G), '#10142c')
    # floodlight towers
    TW = pal('#9aa2b8', '#6a7288', '#4a5268', None, '#1a1e2a')
    heads = []
    for tx in (34, 446):
        s.sh(R(tx - 2, 36, tx + 2, G), TW, kl=1, kd=2, kdd=0, d=(1, 0))
        for yy in range(48, G, 14):
            s.put(L([(tx - 2, yy), (tx + 2, yy + 7)]) | L([(tx + 2, yy), (tx - 2, yy + 7)]), TW['d'])
        hm = R(tx - 18, 14, tx + 18, 34)
        heads.append((tx, hm))
    for tx, hm in heads:
        beam = P([(tx - 16, 34), (tx + 16, 34), (240 + (tx - 240) * 0.1 + 80, G + 60), (240 + (tx - 240) * 0.1 - 80, G + 60)])
        lighten(s, beam & R(0, 0, W - 1, G - 1), 0.07, '#fff8d8')
    for tx, hm in heads:
        glow(s, tx, 24, 34, '#fff8d0', 0.35)
        s.sh(hm, TW, kl=1, kd=1, kdd=0)
        for j in range(2):
            for i in range(4):
                lx, ly = tx - 15 + i * 8, 16 + j * 9
                s.put(R(lx, ly, lx + 5, ly + 6), '#fffbe0')
                s.put(R(lx + 1, ly + 1, lx + 3, ly + 3), '#ffffff')
    # turf
    TA, TB = C('#3cb04a'), C('#34a042')
    vy = G - 60
    for y in range(G, H):
        band = int(1400 / (y - vy)) % 2
        s.a[y, :] = TA if band else TB
    pitch = P([(224, G), (256, G), (300, H), (180, H)])
    s.put(pitch, '#8cc87a')
    s.put(pitch & ~shift(pitch, 1, 0) | pitch & ~shift(pitch, -1, 0), '#a8dc96')
    for yy, w in ((G + 6, 2), (H - 16, 3)):
        hw = 16 + (yy - G) * 0.68
        s.put(R(240 - hw - 6, yy, 240 + hw + 6, yy + w - 1), '#f4f4ec')
    for yy in (G + 2,):
        s.put(R(222, yy, 258, yy), '#f4f4ec')
    for sx in (237, 240, 243):
        s.put(R(sx, G - 8, sx, G + 3), '#f4e8c8')
        s.px(sx, G + 3, '#8a7a5a')
    s.put(R(237, G - 9, 243, G - 9), '#f4e8c8')
    s.put(R(0, G, W - 1, G), '#f4f4ec')
    # light pool / vignette
    xs = np.arange(W)[None, :]
    ys = np.arange(G, H)[:, None]
    f = 1 - 0.35 * ((np.abs(xs - 240) / 260.0) ** 2) - 0.08 * ((ys - G) / 90.0)
    f = np.floor(f * 8 + BT[G:H]) / 8.0
    reg = s.a[G:H, :, :3].astype(float) * f[..., None]
    s.a[G:H, :, :3] = np.clip(reg, 0, 255).astype(np.uint8)
    # netting
    NET = C('#2a7a52')[:3].astype(float)
    yy, xx = np.indices((H, W))
    mesh = (((xx + yy) % 7 == 0) | ((xx - yy) % 7 == 0)) & (yy >= 30) & (yy < G)
    side = (P([(0, 30), (16, 30), (16, G), (0, G + 44)]) | P([(W - 17, 30), (W - 1, 30), (W - 1, G + 44), (W - 17, G)]))
    mesh |= side & (((xx + yy) % 5 == 0) | ((xx - yy) % 5 == 0))
    sub = s.a[mesh][:, :3].astype(float)
    s.a[mesh, :3] = (sub * 0.45 + NET * 0.55).astype(np.uint8)
    POLE = pal('#4a7a5a', '#2a5a3e', '#1e4430', None, '#0a1a10')
    for px_ in (16, 128, 240, 352, 463):
        s.sh(R(px_ - 1, 28, px_ + 1, G + 2), POLE, kl=0, kd=1, kdd=0, d=(1, 0))
    for a, b in ((16, 128), (128, 240), (240, 352), (352, 463)):
        s.put(L(curve((a, 30), (b, 30), 4)), '#3a9a6a')
    # scoreboard
    sb = R(286, 48, 372, 100)
    s.put(R(310, 100, 312, 120) | R(346, 100, 348, 120), '#2a2e3a')
    s.sh(sb, pal('#5a5e6e', '#2a2e3a', '#1c1e28', None, '#06070a'), kl=1, kd=1, kdd=0)
    s.put(R(290, 52, 368, 96), '#08090e')
    m1 = text(s, '64/2', 329, 56, '#ffb030', sc=2, sp=1, center=True)
    m2 = text(s, '6.3', 314, 78, '#40f070', sc=2, sp=1, center=True)
    s.dith(dilate(m1 | m2, True) & ~(m1 | m2) & R(290, 52, 368, 96), '#3a2a10', 0.5)
    for k in range(6):
        c = '#ffffff' if k < 3 else '#2a2e3a'
        s.put(O(340 + (k % 3) * 8, 82 + (k // 3) * 7, 2), c)
    # props: bat leaning on the net, bottle, kit bag
    bat = P([(70, G + 2), (75, G + 2), (86, G - 24), (82, G - 26)])
    s.sh(bat, pal('#fff0c8', '#e8cc90', '#c0a060', None, '#4a3818'), kl=1, kd=1, kdd=0)
    s.put(L([(84, G - 25), (90, G - 38)], 2), '#3a3a44')
    s.sh(R(98, G - 12, 103, G + 2) | R(99, G - 14, 102, G - 13), pal('#9ad8ff', '#3a8ad8', '#2a6ab8', None, '#0a1a3a'), kl=1, kd=1, kdd=0)
    kb = R(106, G - 8, 134, G + 4) & ~R(106, G - 8, 106, G - 8) & ~R(134, G - 8, 134, G - 8)
    s.shadow(E(104, G + 2, 140, G + 7))
    s.sh(kb, pal('#5a8af0', '#2a5ad0', '#1e44a8', None, '#0a1440'), kl=1, kd=2, kdd=1)
    s.put(R(108, G - 2, 132, G - 2), '#f0c030')
    return s


# ================================================================== 18  UNIVERSITY GATE
def campus():
    s = Scene(18)
    G = 184
    s.sky(SKY_DAY, 0, G)
    for x, y, w, sd in [(18, 40, 76, 81), (390, 28, 74, 82), (300, 64, 40, 83)]:
        cloud(s, x, y, w, seed=sd)
    # campus beyond the gate
    BRK = pal('#f0a080', '#cc6a4c', '#a8503a', '#86402e', '#3a1810')
    for tx, r in ((20, 22), (62, 26), (100, 20), (380, 22), (420, 26), (462, 22)):
        tree(s, tx, G - 30, r, p=LEAF_DK, shadow=False)
    s.sh(R(150, 96, 330, G - 20), BRK, kl=1, kd=2, kdd=1)
    for wx in range(158, 326, 14):
        for wy in (104, 128, 148):
            s.put(R(wx, wy, wx + 7, wy + 12), '#ffffff')
            s.put(R(wx + 1, wy + 1, wx + 6, wy + 11), '#4a5a80')
    s.sh(R(146, 92, 334, 96), STONE, kl=1, kd=1, kdd=0, d=(0, 1))
    s.put(R(150, G - 24, 330, G - 20), '#e8e0d0')
    lawn = R(0, G - 20, W - 1, G)
    s.put(lawn, GRASS['b'])
    s.put(P([(226, G - 20), (254, G - 20), (270, G), (210, G)]), '#8a8a96')
    # compound walls with railings
    CW = pal('#fff4e0', '#f0dcc0', '#d0b898', '#b09878', '#4a3c2a')
    for x0, x1 in ((0, 114), (366, W - 1)):
        s.sh(R(x0, 150, x1, G - 1), CW, kl=1, kd=0, kdd=0)
        s.put(R(x0, 150, x1, 152), '#c86a4a')
        for bx in range(x0 + 2, x1, 6):
            s.put(R(bx, 124, bx + 1, 150), '#2a2e3a')
            s.put(R(bx, 122, bx + 1, 123), '#c8a040')
        s.put(R(x0, 128, x1, 129) | R(x0, 144, x1, 145), '#2a2e3a')
        for px_ in range(x0 + 20, x1, 46):
            s.sh(R(px_, 118, px_ + 6, G - 1), CW, kl=1, kd=2, kdd=1, d=(1, 0))
            s.sh(R(px_ - 1, 115, px_ + 7, 118), BRK, kl=1, kd=1, kdd=0, d=(0, 1))
    # gate
    SAND = pal('#fff0d0', '#f2d6a8', '#d8b480', '#b89260', '#4a3418')
    body = R(112, 40, 368, G - 1) & ~P(arch_pts(162, 318, 116, G + 2, 34))
    s.sh(body, SAND, kl=1, kd=0, kdd=0)
    op = P(arch_pts(162, 318, 116, G + 2, 34))
    s.put(dilate(op) & body & ~op, SAND['dd'])
    s.put(dilate(dilate(op)) & body & ~dilate(op), SAND['d'])
    for x0, x1 in ((112, 162), (318, 368)):
        s.put(R(x1 - 4, 82, x1 - 1, G - 1), SAND['d'])
        s.put(R(x0, 82, x0 + 1, G - 1), SAND['l'])
        pn = R(x0 + 10, 96, x1 - 12, 160)
        s.put(pn & ~shift(pn, 1, 1), SAND['l'])
        s.put(pn & ~shift(pn, -1, -1), SAND['dd'])
        ni = P(arch_pts(x0 + 16, x1 - 18, 112, 154, 10))
        s.put(ni, SAND['d'])
        s.put(ni & ~shift(ni, 1, 1), SAND['dd'])
        s.sh(R(x0 - 3, G - 8, x1 + 3, G - 1), SAND, kl=1, kd=1, kdd=1, d=(0, 1))
        lamp(s, (x0 + x1) // 2, 92, 4, glow=None)
    s.sh(R(104, 36, 376, 41), SAND, kl=1, kd=2, kdd=1, d=(0, 1))
    s.sh(R(106, 80, 374, 84), SAND, kl=1, kd=1, kdd=1, d=(0, 1))
    pnl = R(118, 46, 362, 75)
    s.sh(pnl, pal('#a8504a', '#7a2a2a', '#601e20', '#4a1618', '#1e0606'), kl=1, kd=2, kdd=1)
    s.put(R(121, 49, 359, 72) & ~R(122, 50, 358, 71), '#e8b850')
    text(s, 'UNIVERSITY CAMPUS', 240, 54, '#ffe8a0', sc=2, sp=1, shadow='#1e0606', center=True)
    for cx in (137, 343):
        s.sh(R(cx - 14, 30, cx + 14, 36), SAND, kl=1, kd=1, kdd=0, d=(0, 1))
        for px_ in (cx - 12, cx - 4, cx + 3, cx + 10):
            s.sh(R(px_, 20, px_ + 1, 30), SAND, kl=0, kd=1, kdd=0, d=(1, 0))
        s.sh(R(cx - 16, 17, cx + 16, 20), SAND, kl=1, kd=1, kdd=0, d=(0, 1))
        s.sh(P(onion_pts(cx, 0, 18, 12, pinch=0.6, p=0.85)), SAND, kl=1, kd=3, kdd=1)
    s.sh(P(onion_pts(240, 12, 36, 14, pinch=0.6, p=0.85)) | R(226, 32, 254, 36), SAND, kl=1, kd=3, kdd=1)
    s.put(R(240, 4, 240, 12), GOLD['d'])
    s.sh(O(240, 6, 2), GOLD, kl=1, kd=1, kdd=0)
    # boom barrier
    s.sh(R(296, G - 22, 302, G - 1), pal('#ffd878', '#f0b030', '#c88a20', None, '#3a2808'), kl=1, kd=1, kdd=0)
    arm = R(196, G - 22, 296, G - 19)
    s.put(arm, '#ffffff')
    for k in range(196, 296, 12):
        s.put(R(k, G - 22, k + 5, G - 19), '#e02a2a')
    s.outline(arm, '#2a1a1a')
    # security cabin
    s.shadow(E(396, G - 2, 452, G + 5))
    cab = R(400, 128, 446, G - 1)
    s.sh(cab, pal('#ffffff', '#eef0f4', '#c8ccd6', '#a8aeba', '#3a3e48'), kl=1, kd=2, kdd=1)
    s.sh(P([(394, 128), (452, 128), (446, 118), (400, 118)]), pal('#7ab8ff', '#2a74d8', '#1e58b0', None, '#0c2050'), kl=1, kd=1, kdd=0, d=(0, 1))
    s.put(R(406, 138, 440, 156), '#bfe2fb')
    s.put(R(406, 138, 440, 139), '#ffffff')
    s.outline(R(406, 138, 440, 156), '#5a6070')
    s.put(R(422, 138, 423, 156), '#5a6070')
    # road + lawns
    road = P([(196, G), (284, G), (390, H), (90, H)])
    grass_tex(s, R(0, G, W - 1, H - 1) & ~road, seed=18)
    s.put(road, '#7a7a86')
    rng = random.Random(18)
    for _ in range(500):
        x, y = rng.randint(90, 390), rng.randint(G, H - 1)
        if road[y, x]:
            s.px(x, y, rng.choice(['#6a6a76', '#8a8a96']))
    yy, gap = G + 4, 4.0
    on = True
    while yy < H:
        if on:
            hw = 1 + (yy - G) * 0.02
            s.put(R(240 - hw, yy, 240 + hw, min(H - 1, yy + gap * 0.6)), '#f4f4ec')
        yy += gap
        gap *= 1.25
        on = not on
    edge = road & ~shift(road, 2, 0) | road & ~shift(road, -2, 0)
    s.put(edge, '#f4f4ec')
    s.dith(R(0, G, W - 1, G + 2) & ~road, GRASS['d'], 0.5)
    for (hx0, hx1) in ((0, 160), (320, W - 1)):
        hm = R(hx0, G + 2, hx1, G + 10)
        if hx0 == 320:
            hm &= ~road
        else:
            hm &= ~road
        s.sh(hm, pal('#7ac85a', '#4a9c44', '#337a38', '#245e30', '#143420'), kl=1, kd=2, kdd=1)
    for fx in range(20, 160, 14):
        flowers(s, fx, G + 22, 3, FLOWER, seed=fx, spread=(5, 2))
    for fx in range(340, 470, 14):
        flowers(s, fx, G + 22, 3, FLOWER, seed=fx, spread=(5, 2))
    for lx in (80, 400):
        lamp(s, lx, G + 10, 64)
    return s


# ================================================================== 20  OFFICE LOBBY
def office_lobby():
    s = Scene(20)
    CE = 10
    s.sky(SKY_DAY, 0, FL)
    rng = random.Random(20)
    for x, y, w, sd in [(40, 50, 70, 91), (330, 30, 80, 92)]:
        cloud(s, x, y, w, seed=sd)
    for (x0, x1, top, p) in [(10, 70, 40, pal('#c8ecfc', '#8ac8f0', '#6aa8dc', '#4a88c0', '#2a4a70')),
                             (300, 350, 26, pal('#c8f4ec', '#80d4c8', '#5ab4aa', '#3a948c', '#1a4a46')),
                             (360, 440, 60, pal('#d8e4f8', '#a8bce8', '#8aa0d4', '#6a80b8', '#2a3a68')),
                             (440, 490, 34, pal('#c8ecfc', '#8ac8f0', '#6aa8dc', '#4a88c0', '#2a4a70'))]:
        m = R(x0, top, x1, FL)
        s.sh(m, p, kl=1, kd=5, kdd=1, d=(1, 0), ol=False)
        for yy in range(top + 4, FL, 6):
            s.put(R(x0 + 1, yy, x1 - 6, yy) & m, p['l'])
    for tx in range(-10, W, 22):
        tree(s, tx, FL - 2, 12, p=LEAF, shadow=False)
    out = R(0, CE, W - 1, FL - 1)
    lighten(s, out, 0.22, '#e8f4fa')
    for k in range(-200, W, 90):
        st = P([(k, FL), (k + 30, FL), (k + 30 + 170, CE), (k + 170, CE)]) & out
        lighten(s, st, 0.10)
    MUL = pal('#8a92a4', '#5a6274', '#444a5a', None, '#1e2230')
    for mx in range(0, W + 1, 80):
        s.sh(R(mx - 2, CE, mx + 1, FL - 1), MUL, kl=1, kd=1, kdd=0, d=(1, 0))
    s.put(R(0, 92, W - 1, 93), MUL['b'])
    s.put(R(0, 94, W - 1, 94), MUL['d'])
    s.put(R(0, 0, W - 1, CE - 1), '#fafafa')
    s.put(R(0, CE - 1, W - 1, CE - 1), '#c8ccd4')
    # wooden slat feature wall with vertical garden
    SL = pal('#e8c494', '#c89a64', '#a07848', '#7e5a34', '#2e1e10')
    fw = R(150, CE, 314, FL - 1)
    s.put(fw, SL['b'])
    for x in range(150, 315, 5):
        s.put(R(x, CE, x, FL - 1), SL['d'])
        s.put(R(x + 1, CE, x + 1, FL - 1), SL['l'])
    s.shadow(R(315, CE, 320, FL - 1))
    gd = R(174, 30, 290, 112)
    s.put(gd, '#2e6a3a')
    for _ in range(700):
        x, y = rng.randint(174, 290), rng.randint(30, 112)
        s.px(x, y, rng.choice(['#4ea446', '#3a8a3c', '#6ac05a', '#8ad070', '#2a6e32']))
    for _ in range(90):
        cx, cy = rng.randint(177, 287), rng.randint(33, 109)
        lm = E(cx - 2, cy - 1, cx + 2, cy + 1) if rng.random() < 0.6 else E(cx - 1, cy - 2, cx + 1, cy + 2)
        s.put(lm, rng.choice(['#8ad070', '#6ac05a', '#a8e080']))
        s.px(cx, cy + 2, '#1e4a28')
    s.outline(gd, '#5a3a20')
    s.put(R(172, 28, 292, 28), '#3a2a18')
    for k in range(5):
        glow(s, 186 + k * 23, 22, 6, '#fff8e0', 0.5)
        s.put(R(184 + k * 23, 18, 188 + k * 23, 19), '#fffbe8')
    # pendant lights
    for px_ in (60, 110, 360, 410):
        s.put(R(px_, CE, px_, 34), '#5a5a64')
        s.sh(E(px_ - 8, 34, px_ + 8, 41) & R(0, 0, W - 1, 38), pal('#fff4c8', '#f0d070', '#c8a040', None, '#3a2a08'), kl=1, kd=1, kdd=0)
        glow(s, px_, 42, 10, '#fff8d0', 0.4)
    # reception desk
    s.shadow(E(146, FL - 3, 326, FL + 6))
    dk = R(152, 140, 312, FL - 1)
    s.sh(dk, pal('#ffffff', '#f4f4f6', '#d4d6dc', '#b4b8c2', '#3a3e48'), kl=1, kd=3, kdd=1)
    s.sh(P([(148, 134), (316, 134), (318, 140), (146, 140)]), pal('#ffffff', '#e8eaee', '#c4c8d0', None, '#3a3e48'), kl=1, kd=1, kdd=1, d=(0, 1))
    s.sh(R(152, 156, 312, 162), SL, kl=1, kd=1, kdd=0, d=(0, 1))
    s.put(R(152, FL - 4, 312, FL - 1), '#40c8ff')
    s.sh(R(270, 118, 292, 132), pal('#5a5a64', '#34343c', '#202026', None, '#0c0c10'), kl=1, kd=1, kdd=0)
    s.put(R(279, 132, 283, 134), '#34343c')
    potted_plant(s, 170, 134, h=14, leaf=LEAF, potc=pal('#ffffff', '#e8e8ec', '#c4c4cc', None, '#3a3a44'), seed=2)
    # turnstiles
    BR = pal('#ffffff', '#d4d8e0', '#a8aebc', '#8a90a0', '#2e3240')
    for k in range(4):
        x = 338 + k * 36
        s.shadow(R(x, FL - 1, x + 12, FL + 3))
        s.sh(R(x, 146, x + 8, FL - 1), BR, kl=1, kd=2, kdd=1)
        s.put(R(x, 144, x + 8, 145), '#40c8ff')
        s.dith(R(x - 2, 140, x + 10, 143), '#a8e8ff', 0.4)
        s.put(R(x + 2, 152, x + 6, 155), '#2a2e3a')
        s.px(x + 4, 153, '#40f070')
        if k < 3:
            for fx0, fx1 in ((x + 9, x + 21), (x + 23, x + 35)):
                fm = R(fx0, 150, fx1, 166)
                lighten(s, fm, 0.35, '#e0f4ff')
                s.outline(fm, '#a8d0e8')
    # lounge
    SO = pal('#a8b0bc', '#7e8898', '#646e7e', '#4e5868', '#1e2430')
    s.shadow(E(14, FL - 3, 132, FL + 5))
    s.sh(R(18, 140, 124, 160), SO, kl=1, kd=2, kdd=1)
    s.sh(R(14, 158, 128, 172), SO, kl=1, kd=2, kdd=1, d=(0, 1))
    for ax0 in (12, 120):
        s.sh(R(ax0, 146, ax0 + 10, 172), SO, kl=1, kd=2, kdd=1)
    for lx in (18, 120):
        s.put(R(lx, 172, lx + 2, FL - 1), '#2a2a30')
    for cx in (40, 98):
        s.sh(R(cx - 9, 144, cx + 9, 158), pal('#ffe08a', '#f0b830', '#c89020', None, '#4a3008'), kl=1, kd=2, kdd=1)
    potted_plant(s, 140, FL + 1, h=40, kind='tall', potc=pal('#ffffff', '#e8e8ec', '#c4c4cc', None, '#3a3a44'), seed=7)
    # floor: marble + soft reflection
    src_img = s.a.copy()
    persp_tiles(s, FL, H, 240, FL - 80, '#f4f4f6', '#ecedf0', '#d4d6dc', su=2.6, sv=1500)
    fbase = C('#eceef2')[:3].astype(float)
    for y in range(FL + 1, H):
        sy = FL - (y - FL)
        if sy < CE:
            break
        a = 0.55 * (1 - (y - FL) / 60.0)
        if a <= 0:
            break
        sel = BT[y] < a
        refl = (src_img[sy, :, :3].astype(float) * 0.3 + fbase * 0.7).astype(np.uint8)
        s.a[y, sel, :3] = refl[sel]
    s.put(R(0, FL, W - 1, FL), '#b4b8c2')
    for k in range(0, W, 80):
        lighten(s, P([(k + 6, FL + 1), (k + 50, FL + 1), (k + 10, H - 1), (k - 40, H - 1)]), 0.08, '#fffbe8')
    return s


# ================================================================== 21  MARKET TERMINAL (night, small flat)
def _night_window(s, x0, y0, x1, y1, seed=21):
    rng = random.Random(seed)
    frame = pal('#4a7a68', '#2e5a4a', '#22463a', '#18342a', '#0c1a14')
    inner = R(x0 + 5, y0 + 5, x1 - 5, y1 - 5)
    ix0, iy0, ix1, iy1 = x0 + 5, y0 + 5, x1 - 5, y1 - 5
    s.sh(R(x0, y0, x1, y1) & ~inner, frame, kl=1, kd=1, kdd=0)
    s.outline(inner, frame['dd'])
    sub = Scene()
    sub.sky(['#080c22', '#10163a', '#1c2050', '#2c2a64'], iy0, iy1 + 1, sharp=3)
    s.a[inner] = sub.a[inner]
    for _ in range(16):
        s.px(rng.randint(ix0, ix1), rng.randint(iy0, iy0 + 30), rng.choice(['#ffffff', '#c8d8ff', '#8a9ad8']))
    s.put(O(ix1 - 12, iy0 + 10, 4) & ~O(ix1 - 10, iy0 + 8, 4) & inner, '#fff4c8')
    x = ix0 - 3
    while x < ix1:
        bw, bh = rng.randint(7, 15), rng.randint(10, 36)
        m = R(x, iy1 - bh, x + bw, iy1) & inner
        s.put(m, '#141834')
        for _ in range(bw * bh // 14):
            wx, wy = rng.randint(x + 1, x + bw - 2), rng.randint(iy1 - bh + 2, iy1 - 2)
            s.put(R(wx, wy, wx + 1, wy) & inner, rng.choice(['#ffd870', '#ffe6a0', '#f8b860', '#8a90c8']))
        x += bw + rng.randint(0, 2)
    # tiny Charminar on the skyline
    cx, by = ix0 + 34, iy1
    cm = R(cx - 7, by - 15, cx + 7, by) | R(cx - 9, by - 26, cx - 7, by) | R(cx + 7, by - 26, cx + 9, by)
    cm |= O(cx - 8, by - 27, 2) | O(cx + 8, by - 27, 2)
    s.put(cm & inner, '#22264e')
    s.put(P(arch_pts(cx - 3, cx + 3, by - 6, by, 4)) & inner, '#ffcf70')
    for k in (cx - 5, cx - 1, cx + 3):
        s.put(R(k, by - 12, k + 1, by - 11) & inner, '#ffcf70')
    # mosquito mesh + grill
    grill = NONE()
    for gx in range(x0 + 12, x1 - 6, 9):
        grill |= R(gx, iy0, gx, iy1)
    grill |= R(ix0, (y0 + y1) // 2, ix1, (y0 + y1) // 2)
    yy, xx = np.indices((H, W))
    mesh = inner & ~grill & (((yy + xx) % 2) == 0)
    s.a[mesh, :3] = (s.a[mesh][:, :3].astype(float) * 0.82).astype(np.uint8)
    s.put(grill & inner, frame['d'])
    s.sh(R(x0 - 5, y1 + 1, x1 + 5, y1 + 5), pal('#8a8aa8', '#6a6a88', '#4a4a68', None, '#1a1a2a'), kl=1, kd=1, kdd=0, d=(0, 1))
    return inner


def _bookshelf(s, x0, x1, top):
    rng = random.Random(7)
    WD = pal('#c88a50', '#9a5e30', '#7a4420', '#5e321a', '#24140a')
    s.shadow(E(x0 - 2, FL - 3, x1 + 10, FL + 5))
    s.sh(R(x0, top, x1, FL - 1), WD, kl=1, kd=2, kdd=1)
    for sy in range(top + 6, FL - 8, 22):
        cav = R(x0 + 3, sy, x1 - 3, sy + 17)
        s.put(cav, '#3e2616')
        s.put(cav & ~shift(cav, 0, 2), '#2a180c')
        bx = x0 + 4
        while bx < x1 - 6:
            bw, bh = rng.randint(2, 4), rng.randint(10, 16)
            if rng.random() < 0.12:
                bx += 3
                continue
            c = rng.choice(['#d84a3a', '#3a6ad0', '#40a060', '#f0b030', '#a060c0', '#e8e0d0', '#2a8a8a'])
            bm = R(bx, sy + 17 - bh, bx + bw - 1, sy + 16)
            s.put(bm, c)
            s.put(R(bx, sy + 17 - bh, bx, sy + 16), mix(c, '#ffffff', 0.35))
            s.put(R(bx, sy + 17 - bh + 2, bx + bw - 1, sy + 17 - bh + 2), mix(c, '#000000', 0.3))
            bx += bw + 1
        s.put(R(x0 + 3, sy + 17, x1 - 3, sy + 18), WD['l'])


def market_terminal():
    s = Scene(21)
    wall = pal('#efe4d2', '#e2d4bc', '#c8b898')
    room(s, wall, floor=('#d8ccb4', '#cec0a6', '#ae9e82'), skirt='#8a7458')
    tube_light(s, 206, 276, 22, lit=False)
    ceiling_fan(s, 330)
    _curtain(s, 18, 40, 38, 140, '#7a8ad8', '#5a6ab8', seed=4)
    wall_clock(s, 300, 64, 9, t=(11, 50))
    _calendar(s, 330, 80, 'hill')
    switchboard(s, 138, 108, 20, 16)
    _bookshelf(s, 402, 462, 66)
    # rug + study table
    _rug(s, 136, 290, 186, 202, '#5a6ab8', '#e8b850')
    WD = pal('#d8a068', '#b07c48', '#8a5a32', '#6a4226', '#2e1a10')
    s.shadow(E(140, FL - 3, 312, FL + 6))
    for lx in (146, 294):
        s.sh(R(lx, 150, lx + 3, FL), WD, kl=0, kd=1, kdd=0, d=(1, 0))
    s.put(R(150, 166, 294, 167), WD['d'])
    s.sh(P([(146, 138), (298, 138), (302, 146), (142, 146)]), WD, kl=1, kd=1, kdd=1, d=(0, 1))
    s.sh(R(142, 147, 302, 150), WD, kl=0, kd=1, kdd=0, d=(0, 1))
    # desk lamp
    s.sh(E(150, 139, 166, 144), IRON, kl=1, kd=1, kdd=0)
    s.put(L([(158, 140), (155, 128), (160, 120)], 2), IRON['b'])
    shade = P([(152, 112), (166, 112), (170, 121), (148, 121)])
    s.sh(shade, pal('#ffd890', '#e8a040', '#c07a28', None, '#3a2408'), kl=1, kd=1, kdd=0)
    # laptop
    lid = R(196, 92, 254, 133)
    s.sh(lid, pal('#6a6e7a', '#3a3e48', '#2a2e36', None, '#101218'), kl=1, kd=1, kdd=0)
    base = P([(200, 134), (250, 134), (258, 142), (192, 142)])
    s.sh(base, pal('#9a9eaa', '#7a7e8a', '#5a5e6a', None, '#16181e'), kl=1, kd=1, kdd=0, d=(0, 1))
    for ky in (136, 138):
        s.put(L([(200 - (ky - 134), ky), (250 + (ky - 134), ky)]) & base, '#5a5e6a')
    s.put(R(219, 140, 231, 141), '#8a8e9a')
    # phone, chai, newspaper
    s.put(P([(168, 140), (184, 140), (186, 144), (166, 144)]), '#1c1c24')
    glass_m = P([(268, 132), (277, 132), (276, 143), (269, 143)])
    s.put(glass_m, '#e8f4f8')
    s.put(glass_m & R(0, 135, W - 1, H - 1), '#a8642c')
    s.put(glass_m & R(0, 135, W - 1, 135), '#d8a070')
    for gx in (270, 273):
        s.put(R(gx, 136, gx, 142) & glass_m, '#c88a4c')
    s.outline(glass_m, '#7a8a90')
    npm = P([(282, 139), (298, 139), (300, 144), (280, 144)])
    s.put(npm, '#ecebe2')
    for yy in (140, 142):
        s.put(R(284, yy, 296, yy) & npm, '#a8a8a0')
    s.outline(npm, '#8a8a80')

    # ---- night: dim the room, then bring back every light source
    tint_all(s, (0.42, 0.45, 0.70))
    win = _night_window(s, 40, 40, 130, 134)
    lighten(s, P([(45, FL + 1), (125, FL + 1), (200, H - 1), (95, H - 1)]), 0.10, '#8aa8ff')
    lighten(s, P([(130, 60), (148, 60), (170, 134), (140, 134)]), 0.06, '#8aa8ff')
    # lamp: warm pool
    glow(s, 159, 122, 12, '#ffd890', 0.3)
    lighten(s, E(128, 112, 198, 160), 0.16, '#ffc870')
    lighten(s, E(140, 124, 186, 150), 0.10, '#ffc870')
    s.put(R(153, 121, 165, 122), '#fff4c0')
    s.put(R(156, 123, 162, 124), '#fffbe8')
    # laptop screen + its cool glow
    lighten(s, E(180, 84, 270, 148) & ~lid, 0.06, '#7aa8ff')
    scr = R(199, 95, 251, 129)
    s.put(scr, '#0c1424')
    s.put(R(199, 95, 251, 99), '#1e2a48')
    for k, c in enumerate(('#48b048', '#e04848', '#f0c040')):
        s.put(R(201 + k * 6, 96, 205 + k * 6, 98), c)
    for gy in (106, 114, 122):
        for gx in range(200, 251, 3):
            s.px(gx, gy, '#1a2640')
    candles = [(120, 116), (116, 118), (118, 112), (112, 109), (109, 111), (111, 105), (105, 108), (108, 115), (115, 119)]
    ma = []
    for k, (o, c) in enumerate(candles):
        cx = 203 + k * 5
        up = c < o
        col, wick = ('#48d048', '#2a8a3a') if up else ('#f05050', '#a02a2a')
        top, bot = min(o, c), max(o, c)
        s.put(R(cx + 1, top - 2, cx + 1, bot + 2), wick)
        s.put(R(cx, top, cx + 2, bot), col)
        ma.append((cx + 1, (o + c) / 2 - 1))
    s.put(L(ma), '#f0c040')
    s.px(225, 132, '#40f070')
    # phone screen (a fresh tip just arrived)
    ph = P([(169, 140), (183, 140), (184, 143), (168, 143)])
    s.put(ph, '#d8f0ff')
    s.put(R(171, 141, 177, 142), '#5cc85a')
    lighten(s, E(160, 132, 192, 150) & ~ph, 0.08, '#a8d8ff')
    # chai steam
    for (sx, sy) in ((272, 129), (273, 127), (272, 125), (271, 123), (274, 122), (275, 120)):
        s.px(sx, sy, '#c8c8e0')
    return s
