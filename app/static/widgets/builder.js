// Class builder: describe a class once, get Python, C++ and JavaScript code (and a class diagram) at the same time.
(function () {
  const PRESETS = {
    "Dog extends Animal": { name: "Dog", parent: "Animal", abstract: false,
      fields: [{ name: "name", type: "string", vis: "public", value: "Rex" }, { name: "age", type: "int", vis: "private", value: "3" }],
      methods: [{ name: "speak", vis: "public", kind: "normal" }, { name: "birthday", vis: "public", kind: "normal" }] },
    "BankAccount": { name: "BankAccount", parent: "", abstract: false,
      fields: [{ name: "owner", type: "string", vis: "public", value: "Ada" }, { name: "balance", type: "int", vis: "private", value: "0" }],
      methods: [{ name: "deposit", vis: "public", kind: "normal" }, { name: "bank_count", vis: "public", kind: "static" }] },
    "Shape (abstract)": { name: "Shape", parent: "", abstract: true,
      fields: [{ name: "label", type: "string", vis: "protected", value: "shape" }],
      methods: [{ name: "area", vis: "public", kind: "abstract" }, { name: "describe", vis: "public", kind: "normal" }] },
  };
  const TYPES = { int: { py: "int", cpp: "int", def: "0" }, float: { py: "float", cpp: "double", def: "0.0" },
                  string: { py: "str", cpp: "std::string", def: "" }, bool: { py: "bool", cpp: "bool", def: "false" } };

  const ident = (s, fallback) => (String(s || "").trim().replace(/[^A-Za-z0-9_]/g, "_").replace(/^(\d)/, "_$1") || fallback);
  const camel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  const lit = (f, lang) => {
    const v = String(f.value ?? "");
    if (f.type === "string") return JSON.stringify(v);
    if (f.type === "bool") return lang === "py" ? (v === "true" ? "True" : "False") : (v === "true" ? "true" : "false");
    return v === "" || isNaN(Number(v)) ? TYPES[f.type].def : v;
  };

  function python(m) {
    const name = ident(m.name, "MyClass"), parent = ident(m.parent, "");
    const bases = [parent, m.abstract && !parent ? "ABC" : ""].filter(Boolean);
    const lines = [];
    if (m.abstract || m.methods.some((x) => x.kind === "abstract")) lines.push("from abc import ABC, abstractmethod", "");
    if (parent) lines.push(`class ${parent}:`, `    def __init__(self) -> None:`, `        pass`, "", "");
    lines.push(`class ${name}${bases.length ? `(${bases.join(", ")})` : ""}:`);
    if (m.methods.some((x) => x.kind === "static")) lines.push(`    instances = 0                     # class attribute, shared by all objects`, "");
    const params = m.fields.map((f) => `${ident(f.name, "x")}: ${TYPES[f.type].py} = ${lit(f, "py")}`);
    lines.push(`    def __init__(self${params.length ? ", " + params.join(", ") : ""}) -> None:`);
    if (parent) lines.push(`        super().__init__()`);
    m.fields.forEach((f) => {
      const n = ident(f.name, "x"), attr = f.vis === "private" ? `__${n}` : f.vis === "protected" ? `_${n}` : n;
      lines.push(`        self.${attr} = ${n}`);
    });
    if (m.methods.some((x) => x.kind === "static")) lines.push(`        ${name}.instances += 1`);
    if (!m.fields.length && !parent && !m.methods.some((x) => x.kind === "static")) lines.push("        pass");
    m.fields.filter((f) => f.vis === "private").forEach((f) => {
      const n = ident(f.name, "x");
      lines.push("", "    @property", `    def ${n}(self) -> ${TYPES[f.type].py}:`, `        return self.__${n}`);
    });
    m.methods.forEach((x) => {
      const n = ident(x.name, "method");
      lines.push("");
      if (x.kind === "abstract") lines.push("    @abstractmethod", `    def ${n}(self) -> None:`, `        ...`);
      else if (x.kind === "static") lines.push("    @classmethod", `    def ${n}(cls) -> int:`, `        return cls.instances`);
      else lines.push(`    def ${x.vis === "private" ? "__" + n : x.vis === "protected" ? "_" + n : n}(self) -> None:`, `        print("${name}.${n} called")`);
    });
    lines.push("", "", 'if __name__ == "__main__":');
    if (m.abstract || m.methods.some((x) => x.kind === "abstract")) lines.push(`    print("${name} is abstract - subclass it and implement the abstract methods.")`);
    else {
      lines.push(`    obj = ${name}()`, `    print(obj.__dict__)`);
      m.methods.filter((x) => x.vis === "public").forEach((x) => lines.push(x.kind === "static" ? `    print(${name}.${ident(x.name, "method")}())` : `    obj.${ident(x.name, "method")}()`));
    }
    return lines.join("\n") + "\n";
  }

  const member = (f) => ident(f.name, "x") + (f.vis === "private" ? "_" : "");     // private members get a trailing _

  function cpp(m) {
    const name = ident(m.name, "MyClass"), parent = ident(m.parent, "");
    const abstract = m.abstract || m.methods.some((x) => x.kind === "abstract");
    const lines = ["#include <iostream>", "#include <string>", ""];
    if (parent) lines.push(`class ${parent} {`, "public:", `    virtual ~${parent}() = default;`, "};", "");
    lines.push(`class ${name}${parent ? ` : public ${parent}` : ""} {`);
    for (const vis of ["public", "protected", "private"]) {
      const fields = m.fields.filter((f) => f.vis === vis), methods = m.methods.filter((x) => x.vis === vis);
      const isPublic = vis === "public";
      if (!fields.length && !methods.length && !isPublic) continue;
      lines.push(`${vis}:`);
      if (isPublic) {
        const params = m.fields.map((f) => `${TYPES[f.type].cpp} ${ident(f.name, "x")} = ${lit(f, "cpp")}`);
        const init = m.fields.map((f) => `${member(f)}(${f.type === "string" ? "std::move(" + ident(f.name, "x") + ")" : ident(f.name, "x")})`);
        lines.push(`    ${m.fields.length === 1 ? "explicit " : ""}${name}(${params.join(", ")})${init.length ? `\n        : ${init.join(", ")}` : ""} {${m.methods.some((x) => x.kind === "static") ? " ++instances_; " : ""}}`);
        if (abstract || parent) lines.push(`    virtual ~${name}() = default;`);
        m.fields.filter((f) => f.vis === "private").forEach((f) => lines.push(`    ${f.type === "string" ? "const std::string&" : TYPES[f.type].cpp} ${ident(f.name, "x")}() const { return ${member(f)}; }`));
      }
      methods.forEach((x) => {
        const n = ident(x.name, "method");
        if (x.kind === "abstract") lines.push(`    virtual void ${n}() const = 0;            // pure virtual`);
        else if (x.kind === "static") lines.push(`    static int ${n}() { return instances_; }`);
        else lines.push(`    void ${n}() { std::cout << "${name}.${n} called\\n"; }`);
      });
      fields.forEach((f) => lines.push(`    ${TYPES[f.type].cpp} ${member(f)};`));
    }
    if (m.methods.some((x) => x.kind === "static")) lines.push("private:", "    static inline int instances_ = 0;      // C++17 inline static member");
    lines.push("};", "", "int main() {");
    if (abstract) lines.push(`    std::cout << "${name} is abstract - derive from it and override the pure virtual functions.\\n";`);
    else {
      lines.push(`    ${name} obj;`);
      m.fields.forEach((f) => lines.push(f.vis === "public" ? `    std::cout << "${ident(f.name, "x")} = " << obj.${member(f)} << "\\n";`
                                       : f.vis === "private" ? `    std::cout << "${ident(f.name, "x")} = " << obj.${ident(f.name, "x")}() << "\\n";` : ""));
      m.methods.filter((x) => x.vis === "public").forEach((x) => lines.push(x.kind === "static" ? `    std::cout << ${name}::${ident(x.name, "method")}() << "\\n";` : `    obj.${ident(x.name, "method")}();`));
    }
    lines.push("}");
    return lines.filter((l) => l !== "").join("\n").replace(/\n(class |int main|#include <string>\n)/g, "\n\n$1").replace(/^#include <iostream>\n\n/, "#include <iostream>\n") + "\n";
  }

  function javascript(m) {
    const name = ident(m.name, "MyClass"), parent = ident(m.parent, "");
    const abstract = m.abstract || m.methods.some((x) => x.kind === "abstract");
    const lines = [];
    if (parent) lines.push(`class ${parent} {}`, "");
    lines.push(`class ${name}${parent ? ` extends ${parent}` : ""} {`);
    m.fields.filter((f) => f.vis === "private").forEach((f) => lines.push(`  #${camel(ident(f.name, "x"))};`));
    if (m.methods.some((x) => x.kind === "static")) lines.push("  static instances = 0;");
    const params = m.fields.map((f) => `${camel(ident(f.name, "x"))} = ${lit(f, "js")}`);
    lines.push(`  constructor(${params.join(", ")}) {`);
    if (parent) lines.push("    super();");
    if (abstract) lines.push(`    if (new.target === ${name}) throw new TypeError("${name} is abstract");`);
    m.fields.forEach((f) => {
      const n = camel(ident(f.name, "x"));
      lines.push(`    this.${f.vis === "private" ? "#" : f.vis === "protected" ? "_" : ""}${n} = ${n};`);
    });
    if (m.methods.some((x) => x.kind === "static")) lines.push(`    ${name}.instances++;`);
    lines.push("  }");
    m.fields.filter((f) => f.vis === "private").forEach((f) => { const n = camel(ident(f.name, "x")); lines.push("", `  get ${n}() {`, `    return this.#${n};`, "  }"); });
    m.methods.forEach((x) => {
      const n = camel(ident(x.name, "method"));
      lines.push("");
      if (x.kind === "abstract") lines.push(`  ${n}() {`, `    throw new Error("${n}() must be implemented by a subclass");`, "  }");
      else if (x.kind === "static") lines.push(`  static ${n}() {`, `    return ${name}.instances;`, "  }");
      else lines.push(`  ${x.vis === "private" ? "#" : ""}${n}() {`, `    console.log("${name}.${n} called");`, "  }");
    });
    lines.push("}", "");
    if (abstract) lines.push(`console.log("${name} is abstract - extend it and implement the abstract methods.");`);
    else {
      lines.push(`const obj = new ${name}();`, "console.log(obj);");
      m.methods.filter((x) => x.vis === "public").forEach((x) => lines.push(x.kind === "static" ? `console.log(${name}.${camel(ident(x.name, "method"))}());` : `obj.${camel(ident(x.name, "method"))}();`));
    }
    return lines.join("\n") + "\n";
  }

  function diagram(m) {
    const name = ident(m.name, "MyClass"), sign = { public: "+", protected: "#", private: "-" };
    const lines = ["classDiagram", `  class ${name} {`];
    if (m.abstract) lines.push("    <<abstract>>");
    m.fields.forEach((f) => lines.push(`    ${sign[f.vis]}${ident(f.name, "x")} ${f.type}`));
    m.methods.forEach((x) => lines.push(`    ${sign[x.vis]}${ident(x.name, "method")}()${x.kind === "abstract" ? "*" : x.kind === "static" ? "$" : ""}`));
    lines.push("  }");
    if (m.parent) lines.push(`  ${ident(m.parent, "Base")} <|-- ${name}`);
    return lines.join("\n");
  }

  function mount(el) {
    let model = JSON.parse(JSON.stringify(PRESETS["Dog extends Animal"]));
    el.innerHTML = `
      <div class="w-controls"><b>Preset:</b>${Object.keys(PRESETS).map((p) => `<button class="btn small ghost" data-preset="${p}">${p}</button>`).join("")}</div>
      <div class="grid-2" style="margin:0">
        <div>
          <div class="w-controls">Class <input data-k="name" size="12"> extends <input data-k="parent" size="10" placeholder="(nothing)"> <label><input type="checkbox" data-k="abstract"> abstract</label></div>
          <b>Fields</b><div data-list="fields"></div><button class="btn small ghost" data-add="fields">+ field</button>
          <br><br><b>Methods</b><div data-list="methods"></div><button class="btn small ghost" data-add="methods">+ method</button>
        </div>
        <div data-diagram></div>
      </div>
      <div class="lang-panels" style="margin-top:12px">${["python", "cpp", "javascript"].map((l) => `
        <div class="lp" data-l="${l}"><h3 class="lp-title" style="--lc: var(--${l === "javascript" ? "js" : l === "python" ? "py" : "cpp"})">${{ python: "🐍 Python", cpp: "⚙️ C++", javascript: "🟨 JavaScript" }[l]}</h3>
          <div class="runner"><div class="runner-bar"><span class="file">generated code</span><span class="spacer"></span><button class="btn small primary" data-run-gen="${l}">▶ Run</button></div>
          <pre style="margin:0;padding:12px 14px;overflow:auto;max-height:520px"><code data-code="${l}"></code></pre><pre class="output" data-out="${l}" hidden></pre></div></div>`).join("")}
      </div>`;
    const sel = (k) => el.querySelector(`[data-k="${k}"]`);
    const rowHtml = (kind, item, i) => kind === "fields"
      ? `<div class="w-controls" data-row="${i}"><input data-f="name" value="${item.name}" size="9"><select data-f="type">${Object.keys(TYPES).map((t) => `<option ${t === item.type ? "selected" : ""}>${t}</option>`).join("")}</select>
          <select data-f="vis">${["public", "protected", "private"].map((v) => `<option ${v === item.vis ? "selected" : ""}>${v}</option>`).join("")}</select>
          = <input data-f="value" value="${item.value ?? ""}" size="7"><button class="btn small ghost" data-del="${i}">✕</button></div>`
      : `<div class="w-controls" data-row="${i}"><input data-f="name" value="${item.name}" size="10">()
          <select data-f="vis">${["public", "protected", "private"].map((v) => `<option ${v === item.vis ? "selected" : ""}>${v}</option>`).join("")}</select>
          <select data-f="kind">${["normal", "static", "abstract"].map((v) => `<option ${v === item.kind ? "selected" : ""}>${v}</option>`).join("")}</select>
          <button class="btn small ghost" data-del="${i}">✕</button></div>`;
    function renderForm() {
      sel("name").value = model.name; sel("parent").value = model.parent; sel("abstract").checked = model.abstract;
      for (const kind of ["fields", "methods"]) el.querySelector(`[data-list="${kind}"]`).innerHTML = model[kind].map((x, i) => rowHtml(kind, x, i)).join("");
      generate();
    }
    function readForm() {
      model.name = sel("name").value; model.parent = sel("parent").value; model.abstract = sel("abstract").checked;
      for (const kind of ["fields", "methods"]) {
        model[kind] = [...el.querySelectorAll(`[data-list="${kind}"] [data-row]`)].map((row) =>
          Object.fromEntries([...row.querySelectorAll("[data-f]")].map((i) => [i.dataset.f, i.value])));
      }
    }
    function generate() {
      const out = { python: python(model), cpp: cpp(model), javascript: javascript(model) };
      for (const [l, code] of Object.entries(out)) {
        const c = el.querySelector(`[data-code="${l}"]`);
        c.textContent = code; c.className = `language-${l}`; c.removeAttribute("data-highlighted");
        if (window.hljs) hljs.highlightElement(c);
      }
      const d = el.querySelector("[data-diagram]");
      d.innerHTML = ""; const pre = document.createElement("pre"); pre.className = "mermaid"; pre.textContent = diagram(model); d.append(pre);
      window.renderDiagrams && window.renderDiagrams();
      el._code = out;
    }
    el.addEventListener("input", (e) => { if (e.target.matches("input, select")) { readForm(); generate(); } });
    el.addEventListener("click", async (e) => {
      const t = e.target;
      if (t.dataset.preset) { model = JSON.parse(JSON.stringify(PRESETS[t.dataset.preset])); renderForm(); }
      if (t.dataset.add) { readForm(); model[t.dataset.add].push(t.dataset.add === "fields" ? { name: "field", type: "int", vis: "public", value: "0" } : { name: "method", vis: "public", kind: "normal" }); renderForm(); }
      if (t.dataset.del !== undefined) { readForm(); const kind = t.closest("[data-list]").dataset.list; model[kind].splice(+t.dataset.del, 1); renderForm(); }
      if (t.dataset.runGen) {
        const out = el.querySelector(`[data-out="${t.dataset.runGen}"]`);
        out.hidden = false; out.textContent = "Running…";
        try { const r = await window.runCode(t.dataset.runGen, el._code[t.dataset.runGen]); out.textContent = [r.stdout, r.stderr].filter(Boolean).join("\n") || "(no output)"; }
        catch (err) { out.textContent = String(err); }
      }
    });
    renderForm();
  }

  document.querySelectorAll('[data-widget="builder"]').forEach(mount);
  window.ClassBuilder = { python, cpp, javascript, PRESETS };
})();
