// Procedural vs object-oriented: the same bank account, twice.

// --- procedural: data and functions are separate
let balance = 100;
const withdraw = (current, amount) => current - amount;
balance = withdraw(balance, 30);
balance = -9999; // nothing stops this
console.log("procedural balance:", balance);

// --- object-oriented: #private fields can't be touched from outside the class
class Account {
  #balance;
  constructor(owner, balance = 0) {
    this.owner = owner;
    this.#balance = balance;
  }
  get balance() {
    return this.#balance;
  }
  withdraw(amount) {
    if (amount > this.#balance) throw new Error("insufficient funds");
    this.#balance -= amount;
  }
}

const acct = new Account("Ada", 100);
acct.withdraw(30);
try {
  acct.withdraw(500);
} catch (error) {
  console.log("refused:", error.message);
}
console.log(acct.owner, "has", acct.balance);
