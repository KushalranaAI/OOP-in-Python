---
title: Control flow
order: 2
summary: if/elif/else, for and while loops, range, break/continue, and match statements.
---

## Decisions
Indentation (4 spaces) defines blocks; there are no braces.

```python
temperature = 23
if temperature > 30:
    print("hot")
elif temperature > 15:
    print("pleasant")
else:
    print("cold")

status = "adult" if 36 >= 18 else "minor"    # conditional expression
print(status)
```

`and`, `or` and `not` are words. Empty containers, `0`, `""` and `None` count as **falsy**.

## Loops
`for` loops over **anything iterable**: lists, strings, ranges, dict keys, files, your own objects (chapter 10).

```python
for i in range(3):                    # 0, 1, 2
    print("round", i)

for index, fruit in enumerate(["apple", "kiwi"]):
    print(index, fruit)

for name, score in zip(["ada", "bob"], [90, 72]):
    print(f"{name}: {score}")

n = 10
while n > 1:
    n = n // 2 if n % 2 == 0 else 3 * n + 1
    if n == 4:
        print("reached 4, stopping")
        break
```

## Pattern matching (Python 3.10+)

```python
def describe(command: str) -> str:
    match command.split():
        case ["go", direction]:
            return f"moving {direction}"
        case ["take", *items]:
            return f"taking {', '.join(items)}"
        case ["quit"]:
            return "bye"
        case _:
            return "unknown command"

for c in ["go north", "take key lamp", "dance"]:
    print(describe(c))
```
