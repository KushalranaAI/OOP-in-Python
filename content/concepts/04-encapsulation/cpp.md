### Access specifiers

```c++
class Account {
public:                                   // the interface
    explicit Account(std::string owner) : owner_(std::move(owner)) {}
    void deposit(int amount) {
        if (amount <= 0) throw std::invalid_argument("deposit must be positive");
        balance_ += amount;
    }
    int balance() const { return balance_; }

protected:                                // for subclasses
    void log(const std::string& line) { history_.push_back(line); }

private:                                  // the implementation
    std::string owner_;
    int balance_ = 0;
    std::vector<std::string> history_;

    friend void audit(const Account&);    // a specific outside function allowed in
};
```

- `class` members are **private by default**, `struct` members **public by default**. That's the only difference.
- Access is checked **at compile time**. There's no run-time cost and no way around it short of undefined-behaviour hacks.
- Access is **per class, not per object**: one `Account` method may read another `Account`'s private members (useful in copy constructors and `operator==`).
- `friend` grants one function or class full access. Use sparingly, for tightly coupled helpers like `operator<<`.

### Const for read-only access
Return internals by `const&` and mark accessors `const`:
`const std::string& owner() const { return owner_; }`. Callers can look but not modify, and no copy is made.
