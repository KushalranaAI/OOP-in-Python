// Library catalogue - abstraction, polymorphism, composition and the observer pattern.
// ── Step 1: An error type and the abstract Item ──
class LibraryError extends Error {}

const money = (cents) => `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;

class Item {
  constructor(id, title, year) {
    if (new.target === Item) throw new TypeError("Item is abstract");
    this.id = id;
    this.title = title;
    this.year = year;
  }
  loanDays() {
    throw new Error("not implemented");
  }
  dailyFine() {
    throw new Error("not implemented");
  }
  canBorrow() {
    return true;
  }
  matches(query) {
    return this.title.toLowerCase().includes(query.toLowerCase());
  }
  toString() {
    return `[${this.id}] ${this.title} (${this.year}, ${this.constructor.name})`;
  }
}

// ── Step 2: Book, DVD and Magazine ──
class Book extends Item {
  constructor(id, title, year, author) {
    super(id, title, year);
    this.author = author;
  }
  loanDays() {
    return 21;
  }
  dailyFine() {
    return 25;
  }
  matches(query) {
    return super.matches(query) || this.author.toLowerCase().includes(query.toLowerCase());
  }
}

class Dvd extends Item {
  loanDays() {
    return 7;
  }
  dailyFine() {
    return 100;
  }
}

class Magazine extends Item {
  loanDays() {
    return 0;
  }
  dailyFine() {
    return 0;
  }
  canBorrow() {
    return false;
  }
}

// ── Step 3: Members and plans - composition instead of inheritance ──
class Plan {
  constructor(name, maxLoans, finePercent) {
    Object.assign(this, { name, maxLoans, finePercent }); // finePercent: 100 = full, 50 = half
    Object.freeze(this);
  }
}

const STANDARD = new Plan("Standard", 2, 100);
const STUDENT = new Plan("Student", 3, 50);

class Member {
  constructor(name, plan) {
    this.name = name;
    this.plan = plan; // has-a
  }
}

// ── Step 4: The Loan ──
class Loan {
  constructor(item, member, dueDay) {
    Object.assign(this, { item, member, dueDay });
  }
  daysLate(today) {
    return Math.max(0, today - this.dueDay);
  }
  fine(today) {
    return Math.floor((this.daysLate(today) * this.item.dailyFine() * this.member.plan.finePercent) / 100);
  }
}

// ── Step 5: The Library - encapsulation and the observer pattern ──
class Library {
  #items = new Map();
  #loans = new Map();
  #listeners = [];

  subscribe(listener) {
    this.#listeners.push(listener);
  }
  #publish(event, message) {
    for (const listener of this.#listeners) listener(event, message);
  }
  add(item) {
    this.#items.set(item.id, item);
  }
  loansOf(member) {
    return [...this.#loans.values()].filter((loan) => loan.member === member);
  }

  borrow(member, itemId, today) {
    const item = this.#items.get(itemId);
    if (!item) throw new LibraryError(`no item ${itemId}`);
    if (!item.canBorrow()) throw new LibraryError(`'${item.title}' is reference-only`);
    if (this.#loans.has(itemId)) throw new LibraryError(`'${item.title}' is already on loan`);
    if (this.loansOf(member).length >= member.plan.maxLoans) {
      throw new LibraryError(`${member.name} reached the ${member.plan.name} limit of ${member.plan.maxLoans}`);
    }
    const loan = new Loan(item, member, today + item.loanDays());
    this.#loans.set(itemId, loan);
    this.#publish("borrow", `${member.name} borrowed '${item.title}', due day ${loan.dueDay}`);
    return loan;
  }

  giveBack(itemId, today) {
    const loan = this.#loans.get(itemId);
    if (!loan) throw new LibraryError(`${itemId} is not on loan`);
    this.#loans.delete(itemId);
    const fine = loan.fine(today);
    const late = fine ? `, ${loan.daysLate(today)} days late, fine ${money(fine)}` : ", on time";
    this.#publish("return", `${loan.member.name} returned '${loan.item.title}'${late}`);
    return fine;
  }

  search(query) {
    return [...this.#items.values()].filter((item) => item.matches(query));
  }
  overdue(today) {
    return [...this.#loans.values()].filter((l) => l.daysLate(today)).sort((a, b) => a.dueDay - b.dueDay);
  }
}

// ── Step 6: Try it out ──
const library = new Library();
library.subscribe((event, message) => console.log(`  [${event}] ${message}`));
[
  new Book("B1", "Clean Code", 2008, "Robert C. Martin"),
  new Book("B2", "Design Patterns", 1994, "Gamma, Helm, Johnson, Vlissides"),
  new Dvd("D1", "The Matrix", 1999),
  new Magazine("M1", "Byte", 1985),
].forEach((item) => library.add(item));

const ada = new Member("Ada", STANDARD);
const linus = new Member("Linus", STUDENT);

console.log("day 1");
const requests = [[ada, "B1"], [ada, "D1"], [ada, "B2"], [linus, "M1"], [linus, "B2"], [linus, "B1"]];
for (const [member, itemId] of requests) {
  try {
    library.borrow(member, itemId, 1);
  } catch (e) {
    if (!(e instanceof LibraryError)) throw e;
    console.log(`  refused: ${e.message}`);
  }
}

console.log("day 12");
library.giveBack("D1", 12);
console.log("day 30");
library.giveBack("B2", 30);

for (const query of ["design", "martin", "matrix"]) {
  console.log(`search '${query}':`, library.search(query).map(String).join(", "));
}
for (const loan of library.overdue(30)) {
  console.log(`overdue: '${loan.item.title}' (${loan.member.name}), fine so far ${money(loan.fine(30))}`);
}
