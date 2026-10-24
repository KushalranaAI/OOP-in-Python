### Well-known symbols and conversion hooks

JavaScript doesn't let you overload `+` or `==`, but the language calls these hooks:

```js
class Money {
  constructor(cents, currency = "USD") {
    this.cents = cents;
    this.currency = currency;
  }
  toString() {                                  // `${m}`, String(m)
    return `${(this.cents / 100).toFixed(2)} ${this.currency}`;
  }
  [Symbol.toPrimitive](hint) {                  // full control: hint is "number", "string" or "default"
    return hint === "number" ? this.cents : this.toString();
  }
  toJSON() {                                    // JSON.stringify(m)
    return { cents: this.cents, currency: this.currency };
  }
  equals(other) {                               // == can't be overloaded: write a method
    return other instanceof Money && other.cents === this.cents && other.currency === this.currency;
  }
  add(other) {
    return new Money(this.cents + other.cents, this.currency);
  }
}
```

### Making objects iterable

```js
class Range {
  constructor(start, end) { this.start = start; this.end = end; }
  *[Symbol.iterator]() {                        // a generator method
    for (let i = this.start; i < this.end; i++) yield i;
  }
}
[...new Range(1, 4)];   // [1, 2, 3]
```

Other hooks: `Symbol.asyncIterator` (for await), `Symbol.hasInstance` (instanceof), and `Proxy` (intercept property
access entirely).
