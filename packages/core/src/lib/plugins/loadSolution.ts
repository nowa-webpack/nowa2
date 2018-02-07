import { resolve } from 'path';

import { Runner } from '../runner';
import { handleESModuleDefault } from '../utils';

export class LoadSolutionPlugin {
  constructor(public options: LoadSolutionPlugin.IOptions = {}) {}
  public apply(runner: Runner, { logger }: Runner.Utils) {
    runner.$register('load-solution', async ({ context, config }) => {
      if (this.options.solution) {
        logger.debug('use provided solution instead of project solution file/object');
        return this.options.solution;
      }
      let solution = config.solution;
      if (!solution) {
        logger.debug('config.solution is falsy');
        if (this.options.fallbackSolution) {
          solution = this.options.fallbackSolution;
          logger.debug(`fallback to fallbackSolution ${solution}`);
        } else {
          logger.error('solution in your config is falsy, required path / object');
          throw new Error('config.solution falsy');
        }
      }
      if (typeof solution === 'object') {
        logger.debug('config.solution is object, returning');
        return solution;
      }
      logger.debug(`config.solution is string: ${solution}`);
      const isModule = /^[@a-z]{1}/.test(solution);
      logger.debug(`it ${isModule ? 'is' : `isn't`} a node module`);
      const solutionPath = isModule ? solution : resolve(context, solution);
      logger.info(`using solution @ ${solutionPath}`);
      try {
        return handleESModuleDefault(require(solutionPath));
      } catch (e) {
        logger.error(e);
        throw new Error(`resolve solution failed`);
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
