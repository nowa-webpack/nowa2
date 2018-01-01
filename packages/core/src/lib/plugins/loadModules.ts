import { resolve } from 'path';

import * as debugLog from 'debug';

import { Module } from '../core/module';
import { Runner } from '../runner';
import { handleESModule } from '../utils';

const debug = debugLog('LoadModulesPlugin');

const modulePrefixes = ['@nowa/module-', ''];

export class LoadModulesPlugin {
  constructor(public options: LoadModulesPlugin.IOptions = {}) {}

  public apply(runner: Runner) {
    const prefixes = [...(this.options.modulePrefixes || []), ...modulePrefixes];
    runner.$register('load-modules', async ({ context, commands, options, solution }) => {
      const moduleArray = solution[1];
      const result: Module.InstanceType[] = [];
      for (const module of moduleArray) {
        let instance;
        if (typeof module === 'string') {
          const ClassConstructor = this._loadModule(module, context, prefixes);
          instance = new ClassConstructor({ context, commands, options, moduleOptions: {} });
        } else {
          const ClassConstructor = this._loadModule(module[0], context, prefixes);
          let moduleOptions = module[1];
          if (typeof moduleOptions === 'function') {
            moduleOptions = moduleOptions({ context, options });
          }
          instance = new ClassConstructor({ context, commands, options, moduleOptions });
        }
        result.push((instance as any) as Module.InstanceType);
      }
      return result;
    });
  }

  private _loadModule(pathOrModuleName: string, context: string, prefixes: string[]): Module.IConstructor {
    const isModule = /^[@a-z]{1}/.test(pathOrModuleName);
    debug(`got module path ${pathOrModuleName} and it ${isModule ? 'is' : `isn't`} a node module`);
    if (isModule) {
      for (const prefix of prefixes) {
        const modulePath = `${prefix}${pathOrModuleName}`;
        try {
          return handleESModule(require(modulePath));
        } catch (e) {
          debug(`Error when resolving module from ${modulePath}`);
          debug(e);
        }
      }
    } else {
      const modulePath = resolve(context, pathOrModuleName);
      return handleESModule(require(modulePath));
    }
    throw new Error(`Can not load module ${pathOrModuleName}`);
  }
}

export namespace LoadModulesPlugin {
  export interface IOptions {
    modulePrefixes?: string[];
  }
}
