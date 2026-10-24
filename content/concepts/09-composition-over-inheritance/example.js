class FlyWithWings {
  fly() {
    return "flaps its wings";
  }
}
class CannotFly {
  fly() {
    return "can't fly";
  }
}
class RocketPowered {
  fly() {
    return "zooms on a rocket 🚀";
  }
}

class Duck {
  constructor(name, flyBehaviour, quack) {
    this.name = name;
    this.flyBehaviour = flyBehaviour; // HAS-A
    this.quack = quack; // a strategy can be a function
  }
  performFly() {
    return `${this.name} ${this.flyBehaviour.fly()}`; // delegate
  }
}

const mallard = new Duck("Mallard", new FlyWithWings(), () => "Quack!");
const rubber = new Duck("Rubber duck", new CannotFly(), () => "Squeak!");
for (const duck of [mallard, rubber]) console.log(duck.performFly(), "and says", duck.quack());
rubber.flyBehaviour = new RocketPowered();
console.log("after the upgrade:", rubber.performFly());

// Composing plain objects of behaviour
const canSwim = { swim() { return `${this.name} swims`; } };
const canDive = { dive() { return `${this.name} dives`; } };
const penguin = Object.assign({ name: "Pingu" }, canSwim, canDive);
console.log(penguin.swim(), "|", penguin.dive());

class Car {
  constructor(model, engine) {
    this.model = model;
    this.engine = engine;
  }
  start() {
    return `${this.model}: ${this.engine.start()}`;
  }
}
console.log(new Car("Roadster", { start: () => "300hp engine started" }).start());
console.log(new Car("Test car", { start: () => "pretend engine started" }).start());
