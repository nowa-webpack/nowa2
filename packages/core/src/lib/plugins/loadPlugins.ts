import { Runner } from '../runner';

export namespace LoadPluginsPlugin {
  export interface IOptions {}
}

export class LoadPluginsPlugin {
  constructor(public options: LoadPluginsPlugin.IOptions = {}) {}
  public apply(runner: Runner) {
    runner.$register('load-plugins', async ({ pluginPaths }) => {
      const plugins = pluginPaths.map(path => {
        return require(path as string); // TODO  solve _Plugin type
      });
      return plugins;
    });
  }
}
