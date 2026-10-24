### Defining and creating

```c++
class Dog {
public:
    Dog(std::string name, int age) : name_(std::move(name)), age_(age) {}   // constructor
    std::string bark() const { return name_ + " says woof"; }
private:
    std::string name_;
    int age_;
};

Dog rex("Rex", 3);                       // on the stack: destroyed automatically at '}'
auto pip = std::make_unique<Dog>("Pip", 1);   // on the heap, owned by a smart pointer
```

### Under the hood
- The compiler knows the exact **layout**: `sizeof(Dog)` is the size of a `std::string` plus an `int` (plus padding). Methods take **no space in the object**; they're ordinary functions with a hidden `this` parameter.
- `Dog rex(...)` reserves the bytes **in the current stack frame** and runs the constructor on them. No heap, no pointer.
- `new Dog(...)` allocates on the **heap** and returns a pointer, and **you** must `delete` it. Prefer `std::make_unique`, which deletes for you.
- The **member initialiser list** (`: name_(…), age_(…)`) constructs members directly. Assigning in the body would first default-construct and then overwrite them.

### Common mistakes
- `Dog d();` declares a *function*, not an object (the "most vexing parse"). Write `Dog d;` or `Dog d{};`.
- Copying when you meant to share: `Dog b = a;` copies the whole object.
- `new` without `delete` leaks memory, and `delete` twice crashes. Use smart pointers.
