"""The AI tutor's local relay: keys from .env are used on the server and never reach the browser.

No real provider is called: the HTTP opener is replaced, and .env is read from an empty temporary folder."""

from __future__ import annotations

import io
import json
import sys
import urllib.error
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import ai_relay, create_app  # noqa: E402

FAKE_KEY = "sk-test-0123456789abcdef"
LOCAL = {"Origin": "http://127.0.0.1:5070"}


@pytest.fixture
def relay(tmp_path, monkeypatch):
    monkeypatch.setattr(ai_relay, "ROOT", tmp_path)                      # never your real .env
    for name in ("OPENAI_API_KEY", "ANTHROPIC_API_KEY", "AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_DEPLOYMENT"):
        monkeypatch.delenv(name, raising=False)
    app = create_app()
    return app.test_client(), app.config["RUN_TOKEN"], monkeypatch, tmp_path


class FakeResponse(io.BytesIO):
    status = 200
    headers = {"content-type": "text/event-stream"}


def test_env_file_parsing(tmp_path):
    (tmp_path / ".env").write_text('# comment\nOPENAI_API_KEY="quoted"\nexport ANTHROPIC_API_KEY=plain  # note\nNOT A LINE\n', encoding="utf-8")
    env = ai_relay.read_env(tmp_path / ".env")
    assert env["OPENAI_API_KEY"] == "quoted" and env["ANTHROPIC_API_KEY"] == "plain"


def test_status_reports_booleans_never_values(relay):
    c, _, mp, root = relay
    assert c.get("/api/ai-server", headers=LOCAL).get_json() == {"openai": False, "anthropic": False, "azure": False}
    (root / ".env").write_text(f"OPENAI_API_KEY={FAKE_KEY}\nAZURE_OPENAI_API_KEY={FAKE_KEY}\nAZURE_OPENAI_DEPLOYMENT=d\n"
                               "AZURE_OPENAI_ENDPOINT=https://evil.example.com\n", encoding="utf-8")
    r = c.get("/api/ai-server", headers=LOCAL)
    assert r.get_json() == {"openai": True, "anthropic": False, "azure": False}       # non-Azure endpoint is refused
    assert FAKE_KEY not in r.get_data(as_text=True)


def test_relay_refuses_other_sites_and_missing_token(relay):
    c, token, mp, _ = relay
    mp.setenv("OPENAI_API_KEY", FAKE_KEY)
    called = []
    mp.setattr(ai_relay.urllib.request, "urlopen", lambda *a, **k: called.append(1))
    url = "/api/ai-server/openai/v1/chat/completions"
    assert c.post(url, json={}, headers=LOCAL).status_code == 403                                           # no token
    assert c.post(url, json={}, headers={"X-Run-Token": token, "Origin": "https://evil.example"}).status_code == 403
    assert c.post(url, json={}, headers={"X-Run-Token": token, "Host": "evil.example"}).status_code == 403
    assert c.get("/api/ai-server", headers={"Origin": "https://evil.example"}).status_code == 403
    assert c.post("/api/ai-server/openai/v1/models", json={}, headers={"X-Run-Token": token, **LOCAL}).status_code == 404
    assert c.post("/api/ai-server/anthropic/v1/messages", json={}, headers={"X-Run-Token": token, **LOCAL}).status_code == 501
    assert called == []                                                                                      # nothing went out


def test_relay_attaches_key_and_streams_reply(relay):
    c, token, mp, _ = relay
    mp.setenv("ANTHROPIC_API_KEY", FAKE_KEY)
    seen = {}

    def fake_urlopen(req, timeout):
        seen.update(url=req.full_url, key=req.get_header("X-api-key"), body=json.loads(req.data))
        return FakeResponse(b'data: {"type": "content_block_delta"}\n\n')

    mp.setattr(ai_relay.urllib.request, "urlopen", fake_urlopen)
    r = c.post("/api/ai-server/anthropic/v1/messages", json={"model": "m", "messages": []}, headers={"X-Run-Token": token, **LOCAL})
    assert r.status_code == 200 and r.content_type == "text/event-stream"
    assert b"content_block_delta" in r.data
    assert seen == {"url": "https://api.anthropic.com/v1/messages", "key": FAKE_KEY, "body": {"model": "m", "messages": []}}


def test_relay_hides_keys_in_provider_errors(relay):
    c, token, mp, _ = relay
    mp.setenv("OPENAI_API_KEY", FAKE_KEY)
    message = json.dumps({"error": {"message": f"Incorrect API key provided: {FAKE_KEY} (sk-te************cdef)"}}).encode()

    def fake_urlopen(req, timeout):
        raise urllib.error.HTTPError(req.full_url, 401, "Unauthorized", {"content-type": "application/json"}, io.BytesIO(message))

    mp.setattr(ai_relay.urllib.request, "urlopen", fake_urlopen)
    r = c.post("/api/ai-server/openai/v1/chat/completions", json={}, headers={"X-Run-Token": token, **LOCAL})
    text = r.get_data(as_text=True)
    assert r.status_code == 401 and FAKE_KEY not in text and "****" not in text and "[key hidden]" in text


def test_hosted_copy_has_no_relay():
    c = create_app(hosted=True).test_client()
    assert c.get("/api/ai-server", headers=LOCAL).status_code == 404
