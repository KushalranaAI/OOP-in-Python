---
title: Strings and errors
order: 5
summary: String methods, template literals, and throwing/catching errors - including custom Error classes.
---

```javascript
const s = "  Object Oriented Programming  ";
const clean = s.trim();
console.log(clean.toLowerCase(), "|", clean.split(" "), "|", clean.split(" ").join("-"));
console.log(clean.startsWith("Object"), clean.includes("Oriented"), clean.replaceAll("o", "0"));
console.log((3.14159).toFixed(2), String(42).padStart(6), (1234567).toLocaleString("en-US"));

function parseAge(text) {
  const age = Number(text);
  if (Number.isNaN(age)) throw new TypeError(`not a number: ${text}`);
  if (age < 0) throw new RangeError(`age can't be negative: ${age}`);
  return age;
}

for (const raw of ["36", "-1", "abc"]) {
  try {
    console.log("parsed", parseAge(raw));
  } catch (error) {
    console.log(`${error.name}: ${error.message}`);
  } finally {
    // always runs
  }
}

class InsufficientFunds extends Error {
  constructor(needed) {
    super(`need ${needed.toFixed(2)} more`);
    this.name = "InsufficientFunds";
    this.needed = needed;
  }
}
try {
  throw new InsufficientFunds(12.5);
} catch (e) {
  console.log(e instanceof InsufficientFunds, e instanceof Error, e.message, e.needed);
}
```

You can `throw` any value, but throw `Error` objects (or subclasses): they carry a stack trace. Strings are
immutable, so every method returns a new string.
