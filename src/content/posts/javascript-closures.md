---
title: "JavaScript closures"
date: 2025-07-20
tags: ["javascript"]
description: "The box analogy, then counters, private state, modules and memoization, plus three closure claims that do not survive checking."
---

MDN's definition is precise and not much help the first time you read it: a
closure is a function bundled together with references to its surrounding state.
You have written closures already, probably without noticing.

## The box analogy

@mukeshb's framing on [DevTo](https://dev.to/mukeshb/understanding-javascript-closures-a-comprehensive-guide-306p)
is the one that made it land for me. A function is a box, its variables are the
items inside, and a closure is "a magical way of reaching into the box" after the
box has been closed.

```js
function createBox(item) {
  const treasureInside = `You found: ${item}`;

  function openBox() {
    return treasureInside;
  }

  return openBox;
}

const magicalKey = createBox('a golden coin');

// createBox has returned. treasureInside should be gone.
console.log(magicalKey()); // "You found: a golden coin"

setTimeout(() => {
  console.log(magicalKey()); // still there a second later
}, 1000);
```

`createBox` finished executing long before either log ran. Its local variable
survived because `openBox` still refers to it, and that surviving reference is
the closure. Nothing was copied: `openBox` reads the same binding `createBox`
created.

## Lexical scoping underneath

```js
function outerFunction(x) {
  function innerFunction(y) {
    console.log(x + y);
  }

  return innerFunction;
}

const myFunction = outerFunction(10);
myFunction(5); // 15
```

An inner function can read its own variables, the variables of every enclosing
function, and the globals. Where those names resolve is decided by where the
function is written, not by where it gets called from. That is what lexical
means, and closures fall straight out of it.

## Counters, and why they stay independent

```js
function createCounter() {
  let count = 0;

  return function () {
    count++;
    return count;
  };
}

const counter1 = createCounter();
const counter2 = createCounter();

console.log(counter1()); // 1
console.log(counter1()); // 2
console.log(counter2()); // 1
console.log(counter1()); // 3
```

Every call to `createCounter` runs the body again, and a new `count` comes with
it. The two counters never see each other.

## Private state

`count` above is unreachable from outside. Scale that up and you have data
privacy with no privacy syntax involved:

```js
function createBankAccount(initialBalance) {
  let balance = initialBalance;

  return {
    deposit(amount) {
      if (amount <= 0) throw new Error('Deposit amount must be positive');
      balance += amount;
      return balance;
    },

    withdraw(amount) {
      if (amount <= 0 || amount > balance) throw new Error('Invalid withdrawal amount');
      balance -= amount;
      return balance;
    },

    getBalance() {
      return balance;
    },
  };
}

const account = createBankAccount(100);
account.deposit(50);
console.log(account.getBalance()); // 150
console.log(account.balance); // undefined
```

The last line is the interesting one. There is no `balance` property to read,
so there is nothing to protect it from.

## The module pattern

```js
const Calculator = (function () {
  const history = [];

  function addToHistory(operation, result) {
    history.push(`${operation} = ${result}`);
  }

  return {
    add(a, b) {
      const result = a + b;
      addToHistory(`${a} + ${b}`, result);
      return result;
    },

    multiply(a, b) {
      const result = a * b;
      addToHistory(`${a} * ${b}`, result);
      return result;
    },

    getHistory() {
      return [...history];
    },

    clearHistory() {
      history.length = 0;
    },
  };
})();

console.log(Calculator.add(5, 3)); // 8
console.log(Calculator.multiply(4, 2)); // 8
console.log(Calculator.getHistory()); // ["5 + 3 = 8", "4 * 2 = 8"]
```

`getHistory` returns a copy deliberately. Handing out the array itself would let
a caller push into private state through the back door.

## Handlers keep their context

```js
function setupButton(name) {
  return function (event) {
    console.log(`Button ${name} was clicked`);
    console.log('Event type:', event.type);
  };
}

document.getElementById('save').addEventListener('click', setupButton('Save'));
document.getElementById('cancel').addEventListener('click', setupButton('Cancel'));
```

Each listener carries its own `name` with no extra plumbing and no shared state
to get out of sync.

The same idea in a loop, with the binding that makes it work:

```js
function createClickHandlers() {
  const buttons = ['Home', 'About', 'Contact'];
  const handlers = [];

  // [!code word:let]
  for (let i = 0; i < buttons.length; i++) {
    handlers.push(() => {
      console.log(`Navigating to ${buttons[i]} page`);
    });
  }

  return handlers;
}

const handlers = createClickHandlers();
handlers[0](); // "Navigating to Home page"
handlers[1](); // "Navigating to About page"
```

`let` in the loop head is doing the work. Swap it for `var` and all three
handlers close over one `i`, which is 3 by the time any of them runs.

## Function factories

```js
function createMultiplier(multiplier) {
  return function (number) {
    return number * multiplier;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
```

## Memoization, and a cache bug worth knowing

The textbook memoize looks like this, and it has a hole in it:

```js
function memoize(fn) {
  const cache = {};

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache[key]) { // [!code error]
      return cache[key];
    }

    const result = fn.apply(this, args);
    cache[key] = result;
    return result;
  };
}
```

`if (cache[key])` tests the cached value for truthiness rather than testing the
cache for membership. A function that legitimately returns `0`, `''`, `null` or
`false` gets recomputed on every single call, and the cache quietly does nothing
at all. A `Map` with an explicit membership check fixes it:

```js
function memoize(fn) {
  const cache = new Map(); // [!code ++]

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) { // [!code ++]
      return cache.get(key); // [!code ++]
    }

    const result = fn.apply(this, args);
    cache.set(key, result); // [!code ++]
    return result;
  };
}

const slowSum = memoize((n) => {
  let result = 0;
  for (let i = 0; i < n * 1_000_000; i++) result += i;
  return result;
});

slowSum(100); // computes, and takes a moment
slowSum(100); // returns the cached value
```

Keying on `JSON.stringify` is still a compromise, since it cannot distinguish
two objects with the same shape and cannot key on a function argument at all. It
is worth knowing what your cache key does and does not cover.

## Partial application

```js
function partial(fn, ...presetArgs) {
  return function (...laterArgs) {
    return fn(...presetArgs, ...laterArgs);
  };
}

function greet(greeting, punctuation, name) {
  return `${greeting}, ${name}${punctuation}`;
}

const sayHello = partial(greet, 'Hello', '!');
const sayGoodbye = partial(greet, 'Goodbye', '.');

console.log(sayHello('Alice')); // "Hello, Alice!"
console.log(sayGoodbye('Bob')); // "Goodbye, Bob."
```

## The loop problem, and the fix that predates let

```js
function createButtons() {
  for (var i = 0; i < 3; i++) {
    setTimeout(() => {
      console.log(`Button ${i} clicked`); // always "Button 3 clicked"
    }, 100);
  }
}
```

`let` is the one-word answer. Before `let` existed, the way to get a fresh
binding was to make a function call and let the parameter hold the value:

```js
function createButtons() {
  for (var i = 0; i < 3; i++) {
    (function (index) {
      setTimeout(() => {
        console.log(`Button ${index} clicked`); // 0, 1, 2
      }, 100);
    })(i);
  }
}
```

Worth recognising because you will meet it in older code, not because you should
write it.

## What closures actually retain

The usual warning is that a closure pins everything in its enclosing scope,
including what it never touches:

```js
function problematicClosure() {
  const largeData = new Array(1_000_000).fill('data');

  return function () {
    console.log('Function called');
  };
}
```

Modern engines are cleverer than that. V8 works out during parsing which
variables the inner functions reference and allocates a context for those, so a
returned function that never mentions `largeData` does not normally keep it
alive.

The caveat is that the analysis is per scope, not per function. If any surviving
function references `largeData`, the context holding it survives for all of them,
including the ones that never look at it. An open devtools session changes the
picture too, since the debugger can force a whole scope to be retained so you can
inspect it.

So the dependable version of the advice is not "closures leak" but "capture what
you need":

```js
function betterClosure() {
  const largeData = new Array(1_000_000).fill('data');
  const summary = `Data length: ${largeData.length}`;

  return function () {
    console.log(summary);
  };
}
```

That version needs no knowledge of any particular engine to reason about, which
is the real argument for it.

If you want to see what a given closure captured, put a breakpoint inside the
inner function. The scope panel lists a Closure entry holding exactly the
variables that were kept.

## A performance claim that is not one

This pair often gets presented as slow and fast:

```js
function makeLoggers(data) {
  return data.map(function (item) {
    return function () {
      console.log(item);
    };
  });
}

function makeLoggersNamed(data) {
  function logItem(item) {
    return function () {
      console.log(item);
    };
  }

  return data.map(logItem);
}
```

They allocate the same number of closures: one per element, either way. Naming
the factory does not save an allocation, it just gives the function a name.
Closures are cheap to create. The cost that matters is holding them longer than
you need, which is a lifetime question rather than a counting one.

## Habits worth keeping

Reach for a closure when you want state that only a known set of functions can
touch:

```js
function createTimer() {
  let startTime = Date.now();

  return {
    getElapsed: () => Date.now() - startTime,
    reset: () => {
      startTime = Date.now();
    },
  };
}
```

Skip it when a plain function does the job. A factory whose returned function
captures nothing is a slower way to write that function.

When the state belongs to a thing you will create many of, a class with private
fields covers the same ground and says so in the syntax:

```js
class Counter {
  #count = 0;

  increment() {
    return ++this.#count;
  }

  get count() {
    return this.#count;
  }
}
```

## Where you have already used them

```js
function createApiClient(baseUrl, apiKey) {
  const defaultHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  return {
    async get(endpoint) {
      const response = await fetch(`${baseUrl}${endpoint}`, { headers: defaultHeaders });
      return response.json();
    },

    async post(endpoint, data) {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(data),
      });
      return response.json();
    },
  };
}

const api = createApiClient('https://api.example.com', 'your-api-key');
```

`api.get('/users')` carries the base URL and the auth header without either
becoming a parameter or a global, and the API key never becomes a property
anybody can read off the client.

A closure is created every time a function is created, which means none of this
is a feature you opt into. It is how the language holds on to scope.
