"""Recompress intro GIF: 280px, fewer colors, keep 30fps timing."""
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(r"D:/AI agent/assets/tab/agent-intro.gif")
OUT = SRC
SIZE = 280
KEY = (0, 255, 0)

im = Image.open(SRC)
frames, durs = [], []
try:
    while True:
        frames.append(im.copy().convert("RGBA"))
        durs.append(im.info.get("duration", 33))
        im.seek(im.tell() + 1)
except EOFError:
    pass
print("loaded", len(frames), "sum_ms", sum(durs))

yy, xx = np.ogrid[:SIZE, :SIZE]
cy = cx = (SIZE - 1) / 2
dist = np.sqrt((yy - cy) ** 2 + (xx - cx) ** 2)
alpha_u8 = (np.clip((SIZE / 2 - 0.5 - dist) * 2 + 1, 0, 1) * 255).astype(np.uint8)

rgbs = []
for fr in frames:
    r = fr.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    a = np.asarray(r).copy()
    a[:, :, 3] = np.minimum(a[:, :, 3], alpha_u8)
    mask = a[:, :, 3] < 32
    rgb = a[:, :, :3].copy()
    rgb[mask] = KEY
    rgbs.append(Image.fromarray(rgb, "RGB"))

sample = rgbs[:: max(1, len(rgbs) // 20)]
sheet = Image.new("RGB", (SIZE * len(sample), SIZE))
for i, x in enumerate(sample):
    sheet.paste(x, (i * SIZE, 0))
base = sheet.quantize(colors=180, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
pal = base.getpalette()[: 180 * 3]
palette = [KEY[0], KEY[1], KEY[2]] + list(pal)
palette = (palette + [0] * (768 - len(palette)))[:768]
pal_img = Image.new("P", (1, 1))
pal_img.putpalette(palette)

outf = []
for imx in rgbs:
    q = imx.quantize(palette=pal_img, dither=Image.Dither.NONE)
    arr = np.asarray(imx)
    key = (arr[:, :, 0] == KEY[0]) & (arr[:, :, 1] == KEY[1]) & (arr[:, :, 2] == KEY[2])
    idx = np.asarray(q, dtype=np.uint8).copy()
    idx[key] = 0
    p = Image.fromarray(idx, "P")
    p.putpalette(palette)
    outf.append(p)

total = 4000
base_ms = total // len(outf)
durs2 = [base_ms] * len(outf)
durs2[-1] += total - sum(durs2)
outf[0].save(
    OUT,
    save_all=True,
    append_images=outf[1:],
    duration=durs2,
    loop=0,
    disposal=2,
    transparency=0,
    optimize=False,
)
print(f"saved {OUT.stat().st_size/1024/1024:.2f} MB  frames={len(outf)} size={SIZE}")
