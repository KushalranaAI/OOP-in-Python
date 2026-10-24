"""Content checks, real program outputs in all three languages, page rendering and the run API's guards.

Programs are run with the same runner the web app uses. A language whose toolchain is missing is skipped."""

from __future__ import annotations

import re
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import content, create_app  # noqa: E402
from app.runner import run, toolchains  # noqa: E402

LANGS = list(content.LANGS)
CONCEPTS = content.concepts()
PROJECTS = content.projects()
TOOLS = toolchains()


def needs(lang: str) -> None:
    if not TOOLS.get(lang):
        pytest.skip(f"no {lang} toolchain installed")


def run_ok(lang: str, code: str) -> str:
    result = run(lang, code)
    assert result["ok"], f"{result['phase']} failed:\n{result['stderr'][:2000]}"
    return result["stdout"]


# ---------------------------------------------------------------- content structure
def test_course_shape():
    assert len(CONCEPTS) == 11
    assert [c.order for c in CONCEPTS] == list(range(1, 12))
    assert len(PROJECTS) == 5
    assert all(len(lessons) >= 6 for lessons in content.basics().values())


@pytest.mark.parametrize("concept", CONCEPTS, ids=lambda c: c.slug)
def test_concept_is_complete(concept):
    assert concept.title and concept.summary and concept.why and concept.body
    assert set(concept.sections) == set(LANGS), "needs python.md, cpp.md and javascript.md"
    assert set(concept.examples) == set(LANGS), "needs example.py, example.cpp and example.js"
    assert all(example["expected"].strip() for example in concept.examples.values()), "missing .out file"
    for row in concept.compare:
        assert len(row) == 4, f"compare rows are [topic, python, cpp, javascript]: {row}"
    for question in concept.quiz:
        assert 0 <= question["answer"] < len(question["options"]) and question["explain"]


@pytest.mark.parametrize("project", PROJECTS, ids=lambda p: p.slug)
def test_project_is_complete(project):
    assert project.level and project.requirements and project.design.strip().startswith("classDiagram")
    assert set(project.implementations) == set(LANGS)
    assert all(isinstance(r, str) for r in project.requirements), "quote YAML items that contain ': '"
    known = {c.slug for c in CONCEPTS}
    assert set(project.concepts) <= known
    for number, step in enumerate(project.steps, start=1):
        assert step["title"] and step["body"]
        assert set(step["code"]) == set(LANGS), f"step {number} needs a '── Step {number}' marker in every language"
    for lang, impl in project.implementations.items():
        markers = [int(n) for n in re.findall(r"── Step (\d+)", impl["code"])]
        assert markers == list(range(1, len(project.steps) + 1)), f"{lang}: step markers {markers}"


# ---------------------------------------------------------------- real outputs
EXAMPLES = [(c.slug, lang) for c in CONCEPTS for lang in c.examples]
PROGRAMS = [(p.slug, lang) for p in PROJECTS for lang in p.implementations]


@pytest.mark.parametrize("slug,lang", EXAMPLES)
def test_concept_example_output(slug, lang):
    needs(lang)
    example = content.concept(slug).examples[lang]
    assert run_ok(lang, example["code"]) == example["expected"]


@pytest.mark.parametrize("slug,lang", PROGRAMS)
def test_project_output(slug, lang):
    needs(lang)
    impl = content.project(slug).implementations[lang]
    assert run_ok(lang, impl["code"]) == impl["expected"]


@pytest.mark.parametrize("slug", [p.slug for p in PROJECTS])
def test_projects_behave_the_same_in_every_language(slug):
    outputs = {impl["expected"] for impl in content.project(slug).implementations.values()}
    assert len(outputs) == 1, "the three implementations should print exactly the same thing"


def runnable_blocks():
    fence = {lang: re.compile(rf"^```{lang}\n(.*?)^```", re.S | re.M) for lang in LANGS}
    for md in sorted((content.CONTENT).rglob("*.md")):
        text = md.read_text(encoding="utf-8")
        for lang, pattern in fence.items():
            for i, match in enumerate(pattern.finditer(text)):
                yield pytest.param(lang, match.group(1), id=f"{md.relative_to(content.CONTENT)}#{lang}{i}")


@pytest.mark.parametrize("lang,code", list(runnable_blocks()))
def test_runnable_code_blocks_run(lang, code):
    needs(lang)
    run_ok(lang, code)


@pytest.mark.parametrize("name", sorted(p.stem for p in (content.CONTENT / "traces").glob("*.json")))
def test_trace_matches_real_program(name):
    trace = content.trace(name)
    needs(trace["lang"])
    final = trace["steps"][-1].get("out", "")
    assert run_ok(trace["lang"], trace["code"]).strip() == final.strip()


# ---------------------------------------------------------------- web app
@pytest.fixture(scope="module")
def client():
    app = create_app()
    app.config["TESTING"] = True
    return app.test_client(), app.config["RUN_TOKEN"]


def all_paths():
    paths = ["/", "/playground", "/compare", "/class-builder"]
    for lang, lessons in content.basics().items():
        paths.append(f"/basics/{lang}/")
        paths += [f"/basics/{lang}/{lesson.slug}" for lesson in lessons]
    paths += [f"/concepts/{c.slug}" for c in CONCEPTS]
    paths += [f"/projects/{p.slug}" for p in PROJECTS]
    return paths


@pytest.mark.parametrize("path", all_paths())
def test_page_renders(client, path):
    c, _ = client
    response = c.get(path)
    assert response.status_code == 200
    assert b"<h1" in response.data


def test_unknown_pages_404(client):
    c, _ = client
    assert c.get("/concepts/nope").status_code == 404
    assert c.get("/basics/cobol/").status_code == 404


def test_run_api_requires_token_json_and_local_host(client):
    c, token = client
    body = {"lang": "python", "code": "print(6 * 7)"}
    assert c.post("/api/run", json=body).status_code == 403                                   # no token
    assert c.post("/api/run", json=body, headers={"X-Run-Token": "wrong"}).status_code == 403
    assert c.post("/api/run", data="lang=python", headers={"X-Run-Token": token}).status_code == 403   # not JSON
    assert c.post("/api/run", json=body, headers={"X-Run-Token": token, "Origin": "https://evil.example"}).status_code == 403
    assert c.post("/api/run", json=body, headers={"X-Run-Token": token, "Host": "evil.example"}).status_code == 403
    ok = c.post("/api/run", json=body, headers={"X-Run-Token": token, "Origin": "http://127.0.0.1:5070"})
    assert ok.status_code == 200 and ok.get_json()["stdout"].strip() == "42"


def test_runner_reports_errors_and_unknown_languages():
    assert run("cobol", "DISPLAY 'hi'")["ok"] is False
    failing = run("python", "raise SystemExit('boom')")
    assert failing["ok"] is False and "boom" in failing["stderr"]
