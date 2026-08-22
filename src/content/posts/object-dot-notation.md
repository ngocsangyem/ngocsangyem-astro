---
title: "Object dot notation"
date: 2022-03-12
tags: ["javascript"]
description: "Bundling data with the functions that act on it, and why the obvious first version breaks the moment you copy the object."
---

Say an application stores each user's name and score, and the only behaviour it
needs is adding one to a score. The data on its own is easy.

```js title="user.js"
const user1 = {
  name: 'John',
  score: 0,
};
```

Wherever that user travels through the application, the score and the thing that
changes the score should arrive together, in one package, reachable through a
single character. That is what object dot notation buys. A property lookup and a
method call read the same way.

```js title="user.js" {4-6}
const user1 = {
  name: 'John',
  score: 0,
  increment: function () {
    user1.score++;
  },
};

user1.increment();
console.log(user1.score); // 1
```

Data and behaviour now live in the same object, and `user1.increment()` reads as
one thought instead of two.

## The version that breaks on a rename

`increment` reaches for `user1` by name, from inside the very object that
variable points at. Copy the object and the method keeps mutating the original.
Carrying on from above, where `user1.score` has already reached 1:

```js
const user2 = { ...user1 };
user2.increment();

console.log(user2.score); // 0
console.log(user1.score); // 2, the wrong object grew
```

`this` closes that gap. In a method called as `obj.method()`, `this` is whatever
sits to the left of the dot, so the method stops caring what the variable is
called:

```js
const user1 = {
  name: 'John',
  score: 0,
  increment: function () {
    user1.score++; // [!code --]
    this.score++; // [!code ++]
  },
};

const user2 = { ...user1 };
user2.increment();

console.log(user2.score); // 1
console.log(user1.score); // 0
```

> [!WARNING]
> An arrow function does not get its own `this`. Writing
> `increment: () => this.score++` reaches the enclosing scope's `this` rather
> than the object, and the counter quietly stops working.

## Additional links

* [MDN: property accessors](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_accessors)
