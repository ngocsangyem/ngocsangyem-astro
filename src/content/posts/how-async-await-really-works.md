---
title: "How async/await really works"
date: 2022-06-03
tags: ["javascript", "async"]
description: "Walking a single fetch through the call stack, the browser and the microtask queue, one whiteboard frame at a time."
---

MDN puts it plainly: `async` and `await` let you write promise-based code in a
cleaner style, without wiring up promise chains by hand. That describes the
result. It says nothing about what the engine does with your function while the
network is busy, and that is the part worth drawing.

Everything below tracks one small program.

```js title="get-todo.js"
const getTodo = async () => {
  console.log('Log me first');
  const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
  const todo = await response.json();
  console.log(todo);
};

getTodo();

console.log('Log me second');
```

It prints in this order:

```
Log me first
Log me second
{ userId: 1, id: 1, title: '...', completed: false }
```

The third line is the one with a story behind it.

## Calling the function

We declare `getTodo`, then call it, which creates an execution context. The
first line inside runs immediately, so `Log me first` reaches the console right
away. Call that 1ms.

![The getTodo execution context with an empty memory column, global memory holding getTodo, and Log me first in the console](/posts/how-async-await-really-works/step-01.webp)

Next line. `response` is declared, and until the right-hand side produces
something it holds `undefined`.

![The same context now showing response = undefined, with a response slot in its memory column](/posts/how-async-await-really-works/step-02.webp)

`fetch` returns a promise object. Two parts of it matter here: a value slot,
empty for now, which will hold whatever comes back, and a list of fulfilment
handlers, empty until something subscribes.

![The context with response = await fetch pointing at a promise object holding a value slot and an empty handler list](/posts/how-async-await-really-works/step-03.webp)

Notice that nothing assigns that promise to a variable of ours. It sits in
memory, held alive by the suspended function, and `response` will eventually
receive its fulfilment value rather than the promise itself.

> [!NOTE]
> The whiteboard spells the handler list `onFullfilled`. The name is
> `onFulfilled`, with a single `l` in the middle, and it is not a property you
> can reach from JavaScript. The specification keeps these lists internal, so
> read the drawing as a stand-in for them.

Meanwhile the browser has started work of its own. `fetch` hands the request to
the browser's networking machinery, which sends an HTTP message to the server and
keeps track of whether a response has arrived. At 1ms, it has not.

![The browser box sending an HTTP GET to a server, its completion column reading not complete at 1ms](/posts/how-async-await-really-works/step-04.webp)

> [!NOTE]
> The drawing labels that box `xhr`. `fetch` does not use `XMLHttpRequest`; it is
> a separate browser API with its own implementation. Read the label as "the
> browser's network machinery" and nothing else in the walkthrough changes.

When the response does turn up, the browser already has somewhere to put it: the
promise object sitting in memory.

![The browser box gaining an on-complete column that will carry the response value](/posts/how-async-await-really-works/step-05.webp)

## Where await sends you

Now `await` does its job, which is to suspend `getTodo` and hand control back to
the caller. We never reach the assignment into `response`. Execution leaves the
function entirely.

The next line of the async function is `const todo = await response.json()`, and
it does not run either. Control has already gone, so the next thing to run is the
line after the call in the outer script.

![Two arrows leaving the context at each await, with Log me second printed in the console](/posts/how-async-await-really-works/step-06.webp)

This is the whole point of the exercise. We want to start something slow, a
request that might take a second, and keep running synchronous code while it is
in flight. Getting out of the function is how that happens.

What makes `await` more than an early exit is that leaving is reversible. When
the value arrives, execution resumes on the line it left, with the awaited value
in hand.

Say the server answers 200ms later. The browser writes the response into the
promise's value slot.

![The browser receiving the response at 201ms, the value flowing into the promise object](/posts/how-async-await-really-works/step-07.webp)

## Why the resumption still waits

Settling the promise does not put `getTodo` back on the call stack there and
then. It schedules the continuation as a microtask.

The engine drains the microtask queue only after the currently running script
finishes, and it runs earlier microtasks first. So the resumption waits for
`console.log('Log me second')`, and for anything queued ahead of it, even when
the awaited promise was already settled before the `await` ran.

That last part is easy to check:

```js
console.log('script start');

(async () => {
  await null; // already settled, and still deferred
  console.log('after await');
})();

queueMicrotask(() => console.log('queued microtask'));

console.log('script end');
```

```
script start
script end
after await
queued microtask
```

Only once the queue reaches our continuation does `getTodo` come back, at exactly
the line `await` left.

![The continuation re-entering the context at the await fetch line](/posts/how-async-await-really-works/step-08.webp)

The awaited value is assigned to `response`, which is the assignment the first
`await` skipped past.

![The resolved value stored as response in the context memory column](/posts/how-async-await-really-works/step-09.webp)

## The second await costs another trip

`response` is a `Response` object, not the parsed body. `response.json()` reads
the body stream and returns another promise, so the second `await` suspends
`getTodo` all over again and queues a second continuation. Only after that does
`todo` hold a parsed object.

![todo receiving the parsed object and being stored in the context memory](/posts/how-async-await-really-works/step-10.webp)

Two awaits in a row are two suspensions, not one. Reading a JSON body is never
free, and it is a common surprise when someone counts round trips and comes up
one short.

With `todo` finally populated, `console.log(todo)` runs and the third line
appears.

![The console showing all three lines, the todo object last](/posts/how-async-await-really-works/step-11.webp)

## What to keep

An async function returns a promise the moment you call it, and runs
synchronously up to its first `await`. That `await` suspends the function, hands
control back to the caller, and registers a continuation against the awaited
promise. When the promise settles, the continuation joins the microtask queue and
runs after the current script and any microtasks already waiting.

The comparison to `yield` holds up. An async function really is a suspendable
function, and the rewrite from async/await into generators is a well-known one.
The difference is who resumes it: a generator waits for someone to call `next()`,
while an async function is resumed by the promise settling, through the microtask
queue, with no driver you have to write.

> [!TIP]
> A rejected promise makes `await` throw at the point where it suspended, so
> `try`/`catch` around an `await` behaves the way it looks like it should. Without
> one, the async function returns a rejected promise and the failure surfaces
> later as an unhandled rejection.

## Additional links

* [MDN: await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
* [JavaScript the Hard Parts: Asynchronous JavaScript](https://www.youtube.com/watch?v=xTjx3q2Nm1w)
* [Difference between async/await and ES6 yield with generators](https://stackoverflow.com/questions/36196608/difference-between-async-await-and-es6-yield-with-generators)
