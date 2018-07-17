import { Runner } from '../runner';
import { parser } from '../utils';

export class ParseSolutionPlugin {
  public apply(runner: Runner, { logger }: Runner.Utils) {
    runner.$register('parse-solution', async ({ config, commands, solution }) => {
      if (commands.length === 0) {
        logger.debug('no command found');
        return { options: {}, actions: [] };
      }
      const configResult = parser('config.commands', commands, logger.debug, config.commands);
      if (configResult) {
        logger.debug('using config.commands');
        if (typeof configResult.result === 'function') {
          return (configResult.result as any)({ params: configResult.params }); // TODO: fix any
        }
        return configResult.result;
      }
      const solutionResult = parser('solution.commands', commands, logger.debug, solution.commands);
      if (solutionResult) {
        logger.debug('using solution.commands');
        if (typeof solutionResult.result === 'function') {
          return (solutionResult.result as any)({ params: solutionResult.params }); // TODO: fix any
        }
        return solutionResult.result;
      }
      logger.error(`neither of config / solution has described commands.${commands.join('.')}`);
      throw new Error('no correspond command');
    });
  }
}
