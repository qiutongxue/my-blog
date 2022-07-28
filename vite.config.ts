import { resolve } from 'path'
import { defineConfig } from 'vite'
import fs from 'fs-extra'
import vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import matter from 'gray-matter'
import Markdown from 'vite-plugin-vue-markdown'
import UnoCSS from 'unocss/vite'
import { presetAttributify, presetUno } from 'unocss'
import shiki from 'markdown-it-shiki'
import Component from 'unplugin-vue-components/vite'
import TexMath from 'markdown-it-texmath'
import katex from 'katex'
import { containerPlugin } from './plugins/container'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: '~/', replacement: `${resolve(__dirname, 'src')}/` },
    ],
  },
  plugins: [
    vue({
      include: [/\.vue$/, /\.md$/],
      reactivityTransform: true,
    }),

    Pages({
      extensions: ['md', 'vue'],
      dirs: 'pages',
      // dirs: [
      //   { dir: 'pages/posts', baseRoute: 'post' },
      //   { dir: 'pages/archives', baseRoute: 'archives' },
      // ],
      extendRoute(route) {
        const path = resolve(__dirname, route.component.slice(1))
        route.path = encodeURI(route.path)
        // console.log('path', path)
        if (!path.includes('projects.md')) {
          const md = fs.readFileSync(path, 'utf-8')
          const { data } = matter(md)
          // console.log(data)
          route.meta = Object.assign(route.meta || {}, { frontmatter: data })
        }

        return route
      },
      importMode: 'async',
    }),
    Markdown({
      wrapperComponent: 'Post',
      wrapperClasses: 'prose m-auto',
      headEnabled: true,
      markdownItOptions: {
        quotes: '""\'\'',
        html: true,
      },
      markdownItSetup(md) {
        md.use(shiki, {
          theme: {
            light: 'vitesse-light',
            dark: 'vitesse-dark',
          },
        })
          .use(containerPlugin)
          .use(TexMath, {
            engine: katex,
            delimiters: 'dollars',
          })
      },
    }),

    UnoCSS({
      presets: [
        presetUno(),
        presetAttributify(),
      ],
    }),

    Component({
      extensions: ['vue', 'md'],
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      dts: true,

    }),
  ],
})
