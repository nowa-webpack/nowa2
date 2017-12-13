import { Runner } from '../runner';

export namespace LoadSolutionPlugin {
  export interface IOptions {}
}

export class LoadSolutionPlugin {
  constructor(public options: LoadSolutionPlugin.IOptions = {}) {}
  public apply(runner: Runner) {
    runner.$register('load-solution', async ({ rawConfig }) => {
      const { solution } = rawConfig;
      if (!solution) {
        throw new Error(`solution in your config is falsy, required path or object`);
      }
      if (typeof solution !== 'string') {
        return solution;
      }
      return require(solution);
    });
  }
}
