### Public inheritance and constructor chaining

```c++
class Animal {
public:
    explicit Animal(std::string name) : name_(std::move(name)) {}
    virtual ~Animal() = default;                       // ALWAYS virtual in a base class
    virtual std::string speak() const { return "..."; }
    std::string describe() const { return name_ + " says " + speak(); }
protected:
    std::string name_;
};

class Dog : public Animal {
public:
    Dog(std::string name, std::string breed) : Animal(std::move(name)), breed_(std::move(breed)) {}
    std::string speak() const override { return "Woof"; }    // override is checked by the compiler
private:
    std::string breed_;
};
```

- The base part is constructed **first** (in the initialiser list), then the members, then the constructor body. Destruction runs in reverse.
- Use `public` inheritance for is-a. (`private` inheritance means "implemented-in-terms-of", which is rare.)
- A base class used polymorphically needs a **virtual destructor**, or `delete` through a base pointer won't run the derived destructor.
- `override` makes the compiler check that you really override something (it catches typos and const mismatches).
- `using Animal::Animal;` inherits the parent's constructors.

### Memory layout
A `Dog` object **contains** an `Animal` sub-object at its start, followed by `Dog`'s own members, plus a hidden
**vptr** if the class has virtual functions.

### Multiple inheritance
Allowed, but two parents with the same base give the derived class **two copies** of that base unless you write
`class B : virtual public A`. Ambiguous member names are compile errors you fix with `B::hello()`.
