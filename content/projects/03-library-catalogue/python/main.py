"""Library catalogue - abstraction, polymorphism, composition and the observer pattern."""
# ── Step 1: An error type and the abstract Item ──
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Callable


class LibraryError(Exception):
    pass


def money(cents: int) -> str:
    return f"{cents // 100}.{cents % 100:02d}"


class Item(ABC):
    def __init__(self, item_id: str, title: str, year: int) -> None:
        self.id = item_id
        self.title = title
        self.year = year

    @abstractmethod
    def loan_days(self) -> int: ...

    @abstractmethod
    def daily_fine(self) -> int: ...

    def can_borrow(self) -> bool:
        return True

    def matches(self, query: str) -> bool:
        return query.lower() in self.title.lower()

    def __str__(self) -> str:
        return f"[{self.id}] {self.title} ({self.year}, {type(self).__name__})"


# ── Step 2: Book, DVD and Magazine ──
class Book(Item):
    def __init__(self, item_id: str, title: str, year: int, author: str) -> None:
        super().__init__(item_id, title, year)
        self.author = author

    def loan_days(self) -> int:
        return 21

    def daily_fine(self) -> int:
        return 25

    def matches(self, query: str) -> bool:
        return super().matches(query) or query.lower() in self.author.lower()


class Dvd(Item):
    def loan_days(self) -> int:
        return 7

    def daily_fine(self) -> int:
        return 100


class Magazine(Item):
    def loan_days(self) -> int:
        return 0

    def daily_fine(self) -> int:
        return 0

    def can_borrow(self) -> bool:
        return False


# ── Step 3: Members and plans - composition instead of inheritance ──
@dataclass(frozen=True)
class Plan:
    name: str
    max_loans: int
    fine_percent: int          # 100 = full fine, 50 = half price


STANDARD = Plan("Standard", 2, 100)
STUDENT = Plan("Student", 3, 50)


@dataclass
class Member:
    name: str
    plan: Plan


# ── Step 4: The Loan ──
@dataclass
class Loan:
    item: Item
    member: Member
    due_day: int

    def days_late(self, today: int) -> int:
        return max(0, today - self.due_day)

    def fine(self, today: int) -> int:
        return self.days_late(today) * self.item.daily_fine() * self.member.plan.fine_percent // 100


# ── Step 5: The Library - encapsulation and the observer pattern ──
Listener = Callable[[str, str], None]


class Library:
    def __init__(self) -> None:
        self._items: dict[str, Item] = {}
        self._loans: dict[str, Loan] = {}
        self._listeners: list[Listener] = []

    def subscribe(self, listener: Listener) -> None:
        self._listeners.append(listener)

    def _publish(self, event: str, message: str) -> None:
        for listener in self._listeners:
            listener(event, message)

    def add(self, item: Item) -> None:
        self._items[item.id] = item

    def loans_of(self, member: Member) -> list[Loan]:
        return [loan for loan in self._loans.values() if loan.member is member]

    def borrow(self, member: Member, item_id: str, today: int) -> Loan:
        item = self._items.get(item_id)
        if item is None:
            raise LibraryError(f"no item {item_id}")
        if not item.can_borrow():
            raise LibraryError(f"'{item.title}' is reference-only")
        if item_id in self._loans:
            raise LibraryError(f"'{item.title}' is already on loan")
        if len(self.loans_of(member)) >= member.plan.max_loans:
            raise LibraryError(f"{member.name} reached the {member.plan.name} limit of {member.plan.max_loans}")
        loan = Loan(item, member, today + item.loan_days())
        self._loans[item_id] = loan
        self._publish("borrow", f"{member.name} borrowed '{item.title}', due day {loan.due_day}")
        return loan

    def give_back(self, item_id: str, today: int) -> int:
        loan = self._loans.pop(item_id, None)
        if loan is None:
            raise LibraryError(f"{item_id} is not on loan")
        fine = loan.fine(today)
        late = f", {loan.days_late(today)} days late, fine {money(fine)}" if fine else ", on time"
        self._publish("return", f"{loan.member.name} returned '{loan.item.title}'{late}")
        return fine

    def search(self, query: str) -> list[Item]:
        return [item for item in self._items.values() if item.matches(query)]

    def overdue(self, today: int) -> list[Loan]:
        return sorted((l for l in self._loans.values() if l.days_late(today)), key=lambda l: l.due_day)


# ── Step 6: Try it out ──
def main() -> None:
    library = Library()
    library.subscribe(lambda event, message: print(f"  [{event}] {message}"))
    for item in [Book("B1", "Clean Code", 2008, "Robert C. Martin"),
                 Book("B2", "Design Patterns", 1994, "Gamma, Helm, Johnson, Vlissides"),
                 Dvd("D1", "The Matrix", 1999),
                 Magazine("M1", "Byte", 1985)]:
        library.add(item)

    ada = Member("Ada", STANDARD)
    linus = Member("Linus", STUDENT)

    print("day 1")
    requests = [(ada, "B1"), (ada, "D1"), (ada, "B2"), (linus, "M1"), (linus, "B2"), (linus, "B1")]
    for member, item_id in requests:
        try:
            library.borrow(member, item_id, today=1)
        except LibraryError as error:
            print(f"  refused: {error}")

    print("day 12")
    library.give_back("D1", today=12)
    print("day 30")
    library.give_back("B2", today=30)

    for query in ("design", "martin", "matrix"):
        print(f"search '{query}':", ", ".join(str(item) for item in library.search(query)))
    for loan in library.overdue(today=30):
        print(f"overdue: '{loan.item.title}' ({loan.member.name}), fine so far {money(loan.fine(30))}")


if __name__ == "__main__":
    main()
