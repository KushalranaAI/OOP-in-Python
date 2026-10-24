// Turn-based RPG battle - abstract classes, polymorphic AI, status effects, command and observer patterns.
// ── Step 1: Dice and the event log ──
class Dice {
  // A tiny seeded generator (MINSTD). Same seed -> same battle, in all three languages.
  #state;
  constructor(seed) {
    this.#state = seed;
  }
  roll(sides) {
    this.#state = (this.#state * 48271) % 2147483647; // stays below 2^53, so it's exact
    return (this.#state % sides) + 1;
  }
}

// ── Step 2: Status effects ──
class Effect {
  constructor(turns) {
    this.turns = turns;
  }
  get name() {
    return "effect";
  }
  onTurnStart(target, log) {} // hook: subclasses override what they need
  modifyDamage(damage) {
    return damage; // hook
  }
}

class Poison extends Effect {
  constructor(turns = 3, damage = 4) {
    super(turns);
    this.damage = damage;
  }
  get name() {
    return "poison";
  }
  onTurnStart(target, log) {
    target.loseHp(this.damage);
    log(`${target.name} takes ${this.damage} poison damage${target.defeatNote()}`);
  }
}

class Shield extends Effect {
  get name() {
    return "shield";
  }
  modifyDamage(damage) {
    return Math.floor(damage / 2);
  }
}

// ── Step 3: The Character base class ──
class Character {
  constructor(name, { hp, attack, defense, speed }) {
    if (new.target === Character) throw new TypeError("Character is abstract");
    Object.assign(this, { name, maxHp: hp, hp, attack, defense, speed });
    this.effects = [];
  }
  get alive() {
    return this.hp > 0;
  }
  hpPercent() {
    return Math.floor((this.hp * 100) / this.maxHp);
  }
  hasEffect(name) {
    return this.effects.some((e) => e.name === name);
  }
  addEffect(effect) {
    this.effects = [...this.effects.filter((e) => e.name !== effect.name), effect];
  }
  loseHp(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }
  takeDamage(raw) {
    let damage = Math.max(1, raw - this.defense);
    for (const effect of this.effects) damage = effect.modifyDamage(damage);
    this.loseHp(damage);
    return damage;
  }
  heal(amount) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - before;
  }
  defeatNote() {
    return this.alive ? "" : ` - ${this.name} is defeated!`;
  }
  startTurn(log) {
    for (const effect of [...this.effects]) {
      effect.onTurnStart(this, log);
      effect.turns -= 1;
      if (effect.turns === 0) {
        this.effects = this.effects.filter((e) => e !== effect);
        log(`${this.name}'s ${effect.name} wears off`);
      }
    }
  }
  chooseAction(allies, enemies, dice) {
    throw new Error(`${this.constructor.name} must implement chooseAction()`);
  }
  toString() {
    return `${this.name.padEnd(7)}${this.constructor.name.padEnd(8)}${String(this.hp).padStart(3)}/${this.maxHp} HP`;
  }
}

const weakest = (team) => team.reduce((best, c) => (c.hp < best.hp ? c : best));
const strongest = (team) => team.reduce((best, c) => (c.hp > best.hp ? c : best));

// ── Step 4: Actions - the command pattern ──
class Action {
  constructor(actor) {
    this.actor = actor;
  }
  execute(log) {
    throw new Error("not implemented");
  }
}

class Attack extends Action {
  constructor(actor, target, bonus) {
    super(actor);
    Object.assign(this, { target, bonus });
  }
  execute(log) {
    const dealt = this.target.takeDamage(this.actor.attack + this.bonus);
    log(`${this.actor.name} hits ${this.target.name} for ${dealt}${this.target.defeatNote()}`);
  }
}

class Fireball extends Action {
  static COST = 30;
  constructor(actor, targets, power) {
    super(actor);
    Object.assign(this, { targets, power });
  }
  execute(log) {
    this.actor.mana -= Fireball.COST;
    log(`${this.actor.name} casts Fireball!`);
    for (const target of this.targets) {
      const dealt = target.takeDamage(this.power);
      log(`  ${target.name} burns for ${dealt}${target.defeatNote()}`);
    }
  }
}

class Heal extends Action {
  constructor(actor, target, amount) {
    super(actor);
    Object.assign(this, { target, amount });
  }
  execute(log) {
    const healed = this.target.heal(this.amount);
    log(`${this.actor.name} heals ${this.target.name} for ${healed} (${this.target.hp}/${this.target.maxHp})`);
  }
}

class Cast extends Action {
  constructor(actor, target, effect, message) {
    super(actor);
    Object.assign(this, { target, effect, message });
  }
  execute(log) {
    this.target.addEffect(this.effect);
    log(this.message);
  }
}

// ── Step 5: Heroes and monsters - polymorphic behaviour ──
class Warrior extends Character {
  constructor(name) {
    super(name, { hp: 60, attack: 12, defense: 5, speed: 3 });
  }
  chooseAction(allies, enemies, dice) {
    if (this.hpPercent() < 50 && !this.hasEffect("shield")) {
      return new Cast(this, this, new Shield(2), `${this.name} raises a shield wall`);
    }
    return new Attack(this, weakest(enemies), dice.roll(6));
  }
}

class Mage extends Character {
  static MAX_MANA = 50;
  constructor(name) {
    super(name, { hp: 38, attack: 6, defense: 2, speed: 5 });
    this.mana = Mage.MAX_MANA;
  }
  startTurn(log) {
    super.startTurn(log);
    this.mana = Math.min(Mage.MAX_MANA, this.mana + 10);
  }
  chooseAction(allies, enemies, dice) {
    if (this.mana >= Fireball.COST && enemies.length >= 2) return new Fireball(this, enemies, 8 + dice.roll(6));
    const target = strongest(enemies);
    if (!target.hasEffect("poison")) return new Cast(this, target, new Poison(), `${this.name} poisons ${target.name}`);
    return new Attack(this, weakest(enemies), dice.roll(4));
  }
}

class Healer extends Character {
  constructor(name) {
    super(name, { hp: 45, attack: 7, defense: 3, speed: 4 });
  }
  chooseAction(allies, enemies, dice) {
    const patient = allies.reduce((best, c) => (c.hpPercent() < best.hpPercent() ? c : best));
    if (patient.hpPercent() < 60) return new Heal(this, patient, 12 + dice.roll(6));
    return new Attack(this, weakest(enemies), dice.roll(4));
  }
}

class Goblin extends Character {
  constructor(name) {
    super(name, { hp: 30, attack: 9, defense: 2, speed: 6 });
  }
  chooseAction(allies, enemies, dice) {
    const target = enemies[dice.roll(enemies.length) - 1];
    return new Attack(this, target, dice.roll(6));
  }
}

class Troll extends Character {
  constructor(name) {
    super(name, { hp: 80, attack: 14, defense: 4, speed: 1 });
  }
  startTurn(log) {
    super.startTurn(log);
    if (this.alive) {
      const healed = this.heal(5);
      if (healed) log(`${this.name} regenerates ${healed} HP`);
    }
  }
  chooseAction(allies, enemies, dice) {
    return new Attack(this, strongest(enemies), dice.roll(6));
  }
}

class Shaman extends Character {
  constructor(name) {
    super(name, { hp: 35, attack: 5, defense: 2, speed: 4 });
  }
  chooseAction(allies, enemies, dice) {
    const hero = enemies.find((h) => !h.hasEffect("poison"));
    if (hero) return new Cast(this, hero, new Poison(3, 3), `${this.name} curses ${hero.name} with poison`);
    return new Attack(this, weakest(enemies), dice.roll(4));
  }
}

// ── Step 6: The battle engine ──
class Battle {
  #listeners = [];
  constructor(heroes, monsters, dice) {
    Object.assign(this, { heroes, monsters, dice });
  }
  subscribe(listener) {
    this.#listeners.push(listener);
  }
  log = (message) => {
    for (const listener of this.#listeners) listener(message); // an arrow field keeps `this` when passed around
  };
  static living(team) {
    return team.filter((c) => c.alive);
  }
  run(maxRounds = 20) {
    for (let number = 1; number <= maxRounds; number++) {
      this.log(`-- round ${number} --`);
      const order = [...Battle.living(this.heroes), ...Battle.living(this.monsters)].sort((a, b) => b.speed - a.speed);
      for (const character of order) {
        if (!character.alive) continue; // defeated earlier this round
        character.startTurn(this.log);
        if (!character.alive) continue; // the poison got them
        const isHero = this.heroes.includes(character);
        const enemies = Battle.living(isHero ? this.monsters : this.heroes);
        if (enemies.length === 0) break;
        character.chooseAction(Battle.living(isHero ? this.heroes : this.monsters), enemies, this.dice).execute(this.log);
      }
      if (Battle.living(this.monsters).length === 0) return "Heroes win";
      if (Battle.living(this.heroes).length === 0) return "Monsters win";
    }
    return "Draw";
  }
}

// ── Step 7: Try it out ──
const heroes = [new Warrior("Aria"), new Mage("Merlin"), new Healer("Sana")];
const monsters = [new Goblin("Grub"), new Goblin("Snag"), new Troll("Brute"), new Shaman("Hex")];
const battle = new Battle(heroes, monsters, new Dice(2024));
battle.subscribe((message) => console.log(message));
const result = battle.run();
console.log(`== ${result} after the dust settles ==`);
for (const character of [...heroes, ...monsters]) console.log(" ", String(character));
