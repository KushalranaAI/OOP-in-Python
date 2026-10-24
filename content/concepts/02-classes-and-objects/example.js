class Dog {
  static species = "Canis familiaris";

  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  bark() {
    return `${this.name} says woof`;
  }
}

const rex = new Dog("Rex", 3);
const pip = new Dog("Pip", 1);
const alias = rex; // a second reference to the SAME object

console.log(rex.bark(), "|", pip.bark());
console.log("own properties:", Object.keys(rex));
console.log("typeof Dog:", typeof Dog, "| instanceof:", rex instanceof Dog);
console.log("bark is shared:", rex.bark === pip.bark, "| own?", Object.hasOwn(rex, "bark"));

alias.age = 4;
console.log("rex.age is now", rex.age);
console.log("prototype link:", Object.getPrototypeOf(rex) === Dog.prototype);
