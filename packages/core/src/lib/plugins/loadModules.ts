import { resolve } from 'path';

import { Module } from '../core/module';
import { Runner } from '../runner';
import { handleESModuleDefault } from '../utils';

const modulePrefixes = ['@nowa/module-', ''];

export class LoadModulesPlugin {
  constructor(public options: LoadModulesPlugin.IOptions = {}) {}

  public apply(runner: Runner, { logger }: Runner.Utils) {
    const prefixes = [...(this.options.modulePrefixes || []), ...modulePrefixes];
    runner.$register('load-modules', async ({ context, commands, options, solution, createUtils }) => {
      logger.debug('module name prefixes', prefixes);
      const moduleArray = solution.actions;
      logger.debug(`got ${moduleArray.length} module(s) to load`);
      const result: Module.InstanceType[] = [];
      for (let [index, module] of moduleArray.entries()) {
        logger.debug(`resolving module ${index}`);
        let instance: any;
        if (typeof module === 'function') {
          logger.debug(`got an funciton as module, calling it`);
          module = await module({ context, options });
        }
        if (module === undefined) {
          logger.debug(`got an undefined module, ignored`);
          continue;
        } else if (typeof module === 'string') {
          logger.debug(`got module definition ${module}`);
          const ClassConstructor = this._loadModule(module, context, prefixes, logger); // tslint:disable-line:variable-name
          if (this._checkIsNowaModule(ClassConstructor)) {
            logger.debug(`instantiating ${module}`);
            instance = new ClassConstructor({ context, commands, options, config: [] }, createUtils(ClassConstructor.name));
          } else {
            logger.debug(`${module} is not a nowa module`);
          }
        } else if (Array.isArray(module)) {
          logger.debug(`got module definition ${module[0]} with ${typeof module[1]} config`);
          const ClassConstructor = this._loadModule(module[0], context, prefixes, logger); // tslint:disable-line:variable-name
          let moduleConfig = module.slice(1);
          if (typeof moduleConfig[0] === 'function') {
            logger.debug(`module config is a function, calling`);
            moduleConfig = [].concat(moduleConfig[0]({ context, options }));
          }
          logger.debug(`got moduleConfig ${moduleConfig}`);
          if (this._checkIsNowaModule(ClassConstructor)) {
            logger.debug(`instantiating ${module[0]}`);
            instance = new ClassConstructor({ context, commands, options, config: moduleConfig }, createUtils(ClassConstructor.name));
          } else {
            logger.debug(`${module} is not a nowa module`);
          }
        } else {
          logger.warn(`un support module type ${typeof module} @ index, ignored`);
        }
        if (instance) {
          logger.debug(`instantiation success, loading`);
          !instance.$name && (instance.$name = 'unknown');
          result.push(instance as Module.InstanceType);
        } else {
          logger.debug(`ignore ${Array.isArray(module) ? module[0] : module} since its instance is falsy`);
        }
      }
      return result;
    });
  }

  private _loadModule(pathOrModuleName: string, context: string, prefixes: string[], logger: Runner.Utils['logger']): Module.IConstructor {
    const isModule = /^[@a-z]{1}/.test(pathOrModuleName);
    logger.debug(`${pathOrModuleName} ${isModule ? 'is' : `isn't`} a node module`);
    if (isModule) {
      for (const prefix of prefixes) {
        const modulePath = `${prefix}${pathOrModuleName}`;
        try {
          return handleESModuleDefault(require(modulePath));
        } catch (e) {
          logger.debug(e);
        }
      }
    } else {
      const modulePath = resolve(context, pathOrModuleName);
      return handleESModuleDefault(require(modulePath));
    }
    logger.error(`can not load nowa module ${pathOrModuleName}`);
    throw new Error('module load error');
  }
  private _checkIsNowaModule(module: Module.IConstructor): boolean {
    return !!(module.prototype.init && module.prototype.run);
  }
}

export namespace LoadModulesPlugin {
  export interface IOptions {
    modulePrefixes?: string[];
  }
}
