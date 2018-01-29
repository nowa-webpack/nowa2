import { Runner } from '../runner';
import { parser } from '../utils';

export class ParseSolutionPlugin {
  public apply(runner: Runner, { logger }: Runner.Utils) {
    runner.$register('parse-solution', async ({ config, commands, solution }) => {
      if (commands.length === 0) {
        logger.debug('no command found');
        return { actualCommands: [], result: [{}, [], undefined] as [{}, any[], undefined] };
      }
      const configResult = parser('config.commands', commands, logger.debug, config.commands);
      if (configResult) {
        logger.debug('using config.commands');
        return configResult;
      }
      const solutionResult = parser('solution.commands', commands, logger.debug, solution.commands);
      if (solutionResult) {
        logger.debug('using solution.commands');
        return solutionResult;
      }
      logger.error(`neither of config / solution has described commands.${commands.join('.')}`);
      throw new Error('no correspond command');
    });
  }
}
