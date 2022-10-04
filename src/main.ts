import { ViteSSG } from 'vite-ssg'
import 'uno.css'
import '@unocss/reset/tailwind.css'
import './style.css'
import './styles/markdown.css'
import './styles/main.css'
import './styles/prose.css'
import './styles/custom-block.css'

import NProgress from 'nprogress'
import App from './App.vue'
import routes from '~pages'

const decodingDepth = (s: string): [number, string] => {
  const decodedS = decodeURI(s)
  if (s === decodedS)
    return [0, s]
  const result = decodingDepth(decodedS)
  return [result[0] + 1, result[1]]
}

export const createApp = ViteSSG(
  App,
  { routes },
  ({ router, isClient }) => {
    if (isClient) {
      router.beforeEach(() => { NProgress.start() })
      router.afterEach(() => {
        NProgress.done()
        const path = router.currentRoute.value.path
        const [depth, result] = decodingDepth(path)
        if (depth <= 1)
          return
        router.replace(encodeURI(result))
      })
    }
  },
)
