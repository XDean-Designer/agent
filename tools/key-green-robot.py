"""Chroma-key greenscreen robot → clean transparent WebM (512²).

Fixes:
- Motion-aware temporal smooth (no antenna ghost when dropping)
- Overhead ghost / green-fog cleanup
- Red antenna hue protect
- White-page edge finish + 1px choke
"""
from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

SRC = next(Path(r"D:/AI agent").glob("jimeng-2026-11-18-9154*.mp4"))
OUT_WEBM = Path(r"D:/AI agent/assets/tab/agent-keyed.webm")
OUT_PREVIEW = Path(r"D:/AI agent/out/agent-keyed-preview.png")
OUT_MID = Path(r"D:/AI agent/out/agent-keyed-mid.png")
OUT_WHITE = Path(r"D:/AI agent/out/agent-keyed-on-white.png")
OUT_ANT = Path(r"D:/AI agent/out/agent-keyed-antenna-white.png")

OUT_SIZE = 512
PRE_BLUR = 0.55
T_OPAQUE = 15.0
T_CLEAR = 38.0
CLOSE_K = 5
CORE_THRESH = 0.72
RIM_K = 3
TEMPORAL = 0.35
MOTION_DCY = 12.0       # centroid drop (px) → cut temporal
CHOKE = 4               # tighter matte to kill gray canvas fringe
WHITE_BLEND = 0.35      # less white rim (gray haze on dark veil)
ALPHA_CRUSH = 0.18      # near-zero alpha → hard 0 (kill soft gray plate)
BBOX_PAD = 4            # force clear outside content bbox


def sample_key_green(bgr: np.ndarray) -> np.ndarray:
    h, w = bgr.shape[:2]
    m, p = 12, 36
    boxes = [
        (m, m + p, m, m + p),
        (m, m + p, w - m - p, w - m),
        (h - m - p, h - m, m, m + p),
        (h - m - p, h - m, w - m - p, w - m),
        (m, m + p, w // 2 - p // 2, w // 2 + p // 2),
        (h - m - p, h - m, w // 2 - p // 2, w // 2 + p // 2),
        (h // 2 - p // 2, h // 2 + p // 2, m, m + p),
        (h // 2 - p // 2, h // 2 + p // 2, w - m - p, w - m),
    ]
    samples = []
    for y0, y1, x0, x1 in boxes:
        patch = bgr[y0:y1, x0:x1].reshape(-1, 3).astype(np.float32)
        b, g, r = patch[:, 0], patch[:, 1], patch[:, 2]
        greenness = g - np.maximum(r, b)
        keep = greenness > np.percentile(greenness, 40)
        if keep.sum() < 8:
            keep = slice(None)
        samples.append(patch[keep].mean(axis=0))
    return np.mean(samples, axis=0)


def greenness_map(bgr: np.ndarray) -> np.ndarray:
    f = bgr.astype(np.float32)
    b, g, r = f[:, :, 0], f[:, :, 1], f[:, :, 2]
    return g - np.maximum(r, b)


def red_antenna_mask(bgr: np.ndarray) -> np.ndarray:
    """Keep thin red antenna stem/ball from being keyed out."""
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    # OpenCV H: red wraps 0–10 and 170–180; include pink antenna tip
    red = (
        ((h <= 12) | (h >= 165))
        & (s > 55)
        & (v > 50)
    ).astype(np.uint8)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    red = cv2.morphologyEx(red, cv2.MORPH_CLOSE, k, iterations=2)
    red = cv2.dilate(red, k, iterations=1)
    return red.astype(bool)


def preprocess(bgr: np.ndarray) -> np.ndarray:
    if PRE_BLUR <= 0:
        return bgr
    return cv2.GaussianBlur(bgr, (0, 0), PRE_BLUR)


def raw_soft_alpha(bgr: np.ndarray) -> np.ndarray:
    gn = greenness_map(bgr)
    t = (gn - T_OPAQUE) / max(1e-6, T_CLEAR - T_OPAQUE)
    t = np.clip(t, 0, 1)
    a = 1.0 - (t * t * t * (t * (t * 6 - 15) + 10))
    a = a.astype(np.float32)

    # Protect red antenna before aggressive clears
    red = red_antenna_mask(bgr)
    a = np.where(red, np.maximum(a, 0.95), a)

    binary = (a > 0.35).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (CLOSE_K, CLOSE_K))
    closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=1)
    holes = (closed > 0) & (a < 0.35)
    a = np.where(holes, np.maximum(a, 0.92), a)

    key = sample_key_green(bgr)
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    ref = cv2.cvtColor(np.uint8([[key]]), cv2.COLOR_BGR2LAB)[0, 0].astype(np.float32)
    dab = np.sqrt((lab[:, :, 1] - ref[1]) ** 2 + (lab[:, :, 2] - ref[2]) ** 2)
    a = np.where((dab < 14) & (gn > 18) & (~red), 0.0, a)
    a = np.where((a < 0.28) & (gn > 10) & (~red), 0.0, a)

    ys, xs = np.where(a > 0.5)
    if len(ys) > 100:
        cy, cx = float(ys.mean()), float(xs.mean())
        yy, xx = np.ogrid[: a.shape[0], : a.shape[1]]
        dist = np.sqrt((yy - cy) ** 2 + (xx - cx) ** 2)
        far = dist > np.percentile(np.sqrt((ys - cy) ** 2 + (xs - cx) ** 2), 96) * 1.08
        a = np.where(far & (gn > 8) & (~red), 0.0, a)

    return np.clip(a, 0, 1).astype(np.float32)


def two_level_matte(raw: np.ndarray) -> np.ndarray:
    core = raw >= CORE_THRESH
    core_u8 = core.astype(np.uint8) * 255
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (RIM_K, RIM_K))
    dil = cv2.dilate(core_u8, k)
    rim = (dil > 0) & (~core)

    out = np.zeros_like(raw, np.float32)
    out[core] = 1.0
    rim_a = np.clip((raw - 0.15) / 0.7, 0, 1).astype(np.float32)
    rim_a = rim_a * rim_a * (3 - 2 * rim_a)
    out = np.where(rim, np.clip(rim_a * 0.85, 0.05, 0.85), out)
    out = np.where(dil > 0, out, 0.0)
    out = cv2.GaussianBlur(out, (0, 0), 0.45)
    out = np.where(dil > 0, np.clip(out, 0, 1), 0.0)
    out = np.where(core, 1.0, out)
    return out.astype(np.float32)


def centroid_y(alpha: np.ndarray) -> float | None:
    ys = np.where(alpha > 0.5)[0]
    if len(ys) < 50:
        return None
    return float(ys.mean())


def temporal_smooth_alphas(alphas: list[np.ndarray]) -> list[np.ndarray]:
    """Motion-aware temporal smooth: disable when centroid drops fast (antenna ghost)."""
    n = len(alphas)
    if n < 3:
        return alphas
    cys = [centroid_y(a) for a in alphas]
    out: list[np.ndarray] = []
    for i in range(n):
        cur = alphas[i]
        prev = alphas[i - 1] if i > 0 else cur
        nxt = alphas[i + 1] if i + 1 < n else cur
        # downward motion → no temporal blend (prevents overhead ghost)
        dcy = 0.0
        if i > 0 and cys[i] is not None and cys[i - 1] is not None:
            dcy = cys[i] - cys[i - 1]
        if dcy >= MOTION_DCY:
            out.append(cur.copy())
            continue
        stack = np.stack([prev, cur, nxt], axis=0)
        med = np.median(stack, axis=0).astype(np.float32)
        w = TEMPORAL
        # partial reduce if moderate motion
        if dcy >= MOTION_DCY * 0.45:
            w *= 0.25
        blended = (1.0 - w) * cur + w * med
        out.append(np.clip(blended, 0, 1).astype(np.float32))
    return out


def cleanup_overhead_ghost(alpha: np.ndarray, bgr: np.ndarray) -> np.ndarray:
    """Remove weakly attached / green-fog blobs above the head."""
    a = alpha.copy()
    gn = greenness_map(bgr)
    red = red_antenna_mask(bgr)

    # Kill greenish semi-transparent fog aggressively (keep red)
    fog = (a > 0.04) & (a < 0.88) & (gn > 8) & (~red)
    a = np.where(fog, 0.0, a)

    ys = np.where(a > 0.55)[0]
    if len(ys) < 80:
        return a
    y_top = int(np.percentile(ys, 8))  # near top of solid body

    # Connected components: drop small islands mostly above head
    bin_u8 = (a > 0.12).astype(np.uint8) * 255
    nlab, labels, stats, _ = cv2.connectedComponentsWithStats(bin_u8, connectivity=8)
    if nlab <= 2:
        return a
    # largest component = main body
    areas = stats[1:, cv2.CC_STAT_AREA]
    main = 1 + int(np.argmax(areas))
    for i in range(1, nlab):
        if i == main:
            continue
        top = stats[i, cv2.CC_STAT_TOP]
        area = stats[i, cv2.CC_STAT_AREA]
        comp = labels == i
        red_frac = float(red[comp].mean()) if comp.any() else 0.0
        # floating blob above head, or tiny non-red speck near antenna
        if (top < y_top + 10 and area < 3500 and red_frac < 0.35) or (area < 180 and red_frac < 0.5):
            a[comp] = 0.0

    # Soft halo strictly above solid head: clear unless red antenna
    above = np.zeros_like(a, bool)
    above[: max(0, y_top + 4), :] = True
    soft_above = above & (a > 0.02) & (a < 0.92) & (~red)
    # even if not very green — motion ghosts are often washed gray/white
    a = np.where(soft_above & ((gn > 3) | (a < 0.75)), 0.0, a)

    # Re-apply red antenna solid
    a = np.where(red, np.maximum(a, 0.97), a)
    return a.astype(np.float32)


def choke_alpha(alpha: np.ndarray, px: int = 1) -> np.ndarray:
    if px <= 0:
        return alpha
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (px * 2 + 1, px * 2 + 1))
    hard = (alpha > 0.5).astype(np.uint8) * 255
    eroded = cv2.erode(hard, k, iterations=1)
    # keep a thin soft rim from original just inside choke
    rim = (alpha > 0.05) & (eroded == 0) & (hard > 0)
    out = np.where(eroded > 0, np.maximum(alpha, 0.92), 0.0).astype(np.float32)
    out = np.where(rim, np.clip(alpha * 0.45, 0.0, 0.45), out)
    out = cv2.GaussianBlur(out, (0, 0), 0.30)
    out = np.where(eroded > 0, np.maximum(out, 0.9), out)
    return np.clip(out, 0, 1).astype(np.float32)


def crush_alpha(alpha: np.ndarray, floor: float = ALPHA_CRUSH) -> np.ndarray:
    """Hard-kill near-zero / soft fog alphas that read as gray canvas haze."""
    a = alpha.copy()
    a = np.where(a < floor, 0.0, a)
    # snap weak rim off — avoid mid-gray veils on dark veil pages
    weak = (a >= floor) & (a < 0.42)
    a = np.where(weak, 0.0, a)
    return a.astype(np.float32)


def clear_outside_bbox(alpha: np.ndarray, pad: int = BBOX_PAD) -> np.ndarray:
    ys, xs = np.where(alpha > 0.4)
    if len(ys) < 40:
        return crush_alpha(alpha)
    y0 = max(0, int(ys.min()) - pad)
    y1 = min(alpha.shape[0], int(ys.max()) + pad + 1)
    x0 = max(0, int(xs.min()) - pad)
    x1 = min(alpha.shape[1], int(xs.max()) + pad + 1)
    out = np.zeros_like(alpha)
    out[y0:y1, x0:x1] = alpha[y0:y1, x0:x1]
    return crush_alpha(out)


def despill_hard(bgr: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    out = bgr.astype(np.float32).copy()
    b, g, r = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    max_rb = np.maximum(r, b)
    spill = np.maximum(0.0, g - max_rb)
    rim = (alpha > 0.02) & (alpha < 0.98)
    core = alpha >= 0.98
    g2 = g.copy()
    g2 = np.where(rim, max_rb, g2)
    g2 = np.where(core, np.minimum(g, max_rb + 1.0), g2)
    g2 = np.where(alpha > 0.02, g2 - spill * 0.4 * (alpha < 0.98), g2)
    out[:, :, 1] = np.clip(g2, 0, 255)
    return out


def pull_edge_color(bgr: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    core = alpha > 0.92
    edge = (alpha > 0.02) & (alpha < 0.92)
    if not np.any(edge) or not np.any(core):
        return bgr
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    out = bgr.copy()
    for c in range(3):
        ch = np.zeros(alpha.shape, np.uint8)
        ch[core] = np.clip(bgr[:, :, c][core], 0, 255).astype(np.uint8)
        dil = cv2.dilate(ch, k)
        out[:, :, c] = np.where(edge, dil.astype(np.float32), out[:, :, c])
    return out


def white_edge_finish(bgr: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Blend rim toward white so leftover fringe vanishes on pure-white pages."""
    out = bgr.astype(np.float32).copy()
    rim = (alpha > 0.02) & (alpha < 0.97)
    if not np.any(rim):
        return out
    # stronger white blend on thinner alphas; also light blend on near-opaque rim shell
    w = WHITE_BLEND * np.clip(1.15 - alpha, 0.15, 1.0)
    w = np.clip(w, 0, 0.96)[..., None]
    white = np.array([255.0, 255.0, 255.0], np.float32)
    mixed = out * (1.0 - w) + white * w
    out = np.where(rim[..., None], mixed, out)
    # final green clamp on rim
    b, g, r = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    max_rb = np.maximum(r, b)
    g2 = np.where(rim, np.minimum(g, max_rb), g)
    out[:, :, 1] = g2
    return out


def compose_rgba(bgr_src: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    alpha = crush_alpha(clear_outside_bbox(alpha))
    rgb = despill_hard(bgr_src, alpha)
    rgb = pull_edge_color(rgb, alpha)
    rgb = white_edge_finish(rgb, alpha)
    # fully clear canvas: no residual RGB where transparent
    rgb = np.where(alpha[..., None] < 0.02, 0.0, rgb)
    rgba = np.dstack([rgb[:, :, 2], rgb[:, :, 1], rgb[:, :, 0], alpha * 255.0])
    return np.clip(rgba, 0, 255).astype(np.uint8)


def resize_rgba(rgba: np.ndarray, size: int) -> np.ndarray:
    im = Image.fromarray(rgba, "RGBA")
    im = im.resize((size, size), Image.Resampling.LANCZOS)
    out = np.asarray(im).astype(np.float32)
    # LANCZOS reintroduces soft fringe — crush again after resize
    a = out[:, :, 3] / 255.0
    a = crush_alpha(a, floor=max(ALPHA_CRUSH, 0.16))
    out[:, :, 3] = a * 255.0
    out[:, :, :3] = np.where(a[..., None] < 0.02, 0.0, out[:, :, :3])
    return np.clip(out, 0, 255).astype(np.uint8)


def checkerboard(h: int, w: int, cell: int = 16) -> np.ndarray:
    yy, xx = np.indices((h, w))
    c = ((yy // cell) + (xx // cell)) % 2
    base = np.where(c[..., None], 210, 245).astype(np.uint8)
    return np.repeat(base, 3, axis=2)


def composite_on(rgba: np.ndarray, bg: np.ndarray) -> np.ndarray:
    a = rgba[:, :, 3:4].astype(np.float32) / 255.0
    rgb = rgba[:, :, :3].astype(np.float32)
    return np.clip(rgb * a + bg.astype(np.float32) * (1 - a), 0, 255).astype(np.uint8)


def composite_preview(rgba: np.ndarray) -> np.ndarray:
    return composite_on(rgba, checkerboard(*rgba.shape[:2]))


def composite_white(rgba: np.ndarray) -> np.ndarray:
    bg = np.full((*rgba.shape[:2], 3), 255, np.uint8)
    return composite_on(rgba, bg)


def main() -> None:
    print("src", SRC)
    cap = cv2.VideoCapture(str(SRC))
    if not cap.isOpened():
        raise SystemExit("cannot open " + str(SRC))
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"{w}x{h} → {OUT_SIZE}x{OUT_SIZE} fps={fps:.3f} frames={n}")

    OUT_WEBM.parent.mkdir(parents=True, exist_ok=True)
    OUT_PREVIEW.parent.mkdir(parents=True, exist_ok=True)

    bgrs: list[np.ndarray] = []
    raw_alphas: list[np.ndarray] = []
    i = 0
    while True:
        ok, bgr = cap.read()
        if not ok:
            break
        pre = preprocess(bgr)
        bgrs.append(bgr)
        raw_alphas.append(two_level_matte(raw_soft_alpha(pre)))
        if i % 20 == 0:
            print(f"  matte {i}/{n}")
        i += 1
    cap.release()
    print("mattes", len(raw_alphas))

    alphas = temporal_smooth_alphas(raw_alphas)
    print("temporal (motion-aware) done")

    cleaned: list[np.ndarray] = []
    for bgr, a in zip(bgrs, alphas):
        a2 = cleanup_overhead_ghost(a, bgr)
        a2 = choke_alpha(a2, CHOKE)
        a2 = clear_outside_bbox(a2)
        cleaned.append(a2)
    print("ghost cleanup + choke + crush done")

    frames: list[np.ndarray] = []
    with tempfile.TemporaryDirectory(prefix="keyed_") as td:
        tdir = Path(td)
        for i, (bgr, a) in enumerate(zip(bgrs, cleaned)):
            rgba = compose_rgba(bgr, a)
            rgba = resize_rgba(rgba, OUT_SIZE)
            frames.append(rgba)
            Image.fromarray(rgba, "RGBA").save(tdir / f"f{i:04d}.png")
            if i % 20 == 0:
                print(f"  rgba {i}/{len(bgrs)}")

        mid = frames[len(frames) // 2]
        # downward-motion antenna frame ~90 at source → same index
        move_i = min(90, len(frames) - 1)
        move = frames[move_i]

        Image.fromarray(composite_preview(mid), "RGB").save(OUT_MID)
        Image.fromarray(composite_white(mid), "RGB").save(OUT_WHITE)

        # antenna crop on white for move frame
        a = move[:, :, 3]
        ys, xs = np.where(a > 128)
        if len(ys):
            y0, cx = int(ys.min()), int((xs.min() + xs.max()) / 2)
            crop = move[max(0, y0 - 8): y0 + 140, max(0, cx - 120): cx + 120]
            Image.fromarray(composite_white(crop), "RGB").save(OUT_ANT)

        n_strip = 6
        idxs = [round(j * (len(frames) - 1) / (n_strip - 1)) for j in range(n_strip)]
        strip = Image.new("RGB", (OUT_SIZE * n_strip, OUT_SIZE))
        for j, idx in enumerate(idxs):
            strip.paste(Image.fromarray(composite_white(frames[idx]), "RGB"), (j * OUT_SIZE, 0))
        strip.save(OUT_PREVIEW)
        print("preview", OUT_PREVIEW, OUT_WHITE, OUT_ANT)

        cmd = [
            "ffmpeg", "-y",
            "-framerate", f"{fps:.6f}",
            "-i", str(tdir / "f%04d.png"),
            "-c:v", "libvpx-vp9",
            "-pix_fmt", "yuva420p",
            "-auto-alt-ref", "0",
            "-b:v", "0",
            "-crf", "30",
            "-row-mt", "1",
            "-an",
            str(OUT_WEBM),
        ]
        print("ffmpeg", " ".join(cmd))
        subprocess.run(cmd, check=True)

    a = mid[:, :, 3].astype(np.float32) / 255.0
    rgb = mid[:, :, :3].astype(np.float32)
    edge = (a > 0.05) & (a < 0.95)
    spill = np.maximum(0, rgb[:, :, 1] - np.maximum(rgb[:, :, 0], rgb[:, :, 2]))
    # move-frame overhead soft alpha
    am = move[:, :, 3].astype(np.float32) / 255.0
    ys = np.where(am > 0.5)[0]
    overhead = 0.0
    if len(ys):
        y0 = int(ys.min())
        band = am[max(0, y0 - 25): y0 + 5, :]
        overhead = float(((band > 0.05) & (band < 0.85)).mean()) if band.size else 0.0

    info = {
        "src": SRC.name,
        "webm": str(OUT_WEBM),
        "mb": round(OUT_WEBM.stat().st_size / 1024 / 1024, 2),
        "size": OUT_SIZE,
        "frames": len(frames),
        "edge_spill_mean": round(float(spill[edge].mean()) if edge.any() else 0, 3),
        "move_overhead_soft_frac": round(overhead, 4),
        "opts": [
            "motion-temporal",
            "ghost-clean",
            "red-protect",
            "white-edge",
            f"choke{CHOKE}",
            f"crush{ALPHA_CRUSH}",
            "bbox-clear",
            f"{OUT_SIZE}px",
        ],
    }
    print(json.dumps(info, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
