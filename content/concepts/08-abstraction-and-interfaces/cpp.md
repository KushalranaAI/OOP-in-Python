### Pure virtual functions

```c++
class Shape {                          // abstract: has a pure virtual function
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;   // "= 0": no implementation here
    std::string describe() const { return "area " + std::to_string(area()); }
};

Shape s;                               // error: cannot declare variable 's' to be of abstract type 'Shape'
```

### Interfaces
C++ has no `interface` keyword. An interface is a class with **only** pure virtual functions and a virtual destructor:

```c++
class Notifier {
public:
    virtual ~Notifier() = default;
    virtual void send(const std::string& message) = 0;
};

class OrderService {
public:
    explicit OrderService(Notifier& n) : notifier_(n) {}       // depends on the abstraction
    void place_order() { notifier_.send("order placed"); }
private:
    Notifier& notifier_;
};
```

A class may implement **several** interfaces through multiple inheritance. That's the safe, common use of it.

### Compile-time interfaces (C++20 concepts)

```c++
template <typename T>
concept HasArea = requires(const T& t) { { t.area() } -> std::convertible_to<double>; };
double twice(const HasArea auto& s) { return 2 * s.area(); }
```
