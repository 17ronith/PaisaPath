"""sprites_quarter - three-quarter back views of the five avatars for the battle platform.

The player stands with their back to us but turns their head toward the opponent (upper
right), so they read as looking between the opponent and the person holding the phone.
Built from sprites.py's own output: the back view, with the right side of the head replaced
by the mirrored front view (cheek, eye, brow) behind a curved hairline, a nose tip past the
cheek, and the INK silhouette redrawn on the new profile.

Run (after sprites.py):  python sprites_quarter.py  -> ../sprites/1x/<avatar>_quarter.png
"""
import os

import numpy as np
from PIL import Image

from sprites import AVATARS, INK

SPR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'sprites'))
INK_RGBA = np.array([int(INK[i:i + 2], 16) for i in (1, 3, 5)] + [255], np.uint8)


def quarter(key, top=6):
    back = np.array(Image.open(os.path.join(SPR, '1x', f'{key}_back.png')).convert('RGBA'))
    front = np.array(Image.open(os.path.join(SPR, '1x', f'{key}.png')).convert('RGBA'))[:, ::-1]
    out = back.copy()
    for y in range(top, 22):
        cut = 27 + max(0, 11 - y) // 2                   # hairline curves back toward the crown
        for x in range(cut, 48):
            out[y, x] = front[y, x] if (front[y, x, 3] and x <= 33) else 0
    out[14, 34] = out[15, 34] = front[16, 30]            # nose tip, cheek skin
    for y in range(top, 22):                             # silhouette on the new profile
        xs = np.nonzero(out[y, :, 3])[0]
        if len(xs) and 27 <= xs[-1] < 47:
            out[y, xs[-1] + 1] = INK_RGBA
    for x in range(27, 37):
        ys = np.nonzero(out[:, x, 3])[0]
        if len(ys) and ys[0] > 0 and out[ys[0] - 1, x, 3] == 0:
            out[ys[0] - 1, x] = INK_RGBA
    return Image.fromarray(out)


def main():
    for key in AVATARS:
        im = quarter(key)
        im.save(os.path.join(SPR, '1x', f'{key}_quarter.png'))
        im.resize((im.width * 4, im.height * 4), Image.NEAREST).save(os.path.join(SPR, '4x', f'{key}_quarter@4x.png'))
        print('ok', f'{key}_quarter')


if __name__ == '__main__':
    main()
