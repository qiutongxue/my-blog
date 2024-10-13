<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { randomId } from '../utils/randomId'

const props = defineProps<{ length: number }>()

const hoverIndex = shallowRef(-1)
const rating = defineModel<number>({ default: 0 })

const range = computed(() => Array.from({ length: props.length }, (_, i) => i + 1))
const ids = computed(() => range.value.map(_ => `rating-${randomId()}`))
const itemState = computed(() => range.value.map((value) => {
  const isHovering = hoverIndex.value !== -1
  const isHovered = hoverIndex.value >= value
  const isFilled = rating.value >= value
  const isColored = isHovering ? isHovered : isFilled
  return { isHovered, isFilled, isColored }
}))
</script>

<template>
  <div class="rating" flex justify-center items-center>
    <label
      v-for="state, index in itemState" :key="ids[index]" :for="ids[index]"
      class="i-carbon-circle-filled"
      py-2 px-3 opacity-50 cursor-pointer hover:scale-120 transition-transform
      :class="[state.isColored ? 'bg-amber !opacity-100' : '']"
      @mouseenter="() => hoverIndex = index + 1"
      @mouseleave="() => hoverIndex = -1"
      @click="() => rating = index + 1"
    >
      <input :id="ids[index]" type="radio" :value="index + 1" hidden>
    </label>
  </div>
</template>

<style scoped>

</style>
