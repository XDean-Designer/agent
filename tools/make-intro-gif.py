"""Convert agent intro MP4 → circular transparent GIF @ 30fps / 336px."""
from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

SRC = Path(r"D:/AI agent/assets/agent-intro.mp4")
OUT = Path(r"D:/AI agent/assets/tab/agent-intro.gif")
PREVIEW = Path(r"D:/AI agent/out/agent-intro-gif-preview.png")
SIZE = 280  # ~1.84× of 152 display; sharp enough, lighter file
FPS = 30
# Crop to full-size metallic rim. Early/late frames have a smaller ring
# inside this crop; the UI grows/shrinks the CSS circle to stay in sync.
RING_R = 422
# Full source length — do not trim the GIF asset
T0 = 0.0
T1 = None  # filled from source duration below

cap = cv2.VideoCapture(str(SRC))
if not cap.isOpened():
    raise SystemExit("cannot open " + str(SRC))

src_fps = cap.get(cv2.CAP_PROP_FPS) or 24
n_src = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
src_dur = n_src / src_fps
T1 = src_dur
clip_dur = T1 - T0
n_out = int(round(clip_dur * FPS))
print(f"src {n_src}f @{src_fps:.2f} ({src_dur:.2f}s) → FULL gif {n_out}f @{FPS}")

yy, xx = np.ogrid[:SIZE, :SIZE]
cy = cx = (SIZE - 1) / 2
dist = np.sqrt((yy - cy) ** 2 + (xx - cx) ** 2)
# soft circular matte: opaque inside, transparent outside
# rim sits at edge after crop, keep 0.5px feather
radius = SIZE / 2 - 0.5
alpha = np.clip((radius - dist) * 2 + 1, 0, 1)  # ~0.5px soft
alpha_u8 = (alpha * 255).astype(np.uint8)

frames_rgba: list[Image.Image] = []
side = RING_R * 2  # 844

for i in range(n_out):
    t = T0 + i / FPS
    # sample nearest source frame by time
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ok, bgr = cap.read()
    if not ok:
        cap.set(cv2.CAP_PROP_POS_FRAMES, min(n_src - 1, int(t * src_fps)))
        ok, bgr = cap.read()
    if not ok:
        break
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    h, w, _ = rgb.shape
    cx0, cy0 = w // 2, h // 2
    x0, y0 = cx0 - RING_R, cy0 - RING_R
    crop = rgb[y0 : y0 + side, x0 : x0 + side]
    im = Image.fromarray(crop).resize((SIZE, SIZE), Image.Resampling.LANCZOS).convert("RGBA")
    arr = np.asarray(im).copy()
    arr[:, :, 3] = alpha_u8
    frames_rgba.append(Image.fromarray(arr, "RGBA"))
    if i % 30 == 0:
        print(f"  frame {i}/{n_out}")

cap.release()
print("captured", len(frames_rgba))

# --- GIF encode: shared palette, KEY transparency ---
KEY = (0, 255, 0)
ALPHA_CUT = 32


def to_keyed(im: Image.Image) -> Image.Image:
    a = np.asarray(im)
    mask = a[:, :, 3] < ALPHA_CUT
    rgb = a[:, :, :3].copy()
    # avoid true KEY in opaque pixels
    hit = (rgb[:, :, 0] == 0) & (rgb[:, :, 1] == 255) & (rgb[:, :, 2] == 0) & ~mask
    rgb[hit] = (0, 254, 0)
    rgb[mask] = KEY
    return Image.fromarray(rgb, "RGB")


keyed = [to_keyed(im) for im in frames_rgba]

# Build palette from a temporal subsample for speed/quality balance
sample = keyed[:: max(1, len(keyed) // 24)]
sheet = Image.new("RGB", (SIZE * len(sample), SIZE))
for i, im in enumerate(sample):
    sheet.paste(im, (i * SIZE, 0))
quant = sheet.quantize(colors=180, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
base_pal = quant.getpalette()[: 180 * 3]
palette = [KEY[0], KEY[1], KEY[2]] + list(base_pal)
palette = (palette + [0] * (768 - len(palette)))[:768]
pal_img = Image.new("P", (1, 1))
pal_img.putpalette(palette)

frames_p: list[Image.Image] = []
for im in keyed:
    q = im.quantize(palette=pal_img, dither=Image.Dither.NONE)
    arr = np.asarray(im)
    is_key = (arr[:, :, 0] == KEY[0]) & (arr[:, :, 1] == KEY[1]) & (arr[:, :, 2] == KEY[2])
    idx = np.asarray(q, dtype=np.uint8).copy()
    idx[is_key] = 0
    out = Image.fromarray(idx, mode="P")
    out.putpalette(palette)
    frames_p.append(out)

# exact clip duration in ms
total_ms = int(round(1000 * len(frames_rgba) / FPS))
base = total_ms // len(frames_p)
durs = [base] * len(frames_p)
durs[-1] += total_ms - sum(durs)

OUT.parent.mkdir(parents=True, exist_ok=True)
frames_p[0].save(
    OUT,
    save_all=True,
    append_images=frames_p[1:],
    duration=durs,
    loop=0,
    disposal=2,
    transparency=0,
    optimize=False,
)

# preview strip
n = 8
picks = [frames_rgba[round(i * (len(frames_rgba) - 1) / (n - 1))] for i in range(n)]
strip = Image.new("RGBA", (SIZE * n, SIZE), (40, 40, 40, 255))
for i, fr in enumerate(picks):
    strip.paste(fr, (SIZE * i, 0), fr)
strip.convert("RGB").save(PREVIEW)

info = Image.open(OUT)
print(
    json.dumps(
        {
            "path": str(OUT),
            "bytes": OUT.stat().st_size,
            "kb": round(OUT.stat().st_size / 1024),
            "mb": round(OUT.stat().st_size / 1024 / 1024, 2),
            "size": list(info.size),
            "n_frames_attr": getattr(info, "n_frames", 1),
            "src_frames": len(frames_rgba),
            "duration_ms": total_ms,
            "ring_r": RING_R,
            "t0": T0,
            "t1": T1,
        }
    )
)
