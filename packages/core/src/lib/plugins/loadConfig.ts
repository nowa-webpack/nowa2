import * as debugLog from 'debug';
import { resolve } from 'path';

import { Runner } from '../runner';

const debug = debugLog('LoadConfigPlugin');
export namespace LoadConfigPlugin {
  export interface IOptions {}
}

export class LoadConfigPlugin {
  constructor(public options: LoadConfigPlugin.IOptions = {}) {}
  public apply(runner: Runner) {
    runner.$register('load-config', async ({ info }) => {
      const configFilePath = resolve(info.context, 'nowa.config.js');
      debug(`loading config from ${configFilePath}`);
      let config: any;
      try {
        config = require(configFilePath);
      } catch (e) {
        debug(e);
        throw new Error(`Error happens when loading config from ${configFilePath}`);
      }
      return config;
    });
  }
}
