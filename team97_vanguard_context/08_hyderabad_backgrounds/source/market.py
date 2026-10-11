"""Charminar Market set - UI art for the in-game stock-trading "device".

Everything here is original: fictional companies, no real logos/tickers/currency,
no lettering. Drawn with the same pxlib shading rules (1-px outlines, 2-3 tones,
light from the top-left), on canvases of the exact sizes the game asks for.

    python market.py            -> out/1x/market/*, out/4x/market/*, out/market_contact_sheet.png
(scenes.py also calls build() so one run rebuilds everything.)
"""
import json
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFont

from pxlib import Scene, C, mix, pal, shift, dilate, _B4

OUT = '#241c28'


# ------------------------------------------------------------------ any-size canvas
class Cv(Scene):
    """Scene with its own size; same put/sh/outline/shadow helpers as pxlib.Scene."""

    def __init__(s, w, h, transparent=True):
        s.w, s.h = w, h
        s.a = np.zeros((h, w, 4), np.uint8)
        if not transparent:
            s.a[..., 3] = 255
        s.bt = np.tile(_B4, (h // 4 + 1, w // 4 + 1))[:h, :w]

    def _d(s):
        im = Image.new('L', (s.w, s.h), 0)
        return im, ImageDraw.Draw(im)

    def R(s, x0, y0, x1, y1):
        im, d = s._d()
        d.rectangle([round(min(x0, x1)), round(min(y0, y1)), round(max(x0, x1)), round(max(y0, y1))], fill=255)
        return np.array(im) > 127

    def RR(s, x0, y0, x1, y1, r):
        im, d = s._d()
        d.rounded_rectangle([round(x0), round(y0), round(x1), round(y1)], radius=r, fill=255)
        return np.array(im) > 127

    def E(s, x0, y0, x1, y1):
        im, d = s._d()
        x0, x1 = sorted((round(x0), round(x1)))
        y0, y1 = sorted((round(y0), round(y1)))
        d.ellipse([x0, y0, x1, y1], fill=255)
        return np.array(im) > 127

    def O(s, cx, cy, r):
        return s.E(cx - r, cy - r, cx + r, cy + r)

    def P(s, pts):
        im, d = s._d()
        d.polygon([(round(x), round(y)) for x, y in pts], fill=255)
        return np.array(im) > 127

    def L(s, pts, w=1):
        im, d = s._d()
        d.line([(round(x), round(y)) for x, y in pts], fill=255, width=w)
        return np.array(im) > 127

    def NONE(s):
        return np.zeros((s.h, s.w), bool)

    def px(s, x, y, c, m=None):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < s.w and 0 <= y < s.h and (m is None or m[y, x]):
            s.a[y, x] = C(c)

    def dith(s, m, c, level):
        s.a[m & (s.bt < level)] = C(c)


def ramp3(c, o=OUT):
    return pal(mix(c, '#ffffff', 0.35), C(c), mix(c, '#1a1020', 0.25), mix(c, '#1a1020', 0.45), o)


CREAM = '#fff8ec'


# ------------------------------------------------------------------ company badges
def badge(size, accent):
    """Rounded badge: 2-px dark outline (1-px at 16x16), flat accent with a soft top light."""
    s = Cv(size, size)
    big = size >= 32
    o = 2 if big else 1
    r = 6 if big else 3
    m = s.RR(o, o, size - 1 - o, size - 1 - o, r)
    ring = s.RR(0, 0, size - 1, size - 1, r + o) & ~m
    p = ramp3(accent)
    s.put(ring, OUT)
    s.put(m, p['b'])
    s.put(m & ~shift(m, 0, -2 if big else -1), p['d'])
    s.put(m & ~shift(m, 0, 1), p['l'])
    s.put(m & ~shift(m, 1, 0), p['l'])
    return s, m, p


def co_zipeats(size):
    s, m, p = badge(size, '#f0783c')
    k = size / 32
    def X(v): return v * k
    dk = p['dd']
    for wx in (10, 22):
        w = s.O(X(wx), X(23), X(3.6))
        s.put(w, OUT)
        s.px(X(wx), X(23), CREAM)
    body = s.P([(X(6), X(16)), (X(17), X(16)), (X(20), X(20)), (X(17), X(21)), (X(8), X(21)), (X(5), X(19))])
    apron = s.P([(X(18), X(21)), (X(21), X(10)), (X(23.5), X(10)), (X(22.5), X(21))])
    s.put(body | apron, CREAM)
    s.put(s.R(X(17), X(19), X(21), X(21)) & ~apron, dk)
    s.put(s.R(X(19), X(8), X(25), X(9)), OUT)
    s.put(s.R(X(9), X(14), X(16), X(15)), OUT)
    box = s.R(X(4), X(4), X(14), X(13))
    s.put(box, CREAM)
    s.put(s.R(X(4), X(4), X(14), X(5)), mix(CREAM, '#ffffff', 0.6))
    s.put(s.R(X(4), X(7), X(14), X(7)) & box, mix(CREAM, '#f0783c', 0.45))
    s.put(s.R(X(7), X(10), X(11), X(10)) & box, dk)
    s.outline(box, dk)
    s.px(25, 12, '#fff4b0')
    return s


def co_dashkart(size):
    s, m, p = badge(size, '#8a5cf0')
    k = size / 32
    def X(v): return v * k
    dk = p['dd']
    handle = s.L([(X(9), X(13)), (X(10), X(8)), (X(13), X(6)), (X(19), X(6)), (X(22), X(8)), (X(23), X(13))], max(1, int(X(2))))
    s.put(handle, CREAM)
    rim = s.R(X(5), X(12), X(26), X(14))
    basket = s.P([(X(6), X(14)), (X(25), X(14)), (X(23), X(26)), (X(8), X(26))])
    s.put(rim | basket, CREAM)
    if size >= 32:
        for bx in range(8, 25, 3):
            s.put(s.R(bx, 16, bx, 24) & basket, mix(CREAM, '#8a5cf0', 0.25))
        s.put(s.R(5, 14, 26, 14), mix(CREAM, '#8a5cf0', 0.35))
    bolt = s.P([(X(18), X(13)), (X(12), X(21)), (X(16), X(21)), (X(13), X(29)), (X(21), X(18)), (X(17), X(18)), (X(20), X(13))])
    s.put(bolt & m, dk)
    if size >= 32:
        s.outline(bolt & m, CREAM)
    return s


def co_autogo(size):
    """Auto-rickshaw seen from the front: rounded canopy, windshield, one headlight, three wheels."""
    s, m, p = badge(size, '#e8c030')
    for wx in (4, 25):                                   # rear wheels peeking out at the sides
        s.put(s.R(wx, 20, wx + 2, 27), OUT)
    sides = s.R(6, 17, 9, 23) | s.R(22, 17, 25, 23)      # passenger body sides
    s.put(sides, CREAM)
    s.outline(sides, OUT)
    can = s.RR(5, 3, 26, 11, 5) | s.R(6, 8, 7, 17) | s.R(24, 8, 25, 17)
    s.put(can, OUT)
    s.put(s.R(10, 5, 21, 5), '#4a4458')
    shield = s.R(9, 9, 22, 15)
    s.put(shield, '#d8f0ff')
    s.put(s.R(9, 9, 22, 9), '#ffffff')
    s.put(s.L([(11, 14), (15, 11)]), '#a8c8e0')
    s.outline(shield, OUT)
    s.put(s.R(8, 17, 23, 17), OUT)                       # handlebar
    cowl = s.P([(12, 16), (19, 16), (18.5, 24), (12.5, 24)])
    s.put(cowl, CREAM)
    s.outline(cowl, OUT)
    s.put(s.O(15.5, 20, 2), p['b'])
    s.px(15, 19, '#fff4b0')
    s.put(s.R(12, 25, 19, 25), OUT)                      # mudguard
    s.put(s.R(14, 26, 17, 28), OUT)                      # front wheel
    return s


def co_chaiwala(size):
    s, m, p = badge(size, '#a0623c')
    k = size / 32
    def X(v): return v * k
    glass = s.P([(X(10), X(12)), (X(22), X(12)), (X(20.5), X(27)), (X(11.5), X(27))])
    s.put(glass, CREAM)
    tea = glass & s.R(0, X(16), size, size)
    s.put(tea, '#e0a060')
    s.put(tea & s.R(0, X(16), size, X(16)), '#f4c890')
    if size >= 32:
        for gx in (13, 16, 19):
            s.put(s.R(gx, 13, gx, 26) & glass, mix(CREAM, '#a0623c', 0.3))
    s.put(s.R(X(9), X(11), X(23), X(12)), CREAM)
    for sx in (X(12), X(16), X(20)):
        s.put(s.L([(sx, X(9)), (sx - X(1.5), X(7)), (sx, X(5)), (sx - X(1.5), X(3))], 1), CREAM)
    return s


GLYPH16 = {
    'co_zipeats': ('#f0783c', ["cccc........",
                               "cddc....kkk.",
                               "cccc......c.",
                               "..........c.",
                               ".cccccccccc.",
                               "ccccccccccc.",
                               ".kk.....kk..",
                               "kkkk...kkkk.",
                               ".kk.....kk.."]),
    'co_dashkart': ('#8a5cf0', ["...cccccc...",
                                "..c......c..",
                                "cccccccccccc",
                                ".ccccccdccc.",
                                ".cccccddccc.",
                                ".ccccddddcc.",
                                "..cccccddc..",
                                "..ccccdccc..",
                                "...cccccc..."]),
    'co_autogo': ('#e8c030', ["..kkkkkkkk..",
                              ".kkkkkkkkkk.",
                              ".kbbbbbbbbk.",
                              ".kbbbbbbbbk.",
                              ".k.cccccc.k.",
                              "kk.ccyycc.kk",
                              "kk..cccc..kk",
                              "kk...kk...kk",
                              ".....kk....."]),
    'co_chaiwala': ('#a0623c', ["..c..c..c...",
                                ".c..c..c....",
                                "............",
                                "..cccccccc..",
                                "..cccccccc..",
                                "..tttttttt..",
                                "...tttttt...",
                                "...tttttt...",
                                "....tttt...."]),
}


def badge16(name):
    accent, rows = GLYPH16[name]
    s, m, p = badge(16, accent)
    cols = {'c': CREAM, 'd': p['dd'], 'k': OUT, 'b': '#d8f0ff', 'y': '#fff4b0', 't': '#e0a060'}
    oy = 2 + (12 - len(rows)) // 2
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in cols:
                s.px(2 + x, oy + y, cols[ch])
    return s


COMPANIES = {'co_zipeats': co_zipeats, 'co_dashkart': co_dashkart, 'co_autogo': co_autogo, 'co_chaiwala': co_chaiwala}


# ------------------------------------------------------------------ chart bits
GREEN = pal('#88e088', '#48b048', '#2e8a34', '#1e5a1e', '#14401a')
RED = pal('#f89090', '#e04848', '#b02c2c', '#6a1818', '#4a1010')


def candle(kind):
    s = Cv(6, 24)
    if kind == 'doji':
        p = pal('#ffffff', '#c8c8d8', '#9a9aae', '#4a4a5a', '#34344a')
        s.put(s.R(2, 0, 3, 10) | s.R(2, 13, 3, 23), p['dd'])
        s.put(s.R(0, 10, 5, 13), p['o'])
        s.put(s.R(1, 11, 4, 12), p['b'])
        s.px(1, 11, p['l'])
        return s
    p = GREEN if kind == 'up' else RED
    s.put(s.R(2, 0, 3, 4) | s.R(2, 19, 3, 23), p['dd'])
    body = s.R(0, 4, 5, 19)
    s.put(body, p['o'])
    inner = s.R(1, 5, 4, 18)
    s.put(inner, p['b'])
    s.put(s.R(1, 5, 1, 18), p['l'])
    s.put(s.R(4, 5, 4, 18), p['d'])
    return s


def ticker_arrow(up):
    s = Cv(8, 8)
    p = GREEN if up else RED
    pts = [(0, 6), (7, 6), (3.5, 0)] if up else [(0, 1), (7, 1), (3.5, 7)]
    m = s.P(pts)
    s.put(m, p['o'])
    inner = m & shift(m, 1, 0) & shift(m, -1, 0) & shift(m, 0, 1) & shift(m, 0, -1)
    s.put(inner, p['b'])
    s.put(inner & ~shift(inner, 1, 0), p['l'])
    return s


def button(base, light, bevel, w=48, h=32):
    """Kenney-UI-style button: rounded, flat face, darker 4-px bottom bevel, 1-px top light."""
    s = Cv(w, h)
    body = s.RR(0, 0, w - 1, h - 1, 6)
    face = s.RR(0, 0, w - 1, h - 5, 6)
    s.put(body, bevel)
    s.put(face, base)
    s.put(face & ~shift(face, 0, 1), light)
    s.put(face & ~shift(face, 0, 2) & shift(face, 0, 1), mix(base, light, 0.4))
    s.put(face & ~shift(face, 0, -1), mix(base, bevel, 0.5))
    return s


def risk_badge(n):
    s = Cv(24, 8)
    col = {1: '#48b048', 2: '#f0b030', 3: '#e04848'}[n]
    p = ramp3(col)
    for i in range(3):
        x0 = 1 + i * 8
        pip = s.RR(x0, 1, x0 + 5, 6, 1)
        ring = s.RR(x0 - 1, 0, x0 + 6, 7, 2) & ~pip
        s.put(ring, OUT)
        if i < n:
            s.put(pip, p['b'])
            s.put(pip & ~shift(pip, 0, 1), p['l'])
            s.put(pip & ~shift(pip, 0, -1), p['d'])
        else:
            s.put(pip, '#3a3e52')
            s.put(pip & ~shift(pip, 0, 1), '#2a2c3c')
    return s


def card_news(w=64, h=48):
    """Cream paper card with a torn top edge (period 4 px, so the centre slice tiles)."""
    s = Cv(w, h)
    tear = [2, 0, 1, 3]
    pts = [(1, h - 2)]
    for x in range(1, w - 1):
        pts.append((x, tear[x % 4]))
    pts += [(w - 2, h - 2)]
    paper = s.P(pts) & s.R(1, 0, w - 2, h - 2)
    for x in range(1, w - 1):
        paper[:tear[x % 4], x] = False
    s.put(s.R(2, 3, w - 1, h - 1) & ~paper & shift(paper, 1, 1), '#8a7a60')
    s.put(paper, '#f6eedc')
    s.put(paper & ~shift(paper, -1, -1), '#ded2b6')
    s.put(paper & ~shift(paper, 0, 2) & shift(paper, 0, 4), '#fffaf0')
    s.outline(paper, '#4a3a2a')
    return s


def device_frame(w=360, h=640, screen=(20, 40, 320, 520)):
    s = Cv(w, h)
    body = s.RR(1, 1, w - 2, h - 2, 34)
    shell = s.RR(0, 0, w - 1, h - 1, 35)
    s.put(shell & ~body, '#101116')
    s.put(body, '#3a3d46')
    s.put(body & ~shift(body, 3, 3), '#555966')
    s.put(body & ~shift(body, 1, 1), '#6a6e7c')
    s.put(body & ~shift(body, -4, -4), '#2a2c34')
    s.put(body & ~shift(body, -2, -2), '#1e2026')
    seam = s.RR(8, 8, w - 9, h - 9, 28) & ~s.RR(9, 9, w - 10, h - 10, 27)
    s.put(seam, '#30323a')
    sx, sy, sw, sh = screen
    s.put(s.RR(sx - 7, sy - 7, sx + sw + 6, sy + sh + 6, 8), '#1c1d24')
    rec = s.R(sx - 3, sy - 3, sx + sw + 2, sy + sh + 2)
    s.put(rec, '#0e0f14')
    s.put(s.R(sx - 3, sy + sh + 1, sx + sw + 2, sy + sh + 2) | s.R(sx + sw + 1, sy - 3, sx + sw + 2, sy + sh + 2), '#4a4c58')
    # speaker grille
    for row in range(3):
        for col in range(10):
            gx, gy = w // 2 - 28 + col * 6, 14 + row * 5
            s.put(s.R(gx, gy, gx + 2, gy + 1), '#16171c')
            s.put(s.R(gx, gy + 2, gx + 2, gy + 2), '#5a5e6a')
    # LED socket (the blinking LED sprite sits on top of it)
    led = (sx + 10, 18)
    s.put(s.O(led[0] + 1.5, led[1] + 1.5, 3), '#16171c')
    s.put(s.R(led[0], led[1], led[0] + 3, led[1] + 3), '#1e3a1e')
    # screws
    for (cx, cy) in ((22, 22), (w - 23, 22), (22, h - 23), (w - 23, h - 23)):
        s.put(s.O(cx, cy, 4), '#24262e')
        s.put(s.O(cx, cy, 3), '#6a6e7c')
        s.put(s.R(cx - 2, cy, cx + 2, cy), '#2a2c34')
    # four buttons
    by = sy + sh + 24
    for i in range(4):
        bx = w // 2 - 117 + i * 66
        b = s.RR(bx, by, bx + 36, by + 14, 7)
        s.put(s.RR(bx, by + 2, bx + 36, by + 16, 7), '#16171c')
        s.put(b, '#5a5e6a')
        s.put(b & ~shift(b, 0, 2), '#8a8e9a')
        s.put(b & ~shift(b, 0, -2), '#3e414a')
    # grip ridges
    for k in range(5):
        y = h - 52 + k * 5
        s.put(s.R(30, y, 44, y), '#2e3038') if 30 < w else None
        s.put(s.R(w - 45, y, w - 31, y), '#2e3038')
    s.a[sy:sy + sh, sx:sx + sw] = 0
    return s, led


def result_icon(kind):
    s = Cv(24, 24)
    col = {'pass': '#48b048', 'fail': '#e04848', 'info': '#8a8ea0'}[kind]
    p = ramp3(col)
    disc = s.O(11.5, 11.5, 9.5)
    ring = s.O(11.5, 11.5, 11.5) & ~disc
    s.put(ring, OUT)
    s.put(disc, p['b'])
    s.put(disc & ~shift(disc, 0, -2), p['d'])
    s.put(disc & ~shift(disc, 1, 1), p['l'])
    if kind == 'pass':
        s.put(s.L([(6, 12), (10, 16), (17, 7)], 3), '#ffffff')
    elif kind == 'fail':
        s.put(s.L([(7, 7), (16, 16)], 3) | s.L([(16, 7), (7, 16)], 3), '#ffffff')
    else:
        s.put(s.R(11, 5, 12, 6) | s.R(11, 9, 12, 17) | s.R(10, 9, 11, 9) | s.R(10, 17, 13, 17), '#ffffff')
    return s


# ------------------------------------------------------------------ animations (horizontal strips)
def strip(frames):
    w, h = frames[0].size
    out = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        out.alpha_composite(f, (i * w, 0))
    return out


def prof_frame(i):
    """The Professor, 32x32, walking left (entering from the right) holding a rolled newspaper."""
    s = Cv(32, 32)
    b = -1 if i % 2 else 0
    SK = pal('#f4c898', '#d8a070', '#b07850', None, OUT)
    HR = pal('#ffffff', '#eeeef4', '#c4c4d2', None, OUT)
    VS = pal('#f0c850', '#d8a830', '#a87c18', None, OUT)
    TR = pal('#8a6448', '#6a4a34', '#4a3424', None, OUT)
    SH = '#2a1e18'
    near_foot, far_foot = {0: ((15, 11), (17, 21)), 1: ((15, 14), (16, 17)),
                           2: ((17, 21), (15, 11)), 3: ((16, 17), (15, 14))}[i]
    far_leg = s.L([(far_foot[0], 23 + b), (far_foot[1], 29)], 3)
    near_leg = s.L([(near_foot[0], 23 + b), (near_foot[1], 29)], 3)
    far_shoe = s.R(far_foot[1] - 2, 29, far_foot[1] + 1, 30)
    near_shoe = s.R(near_foot[1] - 2, 29, near_foot[1] + 1, 30)
    swing = {0: (20, 21), 1: (18, 22), 2: (17, 21), 3: (18, 22)}[i]
    far_arm = s.L([(18, 15 + b), (swing[0], swing[1] + b)], 2)
    torso = s.R(12, 14 + b, 20, 23 + b)
    head = s.O(16, 8 + b, 5)
    neck = s.R(15, 13 + b, 17, 14 + b)
    upper = s.R(14, 15 + b, 15, 19 + b)
    fore = s.R(11, 19 + b, 15, 20 + b)
    hand = s.R(10, 18 + b, 11, 20 + b)
    roll = s.L([(11, 23 + b), (8, 12 + b)], 3)
    U = far_leg | near_leg | far_shoe | near_shoe | far_arm | torso | head | neck | upper | fore | hand | roll
    s.outline(U, OUT)
    s.put(far_leg, TR['d'])
    s.put(far_shoe, SH)
    s.put(far_arm, '#c8c8d4')
    s.put(near_leg, TR['b'])
    s.put(near_leg & ~shift(near_leg, 1, 0), TR['l'])
    s.put(near_shoe, SH)
    s.sh(torso, VS, kl=1, kd=1, kdd=0, d=(1, 0), ol=False)
    s.put(s.R(12, 14 + b, 14, 16 + b), '#f4f4f8')
    s.put(s.R(16, 15 + b, 16, 23 + b) & torso, VS['d'])
    s.put(neck, SK['d'])
    s.sh(head, SK, kl=1, kd=1, kdd=0, d=(1, 0), ol=False)
    hair = head & (s.R(19, 0, 31, 31) | (s.R(16, 0, 31, 4 + b) & ~s.R(0, 0, 31, 2 + b)))
    s.put(hair, HR['b'])
    s.put(hair & ~shift(hair, -1, 0), HR['d'])
    s.put(s.R(12, 5 + b, 14, 5 + b), HR['b'])           # bushy eyebrow
    s.px(18, 9 + b, SK['d'])                              # ear
    s.px(10, 8 + b, SK['b'])                              # nose
    s.px(10, 9 + b, SK['d'])
    s.put(s.R(11, 7 + b, 13, 8 + b), '#bfe6fb')           # round glasses
    s.put(s.R(11, 6 + b, 13, 6 + b) | s.R(14, 7 + b, 18, 7 + b), '#2a2a34')
    s.put(s.R(11, 10 + b, 14, 11 + b), HR['b'])           # moustache
    s.px(13, 12 + b, SK['d'])
    s.put(upper, '#f4f4f8')
    s.put(fore, '#f4f4f8')
    s.put(s.R(11, 20 + b, 15, 20 + b), '#d4d4dc')
    s.put(roll, '#f2ecd8')
    s.put(s.L([(12, 23 + b), (9, 12 + b)]) & roll, '#c8c0aa')
    for k in range(13, 22, 3):
        s.put(s.R(0, k + b, 31, k + b) & roll, '#9a9488')
    s.put(hand, SK['b'])
    return s.image()


def tip_frame(i):
    """48x48: phone buzzing with a forwarded-message bubble (generic chat style, no logo, no words)."""
    s = Cv(48, 48)
    dx = [0, -1, 1, -1, 1, 0][i]
    ph = s.RR(9 + dx, 6, 31 + dx, 44, 3)
    s.outline(ph, OUT)
    s.put(ph, '#2a2e3a')
    s.put(ph & ~shift(ph, 1, 0), '#4a5060')
    scr = s.R(11 + dx, 10, 29 + dx, 38)
    s.put(scr, '#e8eef4')
    for y in (13, 16):
        s.put(s.R(13 + dx, y, 24 + dx, y), '#c4ccd6')
    s.put(s.R(17 + dx, 8, 23 + dx, 8), '#141820')
    s.put(s.O(20 + dx, 41, 1), '#4a5060')
    # bubble pops out over the screen
    bub = s.RR(15 + dx, 17, 44 + dx, 34, 4)
    tail = s.P([(17 + dx, 32), (13 + dx, 38), (23 + dx, 33)])
    G = pal('#b8f0a8', '#7cd468', '#4aa84a', None, '#1e5a2a')
    s.outline(bub | tail, G['o'])
    s.put(bub | tail, G['b'])
    s.put(bub & ~shift(bub, 0, 1), G['l'])
    s.put(bub & ~shift(bub, 0, -1), G['d'])
    # forwarded marker: two curved arrows, then placeholder lines
    for ax in (18, 23):
        x = ax + dx
        s.put(s.L([(x, 23), (x, 21), (x + 1, 20), (x + 3, 20)]), '#1e5a2a')
        s.put(s.R(x + 3, 19, x + 3, 21) | s.R(x + 4, 20, x + 4, 20), '#1e5a2a')
    s.put(s.R(30 + dx, 21, 40 + dx, 21), '#2e7a3a')
    s.put(s.R(18 + dx, 25, 41 + dx, 25), '#2e7a3a')
    s.put(s.R(18 + dx, 28, 36 + dx, 28), '#2e7a3a')
    s.put(s.R(18 + dx, 31, 30 + dx, 31) & bub, '#2e7a3a')
    # notification dot + buzz marks
    dot = s.O(30 + dx, 7, 2 if i % 2 else 3)
    s.outline(dot, OUT)
    s.put(dot, '#ff4a4a')
    if 1 <= i <= 4:
        arcs = [[(6, 16), (5, 20), (6, 24)], [(4, 13), (2, 20), (4, 27)]]
        s.put(s.L(arcs[i % 2]), '#ffd23c')
        s.put(s.L([(46 - p[0] + 2, p[1] + 14) for p in arcs[(i + 1) % 2]]) & ~(bub | tail), '#ffd23c')
    return s.image()


def crash_frame(i):
    """64x32: line chart climbs, then falls off a cliff; red flash on impact."""
    s = Cv(64, 32)
    pts = [(4, 22), (10, 20), (16, 21), (22, 16), (28, 17), (34, 12), (40, 8), (44, 10), (47, 26), (53, 28), (61, 29)]
    upto = [5, 7, 8, 9, 11, 11][i]
    if i == 4:
        s.dith(s.R(0, 0, 63, 31), '#ff3030', 0.5)
        s.dith(s.R(0, 0, 63, 31), '#ffb0a0', 0.12)
    if i == 5:
        s.dith(s.R(0, 0, 63, 31), '#ff3030', 0.12)
    s.put(s.R(2, 2, 2, 29) | s.R(2, 29, 61, 29), '#8a90a8')
    for ty in (8, 15, 22):
        s.px(1, ty, '#8a90a8')
    good = pts[:min(upto, 8)]
    if len(good) > 1:
        g = s.L(good, 2)
        s.outline(g, '#14401a')
        s.put(g, '#48d048')
    if upto > 8:
        bad = pts[7:upto]
        r = s.L(bad, 2)
        s.outline(r, '#4a1010')
        s.put(r, '#ff4848')
    if i >= 3:
        cx, cy = 46, 18
        rad = {3: 5, 4: 11, 5: 6}[i]
        burst = s.NONE()
        for a in range(0, 360, 45):
            ra = math.radians(a + (22 if i == 4 else 0))
            burst |= s.L([(cx + 2 * math.cos(ra), cy + 2 * math.sin(ra)), (cx + rad * math.cos(ra), cy + rad * math.sin(ra))], 1)
        s.put(burst, '#fff0a0' if i != 5 else '#ff9a8a')
        s.put(s.O(cx, cy, 2 if i == 4 else 1), '#ffffff')
    if i == 5:
        for (x, y) in ((50, 26), (54, 24), (57, 27)):
            s.put(s.O(x, y, 1), '#9a9aa8')
    return s.image()


def coin(s, cx, cy, phase):
    w = [4, 3, 1, 3][phase % 4]
    m = s.E(cx - w, cy - 4, cx + w, cy + 4)
    s.outline(m, '#6a4208')
    s.put(m, '#ffd040')
    s.put(m & ~shift(m, -1, 0), '#e8a820')
    s.put(m & ~shift(m, 1, 0), '#fff0a0')
    if w >= 3:
        s.put(s.R(cx - 1, cy - 2, cx, cy + 1), '#e8a820')
        s.px(cx - 1, cy - 2, '#fff0a0')


def coin_frame(i):
    s = Cv(32, 32)
    for k, (x, ph) in enumerate(((7, 0), (16, 2), (25, 4))):
        y = -6 + ((i + ph) % 6) * 8
        coin(s, x, y, i + k)
    return s.image()


def led_frame(i):
    s = Cv(4, 4)
    m = s.R(0, 0, 3, 3) & ~(s.R(0, 0, 0, 0) | s.R(3, 0, 3, 0) | s.R(0, 3, 0, 3) | s.R(3, 3, 3, 3))
    s.put(m, '#2a5a2a' if i == 0 else '#5aff6a')
    if i == 1:
        s.px(1, 1, '#ffffff')
    else:
        s.px(1, 1, '#3a7a3a')
    return s.image()


ANIMS = {
    'prof_market_walk': (prof_frame, 4, 140),
    'tip_forward': (tip_frame, 6, 80),
    'crash_flash': (crash_frame, 6, 140),
    'coin_rain': (coin_frame, 6, 90),
    'led_blink': (led_frame, 2, 500),
}


# ------------------------------------------------------------------ build
def nine_slice(img, l, t, r, b, w, h):
    W0, H0 = img.size
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    xs = [(0, l, 0, l), (l, W0 - r, l, w - r), (W0 - r, W0, w - r, w)]
    ys = [(0, t, 0, t), (t, H0 - b, t, h - b), (H0 - b, H0, h - b, h)]
    for sx0, sx1, dx0, dx1 in xs:
        for sy0, sy1, dy0, dy1 in ys:
            piece = img.crop((sx0, sy0, sx1, sy1))
            if (dx1 - dx0, dy1 - dy0) != piece.size:
                tile = Image.new('RGBA', (dx1 - dx0, dy1 - dy0))
                for yy in range(0, dy1 - dy0, piece.height):
                    for xx in range(0, dx1 - dx0, piece.width):
                        tile.alpha_composite(piece.crop((0, 0, min(piece.width, dx1 - dx0 - xx), min(piece.height, dy1 - dy0 - yy))), (xx, yy))
                piece = tile
            out.alpha_composite(piece, (dx0, dy0))
    return out


def all_assets():
    a = {}
    for name, fn in COMPANIES.items():
        a[name] = fn(32).image()
        a[name + '_16'] = badge16(name).image()
    a['candle_up'] = candle('up').image()
    a['candle_down'] = candle('down').image()
    a['candle_doji'] = candle('doji').image()
    a['ticker_arrow_up'] = ticker_arrow(True).image()
    a['ticker_arrow_down'] = ticker_arrow(False).image()
    a['btn_buy'] = button('#5ac85a', '#9aea8a', '#2e8a3a').image()
    a['btn_sell'] = button('#e05a50', '#f8968a', '#a0302a').image()
    for n in (1, 2, 3):
        a[f'badge_risk_{n}'] = risk_badge(n).image()
    a['card_news'] = card_news().image()
    dev, led = device_frame()
    a['device_frame'] = dev.image()
    for k in ('pass', 'fail', 'info'):
        a[f'chk_{k}'] = result_icon(k).image()
    anims = {}
    for name, (fn, n, ms) in ANIMS.items():
        anims[name] = ([fn(i) for i in range(n)], ms)
    return a, anims, led


META = {
    'note': 'All sizes/coords at 1x; multiply by 4 for the 4x folder. Strips are horizontal, frames left to right.',
    'nine_slice': {
        'btn_buy': {'size': [48, 32], 'left': 8, 'right': 8, 'top': 8, 'bottom': 12},
        'btn_sell': {'size': [48, 32], 'left': 8, 'right': 8, 'top': 8, 'bottom': 12},
        'card_news': {'size': [64, 48], 'left': 8, 'right': 8, 'top': 8, 'bottom': 6,
                      'tip': 'torn edge repeats every 4 px - keep stretched widths at 16 + a multiple of 4'},
    },
    'device_frame': {'size': [360, 640], 'screen_rect': [20, 40, 320, 520]},
}


def save_gif(frames, path, ms):
    """GIF with one shared palette; palette index 0 is reserved for transparency."""
    arrs = [np.asarray(f.convert('RGBA')) for f in frames]
    cols = sorted({tuple(px[:3]) for a in arrs for px in a.reshape(-1, 4) if px[3] > 127})
    assert len(cols) <= 255, 'too many colours for a GIF'
    lut = {c: i + 1 for i, c in enumerate(cols)}
    pal_flat = [255, 0, 255] + [v for c in cols for v in c]
    pal_flat += [0] * (768 - len(pal_flat))
    out = []
    for a in arrs:
        idx = np.zeros(a.shape[:2], np.uint8)
        vis = a[..., 3] > 127
        for (y, x) in zip(*np.nonzero(vis)):
            idx[y, x] = lut[tuple(a[y, x, :3])]
        p = Image.fromarray(idx, 'P')
        p.putpalette(pal_flat)
        out.append(p)
    out[0].save(path, save_all=True, append_images=out[1:], duration=ms, loop=0, disposal=2, transparency=0,
                optimize=False)


def _scale(im, k):
    return im if k == 1 else im.resize((im.width * k, im.height * k), Image.NEAREST)


def build(out='out'):
    assets, anims, led = all_assets()
    meta = json.loads(json.dumps(META))
    meta['device_frame']['led_rect'] = [led[0], led[1], 4, 4]
    meta['animations'] = {}
    for sc, k in (('1x', 1), ('4x', 4)):
        d = f'{out}/{sc}/market'
        os.makedirs(d, exist_ok=True)
        for name, im in assets.items():
            _scale(im, k).save(f'{d}/{name}.png')
        for name, (frames, ms) in anims.items():
            _scale(strip(frames), k).save(f'{d}/{name}.png')
            save_gif([_scale(f, k) for f in frames], f'{d}/{name}.gif', ms)
        if k == 1:
            for name, (frames, ms) in anims.items():
                w, h = frames[0].size
                meta['animations'][name] = {'frame_size': [w, h], 'frames': len(frames), 'ms_per_frame': ms, 'loop': True}
        with open(f'{d}/market.json', 'w') as f:
            json.dump(meta, f, indent=1)
    sheet = contact_sheet(assets, anims, led)
    sheet.save(f'{out}/market_contact_sheet.png')
    print('market ok:', len(assets), 'images,', len(anims), 'strips')
    return assets, anims


def screen_mock(assets, anims, led):
    """Illustration only: the pieces assembled inside the device (not a game asset)."""
    dev = assets['device_frame']
    m = Image.new('RGBA', dev.size, (0, 0, 0, 0))
    sx, sy, sw, sh = META['device_frame']['screen_rect']
    scr = Image.new('RGBA', (sw, sh), (16, 22, 40, 255))
    d = ImageDraw.Draw(scr)
    d.rectangle((0, 0, sw, 22), fill=(30, 40, 72))
    d.rectangle((8, 8, 60, 13), fill=(72, 176, 72))
    d.rectangle((260, 8, 310, 13), fill=(240, 192, 64))
    # chart
    d.rectangle((8, 30, sw - 9, 180), fill=(10, 16, 32), outline=(40, 52, 88))
    seq = 'uuduuddud uudu'.replace(' ', '')
    for k, c in enumerate(seq):
        im = assets['candle_up' if c == 'u' else ('candle_down' if c == 'd' else 'candle_doji')]
        y = 120 - k * 5 + (18 if c == 'd' else 0) - (30 if k > 9 else 0) * 0
        scr.alpha_composite(im, (20 + k * 21, max(36, min(150, y))))
    # list rows
    names = list(COMPANIES)
    for i, n in enumerate(names):
        y = 196 + i * 40
        d.rounded_rectangle((8, y, sw - 9, y + 32), radius=4, fill=(26, 34, 60), outline=(44, 56, 96))
        scr.alpha_composite(assets[n], (14, y))
        scr.alpha_composite(assets['ticker_arrow_up' if i % 2 == 0 else 'ticker_arrow_down'], (56, y + 12))
        d.rectangle((72, y + 12, 150, y + 19), fill=(60, 72, 110))
        scr.alpha_composite(assets[f'badge_risk_{(i % 3) + 1}'], (sw - 40, y + 12))
    # news card + buttons
    card = nine_slice(assets['card_news'], 8, 8, 8, 6, 300, 72)
    scr.alpha_composite(card, (10, 362))
    tip = anims['tip_forward'][0][2]
    scr.alpha_composite(tip, (18, 374))
    dd = ImageDraw.Draw(scr)
    for k in range(3):
        dd.rectangle((80, 384 + k * 12, 260 - k * 40, 389 + k * 12), fill=(176, 166, 140))
    scr.alpha_composite(nine_slice(assets['btn_buy'], 8, 8, 8, 12, 140, 40), (14, 456))
    scr.alpha_composite(nine_slice(assets['btn_sell'], 8, 8, 8, 12, 140, 40), (166, 456))
    m.alpha_composite(scr, (sx, sy))
    m.alpha_composite(dev)
    m.alpha_composite(anims['led_blink'][0][1], (led[0], led[1]))
    return m


def contact_sheet(assets, anims, led):
    try:
        font = ImageFont.load_default(size=11)
    except TypeError:
        font = ImageFont.load_default()
    bg = (38, 40, 56)
    sheet = Image.new('RGBA', (1636, 1030), bg + (255,))
    d = ImageDraw.Draw(sheet)

    def put(im, x, y, z, label):
        im2 = _scale(im, z)
        chk = Image.new('RGBA', im2.size, (58, 62, 84, 255))
        cd = ImageDraw.Draw(chk)
        for yy in range(0, im2.height, 8):
            for xx in range(0, im2.width, 8):
                if (xx // 8 + yy // 8) % 2:
                    cd.rectangle((xx, yy, xx + 7, yy + 7), fill=(68, 72, 96))
        chk.alpha_composite(im2)
        sheet.alpha_composite(chk, (x, y))
        d.text((x, y + im2.height + 3), label, fill=(220, 224, 240), font=font)

    p = 'out/1x/21_market_terminal.png'
    if os.path.exists(p):
        put(Image.open(p).convert('RGBA'), 12, 12, 1, '21_market_terminal  480x270')
    for i, n in enumerate(COMPANIES):
        put(assets[n], 510 + i * 72, 12, 2, n)
        put(assets[n + '_16'], 510 + i * 72, 96, 2, '_16')
    for i, n in enumerate(['candle_up', 'candle_down', 'candle_doji']):
        put(assets[n], 510 + i * 34, 150, 3, n.split('_')[1])
    for i, n in enumerate(['ticker_arrow_up', 'ticker_arrow_down']):
        put(assets[n], 622 + i * 46, 150, 4, n.split('_')[-1])
    for i, n in enumerate(['badge_risk_1', 'badge_risk_2', 'badge_risk_3']):
        put(assets[n], 622, 206 + i * 40, 3, n)
    for i, k in enumerate(('chk_pass', 'chk_fail', 'chk_info')):
        put(assets[k], 716 + i * 54, 150, 2, k.split('_')[1])
    y = 336
    put(assets['btn_buy'], 12, y, 2, 'btn_buy 48x32')
    put(assets['btn_sell'], 120, y, 2, 'btn_sell 48x32')
    put(nine_slice(assets['btn_buy'], 8, 8, 8, 12, 100, 32), 228, y, 2, '9-slice stretched to 100x32')
    put(assets['card_news'], 450, y, 2, 'card_news 64x48')
    put(nine_slice(assets['card_news'], 8, 8, 8, 6, 112, 40), 590, y, 2, '9-slice stretched to 112x40')
    yy = 466
    for name in ('prof_market_walk', 'tip_forward', 'crash_flash', 'coin_rain', 'led_blink'):
        frames, ms = anims[name]
        z = {'prof_market_walk': 3, 'tip_forward': 2, 'crash_flash': 2, 'coin_rain': 3, 'led_blink': 8}[name]
        put(strip(frames), 12, yy, z, f'{name}  ({len(frames)} frames, {ms} ms each)')
        yy += frames[0].height * z + 20
    put(assets['device_frame'], 884, 12, 1, 'device_frame 360x640 (screen cut-out transparent)')
    mock = screen_mock(assets, anims, led)
    sheet.alpha_composite(mock, (1262, 12))
    d.text((1262, 660), 'mock: pieces assembled inside the device', fill=(220, 224, 240), font=font)
    d.text((1262, 674), '(illustration only - not a game asset)', fill=(160, 164, 186), font=font)
    return sheet.convert('RGB')


if __name__ == '__main__':
    build()
