// Site behaviour: theme, language switch, code runners, diagrams, quizzes, progress, search and toasts.
// Progress lives in this browser only (localStorage), keyed by page id: b:<lang>/<slug>, c:<slug>, p:<slug>, s:<project>/<step>.
(function () {
  const root = document.documentElement;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const TOKEN = $('meta[name="run-token"]').content;
  const BASE = $('meta[name="base-path"]').content;          // "" locally, "/<repo>" on GitHub Pages
  const HOSTED = !!$('meta[name="hosted"]');                  // static copy: there is no server to run code
  const HOSTED_MSG = "This is the hosted preview, so code can't run here. Clone the repo and run `python start.py` to run it on your machine.";
  const COURSE = JSON.parse($("#course-data").textContent);
  const BY_ID = Object.fromEntries(COURSE.map((c) => [c.id, c]));
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
                  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ICONS = {     // the few icons built here; the rest come from templates/_icons.html
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    "circle-check": '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    play: '<path d="M7 4.5v15l12-7.5-12-7.5Z"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5A2.5 2.5 0 0 0 4 21.5v-2Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
    blocks: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><path d="M7 11v6a2 2 0 0 0 2 2h4M17 13V9a2 2 0 0 0-2-2h-4"/>',
    rocket: '<path d="m12 15-3-3a22 22 0 0 1 2-4 13 13 0 0 1 11-6c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2Z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    terminal: '<path d="m5 8 4 4-4 4M12 16h7"/><rect x="2" y="3" width="20" height="18" rx="3"/>',
  };
  const icon = (n, s = 16) => `<svg class="icon" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

  // ---------------------------------------------------------------- toasts
  const toaster = $(".toaster");
  function toast(text, { kind = "good", action } = {}) {
    const t = document.createElement("div");
    t.className = `toast ${kind}`;
    t.innerHTML = `${icon(kind === "good" ? "circle-check" : "x", 18)}<span>${esc(text)}</span>${action ? `<a class="toast-action" href="${esc(action.href)}">${esc(action.label)} ${icon("arrow", 14)}</a>` : ""}`;
    toaster.append(t);
    setTimeout(() => t.remove(), action ? 6000 : 3000);
  }
  window.oopToast = toast;

  // ---------------------------------------------------------------- progress model
  const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const P = {
    done: store.get("oop-done", {}),           // id -> timestamp
    visited: store.get("oop-visited", {}),     // id -> timestamp
    days: store.get("oop-days", {}),           // YYYY-MM-DD -> number of things you did
    last: store.get("oop-last", null),         // id of the last lesson page you opened
  };
  for (const [k, v] of Object.entries(P.done)) {          // older versions stored true/false
    if (v === true) P.done[k] = Date.now();
    else if (!v) delete P.done[k];
  }
  const save = () => { store.set("oop-done", P.done); store.set("oop-visited", P.visited); store.set("oop-days", P.days); store.set("oop-last", P.last); };
  const bump = () => { P.days[today()] = (P.days[today()] || 0) + 1; };
  const isDone = (id) => !!P.done[id];
  const state = (id) => (P.done[id] ? "done" : P.visited[id] ? "started" : "new");
  const projectSteps = (slug) => (BY_ID[`p:${slug}`]?.steps || 0);

  function streak() {
    const days = new Set(Object.keys(P.days));
    const d = new Date();
    const activeToday = days.has(today(d));
    if (!activeToday) d.setDate(d.getDate() - 1);
    let current = 0;
    while (days.has(today(d))) { current++; d.setDate(d.getDate() - 1); }
    let longest = 0, run = 0, prev = null;
    for (const day of [...days].sort()) {
      const t = new Date(day + "T00:00:00");
      run = prev && (t - prev) / 864e5 === 1 ? run + 1 : 1;
      longest = Math.max(longest, run);
      prev = t;
    }
    return { current, longest, activeToday };
  }

  function setDone(id, on) {
    if (on) { P.done[id] = Date.now(); bump(); } else delete P.done[id];
    save();
    paint();
  }

  // the next unfinished page after `id`, in course order
  function nextAfter(id) {
    const i = COURSE.findIndex((c) => c.id === id);
    return [...COURSE.slice(i + 1), ...COURSE.slice(0, Math.max(i, 0))].find((c) => !isDone(c.id));
  }

  // ---------------------------------------------------------------- painting progress everywhere
  const ids = (el, attr) => { try { return JSON.parse(el.getAttribute(attr)); } catch { return []; } };
  const fraction = (list) => (list.length ? list.filter(isDone).length / list.length : 0);

  function paint() {
    $$("[data-status]").forEach((el) => { el.className = `status ${state(el.dataset.status)}`; });
    $$("[data-num]").forEach((el) => { el.classList.remove("done", "started"); const s = state(el.dataset.num); if (s !== "new") el.classList.add(s); });
    $$("[data-ring]").forEach((el) => {
      const f = fraction(ids(el, "data-ring"));
      el.style.setProperty("--p", f);
      el.classList.toggle("full", f >= 1);
      el.setAttribute("aria-label", `${Math.round(f * 100)}% complete`);
      const pct = $("[data-pct]", el);
      if (pct) pct.textContent = Math.round(f * 100);
    });
    $$("[data-count]").forEach((el) => { const l = ids(el, "data-count"); el.textContent = `${l.filter(isDone).length}/${l.length}${el.dataset.countSuffix || ""}`; });
    $$("[data-bar]").forEach((el) => {
      const f = el.dataset.barDone && isDone(el.dataset.barDone) ? 1 : fraction(ids(el, "data-bar"));
      el.firstElementChild.style.width = `${f * 100}%`;
      el.classList.toggle("full", f >= 1);
    });
    $$("[data-done-pill]").forEach((el) => { el.hidden = !isDone(el.dataset.donePill); });
    $$("[data-complete]").forEach((b) => {
      const on = isDone(b.dataset.complete);
      b.classList.toggle("done", on);
      b.classList.toggle("primary", !on);
      b.setAttribute("aria-pressed", on);
      b.querySelector("span").textContent = on ? b.dataset.doneLabel : b.dataset.label;
    });
    $$("[data-step-check]").forEach((b) => {
      const on = isDone(b.dataset.stepCheck);
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
      b.closest("li")?.classList.toggle("done", on);
    });
    const s = streak(), st = $("[data-streak]");
    if (st) {
      st.hidden = s.current === 0;
      st.classList.toggle("on", s.activeToday);
      st.title = s.activeToday ? "You've learned today: streak safe" : "Learn something today to keep your streak";
      st.querySelector("b").textContent = s.current;
    }
    paintStats(s);
    paintDashboard();
  }

  function paintStats(s) {
    const lessons = COURSE.filter((c) => c.kind !== "project");
    const done = lessons.filter((c) => isDone(c.id));
    let minutes = done.reduce((n, c) => n + c.minutes, 0);
    for (const p of COURSE.filter((c) => c.kind === "project")) {
      const slug = p.id.slice(2), steps = projectSteps(slug);
      const built = isDone(p.id) ? steps : Array.from({ length: steps }, (_, i) => `s:${slug}/${i + 1}`).filter(isDone).length;
      minutes += steps ? Math.round((p.minutes * built) / steps) : 0;
    }
    const projects = COURSE.filter((c) => c.kind === "project");
    const set = (k, v) => $$(`[data-stat="${k}"]`).forEach((el) => (el.textContent = v));
    set("done", `${done.length}`);
    set("time", minutes >= 60 ? `${(minutes / 60).toFixed(1)} h` : `${minutes} min`);
    set("streak", `${s.current}`);
    set("longest", `${s.longest}`);
    set("best", s.longest > s.current ? `· best ${s.longest}` : "");
    set("projects", `${projects.filter((p) => isDone(p.id)).length} / ${projects.length}`);
  }

  function card(c) {
    return `<a href="${esc(c.href)}" class="card link-card lift"><span class="muted small">${esc(c.group)}</span><b class="card-title">${esc(c.title)}</b>
      <span class="muted small clamp">${esc(c.summary)}</span><span class="card-foot">${c.level ? `<span class="pill ${esc(c.level.toLowerCase())}">${esc(c.level)}</span>` : ""}<span class="muted small">${c.minutes} min</span></span></a>`;
  }

  function paintDashboard() {
    const cta = $("[data-hero-cta]");
    if (!cta) return;
    const started = Object.keys(P.done).length > 0 || !!P.last;
    if (!started) return;                                     // first visit: keep the server-rendered welcome
    const all = COURSE.length, done = COURSE.filter((c) => isDone(c.id)).length, s = streak();
    const resume = P.last && BY_ID[P.last] && !isDone(P.last) ? BY_ID[P.last] : null;
    const next = resume || nextAfter(P.last || COURSE[0].id);
    $("[data-hero-eyebrow]").textContent = "Welcome back";
    $("[data-hero-title]").textContent = done >= all ? "You finished the course." : "Pick up where you left off.";
    $("[data-hero-lead]").textContent = `${done} of ${all} pages done. ${s.current > 1 ? `${s.current}-day streak: keep it going.` : "A little every day beats a lot once."}`;
    if (next) { cta.href = next.href; cta.querySelector("span").textContent = `${resume ? "Continue" : "Next"}: ${next.title}`; }
    else cta.hidden = true;
    const upnext = [];
    for (let c = next; c && upnext.length < 3 && !upnext.includes(c); c = nextAfter(c.id)) upnext.push(c);
    const box = $("[data-upnext]");
    if (upnext.length) box.innerHTML = upnext.map(card).join("");
    else $("[data-upnext-section]").hidden = true;
  }

  // completion buttons and project step checks
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-complete]");
    if (b) {
      const id = b.dataset.complete, on = !isDone(id);
      setDone(id, on);
      if (on) {
        const n = nextAfter(id);
        toast(`Nice: “${BY_ID[id]?.title || "this page"}” is done.`, { action: n && { href: n.href, label: `Next: ${n.title}` } });
      }
      return;
    }
    const s = e.target.closest("[data-step-check]");
    if (s) {
      const id = s.dataset.stepCheck, on = !isDone(id);
      setDone(id, on);
      const li = s.closest("li"), all = $$("[data-step-check]");
      if (on && all.every((x) => isDone(x.dataset.stepCheck))) toast("Every step built. Run the complete program, then mark the project done.");
      else if (on) li?.nextElementSibling?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // remember the page you're on
  const page = document.body.dataset.page;
  if (page && BY_ID[page]) {
    if (!P.visited[page]) bump();
    P.visited[page] = Date.now();
    P.last = page;
    save();
  }

  // ---------------------------------------------------------------- theme
  const ORDER = ["system", "light", "dark"], LABEL = { system: "Match system", light: "Light", dark: "Dark" };
  const themeBtn = $("[data-theme-toggle]");
  function applyTheme(pref) {
    root.dataset.themePref = pref;
    root.dataset.theme = pref === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : pref;
    const next = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    themeBtn.setAttribute("aria-label", `Theme: ${LABEL[pref]}. Switch to ${LABEL[next]}`);
    themeBtn.title = `Theme: ${LABEL[pref]}`;
  }
  themeBtn.addEventListener("click", () => {
    const next = ORDER[(ORDER.indexOf(root.dataset.themePref) + 1) % ORDER.length];
    try { localStorage.setItem("oop-theme", next); } catch {}
    applyTheme(next);
    rerenderDiagrams();
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (root.dataset.themePref === "system") { applyTheme("system"); rerenderDiagrams(); }
  });
  applyTheme(root.dataset.themePref || "system");

  // ---------------------------------------------------------------- diagrams (only visible ones: hidden elements can't be measured)
  function mermaidTheme() {
    const dark = root.dataset.theme === "dark";
    return { startOnLoad: false, securityLevel: "strict", theme: "base",
      themeVariables: dark
        ? { darkMode: true, background: "#131722", primaryColor: "#1f2440", primaryTextColor: "#eceff8", primaryBorderColor: "#5b5ef0",
            secondaryColor: "#1a1f2d", tertiaryColor: "#1a1f2d", lineColor: "#98a1b8", textColor: "#c0c6d8", mainBkg: "#1f2440", nodeBorder: "#5b5ef0",
            clusterBkg: "#1a1f2d", edgeLabelBackground: "#131722", classText: "#eceff8" }
        : { background: "#ffffff", primaryColor: "#eceeff", primaryTextColor: "#161a2b", primaryBorderColor: "#4f46e5",
            secondaryColor: "#f1f2f8", tertiaryColor: "#f7f7fb", lineColor: "#5f677c", textColor: "#3f465b", mainBkg: "#eceeff", nodeBorder: "#4f46e5",
            clusterBkg: "#f7f7fb", edgeLabelBackground: "#ffffff", classText: "#161a2b" } };
  }
  if (window.mermaid) mermaid.initialize(mermaidTheme());
  window.renderDiagrams = function () {
    if (!window.mermaid) return;
    const nodes = $$("pre.mermaid:not([data-processed])").filter((n) => n.offsetParent !== null);
    nodes.forEach((n) => { if (n.dataset.src === undefined) n.dataset.src = n.textContent; });
    if (nodes.length) mermaid.run({ nodes }).catch(console.error);
  };
  function rerenderDiagrams() {
    if (!window.mermaid) return;
    mermaid.initialize(mermaidTheme());
    $$("pre.mermaid[data-processed]").forEach((n) => { n.removeAttribute("data-processed"); n.textContent = n.dataset.src; });
    window.renderDiagrams();
  }
  document.addEventListener("toggle", (e) => { if (e.target.open) window.renderDiagrams(); }, true);

  // ---------------------------------------------------------------- language switch
  function setLang(lang) {
    root.dataset.lang = lang;
    try { localStorage.setItem("oop-lang", lang); } catch {}
    $$("[data-set-lang]").forEach((b) => { b.classList.toggle("active", b.dataset.setLang === lang); b.setAttribute("aria-pressed", b.dataset.setLang === lang); });
    window.renderDiagrams();
    document.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  }
  $$("[data-set-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.setLang)));
  setLang(root.dataset.lang || "python");

  // ---------------------------------------------------------------- sidebar (mobile drawer)
  const sidebar = $("#sidebar"), scrim = $("[data-close-menu]");
  const menu = (open) => { sidebar.classList.toggle("open", open); scrim.hidden = !open; };
  $("[data-menu]").addEventListener("click", () => menu(!sidebar.classList.contains("open")));
  scrim.addEventListener("click", () => menu(false));
  $(".sidebar .active")?.scrollIntoView({ block: "nearest" });

  // reading progress
  const bar = $(".read-progress > div");
  let frame = 0;
  const onScroll = () => { if (frame) return; frame = requestAnimationFrame(() => {
    frame = 0;
    const max = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  }); };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);

  // ---------------------------------------------------------------- running code
  window.runCode = async function (lang, code) {
    if (HOSTED) return { ok: false, missing: true, stdout: "", stderr: HOSTED_MSG };
    const res = await fetch(`${BASE}/api/run`, { method: "POST", headers: { "Content-Type": "application/json", "X-Run-Token": TOKEN },
                                          body: JSON.stringify({ lang, code }) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };
  function showResult(box, out, result, ms) {
    const status = box.querySelector(".run-status");
    if (status) {
      status.className = `run-status ${result.missing ? "" : result.ok ? "good" : "bad"}`;
      status.textContent = result.missing ? "Toolchain not installed"
        : result.phase === "compile" ? "✗ Compilation failed"
        : result.ok ? `✓ Exit 0 · ${(ms / 1000).toFixed(2)} s` : `✗ Exit ${result.exit_code ?? "?"} · ${(ms / 1000).toFixed(2)} s`;
    }
    out.innerHTML = "";
    const add = (text, cls) => { if (!text) return; const s = document.createElement("span"); if (cls) s.className = cls; s.textContent = text; out.append(s); };
    add(result.stdout);
    if (result.stderr) add((result.stdout ? "\n" : "") + result.stderr, result.missing ? "info" : "err");
    if (!result.stdout && !result.stderr) add(result.ok ? "(no output)" : "(failed with no message)", "info");
  }
  async function execute(box, out, lang, code, btn) {
    const wrap = out.closest(".run-out") || out;
    wrap.hidden = false;
    const status = box.querySelector(".run-status");
    if (status) { status.className = "run-status"; status.textContent = lang === "cpp" ? "Compiling and running…" : "Running…"; }
    out.textContent = "";
    if (HOSTED) {                              // show what the program prints instead of running it
      const expected = $(".expected pre", box)?.textContent;
      if (status) status.textContent = expected ? "Expected output · hosted preview" : "Hosted preview";
      out.innerHTML = "";
      out.append(Object.assign(document.createElement("span"), { textContent: expected || "" }),
                 Object.assign(document.createElement("span"), { className: "info", textContent: `${expected ? "\n\n" : ""}${HOSTED_MSG}` }));
      return;
    }
    if (btn) btn.disabled = true;
    const t0 = performance.now();
    try {
      const result = await window.runCode(lang, code);
      showResult(box, out, result, performance.now() - t0);
      if (!result.ok && !result.missing && window.oopAI) {       // a failed run is the best moment to ask
        const b = Object.assign(document.createElement("button"), { type: "button", className: "chip-btn ask explain-error", textContent: "✦ Explain this error" });
        b.addEventListener("click", () => window.oopAI.ask("My program failed. Explain the error in plain words and show how to fix it.",
                                                           `${code}\n\n--- output ---\n${[result.stdout, result.stderr].filter(Boolean).join("\n")}`));
        out.append(document.createElement("br"), b);
      }
    }
    catch (err) { if (status) { status.className = "run-status bad"; status.textContent = "✗ Could not run"; } out.textContent = `${err.message}. Is the local server still running?`; }
    if (btn) btn.disabled = false;
  }
  async function copy(text, btn) {
    try { await navigator.clipboard.writeText(text); } catch { return; }
    const label = btn.querySelector("span"), was = label?.textContent;
    if (label) { label.textContent = "Copied"; setTimeout(() => (label.textContent = was), 1400); }
  }

  // editable runners
  const HL = { python: "python", cpp: "cpp", javascript: "javascript" };
  $$("[data-runner]").forEach((box) => {
    const lang = box.dataset.runner, ta = $("textarea", box), code = $(".editor code", box), pre = $(".editor pre", box), out = $(".output", box);
    const paintCode = () => {
      code.textContent = ta.value + "\n";
      if (window.hljs) { code.removeAttribute("data-highlighted"); code.className = `language-${HL[lang]}`; hljs.highlightElement(code); }
    };
    const run = () => execute(box, out, lang, ta.value, $("[data-run]", box));
    ta.addEventListener("input", paintCode);
    ta.addEventListener("scroll", () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; });
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        ta.setRangeText(lang === "javascript" ? "  " : "    ", ta.selectionStart, ta.selectionEnd, "end"); paintCode();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
    });
    $("[data-run]", box).addEventListener("click", run);
    $("[data-copy]", box).addEventListener("click", (e) => copy(ta.value, e.currentTarget));
    $("[data-reset]", box).addEventListener("click", () => { ta.value = ta.dataset.original; paintCode(); $(".run-out", box).hidden = true; });
    paintCode();
  });

  // static code blocks: highlight, add a bar with Copy, and Run for complete programs.
  // Convention: ```python / ```cpp / ```javascript = complete programs (runnable); ```py / ```c++ / ```js = fragments.
  const LANG_OF = { python: "python", py: "python", cpp: "cpp", "c++": "cpp", javascript: "javascript", js: "javascript" };
  const BADGE = { python: "Py", cpp: "C++", javascript: "JS" };
  $$("pre > code").forEach((el) => {
    if (el.closest(".editor, .mermaid, .widget, .codeblock")) return;
    if (window.hljs) hljs.highlightElement(el);
    const tag = (el.className.match(/language-([\w+]+)/) || [])[1];
    const lang = LANG_OF[tag];
    const runnable = ["python", "cpp", "javascript"].includes(tag);
    const pre = el.parentElement, box = document.createElement("div");
    box.className = "codeblock";
    box.innerHTML = `<div class="codeblock-bar"><span class="codeblock-lang">${lang ? `<span class="lang-badge lb-${lang}">${BADGE[lang]}</span>` : ""}${runnable ? "complete program" : lang ? "snippet" : esc(tag || "text")}</span>
      <span class="codeblock-actions"><button type="button" class="chip-btn" data-copy>${icon("copy", 13)}<span>Copy</span></button>${runnable ? `<button type="button" class="chip-btn run" data-run>${icon("play", 13)}<span>Run</span></button>` : ""}</span></div>`;
    pre.replaceWith(box);
    box.append(pre);
    $("[data-copy]", box).addEventListener("click", (e) => copy(el.textContent, e.currentTarget));
    if (runnable) {
      const outWrap = document.createElement("div");
      outWrap.className = "run-out"; outWrap.hidden = true;
      outWrap.innerHTML = '<div class="run-status"></div><pre class="output"></pre>';
      box.append(outWrap);
      $("[data-run]", box).addEventListener("click", (e) => execute(box, $(".output", outWrap), tag, el.textContent, e.currentTarget));
    }
  });

  // ---------------------------------------------------------------- quizzes
  $$("[data-quiz]").forEach((wrap) => {
    const qs = $$(".quiz", wrap), first = new Map();
    qs.forEach((q) => $$(".quiz-opt", q).forEach((b) => b.addEventListener("click", () => {
      const right = b.dataset.i === q.dataset.answer;
      if (!first.has(q)) first.set(q, right);
      b.classList.add(right ? "right" : "wrong");
      b.disabled = true;
      if (!right) return;
      $$(".quiz-opt", q).forEach((o) => { o.disabled = true; if (o !== b && !o.classList.contains("wrong")) o.classList.add("dim"); });
      $(".quiz-explain", q).hidden = false;
      if (qs.every((x) => first.has(x) && $(".quiz-opt.right", x))) {
        const score = [...first.values()].filter(Boolean).length, box = $("[data-score]", wrap);
        box.hidden = false;
        box.innerHTML = `<span class="stat-icon ${score === qs.length ? "accent" : ""}">${icon(score === qs.length ? "circle-check" : "book", 20)}</span>
          <div><b>${score} of ${qs.length} right first time.</b><div class="muted small">${score === qs.length ? "You've got this one. Mark it as understood below." : "Re-read the parts you missed, then try the interactive section again."}</div></div>`;
      }
    })));
  });

  // ---------------------------------------------------------------- table of contents
  const auto = $("[data-toc-auto]"), source = $("[data-toc-source]");
  if (auto && source) {
    $("ul", auto).innerHTML = $$("h2[id], h3[id]", source)
      .map((h) => `<li class="${h.tagName === "H3" ? "sub" : ""}"><a href="#${esc(h.id)}">${esc(h.textContent)}</a></li>`).join("");
  }
  const tocLinks = $$(".toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    const targets = tocLinks.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => (en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)));
      const top = targets.find((t) => visible.has(t)) || targets.filter((t) => t.getBoundingClientRect().top < 120).pop();
      tocLinks.forEach((a) => a.classList.toggle("active", top && a.hash === `#${top.id}`));
    }, { rootMargin: "-60px 0px -60% 0px" });
    targets.forEach((t) => io.observe(t));
  }

  // ---------------------------------------------------------------- compare page filter
  $$("[data-filter-table]").forEach((input) => {
    const table = document.getElementById(input.dataset.filterTable), empty = $("[data-filter-empty]"), rows = $$("tbody tr", table);
    const labels = {}, names = {};                          // group -> the concept link shown on its first row
    rows.forEach((tr) => { const a = $(".group-cell a", tr); if (a) { labels[tr.dataset.group] = a.outerHTML; names[tr.dataset.group] = a.textContent; } });
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase(), seen = new Set();
      let shown = 0;
      rows.forEach((tr) => {
        const hit = !q || `${tr.textContent} ${names[tr.dataset.group]}`.toLowerCase().includes(q);
        tr.hidden = !hit;
        if (!hit) return;
        shown++;
        $(".group-cell", tr).innerHTML = seen.has(tr.dataset.group) ? "" : labels[tr.dataset.group] || "";
        seen.add(tr.dataset.group);
      });
      if (empty) empty.hidden = shown > 0;
    });
  });

  // ---------------------------------------------------------------- progress page
  const heat = $("[data-heatmap]");
  if (heat) {
    const WEEKS = 18, end = new Date(), start = new Date(end);
    start.setDate(end.getDate() - end.getDay() - (WEEKS - 1) * 7);
    let html = "", active = 0;
    for (let w = 0; w < WEEKS; w++) {
      html += '<div class="heat-col">';
      for (let d = 0; d < 7; d++) {
        const day = new Date(start); day.setDate(start.getDate() + w * 7 + d);
        const n = P.days[today(day)] || 0;
        if (n) active++;
        const lvl = n === 0 ? "" : n < 2 ? "l1" : n < 4 ? "l2" : n < 7 ? "l3" : "l4";
        html += `<span class="heat ${lvl} ${day > end ? "future" : ""}" title="${day.toDateString()}: ${n} ${n === 1 ? "thing" : "things"}"></span>`;
      }
      html += "</div>";
    }
    heat.innerHTML = html;
    $("[data-active-days]").textContent = `${active} active ${active === 1 ? "day" : "days"} in ${WEEKS} weeks`;
  }
  const recent = $("[data-recent]");
  if (recent) {
    const items = Object.entries(P.done).filter(([id]) => BY_ID[id]).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (items.length) recent.innerHTML = items.map(([id, t]) => `<a class="list-row" href="${esc(BY_ID[id].href)}"><span>${icon("circle-check", 16)}<span class="clamp" style="-webkit-line-clamp:1">${esc(BY_ID[id].title)}</span></span><span class="muted small">${esc(BY_ID[id].group)} · ${new Date(t).toLocaleDateString()}</span></a>`).join("");
  }
  $("[data-export]")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ version: 1, ...P }, null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `oop-progress-${today()}.json` });
    a.click(); URL.revokeObjectURL(a.href);
  });
  $("[data-import]")?.addEventListener("change", async (e) => {
    try {
      const data = JSON.parse(await e.target.files[0].text());
      Object.assign(P, { done: data.done || {}, visited: data.visited || {}, days: data.days || {}, last: data.last || null });
      save(); location.reload();
    } catch { toast("That file isn't a progress export.", { kind: "bad" }); }
  });
  $("[data-reset-progress]")?.addEventListener("click", () => {
    if (!confirm("Reset all progress, streaks and activity in this browser?")) return;
    ["oop-done", "oop-visited", "oop-days", "oop-last"].forEach((k) => { try { localStorage.removeItem(k); } catch {} });
    location.reload();
  });

  // ---------------------------------------------------------------- command palette (Ctrl/⌘ K or /)
  const pal = $("[data-palette-root]"), input = $("input", pal), list = $(".palette-list", pal);
  const KIND_ICON = { basics: "book", concept: "blocks", project: "rocket", page: "arrow" };
  const PAGES = [["Dashboard", "/"], ["My progress", "/progress"], ["Playground", "/playground"], ["Class builder", "/class-builder"],
                 ["Compare cheat sheet", "/compare"], ["All OOP concepts", "/concepts/"], ["All projects", "/projects/"]]
    .map(([title, href]) => ({ id: href, kind: "page", group: "Go to", title, summary: "", href: BASE + href }));
  const ENTRIES = [...PAGES, ...COURSE];
  let results = [], active = 0;
  const mark = (text, terms) => terms.reduce((s, t) => s.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"), "\u0001$1\u0002"), text)
    .split("\u0001").map((part, i) => i === 0 ? esc(part) : part.split("\u0002").map((p, j) => j === 0 ? `<mark>${esc(p)}</mark>` : esc(p)).join("")).join("");
  function search() {
    const terms = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    results = ENTRIES.map((e) => {
      const title = e.title.toLowerCase(), hay = `${title} ${e.group} ${e.summary}`.toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return null;
      return { e, score: terms.reduce((n, t) => n + (title.startsWith(t) ? 3 : title.includes(t) ? 2 : 0), 0) };
    }).filter(Boolean);
    if (terms.length) results.sort((a, b) => b.score - a.score);
    results = results.slice(0, 40).map((r) => r.e);
    active = 0;
    let group = null, html = "";
    results.forEach((e, i) => {
      if (!terms.length && e.group !== group) { group = e.group; html += `<li class="palette-group" role="presentation">${esc(group)}</li>`; }
      const st = e.kind === "page" ? "" : state(e.id) === "done" ? `<span class="pill good">${icon("check", 12)} done</span>` : "";
      html += `<li class="palette-item" role="option" data-i="${i}">${icon(KIND_ICON[e.kind] || "arrow", 16)}<span class="palette-title">${mark(e.title, terms)}</span>${terms.length ? `<span class="muted small">${esc(e.group)}</span>` : ""}${st}</li>`;
    });
    list.innerHTML = html || '<li class="palette-empty">No matches. Try “inheritance”, “vtable” or “constructor”.</li>';
    highlight();
  }
  function highlight() {
    $$(".palette-item", list).forEach((li) => { const on = +li.dataset.i === active; li.classList.toggle("active", on); li.setAttribute("aria-selected", on); if (on) li.scrollIntoView({ block: "nearest" }); });
  }
  const openPalette = () => { pal.hidden = false; input.value = ""; search(); input.focus(); };
  const closePalette = () => { pal.hidden = true; };
  const go = (i) => { const e = results[i]; if (e) location.href = e.href; };
  $("[data-palette]").addEventListener("click", openPalette);
  pal.addEventListener("click", (e) => { if (e.target === pal) closePalette(); const li = e.target.closest(".palette-item"); if (li) go(+li.dataset.i); });
  input.addEventListener("input", search);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(results.length - 1, active + 1); highlight(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(0, active - 1); highlight(); }
    else if (e.key === "Enter") { e.preventDefault(); go(active); }
  });
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); pal.hidden ? openPalette() : closePalette(); }
    else if (e.key === "/" && !typing && pal.hidden) { e.preventDefault(); openPalette(); }
    else if (e.key === "Escape") { if (!pal.hidden) closePalette(); else menu(false); }
  });

  // ---------------------------------------------------------------- live reload (python start.py): refresh when a file changes
  if ($('meta[name="live-reload"]')) {
    let version = null;
    const check = async () => {
      if (!document.hidden) {
        try {
          const r = await fetch(`${BASE}/api/live-reload`, { cache: "no-store" });
          const v = r.ok ? (await r.json()).version : null;
          if (v && version && v !== version) { location.reload(); return; }
          if (v) version = v;
        } catch { /* the server is restarting: keep asking */ }
      }
      setTimeout(check, 1000);
    };
    check();
  }

  paint();
  window.renderDiagrams();
  onScroll();
})();
