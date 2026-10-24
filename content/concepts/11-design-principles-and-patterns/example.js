// Strategy
class Regular {
  price(total) {
    return total;
  }
}
class PercentOff {
  constructor(percent) {
    this.percent = percent;
  }
  price(total) {
    return Math.round(total * (1 - this.percent / 100) * 100) / 100;
  }
}

// Observer
class EventBus {
  #subscribers = new Map();
  subscribe(event, handler) {
    if (!this.#subscribers.has(event)) this.#subscribers.set(event, []);
    this.#subscribers.get(event).push(handler);
    return () => this.#subscribers.set(event, this.#subscribers.get(event).filter((h) => h !== handler)); // unsubscribe
  }
  publish(event, data) {
    for (const handler of this.#subscribers.get(event) ?? []) handler(data);
  }
}

class Checkout {
  constructor(pricing, bus) {
    this.pricing = pricing;
    this.bus = bus;
  }
  pay(total) {
    const charged = this.pricing.price(total);
    this.bus.publish("paid", { total, charged });
    return charged;
  }
}

// Factory
class Circle {
  constructor(r) {
    this.area = Math.round(Math.PI * r * r * 100) / 100;
  }
}
class Square {
  constructor(s) {
    this.area = s * s;
  }
}
const registry = { circle: Circle, square: Square };
function createShape(kind, size) {
  const Cls = registry[kind];
  if (!Cls) throw new Error(`unknown shape '${kind}'; known: ${Object.keys(registry)}`);
  return new Cls(size);
}

const bus = new EventBus();
const audit = [];
const stopReceipts = bus.subscribe("paid", (e) => console.log(`  receipt: charged ${e.charged} (was ${e.total})`));
bus.subscribe("paid", (e) => audit.push(`paid ${e.charged}`));

for (const strategy of [new Regular(), new PercentOff(20)]) {
  console.log(strategy.constructor.name, "→", new Checkout(strategy, bus).pay(50));
}
stopReceipts();
new Checkout(new Regular(), bus).pay(10);
console.log("audit log:", audit, "(receipts unsubscribed before the last payment)");

for (const kind of ["circle", "square"]) {
  const shape = createShape(kind, 2);
  console.log(`factory made a ${shape.constructor.name} with area ${shape.area}`);
}
try {
  createShape("hexagon", 1);
} catch (e) {
  console.log("error:", e.message);
}
console.log("frozen value object:", Object.isFrozen(Object.freeze({ x: 1 })));
