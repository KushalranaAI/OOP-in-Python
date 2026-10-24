// Library catalogue - abstraction, polymorphism, composition and the observer pattern.
// ── Step 1: An error type and the abstract Item ──
#include <algorithm>
#include <cctype>
#include <functional>
#include <iomanip>
#include <iostream>
#include <map>
#include <memory>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

class LibraryError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;
};

std::string money(int cents) {
    std::ostringstream out;
    out << cents / 100 << "." << std::setw(2) << std::setfill('0') << cents % 100;
    return out.str();
}

std::string lower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c) { return std::tolower(c); });
    return s;
}

class Item {
public:
    Item(std::string id, std::string title, int year) : id_(std::move(id)), title_(std::move(title)), year_(year) {}
    virtual ~Item() = default;

    virtual int loan_days() const = 0;
    virtual int daily_fine() const = 0;
    virtual std::string kind() const = 0;
    virtual bool can_borrow() const { return true; }
    virtual bool matches(const std::string& query) const { return lower(title_).find(lower(query)) != std::string::npos; }

    const std::string& id() const { return id_; }
    const std::string& title() const { return title_; }
    std::string str() const { return "[" + id_ + "] " + title_ + " (" + std::to_string(year_) + ", " + kind() + ")"; }

private:
    std::string id_, title_;
    int year_;
};

// ── Step 2: Book, DVD and Magazine ──
class Book : public Item {
public:
    Book(std::string id, std::string title, int year, std::string author)
        : Item(std::move(id), std::move(title), year), author_(std::move(author)) {}
    int loan_days() const override { return 21; }
    int daily_fine() const override { return 25; }
    std::string kind() const override { return "Book"; }
    bool matches(const std::string& query) const override {
        return Item::matches(query) || lower(author_).find(lower(query)) != std::string::npos;
    }

private:
    std::string author_;
};

class Dvd : public Item {
public:
    using Item::Item;
    int loan_days() const override { return 7; }
    int daily_fine() const override { return 100; }
    std::string kind() const override { return "Dvd"; }
};

class Magazine : public Item {
public:
    using Item::Item;
    int loan_days() const override { return 0; }
    int daily_fine() const override { return 0; }
    std::string kind() const override { return "Magazine"; }
    bool can_borrow() const override { return false; }
};

// ── Step 3: Members and plans - composition instead of inheritance ──
struct Plan {
    std::string name;
    int max_loans;
    int fine_percent;          // 100 = full fine, 50 = half price
};

const Plan STANDARD{"Standard", 2, 100};
const Plan STUDENT{"Student", 3, 50};

struct Member {
    std::string name;
    const Plan* plan;          // has-a: points at a shared, immutable plan
};

// ── Step 4: The Loan ──
struct Loan {
    const Item* item;
    const Member* member;
    int due_day;

    int days_late(int today) const { return std::max(0, today - due_day); }
    int fine(int today) const { return days_late(today) * item->daily_fine() * member->plan->fine_percent / 100; }
};

// ── Step 5: The Library - encapsulation and the observer pattern ──
class Library {
public:
    using Listener = std::function<void(const std::string& event, const std::string& message)>;

    void subscribe(Listener listener) { listeners_.push_back(std::move(listener)); }
    void add(std::unique_ptr<Item> item) {
        const std::string id = item->id();
        order_.push_back(id);
        items_[id] = std::move(item);
    }

    int loan_count(const Member& member) const {
        return static_cast<int>(std::count_if(loans_.begin(), loans_.end(), [&](const auto& kv) { return kv.second.member == &member; }));
    }

    const Loan& borrow(const Member& member, const std::string& item_id, int today) {
        auto it = items_.find(item_id);
        if (it == items_.end()) throw LibraryError("no item " + item_id);
        const Item& item = *it->second;
        if (!item.can_borrow()) throw LibraryError("'" + item.title() + "' is reference-only");
        if (loans_.count(item_id)) throw LibraryError("'" + item.title() + "' is already on loan");
        if (loan_count(member) >= member.plan->max_loans)
            throw LibraryError(member.name + " reached the " + member.plan->name + " limit of " + std::to_string(member.plan->max_loans));
        const Loan& loan = loans_[item_id] = Loan{&item, &member, today + item.loan_days()};
        publish("borrow", member.name + " borrowed '" + item.title() + "', due day " + std::to_string(loan.due_day));
        return loan;
    }

    int give_back(const std::string& item_id, int today) {
        auto it = loans_.find(item_id);
        if (it == loans_.end()) throw LibraryError(item_id + " is not on loan");
        Loan loan = it->second;
        loans_.erase(it);
        int fine = loan.fine(today);
        std::string late = fine ? ", " + std::to_string(loan.days_late(today)) + " days late, fine " + money(fine) : ", on time";
        publish("return", loan.member->name + " returned '" + loan.item->title() + "'" + late);
        return fine;
    }

    std::vector<const Item*> search(const std::string& query) const {
        std::vector<const Item*> found;
        for (const auto& id : order_)
            if (items_.at(id)->matches(query)) found.push_back(items_.at(id).get());
        return found;
    }

    std::vector<Loan> overdue(int today) const {
        std::vector<Loan> late;
        for (const auto& [id, loan] : loans_)
            if (loan.days_late(today)) late.push_back(loan);
        std::sort(late.begin(), late.end(), [](const Loan& a, const Loan& b) { return a.due_day < b.due_day; });
        return late;
    }

private:
    void publish(const std::string& event, const std::string& message) const {
        for (const auto& listener : listeners_) listener(event, message);
    }

    std::map<std::string, std::unique_ptr<Item>> items_;
    std::vector<std::string> order_;                  // insertion order, for stable search results
    std::map<std::string, Loan> loans_;
    std::vector<Listener> listeners_;
};

// ── Step 6: Try it out ──
int main() {
    Library library;
    library.subscribe([](const std::string& event, const std::string& message) { std::cout << "  [" << event << "] " << message << "\n"; });
    library.add(std::make_unique<Book>("B1", "Clean Code", 2008, "Robert C. Martin"));
    library.add(std::make_unique<Book>("B2", "Design Patterns", 1994, "Gamma, Helm, Johnson, Vlissides"));
    library.add(std::make_unique<Dvd>("D1", "The Matrix", 1999));
    library.add(std::make_unique<Magazine>("M1", "Byte", 1985));

    Member ada{"Ada", &STANDARD};
    Member linus{"Linus", &STUDENT};

    std::cout << "day 1\n";
    std::vector<std::pair<const Member*, std::string>> requests{{&ada, "B1"}, {&ada, "D1"}, {&ada, "B2"},
                                                                {&linus, "M1"}, {&linus, "B2"}, {&linus, "B1"}};
    for (const auto& [member, item_id] : requests) {
        try {
            library.borrow(*member, item_id, 1);
        } catch (const LibraryError& e) {
            std::cout << "  refused: " << e.what() << "\n";
        }
    }

    std::cout << "day 12\n";
    library.give_back("D1", 12);
    std::cout << "day 30\n";
    library.give_back("B2", 30);

    for (const std::string query : {"design", "martin", "matrix"}) {
        std::cout << "search '" << query << "': ";
        auto found = library.search(query);
        for (std::size_t i = 0; i < found.size(); ++i) std::cout << (i ? ", " : "") << found[i]->str();
        std::cout << "\n";
    }
    for (const Loan& loan : library.overdue(30))
        std::cout << "overdue: '" << loan.item->title() << "' (" << loan.member->name << "), fine so far " << money(loan.fine(30)) << "\n";
}
