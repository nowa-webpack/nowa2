import { Module } from './core/module';
import { Runnable } from './core/runnable';
import { Runner } from './runner';

export class ModuleQueue extends Runnable.Callback<ModuleQueue.IPluginGroup> {
  public runtime: ModuleQueue.IRuntime;
  constructor(public modules: Module.InstanceType[], public utils: Runner.Utils) {
    super();
    utils.logger.debug(`construct with ${modules.length} modules`);
    this.runtime = {
      loopModules: new Map(),
      validLoopID: 1,
    };
    for (const [index, module] of this.modules.entries()) {
      if (module.$type === 'callback') {
        utils.logger.debug(`register callback module ${module.$name}`);
        this.runtime.loopModules.set(module, index);
      }
    }
    utils.logger.debug(`got ${this.runtime.loopModules.size} callback modules`);
  }

  public async init() {
    const { logger } = this.utils;
    logger.debug('apply init-start');
    await this.$applyHook('init-start');
    for (const [index, module] of this.modules.entries()) {
      logger.debug(`init ${module.$name} @ ${index}`);
      await this._initModule(module);
    }
    logger.debug('apply init-end');
    await this.$applyHook('init-end');
  }

  public async run(done?: (error?: Error) => void) {
    const { logger } = this.utils;
    this.runtime.done = done;
    logger.debug('apply run-start');
    await this.$applyHook('run-start');
    const loopID = 1;
    for (const module of this.modules) {
      await this._runModule(module, loopID);
    }
    logger.debug('apply run-end');
    await this.$applyHook('run-end');
    this.runtime.done && this.runtime.done();
  }
  private async _initModule(module: Module.InstanceType) {
    try {
      await module.init();
    } catch (error) {
      this._handleInitError(error);
    }
  }

  private async _runModule(module: Module.InstanceType, loopID: number) {
    const { logger } = this.utils;
    logger.debug(`try to run ${module.$name}`);
    if (!this._checkLoopIsValid(loopID)) {
      logger.debug(`loop ${loopID} is outDated and skipped, current valid loop is ${this.runtime.validLoopID}`);
      return;
    }
    logger.debug(`call ${module.$name}#run`);
    if (module.$type === 'async') {
      try {
        await module.run();
      } catch (error) {
        if (await this._handleRunError(error)) {
          throw error;
        }
      }
    } else {
      await new Promise(resolve => {
        let isCalled = false;
        const done = async (error?: Error) => {
          error && (await this._handleRunError(error));
          if (!isCalled) {
            isCalled = true;
            resolve();
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
    const { logger } = this.utils;
    logger.debug(`${module.$name} try to create a new loop`);
    if (error) {
      logger.debug(`found error`, error);
      await this._handleRunError(error);
      return;
    }
    const loopID = (this.runtime.validLoopID += 1);
    const currentModuleIndex = this.runtime.loopModules.get(module);
    if (currentModuleIndex === undefined) {
      await this._handleRunError(new Error(`can not locale which module to start`));
      return;
    }
    this.modules[currentModuleIndex + 1] && logger.debug(`continue on module`, this.modules[currentModuleIndex + 1].$name);
    for (const module of this.modules.slice(currentModuleIndex + 1)) {
      await this._runModule(module, loopID);
    }
    logger.debug('apply run-end');
    await this.$applyHook('run-end');
    this.runtime.done && this.runtime.done();
  }

  private _checkLoopIsValid(loopID: number) {
    return this.runtime.validLoopID === loopID;
  }
  private async _handleInitError(error: any) {
    const { logger } = this.utils;
    logger.debug('apply init-error');
    this.$applyHook('init-error', { error });
  }

  private async _handleRunError(error: any) {
    const { logger } = this.utils;
    logger.debug('apply run-error');
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
