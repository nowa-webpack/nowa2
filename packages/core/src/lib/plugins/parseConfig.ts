import { Runner } from '../runner';

export namespace ParseConfigPlugin {
  export interface IOptions {}
}

export class ParseConfigPlugin {
  constructor(public options: ParseConfigPlugin.IOptions = {}) {}
  public apply(runner: Runner) {
    runner.$register('parse-config', async () => {
      const result: typeof runner.parsedConfig = {
        config: { solution: '' },
        nowa: {
          plugins: [],
        },
        ...runner.rawConfig,
      } as any; // TODO remove casting and actually parse
      return result;
    });
  }
}
