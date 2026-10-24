### Operators are just functions with funny names

```c++
class Money {
public:
    explicit Money(long cents) : cents_(cents) {}
    Money operator+(const Money& other) const { return Money(cents_ + other.cents_); }   // new object
    Money& operator+=(const Money& other) { cents_ += other.cents_; return *this; }     // in place
    bool operator==(const Money&) const = default;                                      // C++20
    auto operator<=>(const Money&) const = default;                                     // <, <=, >, >= (C++20)
    friend std::ostream& operator<<(std::ostream& os, const Money& m) {
        return os << m.cents_ / 100 << "." << (m.cents_ % 100 < 10 ? "0" : "") << m.cents_ % 100;
    }
private:
    long cents_;
};
```

- Implement `+` in terms of `+=` to avoid duplicating logic.
- `operator[]`, `operator()` (function objects), `operator bool` (make it `explicit`) and conversions are all available.
- Make your class work with range-for by providing `begin()` and `end()` that return iterators.
- Things you **can't** overload: `.`, `::`, `?:`, `sizeof`.

### Special member functions
The constructor, destructor, copy and move constructors, and copy and move assignment (`operator=`) are C++'s most
important "special methods". Follow the **rule of zero**: let `std::string`, `std::vector` and smart pointers manage
resources, and the compiler-generated versions are correct.
