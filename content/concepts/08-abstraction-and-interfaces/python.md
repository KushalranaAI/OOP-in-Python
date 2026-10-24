### Abstract base classes

```py
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    def describe(self) -> str:                    # concrete method shared by all shapes
        return f"{type(self).__name__} with area {self.area():.2f}"

Shape()     # TypeError: Can't instantiate abstract class Shape without an implementation for abstract method 'area'
```

A subclass becomes instantiable only once it implements **every** abstract method.

### Protocols: interfaces by structure

```py
from typing import Protocol

class Notifier(Protocol):
    def send(self, message: str) -> None: ...

class EmailNotifier:                              # no inheritance!
    def send(self, message: str) -> None:
        print("email:", message)

def alert(n: Notifier) -> None:                   # mypy accepts anything with send(str)
    n.send("server down")
```

Use **ABCs** when you want shared code and a run-time check, and **Protocols** when you want flexible, test-friendly
contracts. `@runtime_checkable` makes `isinstance(x, Notifier)` work for Protocols too.
