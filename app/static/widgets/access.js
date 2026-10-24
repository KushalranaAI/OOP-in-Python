// Access-control matrix: who may touch which member, in each language? Click a cell to see the code and what happens.
(function () {
  const DATA = {
    python: {
      members: [["x", "public"], ["_y", "\"protected\" (convention)"], ["__z", "\"private\" (name mangling)"]],
      contexts: ["inside the class", "inside a subclass", "outside (any code)"],
      cells: {
        "x|0": ["ok", "self.x", "Works."],
        "x|1": ["ok", "self.x", "Works."],
        "x|2": ["ok", "obj.x", "Works - it's public."],
        "_y|0": ["ok", "self._y", "Works."],
        "_y|1": ["ok", "self._y", "Works. Subclasses are expected to use _names."],
        "_y|2": ["warn", "obj._y", "Works, but the underscore says 'internal - don't'. Linters will warn you."],
        "__z|0": ["ok", "self.__z", "Works. Python secretly renames it to self._Base__z."],
        "__z|1": ["err", "self.__z", "AttributeError: 'Derived' object has no attribute '_Derived__z'. Inside Derived, __z is mangled with Derived's name!"],
        "__z|2": ["err", "obj.__z", "AttributeError: 'Base' object has no attribute '__z'. (obj._Base__z still works: it's privacy by obscurity, not enforcement.)"],
      },
    },
    cpp: {
      members: [["pub", "public:"], ["prot", "protected:"], ["priv", "private:"]],
      contexts: ["inside Base's methods", "inside Derived's methods", "friend function", "outside (main)"],
      cells: {
        "pub|0": ["ok", "this->pub", "Compiles."], "pub|1": ["ok", "this->pub", "Compiles."], "pub|2": ["ok", "b.pub", "Compiles."], "pub|3": ["ok", "b.pub", "Compiles."],
        "prot|0": ["ok", "this->prot", "Compiles."], "prot|1": ["ok", "this->prot", "Compiles - derived classes can use protected members of themselves."],
        "prot|2": ["ok", "b.prot", "Compiles - a friend sees everything."], "prot|3": ["err", "b.prot", "error: 'int Base::prot' is protected within this context"],
        "priv|0": ["ok", "this->priv", "Compiles."], "priv|1": ["err", "this->priv", "error: 'int Base::priv' is private within this context"],
        "priv|2": ["ok", "b.priv", "Compiles - friend inspect(Base&) was declared inside Base."], "priv|3": ["err", "b.priv", "error: 'int Base::priv' is private within this context"],
      },
    },
    javascript: {
      members: [["x", "public field"], ["_y", "convention only"], ["#z", "true private (#)"]],
      contexts: ["inside the class", "inside a subclass", "outside (any code)"],
      cells: {
        "x|0": ["ok", "this.x", "Works."], "x|1": ["ok", "this.x", "Works."], "x|2": ["ok", "obj.x", "Works."],
        "_y|0": ["ok", "this._y", "Works."], "_y|1": ["ok", "this._y", "Works."], "_y|2": ["warn", "obj._y", "Works - the underscore is only a hint to humans."],
        "#z|0": ["ok", "this.#z", "Works."],
        "#z|1": ["err", "this.#z", "SyntaxError: Private field '#z' must be declared in an enclosing class - caught before the program even runs."],
        "#z|2": ["err", "obj.#z", "SyntaxError: Private field '#z' must be declared in an enclosing class."],
      },
    },
  };
  const ICON = { ok: "✅", warn: "⚠️", err: "❌" };
  document.querySelectorAll('[data-widget="access"]').forEach((el) => {
    el.innerHTML = `<h4>🔐 Access matrix - click a cell</h4><div class="lang-panels">${Object.entries(DATA).map(([lang, d]) => `
      <div class="lp" data-l="${lang}">
        <div class="table-wrap"><table class="compare"><tr><th>member</th>${d.contexts.map((c) => `<th>${c}</th>`).join("")}</tr>
        ${d.members.map(([m, kind]) => `<tr><th><code>${m}</code><br><small class="muted">${kind}</small></th>${d.contexts.map((_, i) => {
          const [status] = d.cells[`${m}|${i}`];
          return `<td style="text-align:center;cursor:pointer" data-cell="${m}|${i}">${ICON[status]}</td>`; }).join("")}</tr>`).join("")}
        </table></div><div class="dp-result" data-detail>Pick a cell.</div></div>`).join("")}</div>`;
    el.querySelectorAll(".lp").forEach((panel) => {
      const d = DATA[panel.dataset.l];
      panel.querySelectorAll("[data-cell]").forEach((td) => td.addEventListener("click", () => {
        panel.querySelectorAll("[data-cell]").forEach((x) => (x.style.outline = ""));
        td.style.outline = "2px solid var(--accent)";
        const [status, code, message] = d.cells[td.dataset.cell];
        const ctx = d.contexts[+td.dataset.cell.split("|")[1]];
        const detail = panel.querySelector("[data-detail]");
        detail.className = "dp-result" + (status === "err" ? " error" : "");
        detail.innerHTML = `<b>${ctx}:</b> <code>${code}</code> → ${ICON[status]} ${message}`;
      }));
    });
  });
})();
