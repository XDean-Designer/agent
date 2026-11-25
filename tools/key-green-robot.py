"""Shim → skill `tab-robot-intro` chroma-key script.

Prefer calling the skill path directly:

  python .cursor/skills/tab-robot-intro/scripts/key-green-robot.py --src <unkeyed.mp4>

This file keeps old `tools/` entrypoints working.
"""
from __future__ import annotations

import runpy
import sys
from pathlib import Path

_SKILL = (
    Path(__file__).resolve().parents[1]
    / ".cursor"
    / "skills"
    / "tab-robot-intro"
    / "scripts"
    / "key-green-robot.py"
)

if not _SKILL.is_file():
    raise SystemExit(f"skill script missing: {_SKILL}")

sys.argv[0] = str(_SKILL)
runpy.run_path(str(_SKILL), run_name="__main__")
