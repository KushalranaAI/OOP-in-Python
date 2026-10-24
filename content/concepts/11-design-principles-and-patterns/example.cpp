#include <functional>
#include <iostream>
#include <map>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

// Strategy
class PricingStrategy {
public:
    virtual ~PricingStrategy() = default;
    virtual double price(double total) const = 0;
    virtual std::string name() const = 0;
};
class Regular : public PricingStrategy {
public:
    double price(double total) const override { return total; }
    std::string name() const override { return "Regular"; }
};
class PercentOff : public PricingStrategy {
public:
    explicit PercentOff(double percent) : percent_(percent) {}
    double price(double total) const override { return total * (1 - percent_ / 100); }
    std::string name() const override { return "PercentOff"; }
private:
    double percent_;
};

// Observer
class EventBus {
public:
    using Handler = std::function<void(double, double)>;
    void subscribe(Handler h) { handlers_.push_back(std::move(h)); }
    void publish(double total, double charged) const { for (const auto& h : handlers_) h(total, charged); }
private:
    std::vector<Handler> handlers_;
};

class Checkout {
public:
    Checkout(const PricingStrategy& pricing, const EventBus& bus) : pricing_(pricing), bus_(bus) {}
    double pay(double total) const {
        double charged = pricing_.price(total);
        bus_.publish(total, charged);
        return charged;
    }
private:
    const PricingStrategy& pricing_;
    const EventBus& bus_;
};

// Factory
class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual std::string name() const = 0;
};
class Circle : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return 3.14159 * r_ * r_; }
    std::string name() const override { return "Circle"; }
private:
    double r_;
};
class Square : public Shape {
public:
    explicit Square(double s) : s_(s) {}
    double area() const override { return s_ * s_; }
    std::string name() const override { return "Square"; }
private:
    double s_;
};

std::unique_ptr<Shape> make_shape(const std::string& kind, double size) {
    static const std::map<std::string, std::function<std::unique_ptr<Shape>(double)>> registry{
        {"circle", [](double s) { return std::make_unique<Circle>(s); }},
        {"square", [](double s) { return std::make_unique<Square>(s); }},
    };
    auto it = registry.find(kind);
    if (it == registry.end()) throw std::invalid_argument("unknown shape '" + kind + "'");
    return it->second(size);
}

int main() {
    EventBus bus;
    std::vector<std::string> audit;
    bus.subscribe([](double total, double charged) { std::cout << "  receipt: charged " << charged << " (was " << total << ")\n"; });
    bus.subscribe([&audit](double, double charged) { audit.push_back("paid " + std::to_string(charged)); });

    Regular regular;
    PercentOff sale(20);
    for (const PricingStrategy* s : {static_cast<const PricingStrategy*>(&regular), static_cast<const PricingStrategy*>(&sale)})
    {
        double charged = Checkout(*s, bus).pay(50.0);       // the receipt prints first
        std::cout << s->name() << " -> " << charged << "\n";
    }
    std::cout << "audit log entries: " << audit.size() << "\n";

    for (const std::string kind : {"circle", "square"}) {
        auto shape = make_shape(kind, 2);
        std::cout << "factory made a " << shape->name() << " with area " << shape->area() << "\n";
    }
    try {
        make_shape("hexagon", 1);
    } catch (const std::invalid_argument& e) {
        std::cout << "error: " << e.what() << "\n";
    }
}
