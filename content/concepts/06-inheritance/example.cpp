#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Animal {
public:
    explicit Animal(std::string name) : name_(std::move(name)) { std::cout << "  Animal part of " << name_ << " built\n"; }
    virtual ~Animal() = default;
    virtual std::string speak() const { return "..."; }
    virtual std::string describe() const { return name_ + " says " + speak(); }

protected:
    std::string name_;
};

class Dog : public Animal {
public:
    Dog(std::string name, std::string breed) : Animal(std::move(name)), breed_(std::move(breed)) {
        std::cout << "  Dog part built\n";
    }
    std::string speak() const override { return "Woof"; }
    std::string describe() const override { return Animal::describe() + " (a " + breed_ + ")"; }

private:
    std::string breed_;
};

class Puppy final : public Dog {
public:
    using Dog::Dog;                                    // inherit Dog's constructor
    std::string speak() const override { return "Yip"; }
};

int main() {
    std::vector<std::unique_ptr<Animal>> pets;
    std::cout << "building:\n";
    pets.push_back(std::make_unique<Animal>("Generic"));
    pets.push_back(std::make_unique<Dog>("Rex", "beagle"));
    pets.push_back(std::make_unique<Puppy>("Bit", "corgi"));

    std::cout << "describing:\n";
    for (const auto& p : pets) std::cout << "  " << p->describe() << "\n";

    Animal* a = pets[2].get();
    if (auto* d = dynamic_cast<Dog*>(a)) std::cout << "a Puppy is-a Dog: " << d->speak() << "\n";
    std::cout << "sizeof(Animal)=" << sizeof(Animal) << " sizeof(Dog)=" << sizeof(Dog) << " (Dog contains an Animal + breed_)\n";
}
