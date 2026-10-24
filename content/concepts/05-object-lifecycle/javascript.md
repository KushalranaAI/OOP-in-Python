### Constructors and garbage collection

```js
class Resource {
  constructor(name) {
    this.name = name;
    console.log("open", name);
  }
  close() {
    console.log("close", this.name);
  }
}
```

There are **no destructors**. Memory is reclaimed by a **tracing garbage collector** some time after an object becomes
**unreachable** from the roots (global variables, the stack, closures). You can't know or control when.

### Deterministic clean-up is your job

```js
const r = new Resource("db");
try {
  // use r
} finally {
  r.close();                 // runs even if an exception was thrown
}
```

Newer runtimes add **explicit resource management**: a `[Symbol.dispose]()` method plus `using r = …`, which closes `r`
at the end of the block, much like Python's `with` and C++'s RAII.

### Copies

```js
const shallow = { ...original };            // new object, same nested objects
const deep = structuredClone(original);     // deep copy (no functions or class prototypes)
```

### Memory-leak patterns
Objects stay alive as long as something reaches them: a forgotten event listener, a growing cache `Map`, a closure in a
timer. `WeakMap`/`WeakRef` hold objects *without* keeping them alive.
