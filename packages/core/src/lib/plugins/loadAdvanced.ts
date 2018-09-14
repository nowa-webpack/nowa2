import { resolve } from 'path';
import { Runner } from '../runner';

export class LoadAdvancedPlugin {
  public apply(runner: Runner, { logger }: Runner.Utils) {
    runner.$register('load-advanced', async ({ context }) => {
      const packageJSON = require(resolve(context, './package.json'));
      const config = packageJSON.nowa;
      if (config && config.solution) {
        logger.debug(`got config from package.json`);
        try {
          const solution = require(config.solution);
          return { config, solution };
        } catch (e) {
          logger.error(e);
          return null;
        }
      }
      logger.debug(`got config failed, fallback to normal`);
      return null;
    });
  }
}
