// .electron-vendors.cache.json
var node = "20";

// packages/server/vite.config.js
import { join } from "node:path";
var __vite_injected_original_dirname = "E:\\command\\apps\\electron\\packages\\server";
var PACKAGE_ROOT = __vite_injected_original_dirname;
var PROJECT_ROOT = join(PACKAGE_ROOT, "../..");
var config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  resolve: {
    alias: {
      "/@/": join(PACKAGE_ROOT, "src") + "/",
      "#common": join(PACKAGE_ROOT, "../common"),
      "#packages": join(PACKAGE_ROOT, "../")
    }
  },
  build: {
    ssr: true,
    sourcemap: "inline",
    target: `node${node}`,
    outDir: "dist",
    assetsDir: ".",
    minify: process.env.MODE !== "development",
    lib: {
      entry: "src/main.ts",
      formats: ["es"]
    },
    rollupOptions: {
      output: {
        entryFileNames: "[name].js"
      }
    },
    emptyOutDir: true,
    reportCompressedSize: false
  }
};
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLmVsZWN0cm9uLXZlbmRvcnMuY2FjaGUuanNvbiIsICJwYWNrYWdlcy9zZXJ2ZXIvdml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNocm9tZVwiOlwiMTIyXCIsXCJub2RlXCI6XCIyMFwifSIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcY29tbWFuZFxcXFxhcHBzXFxcXGVsZWN0cm9uXFxcXHBhY2thZ2VzXFxcXHNlcnZlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcY29tbWFuZFxcXFxhcHBzXFxcXGVsZWN0cm9uXFxcXHBhY2thZ2VzXFxcXHNlcnZlclxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovY29tbWFuZC9hcHBzL2VsZWN0cm9uL3BhY2thZ2VzL3NlcnZlci92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IG5vZGUgfSBmcm9tICcuLi8uLi8uZWxlY3Ryb24tdmVuZG9ycy5jYWNoZS5qc29uJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdub2RlOnBhdGgnO1xuXG5jb25zdCBQQUNLQUdFX1JPT1QgPSBfX2Rpcm5hbWU7XG5jb25zdCBQUk9KRUNUX1JPT1QgPSBqb2luKFBBQ0tBR0VfUk9PVCwgJy4uLy4uJyk7XG5cbi8qKlxuICogQHR5cGUge2ltcG9ydCgndml0ZScpLlVzZXJDb25maWd9XG4gKiBAc2VlIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG4gKi9cbmNvbnN0IGNvbmZpZyA9IHtcbiAgbW9kZTogcHJvY2Vzcy5lbnYuTU9ERSxcbiAgcm9vdDogUEFDS0FHRV9ST09ULFxuICBlbnZEaXI6IFBST0pFQ1RfUk9PVCxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnL0AvJzogam9pbihQQUNLQUdFX1JPT1QsICdzcmMnKSArICcvJyxcbiAgICAgICcjY29tbW9uJzogam9pbihQQUNLQUdFX1JPT1QsICcuLi9jb21tb24nKSxcbiAgICAgICcjcGFja2FnZXMnOiBqb2luKFBBQ0tBR0VfUk9PVCwgJy4uLycpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgc3NyOiB0cnVlLFxuICAgIHNvdXJjZW1hcDogJ2lubGluZScsXG4gICAgdGFyZ2V0OiBgbm9kZSR7bm9kZX1gLFxuICAgIG91dERpcjogJ2Rpc3QnLFxuICAgIGFzc2V0c0RpcjogJy4nLFxuICAgIG1pbmlmeTogcHJvY2Vzcy5lbnYuTU9ERSAhPT0gJ2RldmVsb3BtZW50JyxcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiAnc3JjL21haW4udHMnLFxuICAgICAgZm9ybWF0czogWydlcyddLFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnW25hbWVdLmpzJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogZmFsc2UsXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb25maWc7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdCLFdBQU87OztBQ0N2QixTQUFTLFlBQVk7QUFEckIsSUFBTSxtQ0FBbUM7QUFHekMsSUFBTSxlQUFlO0FBQ3JCLElBQU0sZUFBZSxLQUFLLGNBQWMsT0FBTztBQU0vQyxJQUFNLFNBQVM7QUFBQSxFQUNiLE1BQU0sUUFBUSxJQUFJO0FBQUEsRUFDbEIsTUFBTTtBQUFBLEVBQ04sUUFBUTtBQUFBLEVBQ1IsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsT0FBTyxLQUFLLGNBQWMsS0FBSyxJQUFJO0FBQUEsTUFDbkMsV0FBVyxLQUFLLGNBQWMsV0FBVztBQUFBLE1BQ3pDLGFBQWEsS0FBSyxjQUFjLEtBQUs7QUFBQSxJQUN2QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLEtBQUs7QUFBQSxJQUNMLFdBQVc7QUFBQSxJQUNYLFFBQVEsT0FBTyxJQUFJO0FBQUEsSUFDbkIsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsUUFBUSxRQUFRLElBQUksU0FBUztBQUFBLElBQzdCLEtBQUs7QUFBQSxNQUNILE9BQU87QUFBQSxNQUNQLFNBQVMsQ0FBQyxJQUFJO0FBQUEsSUFDaEI7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsSUFDRjtBQUFBLElBQ0EsYUFBYTtBQUFBLElBQ2Isc0JBQXNCO0FBQUEsRUFDeEI7QUFDRjtBQUVBLElBQU8sc0JBQVE7IiwKICAibmFtZXMiOiBbXQp9Cg==
