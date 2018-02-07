import { Runner } from '../runner';

export class InitErrorPlugin {
  public apply(runner: Runner, { logger }: Runner.Utils) {
    runner.$register('init-error', ({ error }) => {
      logger.error('during initialization');
      logger.error(error);
      process.exit(1);
    });
    runner.$register('init-module-queue', ({ moduleQueue }) => {
      moduleQueue.$register('init-error', ({ error }) => {
        logger.error('during module initialization');
        logger.error(error);
        process.exit(1);
      });
    });
  }
}
