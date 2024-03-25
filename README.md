# Python OOP Primer

This repository offers a concise exploration of Object-Oriented Programming principles within Python.

## Key Concepts

* **Objects:** Self-contained entities bundling data (attributes) and behavior (methods).
* **Classes:** Blueprints from which objects are instantiated.
* **Encapsulation:** Keeping data and logic together within objects for organization and protection.
* **Inheritance:** Creating class hierarchies, promoting code reusability and specialization.
* **Polymorphism:** Objects of different classes responding to the same method call in unique ways (e.g., "duck typing").

## Example Code

```python
class Animal:  
  def __init__(self, name):
    self.name = name

  def make_sound(self):
    print("Generic animal sound")

class Dog(Animal): 
  def __init__(self, name, breed):
    super().__init__(name)
    self.breed = breed

  def make_sound(self):
    print("Woof!")

# Example usage
fido = Dog("Fido", "Labrador")
fido.make_sound() # Output: Woof!
