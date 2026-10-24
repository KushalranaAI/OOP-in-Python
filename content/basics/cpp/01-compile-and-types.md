---
title: Compiling, variables and types
order: 1
summary: The edit-compile-run cycle, main(), static types, and the built-in types you'll use every day.
---

## C++ is compiled
You write `main.cpp`, a **compiler** turns it into a machine-code executable, then you run that.

```bash
g++ -std=c++20 -Wall main.cpp -o main    # compile (clang++ works the same)
./main                                   # run (main.exe on Windows)
```

Every program starts in `main`. `#include` pulls in library headers.

```cpp
#include <iostream>
#include <string>

int main() {
    std::string name = "Ada";
    int age = 36;
    std::cout << name << " is " << age << " years old\n";
    return 0;                              // 0 = success
}
```

## Static types
Every variable has a type fixed at **compile time**. Mistakes like adding a string to an int are caught before the
program runs.

```cpp
#include <iostream>
#include <string>

int main() {
    int count = 42;                 // whole numbers (usually 32-bit)
    long long big = 9'000'000'000;  // wider integer
    double price = 9.99;            // floating point
    bool ready = true;
    char grade = 'A';               // a single character
    std::string text = "hello";     // a class from the standard library
    auto inferred = 2.5;            // the compiler deduces double

    std::cout << count / 5 << " " << count % 5 << " " << price * 2 << " " << ready << " " << grade
              << " " << text.size() << " " << inferred << " " << big << "\n";
    std::cout << "int division: " << 7 / 2 << ", double division: " << 7 / 2.0 << "\n";
}
```

## Values, not names
Unlike Python and JavaScript, a C++ variable **is** the object (a box in memory). `b = a` **copies**:

```cpp
#include <iostream>
#include <string>

int main() {
    std::string a = "hi";
    std::string b = a;    // a full copy
    b += "!";
    std::cout << a << " " << b << "\n";   // hi hi!
}
```

`const` makes a variable read-only: `const double pi = 3.14159;`.
