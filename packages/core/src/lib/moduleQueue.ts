import * as debugLog from 'debug';

import { Module } from './core/module';
import { Runnable } from './core/runnable';

const debug = debugLog('ModuleQueue');

export class ModuleQueue extends Runnable.Callback<ModuleQueue.IPluginGroup> {
  public runtime: ModuleQueue.IRuntime;
  constructor(public modules: Module.Type[]) {
    super();
    debug(`construct with ${modules.length} modules`);
    this.runtime = {
      loopModules: new Map(),
      validLoopID: 1,
    };
    for (const [index, module] of this.modules.entries()) {
      debug(`construct ${module.$type} module ${module.$name}`);
      if (module.$type === 'callback') {
        this.runtime.loopModules.set(module, index);
      }
    }
    debug(`got ${this.runtime.loopModules.size} callback modules`);
  }

  public async init() {
    debug('apply init-start');
    await this.$applyHook('init-start');
    for (const module of this.modules) {
      await this._initModule(module);
    }
    debug('apply init-end');
    await this.$applyHook('init-end');
  }

  public async run(done?: (error?: Error) => void) {
    this.runtime.done = done;
    debug('apply run-start');
    await this.$applyHook('run-start');
    const loopID = 1;
    for (const module of this.modules) {
      await this._runModule(module, loopID);
    }
    debug('apply run-end');
    await this.$applyHook('run-end');
    this.runtime.done && this.runtime.done();
  }
  private async _initModule(module: Module.Type) {
    try {
      await module.init();
    } catch (error) {
      this._handleInitError(error);
    }
  }

  private async _runModule(module: Module.Type, loopID: number) {
    if (!this._checkLoopIsValid(loopID)) {
      debug(`loop ${loopID} is outDated and skipped, currentValidLoop ${this.runtime.validLoopID}`);
      return;
    }
    debug(`call ${module.$name}#run`);
    if (module.$type === 'async') {
      try {
        await module.run();
      } catch (error) {
        if (await this._handleRunError(error)) {
          throw error;
        }
      }
    } else {
      await new Promise((resolve, reject) => {
        let isCalled = false;
        const done = async (error?: Error) => {
          this._handleRunError(error);
          if (!isCalled) {
            isCalled = true;
            (await this._handleRunError(error)) ? resolve() : reject(error);
          } else {
            this._runNewLoop(module, error);
          }
        };
        try {
          module.run(done);
        } catch (error) {
          done(error);
        }
      });
    }
  }

  private async _runNewLoop(module: Module.Callback, error?: Error) {
    if (error) {
      debug(`${module.$name} try to create a new loop but found error`, error);
      this._handleRunError(error);
      return;
    }
    const loopID = (this.runtime.validLoopID += 1);
    const currentModuleIndex = this.runtime.loopModules.get(module);
    if (currentModuleIndex === undefined) {
      this._handleRunError(new Error(`can not locale which module to start`));
      return;
    }
    debug(`continue on module`, this.modules[currentModuleIndex + 1]);
    for (const module of this.modules.slice(currentModuleIndex + 1)) {
      await this._runModule(module, loopID);
    }
    debug('apply run-end');
    await this.$applyHook('run-end');
    this.runtime.done && this.runtime.done();
  }

  private _checkLoopIsValid(loopID: number) {
    return this.runtime.validLoopID === loopID;
  }
  private _handleInitError(error: any) {
    debug('apply init-error because of', error);
    this.$applyHook('init-error', { error });
  }

  private _handleRunError(error: any) {
    debug('apply run-error because of', error);
    this.$applyHook('run-error', { error });
  }
}

export namespace ModuleQueue {
  export interface IRuntime {
    loopModules: Map<Module.Callback<any>, number>;
    validLoopID: number;
    done?: (error?: Error) => void;
  }

  export type IPluginGroup = {
    'init-start': [undefined, void];
    'init-end': [undefined, void];
    'run-start': [undefined, void];
    'run-end': [undefined, void];
    'init-error': [{ error: any }, void];
    'run-error': [{ error: any }, void];
  };
}
