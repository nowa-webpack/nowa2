import * as debugLog from 'debug';

import { Runner } from '../runner';
import { IPlugin } from '../types';

const debug = debugLog('LoadPluginsPlugin');

export class LoadPluginsPlugin {
  public apply(runner: Runner) {
    runner.$register('load-plugins', async ({ config, solution }) => {
      const allPlugins = [...((solution.nowa && solution.nowa.plugins) || []), ...((config.nowa && config.nowa.plugins) || [])];
      return allPlugins.map(p => {
        if (typeof p === 'string') {
          debug(`instantiate ${p}`);
          return new (require(p))() as IPlugin<Runner>;
        }
        debug(`instantiate ${p[0]} with config ${p[1]}`);
        return new (require(p[0]))(p[1]) as IPlugin<Runner>;
      });
    });
  }
}
