// Parking lot - inheritance, polymorphic rules, composition and the strategy pattern.
// ── Step 1: Sizes and vehicles ──
class ParkingError extends Error {}

const Size = Object.freeze({ SMALL: 1, MEDIUM: 2, LARGE: 3 });
const sizeName = (size) => Object.keys(Size).find((k) => Size[k] === size).toLowerCase();

class Vehicle {
  constructor(plate) {
    if (new.target === Vehicle) throw new TypeError("Vehicle is abstract");
    this.plate = plate;
  }
  size() {
    throw new Error("not implemented");
  }
  isElectric() {
    return false;
  }
}

class Motorcycle extends Vehicle {
  size() {
    return Size.SMALL;
  }
}

class Car extends Vehicle {
  size() {
    return Size.MEDIUM;
  }
}

class ElectricCar extends Car {
  isElectric() {
    return true;
  }
}

class Van extends Vehicle {
  size() {
    return Size.LARGE;
  }
}

// ── Step 2: Spots - each kind knows its own rules ──
class Spot {
  constructor(id, size) {
    this.id = id;
    this.size = size;
    this.occupant = null;
  }
  isFree() {
    return this.occupant === null;
  }
  accepts(vehicle) {
    return vehicle.size() <= this.size;
  }
  score(vehicle) {
    return 10 * this.size;
  }
}

class ChargingSpot extends Spot {
  accepts(vehicle) {
    return vehicle.isElectric() && super.accepts(vehicle);
  }
  score(vehicle) {
    return 0;
  }
}

// ── Step 3: Levels and tickets ──
class Level {
  constructor(number, spots) {
    this.number = number;
    this.spots = spots;
  }
  bestSpot(vehicle) {
    let best = null;
    for (const s of this.spots) {
      if (s.isFree() && s.accepts(vehicle) && (!best || s.score(vehicle) < best.score(vehicle))) best = s;
    }
    return best;
  }
  toString() {
    return `Level ${this.number}: ` + this.spots.map((s) => `${s.id} ${s.occupant ? s.occupant.plate : "free"}`).join(" | ");
  }
}

class Ticket {
  constructor(number, vehicle, level, spot, entryMinute) {
    Object.assign(this, { number, vehicle, level, spot, entryMinute });
    Object.freeze(this);
  }
}

// ── Step 4: Pricing strategies ──
class HourlyPricing {
  static RATES = { [Size.SMALL]: 100, [Size.MEDIUM]: 200, [Size.LARGE]: 400 };
  constructor(freeMinutes = 15) {
    this.freeMinutes = freeMinutes;
  }
  fee(minutes, vehicle) {
    if (minutes <= this.freeMinutes) return 0;
    return Math.ceil(minutes / 60) * HourlyPricing.RATES[vehicle.size()];
  }
}

class FlatPricing {
  constructor(amount) {
    this.amount = amount;
  }
  fee() {
    return this.amount;
  }
}

// ── Step 5: The ParkingLot - a simple front door ──
const money = (cents) => `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;

class ParkingLot {
  #levels;
  #pricing;
  #tickets = new Map();
  #nextTicket = 1;

  constructor(levels, pricing) {
    this.#levels = levels;
    this.#pricing = pricing;
  }
  setPricing(pricing) {
    this.#pricing = pricing;
  }
  park(vehicle, now) {
    if (this.#tickets.has(vehicle.plate)) throw new ParkingError(`${vehicle.plate} is already parked`);
    for (const level of this.#levels) {
      const spot = level.bestSpot(vehicle);
      if (spot) {
        spot.occupant = vehicle;
        const ticket = new Ticket(this.#nextTicket++, vehicle, level, spot, now);
        this.#tickets.set(vehicle.plate, ticket);
        return ticket;
      }
    }
    throw new ParkingError(`no space for ${vehicle.plate} (${sizeName(vehicle.size())})`);
  }
  leave(plate, now) {
    const ticket = this.#tickets.get(plate);
    if (!ticket) throw new ParkingError(`no ticket for ${plate}`);
    this.#tickets.delete(plate);
    ticket.spot.occupant = null;
    return this.#pricing.fee(now - ticket.entryMinute, ticket.vehicle);
  }
  report() {
    return this.#levels.map(String).join("\n");
  }
}

// ── Step 6: Try it out ──
const lot = new ParkingLot(
  [
    new Level(1, [new Spot("S1", Size.SMALL), new Spot("M1", Size.MEDIUM), new Spot("M2", Size.MEDIUM),
                  new ChargingSpot("C1", Size.MEDIUM), new Spot("L1", Size.LARGE)]),
    new Level(2, [new Spot("M3", Size.MEDIUM), new Spot("L2", Size.LARGE)]),
  ],
  new HourlyPricing(),
);
const arrivals = [new Motorcycle("MOTO-1"), new Car("CAR-1"), new ElectricCar("EV-1"), new Car("CAR-2"),
                  new Van("VAN-1"), new Car("CAR-3"), new Car("CAR-4"), new Motorcycle("MOTO-2")];
for (const vehicle of arrivals) {
  try {
    const t = lot.park(vehicle, 0);
    console.log(`ticket #${t.number}: ${vehicle.plate.padEnd(7)} -> level ${t.level.number}, spot ${t.spot.id}`);
  } catch (e) {
    console.log("refused:", e.message);
  }
}
console.log(lot.report());

for (const [plate, minute] of [["MOTO-1", 50], ["CAR-1", 130], ["EV-1", 10]]) {
  console.log(`${plate} leaves after ${minute} min, pays ${money(lot.leave(plate, minute))}`);
}
lot.setPricing(new FlatPricing(500));
console.log("-- event pricing: flat 5.00 --");
console.log(`VAN-1 leaves after 300 min, pays ${money(lot.leave("VAN-1", 300))}`);

const t = lot.park(new Motorcycle("MOTO-2"), 300);
console.log(`ticket #${t.number}: MOTO-2  -> level ${t.level.number}, spot ${t.spot.id}`);
for (const action of [() => lot.park(new Car("CAR-2"), 301), () => lot.leave("NOPE-0", 301)]) {
  try {
    action();
  } catch (e) {
    if (!(e instanceof ParkingError)) throw e;
    console.log("refused:", e.message);
  }
}
console.log(lot.report());
