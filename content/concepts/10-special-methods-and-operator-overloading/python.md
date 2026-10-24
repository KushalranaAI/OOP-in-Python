### The dunder methods you'll use most

```py
from functools import total_ordering

@total_ordering                          # fills in <=, >, >= from __eq__ and __lt__
class Money:
    def __init__(self, cents: int, currency: str = "USD"):
        self.cents, self.currency = cents, currency

    def __repr__(self): return f"Money({self.cents}, {self.currency!r})"   # for developers
    def __str__(self):  return f"{self.cents / 100:.2f} {self.currency}"   # for users

    def __eq__(self, other):
        if not isinstance(other, Money):
            return NotImplemented          # let Python try the other operand / fall back
        return (self.cents, self.currency) == (other.cents, other.currency)

    def __hash__(self): return hash((self.cents, self.currency))
    def __lt__(self, other): return self.cents < other.cents
    def __add__(self, other): return Money(self.cents + other.cents, self.currency)
    def __bool__(self): return self.cents != 0
```

| You write | Python calls |
|---|---|
| `len(x)`, `x[i]`, `i in x` | `__len__`, `__getitem__`, `__contains__` |
| `for v in x` | `__iter__` (then `__next__`) |
| `x(…)` | `__call__` |
| `with x:` | `__enter__` / `__exit__` |
| `3 + x` when int can't add it | `x.__radd__(3)` |

`@dataclass(order=True, frozen=True)` generates `__init__`, `__repr__`, `__eq__`, ordering and `__hash__` for you.
