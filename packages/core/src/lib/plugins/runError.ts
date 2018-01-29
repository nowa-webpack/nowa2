import { Runner } from '../runner';

export class RunErrorPlugin {
  public apply(runner: Runner, { logger }: Runner.Utils) {
    runner.$register('run-error', ({ error }) => {
      logger.error('during running');
      logger.error(error);
      process.exit(1);
    });
    runner.$register('init-module-queue', ({ moduleQueue }) => {
      moduleQueue.$register('run-error', ({ error }) => {
        logger.error('during module running');
        logger.error(error);
        process.exit(1);
      });
    });
  }
}
