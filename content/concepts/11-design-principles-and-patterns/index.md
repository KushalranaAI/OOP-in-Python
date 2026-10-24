---
title: SOLID principles and design patterns
order: 11
icon: 🏛️
summary: The rules of thumb (SOLID) and reusable solutions (Strategy, Observer, Factory, Singleton-alternatives) that turn OOP features into maintainable designs.
why: Knowing the syntax of classes is the easy part. Knowing how to split responsibilities between them is what interviews test and what keeps a codebase alive.
compare:
  - ["Strategy", "pass a callable or an object", "virtual interface or `std::function`", "pass a function or an object"]
  - ["Observer", "list of callbacks", "`std::vector<std::function<void(const Event&)>>`", "`EventTarget` / list of callbacks"]
  - ["Factory", "`@classmethod` alternative constructors", "static `create()` returning `std::unique_ptr<Base>`", "`static` methods / plain functions"]
  - ["Singleton (avoid!)", "a module *is* a singleton", "function-local `static` (Meyers singleton)", "an ES module export"]
  - ["Value objects", "`@dataclass(frozen=True)`", "`const` members / immutable class", "`Object.freeze`"]
quiz:
  - q: "A `Report` class loads data, formats HTML *and* emails it. Which SOLID principle does it break?"
    options: ["Liskov substitution", "Single responsibility", "Interface segregation", "Open/closed"]
    answer: 1
    explain: "It has three reasons to change. Split it into a loader, a formatter and a sender."
  - q: "Which pattern lets many objects react when one object changes (e.g. UI updates when data changes)?"
    options: ["Factory", "Observer", "Singleton", "Adapter"]
    answer: 1
    explain: "Observers subscribe to a subject and get notified of events."
  - q: "What does the dependency inversion principle recommend?"
    options: ["Never use dependencies", "High-level code should depend on abstractions, with concrete details injected", "Invert all if statements", "Subclasses should depend on parents"]
    answer: 1
    explain: "e.g. OrderService depends on a Notifier interface; the email/SMS implementation is plugged in from outside."
---

## SOLID in one table

| Letter | Principle | In one sentence | Smell when broken |
|---|---|---|---|
| **S** | Single responsibility | A class should have one reason to change | a `UserManager` doing DB, email and validation |
| **O** | Open/closed | Extend behaviour by adding code, not editing working code | a growing `if type == ...` chain |
| **L** | Liskov substitution | Subclasses must be usable wherever the parent is | a `Square(Rectangle)` whose `set_width` surprises callers |
| **I** | Interface segregation | Many small interfaces beat one fat one | classes implementing methods with `raise NotImplementedError` |
| **D** | Dependency inversion | Depend on abstractions; inject the details | `new MySQLDatabase()` buried inside business logic |

## Patterns you'll actually use

```mermaid
flowchart LR
  subgraph Strategy
    C[Checkout] -->|uses| PS{{PricingStrategy}}
    PS --> R[Regular]
    PS --> S[Sale]
  end
  subgraph Observer
    ST[Store] -->|notify| O1[Logger]
    ST -->|notify| O2[EmailAlert]
  end
  subgraph Factory
    F["Shape.create('circle')"] --> CI[Circle]
    F --> SQ[Square]
  end
```

- **Strategy**: swap an algorithm (pricing, sorting, routing) without changing the code that uses it.
- **Observer**: publish events; any number of subscribers react. It's the basis of every UI framework and event bus.
- **Factory**: centralise the "which class do I create?" decision.
- **Adapter**: wrap an awkward API so it fits the interface your code expects.
- **Decorator**: wrap an object to add behaviour while keeping its interface (logging, caching, retries).

> Patterns are vocabulary, not goals. Reach for one when you feel the pain it solves. Every project in the
> **Projects** section is built with these principles; look for them in each step.
