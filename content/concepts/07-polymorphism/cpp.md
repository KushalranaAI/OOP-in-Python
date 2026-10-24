### Virtual functions and the vtable

```c++
class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;              // pure virtual (see chapter 8)
};
class Circle : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return 3.14159 * r_ * r_; }
private:
    double r_;
};

std::vector<std::unique_ptr<Shape>> shapes;       // pointers/references - never values!
for (const auto& s : shapes) total += s->area();  // dynamic dispatch through the vtable
```

**Under the hood**: each class with virtual functions gets one **vtable** (an array of function pointers). Every
object gets a hidden **vptr** pointing to its class's vtable. `s->area()` becomes "load vptr → load slot for area → call".
That's one extra indirection, usually negligible.

### Static vs dynamic binding
- Non-virtual call: decided at **compile time** from the declared type.
- Virtual call through a **pointer or reference**: decided at **run time** from the object's real type.
- Virtual call on a **value** (`Shape s = circle;` isn't even allowed for abstract classes). With concrete bases, copying slices the object.

### Compile-time polymorphism

```c++
template <typename T>
double total_area(const std::vector<T>& shapes) {   // works for any T with .area() - checked at compile time
    double sum = 0;
    for (const auto& s : shapes) sum += s.area();
    return sum;
}
void print(int x);           // overloads: chosen by argument types
void print(const std::string& s);
```
