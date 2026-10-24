#include <algorithm>
#include <compare>
#include <iomanip>
#include <iostream>
#include <vector>

class Money {
public:
    explicit Money(long cents) : cents_(cents) {}

    Money& operator+=(const Money& other) { cents_ += other.cents_; return *this; }
    Money operator+(const Money& other) const { Money result = *this; result += other; return result; }
    Money operator*(int factor) const { return Money(cents_ * factor); }
    bool operator==(const Money&) const = default;
    auto operator<=>(const Money&) const = default;
    explicit operator bool() const { return cents_ != 0; }

    friend std::ostream& operator<<(std::ostream& os, const Money& m) {
        return os << m.cents_ / 100 << "." << std::setw(2) << std::setfill('0') << m.cents_ % 100 << " USD";
    }

private:
    long cents_;
};

class Wallet {
public:
    void add(Money m) { items_.push_back(m); }
    std::size_t size() const { return items_.size(); }
    const Money& operator[](std::size_t i) const { return items_.at(i); }
    auto begin() const { return items_.begin(); }      // these two make range-for work
    auto end() const { return items_.end(); }

private:
    std::vector<Money> items_;
};

int main() {
    Money coffee(350), cake(425);
    std::cout << "coffee + cake = " << coffee + cake << " | coffee * 3 = " << coffee * 3 << "\n";
    std::cout << std::boolalpha << "coffee < cake: " << (coffee < cake)
              << " | coffee == Money(350): " << (coffee == Money(350)) << "\n";

    Wallet wallet;
    wallet.add(coffee);
    wallet.add(cake);
    wallet.add(Money(100));
    Money total(0);
    for (const Money& m : wallet) total += m;
    std::cout << "size: " << wallet.size() << " | first: " << wallet[0] << " | total: " << total << "\n";

    std::vector<Money> sorted(wallet.begin(), wallet.end());
    std::sort(sorted.begin(), sorted.end());            // uses operator<=>
    std::cout << "cheapest: " << sorted.front() << " | dearest: " << sorted.back() << "\n";
    std::cout << "bool(Money(0)): " << static_cast<bool>(Money(0)) << "\n";
}
