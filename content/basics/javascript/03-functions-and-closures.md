---
title: Functions and closures
order: 3
summary: Function declarations, arrow functions, default and rest parameters, higher-order functions and closures.
---

```javascript
function greet(name, greeting = "Hello") {
  return `${greeting}, ${name}!`;
}
const square = (x) => x * x;                       // arrow function
const total = (...prices) => prices.reduce((sum, p) => sum + p, 0);   // rest parameter

console.log(greet("Ada"), greet("Bob", "Hi"));
console.log(square(4), total(10, 20, 5));

function minMax(numbers) {
  return [Math.min(...numbers), Math.max(...numbers)];  // spread an array into arguments
}
const [low, high] = minMax([4, 1, 9]);                 // destructuring
console.log(low, high);
```

## Functions are values

```javascript
const shout = (text) => text.toUpperCase() + "!";
const apply = (fn, value) => fn(value);
console.log(apply(shout, "hey"));
console.log(["kiwi", "fig", "banana"].sort((a, b) => a.length - b.length));
console.log([1, 2, 3].map((x) => x * 10).filter((x) => x > 10));

function makeCounter() {
  let count = 0;                // private to the closure
  return () => ++count;
}
const counter = makeCounter();
counter();
counter();
console.log("counter:", counter());
```

A **closure** is a function that remembers the variables of the scope it was created in. Before `class` existed,
closures were how JavaScript made private state, and they're still everywhere in callbacks.

## Arrow functions vs `function`
They differ in how they treat **`this`**. A regular function gets `this` from **how it's called**; an arrow function
takes `this` from the surrounding code. That matters a lot for methods (chapter 3).
