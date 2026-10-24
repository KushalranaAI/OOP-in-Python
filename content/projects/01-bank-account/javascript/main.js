// Bank account system - classes, encapsulation, inheritance and composition.
// ── Step 1: Transaction, errors and a money helper ──
function money(cents) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

class InsufficientFunds extends Error {
  constructor(balance, requested) {
    super(`balance ${money(balance)}, tried to withdraw ${money(requested)}`);
    this.name = "InsufficientFunds";
  }
}

class LimitReached extends Error {}

class Transaction {
  constructor(kind, amount, balanceAfter) {
    this.kind = kind;
    this.amount = amount;
    this.balanceAfter = balanceAfter;
    Object.freeze(this);
  }
}

// ── Step 2: Account - the balance is private ──
class Account {
  #balance = 0;
  #history = [];

  constructor(owner, number) {
    this.owner = owner;
    this.number = number;
  }

  get balance() {
    return this.#balance;
  }

  deposit(amount) {
    if (amount <= 0) throw new RangeError("deposit must be positive");
    this.apply("deposit", amount);
  }

  withdraw(amount) {
    if (amount <= 0) throw new RangeError("withdrawal must be positive");
    this.checkWithdraw(amount);
    this.apply("withdraw", -amount);
  }

  checkWithdraw(amount) {
    if (amount > this.#balance) throw new InsufficientFunds(this.#balance, amount);
  }

  apply(kind, signedAmount) {
    this.#balance += signedAmount;
    this.#history.push(new Transaction(kind, signedAmount, this.#balance));
  }

  statement() {
    const lines = [`#${this.number} ${this.owner} (${this.constructor.name})`];
    for (const t of this.#history) {
      lines.push(`  ${t.kind.padEnd(9)}${money(t.amount).padStart(9)}${money(t.balanceAfter).padStart(10)}`);
    }
    return lines.join("\n");
  }
}

// ── Step 3: SavingsAccount - inherit, override, extend ──
class SavingsAccount extends Account {
  static MAX_WITHDRAWALS = 3;
  #rateBp;
  #withdrawals = 0;

  constructor(owner, number, rateBp = 150) {
    super(owner, number);
    this.#rateBp = rateBp;
  }

  checkWithdraw(amount) {
    super.checkWithdraw(amount);
    if (this.#withdrawals >= SavingsAccount.MAX_WITHDRAWALS) {
      throw new LimitReached(`limit of ${SavingsAccount.MAX_WITHDRAWALS} withdrawals reached`);
    }
  }

  withdraw(amount) {
    super.withdraw(amount);
    this.#withdrawals += 1;
  }

  addInterest() {
    const interest = Math.floor((this.balance * this.#rateBp) / 10_000);
    if (interest > 0) this.apply("interest", interest);
    return interest;
  }
}

// ── Step 4: Bank - owns accounts (composition) ──
class Bank {
  #accounts = new Map();
  #nextNumber = 1001;

  constructor(name) {
    this.name = name;
  }

  open(owner, savings = false) {
    const Kind = savings ? SavingsAccount : Account;
    const account = new Kind(owner, this.#nextNumber++);
    this.#accounts.set(account.number, account);
    return account;
  }

  transfer(source, target, amount) {
    this.#accounts.get(source).withdraw(amount);
    this.#accounts.get(target).deposit(amount);
  }

  total() {
    return [...this.#accounts.values()].reduce((sum, a) => sum + a.balance, 0);
  }
}

// ── Step 5: Try it out ──
const bank = new Bank("OOP Bank");
const ada = bank.open("Ada");
const bob = bank.open("Bob", true);

ada.deposit(50_000);
bob.deposit(120_000);
ada.withdraw(12_550);
for (const attempt of [() => ada.withdraw(1_000_000), () => ada.deposit(-5)]) {
  try {
    attempt();
  } catch (e) {
    console.log("rejected:", e.message);
  }
}

console.log("interest paid:", money(bob.addInterest()));
for (let i = 0; i < 3; i++) bob.withdraw(1_000);
try {
  bob.withdraw(1_000);
} catch (e) {
  if (!(e instanceof LimitReached)) throw e;
  console.log("rejected:", e.message);
}

bank.transfer(ada.number, bob.number, 7_450);
console.log(ada.statement());
console.log(bob.statement());
console.log("bank total:", money(bank.total()));
