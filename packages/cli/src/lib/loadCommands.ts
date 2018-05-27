import { Runner, Types } from '@nowa/core';
import * as archy from 'archy';
import * as cliUI from 'cliui';

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
          logger.debug(`got help information`, helpInfo);
          logger.log(`Available NOWA Commands:`);
          const ui = cliUI({ width: 80 });
          const archyString = archy(convertHelpToArchy(helpInfo));
          archyString.split('\n').forEach(line => {
            const [left, right] = line.split('_NOWA_');
            ui.div(
              `${left}`,
              right && {
                align: 'right',
                text: chalk`{blueBright ${right}}`,
              },
            );
          });
          logger.log(ui.toString());
        }
      }
      return _;
    });
  }
}

function convertSubHelp(key: string, help: string | Types.ISolutionHelpRegistry | undefined): archy.Data | string {
  if (!help || typeof help === 'string') {
    return `${key}${(help && `_NOWA_${help}`) || ''}`;
  }
  return {
    label: `${key}${(help._default && `_NOWA_${help._default}`) || ''}`,
    nodes: Object.keys(help)
      .filter(key => !key.startsWith('_'))
      .map(key => {
        return convertSubHelp(key, help[key]);
      }),
  };
}
function convertHelpToArchy(help: Types.ISolution['help'] = {}): archy.Data {
  return {
    label: '',
    nodes: Object.keys(help).map(key => {
      return convertSubHelp(key, help[key]);
    }),
  };
}
