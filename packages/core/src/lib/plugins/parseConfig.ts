import * as debugLog from 'debug';

import { Runner } from '../runner';
import { parser } from '../utils';

const debug = debugLog('ParseConfigPlugin');

export class ParseConfigPlugin {
  public apply(runner: Runner) {
    runner.$register('parse-config', async ({ config, commands }) => {
      const parseResult = parser('config.config', commands, debug, config.config);
      return (parseResult && parseResult.result) || [{}];
    });
  }
}
