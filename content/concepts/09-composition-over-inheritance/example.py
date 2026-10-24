from typing import Callable, Protocol


class FlyBehaviour(Protocol):
    def fly(self) -> str: ...


class FlyWithWings:
    def fly(self) -> str:
        return "flaps its wings"


class CannotFly:
    def fly(self) -> str:
        return "can't fly"


class RocketPowered:
    def fly(self) -> str:
        return "zooms on a rocket 🚀"


class Duck:
    def __init__(self, name: str, fly_behaviour: FlyBehaviour, quack: Callable[[], str]) -> None:
        self.name = name
        self.fly_behaviour = fly_behaviour          # HAS-A
        self.quack = quack                          # a strategy can be a plain function

    def perform_fly(self) -> str:
        return f"{self.name} {self.fly_behaviour.fly()}"   # delegate


mallard = Duck("Mallard", FlyWithWings(), lambda: "Quack!")
rubber = Duck("Rubber duck", CannotFly(), lambda: "Squeak!")
for duck in (mallard, rubber):
    print(duck.perform_fly(), "and says", duck.quack())

rubber.fly_behaviour = RocketPowered()              # change behaviour at run time
print("after the upgrade:", rubber.perform_fly())


class Engine:
    def __init__(self, horsepower: int) -> None:
        self.horsepower = horsepower

    def start(self) -> str:
        return f"{self.horsepower}hp engine started"


class FakeEngine:                                   # for tests - same interface
    def start(self) -> str:
        return "pretend engine started"


class Car:
    def __init__(self, model: str, engine) -> None:
        self.model = model
        self.engine = engine

    def start(self) -> str:
        return f"{self.model}: {self.engine.start()}"


print(Car("Roadster", Engine(300)).start())
print(Car("Test car", FakeEngine()).start())
