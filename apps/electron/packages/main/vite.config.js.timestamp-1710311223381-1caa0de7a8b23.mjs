// .electron-vendors.cache.json
var node = "20";

// packages/main/vite.config.js
import { join } from "node:path";
var __vite_injected_original_dirname = "E:\\command\\apps\\electron\\packages\\main";
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
      entry: "src/index.ts",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLmVsZWN0cm9uLXZlbmRvcnMuY2FjaGUuanNvbiIsICJwYWNrYWdlcy9tYWluL3ZpdGUuY29uZmlnLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjaHJvbWVcIjpcIjEyMlwiLFwibm9kZVwiOlwiMjBcIn0iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXGNvbW1hbmRcXFxcYXBwc1xcXFxlbGVjdHJvblxcXFxwYWNrYWdlc1xcXFxtYWluXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxjb21tYW5kXFxcXGFwcHNcXFxcZWxlY3Ryb25cXFxccGFja2FnZXNcXFxcbWFpblxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovY29tbWFuZC9hcHBzL2VsZWN0cm9uL3BhY2thZ2VzL21haW4vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBub2RlIH0gZnJvbSAnLi4vLi4vLmVsZWN0cm9uLXZlbmRvcnMuY2FjaGUuanNvbic7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAnbm9kZTpwYXRoJztcblxuY29uc3QgUEFDS0FHRV9ST09UID0gX19kaXJuYW1lO1xuY29uc3QgUFJPSkVDVF9ST09UID0gam9pbihQQUNLQUdFX1JPT1QsICcuLi8uLicpO1xuXG4vKipcbiAqIEB0eXBlIHtpbXBvcnQoJ3ZpdGUnKS5Vc2VyQ29uZmlnfVxuICogQHNlZSBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuICovXG5jb25zdCBjb25maWcgPSB7XG4gIG1vZGU6IHByb2Nlc3MuZW52Lk1PREUsXG4gIHJvb3Q6IFBBQ0tBR0VfUk9PVCxcbiAgZW52RGlyOiBQUk9KRUNUX1JPT1QsXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJy9ALyc6IGpvaW4oUEFDS0FHRV9ST09ULCAnc3JjJykgKyAnLycsXG4gICAgICAnI2NvbW1vbic6IGpvaW4oUEFDS0FHRV9ST09ULCAnLi4vY29tbW9uJyksXG4gICAgICAnI3BhY2thZ2VzJzogam9pbihQQUNLQUdFX1JPT1QsICcuLi8nKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHNzcjogdHJ1ZSxcbiAgICBzb3VyY2VtYXA6ICdpbmxpbmUnLFxuICAgIHRhcmdldDogYG5vZGUke25vZGV9YCxcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBhc3NldHNEaXI6ICcuJyxcbiAgICBtaW5pZnk6IHByb2Nlc3MuZW52Lk1PREUgIT09ICdkZXZlbG9wbWVudCcsXG4gICAgbGliOiB7XG4gICAgICBlbnRyeTogJ3NyYy9pbmRleC50cycsXG4gICAgICBmb3JtYXRzOiBbJ2VzJ10sXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdbbmFtZV0uanMnLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSxcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbmZpZztcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ0IsV0FBTzs7O0FDQ3ZCLFNBQVMsWUFBWTtBQURyQixJQUFNLG1DQUFtQztBQUd6QyxJQUFNLGVBQWU7QUFDckIsSUFBTSxlQUFlLEtBQUssY0FBYyxPQUFPO0FBTS9DLElBQU0sU0FBUztBQUFBLEVBQ2IsTUFBTSxRQUFRLElBQUk7QUFBQSxFQUNsQixNQUFNO0FBQUEsRUFDTixRQUFRO0FBQUEsRUFDUixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxPQUFPLEtBQUssY0FBYyxLQUFLLElBQUk7QUFBQSxNQUNuQyxXQUFXLEtBQUssY0FBYyxXQUFXO0FBQUEsTUFDekMsYUFBYSxLQUFLLGNBQWMsS0FBSztBQUFBLElBQ3ZDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsS0FBSztBQUFBLElBQ0wsV0FBVztBQUFBLElBQ1gsUUFBUSxPQUFPLElBQUk7QUFBQSxJQUNuQixRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxRQUFRLFFBQVEsSUFBSSxTQUFTO0FBQUEsSUFDN0IsS0FBSztBQUFBLE1BQ0gsT0FBTztBQUFBLE1BQ1AsU0FBUyxDQUFDLElBQUk7QUFBQSxJQUNoQjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsSUFDQSxhQUFhO0FBQUEsSUFDYixzQkFBc0I7QUFBQSxFQUN4QjtBQUNGO0FBRUEsSUFBTyxzQkFBUTsiLAogICJuYW1lcyI6IFtdCn0K
