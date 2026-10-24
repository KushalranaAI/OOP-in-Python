"""OOP in Python, C++ and JavaScript - a local, interactive course."""

from __future__ import annotations

import html
import re
import secrets

import markdown
from flask import Flask, abort, jsonify, render_template, request
from markupsafe import Markup

from . import content
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


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["RUN_TOKEN"] = secrets.token_urlsafe(24)       # new every start; pages embed it, other sites can't know it

    @app.template_filter("md")
    def md_filter(text):
        return render_markdown(text)

    @app.template_filter("mermaid")
    def mermaid_filter(src):
        return Markup(f'<pre class="mermaid">{html.escape((src or "").strip())}</pre>') if src else ""

    @app.context_processor
    def globals_():
        return {"LANGS": content.LANGS, "nav_concepts": content.concepts(), "nav_projects": content.projects(),
                "nav_basics": content.basics(), "run_token": app.config["RUN_TOKEN"], "toolchains": toolchains()}

    @app.get("/")
    def home():
        return render_template("home.html")

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

    @app.post("/api/run")
    def api_run():
        origin = request.headers.get("Origin")
        if (not LOCAL.match(request.host) or (origin and not LOCAL.match(re.sub(r"^https?://", "", origin)))
                or request.headers.get("X-Run-Token") != app.config["RUN_TOKEN"] or not request.is_json):
            abort(403)
        data = request.get_json()
        return jsonify(run(str(data.get("lang", "")), str(data.get("code", ""))))

    @app.errorhandler(404)
    def not_found(_):
        return render_template("404.html"), 404

    return app
