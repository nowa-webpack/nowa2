import { Runner } from '@nowa/core';
import * as debugLog from 'debug';
import * as parser from 'yargs-parser';

const debug = debugLog('LoadCommandsPlugin');

export class LoadCommandsPlugin {
  public apply(runner: Runner) {
    runner.$register('load-commands', async ({ solution }) => {
      debug(`got argv ${process.argv.join(' ')}`);
      const commands: string[] = [];
      for (const arg of process.argv.slice(2)) {
        if (arg.startsWith('-')) {
          break; // only the strings before first option are considered as commands
        }
        commands.push(arg);
      }
      debug(`got actual argv ${commands.join(' ')}`);
      const { _ } = parser(commands);
      debug(`got actual commands ${_.join(' ')}`);
      if (_.length === 0) {
        const helpInfo = solution.help;
        if (helpInfo) {
          console.log('Available nowa commands:\n');
          Object.keys(helpInfo).forEach(name => {
            console.log(`${name}\t${helpInfo[name]}`);
          });
        }
      }
      return _;
    });
  }
}
