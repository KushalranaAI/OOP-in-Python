---
title: Strings and standard containers
order: 5
summary: std::string, std::vector, std::map, std::unordered_map, std::set and the algorithms that work on them.
---

```cpp
#include <algorithm>
#include <iostream>
#include <map>
#include <numeric>
#include <set>
#include <string>
#include <unordered_map>
#include <vector>

int main() {
    std::string s = "Object Oriented";
    s += " Programming";
    std::cout << s << " | length " << s.size() << " | find: " << s.find("Oriented")
              << " | substr: " << s.substr(0, 6) << "\n";

    std::vector<int> scores{72, 90, 85};            // a growable array
    scores.push_back(60);
    std::sort(scores.begin(), scores.end());
    int total = std::accumulate(scores.begin(), scores.end(), 0);
    std::cout << "min " << scores.front() << " max " << scores.back() << " total " << total << "\n";

    std::map<std::string, int> stock{{"kiwi", 0}, {"apple", 5}};     // sorted by key
    stock["fig"] = 12;
    for (const auto& [item, qty] : stock) std::cout << "  " << item << ": " << qty << "\n";   // structured bindings

    std::unordered_map<std::string, int> ages{{"ada", 36}};          // hash table, unordered
    std::cout << "has bob? " << ages.count("bob") << " | ada=" << ages.at("ada") << "\n";

    std::set<std::string> tags{"cpp", "oop", "cpp"};                 // unique, sorted
    std::cout << "tags: " << tags.size() << "\n";

    auto big = std::count_if(scores.begin(), scores.end(), [](int x) { return x > 80; });
    std::cout << big << " scores above 80\n";
}
```

| Container | Like… | Lookup |
|---|---|---|
| `std::vector<T>` | Python list / JS array | by index, O(1) |
| `std::map<K,V>` | sorted dict | O(log n) |
| `std::unordered_map<K,V>` | dict / JS Map | O(1) average |
| `std::set<T>` | sorted set | O(log n) |
| `std::array<T,N>` | fixed-size array | by index |

`v[i]` doesn't check bounds; `v.at(i)` throws `std::out_of_range`. Containers **own** their elements and copy them
when the container is copied.
