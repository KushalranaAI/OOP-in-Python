### Strategy, Observer and Factory in modern C++

```c++
// Strategy: std::function holds any callable
double checkout(double total, const std::function<double(double)>& pricing) { return pricing(total); }

// Observer
class Store {
public:
    void subscribe(std::function<void(const std::string&)> fn) { listeners_.push_back(std::move(fn)); }
    void sell(const std::string& item) { for (auto& fn : listeners_) fn("sold " + item); }
private:
    std::vector<std::function<void(const std::string&)>> listeners_;
};

// Factory returning an owning pointer to the base
std::unique_ptr<Shape> make_shape(const std::string& kind, double size) {
    if (kind == "circle") return std::make_unique<Circle>(size);
    if (kind == "square") return std::make_unique<Square>(size);
    throw std::invalid_argument("unknown shape: " + kind);
}
```

### Singleton (if you really must)

```c++
Config& config() {
    static Config instance;   // created on first use, thread-safe since C++11
    return instance;
}
```

Global state hides dependencies and makes testing hard. Pass a `Config&` to the classes that need it instead.
