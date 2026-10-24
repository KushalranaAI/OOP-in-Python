### Strategy, Observer and Factory, Pythonically

```py
from dataclasses import dataclass, field
from typing import Callable

# Strategy: just pass a function
def checkout(total: float, pricing: Callable[[float], float]) -> float:
    return pricing(total)

# Observer: a list of callbacks
@dataclass
class Store:
    _listeners: list[Callable[[str], None]] = field(default_factory=list)
    def subscribe(self, fn): self._listeners.append(fn)
    def sell(self, item): [fn(f"sold {item}") for fn in self._listeners]

# Factory: alternative constructors + a registry
class Shape:
    registry: dict[str, type["Shape"]] = {}
    def __init_subclass__(cls, **kw):          # runs for every subclass - auto-registers it
        super().__init_subclass__(**kw)
        Shape.registry[cls.__name__.lower()] = cls
    @classmethod
    def create(cls, kind: str, *args): return cls.registry[kind](*args)
```

### Singletons
A Python **module** is created once and cached, so module-level objects already behave like singletons. Prefer
passing objects explicitly (dependency injection) so code stays testable.
