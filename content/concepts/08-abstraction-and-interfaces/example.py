from abc import ABC, abstractmethod
from typing import Protocol


class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    def describe(self) -> str:
        return f"{type(self).__name__} with area {self.area():.2f}"


class Square(Shape):
    def __init__(self, side: float) -> None:
        self.side = side

    def area(self) -> float:
        return self.side ** 2


class HalfDone(Shape):                    # forgot to implement area()
    pass


for cls in (Shape, HalfDone):
    try:
        cls()
    except TypeError as error:
        print(f"{cls.__name__}: {error}")
print(Square(3).describe())


class Notifier(Protocol):
    def send(self, message: str) -> None: ...


class EmailNotifier:
    def send(self, message: str) -> None:
        print(f"  email: {message}")


class FakeNotifier:                       # for tests: remembers instead of sending
    def __init__(self) -> None:
        self.sent: list[str] = []

    def send(self, message: str) -> None:
        self.sent.append(message)


class OrderService:
    def __init__(self, notifier: Notifier) -> None:
        self.notifier = notifier

    def place_order(self, item: str) -> None:
        self.notifier.send(f"order placed: {item}")


OrderService(EmailNotifier()).place_order("book")
fake = FakeNotifier()
OrderService(fake).place_order("pen")
print("the fake recorded:", fake.sent)
