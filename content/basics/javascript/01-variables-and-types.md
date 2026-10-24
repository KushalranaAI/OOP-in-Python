---
title: Running JavaScript, variables and types
order: 1
summary: Running JS with Node.js or a browser, let vs const, primitive types and objects, and typeof.
---

## Where JavaScript runs
- **Browser**: open the developer console (F12) or include `<script src="app.js">`.
- **Node.js**: save `app.js` and run `node app.js`. This course's ▶ Run buttons use Node.

```javascript
console.log("Hello, OOP!");
const name = "Ada";
let age = 36;
age += 1;
console.log(`${name} is ${age} years old`);   // template literal
```

## let, const (and why not var)
- `const`: the name can't be reassigned. Use it by default.
- `let`: the name can be reassigned.
- `var`: old, function-scoped and confusing. Avoid it.

`const` does **not** freeze the object: `const list = []; list.push(1)` is fine.

## Types

```javascript
const values = [42, 3.14, true, "hi", null, undefined, 10n, Symbol("id"), [1, 2], { a: 1 }, () => 1];
for (const v of values) {
  console.log(String(v).padEnd(12), typeof v);
}
console.log(7 / 2, Math.floor(7 / 2), 7 % 2, 2 ** 10);
console.log(Number("12") + 1, "12" + 1, parseFloat("2.5kg"));
```

All numbers are 64-bit floats (`number`); `bigint` (`10n`) is for huge integers. Everything that isn't a primitive is
an **object**: arrays, functions, dates, and your own class instances.

## Variables hold references to objects

```javascript
const a = [1, 2, 3];
const b = a;               // same array
b.push(4);
console.log(a, a === b);
const c = [...a];          // a shallow copy
c.push(5);
console.log(a, c);
```
