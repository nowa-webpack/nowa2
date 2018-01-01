import { constants } from 'fs';
import { resolve } from 'path';

import * as debugLog from 'debug';
import { access } from 'fs-extra';

import { Runner } from '../runner';
import { handleESModule } from '../utils';

const debug = debugLog('LoadConfigPlugin');

const configPaths = ['./nowa.config.js', './.nowa.config.js', './nowa.js', './.nowa.js', './nowa', './.nowa'];

export class LoadConfigPlugin {
  constructor(public options: LoadConfigPlugin.IOptions = {}) {}
  public apply(runner: Runner) {
    runner.$register('load-config', async ({ context }) => {
      if (this.options.config) {
        debug('use provided config instead of config file');
        return this.options.config;
      }
      const allPaths = [...(this.options.filePaths || []), ...configPaths];
      for (const configPath of allPaths) {
        const filePath = resolve(context, configPath);
        try {
          await access(filePath, constants.R_OK);
          debug(`access ${filePath} succeed`);
        } catch {
          debug(`access ${filePath} failed`);
          continue;
        }
        debug(`found config ${filePath}`);
        try {
          return handleESModule(require(filePath));
        } catch (e) {
          debug(`Error when resolving config from ${filePath}`);
          debug(e);
        }
      }
      throw new Error('Can not load any config');
    });
  }
}

export namespace LoadConfigPlugin {
  export interface IOptions {
    filePaths?: string[];
    config?: object;
  }
}
