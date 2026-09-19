import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";

/**
 * 可选 CDN 静态资源开关（构建期）。
 *
 * 当环境变量 VITE_CDN_URL 非空时，把 index.html 中的静态资源入口
 * （favicon.svg、fonts.css）指向 CDN；留空则保持同源，功能完全不受影响。
 * fonts.css 内部约 150 条 url(/fonts/*.woff2) 会随样式表自身 origin
 * 自动解析到 CDN，无需逐条修改。
 *
 * 注意：这里只处理静态资源，接口地址（/api/**）永远不经过 CDN。
 */
function cdnStaticAssetsPlugin(cdnUrl: string): Plugin {
  const cdn = cdnUrl.replace(/\/+$/, "");
  return {
    name: "cdn-static-assets",
    transformIndexHtml(html) {
      if (!cdn) return html;
      return html.replace(
        /(\b(?:href|src)=")\/(favicon\.svg|fonts\.css)(")/g,
        `$1${cdn}/$2$3`
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(import.meta.dirname);
  // 加载所有环境变量（含非 VITE_ 前缀），用于判断 CDN 是否启用
  const env = loadEnv(mode, envDir, "");
  const plugins = [
    react(),
    tailwindcss(),
    jsxLocPlugin(),
    cdnStaticAssetsPlugin(env.VITE_CDN_URL || ""),
  ];

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
      },
    },
    envDir,
    root: path.resolve(import.meta.dirname, "client"),
    publicDir: path.resolve(import.meta.dirname, "client", "public"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: true,
      allowedHosts: true,
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
