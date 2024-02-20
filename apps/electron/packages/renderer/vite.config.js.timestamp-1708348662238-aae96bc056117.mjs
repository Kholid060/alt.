// .electron-vendors.cache.json
var chrome = "120";

// packages/renderer/vite.config.js
import react from "file:///E:/command/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { renderer } from "file:///E:/command/node_modules/unplugin-auto-expose/dist/index.js";
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
      "/@/": join(PACKAGE_ROOT, "src") + "/"
    }
  },
  base: "",
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
    rollupOptions: {
      input: {
        main: join(PACKAGE_ROOT, "index.html"),
        sandbox: join(PACKAGE_ROOT, "index.html")
      }
    },
    emptyOutDir: true,
    reportCompressedSize: false
  },
  optimizeDeps: {
    include: ["react/jsx-runtime"]
  },
  plugins: [
    react(),
    renderer.vite({
      preloadEntry: join(PACKAGE_ROOT, "../preload/src/index.ts")
    })
  ]
};
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLmVsZWN0cm9uLXZlbmRvcnMuY2FjaGUuanNvbiIsICJwYWNrYWdlcy9yZW5kZXJlci92aXRlLmNvbmZpZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY2hyb21lXCI6XCIxMjBcIixcIm5vZGVcIjpcIjE4XCJ9IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxjb21tYW5kXFxcXGFwcHNcXFxcZWxlY3Ryb25cXFxccGFja2FnZXNcXFxccmVuZGVyZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXGNvbW1hbmRcXFxcYXBwc1xcXFxlbGVjdHJvblxcXFxwYWNrYWdlc1xcXFxyZW5kZXJlclxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovY29tbWFuZC9hcHBzL2VsZWN0cm9uL3BhY2thZ2VzL3JlbmRlcmVyL3ZpdGUuY29uZmlnLmpzXCI7LyogZXNsaW50LWVudiBub2RlICovXG5cbmltcG9ydCB7Y2hyb21lfSBmcm9tICcuLi8uLi8uZWxlY3Ryb24tdmVuZG9ycy5jYWNoZS5qc29uJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQge3JlbmRlcmVyfSBmcm9tICd1bnBsdWdpbi1hdXRvLWV4cG9zZSc7XG5pbXBvcnQge2pvaW59IGZyb20gJ25vZGU6cGF0aCc7XG5cbmNvbnN0IFBBQ0tBR0VfUk9PVCA9IF9fZGlybmFtZTtcbmNvbnN0IFBST0pFQ1RfUk9PVCA9IGpvaW4oUEFDS0FHRV9ST09ULCAnLi4vLi4nKTtcblxuLyoqXG4gKiBAdHlwZSB7aW1wb3J0KCd2aXRlJykuVXNlckNvbmZpZ31cbiAqIEBzZWUgaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbiAqL1xuY29uc3QgY29uZmlnID0ge1xuICBtb2RlOiBwcm9jZXNzLmVudi5NT0RFLFxuICByb290OiBQQUNLQUdFX1JPT1QsXG4gIGVudkRpcjogUFJPSkVDVF9ST09ULFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICcvQC8nOiBqb2luKFBBQ0tBR0VfUk9PVCwgJ3NyYycpICsgJy8nLFxuICAgIH0sXG4gIH0sXG4gIGJhc2U6ICcnLFxuICBzZXJ2ZXI6IHtcbiAgICBmczoge1xuICAgICAgc3RyaWN0OiB0cnVlLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgc291cmNlbWFwOiB0cnVlLFxuICAgIHRhcmdldDogYGNocm9tZSR7Y2hyb21lfWAsXG4gICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgYXNzZXRzRGlyOiAnLicsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgbWFpbjogam9pbihQQUNLQUdFX1JPT1QsICdpbmRleC5odG1sJyksXG4gICAgICAgIHNhbmRib3g6IGpvaW4oUEFDS0FHRV9ST09ULCAnaW5kZXguaHRtbCcpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogWydyZWFjdC9qc3gtcnVudGltZSddLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICByZW5kZXJlci52aXRlKHtcbiAgICAgIHByZWxvYWRFbnRyeTogam9pbihQQUNLQUdFX1JPT1QsICcuLi9wcmVsb2FkL3NyYy9pbmRleC50cycpLFxuICAgIH0pLFxuICBdLFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY29uZmlnO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLGFBQVM7OztBQ0dWLE9BQU8sV0FBVztBQUNsQixTQUFRLGdCQUFlO0FBQ3ZCLFNBQVEsWUFBVztBQUxuQixJQUFNLG1DQUFtQztBQU96QyxJQUFNLGVBQWU7QUFDckIsSUFBTSxlQUFlLEtBQUssY0FBYyxPQUFPO0FBTS9DLElBQU0sU0FBUztBQUFBLEVBQ2IsTUFBTSxRQUFRLElBQUk7QUFBQSxFQUNsQixNQUFNO0FBQUEsRUFDTixRQUFRO0FBQUEsRUFDUixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxPQUFPLEtBQUssY0FBYyxLQUFLLElBQUk7QUFBQSxJQUNyQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQU07QUFBQSxFQUNOLFFBQVE7QUFBQSxJQUNOLElBQUk7QUFBQSxNQUNGLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsV0FBVztBQUFBLElBQ1gsUUFBUSxTQUFTLE1BQU07QUFBQSxJQUN2QixRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxlQUFlO0FBQUEsTUFDYixPQUFPO0FBQUEsUUFDTCxNQUFNLEtBQUssY0FBYyxZQUFZO0FBQUEsUUFDckMsU0FBUyxLQUFLLGNBQWMsWUFBWTtBQUFBLE1BQzFDO0FBQUEsSUFDRjtBQUFBLElBQ0EsYUFBYTtBQUFBLElBQ2Isc0JBQXNCO0FBQUEsRUFDeEI7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxtQkFBbUI7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxLQUFLO0FBQUEsTUFDWixjQUFjLEtBQUssY0FBYyx5QkFBeUI7QUFBQSxJQUM1RCxDQUFDO0FBQUEsRUFDSDtBQUNGO0FBRUEsSUFBTyxzQkFBUTsiLAogICJuYW1lcyI6IFtdCn0K
