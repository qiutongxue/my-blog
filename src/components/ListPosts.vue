<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()

const dateFormatter = (date: string) => {
  const ymd = date.split('T')[0]
  return ymd
}

const routes = router.getRoutes()
  .filter(route => route.path.startsWith('/posts/'))
  .map((route) => {
    const routeName = String(route.name)
    const frontmatter = route.meta.frontmatter as Record<string, any>
    const name = frontmatter.title || routeName.slice(routeName.indexOf('-') + 1)
    frontmatter.date = dateFormatter(frontmatter.date)
    const path = route.path
    return {
      name,
      frontmatter,
      path,
    }
  })
  .sort((a, b) => {
    const d1 = new Date(a.frontmatter.date)
    const d2 = new Date(b.frontmatter.date)
    return d1 > d2 ? -1 : d1 < d2 ? 1 : 0
  })
</script>

<template>
  <div>
    <div v-for="post in routes" :key="post.name" mt-4 py-2 px-4>
      <div class="post-title" text-lg>
        <a :href="post.path">{{ post.name }}</a>
      </div>
      <div op-80 text-sm>
        {{ post.frontmatter.description }}
      </div>
      <div>{{ post.frontmatter.date }}</div>
    </div>
  </div>
</template>

<style scoped>

</style>
