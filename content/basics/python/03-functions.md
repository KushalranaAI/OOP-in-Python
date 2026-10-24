---
title: Functions
order: 3
summary: Defining functions, default and keyword arguments, *args/**kwargs, returning several values, scope, and functions as values.
---

## Defining and calling

```python
def greet(name: str, greeting: str = "Hello") -> str:
    """Return a greeting. The text in triple quotes is a docstring."""
    return f"{greeting}, {name}!"

print(greet("Ada"))
print(greet("Bob", greeting="Hi"))       # keyword argument

def min_max(numbers: list[int]) -> tuple[int, int]:
    return min(numbers), max(numbers)    # returns a tuple

low, high = min_max([4, 1, 9])            # unpacking
print(low, high)
```

## Flexible arguments

```python
def total(*prices: float, tax: float = 0.0, **extras) -> float:
    print("extras:", extras)
    return round(sum(prices) * (1 + tax), 2)

print(total(10, 20, 5, tax=0.1, coupon="NONE"))
```

> **Trap:** default values are created **once**. Never write `def add(item, items=[])`; use `items=None` and create
> the list inside.

## Functions are objects
You can pass functions around, store them and return them. That's the basis of the Strategy pattern (chapter 11).

```python
def shout(text: str) -> str:
    return text.upper() + "!"

def apply(fn, value):
    return fn(value)

print(apply(shout, "hey"))
print(sorted(["kiwi", "fig", "banana"], key=len))
print(list(map(lambda x: x * x, [1, 2, 3])))

def make_counter():
    count = 0
    def increment():
        nonlocal count            # closure: remembers `count` between calls
        count += 1
        return count
    return increment

counter = make_counter()
counter(); counter()
print("counter:", counter())
```

## Scope
Names assigned inside a function are **local**. Reading a global works, but to *assign* one you need `global`
(avoid that; pass values in and return them instead).
