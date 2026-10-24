---
title: Shape hierarchy and canvas
order: 2
icon: 🔷
level: Beginner
summary: An abstract Shape with circles, rectangles, squares and triangles. Polymorphic area and perimeter, operators to compare and scale, a factory that parses text, and a canvas that holds them.
concepts: [06-inheritance, 07-polymorphism, 08-abstraction-and-interfaces, 10-special-methods-and-operator-overloading, 11-design-principles-and-patterns]
requirements:
  - Shape is abstract and can't be created directly; every shape has area(), perimeter() and a name
  - Circle, Rectangle, Square and Triangle validate their sizes (positive, valid triangle)
  - Shapes print nicely, compare by area (<) and can be scaled by a factor, giving a new shape
  - "A factory turns text like \"rect 3 4\" into the right object and reports unknown kinds"
  - "A Canvas holds any shapes and reports the total area, the largest shape and a sorted listing, without knowing the concrete classes"
design: |
  classDiagram
    class Shape {
      <<abstract>>
      +area()*
      +perimeter()*
      +scaled(k)*
      +name()
      +describe()
    }
    Shape <|-- Circle
    Shape <|-- Rectangle
    Rectangle <|-- Square
    Shape <|-- Triangle
    class Canvas {
      -shapes
      +add(shape)
      +total_area()
      +largest()
    }
    Canvas o-- Shape
    class ShapeFactory {
      +parse(text) Shape
    }
    ShapeFactory ..> Shape : creates
steps:
  - title: The abstract base class
    body: |
      Decide what **every** shape can do, and write that down as an abstract class. `area`, `perimeter` and
      `scaled` are **abstract**: each shape must provide its own. `describe` is **concrete**: it's written once in the
      base class and calls the abstract methods, so it automatically works for every future shape.

      Comparison by area also lives in the base class: `<` (`__lt__`, `operator<`, a static `compare`).
  - title: Concrete shapes
    body: |
      Each subclass stores its own data, **validates it in the constructor** (an invalid shape can never exist) and
      implements the abstract methods.

      `Square` inherits from `Rectangle`. That's safe here because shapes are **immutable**: there's no `set_width` that
      could break a square (the classic Liskov trap). Triangle uses Heron's formula and rejects impossible sides.
  - title: A factory for creating shapes from text
    body: |
      Code that reads user input shouldn't be full of `if kind == "circle"` checks. A **factory** keeps a registry
      mapping names to constructors, in one place. Adding a hexagon later means one new class plus one registry line.
  - title: The canvas - polymorphism pays off
    body: |
      `Canvas` holds a list of `Shape`s and never asks which concrete class each one is. `total_area`, `largest` and
      `listing` work through the abstract interface only. That's the **open/closed principle** in action.

      In C++ the canvas owns its shapes through `std::unique_ptr<Shape>`. Storing `Shape` by value would be impossible
      (it's abstract), and storing a concrete base by value would **slice** the objects.
  - title: Try it out
    body: |
      Parse a few shapes (including two bad ones), put them on a canvas, scale one and print the report.
---

## Extension ideas
1. Add a `RegularPolygon(sides, length)`. How many existing lines did you change?
2. Add `contains(x, y)` to every shape. Is it abstract or concrete in the base class?
3. Give shapes a position and add a `move(dx, dy)` that returns a new shape. Should moving be part of `Shape`?
4. Draw rectangles and squares as ASCII art with a `render()` method. What should circles do?
