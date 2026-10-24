// Shape hierarchy - abstraction, polymorphism, operator overloading and a factory.
// ── Step 1: The abstract base class ──
#include <algorithm>
#include <cmath>
#include <functional>
#include <iomanip>
#include <iostream>
#include <map>
#include <memory>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual double perimeter() const = 0;
    virtual std::unique_ptr<Shape> scaled(double factor) const = 0;
    virtual std::string name() const = 0;

    std::string describe() const {
        std::ostringstream out;
        out << std::left << std::setw(9) << name() << std::right << std::fixed << std::setprecision(2)
            << " area " << std::setw(8) << area() << "   perimeter " << std::setw(7) << perimeter();
        return out.str();
    }

    bool operator<(const Shape& other) const { return area() < other.area(); }
};

std::unique_ptr<Shape> operator*(const Shape& shape, double factor) { return shape.scaled(factor); }

// ── Step 2: Concrete shapes ──
void require_positive(const std::string& label, double value) {
    if (value <= 0) {
        std::ostringstream msg;
        msg << label << " must be positive, got " << value;
        throw std::invalid_argument(msg.str());
    }
}

class Circle : public Shape {
public:
    explicit Circle(double radius) : radius_(radius) { require_positive("radius", radius); }
    double area() const override { return M_PI * radius_ * radius_; }
    double perimeter() const override { return 2 * M_PI * radius_; }
    std::unique_ptr<Shape> scaled(double k) const override { return std::make_unique<Circle>(radius_ * k); }
    std::string name() const override { return "Circle"; }

private:
    double radius_;
};

class Rectangle : public Shape {
public:
    Rectangle(double width, double height) : width_(width), height_(height) {
        require_positive("width", width);
        require_positive("height", height);
    }
    double area() const override { return width_ * height_; }
    double perimeter() const override { return 2 * (width_ + height_); }
    std::unique_ptr<Shape> scaled(double k) const override { return std::make_unique<Rectangle>(width_ * k, height_ * k); }
    std::string name() const override { return "Rectangle"; }

protected:
    double width_, height_;
};

class Square : public Rectangle {
public:
    explicit Square(double side) : Rectangle(side, side) {}
    std::unique_ptr<Shape> scaled(double k) const override { return std::make_unique<Square>(width_ * k); }
    std::string name() const override { return "Square"; }
};

class Triangle : public Shape {
public:
    Triangle(double a, double b, double c) : a_(a), b_(b), c_(c) {
        require_positive("a", a);
        require_positive("b", b);
        require_positive("c", c);
        if (a + b <= c || a + c <= b || b + c <= a) {
            std::ostringstream msg;
            msg << "sides " << a << ", " << b << ", " << c << " can't form a triangle";
            throw std::invalid_argument(msg.str());
        }
    }
    double area() const override {
        double s = (a_ + b_ + c_) / 2;
        return std::sqrt(s * (s - a_) * (s - b_) * (s - c_));     // Heron's formula
    }
    double perimeter() const override { return a_ + b_ + c_; }
    std::unique_ptr<Shape> scaled(double k) const override { return std::make_unique<Triangle>(a_ * k, b_ * k, c_ * k); }
    std::string name() const override { return "Triangle"; }

private:
    double a_, b_, c_;
};

// ── Step 3: A factory for creating shapes from text ──
class ShapeFactory {
public:
    static std::unique_ptr<Shape> parse(const std::string& text) {
        using Maker = std::function<std::unique_ptr<Shape>(const std::vector<double>&)>;
        static const std::map<std::string, std::pair<Maker, std::size_t>> registry{
            {"circle", {[](const auto& n) { return std::make_unique<Circle>(n[0]); }, 1}},
            {"rect", {[](const auto& n) { return std::make_unique<Rectangle>(n[0], n[1]); }, 2}},
            {"square", {[](const auto& n) { return std::make_unique<Square>(n[0]); }, 1}},
            {"triangle", {[](const auto& n) { return std::make_unique<Triangle>(n[0], n[1], n[2]); }, 3}},
        };
        std::istringstream in(text);
        std::string kind;
        in >> kind;
        std::vector<double> numbers;
        for (double x; in >> x;) numbers.push_back(x);

        auto it = registry.find(kind);
        if (it == registry.end()) throw std::invalid_argument("unknown shape '" + kind + "'");
        const auto& [make, arity] = it->second;
        if (numbers.size() != arity)
            throw std::invalid_argument("'" + kind + "' needs " + std::to_string(arity) + " number(s)");
        return make(numbers);
    }
};

// ── Step 4: The canvas - polymorphism pays off ──
class Canvas {
public:
    void add(std::unique_ptr<Shape> shape) { shapes_.push_back(std::move(shape)); }
    std::size_t size() const { return shapes_.size(); }

    double total_area() const {
        double total = 0;
        for (const auto& s : shapes_) total += s->area();
        return total;
    }

    const Shape& largest() const {
        return **std::max_element(shapes_.begin(), shapes_.end(), [](const auto& a, const auto& b) { return *a < *b; });
    }

    std::vector<std::string> listing() const {
        std::vector<const Shape*> sorted;
        for (const auto& s : shapes_) sorted.push_back(s.get());
        std::stable_sort(sorted.begin(), sorted.end(), [](const Shape* a, const Shape* b) { return *a < *b; });
        std::vector<std::string> rows;
        for (const Shape* s : sorted) rows.push_back(s->describe());
        return rows;
    }

private:
    std::vector<std::unique_ptr<Shape>> shapes_;
};

// ── Step 5: Try it out ──
int main() {
    Canvas canvas;
    for (const std::string line : {"circle 1.5", "rect 3 4", "square 2.5", "triangle 3 4 5", "triangle 1 2 8", "hexagon 2"}) {
        try {
            canvas.add(ShapeFactory::parse(line));
        } catch (const std::invalid_argument& e) {
            std::cout << "skipped '" << line << "': " << e.what() << "\n";
        }
    }
    // Shape s;   // compile error: Shape is abstract
    std::cout << "Shape itself is abstract\n";

    std::unique_ptr<Shape> big_square = *ShapeFactory::parse("square 2.5") * 2;
    std::cout << "scaled square: " << big_square->describe() << "\n";
    std::cout << "is a Square a Rectangle? " << (dynamic_cast<Rectangle*>(big_square.get()) ? "True" : "False") << "\n";
    canvas.add(std::move(big_square));

    std::cout << "\n" << canvas.size() << " shapes, smallest first:\n";
    for (const auto& row : canvas.listing()) std::cout << "  " << row << "\n";
    std::cout << std::fixed << std::setprecision(2) << "total area " << canvas.total_area()
              << ", largest is the " << canvas.largest().name() << "\n";
}
