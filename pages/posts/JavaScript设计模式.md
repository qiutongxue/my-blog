---
title: JavaScript 设计模式
comments: true
toc: true
toc_number: true
copyright: true
mathjax: false
katex: false
sticky: 0
date: 2022-6-18 17:34:05
tags: ['JavaScript']
category: 笔记
keywords:
description: '在 JavaScript 中，设计模式另有玄机……'
top_img:
cover: 'https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/创作型ppt.svg'
---

[toc]

> **写在前面：**
>
> 代码段中可能会出现非常多的 `Array.prototype.xxx.call(arguments, ...)`，这是因为 `arguments` 本身不是 Array，但是可以通过 `call` 或 `apply` 将 `arguments` 当成数组使用。同样地，不止是 `arguments`，只要对象具有 `length` 属性，就能看做数组调用：
>
> ```js
> // 可以对字符串调用不修改原数组的相关方法（调用修改方法如 push, shift 等会报错，因为字符串是 readonly 的）
> Array.prototype.slice.call('123') // ['1', '2', '3']
> Array.prototype.map.call('123', v => `${v}0`) // ['10', '20', '30']
> 
> // 对 object 同样适用，前提是有 length 属性和数字下标
> const obj = {
>   length: 2,
>   0: 1,
>   1: 2
> }
> Array.prototype.push.call(obj, 3) // obj={0: 1, 1: 2, 2: 3, length: 3}
> ```
> 
> 在 ES6 中，用 `...args` 代替 `arguments` 不失为一种更好的选择。


## 单例模式


```js
const getSingle = function (fn) {
  let result
  return function () {
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

优点：符合开放-封闭原则

缺点：用户需要了解策略组

```js
/* 对于同一个动作的不同策略 */
const strategies = {
    "strategyA": function(value) {
        return value * 1
    },
    "strategyB": function(value) {
        return value * 2
    },
    "strategyC": function(value) {
        return value * 4
    },
    ...
}
/* 统一的接口 */
const calc = function(strategy, value) {
    return strategies[strategy](value)
}

/* -------- sample ---------*/
calc("strategyA", 1000)
calc("strategyB", 500)
calc("strategyC", 250)
```


### 策略模式验证表单


```js
/* -------------- 验证表单的策略组 --------------- */
const strategies = {
  isNonEmpty(value, errorMsg) {
    if (value === '')
      return errorMsg
  },
  minLength(value, length, errorMsg) {
    if (value.length < length)
      return errorMsg
  },
  isMobile(value, errorMsg) {
    if (!/(^1[3|5|8][0-9]{9}$)/.test(value))
      return errorMsg
  },
}

/* -------------- 统一接口 Validator --------------- */
class Validator {
  constructor() {
    this.cache = []
  }

  add(dom, rules) {
    rules.forEach((rule) => {
      const strategyAry = rule.strategy.split(':')
      const errorMsg = rule.errorMsg
      this.cache.push(() => {
        const strategy = strategyAry.shift()
        strategyAry.unshift(dom.value)
        strategyAry.push(errorMsg)
        return strategies[strategy].apply(dom, strategyAry)
      })
    })
  }

  start() {
    for (let i = 0; i < this.cache.length; i++) {
      const validataFunc = this.cache[i]
      const errorMsg = validataFunc()
      if (errorMsg)
        return errorMsg
    }
  }
}

/* -------------- 用户代码，直接配置即可使用 --------------- */
const registerForm = document.getElementById('registerForm')
const validataFunc = function () {
  const validator = new Validator()
  validator.add(registerForm.userName, [{
    strategy: 'isNonEmpty',
    errorMsg: '用户名不能为空',
  }, {
    strategy: 'minLength:6',
    errorMsg: '用户名长度不能小于 10 位',
  }])
  validator.add(registerForm.password, [{
    strategy: 'minLength:6',
    errorMsg: '密码长度不能小于 6 位',
  }])
  validator.add(registerForm.phoneNumber, [{
    strategy: 'isMobile',
    errorMsg: '手机号码格式不正确',
  }])
  const errorMsg = validator.start()
  return errorMsg
}
registerForm.onsubmit = function () {
  const errorMsg = validataFunc()
  if (errorMsg) {
    alert(errorMsg)
    return false
  }
}
```

## 代理模式



保护代理用于控制不同权限的对象对目标对象的访问。


### 虚拟代理

虚拟代理把一些开销很大的对象，延迟到真正需要它的时候才去创建。

```js
/* --------------- 虚拟代理实现图片预加载 --------------- */

const myImage = (function () {
  const imgNode = document.createElement('img')
  document.body.appendChild(imgNode)
  return {
    setSrc: (src) => {
      imgNode.src = src
    }
  }
})()

const proxyImage = (function () {
  const img = new Imgae()
  img.onload = () => { // 当大图片加载好了之后，展示在前端
    myImage.setSrc(img.src)
  }
  return {
    setSrc: (src) => {
      myImage.setSrc('some-small-image.jpg') // 先放出准备好的小图片，如【加载中...】
      img.src = src
    }
  }
})()

proxyImage.setSrc('some-big-image.jpg') // 准备加载的大图片

```


### 缓存代理

类似于 React 的 `useCall()`。当传入相同的参数时，直接从缓存中拿结果（memo）

```js
function fn() {
  // ...caculating...
  return val
}

/* -------- 缓存代理工厂 --------- */
function createProxyFactory(fn) {
  const cache = {}
  return function () {
    const args = Arrays.prototype.join.call(arugments, ',')
    if (args in cache)
      return cache[args]

    return cache[args] = fn(...arguments)
  }
}

const proxyFn = createProxyFactory(fn)
```

## 迭代器模式


```js
function each(array, callback) {
    for (let i = 0; i < array.length; i++) {
        callback(array[i], i)
    }
}

each([1,2,3], (val, idx) => {...})
```


### 获取上传文件对象


```js
const getActiveUploadObj = function () {
  try {
    return new ActiveXObject('TXFTNActiveX.FTNUpload') // IE 上传控件
  }
  catch (e) {
    return false
  }
}
const getFlashUploadObj = function () {
  if (supportFlash()) { // supportFlash 函数未提供
    const str = '<object type="application/x-shockwave-flash"></object>'
    return $(str).appendTo($('body'))
  }
  return false
}
const getFormUpladObj = function () {
  const str = '<input name="file" type="file" class="ui-file"/>' // 表单上传
  return $(str).appendTo($('body'))
}
const iteratorUploadObj = function (...args) {
  for (let i = 0; i < args.length; i++) {
    const fn = args[i]
    const uploadObj = fn()
    if (uploadObj !== false)
      return uploadObj
  }
}
const uploadObj = iteratorUploadObj(getActiveUploadObj, getFlashUploadObj, getFormUpladObj)

```

## 发布-订阅模式（观察者模式）

DOM 的事件绑定就是一种发布订阅模式。

```js
document.addEventListener('click', () => {}) // 添加订阅
document.removeEventListener('click', fn) // 取消订阅
```


普通用法：

```js
const event = {
  clientList: {},
  listen(key, fn) {
    if (!this.clientList[key])
      this.clientList[key] = []
    this.clientList[key].push(fn)
  },
  trigger(key, ...args) {
    const fns = this.clientList[key]
    if (!fns)
      return false
    fns.forEach((fn) => { fn.apply(this, ...args) })
  },
  remove(key, fn = null) {
    const fns = this.clientList[key]
    if (!fn)
      fns && (fns.length = 0)
    else
      this.clientList[key] = fns.filter(f => f !== fn)
  },
}

/* 安装发布器 */
const installEvent = (obj) => {
  for (const key in event)
    obj[key] = event[key]
}

/* 用户代码 */
const observed = { name: 'observed' }
installEvent(observed)
observed.listen('h', () => {})
observed.trigger('h')
```


### 模块化+全局使用+命名空间

支持命名空间，支持先发布后订阅：

```js
const namespaceCache = {}

const _listen = (key, fn, cache) => {
  if (!cache[key])
    cache[key] = []
  cache[key].push(fn)
}

const _trigger = (key, cache, ...args) => {
  const fns = cache[key]
  if (!fns || !fns.length)
    return
  fns.forEach((fn) => {
    fn.apply(this, args)
  })
}

const _remove = (key, cache, fn) => {
  const fns = cache[key]
  if (!fns)
    return
  if (!fn)
    cache[key] = []
  else
    cache[key] = fns.filter(f => f !== fn)
}

const createEvent = (namespace = 'default') => {
  if (namespaceCache[namespace])
    return namespaceCache[namespace]
  const cache = {}
  let offlineStack = []
  const event = {
    listen(key, fn) {
      _listen(key, fn, cache)
      if (offlineStack === null)
        return
      offlineStack.forEach((fn) => {
        fn()
      })
      offlineStack = null
    },
    trigger(key, ...args) {
      const fn = () => {
        _trigger.call(this, key, cache, ...args)
      }
      if (offlineStack)
        offlineStack.push(fn)
      else
        fn()
    },
    remove(key, fn = null) {
      _remove(key, cache, fn)
    },
    one(key, fn) {
      _remove(key, cache)
      this.listen(key, fn)
    },
  }
  return namespace
    ? (namespaceCache[namespace] = event)
    : event
}

export { createEvent }

```

用户调用：

```js
import { createEvent } from './Event.mjs'

/* 支持先发布后订阅 */
const defaultEvent = createEvent()
defaultEvent.trigger('click', 'default@click')
defaultEvent.listen('click', (a) => {
  console.log(a)
})

/* 支持多个命名空间 */
const event1 = createEvent('namespace1')
event1.listen('click', (a) => {
  console.log(a)
})
event1.trigger('click', 'namespace1@click')

const event2 = createEvent('namespace2')
event2.listen('click', (a) => {
  console.log(a)
})
event2.trigger('click', 'namespace2@click')

```

## 命令模式

在 JavaScript 中，由于高阶函数的存在，命令模式基本上是隐式的，和回调函数差不多。

但是在命令模式下，不仅可以执行命令，还可以撤销命令。用 execute 表示执行，undo 表示撤销。

receiver 就是负责执行客户命令的执行者。

```js
Command = function(receiver, fn) {
    return {
        execute() 
            // 让 receiver 做的事
            receiver.xxx()
        },
        undo() {
            // 让 ceceiver 做的事
            receiver.xxx()
        }
    }
}
const command = Command(receiver)
command.execute()
command.undo()
```


### 利用命令模式实现回放功能


```js
/* 这里的命令只实现了 execute，没包含 undo */
const actions = {
  attack() {},
  defense() {},
  jump() {},
  crouch() {}
}
const makeCommand = (receiver, state) => {
  return () => {
    receiver[state]()
  }
}
/* 映射键位 -> 对应命令 */
const commands = {
  119: 'jump', // W
  115: 'crouch', // S
  97: 'defense', // A
  100: 'attack' // D
}

const commandStack = [] // 记录执行过的命令

document.onkeypress = function (e) {
  const keyCode = e.keyCode; const command = makeCommand(actions, commands[keyCode])
  if (command) {
    command()
    commandStack.push(command)
  }
}

/* 回放 */
const replay = () => {
  while (commandStack.length) {
    const command = commandStack.shift()
    command()
  }
}
```

其实利用 `commandStack` 可以实现多次撤销（只需要给每个 command 实现 execute 和 undo 即可）。对于那种**不支持撤销**的功能，实现撤销也可以转化成**重新执行一遍命令**


### 宏命令

其实就是接收多个命令的命令。

```js
const MacroCommand = function () {
  return {
    commandList: [],
    add(command) {
      this.commandList.push(command)
    },
    execute() {
      commandList.forEach(command => command.execute())
    }
  }
}

/**/
const command1 = { execute: () => {} }
const command2 = { execute: () => {} }

const macroCommand = MacroCommand()
macroCommand.add(command1)
macroCommand.add(command2)
macroCommand.execute()
```


> 关于命令模式和策略模式：
>
> 没有**接收者**（receiver）的智能命令，退化到和**策略模式**非常相近，从代码结构上已经无法分辨它们，能分辨的只有它们意图的不同。**策略模式指向的问题域更小**，所有策略对象的目标总是一致的，它们只是**达到这个目标的不同手段**，它们的内部实现是针对“算法”而言的。而智能命令模式指向的问题域更广，command 对象解决的目标更具发散性。命令模式还可以完成撤销、排队等功能。
>


## 组合模式

组合模式用来表示对象的部分—整体层次结构。表现形式为构造一棵树。

组合模式中的组件们应该要继承同一个抽象类。

### 扫描文件（夹）


```js
class Folder {
    constructor(name) {
        this.name = name
        this.parent = null
        this.files = []
    }
    add(file) {
        file.parent = this
        this.files.push(file)
    }
    scan() {
        files.forEach(file => file.scan())
    }
    remove() {
        if (!this.parent) return
        this.parent.files = this.parent.files.filter(file => file !== this)
    }
}
class File {
    constructor(name) {
        this.name = name
    }
    add() {
        throw new Error('')
    }
    scan() {}
    remove() {
        if (!this.parent) return
        this.parent.files = this.parent.files.filter(file => file !== this) 
    }
}

const root = new Folder()
root.add(...) 
root.scan()
```


## 模板方法模式

在抽象类中指定号需要的方法，以及在运行时各方法配合的顺序。


```js
/* 这是抽象类，但是 JS 中并没有抽象类这个概念，只能用普通类来表示
    而因为是普通类，无法自动 @Override，需要在抽象方法上抛异常
 */
class Beverage {
  boilWater() { console.log('把水煮沸') }
  brew() { throw new Error() }
  pourInCup() { throw new Error() }
  addCondiments() { throw new Error() }
  init() {
    this.boilWater()
    this.brew()
    this.pourInCup()
    this.addCondiments()
  }
}

/*  剩下的只需要继承并配置相应方法，不需要重写 init */
class Tea extends Beverage {
  brew() { console.log('用水冲茶') }
  pourInCup() { console.log('把茶倒进杯子') }
  addCondiments() { console.log('加啥') }
}

const tea = new Tea()
tea.init()

```


> **好莱坞原则**：不要来找我，我会给你打电话。
>
> 发布-订阅模式、回调函数以及模板方法模式都体现了好莱坞原则。
>


在不使用继承的情况下，JavaScript 也能做到同样的事：

```js
function Beverage(options) {
  const boilWater = () => { console.log('把水煮沸') }
  const brew = options.brew || function () { throw new Error() }
  const pourInCup = options.pourInCup || function () { throw new Error() }
  const addCondiments = options.addCondiments || function () { throw new Error() }

  return class {
    init() {
      boilWater()
      brew()
      pourInCup()
      addCondiments()
    }
  }
}

const Tea = Beverage({
  brew() { console.log('用水冲茶') },
  pourInCup() { console.log('把茶倒进杯子') },
  addCondiments() { console.log('加啥') }
})
const tea = new Tea()
tea.init()

const Coffee = Beverage({
  brew() { console.log('用水冲咖啡') },
  pourInCup() { console.log('把咖啡倒进杯子') },
  addCondiments() { console.log('加牛奶和糖') }
})
const coffee = new Coffee()
coffee.init()
```


## 享元模式 (Flyweight)

flyweight：轻量化。享元模式的目标就是使内存空间轻量化

1. 有大量具有相同功能的对象
2. 使用这些对象具有很大的性能开销
3. 该对象大多数状态能变成外部状态，可以将这些外部状态剥离
4. 剥离之后，可以创建只有内部状态的共享对象，来替代大量的相似对象
5. 之后在使用到外部状态时，再把外部状态交给共享对象

### 以文件上传为例

文件上传有若干中方式，如靠浏览器插件上传、用 flash 上传、表单上传等等。

1. 如果一次性上传多个文件，就要创建多个  `Upload` 对象。
2. 有很大的性能开销
3. 文件名称、文件大小可以看做外部状态，和 Upload 本身并无关系，可以将其剥离
4. 剥离之后，`uploadType` 为内部状态，表示要上传的方式，只需要按照 `uploadType` 的类别分别创建相应数量的 Upload 类型

```js
/* ------------------- factory.mjs ------------------- */
import uploadManager from './uploadManager.mjs'

/* ------------------- uploadManager.mjs ------------------- */
import { createUpload } from './factory.mjs'

/* ------------------- main.mjs ------------------- */
import uploadManager from './uploadManager.mjs'

class Upload {
  constructor(uploadType) { // 只接收内部状态
    this.uploadType = uploadType
  }

  delFile = (id) => {
    // 在需要用到外部状态之前设置好外部状态
    uploadManager.setExternalState(id, this)
    if (this.fileSize < 3000)
      return this.dom.parentNode.removeChild(this.dom)
    if (window.confirm(`确定要删除该文件吗? ${this.fileName}`))
      return this.dom.parentNode.removeChild(this.dom)
  }
}
const createdFlyweightObjs = {}

export const createUpload = (uploadType) => {
  return createdFlyweightObjs[uploadType] || (createdFlyweightObjs[uploadType] = new Upload(uploadType))
}

const uploadDatabase = {}

const add = (id, uploadType, fileName, fileSize) => {
  const flyweightObj = createUpload(uploadType)
  const dom = document.createElement('div')
  dom.innerHTML = `
    <span>文件名： ${fileName}, 文件大小: ${fileSize} </span>
    <button class="delFile">删除</button>
  `
  dom.querySelector('.delFile').addEventListener('click', () => {
    flyweightObj.delFile(id)
  })
  document.body.appendChild(dom)
  uploadDatabase[id] = {
    fileName,
    fileSize,
    dom,
  }
  return flyweightObj
}

/**
 * 设置外部状态
 */
const setExternalState = (id, flyweightObj) => {
  const uploadData = uploadDatabase[id]
  Object.entries(uploadData).forEach(([key, value]) => {
    flyweightObj[key] = value
  })
}

export default {
  add,
  setExternalState,
}

let id = 0
const startUpload = (uploadType, files) => {
  files.forEach((file) => {
    const uploadObj = uploadManager.add(id++, uploadType, file.fileName, file.fileSize)
    console.log(uploadObj)
  })
}
startUpload('plugin', [
  {
    fileName: '1.txt',
    fileSize: 1000,
  },
  {
    fileName: '2.html',
    fileSize: 3000,
  },
  {
    fileName: '3.txt',
    fileSize: 5000,
  },
])
startUpload('flash', [
  {
    fileName: '4.txt',
    fileSize: 1000,
  },
  {
    fileName: '5.html',
    fileSize: 3000,
  },
  {
    fileName: '6.txt',
    fileSize: 5000,
  },
])

```


### 对象池——基于共享思想

当池子里没有对象时，新建对象。当不需要用到对象时，可以将对象回收回对象池。

```js
const createObjPoolFactory = (createObjFn) => {
  const objPool = []
  return {
    create(...args) {
      return objPool.length ? objPool.shift() : createObjFn(args)
    },
    recover(obj) {
      objPool.push(obj)
    }
  }
}

/* ============ 使用 ============ */
const iframeFactory = createObjPoolFactory(() => {
  const iframe = document.createElement('iframe')
  document.body.appendChild(iframe)
  iframe.addEventListener('load', () => {
    iframeFactory.recover(iframe)
  })
  return iframe
})

const iframe1 = iframeFactory.create()
iframe1.src = 'https://www.baidu.com'
const iframe2 = iframeFactory.create()
iframe2.src = 'https://www.qq.com'
setTimeout(() => {
  const iframe3 = iframeFactory.create() // 这里使用的 iframe 是 iframe1
  iframe3.src = 'https://www.163.com'
}, 3000)

```


## 职责链

当一个发送者对应多个接收者（接收者有优先顺序）时，可以将接收者按照优先顺序排成单链表，这样发送的请求就能在链表中单向传递，遇到合适的就执行，不合适就传给下一个节点。

这样无需关心具体交给哪一个接收者执行。

```js
const NEXT = Symbol('next')
class Chain {
  constructor(fn) {
    this.fn = fn
    this.next = null // 后继节点
  }

  setNext(nextChain) {
    this.next = nextChain
  }

  request(...args) {
    const ret = this.fn(...args)
    if (ret === NEXT) { // 交给后继节点执行
      return this.next && this.next.request(...args)
    }
    return ret
  }
}

/* ------------------------ 使用 ------------------------ */
const order500 = function (orderType, pay, stock) {
  if (orderType === 1 && pay === true)
    console.log('500 元定金预购，得到 100 优惠券')
  else
    return NEXT // 我不知道下一个节点是谁，反正把请求往后面传递
}
const order200 = function (orderType, pay, stock) {
  if (orderType === 2 && pay === true)
    console.log('200 元定金预购，得到 50 优惠券')
  else
    return NEXT // 我不知道下一个节点是谁，反正把请求往后面传递
}
const orderNormal = function (orderType, pay, stock) {
  if (stock > 0)
    console.log('普通购买，无优惠券')
  else
    console.log('手机库存不足')
}

const chainOrder500 = new Chain(order500)
const chainOrder200 = new Chain(order200)
const chainOrderNormal = new Chain(orderNormal)

chainOrder500.setNext(chainOrder200)
chainOrder200.setNext(chainOrderNormal)

chainOrder500.request(1, true, 500) // 输出：500 元定金预购，得到 100 优惠券
chainOrder500.request(2, true, 500) // 输出：200 元定金预购，得到 50 优惠券
chainOrder500.request(3, true, 500) // 输出：普通购买，无优惠券
chainOrder500.request(1, false, 0) // 输出：手机库存不足

/* ==================== 新增节点 ====================== */
const order300 = function () {
  // 具体实现略
}
const chainOrder300 = new Chain(order300)
chainOrder500.setNext(chainOrder300)
chainOrder300.setNext(chainOrder200)
```


### 利用 AOP 实现职责链

利用函数式编程的优势，可以用 AOP（面向切面编程） 来实现职责链

```js
Function.prototype.after = function (fn) {
  return (...args) => {
    const ret = this(...args)
    if (ret === NEXT)
      return fn(...args)
    return ret
  }
}
const order = order500.after(order200).after(orderNormal)
order(1, true, 500) // 输出：500 元定金预购，得到 100 优惠券
order(2, true, 500) // 输出：200 元定金预购，得到 50 优惠券
order(1, false, 500) // 输出：普通购买，无优惠券

/*
    关于 order：
    this 为 order500.after(order200) 返回的函数，记为 f52
    f52 中的 this 为 order500
    执行顺序为
    1. 调用 order 时先调用了 f52            => ret = f52()
    2. 调用 f52 时先调用了 order500         => ret = order500()
    3. 调用 order500，返回 NEXT
    4. f52 接收到 NEXT，调用 order200       => return order200()
    5. 调用 order200，返回 NEXT
    6. order 接收到 NEXT，调用 orderNormal  => return orderNormal()
    7. 调用 orderNormal，结束
*/
```

### 获取上传文件对象

与 [迭代器模式](##迭代器模式) 相比，用职责链模式更加简单（不需要额外创建迭代器）


```js
const getActiveUploadObj = function () {
  try {
    return new ActiveXObject('TXFTNActiveX.FTNUpload') // IE 上传控件
  }
  catch (e) {
    return 'nextSuccessor'
  }
}
const getFlashUploadObj = function () {
  if (supportFlash()) {
    const str = '<object type="application/x-shockwave-flash"></object>'
    return $(str).appendTo($('body'))
  }
  return 'nextSuccessor'
}
const getFormUpladObj = function () {
  return $('<form><input name="file" type="file"/></form>').appendTo($('body'))
}
const uploadObj = getActiveUploadObj.after(getFlashUploadObj).after(getFormUpladObj)

```


## 中介者模式

当多个对象强耦合时，可以使用中介者模式将其解耦。对象只需要把要做的事交给中介者即可，剩下的不需要对象自己操心


### 泡泡堂


```js
/* ==================== 中介者 ================== */
const playerDirector = (function () {
  const players = {} // 保存所有玩家
  const operations = { // 中介者可以执行的操作
    /** **************新增一个玩家***************************/
    addPlayer(player) {
      const teamColor = player.teamColor // 玩家的队伍颜色
      players[teamColor] = players[teamColor] || [] // 如果该颜色的玩家还没有成立队伍，则新成立一个队伍
      players[teamColor].push(player) // 添加玩家进队伍
    },
    /** **************移除一个玩家***************************/
    removePlayer(player) {
      const teamColor = player.teamColor // 玩家的队伍颜色
      const teamPlayers = players[teamColor] || [] // 该队伍所有成员
      for (let i = teamPlayers.length - 1; i >= 0; i--) { // 遍历删除
        if (teamPlayers[i] === player)
          teamPlayers.splice(i, 1)
      }
    },
    /** **************玩家换队***************************/
    changeTeam(player, newTeamColor) { // 玩家换队
      operations.removePlayer(player) // 从原队伍中删除
      player.teamColor = newTeamColor // 改变队伍颜色
      operations.addPlayer(player) // 增加到新队伍中
    },
    /** **************玩家死亡***************************/
    playerDead(player) {
      const teamColor = player.teamColor
      const teamPlayers = players[teamColor] // 玩家所在队伍
      let all_dead = true
      for (let i = 0; i < teamPlayers.length; i++) {
        const player = teamPlayers[i]
        if (player.state !== 'dead') {
          all_dead = false
          break
        }
      }
      if (all_dead === true) { // 全部死亡
        teamPlayers.forEach((player) => {
          player.lose() // 本队所有玩家 lose
        })
        for (const color in players) {
          if (color !== teamColor) {
            const teamPlayers = players[color] // 其他队伍的玩家
            teamPlayers.forEach((player) => {
              player.win() // 其他队伍所有玩家 win
            })
          }
        }
      }
    },
  }
  const receiveMessage = function (...args) {
    const message = args.shift() // arguments 的第一个参数为消息名称
    operations[message].apply(this, args)
  }
  return {
    receiveMessage,
  }
})()

class Player {
  constructor(name, teamColor) {
    this.name = name // 角色名字
    this.teamColor = teamColor // 队伍颜色
    this.state = 'alive' // 玩家生存状态
  }

  win = () => console.log(`${this.name} won `)
  lose = () => console.log(`${this.name} lost`)
  die = () => {
    this.state = 'dead'
    playerDirector.receiveMessage('playerDead', this)
  }

  remove = () => playerDirector.receiveMessage('removePlayer', this)
  changeTeam = color => playerDirector.receiveMessage('changeTeam', this, color)
}

const createPlayer = (name, teamColor) => {
  const newPlayer = new Player(name, teamColor)
  playerDirector.receiveMessage('addPlayer', newPlayer)
  return newPlayer
}

// 红队：
const player1 = createPlayer('皮蛋', 'red')
const player2 = createPlayer('小乖', 'red')
const player3 = createPlayer('宝宝', 'red')
const player4 = createPlayer('小强', 'red')
// 蓝队：
const player5 = createPlayer('黑妞', 'blue')
const player6 = createPlayer('葱头', 'blue')
const player7 = createPlayer('胖墩', 'blue')
const player8 = createPlayer('海盗', 'blue')

// player1.die()
// player2.die()
// player3.die()
// player4.die()

// player1.remove()
// player2.remove()
// player3.die()
// player4.die()

player1.changeTeam('blue')
player2.die()
player3.die()
player4.die()

```


## 装饰者模式

事实上，装饰者就是在原来的基础上附加新的东西，在 JavaScript 中可以通过直接添加新属性来实现。

### 实现 AOP

在职责链中提到过的 AOP 事实上就是在 Function 的基础上装饰了一层 `after`。同样地，也能添加 `before`：

```js
Function.prototype.before = function (beforeFn) {
  return (...args) => {
    beforeFn(...args)
    this(...args)
  }
}

Function.prototype.after = function (afterFn) {
  return (...args) => {
    this(...args)
    afterFn(...args)
  }
}

const a = () => { console.log(1) }
const fn = a.after(() => console.log(2)).before(() => console.log(0))
fn() // 0 1 2

```


不直接修改原型的方法：

```js
const before = (fn, beforeFn) => {
  return (...args) => {
    beforeFn(...args)
    fn(...args)
  }
}
const after = (fn, afterFn) => {
  return (...args) => {
    fn(...args)
    afterFn(...args)
  }
}

const fn = before(after(() => console.log(1), () => console.log(2)), () => console.log(0))
fn() // 0 1 2

```


### AOP 应用


```js
Function.prototype.after = function (afterFn) {
  return (...args) => {
    this(...args)
    afterFn(...args)
  }
}

function service() {
  // ...
}
function log() {
}
service = service.after(log)
```


## 状态模式

状态机罢了


## 适配器模式



```js
const getActiveUploadObj = function () {
  try {
    return new ActiveXObject('TXFTNActiveX.FTNUpload') // IE 上传控件
  }
  catch (e) {
    return false
  }
}
const getFlashUploadObj = function () {
  if (supportFlash()) { // supportFlash 函数未提供
    const str = '<object type="application/x-shockwave-flash"></object>'
    return $(str).appendTo($('body'))
  }
  return false
}
const getFormUpladObj = function () {
  const str = '<input name="file" type="file" class="ui-file"/>' // 表单上传
  return $(str).appendTo($('body'))
}
const iteratorUploadObj = function (...args) {
  for (let i = 0; i < args.length; i++) {
    const fn = args[i]
    const uploadObj = fn()
    if (uploadObj !== false)
      return uploadObj
  }
}
const uploadObj = iteratorUploadObj(getActiveUploadObj, getFlashUploadObj, getFormUpladObj)

```


### 获取上传文件对象


 ```js
 const getActiveUploadObj = function () {
   try {
     return new ActiveXObject('TXFTNActiveX.FTNUpload') // IE 上传控件
   }
   catch (e) {
     return false
   }
 }
 const getFlashUploadObj = function () {
   if (supportFlash()) { // supportFlash 函数未提供
     const str = '<object type="application/x-shockwave-flash"></object>'
     return $(str).appendTo($('body'))
   }
   return false
 }
 const getFormUpladObj = function () {
   const str = '<input name="file" type="file" class="ui-file"/>' // 表单上传
   return $(str).appendTo($('body'))
 }
 const iteratorUploadObj = function (...args) {
   for (let i = 0; i < args.length; i++) {
     const fn = args[i]
     const uploadObj = fn()
     if (uploadObj !== false)
       return uploadObj
   }
 }
 const uploadObj = iteratorUploadObj(getActiveUploadObj, getFlashUploadObj, getFormUpladObj)
 ```
