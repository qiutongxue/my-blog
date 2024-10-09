import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import fs from 'fs-extra'
import matter from 'gray-matter'
import katex from 'katex'
import anchor from 'markdown-it-anchor'
import footnote from 'markdown-it-footnote'
import shiki from 'markdown-it-shiki'
import TexMath from 'markdown-it-texmath'
import toc from 'markdown-it-toc-done-right'
import { presetAttributify, presetIcons, presetUno } from 'unocss'
import UnoCSS from 'unocss/vite'
import Component from 'unplugin-vue-components/vite'
import Markdown from 'unplugin-vue-markdown/vite'
import { defineConfig } from 'vite'
import Pages from 'vite-plugin-pages'
import { containerPlugin } from './plugins/container'
import { countMarkdownWords } from './scripts/countMarkdownWords'
import { customTags } from './scripts/customTags'
import slugify from './scripts/slugify'

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
        presetIcons({
          extraProperties: {
            'display': 'inline-block',
            'vertical-align': 'middle',
          },
        }),
      ],
    }),

    vue({
      include: [/\.vue$/, /\.md$/],
      // reactivityTransform: true,
      template: {
        compilerOptions: {
          isCustomElement: tag => customTags.has(tag),
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

        if (!path.includes('projects.md')) {
          const md = fs.readFileSync(path, 'utf-8')
          const { data, content } = matter(md)
          const total = countMarkdownWords(content)
          route.meta = Object.assign(route.meta || {}, { frontmatter: { ...data, total } })
          // console.log(route.meta)
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
