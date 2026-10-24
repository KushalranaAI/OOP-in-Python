---
title: Classes and objects - how an object is born
order: 2
icon: 🧱
summary: What a class is, what an object is in memory, and exactly what happens - step by step - when Python, C++ and JavaScript create one.
why: Most OOP confusion (aliasing bugs, 'why didn't my copy change?', 'what is self?') disappears once you can picture where objects live and what variables actually hold.
widgets:
  - type: trace
    traces: {python: py-create, cpp: cpp-create, javascript: js-create}
compare:
  - ["Define a class", "`class Dog:`", "`class Dog { … };`", "`class Dog { … }`"]
  - ["Create an object", "`rex = Dog(\"Rex\", 3)`", "`Dog rex(\"Rex\", 3);` (stack) or `new Dog(…)` (heap)", "`const rex = new Dog(\"Rex\", 3);`"]
  - ["Constructor", "`__init__` (after `__new__` allocates)", "constructor with the class's name, member initialiser list", "`constructor(…)`"]
  - ["What a variable holds", "a reference to an object (always)", "the object itself, a reference (`&`) or a pointer (`*`)", "a reference to an object (primitives by value)"]
  - ["Where methods live", "in the class object", "in the program's code; the object holds only data", "on the prototype object (`Dog.prototype`)"]
  - ["Check the type", "`type(rex)`, `isinstance(rex, Dog)`", "known at compile time; `typeid`/`dynamic_cast` at run time", "`rex instanceof Dog`, `rex.constructor.name`"]
quiz:
  - q: "In Python, which method actually **allocates** a new object?"
    options: ["__init__", "__new__", "__call__", "__alloc__"]
    answer: 1
    explain: "`__new__` creates the object, and `__init__` then initialises it. You almost never write `__new__` yourself."
  - q: "In C++, `Dog rex(\"Rex\", 3);` inside a function creates the object…"
    options: ["on the heap", "on the stack, inside the function's frame", "in a garbage-collected area", "nowhere until you call new"]
    answer: 1
    explain: "Local objects live in the stack frame and are destroyed automatically at the end of the scope. `new` would put it on the heap."
  - q: "Where does `rex.bark` come from in JavaScript if `bark` isn't an own property of `rex`?"
    options: ["It's copied into every object", "From `Dog.prototype`, via the [[Prototype]] link", "From the global scope", "It throws"]
    answer: 1
    explain: "Methods defined in a class body are stored once on `Dog.prototype`; every instance finds them through its prototype link."
---

## Class vs object

A **class** describes a kind of thing: which data each one holds and what it can do. An **object** (or *instance*) is
one concrete thing made from that description, with its own data.

```mermaid
flowchart LR
  C["class Dog<br/>───────<br/>name, age<br/>───────<br/>bark()"] -->|"Dog('Rex', 3)"| R["rex<br/>name = 'Rex'<br/>age = 3"]
  C -->|"Dog('Pip', 1)"| P["pip<br/>name = 'Pip'<br/>age = 1"]
```

## Creating an object always has the same three phases

1. **Allocate** memory for the object.
2. **Initialise** it by running the constructor with the new object as `self`/`this`.
3. **Hand back** something that refers to it: a reference (Python, JS), or the object itself or a pointer (C++).

The languages differ in *where* the memory comes from and *what your variable holds*, and that's exactly what the
step-through above shows. Use the language switch at the top to compare all three.

## Variables vs objects

| You write | Python / JavaScript | C++ |
|---|---|---|
| `b = a` | `b` refers to **the same object** (two names, one object) | `Dog b = a;` makes a **copy**; `Dog& b = a;` makes an alias |
| change via `b` | `a` sees the change | copy: `a` unchanged · reference: `a` changes |

This single difference explains a large share of beginner bugs when moving between languages.
