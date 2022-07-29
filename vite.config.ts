import { resolve } from 'path'
import matter from 'gray-matter'
import fs from 'fs-extra'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import Markdown from 'vite-plugin-vue-markdown'
import Component from 'unplugin-vue-components/vite'
import UnoCSS from 'unocss/vite'
import { presetAttributify, presetUno } from 'unocss'
import shiki from 'markdown-it-shiki'
import TexMath from 'markdown-it-texmath'
import katex from 'katex'
import anchor from 'markdown-it-anchor'
import toc from 'markdown-it-toc-done-right'
import footnote from 'markdown-it-footnote'
import slugify from './scripts/slugify'
import { containerPlugin } from './plugins/container'

const customTags = new Set(['mi', 'mrow', 'annotation', 'mover', 'mo', 'semantics', 'math', 'eq',
  'mfrac', 'mstyle', 'mn', 'eqn', 'mtext', 'msub', 'mspace', 'msubsup', 'msup', 'mtd', 'mtr', 'mtable', 'center'])

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: '~/', replacement: `${resolve(__dirname, 'src')}/` },
    ],
  },
  plugins: [
    UnoCSS({
      presets: [
        presetUno(),
        presetAttributify(),
      ],
    }),

    vue({
      include: [/\.vue$/, /\.md$/],
      // reactivityTransform: true,
      template: {
        compilerOptions: {
          isCustomElement: (tag) => {
            if (customTags.has(tag))
              return true
          },
        },
      },
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
            katexOptions: {
              strict: false,
            },
          })
          .use(anchor, {
            slugify,
            permalink: anchor.permalink.linkInsideHeader({
              symbol: '#',
              renderAttrs: () => ({ 'aria-hidden': 'true' }),
            }),
          })
          .use(toc, {
            slugify,
          })
          .use(footnote)
      },
    }),

    Component({
      extensions: ['vue', 'md'],
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      dts: true,

    }),
  ],
  build: {
    rollupOptions: {
      onwarn(warning, next) {
        if (warning.code !== 'UNUSED_EXTERNAL_IMPORT')
          next(warning)
      },
    },
  },

  ssgOptions: {
    formatting: 'minify',
    format: 'cjs',
  },
})
