### Members and `this`

```c++
class Counter {
public:
    void increment() { ++count; ++total; }        // means ++this->count
    int get() const { return count; }             // const: promises not to modify *this
    static int total;                              // declared here…
    static void reset_total() { total = 0; }      // no 'this' inside
private:
    int count = 0;
};
int Counter::total = 0;                            // …defined once in a .cpp file (or `static inline int total = 0;` in C++17)
```

- Inside a member function, `count` means `this->count`, and `this` has type `Counter*` (or `const Counter*` in a const method).
- A `const` method can be called on a `const Counter&`. A non-const method can't, and the compiler rejects it.
- `static` members exist **once**, without any object: `Counter::total`, `Counter::reset_total()`.

### Under the hood
A member function is compiled into an ordinary function with an extra first parameter:

```c++
// what you write                  // roughly what the compiler generates
void Counter::increment();         void Counter_increment(Counter* this);
a.increment();                     Counter_increment(&a);
```

That's why methods take **no space** inside objects: `sizeof(Counter)` is just `sizeof(int)`.

### Const-correctness tip
Mark every method that doesn't change the object as `const`. It documents intent and lets the method be used through
`const` references, the normal way to pass objects you don't modify (`void print(const Counter& c)`).
