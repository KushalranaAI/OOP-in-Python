"""Loads the course from content/: basics per language, OOP concepts (one folder each) and projects."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"

LANGS: dict[str, dict] = {
    "python": {"name": "Python", "icon": "🐍", "ext": ".py", "color": "#3776ab"},
    "cpp": {"name": "C++", "icon": "⚙️", "ext": ".cpp", "color": "#00599c"},
    "javascript": {"name": "JavaScript", "icon": "🟨", "ext": ".js", "color": "#c9a700"},
}


def read(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    if text.startswith("---\n"):
        _, meta, body = text.split("---\n", 2)
        return yaml.safe_load(meta) or {}, body
    return {}, text


def code_files(folder: Path, stem: str) -> dict[str, dict]:
    """{"python": {"code": ..., "expected": ...}, ...} for files like example.py / example.py.out."""
    out = {}
    for lang, info in LANGS.items():
        f = folder / f"{stem}{info['ext']}"
        if f.exists():
            expected = f.with_name(f.name + ".out")
            out[lang] = {"code": f.read_text(encoding="utf-8"), "expected": expected.read_text(encoding="utf-8") if expected.exists() else "",
                         "path": str(f.relative_to(ROOT))}
    return out


@dataclass(frozen=True)
class Lesson:
    lang: str
    slug: str
    order: int
    title: str
    summary: str
    body: str


@dataclass(frozen=True)
class Concept:
    slug: str
    order: int
    title: str
    icon: str
    summary: str
    why: str
    body: str
    widgets: list
    compare: list
    quiz: list
    sections: dict                 # lang -> markdown body
    examples: dict                 # lang -> {"code", "expected", "path"}


@dataclass(frozen=True)
class Project:
    slug: str
    order: int
    title: str
    icon: str
    level: str
    summary: str
    concepts: list
    requirements: list
    design: str
    steps: list
    body: str
    implementations: dict = field(default_factory=dict)     # lang -> {"code", "expected", "path"}


@lru_cache(maxsize=1)
def basics() -> dict[str, list[Lesson]]:
    tracks = {}
    for lang in LANGS:
        lessons = []
        for f in sorted((CONTENT / "basics" / lang).glob("*.md")):
            meta, body = read(f)
            lessons.append(Lesson(lang, f.stem, int(meta.get("order", 99)), meta.get("title", f.stem), meta.get("summary", ""), body))
        tracks[lang] = sorted(lessons, key=lambda l: l.order)
    return tracks


def lesson(lang: str, slug: str) -> Lesson | None:
    return next((l for l in basics().get(lang, []) if l.slug == slug), None)


@lru_cache(maxsize=1)
def concepts() -> list[Concept]:
    items = []
    for folder in sorted(p for p in (CONTENT / "concepts").iterdir() if (p / "index.md").exists()):
        meta, body = read(folder / "index.md")
        sections = {lang: read(folder / f"{lang}.md")[1] for lang in LANGS if (folder / f"{lang}.md").exists()}
        items.append(Concept(folder.name, int(meta.get("order", 99)), meta["title"], meta.get("icon", "🧱"), meta.get("summary", ""),
                             meta.get("why", ""), body, meta.get("widgets", []), meta.get("compare", []), meta.get("quiz", []),
                             sections, code_files(folder, "example")))
    return sorted(items, key=lambda c: c.order)


def concept(slug: str) -> Concept | None:
    return next((c for c in concepts() if c.slug == slug), None)


STEP_MARK = re.compile(r"^[ \t]*(?:#|//) ── Step (\d+)\b.*\n", re.M)


def step_snippets(code: str) -> dict[int, str]:
    """Split a full program at `# ── Step N ──` / `// ── Step N ──` comments -> {N: code of that step}."""
    marks = list(STEP_MARK.finditer(code))
    return {int(m.group(1)): code[m.start(): marks[i + 1].start() if i + 1 < len(marks) else len(code)].strip("\n")
            for i, m in enumerate(marks)}


@lru_cache(maxsize=1)
def projects() -> list[Project]:
    items = []
    for folder in sorted(p for p in (CONTENT / "projects").iterdir() if (p / "README.md").exists()):
        meta, body = read(folder / "README.md")
        impls = {}
        for lang, info in LANGS.items():
            impls.update({lang: v for k, v in code_files(folder / lang, "main").items() if k == lang})
        steps = [dict(step) for step in meta.get("steps", [])]
        snippets = {lang: step_snippets(impl["code"]) for lang, impl in impls.items()}
        for number, step in enumerate(steps, start=1):          # code comes from the real, tested program
            step.setdefault("code", {lang: parts[number] for lang, parts in snippets.items() if number in parts})
        items.append(Project(folder.name, int(meta.get("order", 99)), meta["title"], meta.get("icon", "🧩"), meta.get("level", ""),
                             meta.get("summary", ""), meta.get("concepts", []), meta.get("requirements", []), meta.get("design", ""),
                             steps, body, impls))
    return sorted(items, key=lambda p: p.order)


def project(slug: str) -> Project | None:
    return next((p for p in projects() if p.slug == slug), None)


def trace(name: str) -> dict:
    return json.loads((CONTENT / "traces" / f"{name}.json").read_text(encoding="utf-8"))


def all_compare_rows() -> list[tuple[Concept, list]]:
    return [(c, row) for c in concepts() for row in c.compare]
