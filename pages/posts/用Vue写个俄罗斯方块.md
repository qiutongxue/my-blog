---
title: 用Vue写个俄罗斯方块
comments: true
toc: true
toc_number: true
copyright: true
mathjax: false
katex: false
sticky: 0
date: 2020-11-19 17:56:10
tags: ['Vue']
category: 计算机相关
keywords: Vue
description: 
top_img:
cover: 'https://gitee.com/qiutongxue/blog-images/raw/master/img/20201119201746.jpg'
---

codepen：[https://codepen.io/dinnerwithouttomato/pen/YzWdreY](https://codepen.io/dinnerwithouttomato/pen/YzWdreY)

体验地址：[qiutongxue.gitee.io/webpage/tetris](qiutongxue.gitee.io/webpage/tetris)

之前一直觉得能写出俄罗斯方块是一件非常了不起的事，有幸在 MOOC 上看到张帆老师讲解的基于 Unity 引擎的游戏开发基础，宛如醍醐灌顶，茅塞顿开。原来一直以来，我都低估了计算机。原来每一个动作之后都有一个刷新的行为，而这种行为快到肉眼难以预测。是啊，遍历一个 12 x 20 的二维数组，也不过不到 1ms 的事，要真有卡顿的行为的话再去优化嘛。优化也得现有待优化的对象，何必要在没造螺丝的基础上就造汽车呢。

之前用 Vue 写了个扫雷，感觉非常容易上手啊，像这种操作 DOM 非常方便的框架，用来造这种由小格子组成的游戏来说可谓非常的方便。扫雷是如此，俄罗斯方块也是如此。所以废话不多说，直接冲。

## 造个“地图”

我们设定俄罗斯方块的全貌是一个 12 x 20 的网格，把网格的左、下、右的最外一层当做墙壁，剩下的 10 x 19 大小的网格便是方块的活动范围。所以我们只要建一个表示地图的二维数组，存放各个方格的对象，之后只要维护这个二维数组就能控制游戏的进程了。

```js
class Cell {
  constructor(row, col) {
    this.row = row; // 当前格子所在行数
    this.col = col; // 当前格子所在列数
    this.type = "default";  // 当前格子的类型，由 css 控制颜色。
    this.val = 0;   // 当前格子的实际意义
                    // -2：已固定的方块；
                    // -1：墙；
                    //  0：空格
                    //  1：活动方块
  }
}

var vm = new Vue({
  el: "#app",
  data: {
    mapRow: 20,
    mapCol: 12,
    map: "",
  },
  methods: {
    initGame() {
      this.map = new Array();
      for (let i = 0; i < this.mapRow; i++) {
        this.map.push(new Array());
        for (let j = 0; j < this.mapCol; j++) {
          this.map[i].push(new Cell(i, j));
          if (j == 0 || j == this.mapCol - 1 || i == this.mapRow - 1) {
            this.map[i][j].val = -1;
            this.map[i][j].type = "wall";
          } else {
            this.map[i][j].val = 0;
          }
        }
      }
    },
  },
  mounted() {
    this.initGame();
  },
}
```

```html
<div id="app">
  <div class="game-container">
      <div class="map">
        <div v-for="mapRow in map" class="row">
          <div v-for="cell in mapRow" :class="['cell', cell.type]"></div>
        </div>
      </div>
</div>
```

css 看看就好，写的太烂了。
```css
* {
  --cell-size: calc(2vw);
}

body {
  background: #eee;
}

button {
  background: transparent;
  border: 1px solid #333;
  border-radius: 3px;
}

#app {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: block;

  width: 100%;
}

.game-container {
  position: relative;
  text-align: center;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
}

.map {
  position: relative;
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
  margin: 0 10px;
}
.row {
  line-height: var(--cell-size);
  height: calc(var(--cell-size));
}

.cell {
  display: inline-block;
  border: 1px solid #eee;
  line-height: inherit;
  height: inherit;
  width: var(--cell-size);
  font-size: calc(var(--cell-size) / 2);
}

.wall {
  background: black;
}
```

到此，游戏的“地图”就已经搭好了。

## 生成方块

俄罗斯方块一共有 7 种形态，我们可以用 `I` `O` `T` `Z` `S` `L` `J` 来表示这 7 种形态，很形象啊，看字母就能想象出来了。因为只有 7 中形态，所以可以考虑直接使用数组穷举出来。“旋转” 之后的样子也一并列出。

`shapes` 里面存的是该格子的所有旋转状态。

```js
function Blocks() {
  return {
    I: {
      name: "blockI",
      shapes: [
        [1, 1, 1, 1, 
         0, 0, 0, 0, 
         0, 0, 0, 0, 
         0, 0, 0, 0],

        [0, 1, 0, 0, 
         0, 1, 0, 0, 
         0, 1, 0, 0,
         0, 1, 0, 0]
      ]
    },
    J: {
      name: "blockJ",
      shapes: [
        [1, 0, 0, 0,
         1, 1, 1, 0, 
         0, 0, 0, 0,
         0, 0, 0, 0],

        [1, 1, 0, 0,
         1, 0, 0, 0, 
         1, 0, 0, 0, 
         0, 0, 0, 0],

        [1, 1, 1, 0,
         0, 0, 1, 0, 
         0, 0, 0, 0, 
         0, 0, 0, 0],

        [0, 1, 0, 0,
         0, 1, 0, 0, 
         1, 1, 0, 0, 
         0, 0, 0, 0]
      ]
    },
    L: {
      name: "blockL",
      shapes: [
        [0, 0, 1, 0,
         1, 1, 1, 0, 
         0, 0, 0, 0, 
         0, 0, 0, 0],

        [1, 0, 0, 0,
         1, 0, 0, 0, 
         1, 1, 0, 0, 
         0, 0, 0, 0],

        [1, 1, 1, 0,
         1, 0, 0, 0, 
         0, 0, 0, 0, 
         0, 0, 0, 0],

        [1, 1, 0, 0,
         0, 1, 0, 0, 
         0, 1, 0, 0, 
         0, 0, 0, 0]
      ]
    },
    S: {
      name: "blockS",
      shapes: [
        [0, 1, 1, 0,
         1, 1, 0, 0, 
         0, 0, 0, 0, 
         0, 0, 0, 0],

        [1, 0, 0, 0,
         1, 1, 0, 0, 
         0, 1, 0, 0, 
         0, 0, 0, 0]
      ]
    },
    Z: {
      name: "blockZ",
      shapes: [
        [1, 1, 0, 0,
         0, 1, 1, 0, 
         0, 0, 0, 0, 
         0, 0, 0, 0],

        [0, 1, 0, 0,
         1, 1, 0, 0, 
         1, 0, 0, 0, 
         0, 0, 0, 0]
      ]
    },
    T: {
      name: "blockT",
      shapes: [
        [0, 1, 0, 0,
         1, 1, 1, 0, 
         0, 0, 0, 0, 
         0, 0, 0, 0],

        [0, 1, 0, 0,
         0, 1, 1, 0, 
         0, 1, 0, 0, 
         0, 0, 0, 0],

        [1, 1, 1, 0,
         0, 1, 0, 0, 
         0, 0, 0, 0, 
         0, 0, 0, 0],

        [0, 1, 0, 0,
         1, 1, 0, 0, 
         0, 1, 0, 0, 
         0, 0, 0, 0]
      ]
    },
    O: {
      name: "blockO",
      shapes: [
          [1, 1, 0, 0,
           1, 1, 0, 0, 
           0, 0, 0, 0, 
           0, 0, 0, 0]
      ]
    }
  };
}
```

首先要随机获得一个方块：

```js
data: {
    blocks: "IJLSZTO",
},
methods: {
    createBlock() {
      var block = Blocks()[
        this.blocks
          .charAt(Math.floor(Math.random() * this.blocks.length))
          .toString()
      ];
      // 方块的旋转状态，初始化为默认状态，转一下 rotateState+1。
      block.rotateState = 0;
      return block;
    },
}
```

然后将该方块初始化到 map 上，这里的 `curBlock` 是当前出现在地图上的可控制的方块， `nextBlock` 表示下一个要出现的方块，这里先将 `curBlock` 的出现方式实现，`nextBlock` 其实也是一样的，只要新开辟一个放 nextBlock 的网格就行。

```js
methods: {
    initBlock() {
      // this.isFirst 放在 startGame() 中，初始化为 true。
      // 第一次需要获得两个方块，再之后的话 curBlock 只要从 nextBlock 中获取就行。
      if (this.isFirst) {
        this.curBlock = this.createBlock();
        this.nextBlock = this.createBlock();
        this.isFirst = false;
      } else {
        this.curBlock = this.nextBlock;
        this.nextBlock = this.createBlock();
      }

      // 设置block初始位置
      // row 和 col 表示 curBlock 的左上角点的位置
      this.curBlock.row = 0;
      this.curBlock.col = 4;

      // 让 curBlock 出现在地图上。
      this.showBlockOnMap(this.curBlock);

    //   for (let i = 0; i < 4; i++) {
    //     for (let j = 0; j < 4; j++) {
    //       this.nextMap[i][j].val = this.nextBlock.shapes[0][i * 4 + j];
    //       if (this.nextMap[i][j].val === 1)
    //         this.nextMap[i][j].type = this.nextBlock.name;
    //       else this.initCell(this.nextMap[i][j]);
    //     }
    //   }
    },

    showBlockOnMap(block) {
      this.clearMap();
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (block.shapes[block.rotateState][i * 4 + j] !== 0) {
            this.getCell(block.row + i, block.col + j).val =
              block.shapes[block.rotateState][i * 4 + j];
            this.getCell(block.row + i, block.col + j).type = block.name;
          }
        }
      }
    },

    clearMap() {
      for (let i = 0; i < this.mapRow - 1; i++) {
        for (let j = 1; j < this.mapCol - 1; j++) {
          if (this.getCell(i, j).val !== -2) {
            this.initCell(this.getCell(i, j));
          }
        }
      }
    },

    getCell(row, col) {
      return this.map[row][col];
    },

    initCell(cell) {
      cell.val = 0;
      cell.type = "default";
    }
}
```

根据方块的名字设置其颜色：

```css
.blockI {
  background: #85e9ff;
}

.blockL {
  background: #ff8785;
}

.blockJ {
  background: #7b424a;
}

.blockZ {
  background: #ffb785;
}

.blockS {
  background: #66cdaa;
}

.blockO {
  background: #7eabf1;
}

.blockT {
  background: #d07ef1;
}
```

## 控制方块

### 添加事件处理

我们无非就是用上下左右来控制方块的移动、旋转，所以只要对这四个方向键进行监听就可以了，这里把监听的行为放在 `startGame()` 中：

```js
startGame() {
    this.initGame();

    var _this = this;

    document.onkeydown = function (e) {
    e.preventDefault();        // 防止上下键让网页滚动
    // 如果游戏结束或者按下暂停
    if (_this.isGameOver || _this.isStop) {
        return;
    }
    switch (e.keyCode) {
        case 37: {
        // ArrrowLeft
        _this.moveLeft();
        break;
        }
        case 38: {
        // ArrrowUp
        _this.rotateBlock();
        break;
        }
        case 39: {
        // ArrowRight
        _this.moveRight();
        break;
        }
        case 40: {
        // ArrowDown
        _this.moveDown();
        break;
        }
    }
    };

    // 初始化方块
    this.initBlock();
    // 方块自动下落
    this.autoMoveDown();
},
```
### 越界判断

怎么让方块在移动/旋转的时候不会越界呢，可以先让方块移动/旋转再判断。如果移动/旋转后的方块越界了，就移动回来或者转回来：

```js
    moveLeft() {
      this.curBlock.col--;
      if (!this.checkMove(this.curBlock)) {
        this.curBlock.col++;
        return;
      }
      this.showBlockOnMap(this.curBlock);
    },

    moveRight() {
      this.curBlock.col++;
      if (!this.checkMove(this.curBlock)) {
        this.curBlock.col--;
        return;
      }
      this.showBlockOnMap(this.curBlock);
    },

    moveDown() {
      this.curBlock.row++;
      if (!this.checkMove(this.curBlock)) {
        this.curBlock.row--;
        // let bottomRow = this.fixedBlock(this.curBlock);
        // // console.log(bottomRow);
        // this.checkLine(bottomRow);
        // // 游戏是否结束
        // if (this.curBlock.row == 0) {
        //   this.gameOver();
        // }
        // if (!this.isGameOver) {
        //   this.initBlock();
        // }
      }
      this.showBlockOnMap(this.curBlock);
    },

    rotateBlock() {
      this.curBlock.rotateState =
        (this.curBlock.rotateState + 1) % this.curBlock.shapes.length;
      if (!this.checkMove(this.curBlock)) {
        this.curBlock.rotateState =
          this.curBlock.rotateState - 1 < 0
            ? this.curBlock.shapes.length - 1
            : this.curBlock.rotateState - 1;
        return;
      }
      this.showBlockOnMap(this.curBlock);
    },
```
判断的方法也很简单粗暴，就是遍历，遍历方块所在的地图的那 16 个格子：

```js
    checkMove(block) {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (block.shapes[block.rotateState][i * 4 + j] !== 0) {
            if (
              this.getCell(block.row + i, block.col + j).val === -1 ||
              this.getCell(block.row + i, block.col + j).val === -2
            ) {
              return false;
            }
          }
        }
      }
      return true;
    },
```

### 固定方块

光是越界判断还不够，我们都知道，方块的底部是墙（或固定的格子）时会固定，接着下落新的方块，我们需要在 moveDown() 上做文章，在方块不能继续下落时将其固定在地图上（即置 `cell` 的 `val` 为 -2）：

```js
    moveDown() {
      this.curBlock.row++;
      if (!this.checkMove(this.curBlock)) {
        this.curBlock.row--;
        let bottomRow = this.fixedBlock(this.curBlock);
      }
      this.showBlockOnMap(this.curBlock);
    },

    fixedBlock(block) {
      let bottomRow = block.row;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (block.shapes[block.rotateState][i * 4 + j] !== 0) {
            this.getCell(block.row + i, block.col + j).val = -2;
            bottomRow = block.row + i;
          }
        }
      }
      return bottomRow;
    },
```

为什么要返回 bottomRow 呢？请往下看。

### 方块的自动下落

这里用的是 `setTimeout` 而不是 `setInterval`，因为 `setInterval` 不是标准的间隔，经测试，会快速落两格，停顿，再快速落两格，大大影响了游戏性。至于为什么 `setTimeout` 可以实现，请自行百度。

```js
autoMoveDown() {
    var _this = this;
    this.timeout = setTimeout(function () {
    if (!_this.isStop) {
        _this.moveDown();
    }
    _this.timeout = setTimeout(arguments.callee, 500 / _this.speed);
    }, 500 / this.speed);
},
```

## 方块消除、计分

玩俄罗斯方块，最爽的莫过于一条竖的方块插到了为它留了 100 年的槽中，唰唰唰的四行就消除了。接下来要实现的便是这一点。

在上一节中提到了 bottomRow，这个变量表示消除方块需要检查的最底下的一行，其实就是省去了一些不必要的遍历。

```js
    moveDown() {
      this.curBlock.row++;
      if (!this.checkMove(this.curBlock)) {
        this.curBlock.row--;
        let bottomRow = this.fixedBlock(this.curBlock);
        this.checkLine(bottomRow);
      }
      this.showBlockOnMap(this.curBlock);
    },

    checkLine(startRow) {
      for (let row = startRow; row >= 0 && row > startRow-4; row--) {
        let count = 0;
        for (let col = 1; col < this.mapCol - 1; col++) {
          if (this.getCell(row, col).val === -2) {
            count++;
          } else {
            break;
          }
        }
        if (count === this.mapCol - 2) {
          this.deleteLine(row);
          this.score += 10;
          return;
        }
      }
    },

    deleteLine(deleteRow) {
      for (let row = deleteRow; row > 0; row--) {
        for (let col = 0; col < this.mapCol - 1; col++) {
          this.getCell(row, col).val = this.getCell(row - 1, col).val;
          this.getCell(row, col).type = this.getCell(row - 1, col).type;
        }
      }
      this.checkLine(deleteRow);
    },
```

因为方块最多也就占 4 行，也就是说只影响了 `[bottomRow-3, bottomRow]`，所以只要检查这四行就可以了。`checkLine` 和 `deleteLine` 是一个相互递归的过程，因为放弃思考所以每次递归都检查 4 行就完事了。

计分环节也放在代码里了，`this.score` 存储游戏的分数，每消除一格分数加 10，为了增加游戏的趣味性，可以随着分数的增加慢慢加快方块的下落速度：

```js
  watch: {
    score(val) {
      this.speed = 1 + 0.1 * Math.floor(val / 50);
      this.clearTimeOut();
      this.autoMoveDown();
    }
  }
```

## 游戏结束

游戏结束看的就是当前固定的方块是否处于地图的最上方：

```js
    moveDown() {
      this.curBlock.row++;
      if (!this.checkMove(this.curBlock)) {
        this.curBlock.row--;
        let bottomRow = this.fixedBlock(this.curBlock);
        this.checkLine(bottomRow);
        // 游戏是否结束
        if (this.curBlock.row == 0) {
          this.gameOver();
        }
        if (!this.isGameOver) {
          this.initBlock();
        }
      }
      this.showBlockOnMap(this.curBlock);
    },
```

> 好像大概没啥了，布局我真的被折磨的不行，反正也是 a piece of shit。按钮、 `nextBlock` 的显示、分数 `score` 的显示全都是小 case，还有图片啥的也没贴了，看心情吧。。

