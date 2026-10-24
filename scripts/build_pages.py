"""Builds the static copy of the course for GitHub Pages:

    python scripts/build_pages.py --base /OOP-All-In-One      # writes site/

Every page is rendered by the real Flask app in hosted mode (no server, so Run shows the expected output), under the
base path Pages serves the repo from. Then every internal link and asset is checked, so a broken page fails CI.
"""

from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from app import content, create_app  # noqa: E402

LINK = re.compile(r'(?:href|src)="([^"#?]*)')


def all_paths() -> list[str]:
    paths = ["/", "/progress", "/playground", "/compare", "/class-builder", "/concepts/", "/projects/"]
    for lang, lessons in content.basics().items():
        paths.append(f"/basics/{lang}/")
        paths += [f"/basics/{lang}/{lesson.slug}" for lesson in lessons]
    paths += [f"/concepts/{c.slug}" for c in content.concepts()]
    paths += [f"/projects/{p.slug}" for p in content.projects()]
    return paths


def file_for(path: str) -> str:
    """GitHub Pages serves /a/ from a/index.html and /a/b from a/b.html."""
    path = path.lstrip("/")
    if not path or path.endswith("/"):
        return path + "index.html"
    return path + ".html"


def build(out: Path, base: str) -> list[str]:
    """Renders the site into `out` and returns the internal links that point nowhere."""
    base = base.rstrip("/")
    if base and not base.startswith("/"):             # Git Bash rewrites "/repo" into "C:/Program Files/Git/repo"
        raise SystemExit(f"--base must start with '/', got {base!r} (in Git Bash, set MSYS_NO_PATHCONV=1)")
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    client = create_app(hosted=True).test_client()
    get = lambda path: client.get(path, environ_overrides={"SCRIPT_NAME": base})  # noqa: E731

    pages = {}
    for path in all_paths():
        response = get(path)
        if response.status_code != 200:
            raise SystemExit(f"{path}: HTTP {response.status_code}")
        pages[file_for(path)] = response.get_data(as_text=True)
    pages["404.html"] = get("/this-page-does-not-exist").get_data(as_text=True)

    for name, html in pages.items():
        (out / name).parent.mkdir(parents=True, exist_ok=True)
        (out / name).write_text(html, encoding="utf-8")
    shutil.copytree(ROOT / "app" / "static", out / "static")
    (out / ".nojekyll").write_text("")                 # serve files as they are, without Jekyll

    missing = set()
    for name, html in pages.items():
        for url in LINK.findall(html):
            if not url.startswith("/") or url.startswith("//"):
                continue                               # external, data: or relative
            if base and not url.startswith(base + "/") and url != base:
                missing.add(f"{name}: {url} (outside {base}/)")
                continue
            local = url[len(base):] or "/"
            if not ((out / local.lstrip("/")).is_file() or (out / file_for(local)).is_file()):
                missing.add(f"{name}: {url}")
    return sorted(missing)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the static GitHub Pages copy of the course.")
    parser.add_argument("--out", type=Path, default=ROOT / "site")
    parser.add_argument("--base", default="", help="path the site is served from, e.g. /OOP-All-In-One")
    args = parser.parse_args()
    missing = build(args.out, args.base)
    if missing:
        print("Broken internal links:", *missing, sep="\n  ")
        sys.exit(1)
    print(f"Built {sum(1 for _ in args.out.rglob('*.html'))} pages into {args.out}")


if __name__ == "__main__":
    main()
