---
title: TransitionGroup 探索
description: 一个困扰我整整一天的问题
date: 2022-8-26
category: '原创'
---

1. 一定要明确写明 `.[name]-enter/leave-from/to`，不能缺少 `from/to`。
2. 为 `.[name]-move` 添加 transition，就能在元素移动的时候自动适应动画。
3. 为 `[name]-leave-active` 添加 `position: absolute` 使其脱离文档流，能计算其它组件的位置。

通过 `v-show` 控制时（不知道 `v-if` 是否一样），当组件消失时，即设置了 `display:none` 后，此时组件的位置可以通过 `getBoundingClientRect()` 获取。发现此时 x、y、width、height 均为 0

现在问题来了，如果要让这个组件复原呢？我们知道添加组件到 TransitionGroup 中，会先为该组件添加一个短暂的 `enter-from`，再添加最终状态 `enter-to`。而 enter-from 在哪呢？就在消失的那个位置，即 client 的左上角。那么在只设置了 transition 的情况下，组件会从左上角飞到自己的位置。非常非常难看。

要怎么解决这个左上角的问题呢？其实就是不想让组件的动画是从左上角开始的，只要为 transition 设置计算的属性即可，比如设置只计算 opacity：

```css
.[name]-enter-from {
  transition-property: opacity !important;
}
```

那如果想要除了渐变之外还要有位置上的变化呢？别急，我们可以再为 enter-from 设置好位置，其实这个时候的目标位置已经是正确的了，所以设置相应的 transform 即可

```css
.[name]-enter-from {
  transform: translateX(-100%); /* 从左边淡入 */
}
```

总结一下，先为 enter-from 添加 `transition-property`，消去和位置相关的动画。因为 enter-from 只是短暂的一瞬间，这一瞬间之后组件已经落到相应的计算位置上了。此时 transition 又恢复成了默认值，这个时候再指定 transform，就能按照真正的位置计算了。
