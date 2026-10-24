// Parking lot - inheritance, polymorphic rules, composition and the strategy pattern.
// ── Step 1: Sizes and vehicles ──
#include <functional>
#include <iomanip>
#include <iostream>
#include <map>
#include <memory>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

class ParkingError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;
};

enum class Size { Small = 1, Medium = 2, Large = 3 };

std::string size_name(Size s) {
    switch (s) {
        case Size::Small: return "small";
        case Size::Medium: return "medium";
        case Size::Large: return "large";
    }
    return "?";
}

class Vehicle {
public:
    explicit Vehicle(std::string plate) : plate_(std::move(plate)) {}
    virtual ~Vehicle() = default;
    virtual Size size() const = 0;
    virtual bool is_electric() const { return false; }
    const std::string& plate() const { return plate_; }

private:
    std::string plate_;
};

class Motorcycle : public Vehicle {
public:
    using Vehicle::Vehicle;
    Size size() const override { return Size::Small; }
};

class Car : public Vehicle {
public:
    using Vehicle::Vehicle;
    Size size() const override { return Size::Medium; }
};

class ElectricCar : public Car {
public:
    using Car::Car;
    bool is_electric() const override { return true; }
};

class Van : public Vehicle {
public:
    using Vehicle::Vehicle;
    Size size() const override { return Size::Large; }
};

// ── Step 2: Spots - each kind knows its own rules ──
class Spot {
public:
    Spot(std::string id, Size size) : id_(std::move(id)), size_(size) {}
    virtual ~Spot() = default;

    bool is_free() const { return occupant_ == nullptr; }
    virtual bool accepts(const Vehicle& v) const { return v.size() <= size_; }
    virtual int score(const Vehicle&) const { return 10 * static_cast<int>(size_); }

    const std::string& id() const { return id_; }
    const Vehicle* occupant() const { return occupant_; }
    void set_occupant(const Vehicle* v) { occupant_ = v; }

private:
    std::string id_;
    Size size_;
    const Vehicle* occupant_ = nullptr;     // non-owning: the driver owns the car
};

class ChargingSpot : public Spot {
public:
    using Spot::Spot;
    bool accepts(const Vehicle& v) const override { return v.is_electric() && Spot::accepts(v); }
    int score(const Vehicle&) const override { return 0; }
};

// ── Step 3: Levels and tickets ──
class Level {
public:
    Level(int number, std::vector<std::unique_ptr<Spot>> spots) : number_(number), spots_(std::move(spots)) {}

    Spot* best_spot(const Vehicle& v) const {
        Spot* best = nullptr;
        for (const auto& s : spots_)
            if (s->is_free() && s->accepts(v) && (!best || s->score(v) < best->score(v))) best = s.get();
        return best;
    }

    int number() const { return number_; }

    std::string str() const {
        std::string out = "Level " + std::to_string(number_) + ": ";
        for (std::size_t i = 0; i < spots_.size(); ++i)
            out += (i ? " | " : "") + spots_[i]->id() + " " + (spots_[i]->occupant() ? spots_[i]->occupant()->plate() : "free");
        return out;
    }

private:
    int number_;
    std::vector<std::unique_ptr<Spot>> spots_;
};

struct Ticket {
    int number;
    std::shared_ptr<const Vehicle> vehicle;
    const Level* level;
    Spot* spot;
    int entry_minute;
};

// ── Step 4: Pricing strategies ──
class PricingStrategy {
public:
    virtual ~PricingStrategy() = default;
    virtual int fee(int minutes, const Vehicle& v) const = 0;
};

class HourlyPricing : public PricingStrategy {
public:
    explicit HourlyPricing(int free_minutes = 15) : free_minutes_(free_minutes) {}
    int fee(int minutes, const Vehicle& v) const override {
        if (minutes <= free_minutes_) return 0;
        static const std::map<Size, int> rates{{Size::Small, 100}, {Size::Medium, 200}, {Size::Large, 400}};
        int hours = (minutes + 59) / 60;               // every started hour counts
        return hours * rates.at(v.size());
    }

private:
    int free_minutes_;
};

class FlatPricing : public PricingStrategy {
public:
    explicit FlatPricing(int amount) : amount_(amount) {}
    int fee(int, const Vehicle&) const override { return amount_; }

private:
    int amount_;
};

// ── Step 5: The ParkingLot - a simple front door ──
std::string money(int cents) {
    std::ostringstream out;
    out << cents / 100 << "." << std::setw(2) << std::setfill('0') << cents % 100;
    return out.str();
}

class ParkingLot {
public:
    ParkingLot(std::vector<Level> levels, std::unique_ptr<PricingStrategy> pricing)
        : levels_(std::move(levels)), pricing_(std::move(pricing)) {}

    void set_pricing(std::unique_ptr<PricingStrategy> pricing) { pricing_ = std::move(pricing); }

    const Ticket& park(std::shared_ptr<const Vehicle> v, int now) {
        if (tickets_.count(v->plate())) throw ParkingError(v->plate() + " is already parked");
        for (const Level& level : levels_) {
            if (Spot* spot = level.best_spot(*v)) {
                spot->set_occupant(v.get());
                const std::string plate = v->plate();
                return tickets_[plate] = Ticket{next_ticket_++, std::move(v), &level, spot, now};
            }
        }
        throw ParkingError("no space for " + v->plate() + " (" + size_name(v->size()) + ")");
    }

    int leave(const std::string& plate, int now) {
        auto it = tickets_.find(plate);
        if (it == tickets_.end()) throw ParkingError("no ticket for " + plate);
        Ticket ticket = it->second;
        tickets_.erase(it);
        ticket.spot->set_occupant(nullptr);
        return pricing_->fee(now - ticket.entry_minute, *ticket.vehicle);
    }

    std::string report() const {
        std::string out;
        for (std::size_t i = 0; i < levels_.size(); ++i) out += (i ? "\n" : "") + levels_[i].str();
        return out;
    }

private:
    std::vector<Level> levels_;
    std::unique_ptr<PricingStrategy> pricing_;
    std::map<std::string, Ticket> tickets_;
    int next_ticket_ = 1;
};

// ── Step 6: Try it out ──
int main() {
    std::vector<std::unique_ptr<Spot>> ground, upper;
    ground.push_back(std::make_unique<Spot>("S1", Size::Small));
    ground.push_back(std::make_unique<Spot>("M1", Size::Medium));
    ground.push_back(std::make_unique<Spot>("M2", Size::Medium));
    ground.push_back(std::make_unique<ChargingSpot>("C1", Size::Medium));
    ground.push_back(std::make_unique<Spot>("L1", Size::Large));
    upper.push_back(std::make_unique<Spot>("M3", Size::Medium));
    upper.push_back(std::make_unique<Spot>("L2", Size::Large));
    std::vector<Level> levels;
    levels.emplace_back(1, std::move(ground));
    levels.emplace_back(2, std::move(upper));
    ParkingLot lot(std::move(levels), std::make_unique<HourlyPricing>());

    std::vector<std::shared_ptr<const Vehicle>> arrivals{
        std::make_shared<Motorcycle>("MOTO-1"), std::make_shared<Car>("CAR-1"), std::make_shared<ElectricCar>("EV-1"),
        std::make_shared<Car>("CAR-2"), std::make_shared<Van>("VAN-1"), std::make_shared<Car>("CAR-3"),
        std::make_shared<Car>("CAR-4"), std::make_shared<Motorcycle>("MOTO-2")};
    for (const auto& v : arrivals) {
        try {
            const Ticket& t = lot.park(v, 0);
            std::cout << "ticket #" << t.number << ": " << std::left << std::setw(7) << v->plate() << std::right
                      << " -> level " << t.level->number() << ", spot " << t.spot->id() << "\n";
        } catch (const ParkingError& e) {
            std::cout << "refused: " << e.what() << "\n";
        }
    }
    std::cout << lot.report() << "\n";

    for (const auto& [plate, minute] : std::vector<std::pair<std::string, int>>{{"MOTO-1", 50}, {"CAR-1", 130}, {"EV-1", 10}})
        std::cout << plate << " leaves after " << minute << " min, pays " << money(lot.leave(plate, minute)) << "\n";
    lot.set_pricing(std::make_unique<FlatPricing>(500));
    std::cout << "-- event pricing: flat 5.00 --\n";
    std::cout << "VAN-1 leaves after 300 min, pays " << money(lot.leave("VAN-1", 300)) << "\n";

    const Ticket& t = lot.park(std::make_shared<Motorcycle>("MOTO-2"), 300);
    std::cout << "ticket #" << t.number << ": MOTO-2  -> level " << t.level->number() << ", spot " << t.spot->id() << "\n";
    std::vector<std::function<void()>> actions{[&] { lot.park(std::make_shared<Car>("CAR-2"), 301); },
                                               [&] { lot.leave("NOPE-0", 301); }};
    for (const auto& action : actions) {
        try {
            action();
        } catch (const ParkingError& e) {
            std::cout << "refused: " << e.what() << "\n";
        }
    }
    std::cout << lot.report() << "\n";
}
