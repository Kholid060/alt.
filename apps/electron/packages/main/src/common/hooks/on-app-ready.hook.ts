// https://github.com/nestjs/nest/blob/15cb568e40f42fb3c40c4cb2ad432b23a5ec7bcd/packages/core/hooks/on-module-init.hook.ts#L37
import { Module } from '@nestjs/core/injector/module';
import {
  getTransientInstances,
  getNonTransientInstances,
} from '@nestjs/core/injector/helpers/transient-instances';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { isObject } from '@altdot/shared';

export abstract class OnAppReady {
  abstract onAppReady(): unknown;
}

const hasOnAppReadyHook = (instance: unknown): instance is OnAppReady =>
  isObject(instance) &&
  'onAppReady' in instance &&
  typeof instance.onAppReady === 'function';

function callOperator(instances: InstanceWrapper[]) {
  return instances.map(async (instance) => {
    if (!hasOnAppReadyHook(instance)) return;

    await instance.onAppReady();
  });
}

export async function callOnAppReadyHook(module: Module) {
  const providers = module.getNonAliasProviders();

  // Module (class) instance is the first element of the providers array
  // Lifecycle hook has to be called once all classes are properly initialized
  const moduleClassHost = providers.shift()![1];
  const instances = [
    ...module.controllers,
    ...providers,
    ...module.injectables,
    ...module.middlewares,
  ];

  const nonTransientInstances = getNonTransientInstances(instances);
  await Promise.all(callOperator(nonTransientInstances));

  const transientInstances = getTransientInstances(instances);
  await Promise.all(callOperator(transientInstances));

  // Call the instance itself
  const moduleClassInstance = moduleClassHost.instance;
  if (
    moduleClassInstance &&
    hasOnAppReadyHook(moduleClassInstance) &&
    moduleClassHost.isDependencyTreeStatic()
  ) {
    await moduleClassInstance.onAppReady();
  }
}
