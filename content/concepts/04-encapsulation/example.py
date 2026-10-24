class Account:
    def __init__(self, owner: str) -> None:
        self.owner = owner
        self._history: list[str] = []         # internal by convention
        self.__balance = 0                    # name-mangled

    @property
    def balance(self) -> int:
        return self.__balance

    def deposit(self, amount: int) -> None:
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self.__balance += amount
        self._history.append(f"deposit {amount}")


class Savings(Account):
    def peek(self) -> str:
        try:
            return str(self.__balance)        # becomes self._Savings__balance!
        except AttributeError as error:
            return f"AttributeError: {error}"


acct = Savings("Ada")
acct.deposit(100)
print("balance:", acct.balance)

try:
    acct.balance = 1_000_000                  # property without a setter
except AttributeError as error:
    print("can't set:", error)

try:
    acct.deposit(-5)
except ValueError as error:
    print("rule enforced:", error)

print("subclass peek ->", acct.peek())
print("mangled name exists:", "_Account__balance" in acct.__dict__)
print("…and can still be reached deliberately:", acct._Account__balance)
