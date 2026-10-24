### Everything is dynamically dispatched

```py
class Shape:
    def area(self) -> float:
        raise NotImplementedError

class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self): return 3.14159 * self.r ** 2

class Square(Shape):
    def __init__(self, s): self.s = s
    def area(self): return self.s ** 2

shapes: list[Shape] = [Circle(1), Square(2)]
print(sum(s.area() for s in shapes))
```

### Duck typing: no base class required

```py
class Hexagon:                   # doesn't inherit from Shape
    def __init__(self, s): self.s = s
    def area(self): return 3 * 3 ** 0.5 / 2 * self.s ** 2

shapes.append(Hexagon(1))        # still works: it has .area()
```

`typing.Protocol` lets type checkers verify duck typing statically (chapter 8).

### Overloading-like behaviour
Python has no overloading; the last `def` wins. Use default arguments, `*args`, or `functools.singledispatch`, which
dispatches on the type of the first argument.

### Operator polymorphism
`+` works on ints, strings and lists because each type implements `__add__` differently (chapter 10).
