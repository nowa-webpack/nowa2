import { constants } from 'fs';
import { resolve } from 'path';

import * as debugLog from 'debug';
import { access } from 'fs-extra';

import { Runner } from '../runner';

const debug = debugLog('InitContextPlugin');

export class InitContextPlugin {
  constructor(public options: InitContextPlugin.IOptions = {}) {}
  public apply(runner: Runner) {
    runner.$register('init-context', async () => {
      const path = this.options.context || process.cwd();
      const packageJSONPath = resolve(path, './package.json');
      try {
        await access(packageJSONPath, constants.R_OK);
        debug(`access ${packageJSONPath} succeed`);
      } catch {
        debug(`access ${packageJSONPath} failed`);
        console.warn(`package.json can't be found in ${path}\n maybe you run nowa at the wrong place`);
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
