import { constants } from 'fs';
import { resolve } from 'path';

import { access } from 'fs-extra';

import { Runner } from '../runner';
import { handleESModuleDefault } from '../utils';

const configPaths = ['./nowa.config.js', './.nowa.config.js', './nowa.js', './.nowa.js', './nowa', './.nowa'];

export class LoadConfigPlugin {
  constructor(public options: LoadConfigPlugin.IOptions = {}) {}
  public apply(runner: Runner, { logger }: Runner.Utils) {
    runner.$register('load-config', async ({ context }) => {
      if (this.options.config) {
        logger.debug('use provided config instead of project config file');
        return this.options.config;
      }
      const allPaths = [...(this.options.filePaths || []), ...configPaths];
      for (const configPath of allPaths) {
        const filePath = resolve(context, configPath);
        try {
          await access(filePath, constants.R_OK);
          logger.debug(`access ${filePath} succeed`);
        } catch {
          logger.debug(`access ${filePath} failed`);
          continue;
        }
        logger.debug(`found config @ ${filePath}`);
        try {
          logger.debug(`resolving config from ${filePath}`);
          return handleESModuleDefault(require(filePath));
        } catch (e) {
          logger.error(e);
        }
      }
      logger.error('can not find any valid config');
      throw new Error('no config');
    });
  }
}

export namespace LoadConfigPlugin {
  export interface IOptions {
    filePaths?: string[];
    config?: object;
  }
}
