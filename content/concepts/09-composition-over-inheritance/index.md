---
title: Composition over inheritance
order: 9
icon: 🔗
summary: Build objects out of other objects. Has-a relationships, delegation, dependency injection, and why "favour composition" is the most quoted OOP advice.
why: Deep inheritance trees break when requirements change ("a flying, swimming robot duck?"). Composition lets you mix and swap behaviours at run time, and it's how most real-world code is structured.
compare:
  - ["Hold a part", "`self.engine = Engine()`", "`Engine engine_;` (value member, lives inside the object)", "`this.engine = new Engine()`"]
  - ["Shared / optional part", "a reference (all Python names are references)", "`std::shared_ptr<Engine>` / `Engine*` / `std::optional<Engine>`", "a reference"]
  - ["Exclusive ownership", "convention", "`std::unique_ptr<Engine>` or a value member", "convention"]
  - ["Delegation", "a method that forwards: `return self.engine.start()`", "same, or `using` for some cases", "same"]
  - ["Swap behaviour at run time", "assign a new strategy object", "`std::unique_ptr<Strategy>` / `std::function`", "assign a new object or function"]
  - ["Inject dependencies", "pass them to `__init__`", "pass references/smart pointers to the constructor", "pass them to the constructor"]
quiz:
  - q: "A `Car` has an `Engine`. Which relationship is that?"
    options: ["Inheritance (is-a)", "Composition (has-a)", "Polymorphism", "Encapsulation"]
    answer: 1
    explain: "A car is not an engine; it *contains* one, so Car holds an Engine member."
  - q: "Why does composition make code easier to test?"
    options: ["It runs faster", "You can pass in fake parts (e.g. a fake payment gateway) through the constructor", "It removes the need for tests", "It hides all methods"]
    answer: 1
    explain: "Injected dependencies can be replaced by fakes or stubs, so the class is tested in isolation."
  - q: "In C++, what's the difference between a member `Engine engine_;` and `std::unique_ptr<Engine> engine_;`?"
    options: ["None", "The first lives inside the Car object; the second is a separately allocated object the Car owns (and can be swapped or null)", "The first is shared", "The second can't be destroyed"]
    answer: 1
    explain: "A value member is part of the object's memory. A unique_ptr owns a separate heap object, which allows polymorphic parts and replacement."
---

## The problem with inheritance-only designs

```mermaid
flowchart TB
  subgraph Inheritance explosion
    D[Duck] --> FD[FlyingDuck]
    D --> SD[SwimmingDuck]
    FD --> FSD[FlyingSwimmingDuck]
    SD --> FSD2[FlyingSwimmingDuck again?]
    D --> RD[RubberDuck - can't fly but inherits fly!]
  end
```

Each new combination of behaviours needs a new subclass, and some subclasses inherit things they must not have.

## The composition answer

```mermaid
classDiagram
  class Duck {
    -fly_behaviour FlyBehaviour
    -quack_behaviour QuackBehaviour
    +perform_fly()
    +perform_quack()
    +set_fly(FlyBehaviour)
  }
  class FlyBehaviour {
    <<interface>>
    +fly()
  }
  FlyBehaviour <|.. FlyWithWings
  FlyBehaviour <|.. CannotFly
  FlyBehaviour <|.. RocketPowered
  Duck o-- FlyBehaviour
  Duck o-- QuackBehaviour
```

A `Duck` **has** a fly behaviour and **delegates** to it. Combine behaviours freely, and change them at run time
(`duck.set_fly(RocketPowered())`). This is the **Strategy pattern**.

## Kinds of has-a
| Relationship | Meaning | Example |
|---|---|---|
| **Composition** | the part's life is tied to the whole | a `House` and its `Room`s |
| **Aggregation** | the part exists independently | a `Team` and its `Player`s |
| **Association** | objects merely know about each other | a `Student` and a `Course` |

> Rule of thumb: use inheritance for genuine **is-a** with shared behaviour; use composition for everything else.
> When in doubt, compose.
