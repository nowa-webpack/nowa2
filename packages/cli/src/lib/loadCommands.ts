import { Runner } from '@nowa/core';
import * as parser from 'yargs-parser';

export class LoadCommandsPlugin {
  public apply(runner: Runner, utils: Runner.Utils) {
    const { logger, chalk } = utils;
    runner.$register('load-commands', async ({ solution }) => {
      logger.debug(`got argv ${process.argv.join(' ')}`);
      const commands: string[] = [];
      for (const arg of process.argv.slice(2)) {
        if (arg.startsWith('-')) {
          break; // only the strings before first option are considered as commands
        }
        commands.push(arg);
      }
      logger.debug(`got actual argv ${commands.join(' ')}`);
      const { _ } = parser(commands);
      logger.debug(`got actual commands ${_.join(' ')}`);
      if (_.length === 0) {
        const helpInfo = solution.help;
        if (helpInfo) {
          logger.log(`Available nowa commands:\n`);
          Object.keys(helpInfo).forEach(name => {
            logger.log(chalk`{blue.bold ${name}}\t${helpInfo[name]}`);
          });
        }
      }
      return _;
    });
  }
}
