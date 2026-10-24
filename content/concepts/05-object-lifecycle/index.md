---
title: Constructors, destructors and object lifecycle
order: 5
icon: ♻️
summary: How objects are initialised, copied and destroyed - reference counting in Python, deterministic destructors (RAII) and the rule of 0/3/5 in C++, and garbage collection in JavaScript.
why: Leaked files, double frees, dangling pointers and "why is my object still alive?" all come from misunderstanding lifecycle. C++ makes it explicit; Python and JS hide it until it bites.
widgets:
  - type: trace
    traces: {python: py-lifecycle, cpp: cpp-lifecycle, javascript: js-lifecycle}
compare:
  - ["Initialise", "`__init__` (after `__new__`)", "constructor + member initialiser list", "`constructor`"]
  - ["Clean up", "`__del__` (rarely) - prefer `with` + `__enter__/__exit__`", "destructor `~Class()` - runs at end of scope", "no destructors; explicit `close()`/`dispose()`, `try/finally`"]
  - ["When is memory freed?", "when the reference count hits 0 (+ cycle GC)", "end of scope (stack) or `delete` / smart pointer", "some time after unreachable (GC)"]
  - ["Copying", "`copy.copy` / `copy.deepcopy`; assignment only copies references", "copy constructor & copy assignment (rule of 3/5)", "`structuredClone`, `{...obj}` (shallow); assignment copies references"]
  - ["Default constructor", "`__init__` with defaults", "generated if you declare none", "an empty `constructor() {}` is implied"]
quiz:
  - q: "In C++, when is a local object's destructor called?"
    options: ["When the garbage collector runs", "At the closing brace of its scope", "Only when you call delete", "Never"]
    answer: 1
    explain: "Stack objects are destroyed deterministically at the end of their scope, in reverse order of construction. That's RAII."
  - q: "What does `del a` do in Python?"
    options: ["Destroys the object", "Removes the name `a`; the object dies only if nothing else refers to it", "Calls __init__ again", "Copies the object"]
    answer: 1
    explain: "`del` unbinds a name and decrements the reference count. The object is freed only when the count reaches zero."
  - q: "Which is the best way to make sure a file is closed in Python and JavaScript?"
    options: ["Rely on the garbage collector", "A destructor", "`with open(...)` in Python, `try { … } finally { file.close() }` in JS", "Restart the program"]
    answer: 2
    explain: "Garbage collection timing isn't guaranteed. Use explicit scope-based cleanup."
---

## Every object's life has three phases

```mermaid
flowchart LR
  A["allocate<br/>memory"] --> I["initialise<br/>constructor"] --> U["use<br/>methods"] --> C["clean up<br/>destructor / close"] --> F["free<br/>memory"]
```

The languages disagree mostly about the **last two phases**: *when* clean-up happens and *who* triggers it.

| | Python | C++ | JavaScript |
|---|---|---|---|
| strategy | reference counting (+ cycle collector) | **you** decide: scope, `delete`, smart pointers | tracing garbage collector |
| clean-up timing | immediately at count 0 (CPython) | exactly at end of scope | unpredictable |
| typical tool | `with` statement | RAII (destructors) | `try/finally`, `using` (newer) |

## RAII, the most important C++ idea
*Resource Acquisition Is Initialisation*: tie every resource (memory, file, lock, socket) to an object whose
**destructor** releases it. Since destructors run automatically at the end of scope, even when an exception is thrown,
resources can't leak. `std::unique_ptr`, `std::vector`, `std::fstream` and `std::lock_guard` all work this way.

## Copying objects
Assignment means different things:

- **Python / JavaScript**: `b = a` copies the *reference*. Both names see the same object. Use `copy.deepcopy` / `structuredClone` for independent copies.
- **C++**: `Dog b = a;` runs the **copy constructor** and makes an independent object. If your class owns raw resources you must define copying correctly (the **rule of three/five**), or better, let members like `std::vector` and `std::unique_ptr` handle it (the **rule of zero**).
