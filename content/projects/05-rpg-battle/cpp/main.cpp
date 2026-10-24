// Turn-based RPG battle - abstract classes, polymorphic AI, status effects, command and observer patterns.
// ── Step 1: Dice and the event log ──
#include <algorithm>
#include <cstdint>
#include <functional>
#include <iomanip>
#include <iostream>
#include <memory>
#include <sstream>
#include <string>
#include <vector>

using Log = std::function<void(const std::string&)>;

class Dice {                       // a tiny seeded generator (MINSTD): same seed -> same battle
public:
    explicit Dice(std::uint64_t seed) : state_(seed) {}
    int roll(int sides) {
        state_ = state_ * 48271 % 2147483647;
        return static_cast<int>(state_ % sides) + 1;
    }

private:
    std::uint64_t state_;
};

// ── Step 2: Status effects ──
class Character;                   // declared now, defined in step 3

class Effect {
public:
    explicit Effect(int turns) : turns(turns) {}
    virtual ~Effect() = default;
    virtual std::string name() const = 0;
    virtual void on_turn_start(Character&, const Log&) {}     // hook
    virtual int modify_damage(int damage) const { return damage; }   // hook
    int turns;
};

class Poison : public Effect {
public:
    explicit Poison(int turns = 3, int damage = 4) : Effect(turns), damage_(damage) {}
    std::string name() const override { return "poison"; }
    void on_turn_start(Character& target, const Log& log) override;    // needs the full Character: see below

private:
    int damage_;
};

class Shield : public Effect {
public:
    using Effect::Effect;
    std::string name() const override { return "shield"; }
    int modify_damage(int damage) const override { return damage / 2; }
};

// ── Step 3: The Character base class ──
class Action;

class Character {
public:
    Character(std::string name, int hp, int attack, int defense, int speed)
        : name(std::move(name)), max_hp(hp), hp(hp), attack(attack), defense(defense), speed(speed) {}
    virtual ~Character() = default;

    bool alive() const { return hp > 0; }
    int hp_percent() const { return hp * 100 / max_hp; }

    bool has_effect(const std::string& effect_name) const {
        return std::any_of(effects_.begin(), effects_.end(), [&](const auto& e) { return e->name() == effect_name; });
    }

    void add_effect(std::unique_ptr<Effect> effect) {
        std::erase_if(effects_, [&](const auto& e) { return e->name() == effect->name(); });
        effects_.push_back(std::move(effect));
    }

    void lose_hp(int amount) { hp = std::max(0, hp - amount); }

    int take_damage(int raw) {
        int damage = std::max(1, raw - defense);
        for (const auto& effect : effects_) damage = effect->modify_damage(damage);
        lose_hp(damage);
        return damage;
    }

    int heal(int amount) {
        int before = hp;
        hp = std::min(max_hp, hp + amount);
        return hp - before;
    }

    std::string defeat_note() const { return alive() ? "" : " - " + name + " is defeated!"; }

    virtual void start_turn(const Log& log) {
        std::vector<Effect*> snapshot;
        for (const auto& e : effects_) snapshot.push_back(e.get());
        for (Effect* effect : snapshot) {
            effect->on_turn_start(*this, log);
            if (--effect->turns == 0) {
                log(name + "'s " + effect->name() + " wears off");
                std::erase_if(effects_, [&](const auto& e) { return e.get() == effect; });
            }
        }
    }

    virtual std::unique_ptr<Action> choose_action(const std::vector<Character*>& allies,
                                                  const std::vector<Character*>& enemies, Dice& dice) = 0;
    virtual std::string kind() const = 0;

    std::string str() const {
        std::ostringstream out;
        out << std::left << std::setw(7) << name << std::setw(8) << kind() << std::right << std::setw(3) << hp << "/" << max_hp << " HP";
        return out.str();
    }

    const std::string name;
    const int max_hp;
    int hp, attack, defense, speed;

private:
    std::vector<std::unique_ptr<Effect>> effects_;
};

void Poison::on_turn_start(Character& target, const Log& log) {
    target.lose_hp(damage_);
    log(target.name + " takes " + std::to_string(damage_) + " poison damage" + target.defeat_note());
}

Character* weakest(const std::vector<Character*>& team) {
    return *std::min_element(team.begin(), team.end(), [](auto a, auto b) { return a->hp < b->hp; });
}

Character* strongest(const std::vector<Character*>& team) {
    Character* best = team.front();                      // first one wins ties, like Python's max()
    for (Character* c : team)
        if (c->hp > best->hp) best = c;
    return best;
}

// ── Step 4: Actions - the command pattern ──
class Action {
public:
    explicit Action(Character& actor) : actor_(actor) {}
    virtual ~Action() = default;
    virtual void execute(const Log& log) = 0;

protected:
    Character& actor_;
};

class Attack : public Action {
public:
    Attack(Character& actor, Character& target, int bonus) : Action(actor), target_(target), bonus_(bonus) {}
    void execute(const Log& log) override {
        int dealt = target_.take_damage(actor_.attack + bonus_);
        log(actor_.name + " hits " + target_.name + " for " + std::to_string(dealt) + target_.defeat_note());
    }

private:
    Character& target_;
    int bonus_;
};

class Mage;

class Fireball : public Action {
public:
    static constexpr int COST = 30;
    Fireball(Mage& actor, std::vector<Character*> targets, int power);
    void execute(const Log& log) override;              // defined after Mage (it spends Mage's mana)

private:
    Mage& mage_;
    std::vector<Character*> targets_;
    int power_;
};

class Heal : public Action {
public:
    Heal(Character& actor, Character& target, int amount) : Action(actor), target_(target), amount_(amount) {}
    void execute(const Log& log) override {
        int healed = target_.heal(amount_);
        log(actor_.name + " heals " + target_.name + " for " + std::to_string(healed) + " (" +
            std::to_string(target_.hp) + "/" + std::to_string(target_.max_hp) + ")");
    }

private:
    Character& target_;
    int amount_;
};

class Cast : public Action {
public:
    Cast(Character& actor, Character& target, std::unique_ptr<Effect> effect, std::string message)
        : Action(actor), target_(target), effect_(std::move(effect)), message_(std::move(message)) {}
    void execute(const Log& log) override {
        target_.add_effect(std::move(effect_));            // ownership moves to the target
        log(message_);
    }

private:
    Character& target_;
    std::unique_ptr<Effect> effect_;
    std::string message_;
};

// ── Step 5: Heroes and monsters - polymorphic behaviour ──
using Team = std::vector<Character*>;

class Warrior : public Character {
public:
    explicit Warrior(std::string name) : Character(std::move(name), 60, 12, 5, 3) {}
    std::string kind() const override { return "Warrior"; }
    std::unique_ptr<Action> choose_action(const Team&, const Team& enemies, Dice& dice) override {
        if (hp_percent() < 50 && !has_effect("shield"))
            return std::make_unique<Cast>(*this, *this, std::make_unique<Shield>(2), name + " raises a shield wall");
        return std::make_unique<Attack>(*this, *weakest(enemies), dice.roll(6));
    }
};

class Mage : public Character {
public:
    static constexpr int MAX_MANA = 50;
    explicit Mage(std::string name) : Character(std::move(name), 38, 6, 2, 5) {}
    std::string kind() const override { return "Mage"; }

    void start_turn(const Log& log) override {
        Character::start_turn(log);
        mana = std::min(MAX_MANA, mana + 10);
    }

    std::unique_ptr<Action> choose_action(const Team&, const Team& enemies, Dice& dice) override {
        if (mana >= Fireball::COST && enemies.size() >= 2) return std::make_unique<Fireball>(*this, enemies, 8 + dice.roll(6));
        Character* target = strongest(enemies);
        if (!target->has_effect("poison"))
            return std::make_unique<Cast>(*this, *target, std::make_unique<Poison>(), name + " poisons " + target->name);
        return std::make_unique<Attack>(*this, *weakest(enemies), dice.roll(4));
    }

    int mana = MAX_MANA;
};

Fireball::Fireball(Mage& actor, std::vector<Character*> targets, int power)
    : Action(actor), mage_(actor), targets_(std::move(targets)), power_(power) {}

void Fireball::execute(const Log& log) {
    mage_.mana -= COST;
    log(actor_.name + " casts Fireball!");
    for (Character* target : targets_) {
        int dealt = target->take_damage(power_);
        log("  " + target->name + " burns for " + std::to_string(dealt) + target->defeat_note());
    }
}

class Healer : public Character {
public:
    explicit Healer(std::string name) : Character(std::move(name), 45, 7, 3, 4) {}
    std::string kind() const override { return "Healer"; }
    std::unique_ptr<Action> choose_action(const Team& allies, const Team& enemies, Dice& dice) override {
        Character* patient = *std::min_element(allies.begin(), allies.end(),
                                               [](auto a, auto b) { return a->hp_percent() < b->hp_percent(); });
        if (patient->hp_percent() < 60) return std::make_unique<Heal>(*this, *patient, 12 + dice.roll(6));
        return std::make_unique<Attack>(*this, *weakest(enemies), dice.roll(4));
    }
};

class Goblin : public Character {
public:
    explicit Goblin(std::string name) : Character(std::move(name), 30, 9, 2, 6) {}
    std::string kind() const override { return "Goblin"; }
    std::unique_ptr<Action> choose_action(const Team&, const Team& enemies, Dice& dice) override {
        Character* target = enemies[dice.roll(static_cast<int>(enemies.size())) - 1];   // roll the target first...
        int bonus = dice.roll(6);                                                       // ...then the damage
        return std::make_unique<Attack>(*this, *target, bonus);
    }
};

class Troll : public Character {
public:
    explicit Troll(std::string name) : Character(std::move(name), 80, 14, 4, 1) {}
    std::string kind() const override { return "Troll"; }
    void start_turn(const Log& log) override {
        Character::start_turn(log);
        if (alive()) {
            int healed = heal(5);
            if (healed) log(name + " regenerates " + std::to_string(healed) + " HP");
        }
    }
    std::unique_ptr<Action> choose_action(const Team&, const Team& enemies, Dice& dice) override {
        return std::make_unique<Attack>(*this, *strongest(enemies), dice.roll(6));
    }
};

class Shaman : public Character {
public:
    explicit Shaman(std::string name) : Character(std::move(name), 35, 5, 2, 4) {}
    std::string kind() const override { return "Shaman"; }
    std::unique_ptr<Action> choose_action(const Team&, const Team& enemies, Dice& dice) override {
        for (Character* hero : enemies)
            if (!hero->has_effect("poison"))
                return std::make_unique<Cast>(*this, *hero, std::make_unique<Poison>(3, 3), name + " curses " + hero->name + " with poison");
        return std::make_unique<Attack>(*this, *weakest(enemies), dice.roll(4));
    }
};

// ── Step 6: The battle engine ──
class Battle {
public:
    using Roster = std::vector<std::unique_ptr<Character>>;

    Battle(Roster& heroes, Roster& monsters, Dice& dice) : heroes_(heroes), monsters_(monsters), dice_(dice) {}

    void subscribe(Log listener) { listeners_.push_back(std::move(listener)); }

    std::string run(int max_rounds = 20) {
        const Log log = [this](const std::string& message) { for (const auto& l : listeners_) l(message); };
        for (int number = 1; number <= max_rounds; ++number) {
            log("-- round " + std::to_string(number) + " --");
            Team order = living(heroes_);
            for (Character* m : living(monsters_)) order.push_back(m);
            std::stable_sort(order.begin(), order.end(), [](auto a, auto b) { return a->speed > b->speed; });

            for (Character* character : order) {
                if (!character->alive()) continue;               // defeated earlier this round
                character->start_turn(log);
                if (!character->alive()) continue;               // the poison got them
                bool is_hero = std::any_of(heroes_.begin(), heroes_.end(), [&](const auto& h) { return h.get() == character; });
                Team enemies = living(is_hero ? monsters_ : heroes_);
                if (enemies.empty()) break;
                character->choose_action(living(is_hero ? heroes_ : monsters_), enemies, dice_)->execute(log);
            }
            if (living(monsters_).empty()) return "Heroes win";
            if (living(heroes_).empty()) return "Monsters win";
        }
        return "Draw";
    }

private:
    static Team living(const Roster& roster) {
        Team alive;
        for (const auto& c : roster)
            if (c->alive()) alive.push_back(c.get());
        return alive;
    }

    Roster& heroes_;
    Roster& monsters_;
    Dice& dice_;
    std::vector<Log> listeners_;
};

// ── Step 7: Try it out ──
int main() {
    Battle::Roster heroes, monsters;
    heroes.push_back(std::make_unique<Warrior>("Aria"));
    heroes.push_back(std::make_unique<Mage>("Merlin"));
    heroes.push_back(std::make_unique<Healer>("Sana"));
    monsters.push_back(std::make_unique<Goblin>("Grub"));
    monsters.push_back(std::make_unique<Goblin>("Snag"));
    monsters.push_back(std::make_unique<Troll>("Brute"));
    monsters.push_back(std::make_unique<Shaman>("Hex"));

    Dice dice(2024);
    Battle battle(heroes, monsters, dice);
    battle.subscribe([](const std::string& message) { std::cout << message << "\n"; });
    std::string result = battle.run();
    std::cout << "== " << result << " after the dust settles ==\n";
    for (const auto* roster : {&heroes, &monsters})
        for (const auto& c : *roster) std::cout << "  " << c->str() << "\n";
}
