---
title: Inheritance
order: 6
icon: 🧬
summary: Build specialised classes from general ones - calling the parent constructor, overriding methods, extending with super(), and what multiple inheritance (the diamond) means in each language.
why: Inheritance is everywhere in frameworks (you subclass Django's View, Qt's QWidget, JS's HTMLElement). Used well it removes duplication; used badly it creates the most rigid code there is.
widgets:
  - type: dispatch
    mode: diamond
compare:
  - ["Syntax", "`class Dog(Animal):`", "`class Dog : public Animal {`", "`class Dog extends Animal {`"]
  - ["Call the parent constructor", "`super().__init__(name)`", "`Dog(std::string n) : Animal(std::move(n)) {}`", "`super(name)` - required before using `this`"]
  - ["Call the parent's method", "`super().speak()`", "`Animal::speak()`", "`super.speak()`"]
  - ["Multiple inheritance", "yes - order decided by the C3 MRO", "yes - ambiguity errors; `virtual` inheritance for diamonds", "no - one parent; use mixins/composition"]
  - ["Is-a check", "`isinstance(d, Animal)`, `issubclass(Dog, Animal)`", "`dynamic_cast<Dog*>(p)` (needs a virtual function)", "`d instanceof Animal`"]
  - ["Prevent subclassing", "`@typing.final` (checked by type checkers)", "`class Dog final`", "not built in"]
quiz:
  - q: "In JavaScript, what happens if a subclass constructor uses `this` before calling `super(...)`?"
    options: ["Nothing special", "ReferenceError - this isn't initialised until super() returns", "this refers to the parent", "It calls super automatically"]
    answer: 1
    explain: "In derived classes the parent constructor creates the object, so `this` only exists after `super()`."
  - q: "For `class D(B, C)` with `B(A)` and `C(A)`, what is Python's MRO?"
    options: ["D, B, A, C, A", "D, B, C, A, object", "D, C, B, A, object", "D, A, B, C"]
    answer: 1
    explain: "C3 linearisation keeps the local order (B before C) and puts A after both of its subclasses."
  - q: "Which relationship is a good fit for inheritance?"
    options: ["Car → Engine", "Square → Shape", "Order → Customer", "Player → Inventory"]
    answer: 1
    explain: "A square *is a* shape. The others are *has-a* relationships, so model them with composition (chapter 9)."
---

## Is-a: the test for inheritance

```mermaid
classDiagram
  Animal <|-- Dog
  Animal <|-- Cat
  Dog <|-- Puppy
  class Animal {
    +name
    +speak()
    +describe()
  }
  class Dog {
    +speak()
    +fetch()
  }
  class Cat {
    +speak()
  }
  class Puppy {
    +speak()
  }
```

A subclass **inherits** everything from its parent, can **add** new members (`Dog.fetch`) and can **override**
inherited methods (`Dog.speak`). If "a Puppy *is a* Dog" and "a Dog *is an* Animal" read naturally, inheritance fits.

## Three things every subclass does
1. **Initialise the parent part first**: `super().__init__(…)`, `: Animal(name)`, `super(name)`.
2. **Override** where behaviour differs, keeping the same method signature.
3. **Extend**, not replace, when the parent's behaviour is still needed: call `super().method()` and add to it.

## Multiple inheritance and the diamond
When a class has two parents that share a grandparent, which version of a method wins? Python answers with a precise
algorithm (C3 linearisation), C++ makes you resolve ambiguities explicitly (and offers `virtual` inheritance), and
JavaScript avoids the question by allowing only one parent. Try it in the diamond explorer above.

> Liskov substitution principle: anywhere code expects an `Animal`, passing a `Dog` must still work correctly.
> If a subclass has to *disable* or *weaken* inherited behaviour, inheritance is the wrong tool.
