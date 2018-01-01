import { Runner } from '../runner';

export class RunErrorPlugin {
  public apply(runner: Runner) {
    runner.$register('run-error', async ({ error }) => {
      console.log('Error during running');
      console.error(error);
      process.exit(1);
    });
    runner.$register('init-module-queue', async ({ moduleQueue }) => {
      moduleQueue.$register('run-error', async ({ error }) => {
        console.log('Error during module running');
        console.error(error);
        process.exit(1);
      });
    });
  }
}
