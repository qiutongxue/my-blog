<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEventListener } from '@vueuse/core'
import { useHead } from '@vueuse/head'

const { frontmatter } = defineProps({
  frontmatter: {
    type: Object,
    required: true,
  },
})

// 仅在显式声明 Katex 的情况下引入 katex
if (frontmatter.katex) {
  useHead({
    link: [
      { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css' },
      { ref: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/markdown-it-texmath/css/texmath.min.css' },
    ],
  })
}

const router = useRouter()
const route = useRoute()
// console.log('routes', router.getRoutes())
// console.log('route:fullPath', route.fullPath)

const content = ref<HTMLDivElement>()

onMounted(() => {
  const navigate = () => {
    // console.log('navigate', location.hash, location.href)
    if (location.hash) {
      document.querySelector(decodeURIComponent(location.hash))
        ?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleAnchors = (
    event: MouseEvent & { target: HTMLElement },
  ) => {
    const link = event.target.closest('a')

    if (
      !event.defaultPrevented
      && link
      && event.button === 0
      && link.target !== '_blank'
      && link.rel !== 'external'
      && !link.download
      && !event.metaKey
      && !event.ctrlKey
      && !event.shiftKey
      && !event.altKey
    ) {
      const url = new URL(link.href)
      if (url.origin !== window.location.origin)
        return

      event.preventDefault()
      const { pathname, hash } = url
      if (hash && (!pathname || pathname === location.pathname)) {
        window.history.replaceState({}, '', hash)
        navigate()
      }
      else {
        router.push({ path: pathname, hash })
      }
    }
  }

  useEventListener(window, 'hashchange', navigate)
  useEventListener(content.value!, 'click', handleAnchors, { passive: false })

  navigate()
  setTimeout(navigate, 500)
})
</script>

<template>
  <div>
    <div v-if="frontmatter.display ?? frontmatter.title" class="prose m-auto mb-8">
      <template v-if="!frontmatter.layout || frontmatter.layout === 'post'">
        <div class="!mb-20">
          <img v-if="frontmatter.cover" :src="frontmatter.cover">
          <div text-sm flex justify-end italic op-80 class="words-counter">
            {{ (route.meta.frontmatter as any).total }}
          </div>
          <h1 class="mb-0" text-center>
            {{ frontmatter.display ?? frontmatter.title }}
          </h1>
          <p text-center text-gray-500 italic>
            {{ frontmatter.date.split("T")[0].replace(/-/g, '/') }}
          </p>
        </div>
      </template>

      <!-- <p v-if="frontmatter.date" class="opacity-50 !-mt-2">
        {{ formatDate(frontmatter.date) }} <span v-if="frontmatter.duration">· {{ frontmatter.duration }}</span>
      </p> -->
      <p v-if="frontmatter.subtitle" class="opacity-50 !-mt-6 italic">
        {{ frontmatter.subtitle }}
      </p>
    </div>
    <article ref="content">
      <slot />
    </article>
    <div v-if="route.path !== '/'" class="prose m-auto mt-8 mb-8">
      <!-- <a v-if="frontmatter.duration" :href="tweetUrl" target="_blank" op50>comment on twitter</a> -->
      <br>
      <router-link
        :to="route.path.split('/').slice(0, -1).join('/') || '/'"
        class="font-mono no-underline opacity-50 hover:opacity-75"
      >
        cd ..
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.words-counter::after {
  content: 'words';
  margin-left: .3rem;
}
</style>
