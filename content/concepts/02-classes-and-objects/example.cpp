#include <iostream>
#include <memory>
#include <string>

class Dog {
public:
    Dog(std::string name, int age) : name_(std::move(name)), age_(age) {}
    std::string bark() const { return name_ + " says woof"; }
    void set_age(int age) { age_ = age; }
    int age() const { return age_; }

private:
    std::string name_;
    int age_;
};

int main() {
    Dog rex("Rex", 3);                              // stack
    auto pip = std::make_unique<Dog>("Pip", 1);     // heap, freed automatically

    Dog copy = rex;                                  // a COPY: a second, independent Dog
    Dog& alias = rex;                                // an ALIAS: another name for rex

    std::cout << rex.bark() << " | " << pip->bark() << "\n";
    copy.set_age(10);
    alias.set_age(4);
    std::cout << "rex.age = " << rex.age() << ", copy.age = " << copy.age() << "\n";
    std::cout << "sizeof(Dog) = " << sizeof(Dog) << " bytes (methods take no space)\n";
    std::cout << "&alias == &rex: " << std::boolalpha << (&alias == &rex) << "\n";
}
