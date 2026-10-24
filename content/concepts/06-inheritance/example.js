class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return "...";
  }
  describe() {
    return `${this.name} says ${this.speak()}`;
  }
  static create(name) {
    return new this(name);              // `this` is the class it's called on
  }
}

class Dog extends Animal {
  constructor(name, breed = "mixed") {
    super(name);
    this.breed = breed;
  }
  speak() {
    return "Woof";
  }
  describe() {
    return `${super.describe()} (a ${this.breed})`;
  }
}

class Puppy extends Dog {
  speak() {
    return "Yip";
  }
}

for (const pet of [new Animal("Generic"), new Dog("Rex", "beagle"), new Puppy("Bit", "corgi")]) {
  console.log(pet.describe());
}

const chain = [];
for (let p = Object.getPrototypeOf(new Puppy("x")); p; p = Object.getPrototypeOf(p)) chain.push(p.constructor.name);
console.log("prototype chain:", chain.join(" → "));
console.log("static methods are inherited:", Dog.create("Static").describe());
console.log("instanceof Animal:", new Puppy("p") instanceof Animal);

try {
  new (class Broken extends Animal { constructor() { this.x = 1; super("b"); } })();
} catch (e) {
  console.log("this before super():", e.constructor.name);
}
