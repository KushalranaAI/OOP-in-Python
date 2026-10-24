"""Writes content/traces/*.json. Traces are data for the step-through widget; keeping them in Python makes them easy
to edit (no JSON escaping) and lets us check each program's real output against the trace's final output."""

import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "content" / "traces"


def var(name, value=None, ref=None, **extra):
    d = {"name": name}
    if ref is not None:
        d["ref"] = ref
    elif value is not None:
        d["value"] = value
    d.update(extra)
    return d


def obj(id_, label, fields, **extra):
    return {"id": id_, "label": label, "fields": fields, **extra}


def save(name, title, lang, code, steps, **extra):
    data = {"title": title, "lang": lang, "code": code, "steps": steps, **extra}
    (OUT / f"{name}.json").write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")


OUT.mkdir(parents=True, exist_ok=True)

# ------------------------------------------------------------------ Python: creating an object
PY_CREATE = '''class Dog:
    species = "Canis familiaris"

    def __init__(self, name, age):
        self.name = name
        self.age = age

    def bark(self):
        return f"{self.name} says woof"

rex = Dog("Rex", 3)
print(rex.bark())
'''
dog_cls = obj("Dog", "class Dog", [var("species", '"Canis familiaris"'), var("__init__", "<function>"), var("bark", "<function>")], kind="class")
glob = lambda *vs: {"name": "global frame", "vars": [var("Dog", ref="Dog"), *vs]}
rex0 = lambda fields, **k: obj("o1", "Dog object", fields, proto="Dog", protoLabel="__class__", **k)
save("py-create", "Python: what happens in Dog(\"Rex\", 3)", "python", PY_CREATE, [
    {"line": 1, "note": "`class` is a **statement**. Python runs the body and builds a **class object** - itself an object in memory - then binds the name `Dog` to it.",
     "frames": [glob()], "heap": [dog_cls]},
    {"line": 11, "note": "Calling the class runs two steps. First `Dog.__new__(Dog)` **allocates an empty object** whose `__class__` points to `Dog`.",
     "frames": [glob()], "heap": [dog_cls, rex0([])]},
    {"line": 4, "note": "Then `Dog.__init__(obj, \"Rex\", 3)` runs with the new object passed in as **self**. `__init__` doesn't create the object - it *initialises* one that already exists.",
     "frames": [glob(), {"name": "__init__", "vars": [var("self", ref="o1"), var("name", '"Rex"'), var("age", "3")]}], "heap": [dog_cls, rex0([])]},
    {"line": 5, "note": "`self.name = name` adds an attribute to the object's own `__dict__`.",
     "frames": [glob(), {"name": "__init__", "vars": [var("self", ref="o1"), var("name", '"Rex"'), var("age", "3")]}], "heap": [dog_cls, rex0([var("name", '"Rex"', changed=True)])]},
    {"line": 6, "note": "Same for `age`. Attributes live in the **object**; methods live in the **class**.",
     "frames": [glob(), {"name": "__init__", "vars": [var("self", ref="o1"), var("name", '"Rex"'), var("age", "3")]}], "heap": [dog_cls, rex0([var("name", '"Rex"'), var("age", "3", changed=True)])]},
    {"line": 11, "note": "`__init__` returns, its frame disappears, and the name `rex` is bound to the object. A variable in Python is a **name that refers to** an object.",
     "frames": [glob(var("rex", ref="o1"))], "heap": [dog_cls, rex0([var("name", '"Rex"'), var("age", "3")])]},
    {"line": 9, "note": "`rex.bark()` - `bark` isn't in the object's `__dict__`, so Python looks in its class and finds `Dog.bark`. The call becomes `Dog.bark(rex)`, so **self is rex**.",
     "frames": [glob(var("rex", ref="o1")), {"name": "bark", "vars": [var("self", ref="o1")]}], "heap": [dog_cls, rex0([var("name", '"Rex"'), var("age", "3")])]},
    {"line": 12, "note": "The returned string is printed. Done: one class object, one instance, two names.",
     "frames": [glob(var("rex", ref="o1"))], "heap": [dog_cls, rex0([var("name", '"Rex"'), var("age", "3")])], "out": "Rex says woof"},
], stackLabel="Frames (names)", heapLabel="Objects")

# ------------------------------------------------------------------ C++: stack vs heap objects
CPP_CREATE = '''#include <iostream>
#include <string>

class Dog {
public:
    Dog(std::string name, int age) : name_(name), age_(age) {
        std::cout << "constructed " << name_ << "\\n";
    }
    std::string bark() const { return name_ + " says woof"; }
private:
    std::string name_;
    int age_;
};

int main() {
    Dog rex("Rex", 3);
    Dog* pip = new Dog("Pip", 1);
    std::cout << rex.bark() << "\\n";
    delete pip;
}
'''
rex_inline = lambda fields: {"name": "rex", "id": "rex", "obj": {"label": "Dog (lives in main's frame)", "fields": fields}}
save("cpp-create", "C++: an object on the stack and one on the heap", "cpp", CPP_CREATE, [
    {"line": 15, "note": "Entering `main` reserves room in its **stack frame** for `rex` (a whole Dog: a string and an int) and for `pip` (just an address). Nothing is initialised yet.",
     "frames": [{"name": "main()", "vars": [rex_inline([var("name_", "?"), var("age_", "?")]), var("pip", "?? (garbage)")]}], "heap": []},
    {"line": 6, "note": "`Dog rex(\"Rex\", 3);` calls the **constructor** on that stack space. `this` points at rex. The **member initialiser list** `: name_(name), age_(age)` initialises the members before the body runs.",
     "frames": [{"name": "main()", "vars": [rex_inline([var("name_", '"Rex"', changed=True), var("age_", "3", changed=True)]), var("pip", "?? (garbage)")]},
                {"name": "Dog::Dog", "vars": [var("this", ref="rex"), var("name", '"Rex"'), var("age", "3")]}], "heap": [], "out": "constructed Rex"},
    {"line": 17, "note": "`new Dog(...)` allocates a Dog on the **heap**, runs the constructor there, and returns its **address**. `pip` stores that address (a pointer).",
     "frames": [{"name": "main()", "vars": [rex_inline([var("name_", '"Rex"'), var("age_", "3")]), var("pip", ref="h1", changed=True)]}],
     "heap": [obj("h1", "Dog (heap)", [var("name_", '"Pip"'), var("age_", "1")])], "out": "constructed Rex\nconstructed Pip"},
    {"line": 9, "note": "`rex.bark()` - the compiler knows rex is a Dog, so it calls `Dog::bark` directly, passing `&rex` as the hidden `this` parameter.",
     "frames": [{"name": "main()", "vars": [rex_inline([var("name_", '"Rex"'), var("age_", "3")]), var("pip", ref="h1")]},
                {"name": "Dog::bark", "vars": [var("this", ref="rex")]}],
     "heap": [obj("h1", "Dog (heap)", [var("name_", '"Pip"'), var("age_", "1")])], "out": "constructed Rex\nconstructed Pip\nRex says woof"},
    {"line": 19, "note": "`delete pip;` runs the destructor and **frees** the heap memory. `pip` still holds the old address - a **dangling pointer**. Using it now would be undefined behaviour. (Modern C++ uses `std::unique_ptr` so this can't be forgotten.)",
     "frames": [{"name": "main()", "vars": [rex_inline([var("name_", '"Rex"'), var("age_", "3")]), var("pip", ref="h1")]}],
     "heap": [obj("h1", "Dog (heap)", [var("name_", '"Pip"'), var("age_", "1")], freed=True)], "out": "constructed Rex\nconstructed Pip\nRex says woof"},
    {"line": 20, "note": "When `main` returns, its frame is popped and **rex is destroyed automatically**. Stack objects need no `delete`. That's the basis of RAII.",
     "frames": [], "heap": [], "out": "constructed Rex\nconstructed Pip\nRex says woof"},
], stackLabel="Stack", heapLabel="Heap (new / delete)")

# ------------------------------------------------------------------ JavaScript: new and the prototype
JS_CREATE = '''class Dog {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  bark() {
    return `${this.name} says woof`;
  }
}

const rex = new Dog("Rex", 3);
console.log(rex.bark());
console.log(Object.getPrototypeOf(rex) === Dog.prototype);
'''
js_heap = lambda *extra: [obj("Dog", "Dog (a function!)", [var("prototype", ref="DogProto")], kind="class"),
                          obj("DogProto", "Dog.prototype", [var("constructor", ref="Dog"), var("bark", "<function>")], proto="ObjProto"),
                          obj("ObjProto", "Object.prototype", [var("toString", "<function>"), var("…", "")]), *extra]
jsglob = lambda *vs: {"name": "global scope", "vars": [var("Dog", ref="Dog"), *vs]}
rexj = lambda fields: obj("o1", "object", fields, proto="DogProto")
save("js-create", "JavaScript: what `new Dog(\"Rex\", 3)` does", "javascript", JS_CREATE, [
    {"line": 1, "note": "A `class` declaration creates a **function** called `Dog` and an object `Dog.prototype` that holds the methods (`bark`). Classes in JS are syntax over functions and prototypes.",
     "frames": [jsglob()], "heap": js_heap()},
    {"line": 11, "note": "`new` step 1: create a **new empty object**. Step 2: set its hidden **[[Prototype]]** link to `Dog.prototype`.",
     "frames": [jsglob(var("rex", "<uninitialised>"))], "heap": js_heap(rexj([]))},
    {"line": 3, "note": "Step 3: call the constructor with **`this` = the new object**. `this.name = name` creates an *own property* on it.",
     "frames": [jsglob(var("rex", "<uninitialised>")), {"name": "constructor", "vars": [var("this", ref="o1"), var("name", '"Rex"'), var("age", "3")]}],
     "heap": js_heap(rexj([var("name", '"Rex"', changed=True)]))},
    {"line": 4, "note": "Same for `age`. The methods are **not** copied into the object - they stay on the prototype and are shared.",
     "frames": [jsglob(var("rex", "<uninitialised>")), {"name": "constructor", "vars": [var("this", ref="o1"), var("name", '"Rex"'), var("age", "3")]}],
     "heap": js_heap(rexj([var("name", '"Rex"'), var("age", "3", changed=True)]))},
    {"line": 11, "note": "Step 4: `new` returns the object (unless the constructor returns another object). `rex` now refers to it.",
     "frames": [jsglob(var("rex", ref="o1"))], "heap": js_heap(rexj([var("name", '"Rex"'), var("age", "3")]))},
    {"line": 7, "note": "`rex.bark()` - `bark` isn't an own property, so JS follows [[Prototype]] to `Dog.prototype` and finds it there. `this` is set to `rex` because of the `rex.` before the call.",
     "frames": [jsglob(var("rex", ref="o1")), {"name": "bark", "vars": [var("this", ref="o1")]}],
     "heap": js_heap(rexj([var("name", '"Rex"'), var("age", "3")]))},
    {"line": 13, "note": "The prototype link is real and inspectable: `Object.getPrototypeOf(rex) === Dog.prototype` is `true`.",
     "frames": [jsglob(var("rex", ref="o1"))], "heap": js_heap(rexj([var("name", '"Rex"'), var("age", "3")])), "out": "Rex says woof\ntrue"},
], stackLabel="Scope (variables)", heapLabel="Heap (objects)")

# ------------------------------------------------------------------ self / this and class-level members
PY_SELF = '''class Counter:
    total = 0                  # class attribute: one, shared

    def __init__(self):
        self.count = 0         # instance attribute: one per object

    def increment(self):
        self.count += 1
        Counter.total += 1

a = Counter()
b = Counter()
a.increment()
a.increment()
b.increment()
print(a.count, b.count, Counter.total)
'''
cls = lambda total: obj("C", "class Counter", [var("total", str(total)), var("increment", "<function>")], kind="class")
inst = lambda id_, n, ch=False: obj(id_, "Counter object", [var("count", str(n), changed=ch)], proto="C", protoLabel="__class__")
g = lambda *vs: {"name": "global frame", "vars": [var("Counter", ref="C"), *vs]}
save("py-self", "Python: self, instance attributes and class attributes", "python", PY_SELF, [
    {"line": 12, "note": "Two objects, each with its **own** `count`. There is only **one** `total`, stored on the class.",
     "frames": [g(var("a", ref="a"), var("b", ref="b"))], "heap": [cls(0), inst("a", 0), inst("b", 0)]},
    {"line": 8, "note": "`a.increment()` is really `Counter.increment(a)`: **self is a**. `self.count += 1` changes a's own attribute.",
     "frames": [g(var("a", ref="a"), var("b", ref="b")), {"name": "increment", "vars": [var("self", ref="a")]}], "heap": [cls(0), inst("a", 1, True), inst("b", 0)]},
    {"line": 9, "note": "`Counter.total += 1` changes the **class** attribute, which every object sees.",
     "frames": [g(var("a", ref="a"), var("b", ref="b")), {"name": "increment", "vars": [var("self", ref="a")]}], "heap": [cls(1), inst("a", 1), inst("b", 0)]},
    {"line": 14, "note": "Second call on `a`: self is a again.",
     "frames": [g(var("a", ref="a"), var("b", ref="b"))], "heap": [cls(2), inst("a", 2, True), inst("b", 0)]},
    {"line": 8, "note": "`b.increment()` - same method, but now **self is b**. That's how one function serves every object.",
     "frames": [g(var("a", ref="a"), var("b", ref="b")), {"name": "increment", "vars": [var("self", ref="b")]}], "heap": [cls(3), inst("a", 2), inst("b", 1, True)]},
    {"line": 16, "note": "Result: per-object counts 2 and 1, shared total 3. (Pitfall: writing `self.total += 1` would create a *new instance attribute* instead of changing the shared one!)",
     "frames": [g(var("a", ref="a"), var("b", ref="b"))], "heap": [cls(3), inst("a", 2), inst("b", 1)], "out": "2 1 3"},
])

CPP_THIS = '''#include <iostream>

class Counter {
public:
    void increment() { ++count; ++total; }
    int count = 0;
    static int total;          // one for the whole class
};
int Counter::total = 0;

int main() {
    Counter a, b;
    a.increment();
    a.increment();
    b.increment();
    std::cout << a.count << " " << b.count << " " << Counter::total << "\\n";
}
'''
fr = lambda ca, cb, cha=False, chb=False: {"name": "main()", "vars": [{"name": "a", "id": "a", "obj": {"label": "Counter", "fields": [var("count", str(ca), changed=cha)]}},
                                                                     {"name": "b", "id": "b", "obj": {"label": "Counter", "fields": [var("count", str(cb), changed=chb)]}}]}
st = lambda t, ch=False: [obj("S", "static storage", [var("Counter::total", str(t), changed=ch)])]
save("cpp-this", "C++: the hidden this pointer and static members", "cpp", CPP_THIS, [
    {"line": 12, "note": "`a` and `b` live in main's frame; each holds its own `count`. `Counter::total` is **static**: one variable for the whole program, outside any object.",
     "frames": [fr(0, 0)], "heap": st(0)},
    {"line": 5, "note": "`a.increment()` compiles to roughly `Counter::increment(&a)`. Inside, `count` means **`this->count`**, and `this` points at a.",
     "frames": [fr(1, 0, True), {"name": "Counter::increment", "vars": [var("this", ref="a")]}], "heap": st(1, True)},
    {"line": 14, "note": "Again on `a`.", "frames": [fr(2, 0, True)], "heap": st(2, True)},
    {"line": 5, "note": "`b.increment()` - same machine code, different `this`.",
     "frames": [fr(2, 1, False, True), {"name": "Counter::increment", "vars": [var("this", ref="b")]}], "heap": st(3, True)},
    {"line": 16, "note": "A static member function has **no** `this`; static data is reached through the class name: `Counter::total`.",
     "frames": [fr(2, 1)], "heap": st(3), "out": "2 1 3"},
], heapLabel="Static storage")

JS_THIS = '''class Counter {
  static total = 0;
  count = 0;
  increment() {
    this.count++;
    Counter.total++;
  }
}

const a = new Counter();
a.increment();
const inc = a.increment;          // take the method off the object
try { inc(); } catch (e) { console.log(e.message); }
const bound = a.increment.bind(a);
bound();
console.log(a.count, Counter.total);
'''
jsc = lambda total, ch=False: obj("C", "Counter (class)", [var("total", str(total), changed=ch), var("prototype", "{ increment }")], kind="class")
jsa = lambda n, ch=False: obj("a", "object", [var("count", str(n), changed=ch)])
gs = lambda *vs: {"name": "global scope", "vars": [var("Counter", ref="C"), var("a", ref="a"), *vs]}
save("js-this", "JavaScript: this depends on HOW you call", "javascript", JS_THIS, [
    {"line": 10, "note": "`count = 0` is a **class field**: every object gets its own. `static total` lives on the class itself.",
     "frames": [gs()], "heap": [jsc(0), jsa(0)]},
    {"line": 5, "note": "`a.increment()` - called *through* `a`, so **`this` is a**.",
     "frames": [gs(), {"name": "increment", "vars": [var("this", ref="a")]}], "heap": [jsc(1, True), jsa(1, True)]},
    {"line": 13, "note": "`inc()` - the same function, but called **without an object before the dot**. In classes (strict mode) `this` is then `undefined`, so `this.count` throws.",
     "frames": [gs(var("inc", "<function increment>")), {"name": "increment", "vars": [var("this", "undefined")]}], "heap": [jsc(1), jsa(1)],
     "out": "Cannot read properties of undefined (reading 'count')"},
    {"line": 15, "note": "`bind(a)` makes a new function whose `this` is fixed to `a`. (Arrow functions also capture `this` from where they're written.)",
     "frames": [gs(var("inc", "<function>"), var("bound", "<bound increment>")), {"name": "increment", "vars": [var("this", ref="a")]}], "heap": [jsc(2, True), jsa(2, True)],
     "out": "Cannot read properties of undefined (reading 'count')"},
    {"line": 16, "note": "In Python `self` is an explicit parameter; in C++ `this` is fixed by the compiler; in JavaScript `this` is decided **at call time**.",
     "frames": [gs(var("inc", "<function>"), var("bound", "<bound increment>"))], "heap": [jsc(2), jsa(2)],
     "out": "Cannot read properties of undefined (reading 'count')\n2 2"},
])

# ------------------------------------------------------------------ lifecycle
PY_LIFE = '''import sys

class Resource:
    def __init__(self, name):
        self.name = name
        print(f"open {name}")

    def __del__(self):
        print(f"close {self.name}")

a = Resource("A")
b = a
del a
print("still alive, references:", sys.getrefcount(b) - 1)
b = None
print("done")
'''
res = lambda rc, **k: obj("r", "Resource object", [var("name", '"A"'), var("(reference count)", str(rc), changed=True)], **k)
save("py-lifecycle", "Python: reference counting decides when an object dies", "python", PY_LIFE, [
    {"line": 11, "note": "The object is created and `a` refers to it: **reference count 1**.",
     "frames": [{"name": "global frame", "vars": [var("a", ref="r")]}], "heap": [res(1)], "out": "open A"},
    {"line": 12, "note": "`b = a` copies the *reference*, not the object: count 2.",
     "frames": [{"name": "global frame", "vars": [var("a", ref="r"), var("b", ref="r")]}], "heap": [res(2)], "out": "open A"},
    {"line": 13, "note": "`del a` deletes the **name**, not the object. Count drops to 1, and the object lives on through `b`.",
     "frames": [{"name": "global frame", "vars": [var("b", ref="r")]}], "heap": [res(1)], "out": "open A\nstill alive, references: 1"},
    {"line": 15, "note": "`b = None`: the last reference is gone, count 0. CPython frees the object **immediately** and calls `__del__`. (For cycles, a separate garbage collector steps in later. Use `with` blocks, not `__del__`, for files and connections.)",
     "frames": [{"name": "global frame", "vars": [var("b", "None")]}], "heap": [res(0, freed=True)], "out": "open A\nstill alive, references: 1\nclose A"},
    {"line": 16, "note": "Done.", "frames": [{"name": "global frame", "vars": [var("b", "None")]}], "heap": [],
     "out": "open A\nstill alive, references: 1\nclose A\ndone"},
])

CPP_LIFE = '''#include <iostream>
#include <memory>
#include <string>

class Resource {
public:
    explicit Resource(std::string name) : name_(std::move(name)) { std::cout << "open " << name_ << "\\n"; }
    ~Resource() { std::cout << "close " << name_ << "\\n"; }
private:
    std::string name_;
};

int main() {
    Resource a("A");
    {
        Resource b("B");
        auto c = std::make_unique<Resource>("C");
    }                                    // c, then b, are destroyed here
    std::cout << "end of main\\n";
}                                        // a is destroyed here
'''
ra = {"name": "a", "obj": {"label": "Resource", "fields": [var("name_", '"A"')]}}
rb = {"name": "b", "obj": {"label": "Resource", "fields": [var("name_", '"B"')]}}
save("cpp-lifecycle", "C++: RAII - destructors run at the closing brace", "cpp", CPP_LIFE, [
    {"line": 14, "note": "`a` is constructed in main's frame.", "frames": [{"name": "main()", "vars": [ra]}], "heap": [], "out": "open A"},
    {"line": 16, "note": "Inside the inner `{ }` block, `b` is constructed too.", "frames": [{"name": "main()", "vars": [ra]}, {"name": "{ inner block }", "vars": [rb]}], "heap": [], "out": "open A\nopen B"},
    {"line": 17, "note": "`std::make_unique` creates a Resource on the **heap**, owned by the smart pointer `c` (which itself lives on the stack).",
     "frames": [{"name": "main()", "vars": [ra]}, {"name": "{ inner block }", "vars": [rb, var("c (unique_ptr)", ref="h")]}],
     "heap": [obj("h", "Resource (heap)", [var("name_", '"C"')])], "out": "open A\nopen B\nopen C"},
    {"line": 18, "note": "At `}` every object of the block is destroyed **in reverse order of construction**: `c`'s destructor deletes the heap Resource ('close C'), then `b` ('close B'). No `delete` anywhere. This is **RAII**: *Resource Acquisition Is Initialisation*.",
     "frames": [{"name": "main()", "vars": [ra]}], "heap": [obj("h", "Resource (heap)", [var("name_", '"C"')], freed=True)], "out": "open A\nopen B\nopen C\nclose C\nclose B"},
    {"line": 21, "note": "When main ends, `a` is destroyed. The order is **deterministic**, so you know exactly when files close and locks release.",
     "frames": [], "heap": [], "out": "open A\nopen B\nopen C\nclose C\nclose B\nend of main\nclose A"},
])

JS_LIFE = '''class Resource {
  constructor(name) {
    this.name = name;
  }
}

let a = new Resource("A");
let b = a;
a = null;
console.log(b.name);    // still reachable through b
b = null;               // unreachable now: the garbage collector may free it later
console.log("done");
'''
jr = lambda label="Resource object", **k: obj("r", label, [var("name", '"A"')], **k)
save("js-lifecycle", "JavaScript: objects live while they are reachable", "javascript", JS_LIFE, [
    {"line": 7, "note": "`a` refers to the new object.", "frames": [{"name": "global scope", "vars": [var("a", ref="r"), var("b", "<uninitialised>")]}], "heap": [jr()]},
    {"line": 8, "note": "`b = a` - two references to one object.", "frames": [{"name": "global scope", "vars": [var("a", ref="r"), var("b", ref="r")]}], "heap": [jr()]},
    {"line": 10, "note": "`a = null` only changes the variable. The object is still **reachable** through `b`.",
     "frames": [{"name": "global scope", "vars": [var("a", "null"), var("b", ref="r")]}], "heap": [jr()], "out": "A"},
    {"line": 11, "note": "Now nothing reaches the object. The **garbage collector** will reclaim it *at some point*. JS has no destructors and no guarantee of *when*. Clean up explicitly (`close()`, `try/finally`) for files and sockets.",
     "frames": [{"name": "global scope", "vars": [var("a", "null"), var("b", "null")]}], "heap": [jr(freed=True, label="Resource object - unreachable")], "out": "A"},
    {"line": 12, "note": "Python frees immediately at count 0, C++ at the closing brace, JavaScript whenever the GC runs.",
     "frames": [{"name": "global scope", "vars": [var("a", "null"), var("b", "null")]}], "heap": [], "out": "A\ndone"},
])

print("traces written:", sorted(p.name for p in OUT.glob("*.json")))
