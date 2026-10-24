"""Shape hierarchy - abstraction, polymorphism, operator overloading and a factory."""
# ── Step 1: The abstract base class ──
from __future__ import annotations

import math
from abc import ABC, abstractmethod


class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    @abstractmethod
    def perimeter(self) -> float: ...

    @abstractmethod
    def scaled(self, factor: float) -> Shape: ...

    @property
    def name(self) -> str:
        return type(self).__name__

    def describe(self) -> str:
        return f"{self.name:<9} area {self.area():8.2f}   perimeter {self.perimeter():7.2f}"

    def __lt__(self, other: Shape) -> bool:
        return self.area() < other.area()

    def __mul__(self, factor: float) -> Shape:
        return self.scaled(factor)


# ── Step 2: Concrete shapes ──
def _positive(**sizes: float) -> None:
    for label, value in sizes.items():
        if value <= 0:
            raise ValueError(f"{label} must be positive, got {value:g}")


class Circle(Shape):
    def __init__(self, radius: float) -> None:
        _positive(radius=radius)
        self.radius = radius

    def area(self) -> float:
        return math.pi * self.radius ** 2

    def perimeter(self) -> float:
        return 2 * math.pi * self.radius

    def scaled(self, factor: float) -> Circle:
        return Circle(self.radius * factor)


class Rectangle(Shape):
    def __init__(self, width: float, height: float) -> None:
        _positive(width=width, height=height)
        self.width, self.height = width, height

    def area(self) -> float:
        return self.width * self.height

    def perimeter(self) -> float:
        return 2 * (self.width + self.height)

    def scaled(self, factor: float) -> Rectangle:
        return Rectangle(self.width * factor, self.height * factor)


class Square(Rectangle):
    def __init__(self, side: float) -> None:
        super().__init__(side, side)

    def scaled(self, factor: float) -> Square:
        return Square(self.width * factor)


class Triangle(Shape):
    def __init__(self, a: float, b: float, c: float) -> None:
        _positive(a=a, b=b, c=c)
        if a + b <= c or a + c <= b or b + c <= a:
            raise ValueError(f"sides {a:g}, {b:g}, {c:g} can't form a triangle")
        self.sides = (a, b, c)

    def area(self) -> float:
        a, b, c = self.sides
        s = (a + b + c) / 2
        return math.sqrt(s * (s - a) * (s - b) * (s - c))     # Heron's formula

    def perimeter(self) -> float:
        return sum(self.sides)

    def scaled(self, factor: float) -> Triangle:
        return Triangle(*(side * factor for side in self.sides))


# ── Step 3: A factory for creating shapes from text ──
class ShapeFactory:
    _registry: dict[str, tuple[type[Shape], int]] = {
        "circle": (Circle, 1),
        "rect": (Rectangle, 2),
        "square": (Square, 1),
        "triangle": (Triangle, 3),
    }

    @classmethod
    def parse(cls, text: str) -> Shape:
        kind, *numbers = text.split()
        if kind not in cls._registry:
            raise ValueError(f"unknown shape '{kind}'")
        shape_class, arity = cls._registry[kind]
        if len(numbers) != arity:
            raise ValueError(f"'{kind}' needs {arity} number(s)")
        return shape_class(*map(float, numbers))


# ── Step 4: The canvas - polymorphism pays off ──
class Canvas:
    def __init__(self) -> None:
        self._shapes: list[Shape] = []

    def add(self, shape: Shape) -> None:
        self._shapes.append(shape)

    def __len__(self) -> int:
        return len(self._shapes)

    def total_area(self) -> float:
        return sum(shape.area() for shape in self._shapes)

    def largest(self) -> Shape:
        return max(self._shapes)                  # uses Shape.__lt__

    def listing(self) -> list[str]:
        return [shape.describe() for shape in sorted(self._shapes)]


# ── Step 5: Try it out ──
def main() -> None:
    canvas = Canvas()
    for line in ["circle 1.5", "rect 3 4", "square 2.5", "triangle 3 4 5", "triangle 1 2 8", "hexagon 2"]:
        try:
            canvas.add(ShapeFactory.parse(line))
        except ValueError as error:
            print(f"skipped '{line}': {error}")
    try:
        Shape()
    except TypeError:
        print("Shape itself is abstract")

    big_square = ShapeFactory.parse("square 2.5") * 2
    canvas.add(big_square)
    print(f"scaled square: {big_square.describe()}")
    print(f"is a Square a Rectangle? {isinstance(big_square, Rectangle)}")

    print(f"\n{len(canvas)} shapes, smallest first:")
    for row in canvas.listing():
        print(" ", row)
    print(f"total area {canvas.total_area():.2f}, largest is the {canvas.largest().name}")


if __name__ == "__main__":
    main()
