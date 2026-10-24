---
title: Polymorphism and dynamic dispatch
order: 7
icon: 🎭
summary: One call, many behaviours. How each language finds the right method at run time - MRO lookup, prototype chains, vtables - plus duck typing, overloading and templates.
why: Polymorphism is what lets you add a new shape, payment method or file format without touching the code that uses them. It's the payoff of the whole OOP toolbox.
widgets:
  - type: dispatch
    mode: lookup
compare:
  - ["Run-time polymorphism", "always - every method call is looked up", "only for `virtual` functions (through a pointer/reference)", "always - prototype-chain lookup"]
  - ["Mechanism", "attribute lookup along the MRO", "vtable + vptr", "[[Prototype]] chain"]
  - ["Duck typing", "yes - 'if it has .area(), it's a shape'", "only at compile time, via templates/concepts", "yes"]
  - ["Overloading (same name, different params)", "no - use default args / `functools.singledispatch`", "yes - chosen at compile time", "no - check arguments inside one function"]
  - ["Compile-time polymorphism", "-", "templates, `if constexpr`, concepts", "-"]
  - ["Object slicing", "impossible (references only)", "possible! `Animal a = dog;` copies only the Animal part", "impossible (references only)"]
quiz:
  - q: "In C++, `Animal& pet = dog; pet.speak();` calls Dog::speak only if…"
    options: ["speak is public", "speak is declared virtual in Animal", "Dog is final", "pet is a pointer"]
    answer: 1
    explain: "Without `virtual`, the compiler binds the call to Animal::speak using the variable's static type."
  - q: "What is 'duck typing'?"
    options: ["Inheriting from a Duck class", "Using an object based on the methods it has, not its declared type", "Type casting", "A Python-only syntax"]
    answer: 1
    explain: "'If it walks like a duck and quacks like a duck…'. Python and JavaScript call `.quack()` on anything that has it."
  - q: "What is object slicing in C++?"
    options: ["Splitting an array", "Copying a derived object into a base-class value, losing the derived part", "A sorting algorithm", "Deleting half an object"]
    answer: 1
    explain: "`Animal a = dog;` copies only the Animal sub-object. Use references or pointers to keep polymorphic behaviour."
---

## The payoff

```mermaid
flowchart LR
  L["for shape in shapes:<br/>total += shape.area()"] --> C[Circle.area<br/>πr²]
  L --> R[Rectangle.area<br/>w·h]
  L --> T[Triangle.area<br/>½·b·h]
```

The loop doesn't know (or care) which shapes it has. Add a `Hexagon` class tomorrow and the loop still works. That's
**polymorphism**, Greek for "many forms", and it's what makes the **open/closed principle** possible: open for extension,
closed for modification.

## How does the call find its code?
Use the explorer above: pick an object and a method, and watch each language search.

- **Python** walks the class's **MRO** and takes the first class that defines the name.
- **JavaScript** walks the **prototype chain** until it finds the property or reaches `null`.
- **C++** binds non-virtual calls at **compile time** (from the variable's declared type). For `virtual` functions the
  object carries a hidden **vptr** to its class's **vtable**, a table of function pointers, and the call jumps through it.

## Other kinds of polymorphism
- **Duck typing** (Python, JS): no shared base class needed, just the right method.
- **Overloading** (C++): `print(int)` and `print(std::string)` are different functions, chosen at compile time.
- **Parametric / generic** (C++ templates, Python generics with type hints): one piece of code for many types.
