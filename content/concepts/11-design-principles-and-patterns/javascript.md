### Strategy, Observer and Factory in JavaScript

```js
// Strategy: functions are first-class
const pricing = { regular: (t) => t, sale: (t) => t * 0.8 };
const checkout = (total, strategy) => strategy(total);

// Observer: the browser's own EventTarget works outside the DOM too
class Store extends EventTarget {
  sell(item) {
    this.dispatchEvent(new CustomEvent("sold", { detail: item }));
  }
}
const store = new Store();
store.addEventListener("sold", (e) => console.log("log:", e.detail));

// Factory: a map from names to classes
const shapes = { circle: Circle, square: Square };
const createShape = (kind, ...args) => new shapes[kind](...args);
```

### Singletons
An ES **module** is evaluated once, so `export const config = {...}` is shared by every importer. Freeze value objects
with `Object.freeze` to make them immutable.
