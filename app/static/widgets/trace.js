// Step-through memory visualiser: code on the left, stack frames and heap objects on the right, arrows for references.
// Config (content/traces/*.json): { title, lang, code: "...", steps: [{ line, note, frames, heap, out }] }
//   frames: [{ name, vars: [{ name, value? , ref?, obj?, id?, alias? }] }]   obj = inline object (C++ values on the stack)
//   heap:   [{ id, label, fields: [{ name, value?, ref? }], proto?, freed?, kind? }]
(function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const inlineMd = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\*([^*\s][^*]*)\*/g, "<i>$1</i>");

  function styleOnce() {
    if (document.getElementById("trace-style")) return;
    const css = `
      .tr-wrap { display: grid; grid-template-columns: minmax(260px, 1fr) minmax(320px, 1.4fr); gap: 14px; }
      @media (max-width: 900px) { .tr-wrap { grid-template-columns: 1fr; } }
      .tr-code { font-family: var(--mono); font-size: 13px; background: var(--panel-2); border-radius: 10px; padding: 8px 0; overflow-x: auto; }
      .tr-line { display: flex; white-space: pre; padding: 0 10px; }
      .tr-line .n { color: var(--muted); width: 28px; flex: none; user-select: none; }
      .tr-line.cur { background: color-mix(in srgb, var(--accent) 18%, transparent); box-shadow: inset 3px 0 var(--accent); }
      .tr-line.prev { background: color-mix(in srgb, var(--accent) 6%, transparent); }
      .tr-mem { position: relative; display: grid; grid-template-columns: 1fr 1.2fr; gap: 26px; align-items: start; min-height: 120px; }
      .tr-col h5 { margin: 0 0 6px; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
      .tr-frame, .tr-obj { border: 1.5px solid var(--border); border-radius: 10px; background: var(--panel); margin-bottom: 10px; font-family: var(--mono); font-size: 12.5px; }
      .tr-frame > .t, .tr-obj > .t { padding: 3px 8px; border-bottom: 1px solid var(--border); background: var(--panel-2); border-radius: 9px 9px 0 0; font-weight: 700; }
      .tr-obj.new { border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent); }
      .tr-obj.freed { opacity: .45; border-style: dashed; }
      .tr-obj.freed > .t::after { content: " (freed)"; color: var(--bad); font-weight: 400; }
      .tr-obj.kind-class > .t { background: var(--cpp-soft); }
      .tr-row { display: flex; justify-content: space-between; gap: 10px; padding: 3px 8px; border-top: 1px dotted var(--border); align-items: center; }
      .tr-row:first-of-type { border-top: none; }
      .tr-row .v { color: var(--accent); max-width: 60%; overflow: hidden; text-overflow: ellipsis; }
      .tr-row .ref { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); display: inline-block; }
      .tr-row.changed { background: var(--warn-soft); }
      .tr-inline { margin: 2px 6px 6px; }
      .tr-svg { position: absolute; inset: 0; pointer-events: none; overflow: visible; }
      .tr-note { margin-top: 10px; padding: 10px 12px; background: var(--accent-soft); border-radius: 10px; min-height: 44px; }
      .tr-out { margin-top: 8px; font-family: var(--mono); font-size: 12.5px; background: #0b1020; color: #d7e3ff; border-radius: 8px; padding: 8px 10px; white-space: pre-wrap; }
      .tr-controls { display: flex; align-items: center; gap: 6px; margin: 6px 0 10px; flex-wrap: wrap; }
      .tr-controls input[type=range] { flex: 1; min-width: 120px; }`;
    document.head.append(Object.assign(document.createElement("style"), { id: "trace-style", textContent: css }));
  }

  function valueCell(v) {
    if (v.ref || v.alias) return `<span class="ref" data-from="${esc(v.ref || v.alias)}" data-dashed="${v.alias ? 1 : 0}"></span>`;
    return `<span class="v" title="${esc(v.value ?? "")}">${esc(v.value ?? "")}</span>`;
  }

  function objectBox(o, cls = "") {
    const rows = (o.fields || []).map((f) => `<div class="tr-row ${f.changed ? "changed" : ""}"><span>${esc(f.name)}</span>${valueCell(f)}</div>`).join("");
    const proto = o.proto ? `<div class="tr-row"><span style="color:var(--muted)">${esc(o.protoLabel || "[[Prototype]]")}</span><span class="ref" data-from="${esc(o.proto)}" data-dashed="1"></span></div>` : "";
    return `<div class="tr-obj ${cls} ${o.freed ? "freed" : ""} ${o.kind ? "kind-" + o.kind : ""}" data-id="${esc(o.id || "")}"><div class="t">${esc(o.label)}</div>${rows}${proto}</div>`;
  }

  function render(el, cfg, i) {
    const step = cfg.steps[i], prev = cfg.steps[i - 1];
    const lines = cfg.code.replace(/\n$/, "").split("\n");
    const prevIds = new Set((prev?.heap || []).map((h) => h.id));
    el.querySelector(".tr-code").innerHTML = lines.map((l, n) =>
      `<div class="tr-line ${n + 1 === step.line ? "cur" : ""} ${prev && n + 1 === prev.line && n + 1 !== step.line ? "prev" : ""}"><span class="n">${n + 1}</span>${esc(l) || " "}</div>`).join("");
    const frames = (step.frames || []).map((f) => `<div class="tr-frame"><div class="t">${esc(f.name)}</div>${(f.vars || []).map((v) =>
      v.obj ? `<div class="tr-row" data-id="${esc(v.id || "")}"><span>${esc(v.name)}</span><span class="v muted">↓ the object itself</span></div><div class="tr-inline">${objectBox({ ...v.obj, id: "" })}</div>`
            : `<div class="tr-row ${v.changed ? "changed" : ""}" data-id="${esc(v.id || "")}"><span>${esc(v.name)}</span>${valueCell(v)}</div>`).join("") || '<div class="tr-row"><span class="muted">(empty)</span></div>'}</div>`).join("");
    const heap = (step.heap || []).map((h) => objectBox(h, prevIds.has(h.id) ? "" : (i ? "new" : ""))).join("") || '<p class="muted">(nothing yet)</p>';
    el.querySelector(".tr-stack").innerHTML = frames;
    el.querySelector(".tr-heap").innerHTML = heap;
    el.querySelector(".tr-note").innerHTML = inlineMd(step.note || "");
    const out = el.querySelector(".tr-out");
    out.hidden = !step.out; out.textContent = step.out || "";
    el.querySelector(".tr-pos").textContent = `Step ${i + 1} / ${cfg.steps.length}`;
    el.querySelector("input[type=range]").value = i;
    requestAnimationFrame(() => drawArrows(el));
  }

  function drawArrows(el) {
    const mem = el.querySelector(".tr-mem"), svg = el.querySelector(".tr-svg");
    if (!mem.offsetParent) return;
    const box = mem.getBoundingClientRect();
    let paths = "";
    mem.querySelectorAll(".ref[data-from]").forEach((dot) => {
      const target = mem.querySelector(`[data-id="${CSS.escape(dot.dataset.from)}"]`);
      if (!target) return;
      const a = dot.getBoundingClientRect(), b = target.getBoundingClientRect();
      const x1 = a.left + a.width / 2 - box.left, y1 = a.top + a.height / 2 - box.top;
      let x2 = b.left - box.left - 2, y2 = b.top + 12 - box.top;
      let d;
      if (x2 < x1 + 10) {                       // target is not to the right: loop around on the right side
        x2 = b.right - box.left + 2;
        const bulge = Math.max(x1, x2) + 40;
        d = `M${x1},${y1} C${bulge},${y1} ${bulge},${y2} ${x2},${y2}`;
      } else {
        const mx = (x1 + x2) / 2;
        d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
      }
      paths += `<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="1.8" ${dot.dataset.dashed === "1" ? 'stroke-dasharray="5 4"' : ""} marker-end="url(#arrowhead)"/>`;
    });
    svg.setAttribute("width", box.width); svg.setAttribute("height", box.height);
    svg.innerHTML = `<defs><marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--accent)"/></marker></defs>${paths}`;
  }

  function mount(el) {
    styleOnce();
    const cfg = JSON.parse(el.dataset.config);
    el.innerHTML = `
      <h4>🎞️ ${esc(cfg.title || "Step through the code")}</h4>
      <div class="tr-controls">
        <button class="btn small" data-a="first">⏮</button><button class="btn small" data-a="prev">◀ Back</button>
        <button class="btn small primary" data-a="next">Step ▶</button><button class="btn small" data-a="last">⏭</button>
        <input type="range" min="0" max="${cfg.steps.length - 1}" value="0"><span class="tr-pos muted"></span>
      </div>
      <div class="tr-wrap">
        <div class="tr-code"></div>
        <div>
          <div class="tr-mem"><div class="tr-col"><h5>${esc(cfg.stackLabel || "Stack (names / frames)")}</h5><div class="tr-stack"></div></div>
            <div class="tr-col"><h5>${esc(cfg.heapLabel || "Heap (objects)")}</h5><div class="tr-heap"></div></div><svg class="tr-svg"></svg></div>
        </div>
      </div>
      <div class="tr-note"></div><pre class="tr-out" hidden></pre>`;
    let i = 0;
    const go = (n) => { i = Math.max(0, Math.min(cfg.steps.length - 1, n)); render(el, cfg, i); };
    el.querySelector(".tr-controls").addEventListener("click", (e) => {
      const a = e.target.dataset.a;
      if (a) go({ first: 0, prev: i - 1, next: i + 1, last: cfg.steps.length - 1 }[a]);
    });
    el.querySelector("input[type=range]").addEventListener("input", (e) => go(+e.target.value));
    el.tabIndex = 0;
    el.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); });
    window.addEventListener("resize", () => drawArrows(el));
    document.addEventListener("langchange", () => setTimeout(() => drawArrows(el), 50));
    go(0);
  }

  document.querySelectorAll('[data-widget="trace"]').forEach(mount);
})();
