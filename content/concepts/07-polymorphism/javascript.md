### Dispatch through the prototype chain

```js
class Shape {
  area() { throw new Error("not implemented"); }
}
class Circle extends Shape {
  constructor(r) { super(); this.r = r; }
  area() { return Math.PI * this.r ** 2; }
}
class Square extends Shape {
  constructor(s) { super(); this.s = s; }
  area() { return this.s ** 2; }
}

const shapes = [new Circle(1), new Square(2)];
console.log(shapes.reduce((sum, s) => sum + s.area(), 0));
```

`s.area()` looks for `area` on `s`, then `s`'s prototype, then that prototype's prototype… The first match runs.

### Duck typing, even with plain objects

```js
shapes.push({ area: () => 10 });     // no class at all - still works
```

### No overloading
A second method with the same name **replaces** the first. Inspect arguments instead:

```js
function area(shapeOrWidth, height) {
  return typeof shapeOrWidth === "number" ? shapeOrWidth * height : shapeOrWidth.area();
}
```

### Well-known symbols
Built-in operations dispatch on special methods: `Symbol.iterator` (for…of), `toString()`/`Symbol.toPrimitive`
(string conversion), `toJSON` (JSON.stringify). Implement them and your objects work with the language's own features.
