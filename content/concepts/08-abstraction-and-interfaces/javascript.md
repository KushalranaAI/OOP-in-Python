### Abstract classes by convention

JavaScript has no `abstract` keyword. Two common patterns:

```js
class Shape {
  constructor() {
    if (new.target === Shape) throw new TypeError("Shape is abstract");   // block direct instantiation
  }
  area() {
    throw new Error(`${this.constructor.name} must implement area()`);    // force overriding
  }
  describe() {
    return `${this.constructor.name} with area ${this.area().toFixed(2)}`;
  }
}
```

`new.target` is the class that `new` was called on. It equals `Shape` only for `new Shape()`, not for subclasses.

### Interfaces are implicit
Any object with a `send(message)` method *is* a notifier. Document the contract and check it where it matters:

```js
function alert(notifier) {
  if (typeof notifier?.send !== "function") throw new TypeError("expected a notifier with send()");
  notifier.send("server down");
}
alert({ send: (m) => console.log("sms:", m) });   // a plain object is fine
```

**TypeScript** adds real `interface` and `abstract class` declarations that are checked at compile time and erased in
the JavaScript output.
