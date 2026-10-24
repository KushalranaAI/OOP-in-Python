---
title: Functions, references and const
order: 3
summary: Declaring functions, pass-by-value vs pass-by-reference, const references, overloading and lambdas.
---

## Functions declare their types

```cpp
#include <iostream>
#include <string>

std::string greet(const std::string& name, const std::string& greeting = "Hello") {
    return greeting + ", " + name + "!";
}

int square(int x) { return x * x; }
double square(double x) { return x * x; }       // overloading: same name, different parameter types

int main() {
    std::cout << greet("Ada") << " " << greet("Bob", "Hi") << "\n";
    std::cout << square(3) << " " << square(2.5) << "\n";
}
```

## Pass by value vs by reference
By default arguments are **copied**. A **reference** (`&`) is another name for an existing object, so no copy is made
and the function can change it.

```cpp
#include <iostream>
#include <vector>

void add_by_value(std::vector<int> v) { v.push_back(99); }        // changes a copy
void add_by_reference(std::vector<int>& v) { v.push_back(99); }   // changes the caller's vector
int sum(const std::vector<int>& v) {                               // no copy, read-only
    int total = 0;
    for (int x : v) total += x;
    return total;
}

int main() {
    std::vector<int> numbers{1, 2, 3};
    add_by_value(numbers);
    std::cout << "after by-value: " << numbers.size() << "\n";      // 3
    add_by_reference(numbers);
    std::cout << "after by-reference: " << numbers.size() << "\n";  // 4
    std::cout << "sum: " << sum(numbers) << "\n";
}
```

**Rule of thumb:** small types (int, double) by value; big objects by `const T&`; `T&` only when the function must
modify the argument.

## Lambdas
Anonymous functions that can **capture** local variables:

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<std::string> words{"kiwi", "fig", "banana"};
    std::sort(words.begin(), words.end(), [](const std::string& a, const std::string& b) { return a.size() < b.size(); });
    int calls = 0;
    auto counter = [&calls]() { return ++calls; };     // captures `calls` by reference
    counter(); counter();
    std::cout << words[0] << " " << words[2] << " | calls=" << counter() << "\n";
}
```
