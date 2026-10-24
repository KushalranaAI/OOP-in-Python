"""Run a snippet of Python, JavaScript (Node.js) or C++ (g++/clang++) on this machine, with time and output limits.

This is a local learning tool: the code is the learner's own. The web layer still guards the endpoint with a
per-start token, a Host check and an Origin check, so other websites can't trigger it.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from functools import lru_cache
from pathlib import Path

MAX_SOURCE = 60_000
MAX_OUTPUT = 20_000
RUN_TIMEOUT = 10
COMPILE_TIMEOUT = 60


@lru_cache(maxsize=1)
def toolchains() -> dict[str, str | None]:
    return {
        "python": sys.executable,
        "javascript": shutil.which("node"),
        "cpp": shutil.which("g++") or shutil.which("clang++"),
    }


def _clip(text: str) -> str:
    return text if len(text) <= MAX_OUTPUT else text[:MAX_OUTPUT] + "\n… (output truncated)"


def _exec(cmd: list[str], cwd: str, timeout: int) -> tuple[int | None, str, str]:
    env = {**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONDONTWRITEBYTECODE": "1"}
    try:
        p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace",
                           timeout=timeout, env=env, stdin=subprocess.DEVNULL)
        return p.returncode, _clip(p.stdout), _clip(p.stderr)
    except subprocess.TimeoutExpired as e:
        out = e.stdout.decode(errors="replace") if isinstance(e.stdout, bytes) else (e.stdout or "")
        return None, _clip(out), f"⏱ Stopped after {timeout} seconds (an infinite loop?)"


def run(lang: str, code: str) -> dict:
    if lang not in toolchains():
        return {"ok": False, "stdout": "", "stderr": f"Unknown language {lang!r}", "phase": "setup"}
    if len(code) > MAX_SOURCE:
        return {"ok": False, "stdout": "", "stderr": "That program is too long for the playground.", "phase": "setup"}
    tool = toolchains()[lang]
    if tool is None:
        need = {"javascript": "Node.js (https://nodejs.org)", "cpp": "a C++ compiler - g++ (GCC) or clang++"}[lang]
        return {"ok": False, "stdout": "", "stderr": f"Install {need} to run this here. The expected output is shown instead.",
                "phase": "missing", "missing": True}
    with tempfile.TemporaryDirectory(prefix="oop-run-") as tmp:
        if lang == "python":
            Path(tmp, "main.py").write_text(code, encoding="utf-8")
            rc, out, err = _exec([tool, "-I", "-X", "utf8", "main.py"], tmp, RUN_TIMEOUT)   # -I ignores PYTHONIOENCODING
        elif lang == "javascript":
            Path(tmp, "main.js").write_text(code, encoding="utf-8")
            rc, out, err = _exec([tool, "main.js"], tmp, RUN_TIMEOUT)
        else:
            Path(tmp, "main.cpp").write_text(code, encoding="utf-8")
            exe = "main.exe" if os.name == "nt" else "main"
            rc, out, err = _exec([tool, "-std=c++20", "-Wall", "-O0", "main.cpp", "-o", exe], tmp, COMPILE_TIMEOUT)
            if rc != 0:
                return {"ok": False, "stdout": out, "stderr": err, "phase": "compile"}
            rc, out, run_err = _exec([str(Path(tmp, exe))], tmp, RUN_TIMEOUT)
            err = (err + run_err).strip()        # keep compiler warnings, they teach a lot
    return {"ok": rc == 0, "stdout": out, "stderr": err, "phase": "run", "exit_code": rc}
