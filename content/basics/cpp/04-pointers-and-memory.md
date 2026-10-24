---
title: Pointers, memory and smart pointers
order: 4
summary: Stack vs heap, addresses and pointers, new/delete and why you should use std::unique_ptr instead.
---

## Stack and heap
- **Stack**: local variables. They're created when the function starts and destroyed automatically when it returns. Fast.
- **Heap** (free store): objects you allocate explicitly. They live until you free them.

## Pointers
A pointer holds a memory **address**. `&x` takes an address; `*p` follows one.

```cpp
#include <iostream>

int main() {
    int score = 90;
    int* p = &score;               // p points at score
    std::cout << "value " << score << ", via pointer " << *p << "\n";
    *p = 95;                       // change score through the pointer
    std::cout << "score is now " << score << "\n";

    int* nothing = nullptr;        // points at nothing - check before using!
    if (!nothing) std::cout << "null pointer\n";
}
```

## Owning heap memory: use smart pointers

```cpp
#include <iostream>
#include <memory>
#include <string>

struct Robot {
    std::string name;
    explicit Robot(std::string n) : name(std::move(n)) { std::cout << "  built " << name << "\n"; }
    ~Robot() { std::cout << "  scrapped " << name << "\n"; }
};

int main() {
    Robot* raw = new Robot("Raw-1");          // manual: YOU must delete it
    delete raw;                               // forget this -> memory leak; do it twice -> crash

    {
        auto r = std::make_unique<Robot>("Smart-2");    // owns the heap object
        std::cout << "  using " << r->name << "\n";     // -> follows the pointer
    }                                                   // freed automatically here

    auto shared = std::make_shared<Robot>("Shared-3");
    auto also = shared;                                 // two owners
    std::cout << "  owners: " << shared.use_count() << "\n";
    std::cout << "end of main\n";
}                                                       // last owner gone -> freed
```

| Tool | Meaning |
|---|---|
| plain local variable | the default: automatic lifetime, no heap |
| `std::unique_ptr<T>` | single owner of a heap object |
| `std::shared_ptr<T>` | shared ownership (reference counted) |
| `T*` / `T&` | non-owning access |

Modern C++ code almost never calls `new`/`delete` directly. This idea, **RAII**, is the heart of chapter 5.
