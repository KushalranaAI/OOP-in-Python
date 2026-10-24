---
title: Structs, headers and exceptions
order: 6
summary: Grouping data with struct, splitting code into .h/.cpp files, and throwing/catching exceptions.
---

## struct: your first user-defined type
A `struct` groups related data. It's really a class whose members are public by default (chapter 2).

```cpp
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

struct Point {
    double x = 0;
    double y = 0;
};

double parse_positive(const std::string& text) {
    double value = std::stod(text);                     // throws std::invalid_argument on bad input
    if (value < 0) throw std::out_of_range("negative: " + text);
    return value;
}

int main() {
    Point p{3, 4};
    std::vector<Point> path{{0, 0}, p, {6, 8}};
    std::cout << "points: " << path.size() << ", last x = " << path.back().x << "\n";

    for (std::string raw : {"2.5", "-1", "abc"}) {
        try {
            std::cout << "parsed " << parse_positive(raw) << "\n";
        } catch (const std::out_of_range& e) {
            std::cout << "range error: " << e.what() << "\n";
        } catch (const std::invalid_argument&) {
            std::cout << "not a number: " << raw << "\n";
        }
    }
}
```

## Headers and source files
Real projects split **declarations** (what exists) from **definitions** (how it works):

```c++
// point.h - the interface
#pragma once
struct Point { double x, y; };
double distance(const Point& a, const Point& b);

// point.cpp - the implementation
#include "point.h"
#include <cmath>
double distance(const Point& a, const Point& b) { return std::hypot(a.x - b.x, a.y - b.y); }

// main.cpp
#include "point.h"
```

Compile them together with `g++ -std=c++20 main.cpp point.cpp -o app`, or use CMake for bigger projects. In this
course each program is one file, so you can run it in the browser.

You now know enough C++ for the OOP chapters. Start with **Why OOP?**
