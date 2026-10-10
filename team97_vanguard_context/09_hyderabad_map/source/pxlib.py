"""pxlib - a tiny pixel-art toolkit for 480x270 game backgrounds.

How it works
------------
Every shape is a boolean mask (numpy array, True = inside the shape).
Scene.sh() paints a mask with a colour ramp, the way DS-era art is shaded:

    l  : light rim on the top-left edges (one light source, top-left)
    b  : flat base colour
    d  : dark rim on the bottom-right edges
    dd : deepest 1-px rim inside the dark band
    o  : 1-px outline drawn just outside the shape

Finished images must be scaled by whole numbers, nearest-neighbour only.
"""
import math
import random

import numpy as np
from PIL import Image, ImageDraw

W, H = 480, 270
_B4 = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], float) / 16.0
BT = np.tile(_B4, (H // 4 + 1, W // 4 + 1))[:H, :W]     # 4x4 Bayer matrix for dithering


def C(c):
    """Colour -> RGBA uint8 array. Accepts '#rrggbb', (r, g, b) or an array."""
    if isinstance(c, np.ndarray):
        return c.astype(np.uint8)
    if isinstance(c, (tuple, list)):
        return np.array(list(c)[:3] + [255], np.uint8)
    c = c.lstrip('#')
    return np.array([int(c[i:i + 2], 16) for i in (0, 2, 4)] + [255], np.uint8)


def mix(a, b, t):
    a, b = C(a).astype(float), C(b).astype(float)
    r = np.round(a + (b - a) * t)
    r[3] = 255
    return r.astype(np.uint8)


def pal(l, b, d, dd=None, o=None):
    return {'l': l, 'b': b, 'd': d, 'dd': dd, 'o': o}


def ramp(c, o='#20202c'):
    """Quick 5-tone ramp from a single base colour."""
    return pal(mix(c, '#ffffff', 0.38), C(c), mix(c, '#101030', 0.22), mix(c, '#101030', 0.4), o)


# ---------------------------------------------------------------- palettes
SKY_DAY = ['#4a9af0', '#62aef8', '#7ec2fa', '#9ed4fb', '#c2e6fc']
CLOUD = pal(None, '#ffffff', '#ddeefc', '#b8d8f4')
FAR = pal(None, '#bad3ea', '#a8c4e0')
GRASS = pal('#a8e070', '#80c858', '#5ea840', '#488c34', '#2c5a24')
LEAF = pal('#94da6a', '#5cb84c', '#3e9640', '#2c7234', '#1a3c22')
LEAF_DK = pal('#72c05a', '#4c9e46', '#357e3c', '#266232', '#143420')
TRUNK = pal('#c08a58', '#9a6838', '#74482a', '#5a3620', '#2e1a10')
PALM_TRUNK = pal('#dcb484', '#b88c5c', '#8c6440', '#6c4a2e', '#3a2414')
GRANITE = pal('#f2e6d6', '#d6c4b0', '#ae9a86', '#887461', '#4c3e34')
WATER = pal('#86c6f8', '#58a0e8', '#3c80d0', '#2c64b0', '#1c3c78')
STONE = pal('#f6eee2', '#ded2be', '#beb09a', '#9a8c78', '#4e463c')
WOOD = pal('#d8a068', '#b07c48', '#8a5a32', '#6a4226', '#2e1a10')
IRON = pal('#6a7488', '#454c5e', '#2e3444', '#20242e', '#101218')
TERRA = pal('#f4a878', '#d47444', '#ac5432', '#843c24', '#3a1a0c')
GOLD = pal('#fff2a0', '#f4c848', '#d09a2c', '#a87420', '#4a3008')


# ---------------------------------------------------------------- masks
def shift(m, dx, dy):
    """Move a mask by (dx, dy): r[y, x] = m[y - dy, x - dx]."""
    r = np.zeros_like(m)
    h, w = m.shape
    if abs(dx) >= w or abs(dy) >= h:
        return r
    r[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] = \
        m[max(-dy, 0):h + min(-dy, 0), max(-dx, 0):w + min(-dx, 0)]
    return r


def dilate(m, diag=False):
    r = m | shift(m, 1, 0) | shift(m, -1, 0) | shift(m, 0, 1) | shift(m, 0, -1)
    if diag:
        r = r | shift(m, 1, 1) | shift(m, -1, 1) | shift(m, 1, -1) | shift(m, -1, -1)
    return r


class Mk:
    """Mask builder; shapes are drawn aliased, so every pixel stays crisp."""

    def __init__(s):
        s.im = Image.new('L', (W, H), 0)
        s.d = ImageDraw.Draw(s.im)

    def poly(s, pts, v=255):
        s.d.polygon([(round(x), round(y)) for x, y in pts], fill=v)
        return s

    def rect(s, x0, y0, x1, y1, v=255):
        s.d.rectangle([round(min(x0, x1)), round(min(y0, y1)), round(max(x0, x1)), round(max(y0, y1))], fill=v)
        return s

    def ell(s, x0, y0, x1, y1, v=255):
        x0, x1 = sorted((round(x0), round(x1)))
        y0, y1 = sorted((round(y0), round(y1)))
        s.d.ellipse([x0, y0, x1, y1], fill=v)
        return s

    def circ(s, cx, cy, r, v=255):
        return s.ell(cx - r, cy - r, cx + r, cy + r, v)

    def line(s, pts, w=1, v=255):
        s.d.line([(round(x), round(y)) for x, y in pts], fill=v, width=w)
        return s

    @property
    def m(s):
        return np.array(s.im) > 127


def R(x0, y0, x1, y1): return Mk().rect(x0, y0, x1, y1).m
def P(pts): return Mk().poly(pts).m
def E(x0, y0, x1, y1): return Mk().ell(x0, y0, x1, y1).m
def O(cx, cy, r): return Mk().circ(cx, cy, r).m
def L(pts, w=1): return Mk().line(pts, w).m
def NONE(): return np.zeros((H, W), bool)


# ---------------------------------------------------------------- geometry
def arch_pts(x0, x1, ys, yb, h, n=12):
    """Pointed (two-centred) arch: sides x0..x1, springs at ys, apex h above, floor at yb."""
    w = (x1 - x0) / 2.0
    h = max(h, w)
    rr = (h * h + w * w) / (2 * w)
    ta = math.acos(max(-1.0, min(1.0, (w - rr) / rr)))
    pts = [(x0, yb), (x0, ys)]
    for i in range(1, n + 1):
        th = math.pi + (ta - math.pi) * i / n
        pts.append((x0 + rr + rr * math.cos(th), ys - rr * math.sin(th)))
    for i in range(1, n + 1):
        th = (math.pi - ta) * (1 - i / n)
        pts.append((x1 - rr + rr * math.cos(th), ys - rr * math.sin(th)))
    pts.append((x1, yb))
    return pts


def onion_pts(cx, yt, yb, rr, pinch=0.82, p=1.3, n=30):
    """Onion / bulb dome outline from tip (yt) to base (yb), max half-width rr."""
    right, left = [], []
    for i in range(n + 1):
        u = i / n
        r = rr * (math.sin(math.pi * u * pinch) ** p)
        y = yt + (yb - yt) * u
        right.append((cx + r, y))
        left.append((cx - r, y))
    return right + left[::-1]


def frond_pts(x, y, ln, ang, droop=0.5, wmax=3.2, n=12):
    a = math.radians(ang)
    cl = []
    for i in range(n + 1):
        t = i / n
        cl.append((x + ln * math.cos(a) * t, y - ln * math.sin(a) * t + droop * ln * t * t))
    up, dn = [], []
    for i, (cx, cy) in enumerate(cl):
        t = i / n
        j0, j1 = max(0, i - 1), min(n, i + 1)
        tx, ty = cl[j1][0] - cl[j0][0], cl[j1][1] - cl[j0][1]
        ln_ = math.hypot(tx, ty) or 1
        nx, ny = -ty / ln_, tx / ln_
        wv = wmax * math.sin(math.pi * min(1.0, t * 1.1)) if t > 0 else 0.6
        up.append((cx + nx * wv, cy + ny * wv))
        dn.append((cx - nx * wv, cy - ny * wv))
    return up + dn[::-1]


def curve(p0, p1, sag, n=None):
    (x0, y0), (x1, y1) = p0, p1
    n = n or max(2, int(abs(x1 - x0)))
    return [(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n + sag * 4 * (i / n) * (1 - i / n)) for i in range(n + 1)]


# ---------------------------------------------------------------- scene
class Scene:
    def __init__(s, seed=0, transparent=False):
        s.a = np.zeros((H, W, 4), np.uint8)
        if not transparent:
            s.a[..., 3] = 255
        s.rng = random.Random(seed)

    def put(s, m, c):
        if c is None:
            return
        s.a[m] = C(c)

    def px(s, x, y, c, m=None):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < W and 0 <= y < H and (m is None or m[y, x]):
            s.a[y, x] = C(c)

    def dith(s, m, c, level):
        s.a[m & (BT < level)] = C(c)

    def sh(s, m, p, kl=1, kd=2, kdd=1, d=(1, 1), ld=None, ol=True):
        s.put(m, p['b'])
        dx, dy = d
        if kd and p.get('d') is not None:
            s.put(m & ~shift(m, -kd * dx, -kd * dy), p['d'])
        if kdd and p.get('dd') is not None:
            s.put(m & ~shift(m, -kdd * dx, -kdd * dy), p['dd'])
        if kl and p.get('l') is not None:
            lx, ly = ld if ld else d
            s.put(m & ~shift(m, kl * lx, kl * ly), p['l'])
        if ol and p.get('o') is not None:
            s.put(dilate(m) & ~m, p['o'])

    def outline(s, m, c, diag=False):
        s.put(dilate(m, diag) & ~m, c)

    def shadow(s, m, f=(0.72, 0.74, 0.86)):
        sub = s.a[m][:, :3].astype(float) * np.array(f)
        s.a[m, :3] = np.clip(sub, 0, 255).astype(np.uint8)

    def sky(s, cols, y0=0, y1=H, sharp=4.0):
        cs = [C(c) for c in cols]
        n = len(cs)
        for y in range(max(0, y0), min(y1, H)):
            t = (y - y0) / max(1, (y1 - y0 - 1)) * (n - 1)
            i = min(int(t), n - 2)
            f = t - i
            f2 = min(1.0, max(0.0, (f - 0.5) * sharp + 0.5))
            sel = BT[y] < f2
            s.a[y][sel] = cs[i + 1]
            s.a[y][~sel] = cs[i]

    def reflect(s, y_line, y_end, tint, alpha=0.5, wobble=1, m=None):
        src = s.a.copy()
        tc = C(tint)[:3].astype(float)
        for y in range(y_line, min(y_end, H)):
            sy = y_line - 1 - (y - y_line)
            if sy < 0:
                break
            row = src[sy, :, :3].astype(float)
            if (y - y_line) % 2:
                row = np.roll(row, int(round(math.sin(y * 1.7) * wobble)), axis=0)
            out = (row * (1 - alpha) + tc * alpha).astype(np.uint8)
            if m is None:
                s.a[y, :, :3] = out
            else:
                sel = m[y]
                s.a[y, sel, :3] = out[sel]

    def image(s):
        return Image.fromarray(s.a, 'RGBA')

    def save(s, path, scale=1):
        im = s.image()
        if s.a[..., 3].min() == 255:
            im = im.convert('RGB')
        if scale != 1:
            im = im.resize((W * scale, H * scale), Image.NEAREST)
        im.save(path)


# ---------------------------------------------------------------- props
def cloud(s, x, y, w, seed=0, p=CLOUD):
    rng = random.Random(seed)
    mk = Mk()
    n = max(3, int(w / 15))
    for i in range(n):
        cx = x + w * (i + 0.5) / n
        mid = 1 - abs((i + 0.5) / n - 0.5) * 2
        r = (w / n) * (0.55 + 0.5 * mid) + rng.uniform(-1.0, 1.5)
        mk.circ(cx, y - r * 0.75 - mid * w * 0.07, r)
    mk.rect(x + 2, y - 4, x + w - 2, y)
    m = mk.m
    m[int(y) + 1:, :] = False
    s.put(m, p['b'])
    s.put(m & ~shift(m, 0, -3), p['d'])
    s.put(m & ~shift(m, 0, -1), p['dd'])


def grass_tex(s, m, p=GRASS, seed=0, sx=9, sy=6, dens=0.55):
    s.put(m, p['b'])
    rng = random.Random(seed)
    ys, xs = np.nonzero(m)
    if not len(ys):
        return
    for gy in range(ys.min() + 2, ys.max() + 1, sy):
        off = rng.randint(0, sx - 1)
        for gx in range(xs.min() - sx + off, xs.max() + 1, sx):
            x, y = gx + rng.randint(-2, 2), gy + rng.randint(-1, 1)
            r = rng.random()
            if r < dens:
                for dx, dy in ((-2, 0), (-1, -1), (0, 0), (1, -1), (2, 0)):
                    s.px(x + dx, y + dy, p['d'], m)
            elif r < dens + 0.18:
                s.px(x, y, p['l'], m)
                s.px(x + 1, y, p['l'], m)


def tree(s, x, y, r, p=LEAF, tp=TRUNK, th=None, shadow=True):
    """Round cauliflower tree. (x, y) = where the trunk meets the ground."""
    th = int(r * 0.55) if th is None else th
    tw = max(1, int(r * 0.2))
    if shadow:
        s.shadow(E(x - r * 0.9, y - 2, x + r * 1.3, y + max(2, r * 0.22)))
    s.sh(R(x - tw, y - th - r * 0.6, x + tw, y), tp, kl=1, kd=max(1, tw), kdd=0, d=(1, 0))
    cy = y - th - r * 0.85
    clumps = [(x - r * 0.36, cy - r * 0.45, r * 0.6), (x + r * 0.34, cy - r * 0.4, r * 0.58),
              (x - r * 0.62, cy + r * 0.12, r * 0.58), (x + r * 0.62, cy + r * 0.16, r * 0.56),
              (x, cy + r * 0.26, r * 0.68)]
    um = NONE()
    for c in clumps:
        um |= O(*c)
    s.outline(um, p['o'])
    for c in clumps:
        cr = c[2]
        s.sh(O(*c), p, kl=max(1, int(cr * 0.2)), kd=max(2, int(cr * 0.38)), kdd=1, ol=False)
    return um


def pine(s, x, y, h, w, p=LEAF_DK, tp=TRUNK, shadow=True):
    if shadow:
        s.shadow(E(x - w * 0.45, y - 2, x + w * 0.75, y + 3))
    s.sh(R(x - 1, y - h * 0.25, x + 1, y), tp, kl=0, kd=1, kdd=0, d=(1, 0))
    tiers = []
    for i in range(3):
        top = y - h + i * h * 0.24
        bot = y - h * 0.12 - (2 - i) * h * 0.21
        hw = w / 2 * (0.6 + 0.4 * (i + 1) / 3)
        tiers.append(P([(x, top), (x + hw * 0.55, (top + bot) / 2), (x + hw, bot), (x + hw * 0.4, bot - 1),
                        (x, bot + 1), (x - hw * 0.4, bot - 1), (x - hw, bot), (x - hw * 0.55, (top + bot) / 2)]))
    um = NONE()
    for t in tiers:
        um |= t
    s.outline(um, p['o'])
    for t in tiers:
        s.sh(t, p, kl=1, kd=max(2, int(w * 0.18)), kdd=1, ol=False)


def palm(s, x, y, h, lean=0.18, p=LEAF, tp=PALM_TRUNK, shadow=True):
    if shadow:
        s.shadow(E(x - 6, y - 2, x + 16, y + 3))
    mk = Mk()
    rows = []
    for i in range(int(h)):
        t = i / h
        cx = x + lean * h * t * t
        hw = 2.4 - 1.0 * t
        mk.rect(cx - hw, y - i, cx + hw, y - i)
        rows.append((cx, y - i, hw))
    tm = mk.m
    s.sh(tm, tp, kl=1, kd=2, kdd=0, d=(1, 0))
    for cx, yy, hw in rows[2::4]:
        s.put(R(cx - hw + 1, yy, cx + hw, yy) & tm, tp['dd'])
    tx, ty = rows[-1][0], rows[-1][1]
    ln = h * 0.42
    fr = []
    for ang, dr, sc in [(172, 0.55, 1), (140, 0.5, 1), (108, 0.4, 0.8), (72, 0.4, 0.8), (40, 0.5, 1),
                        (8, 0.55, 1), (205, 0.35, 0.8), (-25, 0.35, 0.8)]:
        fr.append(P(frond_pts(tx, ty, ln * sc, ang, dr, 3.2)))
    um = NONE()
    for f in fr:
        um |= f
    s.outline(um, p['o'])
    for f in fr:
        s.sh(f, p, kl=1, kd=1, kdd=0, d=(0, 1), ol=False)
    for dx in (-2, 2):
        s.sh(O(tx + dx, ty + 3, 2), pal('#c09060', '#8a6030', '#5a3c1c'), kl=1, kd=1, kdd=0, ol=False)


def boulder(s, cx, cy, rx, ry, p=GRANITE, seed=0, crack=True, shadow=True):
    m = E(cx - rx, cy - ry, cx + rx, cy + ry)
    if shadow:
        s.shadow(E(cx - rx * 0.6, cy + ry * 0.4, cx + rx * 1.25, cy + ry + 3) & ~m)
    k = min(rx, ry)
    s.sh(m, p, kl=max(1, int(k * 0.2)), kd=max(2, int(k * 0.4)), kdd=1)
    if crack and k >= 7:
        rng = random.Random(seed)
        pts = [(cx + rng.uniform(-rx * 0.3, rx * 0.3), cy - ry * 0.7)]
        for _ in range(3):
            pts.append((pts[-1][0] + rng.uniform(-3, 3), pts[-1][1] + ry * 0.35))
        s.put(L(pts) & m & ~shift(m, -2, -2), p['dd'])
    return m


def bush(s, x, y, w, p=LEAF, shadow=True):
    if shadow:
        s.shadow(E(x - w * 0.5, y - 2, x + w * 0.7, y + 2))
    cl = [(x - w * 0.26, y - w * 0.2, w * 0.3), (x + w * 0.26, y - w * 0.2, w * 0.3), (x, y - w * 0.33, w * 0.34)]
    ms = []
    for c in cl:
        m = O(*c)
        m[int(y) + 1:, :] = False
        ms.append(m)
    um = ms[0] | ms[1] | ms[2]
    s.outline(um, p['o'])
    for m, c in zip(ms, cl):
        s.sh(m, p, kl=1, kd=max(2, int(c[2] * 0.4)), kdd=1, ol=False)


def flowers(s, x, y, n, cols, seed=0, spread=(10, 4)):
    rng = random.Random(seed)
    for _ in range(n):
        fx = x + rng.randint(-spread[0], spread[0])
        fy = y + rng.randint(-spread[1], spread[1])
        c = rng.choice(cols)
        s.px(fx + 1, fy + 2, GRASS['dd'])
        for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1)):
            s.px(fx + dx, fy + dy, c)
        s.px(fx, fy, '#fff6c0')


def lamp(s, x, y, h, p=IRON, glow=None, lit='#fff2a8'):
    s.shadow(E(x - 3, y - 1, x + 8, y + 2))
    if glow:
        s.dith(O(x, y - h - 5, 15) & ~O(x, y - h - 5, 8), glow, 0.22)
        s.dith(O(x, y - h - 5, 8), glow, 0.5)
    m = (R(x - 1, y - h, x + 1, y) | R(x - 3, y - 7, x + 3, y) | R(x - 2, y - int(h * 0.55), x + 2, y - int(h * 0.55) + 2)
         | P([(x - 5, y - h - 9), (x + 5, y - h - 9), (x, y - h - 15)]) | R(x - 3, y - h, x + 3, y - h))
    s.sh(m, p, kl=1, kd=1, kdd=0, d=(1, 0))
    lan = R(x - 3, y - h - 8, x + 3, y - h - 1)
    s.put(lan, lit)
    s.outline(lan, p['o'])
    s.put(R(x, y - h - 8, x, y - h - 1), p['b'])


def persp_tiles(s, y0, y1, vx, vy, c1, c2, grout, su=5.0, sv=900.0, m=None):
    """Perspective paving: tiles shrink toward the vanishing point (vx, vy)."""
    ys = np.arange(y0, y1)[:, None].astype(float)
    xs = np.arange(W)[None, :].astype(float)
    d = ys - vy
    u = (xs - vx) / d * su
    v = sv / d
    fu, fv = u - np.floor(u), v - np.floor(v)
    par = ((np.floor(u) + np.floor(v)) % 2) == 0
    blk = np.where(par[..., None], C(c1), C(c2))
    blk[(fu < su / d) | (fv < sv / d ** 2)] = C(grout)
    region = s.a[y0:y1]
    if m is None:
        region[:] = blk
    else:
        sel = m[y0:y1]
        region[sel] = blk[sel]


def water_streaks(s, m, p=WATER, seed=0, dens=0.035, cols=None):
    rng = random.Random(seed)
    ys = np.nonzero(m.any(axis=1))[0]
    if not len(ys):
        return
    y0, y1 = ys.min(), ys.max()
    cols = cols or [p['l'], p['l'], p['l'], '#e6f6ff']
    for y in range(y0 + 1, y1 + 1, 2):
        t = (y - y0) / max(1, y1 - y0)
        for _ in range(int(W * dens * (0.5 + t))):
            x = rng.randint(0, W - 1)
            ln = rng.randint(2, 3 + int(t * 9))
            xs = np.arange(x, min(W, x + ln))
            s.a[y, xs[m[y, xs]]] = C(rng.choice(cols))


def bird(s, x, y, c='#3c4058'):
    for dx, dy in ((-3, -1), (-2, -1), (-1, 0), (0, 0), (1, 0), (2, -1), (3, -1)):
        s.px(x + dx, y + dy, c)


def pot(s, x, y, r, p=TERRA):
    s.shadow(E(x - r, y - 2, x + r * 1.6, y + 2))
    m = O(x, y - r, r) | R(x - r * 0.45, y - 2 * r - 2, x + r * 0.45, y - r) | R(x - r * 0.6, y - 2 * r - 3, x + r * 0.6, y - 2 * r - 2)
    s.sh(m, p, kl=1, kd=max(2, int(r * 0.4)), kdd=1)
    s.put(R(x - r, y - r - 1, x + r, y - r - 1) & m & ~shift(m, -1, 0) & ~shift(m, 1, 0), '#fff2e0')
