### Fields, methods and statics

```js
class Counter {
  static total = 0;          // on the class itself: Counter.total
  count = 0;                 // class field: created on every instance
  increment() {              // on Counter.prototype, shared
    this.count++;
    Counter.total++;
  }
  static resetTotal() {      // called as Counter.resetTotal()
    Counter.total = 0;
  }
}
```

### `this` is decided by the call, not the definition

| Call | `this` |
|---|---|
| `a.increment()` | `a` |
| `const f = a.increment; f()` | `undefined` (classes are strict mode) |
| `a.increment.bind(a)()` | `a` (fixed forever) |
| `setTimeout(a.increment, 0)` | `undefined`, the classic callback bug |
| `button.addEventListener("click", a.increment)` | the button element! |

### Fixes for callbacks

```js
setTimeout(() => a.increment(), 0);       // arrow function: call it *through* a
class Clicker {
  count = 0;
  handleClick = () => { this.count++; }   // arrow-function field: `this` captured per instance
}
```

Arrow functions have **no own `this`**. They use the `this` of the code around them, which makes them perfect for
callbacks and wrong for prototype methods that should be shared.
