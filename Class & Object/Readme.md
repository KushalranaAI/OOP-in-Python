# Classes: The Blueprint

A class is like a template or a cookie cutter. It defines the characteristics and functionalities that objects of that type will possess.

* ### Syntax:

```python
class ClassName:
    # Attributes (like variables within the class)
    # Methods (like functions within the class)
```

* ### Example

```python
class Dog:
    def __init__(self, name, breed, age):
        self.name = name
        self.breed = breed
        self.age = age

    def bark(self):
        print("Woof!")

    def get_info(self):
        print(f"Name: {self.name}, Breed: {self.breed}, Age: {self.age}")
```


# Objects: The Real-World Instances

An object is a specific instance created from a class. It's like the actual cookies made from the cookie cutter.

Instantiating an Object (Creating an Object):

```python
my_dog = Dog("Fido", "Labrador", 3)  
```

Accessing Attributes and Methods:
```python
 print(my_dog.name)       # Output: Fido
my_dog.bark()            # Output: Woof!
my_dog.get_info()        # Output: Name: Fido, Breed: Labrador, Age: 3

```

## Key Points

* #### *The __init__() Method:* This is the constructor. It's automatically called when you create an object and is used to initialize the object's attributes.
* #### *The 'self' Keyword:* The self parameter within methods refers to the specific object itself. It's how an object accesses its own data and its other methods.

