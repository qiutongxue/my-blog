<script setup lang="ts">
import { useScrollLock } from '@vueuse/core'
import { watch } from 'vue'

const props = defineProps<{
  show: boolean
  src: string
}>()
const emit = defineEmits(['update:show'])

const lock = useScrollLock(document.documentElement)

function close() {
  emit('update:show', false)
}

watch(() => props.show, (isShow) => {
  if (isShow)
    lock.value = true
  else
    lock.value = false
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal">
      <div class="modal-bg" @click="close" />
      <img :src="src" class="image">
    </div>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.modal-bg {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, .3);
}

.image {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
}
</style>
