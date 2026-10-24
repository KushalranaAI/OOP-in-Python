class Money {
  constructor(cents, currency = "USD") {
    this.cents = cents;
    this.currency = currency;
  }
  toString() {
    return `${(this.cents / 100).toFixed(2)} ${this.currency}`;
  }
  [Symbol.toPrimitive](hint) {
    return hint === "number" ? this.cents : this.toString();
  }
  toJSON() {
    return { cents: this.cents, currency: this.currency };
  }
  equals(other) {
    return other instanceof Money && other.cents === this.cents && other.currency === this.currency;
  }
  add(other) {
    if (other.currency !== this.currency) throw new Error(`can't mix ${this.currency} and ${other.currency}`);
    return new Money(this.cents + other.cents, this.currency);
  }
  static compare(a, b) {
    return a.cents - b.cents;
  }
}

class Wallet {
  #items = [];
  add(...money) {
    this.#items.push(...money);
    return this;
  }
  get size() {
    return this.#items.length;
  }
  *[Symbol.iterator]() {
    yield* this.#items;
  }
}

const coffee = new Money(350);
const cake = new Money(425);
console.log(`template literal: ${coffee}`);
console.log("coffee.add(cake) =", String(coffee.add(cake)));
console.log("+coffee (number hint):", +coffee, "| coffee < cake:", coffee < cake);
console.log("== compares references:", new Money(350) == coffee, "| equals():", new Money(350).equals(coffee));
console.log("JSON:", JSON.stringify(coffee));

const wallet = new Wallet().add(coffee, cake, new Money(100));
const total = [...wallet].reduce((sum, m) => sum.add(m), new Money(0));
console.log("size:", wallet.size, "| total:", String(total));
console.log("sorted:", [...wallet].sort(Money.compare).map(String).join(", "));
try {
  coffee.add(new Money(100, "EUR"));
} catch (e) {
  console.log("error:", e.message);
}
