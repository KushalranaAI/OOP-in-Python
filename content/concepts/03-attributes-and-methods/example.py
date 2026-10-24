class Temperature:
    readings_taken = 0                              # class attribute

    def __init__(self, celsius: float) -> None:
        self.celsius = celsius                      # instance attribute
        Temperature.readings_taken += 1

    @property
    def fahrenheit(self) -> float:                  # computed, read like an attribute
        return self.celsius * 9 / 5 + 32

    @classmethod
    def from_fahrenheit(cls, f: float) -> "Temperature":
        return cls((f - 32) * 5 / 9)                # cls is Temperature (or a subclass)

    @staticmethod
    def is_freezing(celsius: float) -> bool:
        return celsius <= 0

    def describe(self) -> str:
        return f"{self.celsius:.1f} °C"


a = Temperature(21.5)
b = Temperature.from_fahrenheit(212)
print(f"a = {a.celsius} °C = {a.fahrenheit} °F")
print(f"b = {b.celsius:.1f} °C")
print("freezing at -3?", Temperature.is_freezing(-3))
print("readings taken:", Temperature.readings_taken)

print("Temperature.describe(a):", Temperature.describe(a))   # what a.describe() really does

detached = a.describe                             # a *bound* method: it remembers a
print("detached bound method still works:", detached())

a.readings_taken = 999                            # creates an INSTANCE attribute - the trap!
print("class value unchanged:", Temperature.readings_taken, "| a's shadow copy:", a.readings_taken)
