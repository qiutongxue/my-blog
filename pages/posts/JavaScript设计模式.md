---
title: JavaScript 设计模式
comments: true
toc: true
toc_number: true
copyright: true
mathjax: false
katex: false
sticky: 0
date: 2020-10-18 17:34:05
tags: ['JavaScript']
category: 计算机相关
keywords:
description: 可能有关的设计模式？
top_img:
cover: ''
---

## 单例模式

```js
const getSingle = function(fn) {
    let result
    return function() {
        return result || (result = fn.apply(this /* window */, arguments))
    }
}

/* ------- sample ------ */
const createInstance = function () {
    return new Instance()
}

const craeteSingleInstance = getSingle(createInstance)

// 在此处第一次调用，所以 this 指向 window
const a = craeteSingleInstance()
const b = craeteSingleInstance()

assert(a === b)
```

## 策略模式

目的：分离动态的策略组与静态的取值（调用函数）

手段：封装策略组，并用统一的接口调用

```js
const strategies = {
    "sA": function(value) {
        return value * 1
    },
    "sB": function(value) {
        return value * 2
    },
    "sC": function(value) {
        return value * 4
    },
    ...
}

const calc = function(strategy, value) {
    return strategies[strategy](value)
}

/* -------- sample ---------*/
calc("sA", 1000)
calc("sB", 500)
calc("sC", 250)
```
