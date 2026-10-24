class Shape {
  area() {
    throw new Error(`${this.constructor.name} must implement area()`);
  }
  toString() {
    return `${this.constructor.name}(area=${this.area().toFixed(2)})`;
  }
}

class Circle extends Shape {
  constructor(r) {
    super();
    this.r = r;
  }
  area() {
    return Math.PI * this.r ** 2;
  }
}

class Rectangle extends Shape {
  constructor(w, h) {
    super();
    this.w = w;
    this.h = h;
  }
  area() {
    return this.w * this.h;
  }
}

const hexagon = { name: "Hexagon", area: () => ((3 * Math.sqrt(3)) / 2) * 1 ** 2 }; // a plain object - duck typing

const shapes = [new Circle(1), new Rectangle(2, 3), hexagon];
for (const s of shapes) {
  console.log(`${(s.constructor === Object ? s.name : s.constructor.name).padEnd(10)} area = ${s.area().toFixed(3)}`);
}
console.log("total:", shapes.reduce((sum, s) => sum + s.area(), 0).toFixed(3));
console.log("toString dispatch:", `${new Circle(2)}`);

class Lazy extends Shape {}
try {
  new Lazy().area();
} catch (e) {
  console.log(e.message);
}
console.log("operators are polymorphic too:", 1 + 2, "a" + "b", [1].concat([2]));
