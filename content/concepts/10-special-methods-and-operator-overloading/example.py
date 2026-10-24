from __future__ import annotations

from functools import total_ordering


@total_ordering
class Money:
    def __init__(self, cents: int, currency: str = "USD") -> None:
        self.cents = cents
        self.currency = currency

    def __repr__(self) -> str:
        return f"Money({self.cents}, {self.currency!r})"

    def __str__(self) -> str:
        return f"{self.cents / 100:.2f} {self.currency}"

    def _check(self, other: Money) -> None:
        if self.currency != other.currency:
            raise ValueError(f"can't mix {self.currency} and {other.currency}")

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Money):
            return NotImplemented
        return (self.cents, self.currency) == (other.cents, other.currency)

    def __hash__(self) -> int:
        return hash((self.cents, self.currency))

    def __lt__(self, other: Money) -> bool:
        self._check(other)
        return self.cents < other.cents

    def __add__(self, other: Money) -> Money:
        self._check(other)
        return Money(self.cents + other.cents, self.currency)

    def __radd__(self, other: int) -> Money:        # makes sum() work: 0 + Money
        return self if other == 0 else NotImplemented

    def __mul__(self, factor: int) -> Money:
        return Money(self.cents * factor, self.currency)

    def __bool__(self) -> bool:
        return self.cents != 0


class Wallet:
    def __init__(self, *items: Money) -> None:
        self._items = list(items)

    def __len__(self) -> int:
        return len(self._items)

    def __iter__(self):
        return iter(self._items)

    def __getitem__(self, index: int) -> Money:
        return self._items[index]

    def __contains__(self, item: Money) -> bool:
        return item in self._items


coffee, cake = Money(350), Money(425)
print("str:", coffee, "| repr:", repr(coffee))
print("coffee + cake =", coffee + cake, "| coffee * 3 =", coffee * 3)
print("coffee < cake:", coffee < cake, "| coffee >= cake:", coffee >= cake, "(from total_ordering)")
print("equal values:", Money(350) == coffee, "| same object:", Money(350) is coffee)
print("as set keys:", len({Money(350), coffee, cake}), "unique amounts")

wallet = Wallet(coffee, cake, Money(100))
print("len:", len(wallet), "| first:", wallet[0], "| contains cake:", cake in wallet)
print("sum:", sum(wallet), "| sorted:", [str(m) for m in sorted(wallet)])
print("bool(Money(0)):", bool(Money(0)))
try:
    coffee + Money(100, "EUR")
except ValueError as error:
    print("error:", error)
