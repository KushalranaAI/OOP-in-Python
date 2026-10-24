---
title: Attributes, methods, self and this
order: 3
icon: 🎯
summary: Instance vs class (static) members, what self and this really are, and why a method always knows which object it's working on.
why: Mixing up instance and class-level data, or losing `this` in JavaScript callbacks, are among the most common real-world bugs.
widgets:
  - type: trace
    traces: {python: py-self, cpp: cpp-this, javascript: js-this}
compare:
  - ["The current object", "`self` - an explicit first parameter", "`this` - a hidden pointer (`this->x`, usually just `x`)", "`this` - decided at call time"]
  - ["Instance data", "`self.x = …` in `__init__`", "member variables declared in the class", "`this.x = …` or class fields `x = 0;`"]
  - ["Class-level data", "class attribute `total = 0`", "`static int total;`", "`static total = 0;`"]
  - ["Class-level method", "`@classmethod` (gets `cls`) or `@staticmethod`", "`static` member function (no `this`)", "`static method() {}`"]
  - ["Read-only method", "convention only", "`const` member function: `int area() const`", "convention only (or `Object.freeze`)"]
  - ["Calling a method", "`obj.m()` = `Class.m(obj)`", "`obj.m()` → `Class::m(&obj)`", "`obj.m()` sets `this = obj`"]
quiz:
  - q: "In Python, `a.increment()` is equivalent to…"
    options: ["increment(a)", "Counter.increment(a)", "a.__dict__['increment']()", "Counter.increment()"]
    answer: 1
    explain: "Methods are functions stored on the class. Accessing them through an instance binds that instance as the first argument (self)."
  - q: "What does a C++ `static` member function NOT have?"
    options: ["a return type", "a `this` pointer", "parameters", "access to static data"]
    answer: 1
    explain: "Static member functions belong to the class, not to an object, so there is no `this`."
  - q: "Why does `const inc = a.increment; inc();` fail in a JavaScript class?"
    options: ["Methods can't be stored in variables", "`this` is undefined because nothing is before the dot", "inc is not a function", "Classes forbid copying"]
    answer: 1
    explain: "`this` depends on how a function is called. Use `a.increment.bind(a)` or an arrow function to keep it."
---

## Two kinds of members

```mermaid
classDiagram
  class Counter {
    +count int           (one per object)
    +total$ int          (one for the class)
    +increment()
    +reset_total()$
  }
```

- **Instance members** belong to each object: every counter has its own `count`.
- **Class (static) members** belong to the class: one `total` shared by all counters. In UML they're underlined, or marked `$` in Mermaid.

## How a method knows "which object?"

A method is written once but works on many objects. The trick is a hidden or explicit **first argument** that refers to
the object the method was called on:

| Language | You write | What really happens |
|---|---|---|
| Python | `a.increment()` | `Counter.increment(a)`, where `a` arrives as **self** |
| C++ | `a.increment()` | `Counter::increment(&a)`, where `&a` arrives as **this** |
| JavaScript | `a.increment()` | `increment` runs with **this = a**, because `a` is before the dot |

Step through the trace above in each language to watch `self`/`this` change between calls.

## Methods that read vs methods that change
Good method names make it obvious: `area()`, `is_empty()` and `balance` *read*; `deposit()`, `add()` and `reset()` *change*.
C++ even lets you **promise** a method won't change the object with `const`, and the compiler holds you to it.
