import * as debugLog from 'debug';

import { Runner } from '../runner';
import { parser } from '../utils';

const debug = debugLog('ParseSolutionPlugin');

export class ParseSolutionPlugin {
  public apply(runner: Runner) {
    runner.$register('parse-solution', async ({ config, commands, solution }) => {
      if (commands.length === 0) {
        return { actualCommands: [], result: [{}, [], undefined] as [{}, any[], undefined] };
      }
      const configResult = parser('config.commands', commands, debug, config.commands);
      if (configResult) {
        debug('using config.commands');
        return configResult;
      }
      const solutionResult = parser('solution.commands', commands, debug, solution.commands);
      if (solutionResult) {
        debug('using solution.commands');
        return solutionResult;
      }
      throw new Error(`neither of config / solution has described commands.${commands.join('.')}`);
    });
  }
}
