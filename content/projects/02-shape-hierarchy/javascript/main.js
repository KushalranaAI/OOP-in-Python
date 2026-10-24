// Shape hierarchy - abstraction, polymorphism, "operators" and a factory.
// ── Step 1: The abstract base class ──
class Shape {
  constructor() {
    if (new.target === Shape) throw new TypeError("Shape is abstract");
  }
  area() {
    throw new Error(`${this.name} must implement area()`);
  }
  perimeter() {
    throw new Error(`${this.name} must implement perimeter()`);
  }
  scaled(factor) {
    throw new Error(`${this.name} must implement scaled()`);
  }
  get name() {
    return this.constructor.name;
  }
  describe() {
    return `${this.name.padEnd(9)} area ${this.area().toFixed(2).padStart(8)}   perimeter ${this.perimeter().toFixed(2).padStart(7)}`;
  }
  static compare(a, b) {
    return a.area() - b.area(); // JS has no operator overloading: use a comparator
  }
}

// ── Step 2: Concrete shapes ──
function requirePositive(sizes) {
  for (const [label, value] of Object.entries(sizes)) {
    if (!(value > 0)) throw new RangeError(`${label} must be positive, got ${value}`);
  }
}

class Circle extends Shape {
  constructor(radius) {
    super();
    requirePositive({ radius });
    this.radius = radius;
  }
  area() {
    return Math.PI * this.radius ** 2;
  }
  perimeter() {
    return 2 * Math.PI * this.radius;
  }
  scaled(k) {
    return new Circle(this.radius * k);
  }
}

class Rectangle extends Shape {
  constructor(width, height) {
    super();
    requirePositive({ width, height });
    this.width = width;
    this.height = height;
  }
  area() {
    return this.width * this.height;
  }
  perimeter() {
    return 2 * (this.width + this.height);
  }
  scaled(k) {
    return new Rectangle(this.width * k, this.height * k);
  }
}

class Square extends Rectangle {
  constructor(side) {
    super(side, side);
  }
  scaled(k) {
    return new Square(this.width * k);
  }
}

class Triangle extends Shape {
  constructor(a, b, c) {
    super();
    requirePositive({ a, b, c });
    if (a + b <= c || a + c <= b || b + c <= a) throw new RangeError(`sides ${a}, ${b}, ${c} can't form a triangle`);
    this.sides = [a, b, c];
  }
  area() {
    const [a, b, c] = this.sides;
    const s = (a + b + c) / 2;
    return Math.sqrt(s * (s - a) * (s - b) * (s - c)); // Heron's formula
  }
  perimeter() {
    return this.sides.reduce((sum, side) => sum + side, 0);
  }
  scaled(k) {
    return new Triangle(...this.sides.map((side) => side * k));
  }
}

// ── Step 3: A factory for creating shapes from text ──
class ShapeFactory {
  static #registry = { circle: Circle, rect: Rectangle, square: Square, triangle: Triangle };

  static parse(text) {
    const [kind, ...rest] = text.split(/\s+/);
    const Kind = ShapeFactory.#registry[kind];
    if (!Kind) throw new RangeError(`unknown shape '${kind}'`);
    if (rest.length !== Kind.length) throw new RangeError(`'${kind}' needs ${Kind.length} number(s)`);
    return new Kind(...rest.map(Number)); // Kind.length = number of constructor parameters
  }
}

// ── Step 4: The canvas - polymorphism pays off ──
class Canvas {
  #shapes = [];
  add(shape) {
    this.#shapes.push(shape);
  }
  get size() {
    return this.#shapes.length;
  }
  totalArea() {
    return this.#shapes.reduce((sum, s) => sum + s.area(), 0);
  }
  largest() {
    return this.#shapes.reduce((best, s) => (Shape.compare(s, best) > 0 ? s : best));
  }
  listing() {
    return [...this.#shapes].sort(Shape.compare).map((s) => s.describe());
  }
}

// ── Step 5: Try it out ──
const canvas = new Canvas();
for (const line of ["circle 1.5", "rect 3 4", "square 2.5", "triangle 3 4 5", "triangle 1 2 8", "hexagon 2"]) {
  try {
    canvas.add(ShapeFactory.parse(line));
  } catch (e) {
    console.log(`skipped '${line}': ${e.message}`);
  }
}
try {
  new Shape();
} catch {
  console.log("Shape itself is abstract");
}

const bigSquare = ShapeFactory.parse("square 2.5").scaled(2);
canvas.add(bigSquare);
console.log(`scaled square: ${bigSquare.describe()}`);
console.log(`is a Square a Rectangle? ${bigSquare instanceof Rectangle ? "True" : "False"}`);

console.log(`\n${canvas.size} shapes, smallest first:`);
for (const row of canvas.listing()) console.log(" ", row);
console.log(`total area ${canvas.totalArea().toFixed(2)}, largest is the ${canvas.largest().name}`);
