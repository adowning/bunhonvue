import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import AutoImport from "unplugin-auto-import/vite";
import ElementPlus from "unplugin-element-plus/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
import { fileURLToPath } from "url";
import viteCompression from "vite-plugin-compression";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vitejs.dev/config/
// export default defineConfig(({ mode }) => {
//   // Load .env files from the current directory (packages/frontend)
//   const env = loadEnv(mode, process.cwd(), "");

//   return {
//     plugins: [vue()],
//     resolve: {
//       alias: {
//         "@": path.resolve(__dirname, "./src"),
//       },
//     },
//     server: {
//       proxy: {
//         // This will proxy any request starting with /api
//         // e.g., /api/user/me -> http://localhost:3000/api/user/me
//         "/api": {
//           target: env.VITE_API_URL,
//           changeOrigin: true, // necessary for virtual hosted sites
//         },
//       },
//     },
//   };
// });

export default ({ mode }: { mode: string }) => {
  const root = process.cwd();
  const env = loadEnv(mode, root);
  const {
    VITE_VERSION,
    VITE_PORT,
    VITE_BASE_URL,
    VITE_API_URL,
    VITE_API_PROXY_URL,
  } = env;

  console.log(`🚀 API_URL = ${VITE_API_URL}`);
  console.log(`🚀 VERSION = ${VITE_VERSION}`);

  return defineConfig({
    define: {
      __APP_VERSION__: JSON.stringify(VITE_VERSION),
    },
    // base: VITE_BASE_URL,
    server: {
      // port: Number(VITE_PORT),
      proxy: {
        // This will proxy any request starting with /api
        // e.g., /api/user/me -> http://localhost:3000/api/user/me
        "/api": {
          target: env.VITE_API_URL,
          changeOrigin: true, // necessary for virtual hosted sites
        },
      },
      host: true,
    },
    // 路径别名
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@views": resolvePath("src/views"),
        "@imgs": resolvePath("src/assets/img"),
        "@icons": resolvePath("src/assets/icons"),
        "@utils": resolvePath("src/utils"),
        "@stores": resolvePath("src/store"),
        "@plugins": resolvePath("src/plugins"),
        "@styles": resolvePath("src/assets/styles"),
      },
    },
    build: {
      target: "es2015",
      outDir: "dist",
      chunkSizeWarningLimit: 2000,
      minify: "terser",
      terserOptions: {
        compress: {
          // 生产环境去除 console
          drop_console: true,
          // 生产环境去除 debugger
          drop_debugger: true,
        },
      },
      dynamicImportVarsOptions: {
        warnOnError: true,
        exclude: [],
        include: ["src/views/**/*.vue"],
      },
    },
    plugins: [
      vue(),
      tailwindcss(),
      // 自动按需导入 API
      AutoImport({
        imports: ["vue", "vue-router", "pinia", "@vueuse/core"],
        dts: "src/types/auto-imports.d.ts",
        resolvers: [ElementPlusResolver()],
        eslintrc: {
          enabled: true,
          filepath: "./.auto-import.json",
          globalsPropValue: true,
        },
      }),
      // 自动按需导入组件
      Components({
        dts: "src/types/components.d.ts",
        resolvers: [ElementPlusResolver()],
      }),
      // 按需定制主题配置
      ElementPlus({
        useSource: true,
      }),
      // 压缩
      viteCompression({
        verbose: false, // 是否在控制台输出压缩结果
        disable: false, // 是否禁用
        algorithm: "gzip", // 压缩算法
        ext: ".gz", // 压缩后的文件名后缀
        threshold: 10240, // 只有大小大于该值的资源会被处理 10240B = 10KB
        deleteOriginFile: false, // 压缩后是否删除原文件
      }),
      // vueDevTools({
      //   // Disable inspect plugin to prevent the TypeError
      //   inspect: false,
      // }),
      // 打包分析
      // visualizer({
      //   open: true,
      //   gzipSize: true,
      //   brotliSize: true,
      //   filename: 'dist/stats.html' // 分析图生成的文件名及路径
      // }),
    ],
    // 依赖预构建：避免运行时重复请求与转换，提升首次加载速度
    optimizeDeps: {
      include: [
        "echarts/core",
        "echarts/charts",
        "echarts/components",
        "echarts/renderers",
        "xlsx",
        "xgplayer",
        "crypto-js",
        "file-saver",
        "vue-img-cutter",
        "element-plus/es",
        "element-plus/es/components/*/style/css",
        "element-plus/es/components/message-box/style/index",
        "element-plus/es/components/notification/style/index",
        "element-plus/es/components/message/style/index",
        "element-plus/es/components/upload/style/index",
        "element-plus/es/components/button/style/index",
        "element-plus/es/components/icon/style/index",
      ],
    },
    css: {
      preprocessorOptions: {
        // sass variable and mixin
        scss: {
          additionalData: `
            @use "@styles/el-light.scss" as *; 
            @use "@styles/mixin.scss" as *;
          `,
        },
      },
      postcss: {
        plugins: [
          {
            postcssPlugin: "internal:charset-removal",
            AtRule: {
              charset: (atRule) => {
                if (atRule.name === "charset") {
                  atRule.remove();
                }
              },
            },
          },
        ],
      },
    },
  });
};

function resolvePath(paths: string) {
  return path.resolve(__dirname, paths);
}
