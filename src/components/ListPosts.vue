<script setup lang="ts">
import { useRouter } from 'vue-router'
import Masonry from './Masonry.vue'
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
  <Masonry flex flex-wrap items-start>
    <div
      v-for="post in routes" :key="post.name" class="post-sec"
      pb-6 border-rounded-2 overflow-hidden
    >
      <div
        v-if="post.frontmatter.cover"
        :style="`background-image: linear-gradient(0deg, rgba(0,0,0,.05), transparent), url(${post.frontmatter.cover})`"
        class="post-cover"
      />
      <div px-4 pt-4>
        <div class="post-title">
          <a :href="post.path">{{ post.name }}</a>
        </div>
        <div class="post-desc" op-80 text-sm my-2 w="100%">
          {{ post.frontmatter.description }}
        </div>
        <div flex justify-between>
          <div class="post-date" flex items-center gap-2>
            <div class="i-carbon-calendar" />
            <span>{{ post.frontmatter.date }}</span>
          </div>
          <div v-if="post.frontmatter.category" class="post-tag" px-2 shadow>
            <span>{{ post.frontmatter.category }}</span>
          </div>
        </div>
      </div>
    </div>
  </Masonry>
</template>

<style scoped>
.post-sec {
  box-shadow: 0px 1px 5px rgba(90, 90, 90, .2);
  --width: min(24rem, 80vw);
  width: var(--width);
}

.post-sec:hover {
  transform: translateY(-5%);
}

.post-title {
  font-size: 1.3rem;
}

.post-cover {
  background-position: center;
  background-size: 120%;
  /* width: var(--width); */
  width: 100%;
  /* height: 100%; */
  height: calc(var(--width) / 16 * 9);
}

.post-desc {

}

.post-date {
 /* transform: scale(.8); */
}
</style>
