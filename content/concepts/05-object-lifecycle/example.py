import copy


class Connection:
    """A resource with guaranteed clean-up via the context-manager protocol."""

    def __init__(self, name: str) -> None:
        self.name = name

    def __enter__(self) -> "Connection":
        print(f"connect {self.name}")
        return self

    def __exit__(self, exc_type, exc, tb) -> bool:
        print(f"disconnect {self.name}" + (f" (after {exc_type.__name__})" if exc_type else ""))
        return False                                    # don't swallow exceptions


with Connection("A"):
    print("  using A")

try:
    with Connection("B"):
        raise RuntimeError("boom")
except RuntimeError:
    print("  error handled - and B was still disconnected")

team = {"name": "Reds", "players": ["Ada", "Alan"]}
alias = team
shallow = copy.copy(team)
deep = copy.deepcopy(team)
team["players"].append("Grace")
print("alias sees:", alias["players"])
print("shallow sees:", shallow["players"], "(inner list shared)")
print("deep sees:", deep["players"], "(fully independent)")
