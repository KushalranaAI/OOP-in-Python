#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

class Account {
public:
    explicit Account(std::string owner) : owner_(std::move(owner)) {}

    void deposit(int amount) {
        if (amount <= 0) throw std::invalid_argument("deposit must be positive");
        balance_ += amount;
        log("deposit " + std::to_string(amount));
    }
    int balance() const { return balance_; }
    bool same_balance_as(const Account& other) const { return balance_ == other.balance_; }   // access is per CLASS

protected:
    void log(const std::string& line) { history_.push_back(line); }
    std::size_t entries() const { return history_.size(); }

private:
    std::string owner_;
    int balance_ = 0;
    std::vector<std::string> history_;
    friend void audit(const Account& a);
};

class Savings : public Account {
public:
    using Account::Account;                      // inherit the constructor
    std::size_t log_size() const { return entries(); }        // protected: OK in a subclass
    // int peek() const { return balance_; }     // error: 'int Account::balance_' is private within this context
};

void audit(const Account& a) { std::cout << "audit sees private owner_: " << a.owner_ << "\n"; }

int main() {
    Savings s("Ada");
    s.deposit(100);
    std::cout << "balance: " << s.balance() << "\n";
    try {
        s.deposit(-5);
    } catch (const std::exception& e) {
        std::cout << "rule enforced: " << e.what() << "\n";
    }
    std::cout << "log entries (via protected): " << s.log_size() << "\n";
    audit(s);
    Account other("Bob");
    other.deposit(100);
    std::cout << std::boolalpha << "same balance: " << s.same_balance_as(other) << "\n";
    // s.balance_ = 1000000;                     // error: 'int Account::balance_' is private within this context
}
