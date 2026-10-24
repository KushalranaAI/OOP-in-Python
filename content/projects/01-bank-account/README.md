---
title: Bank account system
order: 1
icon: 🏦
level: Beginner
summary: Accounts that protect their balance, a savings account that earns interest, a transaction history and a bank that ties it all together.
concepts: [02-classes-and-objects, 03-attributes-and-methods, 04-encapsulation, 06-inheritance]
requirements:
  - Money is stored as whole cents (never floats) and printed as 12.34
  - "An account has an owner, a number and a balance that can't be set directly from outside"
  - Deposits and withdrawals must be positive; overdrawing raises a custom InsufficientFunds error
  - Every change is recorded as a Transaction (kind, amount, balance after)
  - A SavingsAccount is an Account that can add monthly interest and allows at most 3 withdrawals
  - "A Bank opens accounts (numbering them automatically) and can transfer money between them"
design: |
  classDiagram
    class Transaction {
      +kind
      +amount
      +balance_after
    }
    class Account {
      -balance
      -history
      +owner
      +number
      +deposit(amount)
      +withdraw(amount)
      +balance()
      +statement()
    }
    class SavingsAccount {
      -rate_bp
      -withdrawals
      +add_interest()
      +withdraw(amount)
    }
    class Bank {
      -accounts
      +open(owner, kind)
      +transfer(from, to, amount)
    }
    Account <|-- SavingsAccount
    Account *-- Transaction : history
    Bank o-- Account
steps:
  - title: Model a transaction and the errors
    body: |
      Start with the smallest pieces. A **Transaction** is a simple value object: it just holds data. Make it immutable
      (`frozen=True`, `const` members, `Object.freeze`) so history can't be rewritten.

      Define an **InsufficientFunds** exception class too. Errors are objects, and a custom type lets callers catch
      *exactly* this problem. The `money()` helper turns cents into text in one place.
  - title: The Account class - encapsulate the balance
    body: |
      The balance is **private** (`_balance`, `balance_`, `#balance`). The only ways to change it are `deposit` and
      `withdraw`, and both **validate** their input. That's encapsulation: the object guarantees its own rules
      (its *invariants*), so a balance can never go negative by accident.

      `withdraw` is split into a check (`_check_withdraw`) and the actual change. The next step overrides the check.
  - title: SavingsAccount - inherit and extend
    body: |
      A savings account **is an** account, with two differences: it earns interest and limits withdrawals. Inherit
      everything, call the parent constructor, and **override** only what's different.

      Notice the override calls the parent's version (`super()` / `Account::`) and then adds its own rule. Interest is
      stored in **basis points** (1 bp = 0.01%) so all the maths stays in whole numbers.
  - title: The Bank - composition
    body: |
      A bank **has** accounts, but it isn't one. It keeps them in a dictionary/map keyed by account number, hands out
      numbers itself, and implements `transfer` on top of the accounts' own public methods. It never touches a
      balance directly.

      The bank owns its accounts. In C++ that's explicit: `std::unique_ptr<Account>` in a `std::map`, so the accounts
      are destroyed with the bank, and polymorphism (Account vs SavingsAccount) still works.
  - title: Try it out
    body: |
      The `main` program exercises every rule: deposits, an overdraft that's rejected, interest, the withdrawal limit
      and a transfer. Run the complete program below, then try the extension ideas.
---

## Extension ideas
1. Add a `CheckingAccount` with an overdraft limit. Which method do you override?
2. Give `Bank` a `total_deposits()` method. Should it read private balances or use the public API?
3. Make transfers **atomic**: if the deposit fails, undo the withdrawal.
4. Add a monthly fee for accounts under a minimum balance. Is this a new class or a strategy object?
