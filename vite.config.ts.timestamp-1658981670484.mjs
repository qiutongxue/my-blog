// vite.config.ts
import { resolve } from "path";
import { defineConfig } from "vite";
import fs from "fs-extra";
import vue from "@vitejs/plugin-vue";
import Pages from "vite-plugin-pages";
import matter from "gray-matter";
import Markdown from "vite-plugin-vue-markdown";
import UnoCSS from "unocss/vite";
import { presetAttributify, presetUno } from "unocss";
import shiki from "markdown-it-shiki";

// plugins/container.ts
import container from "markdown-it-container";
var containerPlugin = (md) => {
  md.use(...createContainer("tip", "TIP", md)).use(...createContainer("info", "INFO", md)).use(...createContainer("warning", "WARNING", md)).use(...createContainer("danger", "DANGER", md)).use(...createContainer("details", "Details", md)).use(container, "v-pre", {
    render: (tokens, idx) => tokens[idx].nesting === 1 ? "<div v-pre>\n" : "</div>\n"
  });
};
function createContainer(klass, defaultTitle, md) {
  return [
    container,
    klass,
    {
      render(tokens, idx) {
        const token = tokens[idx];
        const info = token.info.trim().slice(klass.length).trim();
        if (token.nesting === 1) {
          const title = md.renderInline(info || defaultTitle);
          if (klass === "details")
            return `<details class="${klass} custom-block"><summary>${title}</summary>
`;
          return `<div class="${klass} custom-block"><p class="custom-block-title">${title}</p>
`;
        } else {
          return klass === "details" ? "</details>\n" : "</div>\n";
        }
      }
    }
  ];
}

// vite.config.ts
var __vite_injected_original_dirname = "D:\\workspace\\my-blog";
var vite_config_default = defineConfig({
  resolve: {
    alias: [
      { find: "~/", replacement: `${resolve(__vite_injected_original_dirname, "src")}/` }
    ]
  },
  plugins: [
    vue({
      include: [/\.vue$/, /\.md$/],
      reactivityTransform: true
    }),
    Pages({
      extensions: ["md", "vue"],
      dirs: "pages",
      extendRoute(route) {
        const path = resolve(__vite_injected_original_dirname, route.component.slice(1));
        console.log(route);
        route.path = encodeURI(route.path);
        if (!path.includes("projects.md")) {
          const md = fs.readFileSync(path, "utf-8");
          const { data } = matter(md);
          route.meta = Object.assign(route.meta || {}, { frontmatter: data });
        }
        return route;
      },
      importMode: "async"
    }),
    Markdown({
      wrapperComponent: "post",
      wrapperClasses: "prose m-auto",
      headEnabled: true,
      markdownItSetup(md) {
        md.use(shiki, {
          theme: {
            light: "vitesse-light",
            dark: "vitesse-dark"
          }
        }).use(containerPlugin);
      }
    }),
    UnoCSS({
      presets: [
        presetUno(),
        presetAttributify()
      ]
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGx1Z2lucy9jb250YWluZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx3b3Jrc3BhY2VcXFxcbXktYmxvZ1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcd29ya3NwYWNlXFxcXG15LWJsb2dcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3dvcmtzcGFjZS9teS1ibG9nL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IGZzIGZyb20gJ2ZzLWV4dHJhJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgUGFnZXMgZnJvbSAndml0ZS1wbHVnaW4tcGFnZXMnXG5pbXBvcnQgbWF0dGVyIGZyb20gJ2dyYXktbWF0dGVyJ1xuaW1wb3J0IE1hcmtkb3duIGZyb20gJ3ZpdGUtcGx1Z2luLXZ1ZS1tYXJrZG93bidcbmltcG9ydCBVbm9DU1MgZnJvbSAndW5vY3NzL3ZpdGUnXG5pbXBvcnQgeyBwcmVzZXRBdHRyaWJ1dGlmeSwgcHJlc2V0VW5vIH0gZnJvbSAndW5vY3NzJ1xuaW1wb3J0IHNoaWtpIGZyb20gJ21hcmtkb3duLWl0LXNoaWtpJ1xuaW1wb3J0IHsgY29udGFpbmVyUGx1Z2luIH0gZnJvbSAnLi9wbHVnaW5zL2NvbnRhaW5lcidcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczogW1xuICAgICAgeyBmaW5kOiAnfi8nLCByZXBsYWNlbWVudDogYCR7cmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKX0vYCB9LFxuICAgIF0sXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICB2dWUoe1xuICAgICAgaW5jbHVkZTogWy9cXC52dWUkLywgL1xcLm1kJC9dLFxuICAgICAgcmVhY3Rpdml0eVRyYW5zZm9ybTogdHJ1ZSxcbiAgICB9KSxcblxuICAgIFBhZ2VzKHtcbiAgICAgIGV4dGVuc2lvbnM6IFsnbWQnLCAndnVlJ10sXG4gICAgICBkaXJzOiAncGFnZXMnLFxuICAgICAgLy8gZGlyczogW1xuICAgICAgLy8gICB7IGRpcjogJ3BhZ2VzL3Bvc3RzJywgYmFzZVJvdXRlOiAncG9zdCcgfSxcbiAgICAgIC8vICAgeyBkaXI6ICdwYWdlcy9hcmNoaXZlcycsIGJhc2VSb3V0ZTogJ2FyY2hpdmVzJyB9LFxuICAgICAgLy8gXSxcbiAgICAgIGV4dGVuZFJvdXRlKHJvdXRlKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSByZXNvbHZlKF9fZGlybmFtZSwgcm91dGUuY29tcG9uZW50LnNsaWNlKDEpKVxuICAgICAgICBjb25zb2xlLmxvZyhyb3V0ZSlcbiAgICAgICAgcm91dGUucGF0aCA9IGVuY29kZVVSSShyb3V0ZS5wYXRoKVxuICAgICAgICAvLyBjb25zb2xlLmxvZygncGF0aCcsIHBhdGgpXG4gICAgICAgIGlmICghcGF0aC5pbmNsdWRlcygncHJvamVjdHMubWQnKSkge1xuICAgICAgICAgIGNvbnN0IG1kID0gZnMucmVhZEZpbGVTeW5jKHBhdGgsICd1dGYtOCcpXG4gICAgICAgICAgY29uc3QgeyBkYXRhIH0gPSBtYXR0ZXIobWQpXG4gICAgICAgICAgLy8gY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgICByb3V0ZS5tZXRhID0gT2JqZWN0LmFzc2lnbihyb3V0ZS5tZXRhIHx8IHt9LCB7IGZyb250bWF0dGVyOiBkYXRhIH0pXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcm91dGVcbiAgICAgIH0sXG4gICAgICBpbXBvcnRNb2RlOiAnYXN5bmMnLFxuICAgIH0pLFxuICAgIE1hcmtkb3duKHtcbiAgICAgIHdyYXBwZXJDb21wb25lbnQ6ICdwb3N0JyxcbiAgICAgIHdyYXBwZXJDbGFzc2VzOiAncHJvc2UgbS1hdXRvJyxcbiAgICAgIGhlYWRFbmFibGVkOiB0cnVlLFxuICAgICAgbWFya2Rvd25JdFNldHVwKG1kKSB7XG4gICAgICAgIG1kLnVzZShzaGlraSwge1xuICAgICAgICAgIHRoZW1lOiB7XG4gICAgICAgICAgICBsaWdodDogJ3ZpdGVzc2UtbGlnaHQnLFxuICAgICAgICAgICAgZGFyazogJ3ZpdGVzc2UtZGFyaycsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSkudXNlKGNvbnRhaW5lclBsdWdpbilcbiAgICAgIH0sXG4gICAgfSksXG4gICAgVW5vQ1NTKHtcbiAgICAgIHByZXNldHM6IFtcbiAgICAgICAgcHJlc2V0VW5vKCksXG4gICAgICAgIHByZXNldEF0dHJpYnV0aWZ5KCksXG4gICAgICBdLFxuICAgIH0pLFxuICBdLFxufSlcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcd29ya3NwYWNlXFxcXG15LWJsb2dcXFxccGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcd29ya3NwYWNlXFxcXG15LWJsb2dcXFxccGx1Z2luc1xcXFxjb250YWluZXIudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3dvcmtzcGFjZS9teS1ibG9nL3BsdWdpbnMvY29udGFpbmVyLnRzXCI7aW1wb3J0IHR5cGUgTWFya2Rvd25JdCBmcm9tICdtYXJrZG93bi1pdCdcbmltcG9ydCB0eXBlIHsgUmVuZGVyUnVsZSB9IGZyb20gJ21hcmtkb3duLWl0L2xpYi9yZW5kZXJlcidcbmltcG9ydCB0eXBlIFRva2VuIGZyb20gJ21hcmtkb3duLWl0L2xpYi90b2tlbidcbmltcG9ydCBjb250YWluZXIgZnJvbSAnbWFya2Rvd24taXQtY29udGFpbmVyJ1xuXG5leHBvcnQgY29uc3QgY29udGFpbmVyUGx1Z2luID0gKG1kOiBNYXJrZG93bkl0KSA9PiB7XG4gIG1kLnVzZSguLi5jcmVhdGVDb250YWluZXIoJ3RpcCcsICdUSVAnLCBtZCkpXG4gICAgLnVzZSguLi5jcmVhdGVDb250YWluZXIoJ2luZm8nLCAnSU5GTycsIG1kKSlcbiAgICAudXNlKC4uLmNyZWF0ZUNvbnRhaW5lcignd2FybmluZycsICdXQVJOSU5HJywgbWQpKVxuICAgIC51c2UoLi4uY3JlYXRlQ29udGFpbmVyKCdkYW5nZXInLCAnREFOR0VSJywgbWQpKVxuICAgIC51c2UoLi4uY3JlYXRlQ29udGFpbmVyKCdkZXRhaWxzJywgJ0RldGFpbHMnLCBtZCkpXG4gICAgLy8gZXhwbGljaXRseSBlc2NhcGUgVnVlIHN5bnRheFxuICAgIC51c2UoY29udGFpbmVyLCAndi1wcmUnLCB7XG4gICAgICByZW5kZXI6ICh0b2tlbnM6IFRva2VuW10sIGlkeDogbnVtYmVyKSA9PlxuICAgICAgICB0b2tlbnNbaWR4XS5uZXN0aW5nID09PSAxID8gJzxkaXYgdi1wcmU+XFxuJyA6ICc8L2Rpdj5cXG4nLFxuICAgIH0pXG59XG5cbnR5cGUgQ29udGFpbmVyQXJncyA9IFt0eXBlb2YgY29udGFpbmVyLCBzdHJpbmcsIHsgcmVuZGVyOiBSZW5kZXJSdWxlIH1dXG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbnRhaW5lcihcbiAga2xhc3M6IHN0cmluZyxcbiAgZGVmYXVsdFRpdGxlOiBzdHJpbmcsXG4gIG1kOiBNYXJrZG93bkl0LFxuKTogQ29udGFpbmVyQXJncyB7XG4gIHJldHVybiBbXG4gICAgY29udGFpbmVyLFxuICAgIGtsYXNzLFxuICAgIHtcbiAgICAgIHJlbmRlcih0b2tlbnMsIGlkeCkge1xuICAgICAgICBjb25zdCB0b2tlbiA9IHRva2Vuc1tpZHhdXG4gICAgICAgIGNvbnN0IGluZm8gPSB0b2tlbi5pbmZvLnRyaW0oKS5zbGljZShrbGFzcy5sZW5ndGgpLnRyaW0oKVxuICAgICAgICBpZiAodG9rZW4ubmVzdGluZyA9PT0gMSkge1xuICAgICAgICAgIGNvbnN0IHRpdGxlID0gbWQucmVuZGVySW5saW5lKGluZm8gfHwgZGVmYXVsdFRpdGxlKVxuICAgICAgICAgIGlmIChrbGFzcyA9PT0gJ2RldGFpbHMnKVxuICAgICAgICAgICAgcmV0dXJuIGA8ZGV0YWlscyBjbGFzcz1cIiR7a2xhc3N9IGN1c3RvbS1ibG9ja1wiPjxzdW1tYXJ5PiR7dGl0bGV9PC9zdW1tYXJ5PlxcbmBcblxuICAgICAgICAgIHJldHVybiBgPGRpdiBjbGFzcz1cIiR7a2xhc3N9IGN1c3RvbS1ibG9ja1wiPjxwIGNsYXNzPVwiY3VzdG9tLWJsb2NrLXRpdGxlXCI+JHt0aXRsZX08L3A+XFxuYFxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBrbGFzcyA9PT0gJ2RldGFpbHMnID8gJzwvZGV0YWlscz5cXG4nIDogJzwvZGl2PlxcbidcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICBdXG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9QLFNBQVMsZUFBZTtBQUM1USxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFFBQVE7QUFDZixPQUFPLFNBQVM7QUFDaEIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sWUFBWTtBQUNuQixPQUFPLGNBQWM7QUFDckIsT0FBTyxZQUFZO0FBQ25CLFNBQVMsbUJBQW1CLGlCQUFpQjtBQUM3QyxPQUFPLFdBQVc7OztBQ05sQixPQUFPLGVBQWU7QUFFZixJQUFNLGtCQUFrQixDQUFDLE9BQW1CO0FBQ2pELEtBQUcsSUFBSSxHQUFHLGdCQUFnQixPQUFPLE9BQU8sRUFBRSxDQUFDLEVBQ3hDLElBQUksR0FBRyxnQkFBZ0IsUUFBUSxRQUFRLEVBQUUsQ0FBQyxFQUMxQyxJQUFJLEdBQUcsZ0JBQWdCLFdBQVcsV0FBVyxFQUFFLENBQUMsRUFDaEQsSUFBSSxHQUFHLGdC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
