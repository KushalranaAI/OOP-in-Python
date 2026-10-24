// Site behaviour: language switch, highlighting, diagrams, editable runners, quizzes, progress.
(function () {
  const root = document.documentElement;
  const TOKEN = document.querySelector('meta[name="run-token"]').content;
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
                  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };

  // ---------- diagrams (only visible ones - hidden elements can't be measured)
  const dark = matchMedia("(prefers-color-scheme: dark)").matches;
  if (window.mermaid) mermaid.initialize({ startOnLoad: false, theme: dark ? "dark" : "default", securityLevel: "strict" });
  window.renderDiagrams = function () {
    if (!window.mermaid) return;
    const nodes = [...document.querySelectorAll("pre.mermaid:not([data-processed])")].filter((n) => n.offsetParent !== null);
    if (nodes.length) mermaid.run({ nodes }).catch(console.error);
  };

  // ---------- language switch
  function setLang(lang) {
    root.dataset.lang = lang;
    try { localStorage.setItem("oop-lang", lang); } catch {}
    document.querySelectorAll("[data-set-lang]").forEach((b) => b.classList.toggle("active", b.dataset.setLang === lang));
    window.renderDiagrams();
    document.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  }
  document.querySelectorAll("[data-set-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.setLang)));
  setLang(root.dataset.lang || "python");

  // ---------- running code
  window.runCode = async function (lang, code) {
    const res = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json", "X-Run-Token": TOKEN },
                                          body: JSON.stringify({ lang, code }) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };
  function showResult(out, result) {
    out.hidden = false;
    out.innerHTML = "";
    const add = (text, cls) => { if (!text) return; const s = document.createElement("span"); if (cls) s.className = cls; s.textContent = text; out.append(s); };
    add(result.stdout);
    if (result.stderr) add((result.stdout ? "\n" : "") + result.stderr, result.missing ? "info" : "err");
    if (!result.stdout && !result.stderr) add(result.ok ? "(no output)" : "(failed with no message)", "info");
    if (result.phase === "compile") out.prepend(Object.assign(document.createElement("span"), { className: "info", textContent: "Compilation failed:\n" }));
  }

  // ---------- editable runners
  const HL = { python: "python", cpp: "cpp", javascript: "javascript" };
  document.querySelectorAll("[data-runner]").forEach((box) => {
    const lang = box.dataset.runner, ta = box.querySelector("textarea"), code = box.querySelector(".editor code"),
          pre = box.querySelector(".editor pre"), out = box.querySelector(".output");
    const paint = () => {
      code.textContent = ta.value + "\n";
      if (window.hljs) { code.removeAttribute("data-highlighted"); code.className = `language-${HL[lang]}`; hljs.highlightElement(code); }
    };
    ta.addEventListener("input", paint);
    ta.addEventListener("scroll", () => { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; });
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const s = ta.selectionStart, indent = lang === "javascript" ? "  " : "    ";
        ta.setRangeText(indent, s, ta.selectionEnd, "end"); paint();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
    });
    async function run() {
      const btn = box.querySelector("[data-run]");
      btn.disabled = true; out.hidden = false; out.textContent = lang === "cpp" ? "Compiling and running…" : "Running…";
      try { showResult(out, await window.runCode(lang, ta.value)); }
      catch (err) { out.textContent = `Could not run: ${err.message}. Is the local server still running?`; }
      btn.disabled = false;
    }
    box.querySelector("[data-run]").addEventListener("click", run);
    box.querySelector("[data-reset]").addEventListener("click", () => { ta.value = ta.dataset.original; paint(); out.hidden = true; });
    paint();
  });

  // ---------- highlight static code; add ▶ Run to complete programs in lessons
  // Convention: ```python / ```cpp / ```javascript = complete programs (runnable); ```py / ```c++ / ```js = fragments.
  document.querySelectorAll("pre > code").forEach((el) => {
    if (el.closest(".editor") || el.closest(".mermaid")) return;
    if (window.hljs) hljs.highlightElement(el);
    const m = el.className.match(/language-(python|cpp|javascript)(\s|$)/);
    if (!m) return;
    const pre = el.parentElement, btn = document.createElement("button");
    btn.className = "btn small run-inline"; btn.textContent = "▶ Run";
    pre.append(btn);
    btn.addEventListener("click", async () => {
      let out = pre.nextElementSibling;
      if (!out || !out.classList.contains("inline-output")) {
        out = document.createElement("pre"); out.className = "output inline-output"; pre.after(out);
      }
      out.hidden = false; out.textContent = "Running…";
      try { showResult(out, await window.runCode(m[1], el.textContent)); } catch (err) { out.textContent = String(err); }
    });
  });

  // ---------- quizzes
  document.querySelectorAll(".quiz").forEach((q) => {
    q.querySelectorAll(".quiz-opt").forEach((b) => b.addEventListener("click", () => {
      const right = b.dataset.i === q.dataset.answer;
      b.classList.add(right ? "right" : "wrong");
      if (right) { q.querySelectorAll(".quiz-opt").forEach((o) => (o.disabled = true)); q.querySelector(".quiz-explain").hidden = false; }
    }));
  });

  // ---------- progress
  function paintProgress() {
    const done = store.get("oop-done", {});
    document.querySelectorAll("[data-done]").forEach((d) => d.classList.toggle("done", !!done[d.dataset.done]));
    document.querySelectorAll("[data-complete]").forEach((c) => (c.checked = !!done[c.dataset.complete]));
  }
  document.querySelectorAll("[data-complete]").forEach((c) => c.addEventListener("change", () => {
    const done = store.get("oop-done", {}); done[c.dataset.complete] = c.checked; store.set("oop-done", done); paintProgress();
  }));
  paintProgress();
  window.renderDiagrams();
})();
