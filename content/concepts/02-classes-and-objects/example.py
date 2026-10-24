class Dog:
    species = "Canis familiaris"

    def __init__(self, name: str, age: int) -> None:
        self.name = name
        self.age = age

    def bark(self) -> str:
        return f"{self.name} says woof"


rex = Dog("Rex", 3)
pip = Dog("Pip", 1)
alias = rex                                  # a second name for the SAME object

print(rex.bark(), "|", pip.bark())
print("attributes of rex:", rex.__dict__)
print("class of rex:", type(rex).__name__, "| isinstance:", isinstance(rex, Dog))
print("alias is rex:", alias is rex, "| pip is rex:", pip is rex)

alias.age = 4                                # changing through one name…
print("rex.age is now", rex.age)             # …is visible through the other
print("shared class attribute:", rex.species == pip.species == Dog.species)
