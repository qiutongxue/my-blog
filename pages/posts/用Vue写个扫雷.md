---
title: 用Vue写个扫雷
comments: true
toc: true
toc_number: true
copyright: true
mathjax: false
katex: false
sticky: 0
date: 2020-10-18 17:34:05
tags: ['Vue']
category: 原创
keywords:
description: 玩扫雷有感
top_img:
cover: 'https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220908175059.png'
---

代码放在 CodePen 上：[https://codepen.io/dinnerwithouttomato/pen/BazzaZK](https://codepen.io/dinnerwithouttomato/pen/BazzaZK)

体验地址：[https://qiutongxue.gitee.io/webpage/minesweeper/](https://qiutongxue.gitee.io/webpage/minesweeper/)

## 扫雷的需求分析

我们打开扫雷玩几把，可以发现扫雷的大概流程是这样的：

1. 点击任一格子开始游戏，且点的第一下必定不是雷
2. 点的若是数字，不会扩散。
    ![no-spread](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729144813.png)
3. 点的若是空白，会扩散，并且扩散到数字即停止
    ![spread](https://gitee.com/qiutongxue/blog-images/raw/master/img/20201018203332.png)
4. 有剩余地雷提示，每插一个旗子少 1，还能变成负数
5. 点击到地雷，游戏结束（失败），计时停止，显示所有地雷，且踩到的地雷有额外标识（红色背景）
    ![地雷的额外标识](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729144833.png)
6. 安全格子全部点完，游戏结束（胜利），计时停止，所有地雷自动插旗。
    ![success](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729144847.png)

不难看出，扫雷的基本逻辑还是很简单的，“地图“可以用二维数组表示，地雷用 `-1` 表示，空白格用 `0` 表示，数字格就用相应的数字表示。点击空白格之后的扩散现象其实就是一个搜索的过程，DFS、BFS 都能实现。其它的细节在下一节会提及。

## 跟着我的节奏，虫！

### 造个界面

游戏没有界面是不行的！最基本的开始按钮要有吧，基本的网格也要有吧。当然细节上不用着急去深挖，先把整体的一个格子造起来：

```html
<div id="app">
  <div class="main-area">
    <button @click="restart">{{ btnContent }}</button>
    <div class="game-area">
      <div v-for="(row,m) in minesArray" class="row-cells">
        <div v-for="(cell,n) in row" class="cell" @click="clickCell(m,n)">
            {{ cell }}
        </div>
      </div>
    </div>
  </div>
</div>
```

OK，div 还挺多的，不着急，一个个来。首先最外层的 div 是为了给 Vue 挂载的，让 Vue 知道，哦我控制的是这一块区域。下面一层是主界面区域，大概就是包含了按钮、文本、方格之类的。按钮的部分就不说了，与按钮同级的是游戏区域，也就是真正能点的地方了。这里我把这些小方格全都按照 div 来处理，并且是一行一行排列的，`minesArray` 是一个二维数组，记录每个位置表示什么（`-1` 表示地雷，`0` 表示空格……）。使用 `v-for` 遍历 `minesArray`，这样数组有多大，游戏区域就有多大。这样就能组成一个网格了...吗？

当然不是，首先 div 是无形无影的，其次因为行高的原因，行与行之间有一定的距离，这就完全不像网格！出于顺眼的考虑，就先小小的美化一下：

```css
.main-area {
  --cell-size: 20px;
}

.game-area {
  margin: 10px;
}

.cell {
  display: inline-block;
  width: var(--cell-size);
  height: var(--cell-size);
  line-height: var(--cell-size);
  border: 1px solid;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
}

.row-cells {
  font-size: 1px;
}
```

在 `.cell` 中有几点需要提一下， `inline-height` 设置和 `height` 相同的值，是为了让格子里的数字能够垂直居中。 `vertical-align` 为了让每个格子能垂直对齐（当格子里有数字时格子会下沉？）。

另外，因为网格的关系，也可以使用 `display: grid`，网格布局或许会更容易（？）一些。

现在就舒服多了嘛：

![初步布局](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729144914.png)

然后在把 Vue 挂载到 `#app` 上：

```js
const vm = new Vue({
  el: '#app',
  filters: {},
  data() {
    return {
      isGameOver: false,
      isFirstClick: true,
      minesArray: '',
      rowSize: 8,
      colSize: 8,
      mineSize: 9,
      btnContent: 'emoji-smile',
      // timer: '',
      // time: 0.0,
      // visited: '',
      // noMineBlocks: ''
    }
  },
  mounted() {},
  methods: {
    clickCell(row, col) { /* 网格点击事件 */ },
  }
})
```

`rolSize` 和 `colSize` 分别为网格的行数和列数，初级扫雷是一个 `8 × 8` 的网格。`mineSize` 是地雷的数量，初级扫雷为 9 个

### 开始写代码

####  初始化网格

在 `html` 中，网格的大小取决于 `minesArray` 的大小，所以确定了 `minesArray` 才能把网格绘制出来。可以使用 `mounted()`，在 Vue 挂载之后就自动初始化：

```js
  mounted() {
    // 初始化游戏
    console.log("-----------------------");
    console.log("初始化游戏中...");
    this.minesArray = new Array();
    // this.visited = new Array();
    for (let i = 0; i < this.rowSize; i++) {
      this.minesArray[i] = new Array();
      // this.visited[i] = new Array();
      for (let j = 0; j < this.colSize; j++) {
        this.minesArray[i][j] = 0;
        // this.visited[i][j] = false;
      }
    }

    console.log("游戏初始化完成");
    console.log("-----------------------");
  }, 
```

先把所有格子全部初始化为 `0`（为什么是 `0` 呢，后面就知道了），现在网格上全都是 0 了：

![初始化网格](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729144943.png)

#### 初始化地雷

地雷的初始化也很简单，生成 `mineSize` 个随机坐标，把坐标上的数字置 `1`。不过有一点：开始游戏点击的第一个格子必不是地雷。所以地雷的坐标不能和第一个点击格子的坐标相同：

```js
    clickCell(row, col) {
        if (this.isFirstClick) {
            this.initMines(row, col);
        }
    },    

    initMines(row, col) { // 传入第一格的坐标
      console.log("-----------------------");
      console.log("初始化地雷...");
      // 地雷设为 -1
      for (let i = 0; i < this.mineSize; i++) {
        do {
            /* 生成行/列随机数 */
          var mineRow = Math.floor(Math.random() * this.rowSize);
          var mineCol = Math.floor(Math.random() * this.colSize);
        } while (
          (mineRow === row && mineCol === col) ||	// 防止与第一格坐标重复
          this.minesArray[mineRow][mineCol] === -1	// 防止地雷坐标重复
        ); 
        // console.log(mineRow, mineCol);
        this.minesArray[mineRow][mineCol] = -1;
        this.$set(this.minesArray, mineRow, [...this.minesArray[mineRow]]);  // 很重要！见下面解释
      }
      // 初始化数字
      this.initNum();

      console.log("初始化地雷完成...");
      console.log("-----------------------");

      this.isFirstClick = false;
    },
```

有一个很大很大很大的坑，注意

```js
this.minesArray[mineRow][mineCol] = -1
this.$set(this.minesArray, mineRow, [...this.minesArray[mineRow]])
```

1. 为什么要多写一个 `$set`？参考 [Vue 检测变化的注意事项](https://cn.vuejs.org/v2/guide/reactivity.html#%E6%A3%80%E6%B5%8B%E5%8F%98%E5%8C%96%E7%9A%84%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9) ，对于数组，直接引用下标改变值时 Vue 无法监听到数据变化，数据不能做相应的更新，需要使用 `$set` 代替。
2. 为什么两个都写上了？唉，因为这是坑中坑…… 

一开始我想的是，既然用 `$set` 可以代替的话，我直接一个 `this.$set(this.minesArray[mineRow], mineCol, -1)` 不就可以了？完全不行！我想可能是因为 Vue 仍然无法监听到 `this.minesArray[mineRow]` 的变化，那就只能用最笨的方法：复制数组了。诶果然成了！

![初始化地雷](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729144958.png)

#### 初始化数字

初始化地雷完成之后，就是把数字标上了。数字 `n` 的含义是：该方格周围 8 个格子中有 `n` 个地雷。如果我们反推一下，对于每一个地雷来说，其周围 8 格必有数字，且每有一个地雷，其周围 8 格非地雷格数字 `+1`。代码就很好写了：

```js
    initNum() {
      console.log("初始化数字...");
      let borderX = this.minesArray.length;
      let borderY = this.minesArray[0].length;
      for (let i = 0; i < this.minesArray.length; i++) {
        for (let j = 0; j < this.minesArray[i].length; j++) {
          // 如果是雷，雷周围 8 个格子除了地雷数字加 1
          if (this.minesArray[i][j] === -1) {
            posArr.forEach((pos) => {
              let x = pos[0] + i;
              let y = pos[1] + j;
              if (x < borderX && x >= 0 && y < borderY && y >= 0) {
                if (this.minesArray[x][y] !== -1) {
                  this.minesArray[x][y]++;
                }
              }
            });
          }
        }
      }
    },
```

其中 `posArr` 为全局变量，放在 Vue 的外部：

```js
let posArr = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1]
];
var vm = new Vue({...});
```

点击任意一格开始试试：

![初始化数字](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145025.png)

现在看起来很不错了，但是这数字密密麻麻的也太难受了吧！我们需要**将数字用颜色加以区分**。

在 `{% raw %}{{ cell }}{% endraw %}` 的外层加上一个 `div`，用来控制字体和颜色：

```html
...
<div v-for="(cell,n) in row" class="cell" @click="clickCell(m,n)">
  <div :class="['num-color-'+minesArray[m][n], 'num-color', ]">
          {{ cell }}
  </div>
</div>
...
```

根据 `minesArray` 返回的结果，各数字颜色对应各类，比如数字 `1` 对应 `num-color-1`，数字 `-1` 对应 `num-color--1`，在 css 中对样式进行定义：

```css
.num-color { font-weight: bold; }

.num-color-0 { color: darkgrey; }

.num-color-1 { color: blue; }

.num-color-2 { color: green; }

.num-color-3 { color: red; }

.num-color-4 { color: darkblue; }

.num-color-5 { color: darkred; }

.num-color-6 { color: darkcyan; }

.num-color-7 { color: black; }

.num-color-8 { color: gray; }

.num-color--1 { background: red; }

.num-color--2 { background: greenyellow; }
```

![着色后](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145053.png)

现在看着舒服多了，有点内味儿了。

#### 把数字藏起来

数字布置完成，接下来应该把格子的数字藏起来，等我点击的时候再出现。用一个存放 `boolean` 值的二维数组 `visited` 记录哪些方格被访问过了，访问过的方格就把数字显示出来。

现在 `data` 中声明好 `visited`：

```js
data: {
    ...
    visited: ''
}
```

然后初始化该数组（和 `minesArray` 一起放在 `mounted` 中初始化）：

```js
  mounted() {
    // 初始化游戏
    console.log("-----------------------");
    console.log("初始化游戏中...");
    this.minesArray = new Array();
    this.visited = new Array();
    for (let i = 0; i < this.rowSize; i++) {
      this.minesArray[i] = new Array();
      this.visited[i] = new Array();
      for (let j = 0; j < this.colSize; j++) {
        this.minesArray[i][j] = 0;
        this.visited[i][j] = false;
      }
    }      
    console.log("游戏初始化完成");
    console.log("-----------------------");
  },
```

初始化 `visited` 全为 `false` 表示都未访问过。

在 `cell` 的下面（同级）添加一个 `mask`，覆盖原有的格子，添加 `visited` 类，绑定对应的数组 `visited` ：

```html
<div :class="['num-color-'+minesArray[m][n], 'num-color']">
  {{ cell | cellFilter}}
</div>
<div :class="['mask', {visited: visited[m][n]}]"></div>
```

设置 mask 和 num-color 的 css 样式：

```css
.num-color {
  position: absolute;
  font-weight: bold;
  line-height: var(--cell-size);
  width: inherit;
  height: inherit;
  /* background: #c0c0c0;
  box-shadow: 1px 1px #808080 inset; */
}

.mask {
  position: absolute;
  width: inherit;
  height: inherit;
  z-index: 99;
}
```

设置 visited 样式，当已访问时格子消失：

```css
.visited {
  display: none;
}
```

::: details 之前的版本（已废除）

在 `html` 中添加 `unvisited` 类，绑定 visited 对应坐标的结果：

```html
...
<div :class="['num-color-'+minesArray[m][n], 'num-color', {unvisited: !visited[m][n]}]">
   {{ cell }}
</div>
...
```

在 `css` 中设置 `unvisited` 样式，即出现 `unvistied` 就不显示：

```css
.unvisited { display: none; }
```

:::

在 `clickCell` 中将点击后的格子设为已访问：

```js
    clickCell(row, col) {
      //if (this.visited[row][col] || this.isGameOver) {
      //  return;
      //}
      if (this.isFirstClick) {
        // this.noMineBlocks = this.colSize * this.rowSize - this.mineSize;
        this.initMines(row, col);
        // this.timeStart();
      }

      this.visited[row][col] = true;
      this.$set(this.visited, row, [...this.visited[row]]);
		
    },
```


可以点几下方格试试，数字立马就出现了。

#### 点击空白格子后的扩散

离扫雷的实现就差最后几步了。而这一步是最重要的，也是最影响游戏体验的。

在扫雷时，一下点开一大块区域的感觉别提有多爽了，而目前的进度点击空白才出现一个格子！这就跟便秘一样难受！所以赶紧来疏通肠道。

首先，在 `clickCell`  中判断当前的格子是否为 `0`，若是，开始搜索扩散：

```js
    clickCell(row, col) {
      //if (this.visited[row][col] || this.isGameOver) {
      //  return;
      //}
      if (this.isFirstClick) {
        this.noMineBlocks = this.colSize * this.rowSize - this.mineSize;
        this.initMines(row, col);
        this.timeStart();
      }
      this.visited[row][col] = true;
      this.$set(this.visited, row, [...this.visited[row]]);
      
      let cell = this.minesArray[row][col];

      if (cell === 0) {
        // 踩空了
        this.search(row, col);
      }
    },
```

```js
    search(r, c) {
      posArr.forEach((pos) => {
        let x = pos[0] + r;
        let y = pos[1] + c;
        if (
          x < this.visited.length &&
          x >= 0 &&
          y < this.visited[0].length &&
          y >= 0 &&
          !this.visited[x][y]
        ) {
          // 若未访问过
          this.clickCell(x, y);
        }
      });
    },
```

我这里用的是 DFS，纯粹是因为代码简单哈哈哈。这代码已经简单到不用我多说了。这其实就是模拟点击操作，因为 `0` 的周围 8 格必不是雷，所以看到 `0` 就把周围 8 个格子点开就完事了。当然了，BFS 应该更加正统一些，毕竟排雷都是一圈一圈排过去的嘛。

![扩散](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145134.png)

#### 游戏结束

游戏结束有两种方式：1. 踩到地雷 2. 排完所有雷

先从简单的开始。踩到地雷就是当前点击的格子是 `-1`，触发失败条件：

```js
clickCell(row, col) {
    if (this.isFirstClick) {
        //this.noMineBlocks = this.colSize * this.rowSize - this.mineSize;
        this.initMines(row, col);
        //this.timeStart();
    }
    this.visited[row][col] = true;
    this.$set(this.visited, row, [...this.visited[row]]);

    let cell = this.minesArray[row][col];
    if (cell === -1) {
        // 踩雷了，爆炸
        this.fail();
        return;
    }

    if (cell === 0) {
        // 踩空了
        this.search(row, col);
    }
},
```

```js
fail() {
  this.timeStop();
  this.isGameOver = true;
  this.btnContent = "emoji-bad";
  this.showMines(false)
},
```
![游戏失败](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145155.png)

胜利的判断比较复杂，我这里用的是一种比较弱智的思路：算出所有安全格子的数量 `noMineBlocks`，如果`当前的步数 === 安全格子总数`，游戏胜利：

```js
clickCell(row, col) {
  if (this.visited[row][col] || this.isGameOver) {
    return;
  }
  if (this.isFirstClick) {
    this.noMineBlocks = this.colSize * this.rowSize - this.mineSize;
    this.initMines(row, col);
    //this.timeStart();
  }
  this.visited[row][col] = true;
  this.$set(this.visited, row, [...this.visited[row]]);

  let cell = this.minesArray[row][col];
  if (cell === -1) {
    // 踩雷了，爆炸
    this.fail();
    return;
  }
  if (--this.noMineBlocks === 0) {
     // 安全格子全部点完，起飞 
    this.success();
    return;
  }

  if (cell === 0) {
    // 踩空了
    this.search(row, col);
  }
},
```
在该方法开头有个判断条件：

```js
if (this.visited[row][col] || this.isGameOver) {

}
```

一个是游戏结束的时候，另一个是已经访问过（即点开数字）的时候。前者是必须要加的，因为我的弱智胜利条件需要这个约束，不然重复点击同一个格子会出大问题——还没点完所有格子就胜利了。

当然，真正胜利的判断条件肯定不会是我这样，这里还需要优化一下子。

对应的胜利方法：

```js
success() {
    this.timeStop();
    this.isGameOver = true;
    this.btnContent = "emoji-celebrate";
    this.showMines(true)
},
```

两个方法都用一个 `showMines` 方法，为的是在游戏结束时，不管成功与否把所有的地雷显示出来。传入的 `boolean` 类型表示游戏胜利与否，如果胜利，地雷格子被插上旗子（变绿 ）：

```js
showMines(isSuccess) {
  for (let i = 0; i < this.minesArray.length; i++) {
    for (let j = 0; j < this.minesArray[0].length; j++) {
      if (this.minesArray[i][j] === -1) {
        if(isSuccess) {
          this.minesArray[i][j] = -2; // 插旗
        }
        this.$set(this.minesArray, i, [...this.minesArray[i]]);
        // Amazing!! 这里竟然不需要用 $set
        this.visited[i][j] = true;
      }
    }
  }
},
```
是的，看到那个注释了吗，这是我不解的地方：在这里直接设置 `visited` 的值就可以，而且不是说不需要 `$set`，而是用了 `this.$set(this.visited, i, [...this.visited[i]])` 还会报错！！

![游戏胜利](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145212.png)

#### 重新开始

重新开始对应的就是那个唯一的按钮了。重新重新，就是把那些相关的数据全都初始化了，实现方法可太容易了：

```js
restart() {
  //this.timeStop();
  this.isFirstClick = true;
  this.isGameOver = false;
  this.textTip = "";
  //this.timer = "";
  //this.time = 0.0;
  this.initCells();
  this.initVisited();
},
    
initCells() {
  console.log("-----------------------");
  console.log("初始化方格...");
  for (let i = 0; i < this.rowSize; i++) {
    for (let j = 0; j < this.colSize; j++) {
      this.minesArray[i][j] = 0;
      this.$set(this.minesArray, i, [...this.minesArray[i]]);
    }
  }
  console.log("初始化方格结束");
  console.log("-----------------------");
},
    
initVisited() {
  for (let i = 0; i < this.rowSize; i++) {
    for (let j = 0; j < this.colSize; j++) {
      this.visited[i][j] = false;
      this.$set(this.visited, i, [...this.visited[i]]);
    }
  }
},
```
#### 计时

现在 `data` 中声明时间：

```js
data: {
    ...
    time: 0.0
}
```

使用 js 自带的 `setInterval` 方法实现计时（每隔 100ms 时间加 0.1），使用 `clearInterval` 方法停止计时：

```js
timeStart() {
  this.timer = setInterval(() => {
    this.time += 0.1;
  }, 100);
},
timeStop() {
  clearInterval(this.timer);
}
```
计时开始条件——点击第一个格子时开始计时：

```js
clickCell(row, col) {
    ...
    if (this.isFirstClick) {
        ...
        this.timeStart();
    }
    ...
}
```

计时停止条件——游戏结束时停止：

```js
fail() {
    this.timeStop();
    ...
},

success() {
    this.timeStop();
    ...
}
```

然后找个合适的地方把时间塞过去：

```html
 <div>时间： {{ time | timeFilter }} </div>
```

为了保留一位小数，设置了一个过滤器 `timeFilter` ：

```js
filters: {
    timeFilter(val) {
        return Number(val).toFixed(1);
    }
}
```

> 到此为止，游戏的基本功能已经全部实现啦！剩下的就是游戏的优化工作了。

## 界面优化

### 网格样式

首先是未点击时方格的样子。把网格放大，一个一个数像素可以发现，每个小格子为 `16px × 16px`，小格子的主要背景颜色为 `#C0C0C0`，左上角和右下角分别有 `#FFF` 和 `#808080` 的阴影，宽度为 `2px`，使小方格看上去像【凸起】一样；另外，包裹小方格的容器在左上角和右下角有宽度为 `3px`，颜色分别为 `#A0A0A0` 和 `#FFF` 的阴影，使整块区域看上去像【陷下去】一样。

![放大后的格子](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145231.png)

阴影用 `box-shadow` 就能搞定（注意要用内阴影）：

```css
.main-area {
  --cell-size: 16px;
  border: 1px solid;
  display: inline-block;
  background-color: #c0c0c0;
}

.game-area {
  margin: 5px;
  padding: 3px;
  background-color: #c0c0c0;
  box-shadow: 3px 3px #a0a0a0 inset, -3px -3px white inset;
}

.row-cells {
  transform: translatey(-5px);  // 因为发现不知道为啥小方格下沉了5px，故往上抬了 5px
  height: var(--cell-size);     // 让行与行之间不留缝隙
}

.cell {
  display: inline-block;
  width: var(--cell-size);
  height: var(--cell-size);
  line-height: var(--cell-size);
  text-align: center;
  vertical-align: middle;
  cursor: default;
  box-shadow: 2px 2px white inset,
    -2px -2px #808080 inset;
}
```

添加样式后的效果如下，有点内味儿了，但是总感觉缺了点什么：

![仙草蜜](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145247.png)

放大之后发现，阴影与阴影的界限分明，并不像原版那样有过度，就使得格子不具有立体感，像泰山仙草蜜一样：

![放大的仙草蜜](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145314.png)

在尝试了多种方式后，我最后的解决方案是多布置一个 `1px` 的阴影，假装把这两处阴影连接起来：

```css
.cell {
  position: relative;
  display: inline-block;
  width: var(--cell-size);
  height: var(--cell-size);
  text-align: center;
  cursor: default;
}
```

```css
.cell {
  display: inline-block;
  width: var(--cell-size);
  height: var(--cell-size);
  line-height: var(--cell-size);
  text-align: center;
  vertical-align: middle;
  cursor: default;
  box-shadow: -1px -1px #808080 inset,  // 注意这里啦
    2px 2px white inset,
    -2px -2px #808080 inset;  
}
```

放大来看是这样的：

![ok](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145340.png)

让我们缩小来看看，AMAZING 啊，效果非常完美，与原版如出一辙！

![完美](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145356.png)

接着是点开之后的样子，放大来看看：

![放大](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145412.png)

阴影消失，边框出现。阴影消失很简单，直接 `background` 颜色覆盖就行。但是这个边框最好不要用 `border`，因为 `border` 的宽度和 `width height` 的大小是不重合的，加了 `border` 会让一个格子的大小变成 `18px`，并且格子与格子之间的间隙也会多出 `1px`。所以我们直接用内阴影：

```css
.num-color {  // 懒得添加新类了，就在这里编辑^^
  position: absolute;
  font-weight: bold;
  line-height: var(--cell-size);
  width: inherit;
  height: inherit;
  background: #c0c0c0;
  box-shadow: 1px 1px #808080 inset;
}
```

::: old-version
```css
.num-color {  // 懒得添加新类了，就在这里编辑^^
  font-weight: bold;
  font-size: 10px;
  background: #c0c0c0;
  box-shadow: 1px 1px #808080 inset;
}
```
:::



味儿更浓啦：

![nice](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145426.png)

### 消零

空格子的零应该不显示才对，首先想到的就是用 filter，把 `0` 替换成 `''`。

先对 `{% raw %}{{ cell }}{% endraw %}` 加个过滤器：

```html
...
<div :class="['num-color-'+minesArray[m][n], 'num-color', {unvisited: !visited[m][n]}]">
  {{ cell | cellFilter }}
</div>
...
```

然后 `cellFilter` 判断是否为 `0`，若是返回 `''`，否则返回原来的数：

```js
  filters: {
    timeFilter(val) {
      return Number(val).toFixed(1);
    },
    cellFilter(val) {
      return val === 0 ? '' : val;
    }
  }
```

但是测试的时候发现，本来是 `0` 的方格一点变化都没有，就像是未点击一样：

![no](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145459.png)

实际上是因为 `div` 是跟着内容变的，返回了一个 `''` 值后，`div` 认为自己没有容纳任何东西，就不出现。解决方法也很简单，只要给这个 `div` 一个大小就行：

```css
.num-color {
  width: inherit;
  height: inherit;
  /* other code */
}
```

实际效果：

![good](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145513.png)

现在的话扫雷味儿就很足了吧。

> 关于字体：扫雷的字体太难找啦，既然不影响大局，我就放弃了^^

### 主界面及计分板样式

主界面也是有阴影的：

```css
.main-area {
  ...
  padding: 3px;
  box-shadow: 3px 3px white inset, -3px -3px #a0a0a0 inset;
}
```

游戏区域与主区域之间要加些空隙： 

```css
.game-area {
  padding: 3px;
  background-color: #c0c0c0;
  box-shadow: 3px 3px #a0a0a0 inset, -3px -3px white inset;
  margin-bottom: 6px;
}
```

在 `game-area` 上面（同级）插入 `top-box`，管理按钮、计时器、雷数计数器：

```html
<div style="text-align:center" class="top-box">
  <div class="top-box-item remain-mines show-number">
    1
  </div>


  <button @click="onRestartBtnClick" class="restart-btn top-box-item">
  </button>

  <div class="top-box-item time show-number"> {{ time | timeFilter}} </div>
</div>
<div class="game-area"> ... </div>
```

设置样式：

```css

.top-box {
  box-shadow: 2px 2px #a0a0a0 inset, -2px -2px #ffffff inset;
  padding: 6px;
  margin-bottom: 6px;
  margin-top: 6px;
  text-align: center;
}

.top-box-item {
  display: inline-block;
}

.remain-mines {
  float: left;
}

.time {
  float: right;
}

.show-number {
  width: 41px;
  height: 25px;
  box-shadow: -1px -1px white inset, 1px 1px #808080 inset;
}

```

设置按钮样式：

```css
.restart-btn {
  width: 25px;
  height: 25px;
  border: 0px;
  background: #c0c0c0;
  border-left: 1px solid black;
  border-top: 1px solid black;
  border-right: 1px solid #808080;
  border-bottom: 1px solid #808080;
  box-shadow: -1px -1px #808080 inset, 2px 2px white inset,
    -2px -2px #808080 inset;
}

.restart-btn:active {
  box-shadow: 2px 2px #808080 inset;
}

.restart-btn:touch {
  box-shadow: 2px 2px #808080 inset;
}

.restart-btn:focus {
  outline: none;
}
```

效果如下：

![效果](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145548.png)

### 向按钮中添加表情

从 [iconfont](https://www.iconfont.cn/) 中找几个有代表性的表情放到项目中：

![iconfont表情](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145600.png)

引入 js 文件：

```html
<script src="//at.alicdn.com/t/font_2151348_rnuoem684i9.js" type="text/javascript"></script>
```

插入到 `<button>` 中：

```html
<button @click="onRestartBtnClick" class="restart-btn top-box-item">
  <svg class="icon" aria-hidden="true">
    <use :xlink:href="'#icon-emoji-' + emojiType"></use>
  </svg>
</button>
```

调整样式：

```css
.icon {
  width: 1.3em;
  height: 1.3em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
  transform: translatex(-3px);
}
```

为了实现表情的变化，`xlink:href` 的值与 `emojiType` 息息相关。可以根据目前的状态，将 `emojiType` 设置成 `default`, `click`, `fail`, `success`，就能在变化时自动从库中引用 `icon-emoji-xxx` 对应的表情：

```js
data: {
  ...
  emojiType : 'default'
},

methods: {
  onRestartBtnClick() { // 将 restart 单独提了出来，按钮绑定的是这个
    this.emojiType = "default";
    this.restart();
  },
  fail() {
    this.emojiType = 'fail'
    ...
  },
  success() {
    this.emojiType = 'success'
    ...
  }
  ...
}
```

要在按下时改变表情，需添加 `@mousedown` 事件监听，以及在 `@mouseup` 时复原：

```html
<div v-for="(cell,n) in row" class="cell" @mousedown="mousedown" @mouseup="mouseup" @click="clickCell(m,n)"> ... </div>
```

```js
methods: {
  mousedown() {
    this.emojiType = "click"
  },
  mouseup() {
    this.emojiType = "default"
  }
}
```

### 液晶字体

终于找到字体啦，用的是 `FX-LED.TTF` 液晶字体，导入到 css 中，再设置相应的样式就行：

```html
<div class="top-box-item remain-mines show-number">
    <div class="num-box">
        {{remainMines}}
    </div>
</div>
<div class="top-box-item time show-number">
    <div class='num-box'> {{ time | timeFilter}} 
    </div>
</div>
```

```css
@font-face {
	font-family: 'fxled';
    src: url('./font/FX-LED.TTF');
}

.num-box {
  font-family: fxled;
  font-size: 30px;
  color: red;
  text-align: right;
  line-height: inherit;
  padding: 0 2px;
  background: black;
}
```

这。。勉强够用哈

![加上字体后](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145616.png)

## 代码优化

随着我们需求的不断增加，存放状态的二维数组将会越来越多（`minesArray`, `visited` `flag`...）。显然，同时维护这么多数组不是一个好事，不仅维护起来非常麻烦（牵一发而动全身），代码量也会成倍增长，更别说什么逻辑请不清晰，易不易读了。基于面向对象编程的思想，我们可以把这些状态放在一个类中进行统一管理。

首先创建一个 `Cell` 类，这个类是每个小格子的抽象形式，存放的是当前格子的各种状态：坐标、是否被访问、实际的数值、是否被标记等等：

```js
class Cell {
  constructor(row, col) {
    this.row = row
    this.col = col
    this.isVisited = false
    this.isFlagged = false
    this.cell = ''
    this.val = 0
    this.neighbors = []
  }
}
```

`this.neighbors` 存放当前小格子的周围 8 个”邻居“，能减少重复的计算。

然后创建一个二维数组，专门管理这些 `Cells`：

```js
data: {
    ...
    this.cellMatrix : ''
}

methods: {
      initGame() {
      this.isFirstClick = true;
      this.isGameOver = false;
      if (this.timer) {
        this.timeStop();
      }
      this.timer = "";
      this.time = 0.0;
      this.remainMines = this.mineSize;

      // 初始化二维数组
      this.cellMatrix = [];
      for (let row = 0; row < this.rowSize; row++) {
        this.cellMatrix.push(new Array());
        for (let col = 0; col < this.colSize; col++) {
          this.cellMatrix[row].push(new Cell(row, col));
        }
      }

      // 把 '邻居们' 存进来
      this.cellMatrix.forEach((rowArr) => {
        rowArr.forEach((cell) => {
          posArr.forEach((p) => {
            let x = p[0] + cell.row;
            let y = p[1] + cell.col;
            if (x >= 0 && x < this.rowSize && y >= 0 && y < this.colSize) {
              cell.neighbors.push(this.getCell(x, y));
            }
          });
        });
      });
    },
},
mounted() {
    // 这里直接调用 initGame()
    this.initGame();
}
```

改一下 `html` 的内容：

```html
<div :class="['game-area', {unclickable: isGameOver}]">
    <div v-for="rowArr in cellMatrix" class="row-cells">
        <div v-for="cell in rowArr" class="cell" @mousedown="mousedown(cell)" @mouseup="mouseup(cell)" @click="clickCell(cell)" @contextmenu.prevent>
            <div :class="['num-color-'+cell.val, 'num-color', 'unselected']">
                {{ cell.cell }}
            </div>
            <div :class="['mask', {visited: cell.isVisited}]">
            </div>
        </div>
    </div>
</div>
```

这样每个格子都由这个 `cell` 进行管理，~~实际上已经脱离了二维数组 `cellMatrix`，`cell` 中属性的改变可以被监听到~~，跳出了那个巨坑，不再需要 `this.$set()` 了。

::: warning
2020.11.13 指正： 能被监听到的原因与二维数组的初始化中的 `push` 有关。

```js
for (let row = 0; row < this.rowSize; row++) {
  this.cellMatrix.push([])
  for (let col = 0; col < this.colSize; col++)
    this.cellMatrix[row].push(new Cell(row, col))

}
```
:::

然后对 js 代码进行修改，这里把相关变化的贴出来：

```js
methods: {
    getCell(r, c) {
      /* 为了解放双手 */
      return this.cellMatrix[r][c];
    },

    clickCell(cell) {
      if (cell.isVisited this.isGameOver) {
        return;
      }

      if (this.isFirstClick) {
        this.noMineBlocks = this.colSize * this.rowSize - this.mineSize;
        this.initMines(cell.row, cell.col);
        this.timeStart();
      }

      cell.isVisited = true;

      if (cell.val === -1) {
        // 踩雷了，爆炸
        cell.isClickedBoom = true;
        this.fail();
        return;
      }

      if (cell.val === 0) {
        // 踩空了
        this.search(cell);
      } else {
        cell.cell = cell.val;
      }

      // 注意这个，判断胜利的位置放到了最后
      if (--this.noMineBlocks === 0) {
        this.success();
        return;
      }
    },
    
    search(cell) {
      /* 因为有了 neighbors，代码简化了许多 */
      cell.neighbors.forEach((neighbor) => {
        this.clickCell(neighbor);
      });
    },

    showMines(isSuccess) {
      this.mines.forEach((cell) => {
        if (isSuccess) {
          //cell.isFlagged = true;
          cell.val = -2;
        } else {
          //if (!cell.isFlagged) cell.isVisited = true;
           cell.isVisited = true;
        }
      });
    },

    initGame() {
      this.isFirstClick = true;
      this.isGameOver = false;
      if (this.timer) {
        this.timeStop();
      }
      this.timer = "";
      this.time = 0.0;
      this.remainMines = this.mineSize;

      this.cellMatrix = [];
      for (let row = 0; row < this.rowSize; row++) {
        this.cellMatrix.push(new Array());
        for (let col = 0; col < this.colSize; col++) {
          this.cellMatrix[row].push(new Cell(row, col));
        }
      }

      this.cellMatrix.forEach((rowArr) => {
        rowArr.forEach((cell) => {
          posArr.forEach((p) => {
            let x = p[0] + cell.row;
            let y = p[1] + cell.col;
            if (x >= 0 && x < this.rowSize && y >= 0 && y < this.colSize) {
              cell.neighbors.push(this.getCell(x, y));
            }
          });
        });
      });
    },

    initMines(row, col) {
      console.log("-----------------------");

      console.log("初始化地雷...");
      // 地雷设为 -1
      for (let i = 0; i < this.mineSize; i++) {
        do {
          var mineRow = Math.floor(Math.random() * this.rowSize);
          var mineCol = Math.floor(Math.random() * this.colSize);
        } while (
          (mineRow === row && mineCol === col) ||
          this.getCell(mineRow, mineCol).val === -1
        );

        this.getCell(mineRow, mineCol).val = -1;
        // 把地雷格另外存起来
        this.mines.push(this.getCell(mineRow, mineCol));
      }
      // 设定数字标识
      this.initNum();

      console.log("初始化地雷完成...");
      console.log("-----------------------");

      this.isFirstClick = false;
    },

    initNum() {
      console.log("初始化数字...");

      this.cellMatrix.forEach((rowArr) => {
        rowArr.forEach((cell) => {
          if (cell.val === -1) {
            cell.neighbors.forEach((neighbor) => {
              if (neighbor.val !== -1) {
                neighbor.val++;
              }
            });
          }
        });
      });
    },
  },

```

经过这么一番修改，代码少了很多，看着也不太累了。最主要的是，因为有了 `neighbors` 的存在，在【困难】难度下点格子的速度快了很多，终于不用卡了呜呜呜（不过第一次点击还是会卡那么一会）。

## 功能优化

### （伪）地雷实装

这个讲道理应该放在界面优化的，不过按照时间顺序来说，这是在优化了代码之后才做的事，所以索性就扔这里了。

我们地雷终于要有新面貌了！终于不再是数字了！

首先，还是去 iconfont 上找个符合意境的图标，小小的编辑一下大小、名字等等（别忘了更新 js 哦）：

![boom-icon](https://gitee.com/qiutongxue/blog-images/raw/master/img/20201028181441.png)

把代码扔到 html 里，使用 `v-if` 控制其出现的位置：

```html
<div :class="['num-color-'+cell.val, 'num-color', 'unselected', {'current-boom': cell.isClickedBoom}]">
    <svg v-if="cell.val === -1" class="icon-cell" aria-hidden="true">
        <use xlink:href="#icon-boom"></use>
    </svg>
    {{ cell.cell }}
</div>
```

设置图标样式：

```css
.icon-cell {
  width: 1em;
  height: 1em;
  overflow: hidden;
}
```

在实装地雷的过程中，我顺便做了另一件事：被点到的炸弹背景为红色，其余背景与默认的相同。这么做首先要把 `.num-color--1` 删了，然后换成 `.current-boom`：

```css
.current-boom {
  background-color: red;
}
```

在 `clickCell` 函数中，当判断为炸弹时声明并赋值 `isClickedBoom` ：

```js
if (cell.val === -1) {
  // 踩雷了，爆炸
  cell.isClickedBoom = true
  this.fail()

}
```

效果还不错：

![boom](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145711.png)

### 插旗

扫雷没有插旗难度无疑增加了许多，而没有插旗的扫雷是没有灵魂的。之前由于偷懒并没有做这个功能，现在偷偷补上。

首先，去 iconfont 找个合适的旗子（别把国旗整来了），别忘了刷新 js 代码。

![flag](https://markdown-img-1306901910.cos.ap-nanjing.myqcloud.com/20220729145729.png)

一般来讲，右键插旗，可是浏览器右键弹出菜单了，怎么办？使用 `@contextmenu.prevent`，阻止右键菜单事件，用 `setFlag()` 取而代之：

```html
<div v-for="cell in rowArr" class="cell" @mousedown="mousedown(cell)" @mouseup="mouseup(cell)" @click="clickCell(cell)" @contextmenu.prevent="setFlag(cell)">
     ...
</div>
```

图标的代码粘贴到 `mask` 里面，`v-if` 绑定 `isFlagged`：

```html
<div :class="['mask', {visited: cell.isVisited, flagged: cell.isFlagged}]">
    <svg v-if="cell.isFlagged" class="icon-cell" aria-hidden="true">
        <use xlink:href="#icon-flag"></use>
    </svg>
</div>
```

设置 `flagged` 样式，即右键不会有下凹效果：

```css
.flagged {
  pointer-events: none;
  box-shadow: -1px -1px #808080 inset, 2px 2px white inset,
    -2px -2px #808080 inset;
}
```

`setFlag` 逻辑就很简单了，实际上可以叫 toggleFlag：

```js
setFlag(cell) {
    cell.isFlagged = !cell.isFlagged;
}
```



### 左右键同时按下

在我还不会玩扫雷的时候，我姐和我说，鼠标两个键一起按下去，只闪一个格子，就插旗。这让我受益匪浅，屡试不爽。对于扫雷玩家来说，左右键一起按的开雷方式简直是神器，是提速的关键。所以！没有这种狂暴开雷方式怎么能行！

首先是判断怎么才算左右键一起按。我想了一个很简单的方法，就是让 `cell` 来记录——左键按下，算 `isLeftPress=true`，左键松开，`isLeftPress=false`，右键同理。只要两个键一起按下，就会有 `cell.isLeftPress && cell.isRightPress`，以此来判断左右键的同时点击。当然，要判断是左键还是右键，需要传入 `$event`，其 `button` 属性的 `0` 表示左键，`2` 表示右键。

```html
<div v-for="cell in rowArr" class="cell" @mousedown="mousedown($event, cell)" @mouseup="mouseup($event, cell)" @click="clickCell(cell)" @contextmenu.prevent @mouseleave="mouseleave(cell)">
  ...
</div>
```

这里提一下上一部分插旗的事，因为插旗应该算【右键按下】即插上旗，而不是【右键松开】，所以把插旗的方法也交给 `@mousedown` 管理。

到这边为止，弃用了 `mask:active` 这一 `css` 元素，除了左右键按下都会响应让人难以操控之外还因为左右键同时按需要联动周围 8 个格子，它们的 css 也要改，所以干脆用 `isReady` 来表示：我准备好了，已经按下去了。

```js
    mousedown(e, cell) {
      if (e.button === 2) {
        if (!cell.isVisited) this.setFlag(cell);
        cell.isRightPress = true;
      } else if (e.button === 0) {
        cell.isLeftPress = true;
        cell.isReady = true;
      }
      // 同时按下
      if (cell.isRightPress && cell.isLeftPress) {
        cell.neighbors.forEach((neighbor) => {
          if (!neighbor.isFlagged) neighbor.isReady = true;
        });
        cell.isReady = true;
        return;
      }

      this.emojiType = "click";
    },
```

在左右键一起按下的前提下，左键或者右键松开，都会立即触发狂暴开雷。不过开不开格子是有条件的。首先，格子必须是已经访问过的，而且格子周围一定要插旗，插旗的数量必须等于格子的数字。

```js
    mouseup(e, cell) {
      this.emojiType = "default";
      let clear = false;

      // 同时按下后，有一个松开
      if (cell.isLeftPress && cell.isRightPress) {
        if (cell.val > 0 && cell.isVisited) {
          let unVisitedCells = []; 	// 记录未访问的格子
          let flags = 0;	// 记录插旗数量

          cell.neighbors.forEach((neighbor) => {
            if (neighbor.isFlagged) {
              flags++;
            }
            if (!neighbor.isVisited && !neighbor.isFlagged) {
              unVisitedCells.push(neighbor);
            }
          });

          if (flags === cell.val) {
            unVisitedCells.forEach((c) => {
              this.clickCell(c);
            });
          }
        }
      }
      cell.neighbors.forEach((neighbor) => {
        neighbor.isReady = false;
      });

      // 重置状态
      if (e.button === 2) {
        cell.isRightPress = false;
      } else if (e.button === 0) {
        cell.isLeftPress = false;
      }
    },
```

为了以防万一，添加一个 `mouseleave` 事件处理：

```js
    mouseleave(cell) {
      if (cell.isReady) {
        cell.isReady = false;
      }
    }
```

不过因为多了这个狂暴开雷的方式，多了一个小 bug——当开错雷的时候，还没给其它几个格子打开的时间，游戏直接结束了。咋解决呢，不如直接在里面手动开格子：

```js
    mouseup(e, cell) {
      this.emojiType = "default";
      let clear = false;

      if (cell.isLeftPress && cell.isRightPress) {
        if (cell.val > 0 && cell.isVisited) {
		/* 多余代码不表 */

          let mines = [];
          if (flags === cell.val) {
            unVisitedCells.forEach((c) => {
              if (c.val === -1) {
                mines.push(c)
              }
              else {
                this.clickCell(c)
              }
            });
          }
          if (mines.length > 0) {
            mines.forEach(mine => {
              mine.isVisited = true;
              mine.isClickedBoom = true;
            });
            this.fail();
          }       
        }
      }
        
      /* 多余代码不表 */

    },
```



### 剩余地雷计数

这个直接没有技术含量。代码也懒得贴了，就绑定一个计数的，初始化为雷的数量，插个旗 `-1`，拔个旗子 `+1`。



