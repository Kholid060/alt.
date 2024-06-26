import type { INestApplicationContext } from '@nestjs/common';
import type { Controller } from '@nestjs/common/interfaces';
import type { NestContainer } from '@nestjs/core';
import { MetadataScanner } from '@nestjs/core';
import { Injector } from '@nestjs/core/injector/injector';
import type { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { InternalCoreModule } from '@nestjs/core/injector/internal-core-module';
import { ipcMain } from 'electron';

export interface ElectronModuleMetadata {
  channel: string;
  type: 'invoke' | 'send';
}

export const IPC_PATTERN_METADATA = 'electron:ipc';

class IPCListenersController {
  private readonly injector = new Injector();
  private readonly metadataScanner = new MetadataScanner();

  private exploreMetadata(instance: Controller) {
    const instancePrototype = Object.getPrototypeOf(instance);
    const listenersMetadata: (ElectronModuleMetadata & {
      callback: unknown;
      methodKey: string;
    })[] = [];

    for (const methodKey of this.metadataScanner.getAllMethodNames(
      instancePrototype,
    )) {
      const targetCallback = instancePrototype[methodKey];
      const metadata = Reflect.getMetadata(
        IPC_PATTERN_METADATA,
        targetCallback,
      ) as ElectronModuleMetadata | undefined;
      if (typeof metadata === 'undefined') continue;

      console.log('===', instance, metadata.channel);
      ipcMain.handle(metadata.channel, (...args) => {
        return targetCallback(...args);
      });

      listenersMetadata.push({
        methodKey,
        callback: targetCallback,
        ...metadata,
      });
    }

    return listenersMetadata;
  }
  registerIPCListener(
    controller: InstanceWrapper<Controller>,
    moduleKey: string,
  ) {
    const listenersMetadata = this.exploreMetadata(controller.instance);
    console.log(listenersMetadata, moduleKey);
  }
}

export default class ElectronModule {
  private readonly container: NestContainer;
  private readonly ipcListenersController = new IPCListenersController();

  constructor(readonly app: INestApplicationContext) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.container = (app as any).container; // app.container is not public
    this.init();
  }

  init() {
    const modules = this.container.getModules();
    modules.forEach((module, moduleKey) => {
      [...module.providers.values()].forEach((provider) => {
        if (provider.instance && provider.instance in 'onAppReady') {

        }
      })
      module.controllers.forEach((controller) => {
        console.log(controller);
        this.ipcListenersController.registerIPCListener(controller, moduleKey);
      });
    });
    // modules.forEach((moduleRef) => {
    //   let moduleName = moduleRef.metatype.name;
    //   if (moduleName === InternalCoreModule.name) return;
    //   if (this.globalScope[moduleName]) {
    //     moduleName += ` (${moduleRef.token})`;
    //   }

    //   this.introspectCollection(moduleRef, moduleName, 'providers');
    //   this.introspectCollection(moduleRef, moduleName, 'controllers');

    //   // For in REPL auto-complete functionality
    //   Object.defineProperty(this.globalScope, moduleName, {
    //     value: moduleRef.metatype,
    //     configurable: false,
    //     enumerable: true,
    //   });
    // });
  }
}
