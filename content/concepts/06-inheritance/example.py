class Animal:
    def __init__(self, name: str) -> None:
        self.name = name

    def speak(self) -> str:
        return "..."

    def describe(self) -> str:
        return f"{self.name} says {self.speak()}"


class Dog(Animal):
    def __init__(self, name: str, breed: str) -> None:
        super().__init__(name)
        self.breed = breed

    def speak(self) -> str:
        return "Woof"

    def describe(self) -> str:
        return super().describe() + f" (a {self.breed})"     # extend, don't replace


class Puppy(Dog):
    def speak(self) -> str:
        return "Yip"


# The diamond: D(B, C), both B and C inherit from A
class A:
    def hello(self) -> str:
        return "A"


class B(A):
    pass


class C(A):
    def hello(self) -> str:
        return "C"


class D(B, C):
    pass


for pet in (Animal("Generic"), Dog("Rex", "beagle"), Puppy("Bit", "corgi")):
    print(pet.describe())

print("Puppy MRO:", [cls.__name__ for cls in Puppy.__mro__])
print("isinstance(Puppy, Animal):", isinstance(Puppy("x", "y"), Animal))
print("D MRO:", [cls.__name__ for cls in D.__mro__], "→ D().hello() =", D().hello())
