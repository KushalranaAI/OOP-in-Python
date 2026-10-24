---
title: Strings and exceptions
order: 5
summary: Useful string methods and formatting, then raising and handling exceptions with try/except/else/finally.
---

## Strings

```python
s = "  Object Oriented Programming  "
clean = s.strip()
print(clean.lower(), "|", clean.split(), "|", "-".join(clean.split()))
print(clean.startswith("Object"), clean.count("o"), clean.replace("Programming", "Design"))
print(f"{3.14159:.2f} | {42:>6} | {'left':<8}| {1234567:,}")
```

Strings are **immutable**: every method returns a new string.

## Exceptions
Errors are objects too, instances of classes that inherit from `BaseException`.

```python
def parse_age(text: str) -> int:
    age = int(text)                          # may raise ValueError
    if age < 0:
        raise ValueError(f"age can't be negative: {age}")
    return age

for raw in ["36", "-1", "abc"]:
    try:
        age = parse_age(raw)
    except ValueError as error:
        print(f"bad input {raw!r}: {error}")
    else:
        print("parsed", age)                 # runs only if no exception
    finally:
        pass                                 # always runs (clean-up)
```

## Your own exception classes
The first class you write might well be an exception:

```python
class InsufficientFunds(Exception):
    def __init__(self, needed: float):
        super().__init__(f"need {needed:.2f} more")
        self.needed = needed

try:
    raise InsufficientFunds(12.5)
except InsufficientFunds as e:
    print("caught:", e, "| needed =", e.needed)
```

Catch **specific** exceptions. A bare `except:` hides bugs.
