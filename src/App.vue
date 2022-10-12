<script setup lang="ts">
import Nav from './components/Nav.vue'
</script>

<template>
  <div>
    <header>
      <Nav />
    </header>
    <main px-7 py-10>
      <RouterView />
    </main>
    <footer />
  </div>
</template>

<style scoped>
/* .logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
} */
</style>
