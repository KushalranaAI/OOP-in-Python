from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Protocol


# --- Strategy (open/closed: new pricing rules need no changes to Checkout) ---
class PricingStrategy(Protocol):
    def price(self, total: float) -> float: ...


class Regular:
    def price(self, total: float) -> float:
        return total


@dataclass
class PercentOff:
    percent: float

    def price(self, total: float) -> float:
        return round(total * (1 - self.percent / 100), 2)


# --- Observer ---
@dataclass
class EventBus:
    _subscribers: dict[str, list[Callable[[dict], None]]] = field(default_factory=dict)

    def subscribe(self, event: str, handler: Callable[[dict], None]) -> None:
        self._subscribers.setdefault(event, []).append(handler)

    def publish(self, event: str, data: dict) -> None:
        for handler in self._subscribers.get(event, []):
            handler(data)


# --- Single responsibility + dependency inversion ---
class Checkout:
    def __init__(self, pricing: PricingStrategy, bus: EventBus) -> None:
        self.pricing = pricing
        self.bus = bus

    def pay(self, total: float) -> float:
        charged = self.pricing.price(total)
        self.bus.publish("paid", {"total": total, "charged": charged})
        return charged


# --- Factory with auto-registration ---
class Shape:
    registry: dict[str, type[Shape]] = {}

    def __init_subclass__(cls, **kwargs) -> None:
        super().__init_subclass__(**kwargs)
        Shape.registry[cls.__name__.lower()] = cls

    @classmethod
    def create(cls, kind: str, size: float) -> Shape:
        try:
            return cls.registry[kind](size)
        except KeyError:
            raise ValueError(f"unknown shape {kind!r}; known: {sorted(cls.registry)}") from None


class Circle(Shape):
    def __init__(self, r: float) -> None:
        self.area = round(3.14159 * r * r, 2)


class Square(Shape):
    def __init__(self, s: float) -> None:
        self.area = s * s


bus = EventBus()
audit: list[str] = []
bus.subscribe("paid", lambda e: print(f"  receipt: charged {e['charged']} (was {e['total']})"))
bus.subscribe("paid", lambda e: audit.append(f"paid {e['charged']}"))

for strategy in (Regular(), PercentOff(20)):
    print(type(strategy).__name__, "→", Checkout(strategy, bus).pay(50.0))
print("audit log:", audit)

for kind in ("circle", "square"):
    shape = Shape.create(kind, 2)
    print(f"factory made a {type(shape).__name__} with area {shape.area}")
try:
    Shape.create("hexagon", 1)
except ValueError as error:
    print("error:", error)
