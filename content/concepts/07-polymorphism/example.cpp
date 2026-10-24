#include <cmath>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual std::string name() const = 0;
    std::string kind() const { return "shape"; }          // NOT virtual
};

class Circle : public Shape {
public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return M_PI * r_ * r_; }
    std::string name() const override { return "Circle"; }
    std::string kind() const { return "round shape"; }    // hides, does not override
private:
    double r_;
};

class Rectangle : public Shape {
public:
    Rectangle(double w, double h) : w_(w), h_(h) {}
    double area() const override { return w_ * h_; }
    std::string name() const override { return "Rectangle"; }
private:
    double w_, h_;
};

struct Hexagon {                                         // unrelated type with .area()
    double s;
    double area() const { return 3 * std::sqrt(3.0) / 2 * s * s; }
};

template <typename T>
double area_of(const T& thing) { return thing.area(); }  // compile-time "duck typing"

void print(int x) { std::cout << "an int: " << x; }
void print(const std::string& s) { std::cout << "a string: " << s; }

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>(1));
    shapes.push_back(std::make_unique<Rectangle>(2, 3));
    double total = 0;
    for (const auto& s : shapes) {
        std::cout << s->name() << " area = " << s->area() << "\n";       // virtual: dynamic dispatch
        total += s->area();
    }
    std::cout << "total: " << total << "\n";

    Circle c(2);
    Shape& ref = c;
    std::cout << "virtual via Shape&: " << ref.name() << " | non-virtual via Shape&: " << ref.kind()
              << " | via Circle: " << c.kind() << "\n";
    std::cout << "template with Hexagon: " << area_of(Hexagon{1}) << "\n";
    print(42);
    std::cout << " | ";
    print(std::string("hi"));
    std::cout << "\n";
}
