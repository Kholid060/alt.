import { InlineConfig, Rollup } from 'vite';
import { BuildError, logger } from './utils/logger';
import ManifestUtils, { EXT_API_PKG_NAME } from './utils/ManifestUtils';
import path from 'path';
import fs from 'fs-extra';

const DEPS_MAP: Record<string, string> = {
  react: '/@preload/react.js',
  'react-dom': '/@preload/react-dom.js',
  'react/jsx-runtime': '/@preload/react-runtime.js',
};

const manifestUtils = new ManifestUtils(process.cwd());

const OUT_DIR = path.join(process.cwd(), 'dist');
fs.ensureDirSync(OUT_DIR);

let commandIds = new Set<string>();

async function buildCommands(watch = false) {
  const manifest = await manifestUtils.getExtensionManifest();
  const { commands, scripts } =
    await manifestUtils.getExtensionCommands(manifest);

  const packageJSONPath = manifestUtils.getExtPath('package.json');

  commandIds = new Set(Object.keys(commands));
  const scriptsPath = new Set(Object.values(scripts));

  process.env.NODE_ENV = 'production';

  const { build } = await import('vite');
  const copyScripts = () => {
    return Promise.allSettled(
      Object.values(scripts).map((script) =>
        fs.copy(script, path.join(OUT_DIR, path.basename(script))),
      ),
    );
  };

  let watcher: Rollup.RollupWatcher | null = null;
  const config: InlineConfig = {
    mode: process.env.MODE ?? 'production',
    define: {
      _extension: '_extension',
      'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
    },
    publicDir: './public',
    esbuild: watch
      ? {
          keepNames: true,
          minifyIdentifiers: true,
        }
      : undefined,
    build: {
      minify: watch ? false : 'esbuild',
      outDir: OUT_DIR,
      sourcemap: watch ? 'inline' : false,
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
    },
    plugins: [
      {
        name: 'build-manifest',
        buildStart() {
          this.addWatchFile(packageJSONPath);
          Object.values(scripts).forEach((script) => {
            this.addWatchFile(script);
          });
        },
        async buildEnd() {
          await copyScripts();
          await manifestUtils.writeManifestFile(manifest);
        },
      },
    ],
  };

  if (Object.keys(commands).length > 0) {
    const buildResult = await build(config);
    if ('close' in buildResult) {
      watcher = buildResult;
      watcher.on('change', async (id, change) => {
        if (change.event !== 'update') return;

        if (id === packageJSONPath) {
          const currentManifest = await manifestUtils.getExtensionManifest();
          const newCommands = new Set(
            currentManifest.commands.map((command) => command.name),
          );

          let restartWatch = newCommands.size !== commandIds.size;
          if (!restartWatch) {
            restartWatch = [...commandIds].every((id) => newCommands.has(id));
          }

          await manifestUtils.writeManifestFile(currentManifest);

          if (!restartWatch) return;

          console.log('Restart watcher');

          watcher?.close();
          buildExtension(watch);
          return;
        }

        if (scriptsPath.has(id)) {
          const scriptFilename = path.basename(id);
          console.log(`Updating "${scriptFilename}" script`);
          await fs.copy(id, path.join(OUT_DIR, scriptFilename));
        }
      });
    }
  }

  await copyScripts();
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
