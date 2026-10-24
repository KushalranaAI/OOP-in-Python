### `#private` fields and methods (ES2022)

```js
class Account {
  #balance = 0;                       // truly private: only code inside this class body can touch it
  #history = [];

  constructor(owner) {
    this.owner = owner;               // public
  }
  get balance() {                     // read-only from outside (no setter)
    return this.#balance;
  }
  deposit(amount) {
    if (amount <= 0) throw new RangeError("deposit must be positive");
    this.#balance += amount;
    this.#log(`deposit ${amount}`);
  }
  #log(line) {                        // private method
    this.#history.push(line);
  }
}
```

- `obj.#balance` outside the class is a **SyntaxError**: the program won't even load.
- Private names don't show up in `Object.keys`, `JSON.stringify` or `for…in`.
- Subclasses **can't** see the parent's `#fields`. There is no "protected" in JavaScript, so `_name` is the convention.
- `#balance in obj` checks whether an object has that private field (a "brand check").

### Before `#`: closures
The classic way to get privacy is to keep data in a closure that only the returned methods can see:

```js
function makeCounter() {
  let count = 0;                      // invisible to the outside world
  return { increment: () => ++count, get value() { return count; } };
}
```
