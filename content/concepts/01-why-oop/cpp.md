C++ is **multi-paradigm**: you can write C-style procedural code, generic templates, or OOP, and OOP is designed to be
**zero-cost**. A class with no `virtual` functions is laid out in memory exactly like a C struct, and a method call
compiles to a plain function call with the object's address as a hidden argument.

```c++
int x = 42;          // an int is NOT an object with methods in C++ - just 4 bytes
std::string s{"hi"}; // a std::string IS a class object (with size(), append(), …)
```

Classes are checked by the compiler. Every member and its type is declared, and mistakes like calling a method that
doesn't exist are **compile errors**, not runtime surprises.
