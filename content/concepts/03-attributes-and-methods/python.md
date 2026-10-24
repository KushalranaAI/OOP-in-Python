### Instance vs class attributes

```py
class Counter:
    total = 0                          # class attribute

    def __init__(self):
        self.count = 0                 # instance attribute

    def increment(self):
        self.count += 1
        Counter.total += 1             # or type(self).total += 1
```

**The classic trap:** `self.total += 1` *reads* the class attribute but then *writes* a **new instance attribute**
called `total`, so the shared value never changes. Always assign class data through the class.

### Three kinds of methods

```py
class Temperature:
    def __init__(self, celsius): self.celsius = celsius

    def fahrenheit(self):                   # instance method: needs an object
        return self.celsius * 9 / 5 + 32

    @classmethod
    def from_fahrenheit(cls, f):            # class method: gets the class - perfect for alternative constructors
        return cls((f - 32) * 5 / 9)

    @staticmethod
    def is_freezing(celsius):               # static method: just a function grouped with the class
        return celsius <= 0
```

### `self` is just a name
It's a convention, not a keyword. The first parameter receives the instance whatever you call it. Bound methods remember
their object: `m = rex.bark; m()` works, because Python stored `rex` inside the bound method. (Compare with JavaScript!)

### Properties: methods that look like attributes

```py
@property
def fahrenheit(self) -> float:
    return self.celsius * 9 / 5 + 32       # use as t.fahrenheit (no parentheses)
```
