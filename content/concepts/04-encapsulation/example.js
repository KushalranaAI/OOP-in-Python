class Account {
  #balance = 0;
  #history = [];

  constructor(owner) {
    this.owner = owner;
  }
  get balance() {
    return this.#balance;
  }
  deposit(amount) {
    if (amount <= 0) throw new RangeError("deposit must be positive");
    this.#balance += amount;
    this.#history.push(`deposit ${amount}`);
  }
  static isAccount(obj) {
    return #balance in obj;           // "brand check"
  }
}

class Savings extends Account {
  // peek() { return this.#balance; }  // SyntaxError: Private field '#balance' must be declared in an enclosing class
}

const acct = new Savings("Ada");
acct.deposit(100);
console.log("balance:", acct.balance);

acct.balance = 1_000_000;             // no setter: silently ignored outside strict mode, TypeError inside classes/modules
console.log("still:", acct.balance);

try {
  acct.deposit(-5);
} catch (e) {
  console.log("rule enforced:", e.message);
}
console.log("JSON shows only public data:", JSON.stringify(acct));
console.log("is an Account?", Account.isAccount(acct), Account.isAccount({ owner: "fake" }));
