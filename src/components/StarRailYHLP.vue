<script setup lang="ts">
import { ref } from 'vue'
import Rating from './Rating.vue'

interface Info {
  initState: 0 | 1 | 2 | 3 | 4 | 5
  direction: 1 | -1
  speed: 1 | 2 | 3 | 4
}

function hash(positions: number[]) {
  return positions[0] << 6 | positions[1] << 3 | positions[2]
}

function decode(state: number) {
  const a = (state >> 6) & 0b111
  const b = (state >> 3) & 0b111
  const c = state & 0b111
  return [a, b, c]
}

function calculate(infos: Info[], rotate: number[][]/* 三种旋转方式 */) {
  // console.log({ infos }, { rotate })
  function nextStates(state: number) {
    const current_positions = decode(state)
    return rotate.map((r, i) => {
      const next_positions = [...current_positions] as [number, number, number]
      for (const p of r) {
        const c = infos[p]
        next_positions[p] = (next_positions[p] + c.direction * c.speed + 6) % 6
      }
      return [hash(next_positions), i]
    })
  }
  // 用 BFS 找最小步
  // 一共只有 6*6*6=216 种状态，所以可以暴力破解
  const initState = hash(infos.map(i => i.initState))
  let q = [initState]
  const path: [number, number][] = [] // path[i] 表示状态 i 的前驱状态
  path[initState] = [-1, -1]
  while (path[0] === undefined && q.length > 0) {
    const nq: number[] = []
    for (const currentState of q) {
      for (const [nextState, r] of nextStates(currentState)) {
        if (path[nextState] === undefined) {
          path[nextState] = [currentState, r]
          nq.push(nextState)
        }
      }
    }
    q = nq
  }
  if (path[0] === undefined) {
    return '无解'
  }
  else if (path[0][0] === -1) {
    return '已经结束咧（请检查是否设置了初始状态）'
  }
  let cur = 0
  const res: number[] = []
  while (path[cur][1] !== -1) {
    res.push(path[cur][1])
    cur = path[cur][0]
  }
  let curR = 0
  let x = ''
  return `${res.reverse().map((i) => {
    const s = '○○○'.split('')
    for (const r of rotate[i]) {
      s[r] = '●'
    }
    while (curR !== i) {
      // 切换 Q
      curR = (curR + 1) % rotate.length
      x += 'Q'
    }
    x += 'D'
    return s.join('')
  }).join(' | ')} | ${x}`
}

const infos = ref<Info[]>([
  { initState: 2, direction: -1, speed: 1 },
  { initState: 2, direction: -1, speed: 2 },
  { initState: 2, direction: -1, speed: 4 },
])

const rotate = ref<number[][]>([[0, 2], [0, 1], [1, 2]])

const result = ref<string>('')
function update() {
  // console.log({ rotate })
  result.value = calculate(infos.value, rotate.value)
}
</script>

<template>
  <h3>引航罗盘</h3>
  <div flex justify-center items-center flex-col>
    <!-- 提供内圈、中圈、外圈的配置选项，包括了：顺时针/逆时针二选一、选择数字范围1~4、选择初始位置0~5 -->
    <div
      v-for="(name, i) in ['内圈', '中圈', '外圈']" :key="i"
      py-4 flex justify-center items-center
    >
      <div>{{ name }}</div>
      <div flex>
        <!-- 选择数字范围0~5 -->
        <!-- <input v-model="infos[i].initState" type="number" min="0" max="5"> -->
        <div h-8 px-10 flex justify-center items-center>
          <label
            v-for="j in 6"
            :key="`init-state-${i}-${j}`"
            cursor-pointer transform-translate-x--6
          >
            <input v-model="infos[i].initState" type="radio" :value="j - 1" hidden>
            <span
              transform-origin-center-right block absolute w-6 h-1 rounded-3
              opacity-25 bg-gray
              :class="[
                `init-${j - 1}`,
                j - 1 === infos[i].initState ? `${j === 1 ? '!bg-blue' : '!bg-amber'} !opacity-100` : '',
                `${j === 1 ? 'hover:bg-blue' : 'hover:bg-amber'} hover:opacity-75`,
              ]"
            />
          </label>
        </div>
        <Rating v-model="infos[i].speed" :length="4" />
        <!-- <input v-model="infos[i].speed" type="number" min="1" max="4"> -->
        <div flex justify-center items-center>
          <label
            class="i-carbon-rotate-180"
            :class="[infos[i].direction === 1 ? '!opacity-100 text-amber' : '']"
            opacity-25 cursor-pointer p-4 mx-2 transition hover:opacity-50
          >
            <input v-model="infos[i].direction" type="radio" :value="1" hidden>
          </label>
          <label
            class="i-carbon-rotate"
            :class="[infos[i].direction === -1 ? '!opacity-100 text-amber' : '']"
            opacity-25 cursor-pointer p-4 transition hover:opacity-50
          >
            <input v-model="infos[i].direction" type="radio" :value="-1" hidden>
          </label>
        </div>
      </div>
    </div>

    <!-- 选择轮盘组合，可多选 -->
    <div>
      <div v-for="i in 3" :key="`rot${i}`" flex my-1>
        <div v-for="j in 3" :key="`r${i}${j}`" mx-.5>
          <input :id="`r${i}${j}`" v-model="rotate[i - 1]" type="checkbox" :value="j - 1" hidden>
          <label
            :for="`r${i}${j}`" :class="{ '!bg-amber': rotate[i - 1].includes(j - 1) }"
            rounded-6 block w-6 h-6 border border-gray-6 cursor-pointer bg-white hover:bg-amber transition
          />
        </div>
      </div>
    </div>

    <button @click="update">
      计算
    </button>
    <div>
      计算结果：<span>{{ result }}</span>
    </div>
  </div>
</template>

<style scoped>
.init-0 {
  transform: rotate(0deg) translateX(-.5rem);
}

.init-1 {
  transform: rotate(60deg) translateX(-.5rem);
}

.init-2 {
  transform: rotate(120deg) translateX(-.5rem);
}

.init-3 {
  transform: rotate(180deg) translateX(-.5rem);
}

.init-4 {
  transform: rotate(240deg) translateX(-.5rem);
}

.init-5 {
  transform: rotate(300deg) translateX(-.5rem);
}
</style>
