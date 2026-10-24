"""Parking lot - inheritance, polymorphic rules, composition and the strategy pattern."""
# ── Step 1: Sizes and vehicles ──
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import IntEnum
from typing import Optional, Protocol


class ParkingError(Exception):
    pass


class Size(IntEnum):
    SMALL = 1
    MEDIUM = 2
    LARGE = 3


class Vehicle(ABC):
    def __init__(self, plate: str) -> None:
        self.plate = plate

    @abstractmethod
    def size(self) -> Size: ...

    def is_electric(self) -> bool:
        return False


class Motorcycle(Vehicle):
    def size(self) -> Size:
        return Size.SMALL


class Car(Vehicle):
    def size(self) -> Size:
        return Size.MEDIUM


class ElectricCar(Car):
    def is_electric(self) -> bool:
        return True


class Van(Vehicle):
    def size(self) -> Size:
        return Size.LARGE


# ── Step 2: Spots - each kind knows its own rules ──
class Spot:
    def __init__(self, spot_id: str, size: Size) -> None:
        self.id = spot_id
        self.size = size
        self.occupant: Optional[Vehicle] = None

    def is_free(self) -> bool:
        return self.occupant is None

    def accepts(self, vehicle: Vehicle) -> bool:
        return vehicle.size() <= self.size

    def score(self, vehicle: Vehicle) -> int:
        return 10 * self.size            # smaller spots are better matches


class ChargingSpot(Spot):
    def accepts(self, vehicle: Vehicle) -> bool:
        return vehicle.is_electric() and super().accepts(vehicle)

    def score(self, vehicle: Vehicle) -> int:
        return 0                         # the best possible place for an EV


# ── Step 3: Levels and tickets ──
class Level:
    def __init__(self, number: int, spots: list[Spot]) -> None:
        self.number = number
        self.spots = spots

    def best_spot(self, vehicle: Vehicle) -> Optional[Spot]:
        candidates = [s for s in self.spots if s.is_free() and s.accepts(vehicle)]
        return min(candidates, key=lambda s: s.score(vehicle), default=None)   # min keeps the first on ties

    def __str__(self) -> str:
        cells = [f"{s.id} {s.occupant.plate if s.occupant else 'free'}" for s in self.spots]
        return f"Level {self.number}: " + " | ".join(cells)


@dataclass(frozen=True)
class Ticket:
    number: int
    vehicle: Vehicle
    level: Level
    spot: Spot
    entry_minute: int


# ── Step 4: Pricing strategies ──
class PricingStrategy(Protocol):
    def fee(self, minutes: int, vehicle: Vehicle) -> int: ...


class HourlyPricing:
    RATES = {Size.SMALL: 100, Size.MEDIUM: 200, Size.LARGE: 400}

    def __init__(self, free_minutes: int = 15) -> None:
        self.free_minutes = free_minutes

    def fee(self, minutes: int, vehicle: Vehicle) -> int:
        if minutes <= self.free_minutes:
            return 0
        hours = -(-minutes // 60)                  # ceiling division: every started hour counts
        return hours * self.RATES[vehicle.size()]


class FlatPricing:
    def __init__(self, amount: int) -> None:
        self.amount = amount

    def fee(self, minutes: int, vehicle: Vehicle) -> int:
        return self.amount


# ── Step 5: The ParkingLot - a simple front door ──
def money(cents: int) -> str:
    return f"{cents // 100}.{cents % 100:02d}"


class ParkingLot:
    def __init__(self, levels: list[Level], pricing: PricingStrategy) -> None:
        self._levels = levels
        self._pricing = pricing
        self._tickets: dict[str, Ticket] = {}
        self._next_ticket = 1

    def set_pricing(self, pricing: PricingStrategy) -> None:
        self._pricing = pricing

    def park(self, vehicle: Vehicle, now: int) -> Ticket:
        if vehicle.plate in self._tickets:
            raise ParkingError(f"{vehicle.plate} is already parked")
        for level in self._levels:
            spot = level.best_spot(vehicle)
            if spot:
                spot.occupant = vehicle
                ticket = Ticket(self._next_ticket, vehicle, level, spot, now)
                self._tickets[vehicle.plate] = ticket
                self._next_ticket += 1
                return ticket
        raise ParkingError(f"no space for {vehicle.plate} ({vehicle.size().name.lower()})")

    def leave(self, plate: str, now: int) -> int:
        ticket = self._tickets.pop(plate, None)
        if ticket is None:
            raise ParkingError(f"no ticket for {plate}")
        ticket.spot.occupant = None
        return self._pricing.fee(now - ticket.entry_minute, ticket.vehicle)

    def report(self) -> str:
        return "\n".join(str(level) for level in self._levels)


# ── Step 6: Try it out ──
def main() -> None:
    lot = ParkingLot(
        [Level(1, [Spot("S1", Size.SMALL), Spot("M1", Size.MEDIUM), Spot("M2", Size.MEDIUM),
                   ChargingSpot("C1", Size.MEDIUM), Spot("L1", Size.LARGE)]),
         Level(2, [Spot("M3", Size.MEDIUM), Spot("L2", Size.LARGE)])],
        HourlyPricing(),
    )
    arrivals = [Motorcycle("MOTO-1"), Car("CAR-1"), ElectricCar("EV-1"), Car("CAR-2"),
                Van("VAN-1"), Car("CAR-3"), Car("CAR-4"), Motorcycle("MOTO-2")]
    for vehicle in arrivals:
        try:
            t = lot.park(vehicle, now=0)
            print(f"ticket #{t.number}: {vehicle.plate:<7} -> level {t.level.number}, spot {t.spot.id}")
        except ParkingError as error:
            print("refused:", error)
    print(lot.report())

    for plate, minute in [("MOTO-1", 50), ("CAR-1", 130), ("EV-1", 10)]:
        print(f"{plate} leaves after {minute} min, pays {money(lot.leave(plate, now=minute))}")
    lot.set_pricing(FlatPricing(500))
    print("-- event pricing: flat 5.00 --")
    print(f"VAN-1 leaves after 300 min, pays {money(lot.leave('VAN-1', now=300))}")

    t = lot.park(Motorcycle("MOTO-2"), now=300)
    print(f"ticket #{t.number}: MOTO-2  -> level {t.level.number}, spot {t.spot.id}")
    for action in (lambda: lot.park(Car("CAR-2"), now=301), lambda: lot.leave("NOPE-0", now=301)):
        try:
            action()
        except ParkingError as error:
            print("refused:", error)
    print(lot.report())


if __name__ == "__main__":
    main()
