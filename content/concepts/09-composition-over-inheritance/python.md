### Has-a with delegation

```py
class Engine:
    def __init__(self, horsepower: int):
        self.horsepower = horsepower
        self.running = False

    def start(self) -> str:
        self.running = True
        return f"{self.horsepower}hp engine started"

class Car:
    def __init__(self, model: str, engine: Engine):    # dependency injection
        self.model = model
        self.engine = engine                           # Car HAS an Engine

    def start(self) -> str:
        return f"{self.model}: {self.engine.start()}"  # delegate
```

### Swappable strategies
Python functions are objects, so a strategy can be a simple callable:

```py
class PriceCalculator:
    def __init__(self, discount=lambda price: price):
        self.discount = discount
    def total(self, price): return self.discount(price)

black_friday = PriceCalculator(lambda p: p * 0.7)
```

### Automatic delegation with `__getattr__`
`__getattr__` runs only when normal lookup fails, so it can forward unknown attributes to a wrapped object. Use it
sparingly: explicit methods are easier to read.
