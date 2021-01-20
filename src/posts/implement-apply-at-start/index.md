---
layout: blog.pug
title: Implement applyAtStart/applyAtEnd
description: Popmotion Pose API has applyAtStart/applyAtEnd, implement these in Pure.
tags: ["post", "tech", "development", "javascript"]
date: "2019-06-23"
---

The [Popmotion Pose](https://popmotion.io/pose) API includes the `applyAtStart` and `applyAtEnd` [configuration options](https://popmotion.io/pose/api/config/#config-options-pose-config-applyatstart/applyatend). These config options are useful for setting properties on elements which cannot normally be animated such as the `display` CSS attribute. However, Popmotion Pure does not have similar config that I can find.

This functionality can be replicated using chained actions. In a chain of actions, we can add our own custom [Action](https://popmotion.io/api/action/) which will return the properties to apply to our element:

```javascript:title=Loop forever
chain(
  // highlight-start
  action(({update, complete}) => {
    // applyAtStart
    update({display: 'inline-block'})
    complete()
  }),
  // highlight-end
  tween({...}),
  delay(2000),
  tween({...}),
  // highlight-start
  action(({update, complete}) => {
    // applyAtEnd
    update({display: 'none'})
    complete()
  }),
  // highlight-end
)
```

The `action` function accepts an init function which is passed `update`, `complete` and `error` functions. Update will update the underlying observable with whatever data we provide it. `update` can be called as many times as you like, until `complete()` is called. At that point, the next item in the chain will start.

In this example, we're setting `display: inline-block` when the animation starts, and `display: none` when the animation ends: https://codepen.io/tyronetudehope/pen/KjmpNd
