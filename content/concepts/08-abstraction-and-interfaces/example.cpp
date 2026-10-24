#include <iostream>
#include <string>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;                                   // pure virtual
    std::string describe() const { return "area " + std::to_string(area()); }
};

class Square : public Shape {
public:
    explicit Square(double side) : side_(side) {}
    double area() const override { return side_ * side_; }
private:
    double side_;
};

class Notifier {                                                       // an interface
public:
    virtual ~Notifier() = default;
    virtual void send(const std::string& message) = 0;
};

class EmailNotifier : public Notifier {
public:
    void send(const std::string& message) override { std::cout << "  email: " << message << "\n"; }
};

class FakeNotifier : public Notifier {
public:
    void send(const std::string& message) override { sent.push_back(message); }
    std::vector<std::string> sent;
};

class OrderService {
public:
    explicit OrderService(Notifier& notifier) : notifier_(notifier) {}
    void place_order(const std::string& item) { notifier_.send("order placed: " + item); }
private:
    Notifier& notifier_;                                               // depends only on the abstraction
};

int main() {
    // Shape s;   // error: cannot declare variable 's' to be of abstract type 'Shape'
    Square sq(3);
    std::cout << "Square: " << sq.describe() << "\n";

    EmailNotifier email;
    OrderService(email).place_order("book");
    FakeNotifier fake;
    OrderService(fake).place_order("pen");
    std::cout << "the fake recorded: " << fake.sent.size() << " message(s): " << fake.sent.front() << "\n";
}
