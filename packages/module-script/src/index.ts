import { Module } from '@nowa/core';
import { shell } from 'execa';

export default class ModuleScript extends Module.Async<ModuleScript.Config> {
  public $name = 'script';
  public scripts?: ModuleScript.SingleScript[];
  public options?: ModuleScript.IOptions;
  public alreadyRun: boolean = false;

  public async init() {
    const { logger } = this.$utils;
    const [scripts, options] = this.$runtime.config;
    this.options = options || {};
    this.scripts = ([] as ModuleScript.SingleScript[]).concat(scripts).map(this.validateScript);
    logger.info(`got ${this.scripts.length} scripts`);
    logger.debug(this.scripts);
  }

  public async run() {
    const { logger } = this.$utils;
    if (this.alreadyRun && this.options && this.options.noRetrigger) {
      logger.debug('skip run scripts since noRetrigger has been set');
    } else {
      logger.debug('start to run scripts');
      if (this.options && this.options.noWait) {
        logger.debug('noWait mode');
        this._run().then(
          () => logger.debug('finish all scripts'),
          e => {
            logger.error(e);
            process.exit(1);
          },
        );
      } else {
        logger.debug('normal mode');
        await this._run();
      }
      logger.debug('finish all scripts');
      this.alreadyRun = true;
    }
  }

  private async _run() {
    const { logger } = this.$utils;
    if (this.options && this.options.parallel) {
      logger.debug('parallel mode');
      await Promise.all(this.scripts!.map(this._runScript, this));
    } else {
      logger.debug('sequential mode');
      for (const script of this.scripts!) {
        await this._runScript(script);
      }
    }
  }

  private async _runScript(script: string | (() => void | Promise<void>)) {
    const { logger } = this.$utils;
    if (typeof script === 'string') {
      logger.info('run shell', script);
      await shell(script, { stdio: 'inherit', cwd: this.$runtime.context, maxBuffer: 100000000 });
    } else if (typeof script === 'function') {
      logger.info('run js', script.name || 'anonymous');
      await script();
    }
  }

  private validateScript(script: any) {
    if (typeof script === 'string' || typeof script === 'function') {
      return script;
    }
    const { logger } = this.$utils;
    logger.error(`script should be string / function but received ${typeof script}`);
    throw new Error('invalid typeof script');
  }
}

export namespace ModuleScript {
  export type SingleScript = string | (() => void | Promise<void>);
  export interface IOptions {
    parallel?: boolean;
    noWait?: boolean;
    noRetrigger?: boolean;
  }
  export type Config = [SingleScript | SingleScript[], IOptions | undefined];
}
