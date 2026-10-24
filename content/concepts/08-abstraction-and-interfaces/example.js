class Shape {
  constructor() {
    if (new.target === Shape) throw new TypeError("Shape is abstract - extend it");
  }
  area() {
    throw new Error(`${this.constructor.name} must implement area()`);
  }
  describe() {
    return `${this.constructor.name} with area ${this.area().toFixed(2)}`;
  }
}

class Square extends Shape {
  constructor(side) {
    super();
    this.side = side;
  }
  area() {
    return this.side ** 2;
  }
}

class HalfDone extends Shape {}

for (const make of [() => new Shape(), () => new HalfDone().describe()]) {
  try {
    make();
  } catch (e) {
    console.log(`${e.constructor.name}: ${e.message}`);
  }
}
console.log(new Square(3).describe());

class OrderService {
  constructor(notifier) {
    if (typeof notifier?.send !== "function") throw new TypeError("notifier needs send()");
    this.notifier = notifier;
  }
  placeOrder(item) {
    this.notifier.send(`order placed: ${item}`);
  }
}

new OrderService({ send: (m) => console.log(`  email: ${m}`) }).placeOrder("book");
const fake = { sent: [], send(m) { this.sent.push(m); } };
new OrderService(fake).placeOrder("pen");
console.log("the fake recorded:", fake.sent);
