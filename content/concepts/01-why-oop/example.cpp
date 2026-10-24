// Procedural vs object-oriented: the same bank account, twice.
#include <iostream>
#include <stdexcept>
#include <string>

// --- procedural: a struct with public data + a free function
struct RawAccount {
    int balance;
};

int withdraw(RawAccount& a, int amount) { return a.balance -= amount; }

// --- object-oriented: private data, public methods that enforce the rules
class Account {
public:
    Account(std::string owner, int balance) : owner_(std::move(owner)), balance_(balance) {}

    void withdraw(int amount) {
        if (amount > balance_) throw std::runtime_error("insufficient funds");
        balance_ -= amount;
    }
    int balance() const { return balance_; }
    const std::string& owner() const { return owner_; }

private:
    std::string owner_;
    int balance_;
};

int main() {
    RawAccount raw{100};
    withdraw(raw, 30);
    raw.balance = -9999;                       // allowed: the data is public
    std::cout << "procedural balance: " << raw.balance << "\n";

    Account acct("Ada", 100);
    acct.withdraw(30);
    try {
        acct.withdraw(500);
    } catch (const std::exception& e) {
        std::cout << "refused: " << e.what() << "\n";
    }
    // acct.balance_ = -9999;                  // would not compile: 'balance_' is private
    std::cout << acct.owner() << " has " << acct.balance() << "\n";
}
