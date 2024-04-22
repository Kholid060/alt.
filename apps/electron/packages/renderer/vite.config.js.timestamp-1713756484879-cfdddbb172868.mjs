// .electron-vendors.cache.json
var chrome = "122";

// packages/renderer/vite.config.js
import react from "file:///E:/command/apps/electron/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { join } from "node:path";
var __vite_injected_original_dirname = "E:\\command\\apps\\electron\\packages\\renderer";
var PACKAGE_ROOT = __vite_injected_original_dirname;
var PROJECT_ROOT = join(PACKAGE_ROOT, "../..");
var config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  resolve: {
    alias: {
      "#packages": join(PACKAGE_ROOT, "../"),
      "/@/": join(PACKAGE_ROOT, "src") + "/",
      "#common": join(PACKAGE_ROOT, "../common")
    }
  },
  server: {
    fs: {
      strict: true
    }
  },
  build: {
    sourcemap: true,
    target: `chrome${chrome}`,
    outDir: "dist",
    assetsDir: ".",
    minify: process.env.MODE !== "development",
    rollupOptions: {
      input: {
        main: join(__vite_injected_original_dirname, "index.html"),
        dashboard: join(__vite_injected_original_dirname, "dashboard.html")
      },
      output: {
        assetFileNames: "[name].[ext]"
      },
      external: ["**/*.dev.tsx"]
    },
    emptyOutDir: true,
    reportCompressedSize: false
  },
  optimizeDeps: {
    include: ["react/jsx-runtime"]
  },
  plugins: [
    react(),
    {
      name: "middleware",
      apply: "serve",
      configureServer(viteDevServer) {
        return () => {
          viteDevServer.middlewares.use(async (req, _res, next) => {
            if (req.originalUrl.startsWith("/dashboard")) {
              req.url = "/dashboard.html";
            }
            next();
          });
        };
      }
    }
  ]
};
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLmVsZWN0cm9uLXZlbmRvcnMuY2FjaGUuanNvbiIsICJwYWNrYWdlcy9yZW5kZXJlci92aXRlLmNvbmZpZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY2hyb21lXCI6XCIxMjJcIixcIm5vZGVcIjpcIjIwXCJ9IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxjb21tYW5kXFxcXGFwcHNcXFxcZWxlY3Ryb25cXFxccGFja2FnZXNcXFxccmVuZGVyZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXGNvbW1hbmRcXFxcYXBwc1xcXFxlbGVjdHJvblxcXFxwYWNrYWdlc1xcXFxyZW5kZXJlclxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovY29tbWFuZC9hcHBzL2VsZWN0cm9uL3BhY2thZ2VzL3JlbmRlcmVyL3ZpdGUuY29uZmlnLmpzXCI7LyogZXNsaW50LWVudiBub2RlICovXG5cbmltcG9ydCB7IGNocm9tZSB9IGZyb20gJy4uLy4uLy5lbGVjdHJvbi12ZW5kb3JzLmNhY2hlLmpzb24nO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdub2RlOnBhdGgnO1xuXG5jb25zdCBQQUNLQUdFX1JPT1QgPSBfX2Rpcm5hbWU7XG5jb25zdCBQUk9KRUNUX1JPT1QgPSBqb2luKFBBQ0tBR0VfUk9PVCwgJy4uLy4uJyk7XG5cbi8qKlxuICogQHR5cGUge2ltcG9ydCgndml0ZScpLlVzZXJDb25maWd9XG4gKiBAc2VlIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG4gKi9cbmNvbnN0IGNvbmZpZyA9IHtcbiAgbW9kZTogcHJvY2Vzcy5lbnYuTU9ERSxcbiAgcm9vdDogUEFDS0FHRV9ST09ULFxuICBlbnZEaXI6IFBST0pFQ1RfUk9PVCxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnI3BhY2thZ2VzJzogam9pbihQQUNLQUdFX1JPT1QsICcuLi8nKSxcbiAgICAgICcvQC8nOiBqb2luKFBBQ0tBR0VfUk9PVCwgJ3NyYycpICsgJy8nLFxuICAgICAgJyNjb21tb24nOiBqb2luKFBBQ0tBR0VfUk9PVCwgJy4uL2NvbW1vbicpLFxuICAgIH0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGZzOiB7XG4gICAgICBzdHJpY3Q6IHRydWUsXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgdGFyZ2V0OiBgY2hyb21lJHtjaHJvbWV9YCxcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBhc3NldHNEaXI6ICcuJyxcbiAgICBtaW5pZnk6IHByb2Nlc3MuZW52Lk1PREUgIT09ICdkZXZlbG9wbWVudCcsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgbWFpbjogam9pbihfX2Rpcm5hbWUsICdpbmRleC5odG1sJyksXG4gICAgICAgIGRhc2hib2FyZDogam9pbihfX2Rpcm5hbWUsICdkYXNoYm9hcmQuaHRtbCcpLFxuICAgICAgfSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBhc3NldEZpbGVOYW1lczogJ1tuYW1lXS5bZXh0XScsXG4gICAgICB9LFxuICAgICAgZXh0ZXJuYWw6IFsnKiovKi5kZXYudHN4J10sXG4gICAgfSxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogZmFsc2UsXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFsncmVhY3QvanN4LXJ1bnRpbWUnXSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAge1xuICAgICAgbmFtZTogJ21pZGRsZXdhcmUnLFxuICAgICAgYXBwbHk6ICdzZXJ2ZScsXG4gICAgICBjb25maWd1cmVTZXJ2ZXIodml0ZURldlNlcnZlcikge1xuICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgIHZpdGVEZXZTZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIF9yZXMsIG5leHQpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXEub3JpZ2luYWxVcmwuc3RhcnRzV2l0aCgnL2Rhc2hib2FyZCcpKSB7XG4gICAgICAgICAgICAgIHJlcS51cmwgPSAnL2Rhc2hib2FyZC5odG1sJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgfSxcbiAgICB9LFxuICBdLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY29uZmlnO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLGFBQVM7OztBQ0dWLE9BQU8sV0FBVztBQUNsQixTQUFTLFlBQVk7QUFKckIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTSxlQUFlO0FBQ3JCLElBQU0sZUFBZSxLQUFLLGNBQWMsT0FBTztBQU0vQyxJQUFNLFNBQVM7QUFBQSxFQUNiLE1BQU0sUUFBUSxJQUFJO0FBQUEsRUFDbEIsTUFBTTtBQUFBLEVBQ04sUUFBUTtBQUFBLEVBQ1IsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsYUFBYSxLQUFLLGNBQWMsS0FBSztBQUFBLE1BQ3JDLE9BQU8sS0FBSyxjQUFjLEtBQUssSUFBSTtBQUFBLE1BQ25DLFdBQVcsS0FBSyxjQUFjLFdBQVc7QUFBQSxJQUMzQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLElBQUk7QUFBQSxNQUNGLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsV0FBVztBQUFBLElBQ1gsUUFBUSxTQUFTLE1BQU07QUFBQSxJQUN2QixRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxRQUFRLFFBQVEsSUFBSSxTQUFTO0FBQUEsSUFDN0IsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsTUFBTSxLQUFLLGtDQUFXLFlBQVk7QUFBQSxRQUNsQyxXQUFXLEtBQUssa0NBQVcsZ0JBQWdCO0FBQUEsTUFDN0M7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsTUFDQSxVQUFVLENBQUMsY0FBYztBQUFBLElBQzNCO0FBQUEsSUFDQSxhQUFhO0FBQUEsSUFDYixzQkFBc0I7QUFBQSxFQUN4QjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUyxDQUFDLG1CQUFtQjtBQUFBLEVBQy9CO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTjtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLE1BQ1AsZ0JBQWdCLGVBQWU7QUFDN0IsZUFBTyxNQUFNO0FBQ1gsd0JBQWMsWUFBWSxJQUFJLE9BQU8sS0FBSyxNQUFNLFNBQVM7QUFDdkQsZ0JBQUksSUFBSSxZQUFZLFdBQVcsWUFBWSxHQUFHO0FBQzVDLGtCQUFJLE1BQU07QUFBQSxZQUNaO0FBRUEsaUJBQUs7QUFBQSxVQUNQLENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFROyIsCiAgIm5hbWVzIjogW10KfQo=
