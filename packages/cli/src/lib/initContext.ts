import { constants } from 'fs';
import { resolve } from 'path';

import { Runner } from '@nowa/core';
import { access } from 'fs-extra';

export class InitContextPlugin {
  constructor(public options: InitContextPlugin.IOptions = {}) {}
  public apply(runner: Runner, utils: Runner.Utils) {
    const { logger } = utils;
    runner.$register('init-context', async () => {
      const path = this.options.context || process.cwd();
      logger.debug(`locate context @ ${path}`);
      const packageJSONPath = resolve(path, './package.json');
      try {
        await access(packageJSONPath, constants.R_OK);
        logger.debug(`locate package.json @ ${packageJSONPath}`);
        logger.debug(`access package.json succeed`);
        try {
          require(packageJSONPath);
          logger.debug(`reqire package.json succeed`);
        } catch (e) {
          logger.debug(`reqire package.json failed`);
          logger.error(e);
          process.exit(1);
        }
      } catch {
        logger.debug(`access package.json failed`);
        logger.warn(`package.json can't be found right here`);
        logger.warn(`@ ${path}`);
        logger.warn(`maybe you run nowa at the wrong place`);
      }
      return path;
    });
  }
}

export namespace InitContextPlugin {
  export interface IOptions {
    context?: string;
  }
}
