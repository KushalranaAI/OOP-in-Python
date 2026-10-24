### Constructors, destructors and RAII

```c++
class File {
public:
    explicit File(const std::string& path) : f_(std::fopen(path.c_str(), "w")) {
        if (!f_) throw std::runtime_error("cannot open " + path);
    }
    ~File() { if (f_) std::fclose(f_); }       // ALWAYS runs at end of scope - even on exceptions
    File(const File&) = delete;                // a file handle can't be copied…
    File& operator=(const File&) = delete;
    File(File&& other) noexcept : f_(std::exchange(other.f_, nullptr)) {}   // …but it can be moved
private:
    std::FILE* f_;
};
```

### The rule of 0 / 3 / 5
- **Rule of zero** (best): don't manage resources yourself. Use members like `std::string`, `std::vector` and `std::unique_ptr`, and the compiler-generated copy/move/destructor are correct.
- **Rule of three**: if you write a destructor, copy constructor *or* copy assignment, you almost certainly need all three.
- **Rule of five**: add the move constructor and move assignment for efficiency.

### Smart pointers instead of `new`/`delete`

| | ownership | freed when |
|---|---|---|
| `std::unique_ptr<T>` | exactly one owner (movable, not copyable) | the owner goes out of scope |
| `std::shared_ptr<T>` | shared, reference-counted | the last owner goes away |
| `T*` / `T&` (raw) | **non-owning** view | never by you |

Destruction order is the **reverse** of construction, for locals in a scope and for members in a class.
