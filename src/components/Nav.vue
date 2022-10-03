<script setup lang="ts">
const navs = [
  {
    name: 'Blog',
    link: '/posts',
  },
  {
    name: 'Archived',
    link: '/archived',
  },
  {
    name: 'Notes',
    link: '/notes',
  },
]
</script>

<template>
  <div flex justify-between w="100vw" p-8 items-center>
    <RouterLink to="/" class="logo" px-4>
      Qiutongxue
    </RouterLink>
    <div class="nav">
      <RouterLink
        v-for="nav in navs" :key="nav.name" :to="nav.link" :title="nav.name"
        px-4
      >
        {{ nav.name }}
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>

</style>
