### `__init__`, `__del__` and why you rarely want `__del__`

```py
class Resource:
    def __init__(self, name):
        self.name = name
        print("open", name)

    def __del__(self):                  # runs when CPython frees the object
        print("close", self.name)
```

`__del__` timing depends on references. A forgotten reference in a list, a cycle (`a.other = b; b.other = a`) or an
exception traceback can keep the object alive longer than you expect. For anything that **must** be cleaned up, use a
**context manager**:

```py
class Connection:
    def __enter__(self):
        print("connect")
        return self

    def __exit__(self, exc_type, exc, tb):      # runs even if the block raises
        print("disconnect")

with Connection() as conn:
    ...                                         # 'disconnect' is guaranteed here
```

### Copies

```py
import copy
shallow = copy.copy(team)        # new outer object, same inner objects
deep = copy.deepcopy(team)       # everything duplicated
```

Implement `__copy__`/`__deepcopy__` only for special cases.
