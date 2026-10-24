#include <iostream>

class Temperature {
public:
    explicit Temperature(double celsius) : celsius_(celsius) { ++readings_taken; }

    static Temperature from_fahrenheit(double f) { return Temperature((f - 32) * 5 / 9); }
    static bool is_freezing(double celsius) { return celsius <= 0; }

    double celsius() const { return celsius_; }                 // const: read-only
    double fahrenheit() const { return celsius_ * 9 / 5 + 32; }
    void warm_by(double degrees) { celsius_ += degrees; }       // non-const: changes *this

    static inline int readings_taken = 0;                       // one counter for the whole class

private:
    double celsius_;
};

void show(const Temperature& t) {                               // const reference: no copy, no changes
    std::cout << t.celsius() << " C = " << t.fahrenheit() << " F\n";
    // t.warm_by(1);   // error: passing 'const Temperature' as 'this' discards qualifiers
}

int main() {
    Temperature a(21.5);
    Temperature b = Temperature::from_fahrenheit(212);
    show(a);
    show(b);
    a.warm_by(2.5);
    show(a);
    std::cout << std::boolalpha << "freezing at -3? " << Temperature::is_freezing(-3) << "\n";
    std::cout << "readings taken: " << Temperature::readings_taken << "\n";
    std::cout << "sizeof(Temperature) = " << sizeof(Temperature) << " (just the double)\n";
}
