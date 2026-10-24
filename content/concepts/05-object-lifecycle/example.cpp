#include <iostream>
#include <memory>
#include <string>
#include <utility>
#include <vector>

class Connection {
public:
    explicit Connection(std::string name) : name_(std::move(name)) { std::cout << "connect " << name_ << "\n"; }
    ~Connection() { std::cout << "disconnect " << name_ << "\n"; }
    Connection(const Connection&) = delete;                  // not copyable
    Connection& operator=(const Connection&) = delete;
private:
    std::string name_;
};

struct Team {                                               // rule of zero: members manage themselves
    std::string name;
    std::vector<std::string> players;
};

int main() {
    {
        Connection a("A");
        std::cout << "  using A\n";
    }                                                       // 'disconnect A' happens exactly here

    try {
        Connection b("B");
        throw std::runtime_error("boom");
    } catch (const std::exception&) {
        std::cout << "  error handled - and B was already disconnected\n";
    }

    auto owner = std::make_unique<Connection>("C");
    auto new_owner = std::move(owner);                      // ownership moves; 'owner' is now empty
    std::cout << "owner empty? " << std::boolalpha << (owner == nullptr) << "\n";

    Team reds{"Reds", {"Ada", "Alan"}};
    Team copy = reds;                                       // copy constructor: deep copy of the vector
    reds.players.push_back("Grace");
    std::cout << "copy has " << copy.players.size() << " players, original has " << reds.players.size() << "\n";
}                                                           // 'disconnect C' (new_owner) happens here
