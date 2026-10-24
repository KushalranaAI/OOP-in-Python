---
title: Abstraction, abstract classes and interfaces
order: 8
icon: 🧩
summary: Describe what something can do without saying how. Abstract base classes and Protocols in Python, pure virtual functions in C++, and abstract patterns and duck-typed interfaces in JavaScript.
why: Programming against abstractions ("anything with send(message)") is what lets you swap an email sender for an SMS sender, or a real database for a fake one in tests.
widgets:
  - type: builder
compare:
  - ["Abstract class", "`class Shape(ABC):` + `@abstractmethod`", "a class with at least one pure virtual `= 0` function", "convention: throw in the base method / check `new.target`"]
  - ["Can you instantiate it?", "no - TypeError", "no - compile error", "only prevented by your own check"]
  - ["Interface (no implementation)", "`typing.Protocol` (structural) or an all-abstract ABC", "a class with only pure virtual functions + virtual destructor", "duck typing (TypeScript adds `interface`)"]
  - ["Structural typing", "`Protocol` - fits if it has the methods", "templates / C++20 `concept`", "always (duck typing)"]
  - ["Implement several", "inherit from several ABCs", "inherit from several interface classes", "implement the methods; no declaration needed"]
quiz:
  - q: "What makes a C++ class abstract?"
    options: ["The keyword abstract", "At least one pure virtual function (`= 0`)", "A private constructor", "Having no data members"]
    answer: 1
    explain: "`virtual double area() const = 0;` makes the class abstract; subclasses must override it to be instantiable."
  - q: "How is a `typing.Protocol` different from an ABC?"
    options: ["It's faster", "Classes satisfy it just by having the right methods - no inheritance needed", "It can't have methods", "It only works at run time"]
    answer: 1
    explain: "Protocols are structural: type checkers accept any object with matching methods. ABCs are nominal: you must inherit or register."
---

## Abstraction: the "what", not the "how"

A `Notifier` must be able to `send(message)`. **How** it sends (email, SMS, Slack, a fake for tests) is an
implementation detail.

```mermaid
classDiagram
  class Notifier {
    <<interface>>
    +send(message)*
  }
  Notifier <|.. EmailNotifier
  Notifier <|.. SmsNotifier
  Notifier <|.. FakeNotifier
  class OrderService {
    -notifier Notifier
    +place_order()
  }
  OrderService --> Notifier : depends on the abstraction
```

`OrderService` depends only on `Notifier`. Pass it any implementation and it works. That's the **dependency
inversion principle**, and it's why abstractions make code testable.

## Abstract class vs interface
- An **abstract class** can mix implemented methods (shared behaviour) with abstract ones (holes subclasses must fill).
- An **interface** is all holes: just a contract.

Try the **Shape (abstract)** preset in the class builder below: the generated code shows `ABC` + `@abstractmethod`,
`= 0` pure virtual functions, and JavaScript's `new.target` check side by side.
