"""OOP in Python, C++ and JavaScript - a local, interactive course."""

from __future__ import annotations

import hashlib
import html
import os
import re
import secrets
from functools import lru_cache

import markdown
from flask import Flask, Response, abort, jsonify, render_template, request, stream_with_context
from markupsafe import Markup

from . import ai_relay, content
from .brand import BRAND
from .runner import run, toolchains

LOCAL = re.compile(r"^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$")
MERMAID = re.compile(r"^```mermaid\n(.*?)^```", re.S | re.M)


def render_markdown(text: str) -> Markup:
    diagrams: list[str] = []

    def stash(m: re.Match) -> str:
        diagrams.append(m.group(1))
        return f"\n\nMERMAID{len(diagrams) - 1}X\n\n"

    out = markdown.markdown(MERMAID.sub(stash, text or ""), extensions=["fenced_code", "tables", "sane_lists", "toc"])
    for i, src in enumerate(diagrams):
        out = out.replace(f"<p>MERMAID{i}X</p>", f'<pre class="mermaid">{html.escape(src.strip())}</pre>')
    return Markup(out)


def minutes(*texts: str, extra: int = 3) -> int:
    """Rough study time: reading at ~150 words a minute plus time to run and tweak the code."""
    return round(sum(len(t.split()) for t in texts) / 150) + extra


@lru_cache(maxsize=1)
def course_index() -> list[dict]:
    """Every page a learner can finish, in course order. Feeds the sidebar counts, dashboard, progress page and search."""
    items = []
    for lang, lessons in content.basics().items():
        name = content.LANGS[lang]["name"]
        items += [{"id": f"b:{lang}/{l.slug}", "kind": "basics", "group": f"{name} basics", "lang": lang, "title": l.title,
                   "summary": l.summary, "href": f"/basics/{lang}/{l.slug}", "minutes": minutes(l.body)} for l in lessons]
    items += [{"id": f"c:{c.slug}", "kind": "concept", "group": "OOP concepts", "title": c.title, "icon": c.icon, "order": c.order,
               "summary": c.summary, "href": f"/concepts/{c.slug}", "minutes": minutes(c.body, c.sections.get("python", ""), extra=3 + 2 * len(c.widgets) + len(c.quiz))}
              for c in content.concepts()]
    items += [{"id": f"p:{p.slug}", "kind": "project", "group": "Projects", "title": p.title, "icon": p.icon, "level": p.level,
               "summary": p.summary, "href": f"/projects/{p.slug}", "steps": len(p.steps), "minutes": 20 + 8 * len(p.steps)}
              for p in content.projects()]
    return items


REPO_URL = "https://github.com/KushalranaAI/OOP-All-In-One"
WATCHED = (content.CONTENT, content.ROOT / "app" / "templates", content.ROOT / "app" / "static")


def files_signature() -> str:
    """Changes whenever a file under content/, templates/ or static/ is added, removed or edited."""
    h = hashlib.sha1()
    for folder in WATCHED:
        for dirpath, dirnames, filenames in os.walk(folder):
            dirnames.sort()
            for name in sorted(filenames):
                st = os.stat(os.path.join(dirpath, name))
                h.update(f"{dirpath}/{name}:{st.st_mtime_ns}:{st.st_size};".encode())
    return h.hexdigest()[:16]


def clear_content_caches() -> None:
    for cached in (content.basics, content.concepts, content.projects, course_index):
        cached.cache_clear()


def create_app(hosted: bool = False, live_reload: bool = False) -> Flask:
    """hosted=True renders the static copy for GitHub Pages: no server, so Run shows the expected output instead.
    live_reload=True (python start.py) re-reads content and refreshes open pages whenever a file changes."""
    app = Flask(__name__)
    app.config["RUN_TOKEN"] = secrets.token_urlsafe(24)       # new every start; pages embed it, other sites can't know it
    app.config["HOSTED"] = hosted
    app.config["TEMPLATES_AUTO_RELOAD"] = live_reload
    boot = secrets.token_hex(4)                              # a restart (after a .py change) also refreshes open pages
    watch = {"signature": files_signature() if live_reload else ""}

    @app.template_filter("md")
    def md_filter(text):
        return render_markdown(text)

    @app.template_filter("mermaid")
    def mermaid_filter(src):
        return Markup(f'<pre class="mermaid">{html.escape((src or "").strip())}</pre>') if src else ""

    @app.context_processor
    def globals_():
        return {"LANGS": content.LANGS, "nav_concepts": content.concepts(), "nav_projects": content.projects(),
                "nav_basics": content.basics(), "run_token": "" if hosted else app.config["RUN_TOKEN"],
                "toolchains": toolchains(), "BRAND": BRAND, "hosted": hosted, "REPO_URL": REPO_URL, "live_reload": live_reload and not hosted,
                # hrefs carry the base path, so the same pages work under /<repo>/ on GitHub Pages
                "course": [dict(c, href=request.script_root + c["href"]) for c in course_index()]}

    @app.get("/")
    def home():
        return render_template("home.html")

    @app.get("/progress")
    def progress():
        return render_template("progress.html")

    @app.get("/concepts/")
    def concepts_index():
        return render_template("concepts.html")

    @app.get("/projects/")
    def projects_index():
        return render_template("projects.html")

    @app.get("/basics/<lang>/")
    def track(lang):
        if lang not in content.LANGS:
            abort(404)
        return render_template("track.html", lang=lang, lessons=content.basics()[lang])

    @app.get("/basics/<lang>/<slug>")
    def lesson(lang, slug):
        item = content.lesson(lang, slug) or abort(404)
        lessons = content.basics()[lang]
        i = lessons.index(item)
        return render_template("lesson.html", lesson=item, lang=lang, prev=lessons[i - 1] if i else None,
                               next=lessons[i + 1] if i + 1 < len(lessons) else None)

    @app.get("/concepts/<slug>")
    def concept(slug):
        item = content.concept(slug) or abort(404)
        items = content.concepts()
        i = items.index(item)
        traces = {name: content.trace(name) for w in item.widgets for name in (w.get("traces") or {}).values()}
        return render_template("concept.html", c=item, traces=traces, prev=items[i - 1] if i else None,
                               next=items[i + 1] if i + 1 < len(items) else None)

    @app.get("/projects/<slug>")
    def project(slug):
        item = content.project(slug) or abort(404)
        return render_template("project.html", p=item, concept_titles={c.slug: c for c in content.concepts()})

    @app.get("/playground")
    def playground():
        return render_template("playground.html")

    @app.get("/compare")
    def compare():
        return render_template("compare.html", rows=content.all_compare_rows())

    @app.get("/class-builder")
    def class_builder():
        return render_template("class_builder.html")

    def local_page(require_token: bool) -> bool:
        """Only this machine's own pages: a localhost Host and Origin, and for anything that acts, the run token."""
        origin = request.headers.get("Origin")
        return bool(LOCAL.match(request.host) and not (origin and not LOCAL.match(re.sub(r"^https?://", "", origin)))
                    and (not require_token or request.headers.get("X-Run-Token") == app.config["RUN_TOKEN"]))

    @app.post("/api/run")
    def api_run():
        if hosted:
            abort(404)
        if not local_page(require_token=True) or not request.is_json:
            abort(403)
        data = request.get_json()
        return jsonify(run(str(data.get("lang", "")), str(data.get("code", ""))))

    @app.get("/api/live-reload")
    def live_reload_version():
        if hosted or not live_reload:
            abort(404)
        if not local_page(require_token=False):
            abort(403)
        signature = files_signature()
        if signature != watch["signature"]:              # content is cached in memory: re-read it
            clear_content_caches()
            watch["signature"] = signature
        return jsonify(version=f"{boot}:{signature}"), 200, {"Cache-Control": "no-store"}

    # AI tutor relay: keys from .env are attached here and never reach the browser (see ai_relay.py).
    @app.get("/api/ai-server")
    def ai_status():
        if hosted:
            abort(404)
        if not local_page(require_token=False):
            abort(403)
        return jsonify(ai_relay.server_keys(ai_relay.read_env())), 200, {"Cache-Control": "no-store"}

    @app.post("/api/ai-server/<provider>/<path:rest>")
    def ai_forward(provider, rest):
        if hosted:
            abort(404)
        if not local_page(require_token=True):
            return jsonify(error={"message": "This relay only answers the local app."}), 403
        env = ai_relay.read_env()
        target = ai_relay.upstream_for(provider, rest, env, request.headers)
        if isinstance(target[0], int):
            return jsonify(error={"message": target[1]}), target[0]
        if (request.content_length or 0) > ai_relay.MAX_BODY:
            return jsonify(error={"message": "Request too large."}), 413
        status, ctype, chunks = ai_relay.forward(target[0], target[1], request.get_data(), env)
        return Response(stream_with_context(chunks), status=status, content_type=ctype, headers={"Cache-Control": "no-store"})

    @app.errorhandler(404)
    def not_found(_):
        return render_template("404.html"), 404

    return app
