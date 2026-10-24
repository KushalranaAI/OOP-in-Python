"""Bank account system - classes, encapsulation, inheritance and composition."""
# ── Step 1: Transaction, errors and a money helper ──
from __future__ import annotations

from dataclasses import dataclass


def money(cents: int) -> str:
    sign = "-" if cents < 0 else ""
    return f"{sign}{abs(cents) // 100}.{abs(cents) % 100:02d}"


class InsufficientFunds(Exception):
    def __init__(self, balance: int, requested: int) -> None:
        super().__init__(f"balance {money(balance)}, tried to withdraw {money(requested)}")


@dataclass(frozen=True)
class Transaction:
    kind: str
    amount: int
    balance_after: int


# ── Step 2: Account - the balance is private ──
class Account:
    def __init__(self, owner: str, number: int) -> None:
        self.owner = owner
        self.number = number
        self._balance = 0
        self._history: list[Transaction] = []

    @property
    def balance(self) -> int:
        return self._balance

    def deposit(self, amount: int) -> None:
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self._apply("deposit", amount)

    def withdraw(self, amount: int) -> None:
        if amount <= 0:
            raise ValueError("withdrawal must be positive")
        self._check_withdraw(amount)
        self._apply("withdraw", -amount)

    def _check_withdraw(self, amount: int) -> None:
        if amount > self._balance:
            raise InsufficientFunds(self._balance, amount)

    def _apply(self, kind: str, signed_amount: int) -> None:
        self._balance += signed_amount
        self._history.append(Transaction(kind, signed_amount, self._balance))

    def statement(self) -> str:
        lines = [f"#{self.number} {self.owner} ({type(self).__name__})"]
        lines += [f"  {t.kind:<9}{money(t.amount):>9}{money(t.balance_after):>10}" for t in self._history]
        return "\n".join(lines)


# ── Step 3: SavingsAccount - inherit, override, extend ──
class SavingsAccount(Account):
    MAX_WITHDRAWALS = 3

    def __init__(self, owner: str, number: int, rate_bp: int = 150) -> None:
        super().__init__(owner, number)
        self._rate_bp = rate_bp            # basis points per month: 150 = 1.5%
        self._withdrawals = 0

    def _check_withdraw(self, amount: int) -> None:
        super()._check_withdraw(amount)
        if self._withdrawals >= self.MAX_WITHDRAWALS:
            raise PermissionError(f"limit of {self.MAX_WITHDRAWALS} withdrawals reached")

    def withdraw(self, amount: int) -> None:
        super().withdraw(amount)
        self._withdrawals += 1

    def add_interest(self) -> int:
        interest = self.balance * self._rate_bp // 10_000
        if interest > 0:
            self._apply("interest", interest)
        return interest


# ── Step 4: Bank - owns accounts (composition) ──
class Bank:
    def __init__(self, name: str) -> None:
        self.name = name
        self._accounts: dict[int, Account] = {}
        self._next_number = 1001

    def open(self, owner: str, savings: bool = False) -> Account:
        cls = SavingsAccount if savings else Account
        account = cls(owner, self._next_number)
        self._accounts[account.number] = account
        self._next_number += 1
        return account

    def transfer(self, source: int, target: int, amount: int) -> None:
        self._accounts[source].withdraw(amount)
        self._accounts[target].deposit(amount)

    def total(self) -> int:
        return sum(a.balance for a in self._accounts.values())


# ── Step 5: Try it out ──
def main() -> None:
    bank = Bank("OOP Bank")
    ada = bank.open("Ada")
    bob = bank.open("Bob", savings=True)

    ada.deposit(50_000)
    bob.deposit(120_000)
    ada.withdraw(12_550)
    try:
        ada.withdraw(1_000_000)
    except InsufficientFunds as error:
        print("rejected:", error)
    try:
        ada.deposit(-5)
    except ValueError as error:
        print("rejected:", error)

    print("interest paid:", money(bob.add_interest()))
    for _ in range(3):
        bob.withdraw(1_000)
    try:
        bob.withdraw(1_000)
    except PermissionError as error:
        print("rejected:", error)

    bank.transfer(ada.number, bob.number, 7_450)
    print(ada.statement())
    print(bob.statement())
    print("bank total:", money(bank.total()))


if __name__ == "__main__":
    main()
