import { Runner } from '../runner';
import { IConfig, IPlugin, ISolution } from '../types';

export class LoadPluginsPlugin {
  public apply(runner: Runner, { logger }: Runner.Utils) {
    // tslint:disable-next-line: no-object-literal-type-assertion
    runner.$register('load-plugins', async ({ config = {} as Partial<ISolution>, solution = {} as Partial<IConfig> }) => {
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
