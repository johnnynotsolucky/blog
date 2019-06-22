---
title: Looping Chained Popmotion Actions
description: Chain a sequence of actions and loop them indefinitely
tags: ["tech", "development", "javascript"]
date: "2019-06-22T22:51:00.000+0200"
published: true
changelog:
  - date: "2019-06-22T22:51:00.000+0200"
    message: "Published"
---

[Popmotion](https://popmotion.io/) has a nice API for defining animations, and some actions include a property to loop the action:

```javascript:title=Loop forever
tween({
  from: {opacity: 0},
  to: {opacity: 1},
  duration: 2000,
  // highlight-start
  loop: Infinity,
  // highlight-end
}).start(el.set)
```

This will replay the animation for… Infinity:

https://codepen.io/tyronetudehope/pen/dBWPwV

However, with more complex animations, we can make use of the Action's [start](https://popmotion.io/api/action/#action-methods-start) method callbacks. For example, if we'd like to create an animation which fades something in, displays it for a few seconds, then fades out again, and repeat ad infinitum, we can wrap it in a function and which calls itself from the `complete()` function:

```javascript:title=Loop chained actions forever
const animation = chain(
  // Fade in
  tween({
    from: {opacity: 0},
    to: {opacity: 1},
    duration: 500,
  }),
  // Pause
  delay(2000),
  // Fade out
  tween({
    from: {opacity: 1},
    to: {opacity: 0},
    duration: 500,
  }),
  // Delay fade in
  delay(500),
)

const runAnimation = () => {
  animation.start({
    update: el.set,
    // highlight-start
    complete: runAnimation,
    // highlight-end
  })
}

runAnimation()
```

https://codepen.io/tyronetudehope/pen/JQNdjy
