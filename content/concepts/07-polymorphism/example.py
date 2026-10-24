import math
from functools import singledispatch


class Shape:
    def area(self) -> float:
        raise NotImplementedError

    def __repr__(self) -> str:
        return f"{type(self).__name__}(area={self.area():.2f})"


class Circle(Shape):
    def __init__(self, r: float) -> None:
        self.r = r

    def area(self) -> float:
        return math.pi * self.r ** 2


class Rectangle(Shape):
    def __init__(self, w: float, h: float) -> None:
        self.w, self.h = w, h

    def area(self) -> float:
        return self.w * self.h


class Hexagon:                                  # NOT a Shape subclass - duck typing
    def __init__(self, s: float) -> None:
        self.s = s

    def area(self) -> float:
        return 3 * math.sqrt(3) / 2 * self.s ** 2


shapes = [Circle(1), Rectangle(2, 3), Hexagon(1)]
for s in shapes:
    print(f"{type(s).__name__:<10} area = {s.area():.3f}")
print("total:", round(sum(s.area() for s in shapes), 3))


@singledispatch
def describe(x) -> str:
    return f"something: {x!r}"


@describe.register
def _(x: int) -> str:
    return f"an int: {x}"


@describe.register
def _(x: list) -> str:
    return f"a list of {len(x)}"


print(describe(42), "|", describe([1, 2]), "|", describe(3.5))
print("operators are polymorphic too:", 1 + 2, "a" + "b", [1] + [2])
