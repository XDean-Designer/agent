---
name: tab-robot-intro
description: >-
  Swap TAB B2 robot intro footage: greenscreen (unkeyed) → transparent
  agent-keyed.webm with the same B2 scale/veil/timing. Use when replacing
  robot animation material, re-keying tab intro WebM, B2 机器人进场动画,
  or 绿幕抠像换素材 without changing motion choreography.
---

# TAB Robot Intro (B2)

Replace **only** the robot video asset. Keep B2 choreography (scale, veil, well, feather mask, `B2_*` timings) frozen so the effect stays identical.

## Hard rules

1. Read this skill first; do **not** retune CSS/JS timing when swapping footage.
2. Input is **unkeyed greenscreen** video (uniform green behind subject). Non-green → stop and ask.
3. Output must overwrite the prototype path: `assets/tab/agent-keyed.webm` (VP9 + alpha, 512²).
4. Do **not** change: `#introClip` src path, `.intro-mascot` / `.intro-clip` CSS, `B2_*` constants in `agent-chat.html`, TAB pixel art, or Header `robot@3x.png`.
5. Deps: Python 3 + `opencv-python` + `numpy` + `Pillow` + `ffmpeg` with `libvpx-vp9`.

## Workflow

### 1. Collect input

Ask only if missing:

| Field | Default |
|-------|---------|
| Source video | User-provided greenscreen mp4/mov |
| `--out-webm` | `assets/tab/agent-keyed.webm` |
| `--out-dir` | `out/` |

### 2. Key → WebM

From **project root**:

```bash
python ".cursor/skills/tab-robot-intro/scripts/key-green-robot.py" \
  --src "<path-to-unkeyed.mp4>" \
  --out-webm "assets/tab/agent-keyed.webm" \
  --out-dir "out" \
  --project-root .
```

Script does: green matte → motion-aware temporal → ghost clean → choke → despill → white-edge → antenna cap → 512 canvas → VP9 yuva420p.

### 3. Verify (one pass)

1. Open `out/agent-keyed-preview.png` (strip) and `out/agent-keyed-on-white.png`.
2. Check: no green spill; antenna intact; no gray fog plate; transparent outside subject.
3. Optional: load homepage → B2 plays once from TAB AI slot with same scale-in / show / scale-out.

If matte fails (uneven green, wrong subject), stop and ask — do not invent new B2 timings.

## Source constraints

- Uniform greenscreen; subject roughly centered
- Prefer 1–3s loop-friendly clip; B2 seeks `B2_MEDIA_START = 0.5` then plays ~1.6s show window
- Red antenna / pink tip protected by hue mask — keep those hues if the new character has them

## Freeze list (do not edit for asset swap)

See [reference.md](reference.md) for exact `B2_*` values, CSS vars, and HTML video attrs.

## Additional resources

- [reference.md](reference.md) — frozen B2 contract + script flags
- Script: [scripts/key-green-robot.py](scripts/key-green-robot.py)
