import { resolve } from 'path';

import * as debugLog from 'debug';

import { Runner } from '../runner';
import { handleESModule } from '../utils';

const debug = debugLog('LoadSolutionPlugin');

export class LoadSolutionPlugin {
  constructor(public options: LoadSolutionPlugin.IOptions = {}) {}
  public apply(runner: Runner) {
    runner.$register('load-solution', async ({ context, config }) => {
      if (this.options.solution) {
        debug('use provided solution instead of solution file/object');
        return this.options.solution;
      }
      let solution = config.solution;
      if (!solution) {
        if (this.options.fallbackSolution) {
          solution = this.options.fallbackSolution;
          debug(`fallback to ${solution}`);
        } else {
          throw new Error('solution in your config is falsy, required path or object');
        }
      }
      if (typeof solution === 'object') {
        debug('return object solution');
        return solution;
      }
      const isModule = /^[@a-z]{1}/.test(solution);
      debug(`got solution path ${solution} and it ${isModule ? 'is' : `isn't`} a node module`);
      const solutionPath = isModule ? solution : resolve(context, solution);
      try {
        return handleESModule(require(solutionPath));
      } catch (e) {
        console.error(e);
        throw new Error(`Error when resolving solution from ${solutionPath}`);
      }
    });
  }
}

export namespace LoadSolutionPlugin {
  export interface IOptions {
    solution?: object;
    fallbackSolution?: string | object;
  }
}
