---
title: Lists, tuples, dicts and sets
order: 4
summary: The four built-in collections, comprehensions, and choosing the right one.
---

```python
# list: ordered, mutable
scores = [72, 90, 85]
scores.append(60)
scores.sort(reverse=True)
print(scores, scores[0], scores[-1], scores[1:3])

# tuple: ordered, immutable - good for fixed records
point = (3, 4)
x, y = point
print(f"x={x} y={y}")

# dict: key -> value lookup
stock = {"apple": 5, "kiwi": 0}
stock["fig"] = 12
print(stock.get("pear", 0), list(stock.keys()))
for item, qty in stock.items():
    print(f"  {item:<6}{qty:>3}")

# set: unique items, fast membership tests
tags = {"python", "oop", "python"}
print(tags, "oop" in tags, tags | {"cpp"}, tags & {"oop", "js"})
```

## Comprehensions
A compact way to build collections:

```python
squares = [n * n for n in range(6)]
evens = [n for n in squares if n % 2 == 0]
lengths = {word: len(word) for word in ["object", "class", "self"]}
print(squares, evens, lengths, sep="\n")
```

## Choosing
| Need | Use |
|---|---|
| an ordered sequence you'll change | `list` |
| a fixed group of values | `tuple` (or a `dataclass` / `NamedTuple` with names) |
| look things up by key | `dict` |
| uniqueness / membership | `set` |

Lists, dicts and sets are **mutable**: pass one to a function and the function can change it. This aliasing is
exactly what you'll see in the object diagrams in the OOP chapters.
