"""Turn-based RPG battle - abstract classes, polymorphic AI, status effects, command and observer patterns."""
# ── Step 1: Dice and the event log ──
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Callable

Log = Callable[[str], None]


class Dice:
    """A tiny seeded random generator (MINSTD). Same seed -> same battle, in all three languages."""

    def __init__(self, seed: int) -> None:
        self._state = seed

    def roll(self, sides: int) -> int:
        self._state = self._state * 48271 % 2147483647
        return self._state % sides + 1


# ── Step 2: Status effects ──
class Effect:
    name = "effect"

    def __init__(self, turns: int) -> None:
        self.turns = turns

    def on_turn_start(self, target: Character, log: Log) -> None:
        pass                                   # hook: subclasses override what they need

    def modify_damage(self, damage: int) -> int:
        return damage                          # hook


class Poison(Effect):
    name = "poison"

    def __init__(self, turns: int = 3, damage: int = 4) -> None:
        super().__init__(turns)
        self.damage = damage

    def on_turn_start(self, target: Character, log: Log) -> None:
        target.lose_hp(self.damage)
        log(f"{target.name} takes {self.damage} poison damage{target.defeat_note()}")


class Shield(Effect):
    name = "shield"

    def modify_damage(self, damage: int) -> int:
        return damage // 2


# ── Step 3: The Character base class ──
class Character(ABC):
    def __init__(self, name: str, hp: int, attack: int, defense: int, speed: int) -> None:
        self.name = name
        self.max_hp = self.hp = hp
        self.attack = attack
        self.defense = defense
        self.speed = speed
        self.effects: list[Effect] = []

    @property
    def alive(self) -> bool:
        return self.hp > 0

    def hp_percent(self) -> int:
        return self.hp * 100 // self.max_hp

    def has_effect(self, name: str) -> bool:
        return any(e.name == name for e in self.effects)

    def add_effect(self, effect: Effect) -> None:
        self.effects = [e for e in self.effects if e.name != effect.name] + [effect]

    def lose_hp(self, amount: int) -> None:
        self.hp = max(0, self.hp - amount)

    def take_damage(self, raw: int) -> int:
        damage = max(1, raw - self.defense)
        for effect in self.effects:
            damage = effect.modify_damage(damage)
        self.lose_hp(damage)
        return damage

    def heal(self, amount: int) -> int:
        before = self.hp
        self.hp = min(self.max_hp, self.hp + amount)
        return self.hp - before

    def defeat_note(self) -> str:
        return "" if self.alive else f" - {self.name} is defeated!"

    def start_turn(self, log: Log) -> None:
        for effect in list(self.effects):
            effect.on_turn_start(self, log)
            effect.turns -= 1
            if effect.turns == 0:
                self.effects.remove(effect)
                log(f"{self.name}'s {effect.name} wears off")

    @abstractmethod
    def choose_action(self, allies: list[Character], enemies: list[Character], dice: Dice) -> Action: ...

    def __str__(self) -> str:
        return f"{self.name:<7}{type(self).__name__:<8}{self.hp:>3}/{self.max_hp} HP"


def weakest(team: list[Character]) -> Character:
    return min(team, key=lambda c: c.hp)


def strongest(team: list[Character]) -> Character:
    return max(team, key=lambda c: c.hp)


# ── Step 4: Actions - the command pattern ──
class Action(ABC):
    def __init__(self, actor: Character) -> None:
        self.actor = actor

    @abstractmethod
    def execute(self, log: Log) -> None: ...


class Attack(Action):
    def __init__(self, actor: Character, target: Character, bonus: int) -> None:
        super().__init__(actor)
        self.target = target
        self.bonus = bonus

    def execute(self, log: Log) -> None:
        dealt = self.target.take_damage(self.actor.attack + self.bonus)
        log(f"{self.actor.name} hits {self.target.name} for {dealt}{self.target.defeat_note()}")


class Fireball(Action):
    COST = 30

    def __init__(self, actor: Mage, targets: list[Character], power: int) -> None:
        super().__init__(actor)
        self.targets = targets
        self.power = power

    def execute(self, log: Log) -> None:
        self.actor.mana -= self.COST
        log(f"{self.actor.name} casts Fireball!")
        for target in self.targets:
            dealt = target.take_damage(self.power)
            log(f"  {target.name} burns for {dealt}{target.defeat_note()}")


class Heal(Action):
    def __init__(self, actor: Character, target: Character, amount: int) -> None:
        super().__init__(actor)
        self.target = target
        self.amount = amount

    def execute(self, log: Log) -> None:
        healed = self.target.heal(self.amount)
        log(f"{self.actor.name} heals {self.target.name} for {healed} ({self.target.hp}/{self.target.max_hp})")


class Cast(Action):
    def __init__(self, actor: Character, target: Character, effect: Effect, message: str) -> None:
        super().__init__(actor)
        self.target = target
        self.effect = effect
        self.message = message

    def execute(self, log: Log) -> None:
        self.target.add_effect(self.effect)
        log(self.message)


# ── Step 5: Heroes and monsters - polymorphic behaviour ──
class Warrior(Character):
    def __init__(self, name: str) -> None:
        super().__init__(name, hp=60, attack=12, defense=5, speed=3)

    def choose_action(self, allies, enemies, dice):
        if self.hp_percent() < 50 and not self.has_effect("shield"):
            return Cast(self, self, Shield(2), f"{self.name} raises a shield wall")
        return Attack(self, weakest(enemies), dice.roll(6))


class Mage(Character):
    MAX_MANA = 50

    def __init__(self, name: str) -> None:
        super().__init__(name, hp=38, attack=6, defense=2, speed=5)
        self.mana = self.MAX_MANA

    def start_turn(self, log: Log) -> None:
        super().start_turn(log)
        self.mana = min(self.MAX_MANA, self.mana + 10)

    def choose_action(self, allies, enemies, dice):
        if self.mana >= Fireball.COST and len(enemies) >= 2:
            return Fireball(self, enemies, 8 + dice.roll(6))
        target = strongest(enemies)
        if not target.has_effect("poison"):
            return Cast(self, target, Poison(), f"{self.name} poisons {target.name}")
        return Attack(self, weakest(enemies), dice.roll(4))


class Healer(Character):
    def __init__(self, name: str) -> None:
        super().__init__(name, hp=45, attack=7, defense=3, speed=4)

    def choose_action(self, allies, enemies, dice):
        patient = min(allies, key=lambda c: c.hp_percent())
        if patient.hp_percent() < 60:
            return Heal(self, patient, 12 + dice.roll(6))
        return Attack(self, weakest(enemies), dice.roll(4))


class Goblin(Character):
    def __init__(self, name: str) -> None:
        super().__init__(name, hp=30, attack=9, defense=2, speed=6)

    def choose_action(self, allies, enemies, dice):
        target = enemies[dice.roll(len(enemies)) - 1]
        return Attack(self, target, dice.roll(6))


class Troll(Character):
    def __init__(self, name: str) -> None:
        super().__init__(name, hp=80, attack=14, defense=4, speed=1)

    def start_turn(self, log: Log) -> None:
        super().start_turn(log)
        if self.alive:
            healed = self.heal(5)
            if healed:
                log(f"{self.name} regenerates {healed} HP")

    def choose_action(self, allies, enemies, dice):
        return Attack(self, strongest(enemies), dice.roll(6))


class Shaman(Character):
    def __init__(self, name: str) -> None:
        super().__init__(name, hp=35, attack=5, defense=2, speed=4)

    def choose_action(self, allies, enemies, dice):
        for hero in enemies:
            if not hero.has_effect("poison"):
                return Cast(self, hero, Poison(3, 3), f"{self.name} curses {hero.name} with poison")
        return Attack(self, weakest(enemies), dice.roll(4))


# ── Step 6: The battle engine ──
class Battle:
    def __init__(self, heroes: list[Character], monsters: list[Character], dice: Dice) -> None:
        self.heroes = heroes
        self.monsters = monsters
        self.dice = dice
        self._listeners: list[Log] = []

    def subscribe(self, listener: Log) -> None:
        self._listeners.append(listener)

    def log(self, message: str) -> None:
        for listener in self._listeners:
            listener(message)

    @staticmethod
    def living(team: list[Character]) -> list[Character]:
        return [c for c in team if c.alive]

    def run(self, max_rounds: int = 20) -> str:
        for number in range(1, max_rounds + 1):
            self.log(f"-- round {number} --")
            order = sorted(self.living(self.heroes) + self.living(self.monsters), key=lambda c: -c.speed)
            for character in order:
                if not character.alive:
                    continue                     # defeated earlier this round
                character.start_turn(self.log)
                if not character.alive:
                    continue                     # the poison got them
                own, other = (self.heroes, self.monsters) if character in self.heroes else (self.monsters, self.heroes)
                enemies = self.living(other)
                if not enemies:
                    break
                character.choose_action(self.living(own), enemies, self.dice).execute(self.log)
            if not self.living(self.monsters):
                return "Heroes win"
            if not self.living(self.heroes):
                return "Monsters win"
        return "Draw"


# ── Step 7: Try it out ──
def main() -> None:
    heroes: list[Character] = [Warrior("Aria"), Mage("Merlin"), Healer("Sana")]
    monsters: list[Character] = [Goblin("Grub"), Goblin("Snag"), Troll("Brute"), Shaman("Hex")]
    battle = Battle(heroes, monsters, Dice(seed=2024))
    battle.subscribe(print)
    result = battle.run()
    print(f"== {result} after the dust settles ==")
    for character in heroes + monsters:
        print(" ", character)


if __name__ == "__main__":
    main()
