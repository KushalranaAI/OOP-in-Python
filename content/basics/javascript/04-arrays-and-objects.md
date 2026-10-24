---
title: Arrays, objects, Map and Set
order: 4
summary: Array methods, object literals, destructuring and spread, and the Map/Set collections.
---

```javascript
const scores = [72, 90, 85];
scores.push(60);
const sorted = [...scores].sort((a, b) => b - a);       // copy, then sort (sort mutates!)
console.log(sorted, sorted[0], sorted.at(-1), sorted.slice(1, 3));
console.log(scores.includes(90), scores.indexOf(85), scores.find((s) => s > 80));

// Object literal: string keys -> values
const book = { title: "Clean Code", year: 2008, tags: ["craft"] };
book.pages = 464;
const { title, year } = book;                          // destructuring
console.log(title, year, Object.keys(book));
const updated = { ...book, year: 2009 };               // spread: copy + override
console.log(updated.year, book.year);

// Shorthand methods - objects can carry behaviour
const counter = {
  count: 0,
  increment() {
    this.count += 1;
    return this.count;
  },
};
counter.increment();
console.log("count:", counter.increment());

// Map: any key type, keeps insertion order
const stock = new Map([["apple", 5], ["kiwi", 0]]);
stock.set("fig", 12);
for (const [item, qty] of stock) console.log(`  ${item.padEnd(6)}${qty}`);

// Set: unique values
const tags = new Set(["js", "oop", "js"]);
console.log(tags.size, tags.has("oop"), [...tags]);

console.log(JSON.stringify(book), JSON.parse('{"a": [1, 2]}').a);
```

Objects and arrays are passed **by reference**: a function that receives `book` can change it. Spreads copy only one
level deep (a **shallow** copy). Use `structuredClone(obj)` for a deep copy.
