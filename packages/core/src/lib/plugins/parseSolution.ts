import { Runner } from '../runner';

export namespace ParseSolutionPlugin {
  export interface IOptions {}
}

export class ParseSolutionPlugin {
  constructor(public options: ParseSolutionPlugin.IOptions = {}) {}
  public apply(runner: Runner) {
    runner.$register('parse-solution', async () => {
      const result: typeof runner.parsedSolution = {
        commandDescriptors: {},
        commands: {},
        nowa: {
          plugins: [],
        },
        ...runner.rawSolution,
      } as any; // TODO remove casting and actually parse
      return result;
    });
  }
}
