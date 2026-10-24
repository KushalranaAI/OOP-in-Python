---
title: Running Python, variables and types
order: 1
summary: How to run a script, what a variable really is (a name pointing at an object), and the core built-in types.
---

## Running Python
Save code in `hello.py` and run `python hello.py` (or `python3` on macOS/Linux). Type `python` on its own to get the
interactive REPL, which is great for experiments.

```python
print("Hello, OOP!")
name = "Ada"
age = 36
print(f"{name} is {age} years old")     # f-strings put values inside text
```

## Variables are names, not boxes
In Python a variable is a **name bound to an object**. Assigning never copies, it just points another name at the
same object. This is the most important fact for understanding objects later.

```python
a = [1, 2, 3]
b = a              # b points at the SAME list
b.append(4)
print(a)           # [1, 2, 3, 4]
print(a is b)      # True - same object
print(id(a) == id(b))

c = list(a)        # an explicit copy
c.append(5)
print(a, c)
```

## Core types
| Type | Examples | Mutable? |
|---|---|---|
| `int` | `42`, `-7`, `10**100` (unlimited size) | no |
| `float` | `3.14`, `1e-9` | no |
| `bool` | `True`, `False` | no |
| `str` | `"text"`, `'text'`, `"""multi-line"""` | no |
| `None` | the "no value" value | no |
| `list`, `dict`, `set` | see lesson 4 | **yes** |

```python
values = [42, 3.14, True, "hi", None, [1, 2]]
for v in values:
    print(repr(v), "is a", type(v).__name__)

print(7 / 2, 7 // 2, 7 % 2, 2 ** 10)    # true division, floor division, remainder, power
print(int("12") + 1, str(12) + "1", float("2.5"))
```

Python is **dynamically typed**: a name can point at any type, and the *object* knows its type. Type hints
(`age: int = 36`) document intent and are checked by tools like mypy, not at run time.
