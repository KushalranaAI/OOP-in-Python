class Temperature {
  static readingsTaken = 0;

  constructor(celsius) {
    this.celsius = celsius;
    Temperature.readingsTaken++;
  }

  get fahrenheit() {                  // getter: read like a property
    return (this.celsius * 9) / 5 + 32;
  }

  static fromFahrenheit(f) {
    return new Temperature(((f - 32) * 5) / 9);
  }

  static isFreezing(celsius) {
    return celsius <= 0;
  }

  describe() {
    return `${this.celsius.toFixed(1)} °C`;
  }
}

const a = new Temperature(21.5);
const b = Temperature.fromFahrenheit(212);
console.log(`a = ${a.celsius} °C = ${a.fahrenheit} °F`);
console.log(`b = ${b.describe()}`);
console.log("freezing at -3?", Temperature.isFreezing(-3));
console.log("readings taken:", Temperature.readingsTaken);

const describe = a.describe;          // detached from a
try {
  describe();
} catch (e) {
  console.log("detached call fails:", e.constructor.name);
}
console.log("bound call works:", a.describe.bind(a)());
console.log("arrow wrapper works:", (() => a.describe())());
