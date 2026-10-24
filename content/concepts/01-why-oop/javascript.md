JavaScript objects are **dynamic bags of properties**. You can create one without any class at all:

```js
const account = { balance: 100, deposit(amount) { this.balance += amount; } };
account.deposit(50);
```

The `class` keyword (ES2015) gives familiar syntax, but underneath it's built on **prototypes**: objects that other
objects delegate to (chapter 2 shows exactly how). Functions are objects too, and almost everything in the browser
(the DOM, `fetch` responses, `Map`, `Date`) is an object with methods.
