---
title: Control flow and equality
order: 2
summary: if/else, switch, the different for loops, while, and why you should use === instead of ==.
---

```javascript
const temperature = 23;
if (temperature > 30) {
  console.log("hot");
} else if (temperature > 15) {
  console.log("pleasant");
} else {
  console.log("cold");
}
console.log(temperature > 0 ? "above zero" : "freezing");

for (let i = 0; i < 3; i++) console.log("round", i);
for (const fruit of ["apple", "kiwi"]) console.log("of:", fruit);              // values
for (const key in { a: 1, b: 2 }) console.log("in:", key);                     // keys
["x", "y"].forEach((item, index) => console.log("forEach:", index, item));

let n = 10;
while (n !== 1) {
  n = n % 2 === 0 ? n / 2 : 3 * n + 1;
  if (n === 4) {
    console.log("reached 4");
    break;
  }
}

const command = "q";
switch (command) {
  case "n":
    console.log("north");
    break;
  case "q":
    console.log("quit");
    break;
  default:
    console.log("unknown");
}
```

## Equality: always use `===`

```javascript
console.log(0 == "", 1 == "1", null == undefined);       // true true true  - loose: converts types
console.log(0 === "", 1 === "1", null === undefined);    // false false false - strict
console.log([1] === [1]);                                // false: different objects
const user = null;
console.log(user?.name ?? "anonymous");                  // optional chaining + nullish coalescing
```

**Falsy** values: `false`, `0`, `""`, `null`, `undefined`, `NaN`. Everything else, including `[]` and `{}`, is truthy.
