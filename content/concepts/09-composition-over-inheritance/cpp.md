### Value members: the part lives inside the whole

```c++
class Engine {
public:
    explicit Engine(int hp) : hp_(hp) {}
    std::string start() { running_ = true; return std::to_string(hp_) + "hp engine started"; }
private:
    int hp_;
    bool running_ = false;
};

class Car {
public:
    Car(std::string model, int hp) : model_(std::move(model)), engine_(hp) {}   // members built in order
    std::string start() { return model_ + ": " + engine_.start(); }             // delegation
private:
    std::string model_;
    Engine engine_;                         // composition: destroyed together with the Car
};
```

### Owning a polymorphic part

```c++
class Duck {
public:
    explicit Duck(std::unique_ptr<FlyBehaviour> fly) : fly_(std::move(fly)) {}
    void set_fly(std::unique_ptr<FlyBehaviour> fly) { fly_ = std::move(fly); }   // swap at run time
    std::string perform_fly() const { return fly_->fly(); }
private:
    std::unique_ptr<FlyBehaviour> fly_;     // owns it; deleted automatically
};
```

| Member type | Use when |
|---|---|
| `Engine engine_;` | the part is always there and has a fixed type |
| `std::unique_ptr<Base>` | exclusive ownership of a polymorphic or optional part |
| `std::shared_ptr<T>` | genuinely shared ownership (use it rarely) |
| `T&` / `T*` | non-owning access to something that outlives you |
| `std::function<R(Args)>` | a lightweight strategy (any callable) |
