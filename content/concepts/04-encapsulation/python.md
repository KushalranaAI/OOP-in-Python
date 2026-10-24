### Conventions, mangling and properties

```py
class Account:
    def __init__(self, owner: str):
        self.owner = owner            # public
        self._history = []            # "protected": internal, subclasses may use it
        self.__balance = 0            # "private": stored as self._Account__balance

    @property
    def balance(self) -> int:         # read-only view
        return self.__balance

    def deposit(self, amount: int) -> None:
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self.__balance += amount
        self._history.append(("deposit", amount))
```

- Python **doesn't enforce** privacy. `_name` means "internal, don't rely on it", and linters will flag outside use.
- `__name` triggers **name mangling** to `_ClassName__name`. Its purpose is to avoid *accidental* clashes with subclasses, not to stop determined access.
- `@property` lets you start with a plain attribute and later add validation **without changing callers**.

### A validating setter

```py
@property
def age(self) -> int:
    return self._age

@age.setter
def age(self, value: int) -> None:
    if not 0 <= value <= 150:
        raise ValueError("age out of range")
    self._age = value
```

### Fully immutable values
`@dataclass(frozen=True)` makes assignment to any field raise `FrozenInstanceError`, which is perfect for values like money,
coordinates and dates.
