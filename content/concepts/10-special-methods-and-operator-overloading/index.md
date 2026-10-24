---
title: Special methods and operator overloading
order: 10
icon: ✨
summary: Make your objects feel built in. Printing, comparing, adding, iterating, using them as dictionary keys - via Python dunder methods, C++ operators and JavaScript's well-known symbols.
why: A `Money` or `Vector` class that supports `a + b`, `==` and printing is far nicer to use (and harder to misuse) than one with `add_to()` and `is_equal()` methods.
compare:
  - ["Printable text", "`__str__` (users) / `__repr__` (developers)", "`friend std::ostream& operator<<(std::ostream&, const T&)`", "`toString()` / `[Symbol.toPrimitive]`"]
  - ["Equality", "`__eq__` (and `__hash__` to use in sets/dicts)", "`bool operator==(const T&) const` (C++20: `= default`)", "no overloading - write `equals(other)`"]
  - ["Ordering", "`__lt__` + `functools.total_ordering`", "`auto operator<=>(const T&) const = default;` (C++20)", "a `compareTo` method / sort comparator"]
  - ["Arithmetic", "`__add__`, `__mul__`, `__radd__`…", "`T operator+(const T&) const`", "not possible - use methods (`a.add(b)`)"]
  - ["Iteration", "`__iter__` / `__next__`", "`begin()` / `end()` → range-for", "`[Symbol.iterator]()` → for…of"]
  - ["Indexing / calling", "`__getitem__`, `__len__`, `__call__`", "`operator[]`, `operator()`", "Proxy objects; plain functions"]
quiz:
  - q: "You define `__eq__` on a Python class. What happens to `__hash__`?"
    options: ["Nothing", "It's set to None, so instances can't be used in sets/dicts until you define __hash__", "It's generated automatically", "It raises an error at class creation"]
    answer: 1
    explain: "Equal objects must have equal hashes, so Python disables the default identity hash when you define __eq__."
  - q: "Can you overload `+` for your own classes in JavaScript?"
    options: ["Yes, with operator+", "No - but Symbol.toPrimitive controls how the object converts to a number/string", "Yes, with __add__", "Only for strings"]
    answer: 1
    explain: "JS has no operator overloading. `+` converts objects to primitives first, which you can customise."
  - q: "Why is `operator<<` for printing usually a non-member (friend) function in C++?"
    options: ["It's faster", "Its left operand is the stream (std::cout), not your object", "Members can't be const", "Friends are required for templates"]
    answer: 1
    explain: "`std::cout << money` calls `operator<<(std::cout, money)`. A member function would need `money << std::cout`."
---

## The idea: hooks the language calls for you

```mermaid
flowchart LR
  A["a + b"] --> P1["Python: a.__add__(b)"]
  A --> C1["C++: a.operator+(b)"]
  A --> J1["JS: no hook - converts both to primitives"]
  S["print(a) / cout << a / `${a}`"] --> P2["__str__"]
  S --> C2["operator<<"]
  S --> J2["toString / Symbol.toPrimitive"]
  F["for x in a"] --> P3["__iter__"]
  F --> C3["begin() / end()"]
  F --> J3["[Symbol.iterator]"]
```

Every language turns its syntax into method calls on your objects. Implement those methods and your class works
with the language's own operators, loops and printing.

## Rules of good overloading
1. **Only when the meaning is obvious.** `money + money` is good; `user + group` is a puzzle.
2. **Keep the usual laws.** `a == b` should mean `b == a`, and `a + b` shouldn't modify `a`.
3. **Equal objects hash equally** (Python `__hash__`, C++ `std::hash` specialisation).
4. **Return new objects** from arithmetic operators. In-place versions (`+=`) are separate (`__iadd__`, `operator+=`).
