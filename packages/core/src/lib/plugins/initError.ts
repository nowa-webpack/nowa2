import { Runner } from '../runner';

export class InitErrorPlugin {
  public apply(runner: Runner) {
    runner.$register('init-error', async ({ error }) => {
      console.log('Error during initialization');
      console.error(error);
      process.exit(1);
    });
    runner.$register('init-module-queue', async ({ moduleQueue }) => {
      moduleQueue.$register('init-error', async ({ error }) => {
        console.log('Error during module initialization');
        console.error(error);
        process.exit(1);
      });
    });
  }
}
