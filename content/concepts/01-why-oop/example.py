# Procedural vs object-oriented: the same bank account, twice.

# --- procedural: data and functions are separate; nothing protects the balance
balance = 100


def withdraw(current: int, amount: int) -> int:
    return current - amount


balance = withdraw(balance, 30)
balance = -9999                       # any code can do this - the rule is broken silently
print("procedural balance:", balance)


# --- object-oriented: the object guards its own data
class Account:
    def __init__(self, owner: str, balance: int = 0) -> None:
        self.owner = owner
        self._balance = balance       # leading underscore = internal

    @property
    def balance(self) -> int:         # read-only from outside
        return self._balance

    def withdraw(self, amount: int) -> None:
        if amount > self._balance:
            raise ValueError("insufficient funds")
        self._balance -= amount


acct = Account("Ada", 100)
acct.withdraw(30)
try:
    acct.withdraw(500)
except ValueError as error:
    print("refused:", error)
print(acct.owner, "has", acct.balance)
