import { NestContainer, NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/core/injector/module';
import { MicroserviceOptions } from '@nestjs/microservices';
import ElectronTransporter from './utils/ElectronTranspoter';
import { INestMicroservice } from '@nestjs/common';
import { app as electronApp } from 'electron';
import { callOnAppReadyHook } from './common/hooks/on-app-ready.hook';
import { NestApplicationContextOptions } from '@nestjs/common/interfaces/nest-application-context-options.interface';

type ElectronNestOptions = Omit<MicroserviceOptions, 'strategy'> &
  NestApplicationContextOptions;

class ElectronNest {
  static async createApp(
    moduleCls: unknown,
    options: ElectronNestOptions = {},
  ) {
    const nestApp = await NestFactory.createMicroservice<MicroserviceOptions>(
      moduleCls,
      {
        ...options,
        strategy: new ElectronTransporter(),
      },
    );

    return new ElectronNest(nestApp);
  }

  private readonly container: NestContainer;
  private _moduleRefsForHooksByDistance: Module[] | null = null;

  constructor(readonly app: INestMicroservice) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.container = (app as any).container; // app.container is not public
  }

  // https://github.com/nestjs/nest/blob/15cb568e40f42fb3c40c4cb2ad432b23a5ec7bcd/packages/core/nest-application-context.ts#L434
  private getModulesToTriggerHooksOn(): Module[] {
    if (this._moduleRefsForHooksByDistance) {
      return this._moduleRefsForHooksByDistance;
    }

    const modulesContainer = this.container.getModules();
    const compareFn = (a: Module, b: Module) => b.distance - a.distance;
    const modulesSortedByDistance = Array.from(modulesContainer.values()).sort(
      compareFn,
    );

    this._moduleRefsForHooksByDistance = modulesSortedByDistance;

    return this._moduleRefsForHooksByDistance;
  }

  private async callAppReadyHooks() {
    if (
      'server' in this.app &&
      this.app.server instanceof ElectronTransporter
    ) {
      this.app.server.onAppReady();
    }

    const modules = this.getModulesToTriggerHooksOn();
    for (const module of modules) {
      await callOnAppReadyHook(module);
    }
  }

  async init() {
    await this.app.listen();
    await electronApp.whenReady();

    await this.callAppReadyHooks();

    electronApp.once('will-quit', () => this.app.close());
  }
}

export default ElectronNest;
