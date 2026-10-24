---
title: Why object-oriented programming?
order: 1
icon: 💡
summary: From loose variables and functions to objects that keep data and behaviour together. What problem OOP solves, and the four ideas it's built on.
why: Every large codebase you'll meet - Django, Qt, React's ecosystem, game engines, the browser itself - is organised around objects. Knowing why helps you use the tools well instead of copying syntax.
compare:
  - ["Paradigm", "multi-paradigm; everything is an object (even ints and functions)", "multi-paradigm; OOP is optional, zero-cost by design", "multi-paradigm; objects + prototypes, functions are objects"]
  - ["Typing", "dynamic (with optional type hints)", "static, checked at compile time", "dynamic (TypeScript adds static types)"]
  - ["Typical use of OOP", "modelling domains, frameworks (Django models)", "performance-critical systems, games, GUIs (Qt)", "UI components, Node services, browser APIs (DOM objects)"]
quiz:
  - q: "Which idea means *one interface, many implementations*?"
    options: ["Encapsulation", "Inheritance", "Polymorphism", "Abstraction"]
    answer: 2
    explain: "Polymorphism lets code call `shape.area()` without knowing which shape it has. Each class supplies its own implementation."
  - q: "What is the main thing a class bundles together?"
    options: ["Files and folders", "Data and the functions that work on that data", "Only functions", "Only variables"]
    answer: 1
    explain: "A class groups *state* (attributes/fields) with *behaviour* (methods), so the rules for the data live next to the data."
---

## The problem: data and rules drift apart

Imagine a bank account written with plain variables and functions:

```py
balance = 100
def withdraw(balance, amount):
    return balance - amount        # nothing stops a negative balance…

balance = withdraw(balance, 500)   # …or anyone writing  balance = -9999
```

As programs grow, hundreds of functions touch hundreds of variables. Any of them can break a rule, and when something
goes wrong you have to search everywhere.

## The OOP answer: put the rules next to the data

```mermaid
flowchart LR
  subgraph Procedural
    D1[(balance)] --- F1[deposit] & F2[withdraw] & F3[report] & F4["any other code…"]
  end
  subgraph Object-oriented
    direction TB
    O["Account object<br/>───────<br/>- balance<br/>───────<br/>+ deposit()<br/>+ withdraw()"]
    X[other code] -->|"only via methods"| O
  end
```

An **object** owns its data and offers **methods** to work with it. The `withdraw` method can refuse to overdraw,
and since outside code can only go through the methods, the rule can't be bypassed.

## The four pillars

| Pillar | One sentence | Chapter |
|---|---|---|
| **Encapsulation** | hide the data, expose safe operations | 04 |
| **Abstraction** | describe *what* something does, not *how* | 08 |
| **Inheritance** | build a specialised class from a general one | 06 |
| **Polymorphism** | one call, different behaviour depending on the object | 07 |

## Classes and objects in one picture

```mermaid
classDiagram
  class Account {
    -balance
    +deposit(amount)
    +withdraw(amount)
  }
  note for Account "Class = blueprint (written once)"
```

`Account` is the **class**: the blueprint. `alice_account` and `bob_account` are **objects** (instances): two
separate things built from it, each with its own balance.

> OOP isn't always the answer. Small scripts are often clearer as functions. It shines when you have *things with
> state and rules* - accounts, players, documents, UI widgets - and many parts of a program that use them.
