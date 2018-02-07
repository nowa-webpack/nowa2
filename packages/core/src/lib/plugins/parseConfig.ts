import { Runner } from '../runner';
import { parser } from '../utils';

export class ParseConfigPlugin {
  public apply(runner: Runner, { logger }: Runner.Utils) {
    runner.$register('parse-config', async ({ config, commands }) => {
      const parseResult = parser('config.config', commands, logger.debug, config.config);
      logger.debug('parseResult', parseResult && parseResult.result);
      return (parseResult && parseResult.result) || [{}];
    });
  }
}
