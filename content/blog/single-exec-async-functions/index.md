---
title: Caching an asynchronous action for single execution in JavaScript
description: Do the same work multiple times, simultaneously. But only do it once.
tags: ["tech", "development", "javascript"]
date: "2019-06-12T16:42:00.000"
published: true
changelog:
  - date: "2019-06-12T16:42:00.000"
    message: "Published"
---

On occasion you might need to call a function to do the same work multiple times and at the same time. For example, imagine you had some function which requests a list of data from a remote endpoint, and you had multiple dependencies on that function which would fetch that data once notified that it has changed.

Here is an example function which does "work":

```javascript:title=doWork.js
const doWork = () =>
  new Promise(resolve => {
    setTimeout(() => {
      console.log(`doing some work`)
      resolve()
    }, 5000)
  })
```

```javascript
doWork()
doWork()
doWork()

// After 5 seconds
// doing some work
// doing some work
// doing some work
```

That's cool. It logs a value out once its done, repeatedly. It's illustrative. Now imagine it was resource intensive; how would running it multiple times, simultaneously, affect your infrastructure?

The good news is JavaScript treats functions as first-class citizens so we can wrap our worker function and return a new function. The new, wrapped, function would be the one we pass around to it's dependencies.

```javascript:title=doOnce.js
const doOnce = fn => {
  let promise
  return () => {
    if (promise) {
      return promise
    }

    promise = fn()
      .finally(result => {
        promise = null
        return result
      })

    return promise
  }
}
```

Maybe this code seems a bit unnecessary, however, it's doing three things:

- Returning a new function which would call the function we're wrapping;
- Caching and tracking the state of the `promise` and setting it to null once it has resolved;
- Executing whichever function we passed to it and invaliding the promise.

Let's step through the code quickly by executing our worker function.

```javascript
const doWorkOnce = doOnce(doWork)
```

Wrap our earlier worker function and create a new function, `doWorkOnce`. At this point, `promise` is still undefined, and nothing has been executed.

```javascript
doWorkOnce()

// After 5 seconds
// doing some work
```

Now we're executing the logic in the new function. `promise` would still be undefined, so the `doWork` function will be called, and `promise` is set to the Promise returned by `doWork`. After a few seconds, the output would be logged to your console. Once the promise resolved, the state of `promise` is reset to `null`.

```javascript
doWorkOnce()
doWorkOnce()
doWorkOnce()

// After 5 seconds
// doing some work
```

After the earlier invocation, `promise` is now `null`, so the first call to `doWorkOnce` would set it to a new promise returned by our worker function. In the second call, since promise is not null and not undefined, it assumes that we're still waiting for it to resolve, and so it returns the cached Promise. The same for the third call.

Once `promise` resolves, it's once again set back to null.

## A caveat

If your worker function returns different data or does different work based on the arguments you send it (which it should!), then this wrapper function would not work. For each invocation, with different arguments, we'd have the same data returned as the first call.

Here's an example:

```javascript:title=doOnce.js
const doOnce = fn => {
  let promise
  // highlight-start
  return (...args) => {
  // highlight-end
    if (promise) {
      return promise
    }

    // highlight-start
    promise = fn(...args)
    // highlight-end
      .finally(result => {
        promise = null
        return result
      })

    return promise
  }
}
```

I've added `...args` so that we can pass through any arguments we need to the worker function. And then I updated the worker function to print out the work its doing:

```javascript:title=doWork.js
const doWork = work =>
  new Promise(resolve => {
    setTimeout(() => {
      console.log(`doing ${work}`)
      resolve(work)
    }, 5000)
  })
```

Running the earlier example again, we should see some weird results:

```javascript
doWorkOnce('Work A')
doWorkOnce('Work B')
doWorkOnce('Work C')

// After 5 seconds
// doing Work A
```

Hmmm. While the promise is cached, the arguments for the function are not. So even though we're expecting it to do something different each time, the worker function never sees the new arguments we pass it. With some creativity, you should be able to make it work. Ideally you'd want output like this:

```javascript
doWorkOnce('Work A')
doWorkOnce('Work B')
doWorkOnce('Work C')
doWorkOnce('Work A')
doWorkOnce('Work A')
doWorkOnce('Work C')

// doing Work A
// doing Work B
// doing Work C
```

This solution is only useful if you're doing the _exact same_ work for every invocation.
