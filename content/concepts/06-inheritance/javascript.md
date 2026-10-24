### `extends` and `super`

```js
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return "...";
  }
  describe() {
    return `${this.name} says ${this.speak()}`;    // calls the overriding method
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);              // MUST come before any use of `this`
    this.breed = breed;
  }
  speak() {
    return "Woof";
  }
  describe() {
    return super.describe() + " (a " + this.breed + ")";   // extend the parent's method
  }
}
```

### Under the hood: two prototype chains
`extends` links **two** chains:

- `Dog.prototype.[[Prototype]] === Animal.prototype`, so instances find `Animal`'s methods.
- `Dog.[[Prototype]] === Animal`, so **static** methods are inherited too.

### Only one parent
There's no multiple inheritance. Share behaviour with **mixins**, functions that take a class and return a subclass:

```js
const Serializable = (Base) => class extends Base {
  toJSON() { return { ...this }; }
};
class SmartDog extends Serializable(Dog) {}
```

You can extend built-ins too: `class Stack extends Array {}`.
