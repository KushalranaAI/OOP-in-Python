### Defining and creating

```py
class Dog:
    species = "Canis familiaris"            # class attribute (shared)

    def __init__(self, name: str, age: int):
        self.name = name                    # instance attributes (per object)
        self.age = age

rex = Dog("Rex", 3)                         # call the class → new object
```

### Under the hood
- `Dog("Rex", 3)` calls `type.__call__`, which runs **`Dog.__new__(Dog)`** to allocate and then **`__init__(obj, "Rex", 3)`** to initialise.
- Every object carries a pointer to its class (`rex.__class__ is Dog`) and a dict of its own attributes (`rex.__dict__ == {'name': 'Rex', 'age': 3}`).
- Variables never contain objects, only **references**. `pip = rex` gives one dog two names.
- `id(rex)` is the object's identity (its address in CPython). `is` compares identities, `==` compares values.

### Dataclasses: the modern shortcut

```py
from dataclasses import dataclass

@dataclass
class Point:
    x: float
    y: float          # __init__, __repr__ and __eq__ are generated for you
```

### Common mistakes
- Forgetting `self.`: `name = name` in `__init__` just sets a local variable.
- Mutable class attributes: `tricks = []` at class level is **shared by every dog**. Create lists in `__init__`.
