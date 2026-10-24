### Has-a with delegation

```js
class Engine {
  constructor(horsepower) {
    this.horsepower = horsepower;
    this.running = false;
  }
  start() {
    this.running = true;
    return `${this.horsepower}hp engine started`;
  }
}

class Car {
  constructor(model, engine) {     // inject the dependency
    this.model = model;
    this.engine = engine;
  }
  start() {
    return `${this.model}: ${this.engine.start()}`;
  }
}
```

### Strategies are often just functions

```js
class PriceCalculator {
  constructor(discount = (price) => price) {
    this.discount = discount;
  }
  total(price) {
    return this.discount(price);
  }
}
new PriceCalculator((p) => p * 0.7).total(100);   // 70
```

### Object composition with spreads and mixins
JavaScript also lets you compose **plain objects** of behaviours:

```js
const canFly = { fly() { return `${this.name} flies`; } };
const canSwim = { swim() { return `${this.name} swims`; } };
const duck = Object.assign({ name: "Donald" }, canFly, canSwim);
```
