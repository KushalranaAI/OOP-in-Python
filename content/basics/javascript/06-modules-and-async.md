---
title: Modules and asynchronous code
order: 6
summary: ES modules (import/export), then callbacks, Promises and async/await - how JavaScript waits without blocking.
---

## Modules
Each file is a module. Export what other files may use:

```js
// shapes.js
export class Circle { /* ... */ }
export const PI = 3.14159;
export default function area(shape) { return shape.area(); }

// main.js
import area, { Circle, PI } from "./shapes.js";
```

In Node, use the `.mjs` extension or `"type": "module"` in `package.json`. In the browser, use
`<script type="module">`. A module is evaluated **once**; every importer shares its exports.

## Asynchronous code
JavaScript runs on one thread with an **event loop**. Slow work (timers, network, files) doesn't block. You give it
a function to call later, or get back a **Promise**.

```javascript
const wait = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

function fetchUser(id) {
  return wait(50, { id, name: id === 1 ? "Ada" : "Bob" });   // pretend network call
}

async function main() {
  console.log("start");
  const user = await fetchUser(1);                 // pause this function, not the program
  console.log("got", user.name);

  const both = await Promise.all([fetchUser(1), fetchUser(2)]);   // run in parallel
  console.log("both:", both.map((u) => u.name).join(" & "));

  try {
    await Promise.reject(new Error("server down"));
  } catch (e) {
    console.log("caught:", e.message);
  }
}

main().then(() => console.log("done"));
console.log("this line runs before 'got Ada' - main() is waiting");
```

`async` functions always return a Promise, and `await` unwraps one. Methods can be `async` too, which you'll see in
the projects.

You now know enough JavaScript for the OOP chapters. Start with **Why OOP?**
