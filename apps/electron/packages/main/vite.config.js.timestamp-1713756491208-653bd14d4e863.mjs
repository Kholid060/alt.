// .electron-vendors.cache.json
var node = '20';

// packages/main/vite.config.js
import { join } from 'node:path';
import { viteStaticCopy } from 'file:///E:/command/apps/electron/node_modules/vite-plugin-static-copy/dist/index.js';
var __vite_injected_original_dirname =
  'E:\\command\\apps\\electron\\packages\\main';
var PACKAGE_ROOT = __vite_injected_original_dirname;
var PROJECT_ROOT = join(PACKAGE_ROOT, '../..');
var config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: PROJECT_ROOT,
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
      '#common': join(PACKAGE_ROOT, '../common'),
      '#packages': join(PACKAGE_ROOT, '../'),
    },
  },
  build: {
    ssr: true,
    sourcemap: 'inline',
    target: `node${node}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE !== 'development',
    lib: {
      entry: {
        index: 'src/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/db/migrations',
          dest: '',
        },
      ],
    }),
  ],
};
var vite_config_default = config;
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLmVsZWN0cm9uLXZlbmRvcnMuY2FjaGUuanNvbiIsICJwYWNrYWdlcy9tYWluL3ZpdGUuY29uZmlnLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjaHJvbWVcIjpcIjEyMlwiLFwibm9kZVwiOlwiMjBcIn0iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXGNvbW1hbmRcXFxcYXBwc1xcXFxlbGVjdHJvblxcXFxwYWNrYWdlc1xcXFxtYWluXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxjb21tYW5kXFxcXGFwcHNcXFxcZWxlY3Ryb25cXFxccGFja2FnZXNcXFxcbWFpblxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovY29tbWFuZC9hcHBzL2VsZWN0cm9uL3BhY2thZ2VzL21haW4vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBub2RlIH0gZnJvbSAnLi4vLi4vLmVsZWN0cm9uLXZlbmRvcnMuY2FjaGUuanNvbic7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB7IHZpdGVTdGF0aWNDb3B5IH0gZnJvbSAndml0ZS1wbHVnaW4tc3RhdGljLWNvcHknO1xuXG5jb25zdCBQQUNLQUdFX1JPT1QgPSBfX2Rpcm5hbWU7XG5jb25zdCBQUk9KRUNUX1JPT1QgPSBqb2luKFBBQ0tBR0VfUk9PVCwgJy4uLy4uJyk7XG5cbi8qKlxuICogQHR5cGUge2ltcG9ydCgndml0ZScpLlVzZXJDb25maWd9XG4gKiBAc2VlIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG4gKi9cbmNvbnN0IGNvbmZpZyA9IHtcbiAgbW9kZTogcHJvY2Vzcy5lbnYuTU9ERSxcbiAgcm9vdDogUEFDS0FHRV9ST09ULFxuICBlbnZEaXI6IFBST0pFQ1RfUk9PVCxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnL0AvJzogam9pbihQQUNLQUdFX1JPT1QsICdzcmMnKSArICcvJyxcbiAgICAgICcjY29tbW9uJzogam9pbihQQUNLQUdFX1JPT1QsICcuLi9jb21tb24nKSxcbiAgICAgICcjcGFja2FnZXMnOiBqb2luKFBBQ0tBR0VfUk9PVCwgJy4uLycpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgc3NyOiB0cnVlLFxuICAgIHNvdXJjZW1hcDogJ2lubGluZScsXG4gICAgdGFyZ2V0OiBgbm9kZSR7bm9kZX1gLFxuICAgIG91dERpcjogJ2Rpc3QnLFxuICAgIGFzc2V0c0RpcjogJy4nLFxuICAgIG1pbmlmeTogcHJvY2Vzcy5lbnYuTU9ERSAhPT0gJ2RldmVsb3BtZW50JyxcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiB7XG4gICAgICAgIGluZGV4OiAnc3JjL2luZGV4LnRzJyxcbiAgICAgIH0sXG4gICAgICBmb3JtYXRzOiBbJ2VzJ10sXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdbbmFtZV0uanMnLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHZpdGVTdGF0aWNDb3B5KHtcbiAgICAgIHRhcmdldHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHNyYzogJ3NyYy9kYi9taWdyYXRpb25zJyxcbiAgICAgICAgICBkZXN0OiAnJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSksXG4gIF0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb25maWc7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdCLFdBQU87OztBQ0N2QixTQUFTLFlBQVk7QUFDckIsU0FBUyxzQkFBc0I7QUFGL0IsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTSxlQUFlO0FBQ3JCLElBQU0sZUFBZSxLQUFLLGNBQWMsT0FBTztBQU0vQyxJQUFNLFNBQVM7QUFBQSxFQUNiLE1BQU0sUUFBUSxJQUFJO0FBQUEsRUFDbEIsTUFBTTtBQUFBLEVBQ04sUUFBUTtBQUFBLEVBQ1IsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsT0FBTyxLQUFLLGNBQWMsS0FBSyxJQUFJO0FBQUEsTUFDbkMsV0FBVyxLQUFLLGNBQWMsV0FBVztBQUFBLE1BQ3pDLGFBQWEsS0FBSyxjQUFjLEtBQUs7QUFBQSxJQUN2QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLEtBQUs7QUFBQSxJQUNMLFdBQVc7QUFBQSxJQUNYLFFBQVEsT0FBTyxJQUFJO0FBQUEsSUFDbkIsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsUUFBUSxRQUFRLElBQUksU0FBUztBQUFBLElBQzdCLEtBQUs7QUFBQSxNQUNILE9BQU87QUFBQSxRQUNMLE9BQU87QUFBQSxNQUNUO0FBQUEsTUFDQSxTQUFTLENBQUMsSUFBSTtBQUFBLElBQ2hCO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGFBQWE7QUFBQSxJQUNiLHNCQUFzQjtBQUFBLEVBQ3hCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxlQUFlO0FBQUEsTUFDYixTQUFTO0FBQUEsUUFDUDtBQUFBLFVBQ0UsS0FBSztBQUFBLFVBQ0wsTUFBTTtBQUFBLFFBQ1I7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSDtBQUNGO0FBRUEsSUFBTyxzQkFBUTsiLAogICJuYW1lcyI6IFtdCn0K
