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

export const createApp = ViteSSG(
  App,
  { routes },
  ({ router }) => {
    router.beforeEach(() => { NProgress.start() })
    router.afterEach(() => { NProgress.done() })
  },
)
