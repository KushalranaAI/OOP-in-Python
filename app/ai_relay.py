"""A local-only relay that keeps AI keys on the server side, for the AI tutor.

The keys come from a `.env` file at the repository root (or real environment variables), are attached here to the
outgoing request, and are never sent to the browser. It only exists in the local app (`python start.py`); the static
GitHub Pages copy has no server, so there the tutor talks to the provider straight from the browser instead.

Because it spends the owner's key, it only answers the local page: the Host must be localhost (defeats DNS rebinding),
an Origin, if present, must match it (defeats other websites), and POSTs need the per-start run token.
"""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROVIDERS = ("openai", "anthropic", "azure")
SECRET_NAMES = ("OPENAI_API_KEY", "ANTHROPIC_API_KEY", "AZURE_OPENAI_API_KEY")
AZURE_HOST = re.compile(r"\.(openai\.azure\.com|cognitiveservices\.azure\.com|services\.ai\.azure\.com)$")
ENV_LINE = re.compile(r"^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$")
MAX_BODY = 2_000_000
TIMEOUT = 120


def read_env(path: Path | None = None) -> dict[str, str]:
    """KEY=value lines, optional quotes, # comments. Read per request, so editing .env needs no restart.
    Real environment variables win, so tests can pass fake keys without touching your .env."""
    out: dict[str, str] = {}
    try:
        lines = (path or ROOT / ".env").read_text(encoding="utf-8").splitlines()
    except OSError:
        lines = []
    for line in lines:
        m = ENV_LINE.match(line)
        if not m:
            continue
        value = m.group(2)
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        else:
            value = re.sub(r"\s+#.*$", "", value)
        out[m.group(1)] = value
    out.update({k: v for k, v in os.environ.items() if re.match(r"^(OPENAI|ANTHROPIC|AZURE_OPENAI)_", k)})
    return out


def _val(env: dict, key: str) -> str:
    return (env.get(key) or "").strip()


def azure_base(env: dict) -> str | None:
    u = urllib.parse.urlsplit(_val(env, "AZURE_OPENAI_ENDPOINT"))
    return f"https://{u.netloc}" if u.scheme == "https" and u.hostname and AZURE_HOST.search(u.hostname) else None


def server_keys(env: dict) -> dict[str, bool]:
    """Which providers are fully configured. Booleans only: never the values."""
    return {
        "openai": bool(_val(env, "OPENAI_API_KEY")),
        "anthropic": bool(_val(env, "ANTHROPIC_API_KEY")),
        "azure": bool(_val(env, "AZURE_OPENAI_API_KEY") and _val(env, "AZURE_OPENAI_DEPLOYMENT") and azure_base(env)),
    }


def upstream_for(provider: str, rest: str, env: dict, headers) -> tuple[str, dict] | tuple[int, str]:
    """The only URLs the relay will call, one per provider. The browser can't choose the destination."""
    if provider not in PROVIDERS or not server_keys(env)[provider]:
        return 501, f"No {provider} key is configured in .env on this computer."
    if provider == "openai" and rest == "v1/chat/completions":
        return "https://api.openai.com/v1/chat/completions", {"authorization": f"Bearer {_val(env, 'OPENAI_API_KEY')}"}
    if provider == "anthropic" and rest == "v1/messages":
        return "https://api.anthropic.com/v1/messages", {"x-api-key": _val(env, "ANTHROPIC_API_KEY"),
                                                          "anthropic-version": headers.get("anthropic-version", "2023-06-01")}
    if provider == "azure" and rest == "chat/completions":
        version = _val(env, "AZURE_OPENAI_API_VERSION") or "2024-10-21"
        deployment = urllib.parse.quote(_val(env, "AZURE_OPENAI_DEPLOYMENT"), safe="")
        return (f"{azure_base(env)}/openai/deployments/{deployment}/chat/completions?api-version={urllib.parse.quote(version)}",
                {"api-key": _val(env, "AZURE_OPENAI_API_KEY")})
    return 404, "Unknown relay path."


def redact(text: str, env: dict) -> str:
    """Providers echo a masked copy of a bad key in 401 messages. The browser must not see even that much."""
    for name in SECRET_NAMES:
        value = _val(env, name)
        if len(value) >= 8:
            text = text.replace(value, "[key hidden]")
    return re.sub(r"[A-Za-z0-9_-]*\*{3,}[A-Za-z0-9_-]*", "[key hidden]", text)


def forward(url: str, headers: dict, body: bytes, env: dict, opener=None):
    """POSTs to the provider. Returns (status, content_type, chunks) where chunks streams the reply as it arrives."""
    req = urllib.request.Request(url, data=body, method="POST", headers={"content-type": "application/json", **headers})
    try:
        resp = (opener or urllib.request.urlopen)(req, timeout=TIMEOUT)
    except urllib.error.HTTPError as e:                  # small JSON error: buffer it and remove any key
        text = redact(e.read().decode("utf-8", "replace"), env)
        return e.code, e.headers.get("content-type", "application/json"), [text.encode()]
    except (urllib.error.URLError, OSError) as e:
        reason = getattr(e, "reason", e)
        message = f"Couldn't reach the AI provider: {redact(str(reason), env)}"
        return 502, "application/json", [json.dumps({"error": {"message": message}}).encode()]

    def chunks():
        with resp:
            read = getattr(resp, "read1", resp.read)
            while chunk := read(8192):
                yield chunk
    return resp.status, resp.headers.get("content-type", "application/json"), chunks()
