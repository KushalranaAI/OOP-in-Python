---
title: Control flow
order: 2
summary: if/else, switch, for, range-based for and while loops - with braces and semicolons.
---

```cpp
#include <iostream>
#include <vector>

int main() {
    int temperature = 23;
    if (temperature > 30) {
        std::cout << "hot\n";
    } else if (temperature > 15) {
        std::cout << "pleasant\n";
    } else {
        std::cout << "cold\n";
    }
    const char* status = temperature > 0 ? "above zero" : "freezing";    // ternary
    std::cout << status << "\n";

    for (int i = 0; i < 3; ++i) std::cout << "round " << i << "\n";

    std::vector<int> scores{72, 90, 85};
    for (int s : scores) std::cout << s << " ";          // range-based for
    std::cout << "\n";

    int n = 10;
    while (n != 1) {
        n = (n % 2 == 0) ? n / 2 : 3 * n + 1;
        if (n == 4) { std::cout << "reached 4\n"; break; }
    }

    char command = 'q';
    switch (command) {
        case 'n': std::cout << "north\n"; break;
        case 'q': std::cout << "quit\n"; break;          // forget `break` and execution falls through!
        default:  std::cout << "unknown\n";
    }
}
```

- Conditions go in parentheses; blocks use braces.
- `&&`, `||` and `!` are the logical operators. `0`, `nullptr` and `false` are false.
- Turn on warnings (`-Wall`). They catch things like `if (x = 5)` when you meant `==`.
