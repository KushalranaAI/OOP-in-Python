// Method-dispatch explorer: how does obj.method() find the code to run?
//   Python → walk the MRO; JavaScript → walk the prototype chain; C++ → static type + vtable for virtual methods.
// Config: { mode: "lookup" } or { mode: "diamond" }.
(function () {
  const CLASSES = {                                     // name -> [parent, {method: what it prints}]
    Animal: [null, { speak: "...", describe: "I am an animal", sleep: "Zzz" }],
    Dog: ["Animal", { speak: "Woof!", fetch: "Fetching the ball" }],
    Puppy: ["Dog", { speak: "Yip!" }],
    Cat: ["Animal", { speak: "Meow", purr: "Purrr" }],
  };
  const METHODS = ["speak", "describe", "sleep", "fetch", "purr"];
  const chainOf = (cls) => { const out = []; for (let c = cls; c; c = CLASSES[c][0]) out.push(c); return out; };
  const definedIn = (cls, m) => m in CLASSES[cls][1];
  const isSub = (child, parent) => chainOf(child).includes(parent);

  function css() {
    if (document.getElementById("dispatch-style")) return;
    document.head.append(Object.assign(document.createElement("style"), { id: "dispatch-style", textContent: `
      .dp-chain { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 10px 0; }
      .dp-box { border: 1.5px solid var(--border); border-radius: 10px; padding: 6px 10px; font-family: var(--mono); font-size: 12.5px; background: var(--panel); min-width: 90px; transition: .2s; }
      .dp-box small { display: block; color: var(--muted); font-family: system-ui; }
      .dp-box.visited { border-color: var(--muted); background: var(--panel-2); }
      .dp-box.hit { border-color: var(--ok); box-shadow: 0 0 0 3px var(--good-soft); }
      .dp-box.miss { border-color: var(--bad); }
      .dp-arrow { color: var(--muted); }
      .dp-result { padding: 8px 12px; border-radius: 10px; background: var(--accent-soft); font-size: .95rem; }
      .dp-result.error { background: var(--bad-soft); color: var(--bad); }
      .dp-vt { border-collapse: collapse; font-family: var(--mono); font-size: 12.5px; margin: 6px 0; }
      .dp-vt td, .dp-vt th { border: 1px solid var(--border); padding: 3px 8px; }
      .dp-vt tr.hit td { background: var(--good-soft); font-weight: 700; }` }));
  }

  function animateChain(container, boxes, hitIndex) {
    boxes.forEach((b, i) => setTimeout(() => {
      container.children[i * 2]?.classList.add(i === hitIndex ? "hit" : "visited");
    }, 260 * i));
  }

  function chainHtml(labels) {
    return labels.map((l, i) => `<div class="dp-box">${l}</div>${i < labels.length - 1 ? '<span class="dp-arrow">→</span>' : ""}`).join("");
  }

  function lookup(el) {
    el.innerHTML = `<h4>🧭 Method lookup explorer</h4>
      <div class="w-controls">Object: <select data-k="obj">${Object.keys(CLASSES).map((c) => `<option ${c === "Puppy" ? "selected" : ""}>${c}</option>`).join("")}</select>
        method: <select data-k="m">${METHODS.map((m) => `<option>${m}</option>`).join("")}</select>
        <span class="cpp-only">C++ variable type: <select data-k="static">${Object.keys(CLASSES).map((c) => `<option ${c === "Animal" ? "selected" : ""}>${c}&amp;</option>`).join("")}</select>
        <label><input type="checkbox" data-k="virtual" checked> methods are <code>virtual</code></label></span>
        <button class="btn small primary" data-k="go">Call it ▶</button></div>
      <div class="lang-panels">
        <div class="lp" data-l="python"><b>🐍 Python</b> walks the class's <b>MRO</b> (method resolution order) and takes the first class whose <code>__dict__</code> has the name.<div class="dp-chain" data-c="py"></div><div class="dp-result" data-r="py"></div></div>
        <div class="lp" data-l="javascript"><b>🟨 JavaScript</b> walks the <b>prototype chain</b>: the object itself, then each <code>[[Prototype]]</code> until <code>null</code>.<div class="dp-chain" data-c="js"></div><div class="dp-result" data-r="js"></div></div>
        <div class="lp" data-l="cpp"><b>⚙️ C++</b> decides at <b>compile time</b> from the variable's type, unless the method is <code>virtual</code>: then it follows the object's hidden <b>vptr</b> to its class's <b>vtable</b> at run time.<div data-c="cpp"></div><div class="dp-result" data-r="cpp"></div></div>
      </div>`;
    const val = (k) => el.querySelector(`[data-k="${k}"]`);
    const go = () => {
      const obj = val("obj").value, m = val("m").value, staticT = val("static").value.replace("&", ""), virt = val("virtual").checked;
      // Python
      const py = chainOf(obj).concat(["object"]);
      const pyHit = py.findIndex((c) => c !== "object" && definedIn(c, m));
      const pyC = el.querySelector('[data-c="py"]');
      pyC.innerHTML = chainHtml(py.map((c) => `${c}<small>${c !== "object" && definedIn(c, m) ? "has " + m : "-"}</small>`));
      animateChain(pyC, py, pyHit);
      el.querySelector('[data-r="py"]').className = "dp-result" + (pyHit < 0 ? " error" : "");
      el.querySelector('[data-r="py"]').innerHTML = pyHit < 0 ? `AttributeError: '${obj}' object has no attribute '${m}'`
        : `<code>${obj.toLowerCase()}.${m}()</code> runs <b>${py[pyHit]}.${m}</b> → "${CLASSES[py[pyHit]][1][m]}"  ·  <code>${obj}.__mro__</code> = (${py.join(", ")})`;
      // JavaScript
      const js = [`${obj.toLowerCase()} (own properties)`].concat(chainOf(obj).map((c) => `${c}.prototype`), ["Object.prototype", "null"]);
      const jsHit = chainOf(obj).findIndex((c) => definedIn(c, m));
      const jsC = el.querySelector('[data-c="js"]');
      jsC.innerHTML = chainHtml(js.map((l, i) => `${l}<small>${i > 0 && i <= chainOf(obj).length && definedIn(chainOf(obj)[i - 1], m) ? "has " + m : "-"}</small>`));
      animateChain(jsC, js, jsHit < 0 ? -1 : jsHit + 1);
      el.querySelector('[data-r="js"]').className = "dp-result" + (jsHit < 0 ? " error" : "");
      el.querySelector('[data-r="js"]').innerHTML = jsHit < 0 ? `TypeError: ${obj.toLowerCase()}.${m} is not a function (lookup reached <code>null</code>)`
        : `runs <b>${chainOf(obj)[jsHit]}.prototype.${m}</b> → "${CLASSES[chainOf(obj)[jsHit]][1][m]}"`;
      // C++
      const cpp = el.querySelector('[data-c="cpp"]'), res = el.querySelector('[data-r="cpp"]');
      if (!isSub(obj, staticT)) {
        cpp.innerHTML = "";
        res.className = "dp-result error";
        res.innerHTML = `error: invalid initialization of reference of type '${staticT}&amp;' from expression of type '${obj}' - a ${obj} is not a ${staticT}.`;
        return;
      }
      const staticHit = chainOf(staticT).find((c) => definedIn(c, m));
      if (!staticHit) {
        cpp.innerHTML = "";
        res.className = "dp-result error";
        res.innerHTML = `error: 'class ${staticT}' has no member named '${m}' - the compiler only knows the variable's type <b>${staticT}&amp;</b>, even though the object is a ${obj}.`;
        return;
      }
      const virtualMethods = ["speak", "describe", "sleep"].filter((x) => virt);
      const vtable = virtualMethods.map((vm) => [vm, chainOf(obj).find((c) => definedIn(c, vm))]);
      cpp.innerHTML = `<p style="margin:8px 0 4px"><code>${staticT}&amp; pet = a${obj};  pet.${m}();</code></p>` + (virt && virtualMethods.includes(m)
        ? `<div>${obj} object → <b>vptr</b> → vtable for <b>${obj}</b>:</div><table class="dp-vt"><tr><th>slot</th><th>points to</th></tr>${vtable.map(([vm, impl]) => `<tr class="${vm === m ? "hit" : ""}"><td>${vm}</td><td>${impl}::${vm}</td></tr>`).join("")}</table>`
        : `<p class="muted">Not virtual → the compiler picks <b>${staticHit}::${m}</b> from the static type <b>${staticT}</b>. No run-time lookup.</p>`);
      const impl = virt && virtualMethods.includes(m) ? chainOf(obj).find((c) => definedIn(c, m)) : staticHit;
      res.className = "dp-result";
      res.innerHTML = `runs <b>${impl}::${m}</b> → "${CLASSES[impl][1][m]}"${!virt && impl !== chainOf(obj).find((c) => definedIn(c, m)) ? " - ⚠️ <b>not</b> the " + obj + " version! This is why C++ needs <code>virtual</code>." : ""}`;
    };
    el.querySelector('[data-k="go"]').addEventListener("click", go);
    el.querySelectorAll("select, input").forEach((s) => s.addEventListener("change", go));
    go();
  }

  // ---- diamond: D(B, C), B(A), C(A) - where does d.hello() come from?
  function c3(classes, cls) {
    const bases = classes[cls];
    if (!bases.length) return [cls];
    const seqs = bases.map((b) => c3(classes, b)).concat([bases.slice()]);
    const out = [cls];
    while (seqs.some((s) => s.length)) {
      const candidate = seqs.map((s) => s[0]).find((h) => h && !seqs.some((s) => s.slice(1).includes(h)));
      if (!candidate) throw new Error("inconsistent MRO");
      out.push(candidate);
      seqs.forEach((s) => { if (s[0] === candidate) s.shift(); });
    }
    return out;
  }

  function diamond(el) {
    const classes = { A: [], B: ["A"], C: ["A"], D: ["B", "C"] };
    el.innerHTML = `<h4>💎 The diamond problem</h4>
      <p class="muted">Class <code>D</code> inherits from both <code>B</code> and <code>C</code>, which both inherit from <code>A</code>. Tick the classes that define <code>hello()</code>:</p>
      <div class="w-controls">${["A", "B", "C", "D"].map((c) => `<label><input type="checkbox" data-c="${c}" ${c === "A" || c === "C" ? "checked" : ""}> ${c}</label>`).join(" ")}</div>
      <pre class="plain" style="font-size:.85rem">class A:        ...
class B(A):     ...
class C(A):     ...
class D(B, C):  ...      # order of bases matters!</pre>
      <div class="lang-panels">
        <div class="lp" data-l="python"><b>🐍 Python: C3 linearisation</b><div class="dp-chain" data-o="py"></div><div class="dp-result" data-r="py"></div></div>
        <div class="lp" data-l="cpp"><b>⚙️ C++</b><div class="dp-result" data-r="cpp"></div></div>
        <div class="lp" data-l="javascript"><b>🟨 JavaScript</b><div class="dp-result" data-r="js"></div></div>
      </div>`;
    const go = () => {
      const has = Object.fromEntries(["A", "B", "C", "D"].map((c) => [c, el.querySelector(`[data-c="${c}"]`).checked]));
      const mro = c3(classes, "D").concat(["object"]);
      const hit = mro.findIndex((c) => has[c]);
      const box = el.querySelector('[data-o="py"]');
      box.innerHTML = chainHtml(mro.map((c) => `${c}<small>${has[c] ? "has hello" : "-"}</small>`));
      animateChain(box, mro, hit);
      el.querySelector('[data-r="py"]').innerHTML = hit < 0 ? "AttributeError: no hello anywhere" :
        `<code>D.__mro__</code> = (${mro.join(", ")}) → <b>${mro[hit]}.hello</b> runs. B comes before C because <code>class D(B, C)</code> lists B first, and A comes after <i>both</i>, so each class appears once.`;
      const definers = ["B", "C"].filter((c) => has[c]);
      el.querySelector('[data-r="cpp"]').innerHTML = has.D ? "D::hello hides everything - unambiguous." :
        definers.length === 2 ? "error: request for member 'hello' is ambiguous - candidates are B::hello and C::hello. You must write <code>d.B::hello()</code>." :
        definers.length === 1 ? `${definers[0]}::hello is used (the only one on a path).` :
        has.A ? "Without <code>virtual</code> inheritance, D contains <b>two</b> A sub-objects → 'A' is an ambiguous base. Fix: <code>class B : virtual public A</code>." : "error: no member named 'hello'";
      el.querySelector('[data-r="js"]').innerHTML = "A class can only <code>extend</code> one parent - there is no diamond. Share behaviour with <b>mixins</b> (<code>Object.assign(D.prototype, CMixin)</code>) or composition instead.";
    };
    el.querySelectorAll("input").forEach((i) => i.addEventListener("change", go));
    go();
  }

  css();
  document.querySelectorAll('[data-widget="dispatch"]').forEach((el) => {
    const cfg = JSON.parse(el.dataset.config || "{}");
    (cfg.mode === "diamond" ? diamond : lookup)(el);
    const cppOnly = () => el.querySelectorAll(".cpp-only").forEach((s) => (s.style.display = ["cpp", "all"].includes(document.documentElement.dataset.lang) ? "" : "none"));
    document.addEventListener("langchange", cppOnly);
    cppOnly();
  });
})();
