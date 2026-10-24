---
title: Modules, files and type hints
order: 6
summary: Importing modules, organising code into files and packages, reading/writing files with `with`, and type hints.
---

## Modules
Every `.py` file is a **module**. `import` runs it once and caches it.

```python
import math
from collections import Counter
from pathlib import Path

print(math.sqrt(16), math.pi)
print(Counter("mississippi").most_common(2))
print(Path("notes") / "day1.txt")
```

Put the "run me" code of a script under a guard, so the file can also be imported:

```py
def main() -> None:
    ...

if __name__ == "__main__":
    main()
```

A folder with an `__init__.py` is a **package**: `from shop.cart import Cart`.

## Files and `with`
`with` guarantees the file is closed, even if an error happens. It's built on special methods (chapter 10).

```python
import tempfile
from pathlib import Path

folder = Path(tempfile.mkdtemp())
path = folder / "todo.txt"
with open(path, "w", encoding="utf-8") as f:
    f.write("learn classes\nlearn inheritance\n")

with open(path, encoding="utf-8") as f:
    for number, line in enumerate(f, start=1):
        print(number, line.strip())

print(path.read_text(encoding="utf-8").splitlines())
```

## Type hints
Hints document what a function expects and returns. Editors and `mypy` use them to catch mistakes early.

```python
from typing import Optional

def find(users: dict[str, int], name: str) -> Optional[int]:
    return users.get(name)

print(find({"ada": 36}, "ada"), find({}, "bob"))
```

You now know enough Python for the OOP chapters. Start with **Why OOP?**
