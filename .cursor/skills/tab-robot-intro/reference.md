# TAB Robot Intro — frozen B2 contract

Prototype: `agent-chat.html`. Asset: `assets/tab/agent-keyed.webm`.

## HTML

```html
<video id="introClip" class="intro-clip"
  width="512" height="512"
  muted playsinline webkit-playsinline
  preload="auto"
  src="assets/tab/agent-keyed.webm"></video>
```

Keep `src` path stable so swaps are drop-in.

## CSS (do not retune for asset swap)

| Selector / var | Role |
|----------------|------|
| `.intro-mascot` `--bot:96px` `--bot-h:152px` | Logical box |
| `--icon-scale:0.47` | Parked scale ≈ TAB AI |
| `--visual-bottom:90%` | Transform origin / shoulder line |
| `.intro-clip` object-fit contain; object-position center bottom | Framing |
| `.intro-clip` dual mask (bottom + side feather) | Soft edge into veil |
| `#frame.is-b2-open` veil / well / home-ai-cover | Atmosphere |

## JS constants (do not retune for asset swap)

| Constant | Value | Meaning |
|----------|-------|---------|
| `B2_ICON_SCALE` | `0.47` | Parked / handoff scale |
| `B2_IN_MS` | `380` | Scale-up |
| `B2_SETTLE_MS` | `120` | Pause before play |
| `B2_SHOW_MS` | `1600` | On-screen show |
| `B2_OUT_MS` | `320` | Scale-down |
| `B2_MEDIA_START` | `0.5` | Seek before play |
| `B2_HANDOFF_MS` | `150` | Opacity handoff |
| `B2_REVEAL_RATIO` | `0.68` | When to reveal TAB icon |
| `B2_REVEAL_EXTRA_MS` | `300` | Extra delay for icon |
| `B2_ANCHOR_X_NUDGE` | `2` | Pin offset |
| `B2_ANCHOR_Y_NUDGE` | `-3` | Pin offset |
| `B2_VISUAL_BOTTOM` | `0.90` | Match CSS |
| `B2_BOT_H` | `152` | Match `--bot-h` |

Choreography: park at AI → opacity on → scale to 1 → settle → play from 0.5s → seek start → scale to 0.47 + reveal cover → fade out.

## Script CLI

```text
python .cursor/skills/tab-robot-intro/scripts/key-green-robot.py \
  --src <unkeyed.mp4> \
  [--out-webm assets/tab/agent-keyed.webm] \
  [--out-dir out] \
  [--project-root .]
```

| Flag | Default |
|------|---------|
| `--src` | required |
| `--out-webm` | `assets/tab/agent-keyed.webm` |
| `--out-dir` | `out` |
| `--project-root` | cwd |

Previews under `--out-dir`: `agent-keyed-preview.png`, `agent-keyed-on-white.png`, `agent-keyed-mid.png`, `agent-keyed-antenna-white.png`.

## Matte pipeline (fixed params)

`OUT_SIZE=512`, `HEADROOM=28`, green soft matte, red antenna protect, motion-aware temporal, overhead ghost clean, `CHOKE=4`, `ALPHA_CRUSH=0.18`, white-edge finish, antenna cap restore, ffmpeg `libvpx-vp9` + `yuva420p`.

Do not casually change these when swapping footage; only adjust after user confirms matte QA failure.

## Out of scope

- TAB bar art (`tab-bar@3x.png`)
- Header still (`robot@3x.png`) / `assets/robot.svg`
- Non-green / already-alpha sources (ask first)
