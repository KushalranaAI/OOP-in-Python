---
title: Turn-based RPG battle
order: 5
icon: ⚔️
level: Advanced
summary: Heroes against monsters. Every character type has its own AI, status effects hook into damage and turns, actions are command objects, and the battle engine publishes a log. It's fully deterministic thanks to an injected seeded dice.
concepts: [05-object-lifecycle, 06-inheritance, 07-polymorphism, 08-abstraction-and-interfaces, 09-composition-over-inheritance, 11-design-principles-and-patterns]
requirements:
  - "Characters have HP, attack, defense and speed; damage is attack + a dice bonus - defense (at least 1)"
  - "Heroes: a Warrior (raises a shield when hurt), a Mage (area Fireball that costs mana, or poison) and a Healer (heals the most-hurt ally)"
  - "Monsters: Goblins (attack a random hero), a Troll (regenerates every turn) and a Shaman (poisons every hero once)"
  - Status effects (Poison, Shield) last a number of turns and can change damage or act at the start of a turn
  - Each round, living characters act from fastest to slowest; the battle ends when one side is defeated (or after 20 rounds)
  - Randomness comes from a seeded Dice object passed in, so a battle can be replayed exactly (and tested)
design: |
  classDiagram
    class Character {
      <<abstract>>
      +hp
      +attack
      +defense
      +speed
      +take_damage(raw)
      +heal(amount)
      +start_turn(log)
      +choose_action(allies, enemies, dice)*
    }
    Character <|-- Warrior
    Character <|-- Mage
    Character <|-- Healer
    Character <|-- Goblin
    Character <|-- Troll
    Character <|-- Shaman
    class Effect {
      +turns
      +on_turn_start(target, log)
      +modify_damage(damage)
    }
    Effect <|-- Poison
    Effect <|-- Shield
    Character *-- Effect : effects
    class Action {
      <<abstract>>
      +execute(log)*
    }
    Action <|-- Attack
    Action <|-- Fireball
    Action <|-- Heal
    Action <|-- Cast
    Cast --> Effect : applies
    class Battle {
      +run()
      +subscribe(listener)
    }
    Battle o-- Character
    Battle --> Dice
steps:
  - title: Inject the randomness
    body: |
      Randomness makes programs hard to test. Instead of calling a global `random()`, the battle receives a **Dice
      object** (dependency injection). Ours is a 2-line seeded generator, written identically in every language, so
      the same seed always replays the same battle. Swap in a "loaded" dice in tests to force any situation.

      The **log** is just a function type: anything that accepts a string.
  - title: Status effects as hook objects
    body: |
      An `Effect` has **hooks** with do-nothing defaults: `on_turn_start` and `modify_damage`. Each subclass overrides only
      the hook it needs. Poison acts at the start of a turn; Shield halves damage. Characters hold a list of effects
      (**composition**), so any character can have any combination, and new effects need no changes to Character.

      *C++ note*: `Poison::on_turn_start` needs the complete `Character` class, so it's only **declared** here and
      **defined** after Character in step 3.
  - title: The Character base class
    body: |
      All shared mechanics live here, written once: taking damage (defense, then every effect's `modify_damage`), healing
      (capped at max HP), and `start_turn` (run effect hooks, count down and remove expired effects).

      The one thing that differs per character, **deciding what to do**, is the abstract `choose_action`. This
      structure (a base class with fixed steps that calls abstract or overridable hooks) is the **template method**
      pattern.
  - title: Actions are objects (the command pattern)
    body: |
      `choose_action` doesn't *do* anything. It returns an **Action object** that describes the move: `Attack`,
      `Fireball`, `Heal`, or `Cast` (apply an effect). The engine then calls `execute`. Separating deciding from doing
      means you could log, queue, undo or replay actions, or let a human player build them from keyboard input instead
      of the AI.
  - title: Heroes and monsters
    body: |
      Six small classes, each with its own **strategy** in `choose_action`, and some overriding `start_turn` while still
      calling the parent version: the Mage regains mana, the Troll regenerates (only if still alive!).

      There's no `if character.type == "troll"` anywhere. The engine calls the same two methods on everyone and
      **polymorphism** picks the right code.
  - title: The battle engine
    body: |
      The engine knows only the abstract `Character` and `Action` interfaces. Each round it sorts living characters by
      speed (a **stable** sort, so ties keep team order in every language), runs each turn, and checks for a winner.
      Everything it reports goes to subscribed listeners (the **observer** pattern), so the same engine could drive a
      console, a web page or a test that records the log.
  - title: Try it out
    body: |
      Run the battle and read the log: fireballs hitting every monster, poison ticking, the shield wall, the Troll
      regenerating. Then change the seed, the team, or a character's stats and run it again.
---

## Extension ideas
1. Add a `Rogue` hero whose attack ignores defense on a dice roll of 6. Which single method do you write?
2. Add a `Stun` effect that makes a character skip a turn. Which hook does Character need for that?
3. Write a test with a `LoadedDice` subclass that always rolls the maximum, and assert on the log.
4. Let a human control one hero: a `PlayerController` that builds actions from input. What interface do the AI and the player share?
5. Give every Action an `undo()` and add a "rewind one turn" feature.
