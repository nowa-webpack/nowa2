import { Module } from '@nowa/core';
import { shell } from 'execa';

export default class ModuleScript extends Module.Async<ModuleScript.Options> {
  public $name = 'script';
  public scripts: ModuleScript.IShellContent[] = [];
  public options?: ModuleScript.IOptions;
  public alreadyRun: boolean = false;

  public async init() {
    const { logger } = this.$utils;
    const moduleOptions = this.$runtime.moduleOptions;
    if (Array.isArray(moduleOptions)) {
      logger.debug('arrayof string/function config received');
      this.scripts.push(...moduleOptions.map(this.validateScript));
    } else if (typeof moduleOptions === 'object') {
      logger.debug('{ scripts: [] } config received');
      this.options = moduleOptions.options;
      this.scripts.push(...moduleOptions.scripts.map(this.validateScript));
    } else {
      logger.debug('simple string/function config received');
      this.scripts.push(this.validateScript(moduleOptions));
    }
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
      await Promise.all(this.scripts.map(this._runScript));
    } else {
      logger.debug('sequential mode');
      for (const script of this.scripts) {
        await this._runScript(script);
      }
    }
  }

  private async _runScript(script: string | (() => void | Promise<void>)) {
    const { logger } = this.$utils;
    if (typeof script === 'string') {
      logger.info('shell ', script);
      await shell(script, { stdio: 'inherit', cwd: this.$runtime.context, maxBuffer: 100000000 });
    } else if (typeof script === 'function') {
      logger.info('js ', script.name || 'anonymous');
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
  export type IShellContent = string | (() => void | Promise<void>);
  export interface IOptions {
    parallel?: boolean;
    noWait?: boolean;
    noRetrigger?: boolean;
  }
  export type Options = IShellContent | IShellContent[] | { scripts: IShellContent[]; options?: IOptions };
}
