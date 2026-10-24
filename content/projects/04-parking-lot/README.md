---
title: Parking lot system
order: 4
icon: 🅿️
level: Intermediate
summary: A classic OOP design-interview problem. Vehicles of different sizes, spots (including EV charging spots) with their own rules, multi-level allocation, tickets, and pricing strategies you can swap at run time.
concepts: [06-inheritance, 07-polymorphism, 09-composition-over-inheritance, 11-design-principles-and-patterns]
requirements:
  - "Vehicles have a plate and a size: motorcycles are small, cars medium, vans large; electric cars are cars that need charging"
  - A vehicle fits any spot at least its size; a charging spot only accepts electric vehicles
  - "Allocation is best-fit: an EV prefers a charging spot, then the smallest spot that fits; lower levels first"
  - Parking issues a ticket with an entry time; a plate can't be parked twice
  - "Leaving frees the spot and charges a fee from the current pricing strategy (hourly by size with 15 free minutes, or a flat event rate)"
  - The lot can print its occupancy and refuses vehicles when there's no space
design: |
  classDiagram
    class Vehicle {
      <<abstract>>
      +plate
      +size()*
      +is_electric()
    }
    Vehicle <|-- Motorcycle
    Vehicle <|-- Car
    Car <|-- ElectricCar
    Vehicle <|-- Van
    class Spot {
      +id
      +size
      +occupant
      +accepts(vehicle)
      +score(vehicle)
    }
    Spot <|-- ChargingSpot
    class Level {
      +number
      +spots
      +best_spot(vehicle)
    }
    class PricingStrategy {
      <<interface>>
      +fee(minutes, vehicle)*
    }
    PricingStrategy <|.. HourlyPricing
    PricingStrategy <|.. FlatPricing
    class ParkingLot {
      -levels
      -tickets
      -pricing
      +park(vehicle, now)
      +leave(plate, now)
      +set_pricing(strategy)
    }
    ParkingLot *-- Level
    Level *-- Spot
    ParkingLot --> PricingStrategy
    ParkingLot *-- Ticket
steps:
  - title: Sizes and vehicles
    body: |
      Sizes are an **enum** with an order (small < medium < large), so "does it fit?" is a simple comparison.

      `Vehicle` is abstract. Each subclass answers `size()`. `ElectricCar` **is a** `Car` that also says
      `is_electric() → true`, a tiny override instead of a flag that every caller would have to check.
  - title: Spots - each kind knows its own rules
    body: |
      A `Spot` decides **itself** whether it accepts a vehicle and how good a match it is (`score`, lower is better).
      `ChargingSpot` overrides both: it only takes EVs, and it's their best possible match.

      The allocation code in the next step never checks spot types. It just asks every spot. Adding a "disabled
      parking" spot later means one new subclass.
  - title: Levels and tickets
    body: |
      A `Level` **owns** its spots and finds the best free one (lowest score, ties broken by position). A `Ticket` is a
      small record of who parked where and when.
  - title: Pricing strategies
    body: |
      How much to charge changes for business reasons (events, weekends, promotions), so it's pulled out into a
      **strategy** interface. `HourlyPricing` charges per started hour by vehicle size after a free period;
      `FlatPricing` charges a fixed amount. The lot can switch strategy at run time, which inheritance couldn't do.
  - title: The ParkingLot - a simple front door
    body: |
      `ParkingLot` is what the rest of the program talks to (a **facade**). It coordinates levels, tickets and pricing,
      and enforces the rules: no double parking, a clear error when full or when the plate is unknown.
  - title: Try it out
    body: |
      A busy evening: the lot fills up, a motorcycle is turned away, cars leave and pay hourly, the operator switches to
      event pricing, and the waiting motorcycle finally gets in.
---

## Extension ideas
1. Add a `DisabledSpot` that only accepts vehicles with a permit. Which classes change?
2. Let a large van use **two** adjacent medium spots when no large spot is free.
3. Add a `MonthlyPass` pricing decorator: free for registered plates, otherwise delegate to the wrapped strategy.
4. Notify a display board (observer) whenever the number of free spots changes.
