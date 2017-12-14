import * as debugLog from 'debug';

import { Module } from './core/module';
import { Runnable } from './core/runnable';
import { Config } from './types/config';
import { Info } from './types/info';
import { Plugin } from './types/plugin';
import { Solution } from './types/solution';

import { ModuleQueue } from './moduleQueue';

const debug = debugLog('Runner');
export class Runner extends Runnable.Callback<Runner.PluginGroup> {
  public rawConfig: Config.User;
  public parsedConfig: Config.Parsed;
  public rawSolution: Solution.User;
  public parsedSolution: Solution.Parsed;
  public info: Info;
  public modules: Module.Type[];
  public moduleQueue: ModuleQueue;
  public options: object;

  // TODO reInit () 下一版之后支持
  public async init(): Promise<void> {
    try {
      debug('apply init-start');
      await this.$applyHook('init-start');
      // load info/config/solution
      debug('apply load-info');
      this.info = await this.$applyHookBail('load-info');
      debug('apply load-config');
      this.rawConfig = await this.$applyHookBail('load-config', this as Pick<Runner, 'info'>);
      debug('apply load-solution');
      this.rawSolution = await this.$applyHookBail('load-solution', this as Pick<Runner, 'info' | 'rawConfig'>);
      // parse config/solution
      debug('apply parse-config');
      this.parsedConfig = await this.$applyHookWaterfall('parse-config', this as Pick<Runner, 'info' | 'rawConfig'>);
      debug('apply parse-solution');
      this.parsedSolution = await this.$applyHookWaterfall('parse-solution', this as Pick<Runner, 'info' | 'rawSolution'>);
      // load plugins
      const pluginPaths = [...((this.parsedConfig.nowa && this.parsedConfig.nowa.plugins) || []), ...((this.parsedSolution.nowa && this.parsedSolution.nowa.plugins) || [])];
      debug('apply load-plugins');
      const plugins = await this.$applyHookBail('load-plugins', { ...(this as Pick<Runner, 'info'>), pluginPaths });
      debug(`load ${plugins.length} plugin(s) from config and solution`);
      for (const plugin of plugins) {
        await plugin.apply(this);
      }
      debug(`all custom plugins loaded`);
      debug('apply get-options');
      this.options = await this.$applyHookBail('get-options', this as Pick<Runner, 'info' | 'parsedSolution' | 'parsedConfig'>);
      debug('apply load-modules');
      this.modules = await this.$applyHookBail('load-modules', this as Pick<Runner, 'info' | 'options' | 'parsedSolution'>);
      debug(`load ${this.modules.length} module(s) for command nowa ${this.info.command} ${this.info.subCommand}`);
      debug('create & init moduleQueue');
      this.moduleQueue = new ModuleQueue(this.modules);
      debug('apply init-module-queue');
      this.$applyHook('init-module-queue', this as Pick<Runner, 'info' | 'options' | 'moduleQueue'>);
      await this.moduleQueue.init();
      debug('apply init-end');
      await this.$applyHook('init-end');
    } catch (e) {
      debug(`apply init-error because of ${e}`);
      this.$applyHook('init-error', { error: e });
    }
  }

  public async run(): Promise<void> {
    process.on('SIGINT', () => {
      debug('signal SIGINT received');
      debug('apply run-end');
      this.$applyHook('run-end').then(() => process.exit(1));
    });
    debug('apply run-start');
    await this.$applyHook('run-start');
    debug('run modules');
    this.moduleQueue.run(() => {
      debug('apply run-end');
      this.$applyHook('run-end');
    });
  }
}

export namespace Runner {
  export type PluginGroup = {
    'init-start': [undefined, void];
    'load-info': [undefined, Info];
    'load-config': [Pick<Runner, 'info'>, Runner['rawConfig']];
    'parse-config': [Pick<Runner, 'info' | 'rawConfig'>, Runner['parsedConfig']];
    'load-solution': [Pick<Runner, 'info' | 'rawConfig'>, Runner['rawSolution']];
    'parse-solution': [Pick<Runner, 'info' | 'rawSolution'>, Runner['parsedSolution']];
    'load-plugins': [{ info: Runner['info']; pluginPaths: Config._Nowa._Plugin[] }, Array<Plugin<Runner>>];
    'get-options': [Pick<Runner, 'info' | 'parsedSolution' | 'parsedConfig'>, Runner['options']];
    'load-modules': [Pick<Runner, 'info' | 'options' | 'parsedSolution'>, Runner['modules']];
    'init-module-queue': [Pick<Runner, 'info' | 'options' | 'moduleQueue'>, void];
    'init-end': [undefined, void];
    'run-start': [undefined, void];
    'run-end': [undefined, void];
    'init-error': [{ error: any }, void];
    'run-error': [{ error: any }, void];
  };
}
