In Python **everything is an object**: numbers, strings, functions, even classes. That's why you can call methods on
literals:

```py
(3).bit_length()        # 2
"hello".upper()         # 'HELLO'
type(len)               # <class 'builtin_function_or_method'>
```

A class is created with `class`, objects by *calling* the class like a function. Python is dynamically typed, so the
class doesn't declare its attributes up front. They're created when `__init__` assigns them. Type hints and
`@dataclass` (chapter 2) add structure.
