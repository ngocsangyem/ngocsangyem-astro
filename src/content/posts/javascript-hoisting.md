---
title: "What you need to know about hoisting"
date: 2025-07-19
tags: ["javascript"]
description: "Why var hands you undefined, let throws instead, and why nothing actually moves to the top of anything."
---

Hoisting is behind a good share of the mysterious `undefined` values and the
"cannot access before initialization" errors in JavaScript. MDN describes the
term as the behaviour of moving declarations to the top, and that description is
where most of the confusion starts, because nothing moves.

## Nothing moves to the top

On entering a scope, the engine creates bindings for every declaration in it
before running a single statement. The declarations were always at the top in the
only sense that matters: they exist before your code runs. The source text stays
exactly where you wrote it.

That framing explains why the declaration forms differ. All of them are created
early. What differs is what they hold during the gap before their own line runs.

## var hands you undefined

A `var` binding is created and initialized to `undefined` as its function or
global scope is entered.

```js
console.log(myVar); // undefined, not a ReferenceError
var myVar = 5;
console.log(myVar); // 5
```

The declaration exists early, the assignment happens where you wrote it, and the
gap between them is the entire behaviour:

```js
var myVar;          // created on entering the scope, holding undefined
console.log(myVar); // undefined
myVar = 5;          // your line, in its original position
console.log(myVar); // 5
```

## let and const throw instead

These bindings are also created on entering the scope, but they are left
uninitialized. Reaching one before its declaration runs is an error rather than a
value:

```js
console.log(myLet); // [!code error]
let myLet = 10;
```

That throws `ReferenceError: Cannot access 'myLet' before initialization`, and
`const` behaves identically. The window between entering the scope and reaching
the declaration is the temporal dead zone.

## Function declarations are the exception

A function declaration is created and fully initialized on entering the scope,
body included, so calling it early works:

```js
sayHello(); // "Hello, World!"

function sayHello() {
  console.log('Hello, World!');
}
```

A function expression is not a function declaration. It follows the rules of
whatever binding holds it, which for `var` means `undefined` at call time:

```js
sayGoodbye(); // [!code error]

var sayGoodbye = function () {
  console.log('Goodbye!');
};
```

That one throws `TypeError: sayGoodbye is not a function`, because at the moment
of the call the binding holds `undefined`, and `undefined` is not callable.

Arrow functions are expressions too, so a `const` arrow lands in the dead zone:

```js
greet(); // [!code error]

const greet = () => {
  console.log('Hi there!');
};
```

This is a `ReferenceError`, not a `TypeError`. Which error you get tells you
which rule you hit, and that is genuinely useful when debugging.

## Classes sit in the dead zone as well

```js
const instance = new MyClass(); // [!code error]

class MyClass {
  constructor() {
    this.name = 'example';
  }
}
```

A class declaration is hoisted the way `let` is. The binding exists, and touching
it early throws.

## Imports are resolved before anything runs

```js title="app.js"
myModule.doSomething(); // works

import * as myModule from './my-module.js';
```

Module imports are linked, and their dependencies evaluated, before the importing
module's body runs. The namespace object is ready wherever the `import` sits in
the file. This is a property of how modules load rather than of hoisting proper,
and it is why an import statement at the bottom of a file still works.

## The loop that catches everyone

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 100);
}
```

That prints 3, 3, 3. `var i` is a single binding for the whole function, so all
three callbacks close over the same `i`, and it has already finished counting by
the time any of them run. One word fixes it:

```js
for (var i = 0; i < 3; i++) { // [!code --]
for (let i = 0; i < 3; i++) { // [!code ++]
  setTimeout(() => {
    console.log(i);
  }, 100);
}
```

`let` in a loop head creates a fresh binding per iteration, so the output becomes
0, 1, 2.

## Function declarations inside blocks

```js
if (true) {
  function foo() {
    return 'declaration';
  }
}

foo();
```

In strict mode and inside modules, `foo` is scoped to the block and that call
throws. In sloppy mode, web compatibility rules also create a `var`-like binding
in the enclosing function scope, so the call works. Engines agree on this now;
the split is between the two modes, not between browsers. Still, a function
expression removes the question entirely:

```js
let foo;
if (condition) {
  foo = function () {
    return 'expression';
  };
}
```

## What strict mode actually changes

```js
'use strict';

console.log(undeclaredVar); // [!code error]
undeclaredVar = 5;
```

The `console.log` throws a `ReferenceError` in both modes, because the variable
was never declared anywhere. What strict mode changes is the line after it: the
assignment throws too, instead of quietly creating a global.

## Habits that keep hoisting out of your way

Use `const` by default and `let` when you need to reassign. Both put the temporal
dead zone between you and a half-initialized variable, which turns a silent
`undefined` into an error you can read.

Declare and initialize in one statement wherever you can. `let items = []` tells
you more than a bare `let items` followed by an assignment forty lines down, and
it leaves no window where the binding exists without a useful value.

The old advice was to gather your own `var` declarations at the top of a
function, which at least made the gap visible. With block-scoped declarations
that advice inverts: declare close to first use, because the scope is now small
enough for that to be the clearer choice.

When something does go wrong, the message names the rule. `undefined` means a
`var` binding exists and has not been assigned yet. `ReferenceError: Cannot
access 'x' before initialization` means a `let`, `const` or `class` in its dead
zone. `ReferenceError: x is not defined` means there is no declaration at all. A
breakpoint helps too: the scope panel in a browser's debugger lists the bindings
that exist at that moment, which is the quickest way to see a dead zone from the
inside.
