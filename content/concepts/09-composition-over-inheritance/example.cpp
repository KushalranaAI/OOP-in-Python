#include <functional>
#include <iostream>
#include <memory>
#include <string>

class FlyBehaviour {
public:
    virtual ~FlyBehaviour() = default;
    virtual std::string fly() const = 0;
};
class FlyWithWings : public FlyBehaviour {
public:
    std::string fly() const override { return "flaps its wings"; }
};
class CannotFly : public FlyBehaviour {
public:
    std::string fly() const override { return "can't fly"; }
};
class RocketPowered : public FlyBehaviour {
public:
    std::string fly() const override { return "zooms on a rocket"; }
};

class Duck {
public:
    Duck(std::string name, std::unique_ptr<FlyBehaviour> fly, std::function<std::string()> quack)
        : name_(std::move(name)), fly_(std::move(fly)), quack_(std::move(quack)) {}
    std::string perform_fly() const { return name_ + " " + fly_->fly(); }
    std::string quack() const { return quack_(); }
    void set_fly(std::unique_ptr<FlyBehaviour> fly) { fly_ = std::move(fly); }  // old one is deleted

private:
    std::string name_;
    std::unique_ptr<FlyBehaviour> fly_;
    std::function<std::string()> quack_;
};

class Engine {
public:
    explicit Engine(int hp) : hp_(hp) { std::cout << "  Engine built\n"; }
    ~Engine() { std::cout << "  Engine destroyed\n"; }
    std::string start() const { return std::to_string(hp_) + "hp engine started"; }
private:
    int hp_;
};

class Car {
public:
    Car(std::string model, int hp) : model_(std::move(model)), engine_(hp) { std::cout << "  Car built\n"; }
    ~Car() { std::cout << "  Car destroyed\n"; }
    std::string start() const { return model_ + ": " + engine_.start(); }
private:
    std::string model_;
    Engine engine_;                       // value member: part of the Car's own memory
};

int main() {
    Duck mallard("Mallard", std::make_unique<FlyWithWings>(), [] { return std::string("Quack!"); });
    Duck rubber("Rubber duck", std::make_unique<CannotFly>(), [] { return std::string("Squeak!"); });
    std::cout << mallard.perform_fly() << " and says " << mallard.quack() << "\n";
    std::cout << rubber.perform_fly() << " and says " << rubber.quack() << "\n";
    rubber.set_fly(std::make_unique<RocketPowered>());
    std::cout << "after the upgrade: " << rubber.perform_fly() << "\n";

    std::cout << "composition lifetimes:\n";
    {
        Car car("Roadster", 300);
        std::cout << "  " << car.start() << "\n";
    }                                     // Car destructor runs, then its Engine member's
}
