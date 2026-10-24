### Subclassing, super() and overriding

```py
class Animal:
    def __init__(self, name: str):
        self.name = name

    def speak(self) -> str:
        return "..."

    def describe(self) -> str:
        return f"{self.name} says {self.speak()}"     # calls the OVERRIDDEN speak on subclasses

class Dog(Animal):
    def __init__(self, name: str, breed: str):
        super().__init__(name)                       # initialise the Animal part
        self.breed = breed

    def speak(self) -> str:                          # override
        return "Woof"
```

- `super()` doesn't mean "my parent". It means **"the next class in the MRO"**, which is what makes cooperative multiple inheritance work.
- Every class ultimately inherits from `object` (that's where `__repr__`, `__eq__` and friends come from).
- `Dog.__mro__` shows the exact lookup order; `isinstance(rex, Animal)` is `True`.

### Multiple inheritance and mixins

```py
class JsonMixin:
    def to_json(self) -> str:
        import json
        return json.dumps(self.__dict__)

class Dog(JsonMixin, Animal):     # small "mixin" classes add one capability each
    ...
```

The MRO is computed with **C3 linearisation**: children before parents, and the order you list bases is kept.
