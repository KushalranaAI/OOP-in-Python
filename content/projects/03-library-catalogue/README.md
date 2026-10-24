---
title: Library catalogue and loans
order: 3
icon: 📚
level: Intermediate
summary: Books, DVDs and reference-only magazines; members whose plan sets their loan limit and fine discount; loans with due dates and fines; a library that publishes events to listeners.
concepts: [04-encapsulation, 07-polymorphism, 08-abstraction-and-interfaces, 09-composition-over-inheritance, 11-design-principles-and-patterns]
requirements:
  - Every catalogue item has an id, title and year; each kind decides its own loan period and daily fine
  - Magazines are reference-only and can't be borrowed
  - "Search matches titles, and for books also the author - each item type decides what \"matches\" means"
  - A member's plan (Standard, Student) sets how many items they may borrow and the discount on fines
  - Borrowing checks the plan's limit and whether the item is already out; returning computes the fine
  - The library notifies any number of listeners (a log, an email service…) about borrows and returns
  - "Time is a simple day number, so the program is deterministic and testable"
design: |
  classDiagram
    class Item {
      <<abstract>>
      +id
      +title
      +year
      +loan_days()*
      +daily_fine()*
      +can_borrow()
      +matches(query)
    }
    Item <|-- Book
    Item <|-- Dvd
    Item <|-- Magazine
    class Plan {
      +name
      +max_loans
      +fine_percent
    }
    class Member {
      +name
      +plan
    }
    class Loan {
      +item
      +member
      +due_day
      +fine(today)
    }
    class Library {
      -items
      -loans
      -listeners
      +add(item)
      +borrow(member, item_id, today)
      +give_back(item_id, today)
      +search(query)
      +subscribe(listener)
    }
    Member --> Plan : has a
    Loan --> Item
    Loan --> Member
    Library o-- Item
    Library *-- Loan
steps:
  - title: An error type and the abstract Item
    body: |
      One custom exception, `LibraryError`, covers every rule violation, so callers can catch exactly that.

      `Item` is abstract. It stores the shared data and declares **what varies**: `loan_days` and `daily_fine`. It also
      provides sensible defaults that subclasses may override: `can_borrow()` returns true, and `matches()` checks the
      title.
  - title: Book, DVD and Magazine
    body: |
      Each subclass is short because the base class does the shared work. `Book` **extends** `matches` to also search
      the author (it calls the parent's version first). `Magazine` overrides `can_borrow`.

      The library code will never write `if item is a Book`: it just calls these methods. That's polymorphism.
  - title: Members and plans - composition instead of inheritance
    body: |
      You *could* write `StudentMember extends Member`, but then a member couldn't switch plans, and every new rule would
      need another subclass. Instead a `Member` **has a** `Plan`, a small immutable value object. Changing plan is one
      assignment, and adding a "Senior" plan is one line.
  - title: The Loan
    body: |
      A loan connects an item and a member and knows its due day. It computes its own fine: days late × the item's daily
      fine, then the member's plan discount. Each object answers questions about its own data. That's **information
      expert**, a core responsibility-assignment rule.
  - title: The Library - encapsulation and the observer pattern
    body: |
      The library keeps its catalogue and loans private and enforces every rule in `borrow` and `give_back`. Instead of
      printing (or emailing, or logging) directly, it **publishes events** to subscribed listeners. The library doesn't
      know or care what they do. Tomorrow you can add an SMS listener without touching the library.
  - title: Try it out
    body: |
      The scenario runs a month in the library: loans, refused requests, late returns with fines (one with a student
      discount), searching, and an overdue report.
---

## Extension ideas
1. Add reservations: a member can reserve an item that's out, and gets notified (through a listener!) when it's returned.
2. Add a `Senior` plan with 4 loans and no fines. How many classes did you touch?
3. Persist the catalogue to JSON: `to_dict()` on each item plus a factory that recreates the right class.
4. Allow renewals, at most twice, and only if nobody has reserved the item.
