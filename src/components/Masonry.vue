<script setup lang="ts">
import { useThrottleFn } from '@vueuse/core'
import { onMounted, ref } from 'vue'

const props = defineProps<{
  x?: number
  y?: number
}>()
const wrapper = ref<HTMLDivElement | null>(null)

const gapXRem = props.x === undefined ? 4 : props.x
const gapYRem = props.y === undefined ? 2 : props.y

/**
 * 将 rem 转成 px
 * @param rem
 */
const rem2Px = (rem: number) => {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

let preWidth = 0

const render = useThrottleFn(() => {
  const wrapperEl = wrapper.value!
  wrapperEl.style.position = 'relative'

  const { width: wrapperWidth } = wrapperEl.getBoundingClientRect()

  if (wrapperWidth === preWidth)
    return

  preWidth = wrapperWidth

  const items = Array.from(wrapperEl.children) as HTMLElement[]
  const { width: itemWidth } = items[0].getBoundingClientRect()

  const gapX = rem2Px(gapXRem); const gapY = rem2Px(gapYRem)

  /*
    计算列数
    itemWidth * column + (column - 1) * gapX <= wrapperWidth
   => column <= (wrapperWidth + gapX) / (itemWidth + gapX)
  */
  const column = Math.floor((wrapperWidth + gapX) / (itemWidth + gapX))

  const padding = (wrapperWidth - (column * itemWidth + (column - 1) * gapX)) / 2

  items.forEach((item) => {
    item.style.position = 'absolute'
  })

  let wrapperHeight = 0

  // 排列元素
  for (let i = 0; i < column; i++) {
    let top = 0
    const left = padding + i * (itemWidth + gapX)

    for (let j = i; j < items.length; j += column) {
      const item = items[j]
      item.style.left = `${left}px`
      item.style.top = `${top}px`
      top += item.getBoundingClientRect().height + gapY
    }

    wrapperHeight = Math.max(wrapperHeight, top)
  }

  // 设置 wrapper 高度，保证 wrapper 后面元素的布局
  wrapperEl.style.height = `${wrapperHeight}px`
}, 66)

onMounted(() => {
  render()
  window.addEventListener('resize', render)
})
</script>

<template>
  <div ref="wrapper" class="masonry">
    <slot />
  </div>
</template>

<style>
.masonry div {
  transition: .5s ease;
}
</style>
