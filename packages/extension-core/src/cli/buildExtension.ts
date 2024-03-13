import { InlineConfig, Rollup } from 'vite';
import { BuildError, logger } from './utils/logger';
import * as tmp from 'tmp';
import ManifestUtils, { EXT_API_PKG_NAME } from './utils/ManifestUtils';

tmp.setGracefulCleanup();

const DEPS_MAP: Record<string, string> = {
  react: '/@preload/react.js',
  'react-dom': '/@preload/react-dom.js',
  'react/jsx-runtime': '/@preload/react-runtime.js',
};

const manifestUtils = new ManifestUtils(process.cwd());

let commandIds = new Set<string>();

async function buildCommands(watch = false) {
  const manifest = await manifestUtils.getExtensionManifest();
  const commands = await manifestUtils.getExtensionCommands(manifest);

  const packageJSONPath = manifestUtils.getExtPath('package.json');

  commandIds = new Set(Object.keys(commands));

  process.env.NODE_ENV = 'production';

  const { build } = await import('vite');

  let watcher: Rollup.RollupWatcher | null = null;
  const config: InlineConfig = {
    mode: process.env.MODE ?? 'production',
    define: {
      'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
    },
    publicDir: './public',
    build: {
      watch: watch
        ? {
            clearScreen: true,
          }
        : null,
      lib: {
        entry: commands,
        formats: ['es'],
        name: '[name].js',
      },
      rollupOptions: {
        external: [...Object.keys(DEPS_MAP)],
        output: {
          paths: (id) => {
            return DEPS_MAP[id] || id;
          },
          manualChunks: {
            [EXT_API_PKG_NAME]: [EXT_API_PKG_NAME],
          },
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name === EXT_API_PKG_NAME) {
              return '@libs/$extension-api.js';
            }

            return `@libs/${chunkInfo.name}.js`;
          },
        },
      },
      minify: true,
    },
    plugins: [
      {
        name: 'build-manifest',
        buildStart() {
          this.addWatchFile(packageJSONPath);
        },
        async buildEnd() {
          await manifestUtils.writeManifestFile(manifest);
        },
      },
    ],
  };

  const buildResult = await build(config);
  if ('close' in buildResult) {
    watcher = buildResult;
    watcher.on('change', async (id, change) => {
      if (id !== packageJSONPath || change.event !== 'update') return;

      const currentManifest = await manifestUtils.getExtensionManifest();
      const newCommands = new Set(
        currentManifest.commands.map((command) => command.name),
      );

      let restartWatch = newCommands.size !== commandIds.size;
      if (!restartWatch) {
        restartWatch = [...commandIds].every((id) => newCommands.has(id));
        console.log(commandIds, newCommands);
      }

      await manifestUtils.writeManifestFile(currentManifest);

      if (!restartWatch) return;

      console.log('Restart watcher');

      watcher?.close();
      buildExtension(watch);
    });
  }

  await manifestUtils.writeManifestFile(manifest);
}

async function buildExtension(watch = false) {
  try {
    await buildCommands(watch);
  } catch (error) {
    if (error instanceof BuildError) {
      logger.error(error.message);
      return;
    }

    console.error(error);
  }
}

export default buildExtension;
