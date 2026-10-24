---
title: Encapsulation and access control
order: 4
icon: 🔐
summary: Hide an object's data behind methods that enforce its rules. Public, protected and private in C++; conventions and name mangling in Python; true #private fields and closures in JavaScript.
why: Encapsulation is what lets you change how a class works inside without breaking everyone who uses it, and it's how classes protect their invariants ("a balance is never negative").
widgets:
  - type: access
compare:
  - ["Public", "everything by default", "`public:`", "everything by default"]
  - ["Protected", "`_name` (convention only)", "`protected:` - class and subclasses", "`_name` (convention only)"]
  - ["Private", "`__name` → name-mangled to `_Class__name`", "`private:` - only the class (and friends)", "`#name` - enforced by the language"]
  - ["Enforced by", "nobody - 'we're all consenting adults'", "the compiler", "the language (SyntaxError) for `#`"]
  - ["Getter / setter", "`@property` / `@x.setter`", "methods `x()` / `set_x()`", "`get x()` / `set x(v)`"]
  - ["Make immutable", "`@dataclass(frozen=True)`, properties without setters", "`const` members / const objects", "`Object.freeze(obj)`, no setters"]
quiz:
  - q: "What is the *main* purpose of making a field private?"
    options: ["Speed", "Saving memory", "Protecting the object's rules (invariants) and freedom to change the implementation", "Hiding secrets from attackers"]
    answer: 2
    explain: "Access control is about design, not security: outside code can only use the methods, which keep the data valid."
  - q: "In Python, inside `class Derived(Base)`, what does `self.__z` refer to?"
    options: ["Base's __z", "self._Derived__z", "self.__z literally", "an error at class creation"]
    answer: 1
    explain: "Name mangling uses the class where the code is written, so Derived's `self.__z` is `self._Derived__z`, not `_Base__z`."
  - q: "Which JavaScript syntax creates a truly private field?"
    options: ["_count", "private count", "#count", "Symbol('count')"]
    answer: 2
    explain: "`#count` is checked by the language: accessing it outside the class body is a SyntaxError. `_count` is just a naming convention."
---

## Invariants: the rules an object promises to keep

A `BankAccount` promises its balance is never negative. A `Temperature` in Kelvin is never below zero. A `Date` never
holds 31 February. If any code can write to the fields, those promises mean nothing.

```mermaid
flowchart LR
  OUT[outside code] -->|"deposit(50) ✔"| M{{public methods<br/>check the rules}}
  OUT -. "balance = -500 ✖" .-x D[(private data)]
  M --> D
```

Encapsulation = **private data + public methods that guard it**.

## Levels of access

| | inside the class | subclasses | everyone else |
|---|---|---|---|
| **public** | ✅ | ✅ | ✅ |
| **protected** | ✅ | ✅ | ❌ |
| **private** | ✅ | ❌ | ❌ |

Each language implements this table differently. Click through the matrix above for the exact behaviour (and error
messages) in each one.

## Getters, setters and "tell, don't ask"
Don't automatically add a getter and setter for every field. That's public data with extra steps. Prefer methods that
**do something meaningful**: `account.withdraw(30)` instead of `account.set_balance(account.get_balance() - 30)`.
The object should make the decisions about its own data.
