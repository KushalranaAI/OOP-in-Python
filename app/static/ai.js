// AI tutor: a chat panel that knows the page you're on. Bring your own model:
//  - keys in the repository's .env  -> the local app attaches them server-side (app/ai_relay.py); the browser never sees them
//  - a key typed here               -> encrypted in this browser and sent only to the provider you picked
//  - Ollama / any local server      -> nothing leaves your computer
(function () {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const TOKEN = $('meta[name="run-token"]').content;
  const BASE = $('meta[name="base-path"]').content;
  const HOSTED = !!$('meta[name="hosted"]');
  const ON_LOCALHOST = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
                  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  const ICONS = {
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
    send: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
    arrow: '<path d="m9 6 6 6-6 6"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  };
  const icon = (n, s = 16) => `<svg class="icon" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

  // ---------------------------------------------------------------- providers
  const PROVIDERS = [
    { id: "ollama", label: "Ollama", tagline: "Runs on your computer. Free, private, works offline.", kind: "openai", baseUrl: "http://localhost:11434/v1",
      editableBaseUrl: true, needsKey: false, defaultModel: "llama3.2", contextChars: 4000,
      setup: "Install Ollama from ollama.com, run `ollama pull llama3.2`, and leave it running. On the hosted copy, start Ollama with OLLAMA_ORIGINS=* so this page may call it." },
    { id: "custom", label: "Local server / other", tagline: "LM Studio, llama.cpp, vLLM … any OpenAI-compatible server on this computer.", kind: "openai",
      baseUrl: "http://localhost:1234/v1", editableBaseUrl: true, needsKey: false, optionalKey: true, defaultModel: "", contextChars: 6000,
      setup: "Start the server with CORS enabled and paste its base URL. For safety only localhost / 127.0.0.1 servers are allowed." },
    { id: "anthropic", label: "Claude (Anthropic)", tagline: "Strongest explanations. Needs an API key.", kind: "anthropic", baseUrl: "https://api.anthropic.com",
      needsKey: true, keyUrl: "https://console.anthropic.com/settings/keys", defaultModel: "claude-sonnet-5-5", contextChars: 16000,
      setup: "Create a key in the Anthropic console. Usage is billed to your account." },
    { id: "openai", label: "OpenAI", tagline: "GPT models. Needs an API key.", kind: "openai", baseUrl: "https://api.openai.com/v1",
      needsKey: true, keyUrl: "https://platform.openai.com/api-keys", defaultModel: "gpt-4o-mini", contextChars: 16000,
      setup: "Create a key on the OpenAI platform. Usage is billed to your account." },
    { id: "azure", label: "Azure OpenAI", tagline: "Your own Azure deployment. Only when running locally.", kind: "azure", baseUrl: "", localOnly: true,
      editableBaseUrl: true, baseLabel: "Azure OpenAI endpoint", basePlaceholder: "https://YOUR-RESOURCE.openai.azure.com", needsKey: true,
      defaultModel: "", modelLabel: "Deployment name", contextChars: 16000,
      setup: "Azure portal → your Azure OpenAI resource → Keys and Endpoint. Use the deployment name from Azure AI Foundry, not the model name." },
    { id: "gemini", label: "Google Gemini", tagline: "Gemini models. Has a free tier.", kind: "gemini", baseUrl: "https://generativelanguage.googleapis.com",
      needsKey: true, keyUrl: "https://aistudio.google.com/apikey", defaultModel: "gemini-2.0-flash", contextChars: 16000,
      setup: "Create a key in Google AI Studio." },
  ].filter((p) => !p.localOnly || (ON_LOCALHOST && !HOSTED));
  const byId = (id) => PROVIDERS.find((p) => p.id === id) || PROVIDERS[0];
  const SERVER_SIDE = ["azure", "anthropic", "openai"];          // providers the local relay can serve from .env

  // ---------------------------------------------------------------- settings + encrypted credentials
  const DEFAULTS = { provider: "ollama", models: {}, urls: {}, shareContext: true, contextChars: null, configured: false,
                     azureApiVersion: "2024-10-21", storage: "device" };
  let settings = { ...DEFAULTS, ...store.get("oop-ai-settings", {}) };
  const saveSettings = () => store.set("oop-ai-settings", settings);
  let keys = {};                                       // decrypted, in memory only
  let server = { openai: false, anthropic: false, azure: false };

  // Keys are encrypted with an AES-GCM key the browser generates and keeps in IndexedDB as non-extractable: page code can
  // use it but nobody can read it out. "device" keeps the ciphertext in localStorage, "session" in sessionStorage.
  const CRYPTO = !!(window.crypto?.subtle && window.indexedDB);
  function deviceKey() {
    return new Promise((resolve, reject) => {
      const open = indexedDB.open("oop-ai", 1);
      open.onupgradeneeded = () => open.result.createObjectStore("keys");
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result, get = db.transaction("keys").objectStore("keys").get("device");
        get.onsuccess = async () => {
          if (get.result) return resolve(get.result);
          const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
          const put = db.transaction("keys", "readwrite").objectStore("keys").put(key, "device");
          put.onsuccess = () => resolve(key);
          put.onerror = () => reject(put.error);
        };
        get.onerror = () => reject(get.error);
      };
    });
  }
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const slot = () => (settings.storage === "session" ? sessionStorage : localStorage);
  async function saveKeys() {
    try { localStorage.removeItem("oop-ai-keys"); sessionStorage.removeItem("oop-ai-keys"); } catch {}
    if (!CRYPTO || !Object.keys(keys).length) return;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await deviceKey(), new TextEncoder().encode(JSON.stringify(keys)));
    try { slot().setItem("oop-ai-keys", JSON.stringify({ v: 1, iv: b64(iv), ct: b64(ct) })); } catch {}
  }
  async function loadKeys() {
    if (!CRYPTO) return;
    for (const s of [sessionStorage, localStorage]) {
      try {
        const env = JSON.parse(s.getItem("oop-ai-keys") || "null");
        if (!env) continue;
        const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(env.iv) }, await deviceKey(), unb64(env.ct));
        keys = { ...keys, ...JSON.parse(new TextDecoder().decode(pt)) };
      } catch { /* unreadable (e.g. site data cleared): treat as no key */ }
    }
  }

  function connection() {
    const p = byId(settings.provider);
    const viaServer = SERVER_SIDE.includes(p.id) && !!server[p.id];
    return { provider: p.id, kind: p.kind, viaServer, apiKey: keys[p.id] || "", apiVersion: settings.azureApiVersion,
             baseUrl: (settings.urls[p.id] || p.baseUrl).trim(),
             model: viaServer && p.id === "azure" ? "from .env" : (settings.models[p.id] ?? p.defaultModel) };
  }
  function ready() {
    const c = connection(), p = byId(c.provider);
    return !!c.model && (!p.needsKey || !!c.apiKey || c.viaServer) && (settings.configured || c.viaServer) && (!!c.baseUrl || c.viaServer);
  }
  const describe = (c) => `${byId(c.provider).label} · ${c.viaServer ? (c.provider === "azure" ? "deployment from .env" : `${c.model} · key from .env`) : c.model || "no model"}`;

  // ---------------------------------------------------------------- talking to models (streaming)
  class AIError extends Error { constructor(m, hint) { super(m); this.hint = hint; } }
  const trim = (s) => s.replace(/\/+$/, "");
  const isLocalUrl = (u) => { try { return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(new URL(u).hostname); } catch { return false; } };
  function hintFor(c, status) {
    if (status === 401 || status === 403) return c.viaServer ? "The provider rejected the key in .env. Check it there." : "The provider rejected the API key. Check it in AI settings.";
    if (status === 404 && c.kind === "azure") return "Azure has no deployment by that name. Use the deployment name from Azure AI Foundry, not the model name.";
    if (status === 404 && c.provider === "ollama") return `Ollama doesn't have “${c.model}”. Run: ollama pull ${c.model}`;
    if (status === 404) return "Model or endpoint not found. Check the model name and base URL in AI settings.";
    if (status === 429) return "Rate limited or out of quota. Wait a moment or check your plan.";
    if (status === 501) return "Add the key to .env in the repository folder (see .env.example). No restart needed.";
    if (status === undefined) {
      if (c.provider === "ollama") return "Is Ollama running? Start it and try again. On the hosted copy, start it with OLLAMA_ORIGINS=*.";
      if (c.provider === "custom") return "Is the server running with CORS enabled?";
      return "Network error. Check your connection.";
    }
  }
  function endpoint(c) {
    const base = trim(c.baseUrl), relay = (path) => `${BASE}/api/ai-server/${path}`;
    if (c.kind === "anthropic") return c.viaServer ? relay("anthropic/v1/messages") : `${base}/v1/messages`;
    if (c.kind === "azure") return c.viaServer ? relay("azure/chat/completions")
      : `${new URL(base).origin}/openai/deployments/${encodeURIComponent(c.model)}/chat/completions?api-version=${encodeURIComponent(c.apiVersion || "2024-10-21")}`;
    if (c.kind === "gemini") return `${base}/v1beta/models/${encodeURIComponent(c.model)}:streamGenerateContent?alt=sse`;
    return c.viaServer ? relay("openai/v1/chat/completions") : `${base}/chat/completions`;
  }
  function headers(c) {
    if (c.viaServer) return { "content-type": "application/json", "X-Run-Token": TOKEN };
    if (c.kind === "anthropic") return { "content-type": "application/json", "x-api-key": c.apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" };
    if (c.kind === "gemini") return { "content-type": "application/json", "x-goog-api-key": c.apiKey };
    if (c.kind === "azure") return { "content-type": "application/json", "api-key": c.apiKey };
    return { "content-type": "application/json", ...(c.apiKey ? { authorization: `Bearer ${c.apiKey}` } : {}) };
  }
  function body(c, system, turns) {
    if (c.kind === "anthropic") return { model: c.model, max_tokens: 4096, system, messages: turns, stream: true };
    if (c.kind === "gemini") return { systemInstruction: { parts: [{ text: system }] }, contents: turns.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })) };
    const msgs = [{ role: "system", content: system }, ...turns];
    return c.kind === "azure" ? { stream: true, messages: msgs } : { model: c.model, stream: true, messages: msgs };
  }
  function pick(c, j) {
    if (j.error) throw new AIError(j.error.message || String(j.error));
    if (c.kind === "anthropic") return j.type === "content_block_delta" && j.delta?.type === "text_delta" ? j.delta.text : "";
    if (c.kind === "gemini") return (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    return j.choices?.[0]?.delta?.content || "";
  }
  async function streamChat(c, system, messages, onToken, signal) {
    if (!c.viaServer && (c.provider === "ollama" || c.provider === "custom") && !isLocalUrl(c.baseUrl))
      throw new AIError("Local servers must be on localhost or 127.0.0.1.", "Change the base URL in AI settings.");
    const turns = messages.filter((m, i) => !(i === 0 && m.role === "assistant")).map(({ role, content }) => ({ role, content }));
    let res;
    try { res = await fetch(endpoint(c), { method: "POST", headers: headers(c), body: JSON.stringify(body(c, system, turns)), signal }); }
    catch (e) { if (e.name === "AbortError") throw e; throw new AIError("Couldn't reach the AI provider.", hintFor(c)); }
    if (!res.ok) {
      let msg = `${res.status} ${res.statusText}`;
      try { const t = await res.text(); try { const j = JSON.parse(t); msg = j?.error?.message || (typeof j?.error === "string" ? j.error : "") || j?.message || t.slice(0, 300); } catch { if (t) msg = t.slice(0, 300); } } catch {}
      throw new AIError(msg, hintFor(c, res.status));
    }
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = "", full = "";
    const line = (l) => {
      if (!l.startsWith("data:")) return;
      const data = l.slice(5).trim();
      if (!data || data === "[DONE]") return;
      let j; try { j = JSON.parse(data); } catch { return; }
      const t = pick(c, j);
      if (t) { full += t; onToken(full); }
    };
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      let i;
      while ((i = buf.indexOf("\n")) >= 0) { line(buf.slice(0, i)); buf = buf.slice(i + 1); }
    }
    line(buf);
    if (!full) throw new AIError("The model returned an empty answer.", c.provider === "ollama" ? "Try a larger model, or share less page text in AI settings." : undefined);
    return full;
  }

  // ---------------------------------------------------------------- what the tutor knows about the page
  const LANG_NAME = { python: "Python", cpp: "C++", javascript: "JavaScript", all: "all three languages side by side" };
  function pageContext() {
    const id = document.body.dataset.page || "", path = location.pathname.slice(BASE.length) || "/";
    const kind = id.startsWith("c:") ? "concept" : id.startsWith("b:") ? "lesson" : id.startsWith("p:") ? "project"
      : /playground|class-builder/.test(path) ? "tool" : "general";
    const title = ($(".main h1")?.textContent || document.title).trim();
    const main = $(".main").cloneNode(true);
    $$(".finish, .prevnext, .toc, .score, script, .run-out", main).forEach((n) => n.remove());
    // only the language the learner is reading, unless they show all three
    const lang = document.documentElement.dataset.lang;
    if (lang !== "all") $$(`.lp:not([data-l="${lang}"])`, main).forEach((n) => n.remove());
    $$("textarea", main).forEach((t) => t.replaceWith(Object.assign(document.createElement("pre"), { textContent: t.value })));
    const text = main.innerText.replace(/\n{3,}/g, "\n\n").trim();
    return { key: kind === "general" ? "general" : id || path, kind, title, lang: LANG_NAME[lang] || "Python", text };
  }
  const SYSTEM = `You are a patient, precise programming tutor built into "OOP All-in-One", a course by Kushal Rana that teaches object-oriented programming in Python, C++ and JavaScript side by side: classes and objects, how objects live in memory, self/this, encapsulation, lifecycle, inheritance (MRO, prototype chains, vtables), polymorphism, abstraction, composition, operator overloading, SOLID and design patterns.

How to answer:
- Teach, don't just tell. Start with the intuition in one or two sentences, then show code.
- Use Markdown. Put code in fenced blocks tagged python, cpp or javascript. Keep examples short and runnable.
- Answer in the learner's chosen language unless they ask otherwise. When comparing languages, a small table helps.
- When the learner's page text is provided below, treat it as the source of truth for this course's examples and wording. If it isn't covered there, say so and answer from general knowledge.
- Be concise: short paragraphs, no filler. If something the learner says is wrong, correct it kindly and explain why. If unsure, say so.`;
  function system(ctx) {
    if (!settings.shareContext || ctx.kind === "general") return `${SYSTEM}\n\nThe learner is reading code in ${ctx.lang}.`;
    const budget = settings.contextChars || byId(settings.provider).contextChars;
    const text = ctx.text.length > budget ? ctx.text.slice(0, budget) + "\n…[page text trimmed]" : ctx.text;
    return `${SYSTEM}\n\nThe learner is on: ${ctx.title} (${ctx.kind}). They are reading code in ${ctx.lang}.\n\n<page>\n${text}\n</page>`;
  }
  function quickPrompts(ctx) {
    if (ctx.kind === "concept") return [
      ["Explain it like I'm new", "Explain this chapter's main idea like I'm new to it, with one everyday analogy, then a tiny code example."],
      ["What happens in memory?", "Walk me through what happens in memory, step by step, when the example on this page runs."],
      ["Compare the 3 languages", "Compare how Python, C++ and JavaScript handle this idea. Use a short table, then point out the biggest gotcha in each."],
      ["Common mistakes", "What are the most common mistakes or misconceptions about this, and how do I avoid them?"],
      ["Quiz me", "Quiz me with 3 questions on this chapter, one at a time. Wait for my answer before revealing the solution."]];
    if (ctx.kind === "lesson") return [
      ["Explain the example", "Explain the main example on this page line by line."],
      ["Give me an exercise", "Give me one small exercise to practise this lesson, then wait for my attempt and review it."],
      ["Common mistakes", "What mistakes do beginners make with this, and how do I spot them?"],
      ["Quiz me", "Quiz me with 3 questions on this lesson, one at a time."]];
    if (ctx.kind === "project") return [
      ["Where do I start?", "I'm about to start this project. What should I think about first, and what are the likely pitfalls?"],
      ["Explain the design", "Explain the class design of this project: why each class exists and how they relate."],
      ["Review my approach", "I'll describe how I plan to build the next step. Review it against good OOP design."]];
    if (ctx.kind === "tool") return [
      ["Give me a challenge", "Give me a small OOP challenge I can solve here in a few minutes."],
      ["Review my class design", "I'll paste a class. Review its design: naming, encapsulation, and what you'd change."]];
    return [
      ["Where should I start?", "Suggest a path through this course for me. Ask me which language I know best first."],
      ["Class vs object", "What's the difference between a class and an object? Show it in Python, C++ and JavaScript."],
      ["Why OOP at all?", "Why do people use object-oriented programming? When is it the wrong choice?"]];
  }

  // ---------------------------------------------------------------- a small, safe Markdown renderer for answers
  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*\w])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }
  function markdown(src) {
    const out = [], lines = src.replace(/\r/g, "").split("\n");
    for (let i = 0; i < lines.length;) {
      const l = lines[i];
      const fence = l.match(/^\s*```\s*([\w+#-]*)/);
      if (fence) {
        const code = [];
        for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) code.push(lines[i]);
        i++;
        out.push(`<div class="codeblock ai-code"><div class="codeblock-bar"><span class="codeblock-lang">${esc(fence[1] || "code")}</span><span class="codeblock-actions"><button type="button" class="chip-btn" data-ai-copy>${icon("copy", 13)}<span>Copy</span></button></span></div><pre><code class="language-${esc(fence[1] || "plaintext")}">${esc(code.join("\n"))}</code></pre></div>`);
        continue;
      }
      if (/^\s*\|.*\|\s*$/.test(l) && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1] || "") && lines[i + 1].includes("-")) {
        const row = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
        const head = row(l), body = [];
        for (i += 2; i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i]); i++) body.push(row(lines[i]));
        out.push(`<div class="table-wrap"><table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
        continue;
      }
      const h = l.match(/^(#{1,4})\s+(.*)/);
      if (h) { out.push(`<h${Math.min(4, h[1].length + 1)}>${inline(h[2])}</h${Math.min(4, h[1].length + 1)}>`); i++; continue; }
      if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) {
        const ordered = /^\s*\d/.test(l), items = [];
        for (; i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i]); i++) items.push(lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, ""));
        out.push(`<${ordered ? "ol" : "ul"}>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`);
        continue;
      }
      if (/^\s*>/.test(l)) {
        const q = [];
        for (; i < lines.length && /^\s*>/.test(lines[i]); i++) q.push(lines[i].replace(/^\s*>\s?/, ""));
        out.push(`<blockquote><p>${inline(q.join(" "))}</p></blockquote>`);
        continue;
      }
      if (!l.trim()) { i++; continue; }
      const para = [];
      for (; i < lines.length && lines[i].trim() && !/^\s*(```|#{1,4}\s|[-*+]\s|\d+[.)]\s|>|\|)/.test(lines[i]); i++) para.push(lines[i]);
      if (!para.length) { para.push(l); i++; }
      out.push(`<p>${inline(para.join(" "))}</p>`);
    }
    return out.join("");
  }

  // ---------------------------------------------------------------- the panel
  const app = $(".app");
  const panel = document.createElement("aside");
  panel.className = "ai-panel";
  panel.id = "ai-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "AI tutor");
  panel.innerHTML = `
    <div class="ai-resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="Resize the AI tutor. Drag, or use the left and right arrow keys; double-click to reset."></div>
    <div class="ai-head">
      <div class="ai-title">${icon("sparkles", 20)}<div><b>AI tutor</b><button type="button" class="ai-model" data-ai-open-settings></button></div></div>
      <div class="ai-head-actions">
        <button type="button" class="icon-btn sm" data-ai-clear title="Clear conversation" aria-label="Clear this conversation">${icon("trash", 16)}</button>
        <button type="button" class="icon-btn sm" data-ai-wide title="Wider" aria-label="Toggle a wider tutor">${icon("expand", 16)}</button>
        <button type="button" class="icon-btn sm" data-ai-open-settings title="AI settings" aria-label="AI settings">${icon("gear", 16)}</button>
        <button type="button" class="icon-btn sm" data-ai-close title="Close (Ctrl+/)" aria-label="Close AI tutor">${icon("x", 16)}</button>
      </div>
    </div>
    <div class="ai-body"><div class="ai-messages" aria-live="polite"></div><div class="ai-settings" hidden></div></div>
    <form class="ai-composer">
      <div class="quote-bar" hidden><span></span><button type="button" class="icon-btn sm" data-ai-unquote aria-label="Remove quoted text">${icon("x", 14)}</button></div>
      <div class="composer-row">
        <textarea rows="1" placeholder="Ask about this page…" aria-label="Message to the AI tutor"></textarea>
        <button type="submit" class="btn primary round" aria-label="Send">${icon("send", 16)}</button>
      </div>
      <div class="composer-foot muted"><span><kbd>Enter</kbd> send · <kbd>Shift</kbd>+<kbd>Enter</kbd> new line</span><span data-ai-share></span></div>
    </form>`;
  app.append(panel);
  const scrim = Object.assign(document.createElement("div"), { className: "scrim ai-scrim", hidden: true });
  app.append(scrim);
  const list = $(".ai-messages", panel), settingsBox = $(".ai-settings", panel), form = $(".ai-composer", panel),
        input = $("textarea", panel), sendBtn = $('button[type="submit"]', panel), quoteBar = $(".quote-bar", panel);

  let ctx = pageContext();
  const chats = store.get("oop-ai-chats", {});
  let messages = chats[ctx.key] || [];
  let quote = "", busy = null;
  const saveChat = () => {
    const all = store.get("oop-ai-chats", {});
    delete all[ctx.key];
    if (messages.length) all[ctx.key] = messages.slice(-40);
    const ks = Object.keys(all);
    ks.slice(0, Math.max(0, ks.length - 30)).forEach((k) => delete all[k]);
    store.set("oop-ai-chats", all);
  };

  const WIDTH_KEY = "oop-ai-width";
  const setWidth = (w) => { const v = Math.max(320, Math.min(900, w)); app.style.setProperty("--ai-w", `${v}px`); store.set(WIDTH_KEY, v); };
  app.style.setProperty("--ai-w", `${store.get(WIDTH_KEY, 420)}px`);

  function open(view) {
    panel.hidden = false;
    app.dataset.ai = "open";
    scrim.hidden = false;
    $$("[data-ai-toggle]").forEach((b) => { b.classList.add("on"); b.setAttribute("aria-pressed", "true"); });
    show(view || (ready() ? "chat" : "settings"));
    window.renderDiagrams?.();
  }
  function close() {
    panel.hidden = true;
    app.dataset.ai = "closed";
    scrim.hidden = true;
    $$("[data-ai-toggle]").forEach((b) => { b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); });
  }
  function show(view) {
    const s = view === "settings";
    settingsBox.hidden = !s;
    list.hidden = s;
    form.hidden = s;
    $("[data-ai-clear]", panel).hidden = s;
    if (s) renderSettings(); else { renderChat(); setTimeout(() => input.focus(), 30); }
    paintHeader();
  }
  function paintHeader() {
    $(".ai-model", panel).textContent = ready() ? describe(connection()) : "Not connected: set up";
    $("[data-ai-share]", panel).textContent = settings.shareContext && ctx.kind !== "general" ? "Shares this page with the AI" : "";
    $$("[data-ai-promo]").forEach((el) => (el.hidden = ready()));
  }

  function renderChat() {
    if (!messages.length) {
      list.innerHTML = `<div class="ai-empty card">
        <span class="ai-empty-icon">${icon("sparkles", 22)}</span>
        <h3>Ask about ${ctx.kind === "general" ? "OOP" : "this page"}</h3>
        <p class="muted">${ctx.kind === "general" ? "Anything about classes, objects and the three languages." : `I can see “${esc(ctx.title)}”. Highlight any text or press <b>Explain</b> on a code block to ask about it.`}</p>
        <div class="suggestions">${quickPrompts(ctx).map(([label, prompt]) => `<button type="button" class="suggestion" data-prompt="${esc(prompt)}">${icon("arrow", 14)}<span>${esc(label)}</span></button>`).join("")}</div>
      </div>`;
      return;
    }
    list.innerHTML = messages.map((m, i) => m.role === "user"
      ? `<div class="msg user"><div class="bubble">${m.quote ? `<div class="quote-chip">${esc(m.quote.slice(0, 400))}</div>` : ""}${esc(m.content)}</div></div>`
      : `<div class="msg ai" data-i="${i}"><div class="answer prose">${m.error ? `<div class="notice bad">${icon("alert", 16)}<div><b>${esc(m.content)}</b>${m.hint ? `<div class="small">${esc(m.hint)}</div>` : ""}</div></div>` : markdown(m.content)}</div>
         ${m.error ? "" : `<div class="msg-actions"><button type="button" class="chip-btn" data-ai-copy-answer="${i}">${icon("copy", 13)}<span>Copy</span></button></div>`}</div>`).join("");
    highlight(list);
    scrollDown();
  }
  const highlight = (el) => window.hljs && $$("pre code", el).forEach((c) => { if (!c.dataset.highlighted) hljs.highlightElement(c); });
  const scrollDown = () => { const b = $(".ai-body", panel); b.scrollTop = b.scrollHeight; };

  async function ask(text, q = quote) {
    text = text.trim();
    if (!text || busy) return;
    if (!ready()) { open("settings"); return; }
    ctx = pageContext();
    const content = q ? `Here is the excerpt I'm asking about:\n\n"""\n${q}\n"""\n\n${text}` : text;
    messages.push({ role: "user", content: text, quote: q || undefined, sent: content });
    setQuote("");
    input.value = "";
    autosize();
    renderChat();
    const node = document.createElement("div");
    node.className = "msg ai";
    node.innerHTML = '<div class="answer prose"><span class="typing" aria-label="Thinking"><i></i><i></i><i></i></span></div>';
    list.append(node);
    scrollDown();
    busy = new AbortController();
    sendBtn.innerHTML = icon("stop", 16);
    sendBtn.setAttribute("aria-label", "Stop generating");
    const answer = $(".answer", node);
    let frame = 0, latest = "";
    try {
      const full = await streamChat(connection(), system(ctx), messages.map((m) => ({ role: m.role, content: m.sent || m.content })).filter((m, i) => !messages[i].error),
        (t) => { latest = t; if (!frame) frame = requestAnimationFrame(() => { frame = 0; answer.innerHTML = markdown(latest); scrollDown(); }); }, busy.signal);
      messages.push({ role: "assistant", content: full });
    } catch (e) {
      if (e.name === "AbortError") { if (latest) messages.push({ role: "assistant", content: latest + "\n\n*(stopped)*" }); }
      else messages.push({ role: "assistant", content: e.message, hint: e.hint, error: true });
    }
    cancelAnimationFrame(frame);
    busy = null;
    sendBtn.innerHTML = icon("send", 16);
    sendBtn.setAttribute("aria-label", "Send");
    saveChat();
    renderChat();
  }
  function setQuote(q) {
    quote = (q || "").trim().slice(0, 6000);
    quoteBar.hidden = !quote;
    $("span", quoteBar).textContent = quote;
  }
  const autosize = () => { input.style.height = "auto"; input.style.height = `${Math.min(160, input.scrollHeight)}px`; };

  form.addEventListener("submit", (e) => { e.preventDefault(); if (busy) busy.abort(); else ask(input.value); });
  input.addEventListener("input", autosize);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
  panel.addEventListener("click", async (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.prompt) ask(t.dataset.prompt);
    else if (t.matches("[data-ai-close]")) close();
    else if (t.matches("[data-ai-open-settings]")) show(settingsBox.hidden ? "settings" : "chat");
    else if (t.matches("[data-ai-unquote]")) setQuote("");
    else if (t.matches("[data-ai-wide]")) setWidth((store.get(WIDTH_KEY, 420) < 640) ? 720 : 420);
    else if (t.matches("[data-ai-clear]")) { busy?.abort(); messages = []; saveChat(); renderChat(); }
    else if (t.dataset.aiCopyAnswer) navigator.clipboard?.writeText(messages[+t.dataset.aiCopyAnswer].content);
    else if (t.matches("[data-ai-copy]")) navigator.clipboard?.writeText(t.closest(".codeblock").querySelector("code").textContent);
  });
  scrim.addEventListener("click", close);

  // resize by dragging the left edge
  const grip = $(".ai-resize", panel);
  grip.addEventListener("pointerdown", (e) => {
    grip.setPointerCapture(e.pointerId);
    document.body.classList.add("resizing");
    const move = (ev) => setWidth(innerWidth - ev.clientX);
    const up = () => { document.body.classList.remove("resizing"); grip.removeEventListener("pointermove", move); };
    grip.addEventListener("pointermove", move);
    grip.addEventListener("pointerup", up, { once: true });
  });
  grip.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); setWidth(store.get(WIDTH_KEY, 420) + (e.key === "ArrowLeft" ? 40 : -40)); }
  });
  grip.addEventListener("dblclick", () => setWidth(420));

  // ---------------------------------------------------------------- settings view
  function renderSettings() {
    const c = connection(), p = byId(settings.provider);
    const fromEnv = SERVER_SIDE.filter((id) => server[id] && PROVIDERS.some((x) => x.id === id));
    settingsBox.innerHTML = `
      <section class="ai-section"><h3>Choose your AI</h3>
        ${fromEnv.length ? `<div class="notice ok">${icon("check", 16)}<span>Found ${fromEnv.map((id) => `<b>${byId(id).label}</b>`).join(", ")} in your <code>.env</code>. Pick it and you're done: the key stays on this computer.</span></div>` : ""}
        <div class="provider-grid" role="radiogroup" aria-label="AI provider">
          ${PROVIDERS.map((x) => `<button type="button" role="radio" aria-checked="${x.id === p.id}" class="provider ${x.id === p.id ? "selected" : ""}" data-provider="${x.id}">
            <span class="provider-top"><b>${esc(x.label)}</b>${server[x.id] ? '<span class="pill good">.env</span>' : x.kind === "openai" && !x.needsKey ? '<span class="pill">local</span>' : ""}</span>
            <span class="muted small">${esc(x.tagline)}</span></button>`).join("")}
        </div>
      </section>
      <section class="ai-section">
        <h3>Connect ${esc(p.label)}</h3>
        ${c.viaServer
          ? `<div class="notice ok">${icon("lock", 16)}<span>Using the key in your <code>.env</code>. It is attached on this computer and never sent to the browser.${p.id === "azure" ? " The endpoint and deployment come from <code>.env</code> too." : ""}</span></div>`
          : `<p class="muted small">${esc(p.setup).replace(/`([^`]+)`/g, "<code>$1</code>")}</p>
             ${p.editableBaseUrl ? `<label class="field"><span>${esc(p.baseLabel || "Base URL")}</span><input data-f="url" value="${esc(settings.urls[p.id] || p.baseUrl)}" placeholder="${esc(p.basePlaceholder || p.baseUrl)}" spellcheck="false"></label>` : ""}
             ${p.needsKey || p.optionalKey ? `<label class="field"><span>${p.needsKey ? "API key" : "API key (only if the server needs one)"}${p.keyUrl ? ` <a class="field-link" href="${p.keyUrl}" target="_blank" rel="noopener">Get a key ${icon("arrow", 12)}</a>` : ""}</span>
               <input data-f="key" type="password" autocomplete="off" spellcheck="false" placeholder="${keys[p.id] ? "•••••••• saved (type to replace)" : "Paste your key"}"></label>` : ""}
             ${p.id === "azure" ? `<label class="field"><span>API version</span><input data-f="ver" value="${esc(settings.azureApiVersion)}" placeholder="2024-10-21"></label>` : ""}`}
        ${c.viaServer && p.id === "azure" ? "" : `<label class="field"><span>${esc(p.modelLabel || "Model")}</span><input data-f="model" value="${esc(settings.models[p.id] ?? p.defaultModel)}" placeholder="${esc(p.defaultModel || "model name")}" spellcheck="false"></label>`}
        ${!c.viaServer && (p.needsKey || p.optionalKey) ? `<div class="field"><span>Where your key is stored</span>
          <div class="choice" role="radiogroup" aria-label="Key storage">
            <button type="button" role="radio" class="choice-opt ${settings.storage === "device" ? "selected" : ""}" data-storage="device"><b>This device</b><span class="muted small">Encrypted, remembered</span></button>
            <button type="button" role="radio" class="choice-opt ${settings.storage === "session" ? "selected" : ""}" data-storage="session"><b>This session</b><span class="muted small">Encrypted, gone when you close the tab</span></button>
          </div>${CRYPTO ? "" : '<p class="small muted">This browser can\'t encrypt, so the key is kept in memory only.</p>'}</div>` : ""}
      </section>
      <section class="ai-section"><h3>What the tutor can see</h3>
        <label class="switch-row"><input type="checkbox" class="switch" data-f="share" ${settings.shareContext ? "checked" : ""}><span><b>Share the current page with my questions</b><br><span class="muted small">The page text (in your chosen language) is sent so answers match this course. Turn off to send only your question.</span></span></label>
        ${HOSTED ? "" : `<p class="muted small">Prefer not to paste keys here? Put them in <code>.env</code> in the repository folder (see <code>.env.example</code>).</p>`}
      </section>
      <div class="ai-settings-foot"><span class="status-text" data-ai-test-result></span><button type="button" class="btn primary" data-ai-save>${icon("check", 16)} Save and start</button></div>`;
  }
  settingsBox.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.provider) { collect(); settings.provider = t.dataset.provider; saveSettings(); renderSettings(); paintHeader(); }
    else if (t.dataset.storage) { collect(); settings.storage = t.dataset.storage; saveSettings(); renderSettings(); }
    else if (t.matches("[data-ai-save]")) save();
  });
  function collect() {
    const p = byId(settings.provider), f = (k) => $(`[data-f="${k}"]`, settingsBox);
    if (f("url")) settings.urls[p.id] = f("url").value.trim();
    if (f("model")) settings.models[p.id] = f("model").value.trim();
    if (f("ver")) settings.azureApiVersion = f("ver").value.trim() || "2024-10-21";
    if (f("share")) settings.shareContext = f("share").checked;
    if (f("key") && f("key").value.trim()) keys[p.id] = f("key").value.trim();
  }
  async function save() {
    collect();
    const c = connection(), p = byId(c.provider), out = $("[data-ai-test-result]", settingsBox);
    const problem = !c.model ? `Enter a ${p.modelLabel ? "deployment name" : "model"}.`
      : p.needsKey && !c.apiKey && !c.viaServer ? "Paste your API key."
      : (p.id === "ollama" || p.id === "custom") && !isLocalUrl(c.baseUrl) ? "Local servers must be on localhost or 127.0.0.1."
      : p.id === "azure" && !c.viaServer && !/^https:\/\//.test(c.baseUrl) ? "Enter your https:// Azure endpoint." : "";
    if (problem) { out.className = "status-text bad"; out.textContent = problem; return; }
    settings.configured = true;
    saveSettings();
    await saveKeys();
    show("chat");
    window.oopToast?.(`AI tutor connected: ${describe(c)}`);
  }

  // ---------------------------------------------------------------- entry points: button, Ctrl+/, selection, code blocks, errors
  function toggle() { panel.hidden ? open() : close(); }
  $$("[data-ai-toggle]").forEach((b) => b.addEventListener("click", toggle));
  document.addEventListener("click", (e) => { if (e.target.closest("[data-ai-connect]")) open("settings"); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); toggle(); }
    else if (e.key === "Escape" && !panel.hidden && panel.contains(document.activeElement)) close();
  });

  window.oopAI = {
    ask(prompt, q) { open("chat"); if (ready()) { setQuote(q || ""); ask(prompt, q || ""); } },
    quote(q) { open("chat"); setQuote(q); input.focus(); },
  };

  // "Explain" on every code block in the page
  $$(".main .codeblock").forEach((box) => {
    const actions = $(".codeblock-actions", box);
    if (!actions || $("[data-ai-explain]", actions)) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip-btn ask";
    b.dataset.aiExplain = "";
    b.title = "Ask the AI tutor to explain this code";
    b.innerHTML = `${icon("sparkles", 13)}<span>Explain</span>`;
    actions.prepend(b);
    b.addEventListener("click", () => {
      const code = $("textarea", box)?.value || $("pre code", box)?.textContent || "";
      window.oopAI.ask("Explain this code step by step. Point out the OOP ideas it uses.", code);
    });
  });

  // highlight text in the lesson -> "Ask AI"
  const bubble = Object.assign(document.createElement("div"), { className: "selection-ask", hidden: true });
  bubble.innerHTML = `<button type="button" data-sel="explain">${icon("sparkles", 14)} Explain</button><button type="button" data-sel="ask">Ask about this</button>`;
  bubble.setAttribute("aria-label", "Ask about the selected text");
  document.body.append(bubble);
  let selected = "";
  document.addEventListener("mouseup", (e) => {
    if (bubble.contains(e.target)) return;
    setTimeout(() => {
      const sel = getSelection(), text = sel && !sel.isCollapsed ? sel.toString().trim() : "";
      const inMain = sel?.anchorNode && $(".main").contains(sel.anchorNode) && !e.target.closest("textarea, input");
      if (!text || text.length < 3 || !inMain) { bubble.hidden = true; return; }
      selected = text;
      const r = sel.getRangeAt(0).getBoundingClientRect();
      bubble.style.left = `${Math.max(80, Math.min(innerWidth - 80, r.left + r.width / 2))}px`;
      bubble.style.top = `${Math.max(60, r.top - 8)}px`;
      bubble.hidden = false;
    }, 0);
  });
  bubble.addEventListener("mousedown", (e) => e.preventDefault());
  bubble.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    bubble.hidden = true;
    if (b.dataset.sel === "explain") window.oopAI.ask("Explain this in simple terms, in the context of this page.", selected);
    else window.oopAI.quote(selected);
  });
  addEventListener("scroll", () => (bubble.hidden = true), { passive: true });

  // ---------------------------------------------------------------- start
  (async () => {
    await loadKeys();
    if (!HOSTED && ON_LOCALHOST) {
      try {
        const r = await fetch(`${BASE}/api/ai-server`, { cache: "no-store" });
        if (r.ok) { const k = await r.json(); server = { openai: !!k.openai, anthropic: !!k.anthropic, azure: !!k.azure }; }
      } catch { /* no relay: browser providers only */ }
    }
    // first visit with a key in .env: use it without any setup
    if (!settings.configured && !ready()) {
      const found = SERVER_SIDE.find((id) => server[id]);
      if (found) { settings.provider = found; saveSettings(); }
    }
    paintHeader();
  })();
})();
