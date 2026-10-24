// Bank account system - classes, encapsulation, inheritance and composition.
// ── Step 1: Transaction, errors and a money helper ──
#include <iomanip>
#include <iostream>
#include <map>
#include <memory>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

std::string money(long cents) {
    std::ostringstream out;
    out << (cents < 0 ? "-" : "") << std::labs(cents) / 100 << "." << std::setw(2) << std::setfill('0') << std::labs(cents) % 100;
    return out.str();
}

class InsufficientFunds : public std::runtime_error {
public:
    InsufficientFunds(long balance, long requested)
        : std::runtime_error("balance " + money(balance) + ", tried to withdraw " + money(requested)) {}
};

struct Transaction {
    const std::string kind;
    const long amount;
    const long balance_after;
};

// ── Step 2: Account - the balance is private ──
class Account {
public:
    Account(std::string owner, int number) : owner_(std::move(owner)), number_(number) {}
    virtual ~Account() = default;

    const std::string& owner() const { return owner_; }
    int number() const { return number_; }
    long balance() const { return balance_; }

    void deposit(long amount) {
        if (amount <= 0) throw std::invalid_argument("deposit must be positive");
        apply("deposit", amount);
    }

    virtual void withdraw(long amount) {
        if (amount <= 0) throw std::invalid_argument("withdrawal must be positive");
        check_withdraw(amount);
        apply("withdraw", -amount);
    }

    virtual std::string kind() const { return "Account"; }

    std::string statement() const {
        std::ostringstream out;
        out << "#" << number_ << " " << owner_ << " (" << kind() << ")";
        for (const auto& t : history_)
            out << "\n  " << std::left << std::setw(9) << t.kind << std::right << std::setw(9) << money(t.amount)
                << std::setw(10) << money(t.balance_after);
        return out.str();
    }

protected:
    virtual void check_withdraw(long amount) const {
        if (amount > balance_) throw InsufficientFunds(balance_, amount);
    }
    void apply(const std::string& kind, long signed_amount) {
        balance_ += signed_amount;
        history_.push_back({kind, signed_amount, balance_});
    }

private:
    std::string owner_;
    int number_;
    long balance_ = 0;
    std::vector<Transaction> history_;
};

// ── Step 3: SavingsAccount - inherit, override, extend ──
class SavingsAccount : public Account {
public:
    static constexpr int MAX_WITHDRAWALS = 3;

    SavingsAccount(std::string owner, int number, int rate_bp = 150)
        : Account(std::move(owner), number), rate_bp_(rate_bp) {}

    void withdraw(long amount) override {
        Account::withdraw(amount);
        ++withdrawals_;
    }

    long add_interest() {
        long interest = balance() * rate_bp_ / 10'000;
        if (interest > 0) apply("interest", interest);
        return interest;
    }

    std::string kind() const override { return "SavingsAccount"; }

protected:
    void check_withdraw(long amount) const override {
        Account::check_withdraw(amount);
        if (withdrawals_ >= MAX_WITHDRAWALS)
            throw std::logic_error("limit of " + std::to_string(MAX_WITHDRAWALS) + " withdrawals reached");
    }

private:
    int rate_bp_;
    int withdrawals_ = 0;
};

// ── Step 4: Bank - owns accounts (composition) ──
class Bank {
public:
    explicit Bank(std::string name) : name_(std::move(name)) {}

    Account& open(const std::string& owner, bool savings = false) {
        std::unique_ptr<Account> account;
        if (savings) account = std::make_unique<SavingsAccount>(owner, next_number_);
        else account = std::make_unique<Account>(owner, next_number_);
        Account& ref = *account;
        accounts_[next_number_++] = std::move(account);
        return ref;
    }

    void transfer(int source, int target, long amount) {
        accounts_.at(source)->withdraw(amount);
        accounts_.at(target)->deposit(amount);
    }

    long total() const {
        long sum = 0;
        for (const auto& [number, account] : accounts_) sum += account->balance();
        return sum;
    }

private:
    std::string name_;
    std::map<int, std::unique_ptr<Account>> accounts_;
    int next_number_ = 1001;
};

// ── Step 5: Try it out ──
int main() {
    Bank bank("OOP Bank");
    Account& ada = bank.open("Ada");
    auto& bob = static_cast<SavingsAccount&>(bank.open("Bob", true));

    ada.deposit(50'000);
    bob.deposit(120'000);
    ada.withdraw(12'550);
    try {
        ada.withdraw(1'000'000);
    } catch (const InsufficientFunds& e) {
        std::cout << "rejected: " << e.what() << "\n";
    }
    try {
        ada.deposit(-5);
    } catch (const std::invalid_argument& e) {
        std::cout << "rejected: " << e.what() << "\n";
    }

    std::cout << "interest paid: " << money(bob.add_interest()) << "\n";
    for (int i = 0; i < 3; ++i) bob.withdraw(1'000);
    try {
        bob.withdraw(1'000);
    } catch (const std::logic_error& e) {
        std::cout << "rejected: " << e.what() << "\n";
    }

    bank.transfer(ada.number(), bob.number(), 7'450);
    std::cout << ada.statement() << "\n" << bob.statement() << "\n";
    std::cout << "bank total: " << money(bank.total()) << "\n";
}
