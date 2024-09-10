import path from 'path';
import fs from 'fs-extra';
import ManifestUtils, { EXT_API_PKG_NAME } from '../utils/ManifestUtils';
import ExtensionBuilderServer from './ExtensionBuilderServer';
import { ExtensionManifest } from '../../extension-manifest';
import { InlineConfig } from 'vite';
import { builtinModules } from 'module';
import { logger } from '../utils/logger';
import { createConsoleTerminalCode } from '../utils/console-terminal-code';

const CWD = process.cwd();
const OUT_DIR = path.join(CWD, 'dist');

const VIRTUAL_MODULE_ID = 'virtual:console';
const RESOLVED_VIRTUAL_MODULE_ID = '\0virtual:console';

const DEPS_MAP: Record<string, string> = {
  react: '/@preload/react.js',
  'react-dom': '/@preload/react-dom.js',
  'react/jsx-runtime': '/@preload/react-runtime.js',
};

class ExtensionBuilder {
  private server: ExtensionBuilderServer | null = null;
  private manifestUtils: ManifestUtils = new ManifestUtils(CWD);

  private entries: {
    scripts: Record<string, string>;
    commands: Record<string, string>;
  } | null = null;
  private extensionManifest: { path: string; data: ExtensionManifest } | null =
    null;

  constructor(readonly watchMode: boolean = false) {}

  async init() {
    await fs.ensureDir(OUT_DIR);

    let port: number | undefined;
    if (this.watchMode) {
      this.server = new ExtensionBuilderServer();
      const startResult = await this.server.start();
      port = startResult.port;
    }

    this.extensionManifest = await this.manifestUtils.getExtensionManifest();
    this.entries = await this.manifestUtils.getExtensionCommands(
      this.extensionManifest.data,
    );
    await this.build(this.getViteConfig(port), port);
  }

  private getViteConfig(serverPort?: number): InlineConfig {
    if (!this.entries || !this.extensionManifest) {
      throw new Error('Missing extension manifest or entries');
    }

    const watchFiles = this.watchMode
      ? [...Object.values(this.entries.scripts), this.extensionManifest.path]
      : [];
    const entriesPaths = Object.values(this.entries.commands);

    const isWatchMode = this.watchMode;

    return {
      mode: process.env.MODE ?? 'production',
      define: {
        _extension: '_extension',
        'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
      },
      publicDir: './public',
      esbuild: {
        supported: {
          'top-level-await': true,
        },
        ...(this.watchMode
          ? {
              keepNames: true,
              minifyWhitespace: true,
              minifyIdentifiers: true,
            }
          : {
              drop: ['console'],
            }),
      },
      build: {
        minify: this.watchMode ? false : 'esbuild',
        outDir: OUT_DIR,
        sourcemap: this.watchMode ? 'inline' : false,
        watch: this.watchMode
          ? {
              clearScreen: true,
            }
          : null,
        lib: {
          formats: ['es'],
          entry: this.entries.commands,
        },
        rollupOptions: {
          treeshake: this.watchMode ? undefined : 'smallest',
          external: [
            ...Object.keys(DEPS_MAP),
            ...builtinModules.flatMap((item) => [item, `node:${item}`]),
          ],
          output: {
            paths: (id) => {
              return DEPS_MAP[id] || id;
            },
            entryFileNames: '[name].js',
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
          transform: (code, id) => {
            if (!isWatchMode || !entriesPaths.some((file) => id.endsWith(file)))
              return;

            return {
              code: `import '${VIRTUAL_MODULE_ID}';\n${code}`,
            };
          },
          resolveId(id) {
            if (isWatchMode && id === VIRTUAL_MODULE_ID)
              return RESOLVED_VIRTUAL_MODULE_ID;
          },
          load(id) {
            if (
              !serverPort ||
              !isWatchMode ||
              id !== RESOLVED_VIRTUAL_MODULE_ID
            )
              return;

            return createConsoleTerminalCode(serverPort);
          },
          buildStart() {
            watchFiles.forEach((file) => {
              this.addWatchFile(file);
            });
          },
          buildEnd: async () => {
            await this.copyScriptEntries();
            await this.manifestUtils.writeManifestFile(
              this.extensionManifest!.data,
            );
          },
        },
      ],
    };
  }

  private async build(config: InlineConfig, serverPort?: number) {
    const { build } = await import('vite');
    const watcher = await build(config);

    if (!this.watchMode) {
      await this.copyScriptEntries();
      await this.manifestUtils.writeManifestFile(this.extensionManifest!.data);
    }

    if (!('close' in watcher) || !this.extensionManifest || !this.entries)
      return;

    const manifestFilePath = this.extensionManifest.path.replaceAll(
      '/',
      path.sep,
    );
    const currentEntries = [
      ...Object.keys(this.entries.commands),
      ...Object.keys(this.entries.scripts),
    ];
    watcher.on('change', async (id, change) => {
      if (change.event !== 'update' || id !== manifestFilePath) return;

      this.extensionManifest = await this.manifestUtils.getExtensionManifest();
      this.entries = await this.manifestUtils.getExtensionCommands(
        this.extensionManifest.data,
      );

      const newEntries = [
        ...Object.keys(this.entries.commands),
        ...Object.keys(this.entries.scripts),
      ];
      const restartWatcher =
        currentEntries.length !== newEntries.length ||
        !newEntries.every((entry) => currentEntries.includes(entry));
      if (restartWatcher) {
        logger.info('Restart watcher');

        watcher.close();
        this.build(config, serverPort);
        return;
      }

      await this.manifestUtils.writeManifestFile(this.extensionManifest.data);
    });
  }

  private async copyScriptEntries() {
    if (!this.entries) throw new Error('Missing script entries');

    await Promise.allSettled(
      Object.values(this.entries.scripts).map((script) =>
        fs.copy(script, path.join(OUT_DIR, path.basename(script))),
      ),
    );
  }
}

export default ExtensionBuilder;
