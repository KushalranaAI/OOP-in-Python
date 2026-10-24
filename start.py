#!/usr/bin/env python3
"""Start the interactive OOP course with one command:

    python start.py                    # installs Flask etc. if needed and opens http://127.0.0.1:5070
    python start.py --port 8000 --no-browser

Python examples always run. JavaScript examples need Node.js and C++ examples need g++ or clang++;
without them the site shows the expected output instead.
"""

from __future__ import annotations

import argparse
import importlib.util
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REQUIRED = {"flask": "flask", "markdown": "markdown", "yaml": "pyyaml"}


def ensure_packages() -> None:
    missing = [pkg for module, pkg in REQUIRED.items() if importlib.util.find_spec(module) is None]
    if missing:
        print(f"Installing: {', '.join(missing)}")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(ROOT / "requirements.txt")], check=True)


def open_when_ready(url: str) -> None:
    for _ in range(60):
        try:
            urllib.request.urlopen(url, timeout=1)
            webbrowser.open(url)
            return
        except OSError:
            time.sleep(0.5)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the OOP in Python, C++ & JavaScript course.")
    parser.add_argument("--port", type=int, default=5070)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    if sys.version_info < (3, 10):
        sys.exit("Python 3.10 or newer is required.")
    ensure_packages()
    sys.path.insert(0, str(ROOT))
    from app import create_app
    from app.runner import toolchains

    tools = toolchains()
    print("Toolchains:", ", ".join(f"{k}: {'✓' if v else '✗ (expected output will be shown)'}" for k, v in tools.items()))
    url = f"http://127.0.0.1:{args.port}"
    print(f"\n🧱 OOP course running at {url}  (Ctrl+C to stop)\n")
    if not args.no_browser:
        threading.Thread(target=open_when_ready, args=(url,), daemon=True).start()
    # Only on 127.0.0.1: the site runs code on this machine.
    create_app().run(host="127.0.0.1", port=args.port, debug=False)


if __name__ == "__main__":
    main()
