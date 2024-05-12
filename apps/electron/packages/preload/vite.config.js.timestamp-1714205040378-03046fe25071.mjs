// .electron-vendors.cache.json
var chrome = '122';

// packages/preload/vite.config.js
import { join } from 'node:path';
var __vite_injected_original_dirname =
  'E:\\command\\apps\\electron\\packages\\preload';
var PACKAGE_ROOT = __vite_injected_original_dirname;
var PROJECT_ROOT = join(PACKAGE_ROOT, '../..');
var config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  ssr: {
    noExternal: ['eventemitter3', 'nanoid'],
  },
  resolve: {
    alias: {
      '#common': join(PACKAGE_ROOT, '../common'),
    },
  },
  build: {
    ssr: true,
    sourcemap: 'inline',
    target: `chrome${chrome}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE !== 'development',
    lib: {
      entry: ['src/index.ts'],
      formats: ['cjs'],
    },
    rollupOptions: {
      output: {
        // ESM preload scripts must have the .mjs extension
        // https://www.electronjs.org/docs/latest/tutorial/esm#esm-preload-scripts-must-have-the-mjs-extension
        entryFileNames: '[name].mjs',
      },
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
};
var vite_config_default = config;
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLmVsZWN0cm9uLXZlbmRvcnMuY2FjaGUuanNvbiIsICJwYWNrYWdlcy9wcmVsb2FkL3ZpdGUuY29uZmlnLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjaHJvbWVcIjpcIjEyMlwiLFwibm9kZVwiOlwiMjBcIn0iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXGNvbW1hbmRcXFxcYXBwc1xcXFxlbGVjdHJvblxcXFxwYWNrYWdlc1xcXFxwcmVsb2FkXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxjb21tYW5kXFxcXGFwcHNcXFxcZWxlY3Ryb25cXFxccGFja2FnZXNcXFxccHJlbG9hZFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovY29tbWFuZC9hcHBzL2VsZWN0cm9uL3BhY2thZ2VzL3ByZWxvYWQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBjaHJvbWUgfSBmcm9tICcuLi8uLi8uZWxlY3Ryb24tdmVuZG9ycy5jYWNoZS5qc29uJztcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdub2RlOnBhdGgnO1xuXG5jb25zdCBQQUNLQUdFX1JPT1QgPSBfX2Rpcm5hbWU7XG5jb25zdCBQUk9KRUNUX1JPT1QgPSBqb2luKFBBQ0tBR0VfUk9PVCwgJy4uLy4uJyk7XG5cbi8qKlxuICogQHR5cGUge2ltcG9ydCgndml0ZScpLlVzZXJDb25maWd9XG4gKiBAc2VlIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG4gKi9cbmNvbnN0IGNvbmZpZyA9IHtcbiAgbW9kZTogcHJvY2Vzcy5lbnYuTU9ERSxcbiAgcm9vdDogUEFDS0FHRV9ST09ULFxuICBlbnZEaXI6IFBST0pFQ1RfUk9PVCxcbiAgc3NyOiB7XG4gICAgbm9FeHRlcm5hbDogWydldmVudGVtaXR0ZXIzJywgJ25hbm9pZCddLFxuICB9LFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICcjY29tbW9uJzogam9pbihQQUNLQUdFX1JPT1QsICcuLi9jb21tb24nKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHNzcjogdHJ1ZSxcbiAgICBzb3VyY2VtYXA6ICdpbmxpbmUnLFxuICAgIHRhcmdldDogYGNocm9tZSR7Y2hyb21lfWAsXG4gICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgYXNzZXRzRGlyOiAnLicsXG4gICAgbWluaWZ5OiBwcm9jZXNzLmVudi5NT0RFICE9PSAnZGV2ZWxvcG1lbnQnLFxuICAgIGxpYjoge1xuICAgICAgZW50cnk6IFsnc3JjL2luZGV4LnRzJ10sXG4gICAgICBmb3JtYXRzOiBbJ2NqcyddLFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIEVTTSBwcmVsb2FkIHNjcmlwdHMgbXVzdCBoYXZlIHRoZSAubWpzIGV4dGVuc2lvblxuICAgICAgICAvLyBodHRwczovL3d3dy5lbGVjdHJvbmpzLm9yZy9kb2NzL2xhdGVzdC90dXRvcmlhbC9lc20jZXNtLXByZWxvYWQtc2NyaXB0cy1tdXN0LWhhdmUtdGhlLW1qcy1leHRlbnNpb25cbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdbbmFtZV0ubWpzJyxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogZmFsc2UsXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb25maWc7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsYUFBUzs7O0FDQ1YsU0FBUyxZQUFZO0FBRHJCLElBQU0sbUNBQW1DO0FBR3pDLElBQU0sZUFBZTtBQUNyQixJQUFNLGVBQWUsS0FBSyxjQUFjLE9BQU87QUFNL0MsSUFBTSxTQUFTO0FBQUEsRUFDYixNQUFNLFFBQVEsSUFBSTtBQUFBLEVBQ2xCLE1BQU07QUFBQSxFQUNOLFFBQVE7QUFBQSxFQUNSLEtBQUs7QUFBQSxJQUNILFlBQVksQ0FBQyxpQkFBaUIsUUFBUTtBQUFBLEVBQ3hDO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxXQUFXLEtBQUssY0FBYyxXQUFXO0FBQUEsSUFDM0M7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxLQUFLO0FBQUEsSUFDTCxXQUFXO0FBQUEsSUFDWCxRQUFRLFNBQVMsTUFBTTtBQUFBLElBQ3ZCLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLFFBQVEsUUFBUSxJQUFJLFNBQVM7QUFBQSxJQUM3QixLQUFLO0FBQUEsTUFDSCxPQUFPLENBQUMsY0FBYztBQUFBLE1BQ3RCLFNBQVMsQ0FBQyxLQUFLO0FBQUEsSUFDakI7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQTtBQUFBO0FBQUEsUUFHTixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGFBQWE7QUFBQSxJQUNiLHNCQUFzQjtBQUFBLEVBQ3hCO0FBQ0Y7QUFFQSxJQUFPLHNCQUFROyIsCiAgIm5hbWVzIjogW10KfQo=
