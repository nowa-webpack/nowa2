import { Runner } from '../runner';
import { IPlugin } from '../types';

export class LoadPluginsPlugin {
  public apply(runner: Runner, { logger }: Runner.Utils) {
    runner.$register('load-plugins', async ({ config, solution }) => {
      const allPlugins = [...((solution.nowa && solution.nowa.plugins) || []), ...((config.nowa && config.nowa.plugins) || [])];
      logger.debug(`got ${allPlugins.length} plugin(s) to load`);
      return allPlugins.map(p => {
        if (typeof p === 'string') {
          logger.debug(`instantiate ${p}`);
          return new (require(p))() as IPlugin<Runner>;
        }
        logger.debug(`instantiate ${p[0]} with config ${p[1]}`);
        return new (require(p[0]))(p[1]) as IPlugin<Runner>;
      });
    });
  }
}
