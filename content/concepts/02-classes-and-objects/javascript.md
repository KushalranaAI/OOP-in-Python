### Defining and creating

```js
class Dog {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  bark() {
    return `${this.name} says woof`;
  }
}

const rex = new Dog("Rex", 3);
```

### Under the hood: what `new` does
1. Create a new empty object.
2. Set its **[[Prototype]]** to `Dog.prototype` (where `bark` lives).
3. Call the constructor with `this` = the new object.
4. Return the object (unless the constructor returns a different object).

`class Dog` creates a **function** named `Dog` (`typeof Dog === "function"`) plus `Dog.prototype`. Methods are stored
**once** on the prototype and shared, so they're not copied into each object.

### Without classes
The same pattern existed before ES2015, and you'll still see it in older code:

```js
function OldDog(name) { this.name = name; }
OldDog.prototype.bark = function () { return this.name + " says woof"; };
```

### Common mistakes
- Forgetting `new`: `Dog("Rex")` throws *"Class constructor Dog cannot be invoked without 'new'"*.
- `const rex` only stops you re-assigning the *variable*. The object's properties can still change (use `Object.freeze` for that).
