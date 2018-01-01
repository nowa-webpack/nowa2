import { Runner, utils } from '@nowa/core';
import * as yargs from 'yargs';

export class LoadOptionsPlugin {
  constructor(public options: LoadOptionsPlugin.IOptions) {}
  public apply(runner: Runner) {
    runner.$register('load-options', async ({ commands, config, solution, rawSolution }) => {
      const yargs = this.options.yargsInstance;
      const [optionDescriptions, , description] = solution;
      const [configDefaults] = config;
      const { help } = rawSolution;
      const desc = description || (help && help[commands[0]]);
      desc && yargs.usage(desc);
      Object.keys(optionDescriptions).forEach(name => {
        const description = optionDescriptions[name];
        switch (description.type) {
          case 'string':
          case 'number':
          case 'array':
          case 'boolean':
            yargs.option(
              name,
              utils.deleteUndefined({
                alias: description.alias,
                default: configDefaults[name] === undefined ? description.default : configDefaults[name],
                description: description.description,
                group: description.group,
                hidden: description.hidden,
                type: description.type,
              }),
            );
            break;
          case 'choice':
            yargs.option(
              name,
              utils.deleteUndefined({
                alias: description.alias,
                choices: description.choices,
                default: configDefaults[name] === undefined ? description.default : configDefaults[name],
                description: description.description,
                group: description.group,
                hidden: description.hidden,
              }),
            );
            break;
          default:
            console.warn(`unknown option type ${(description as any).type} for ${name}, ignored`);
        }
      });
      return yargs.argv;
    });
  }
}

export namespace LoadOptionsPlugin {
  export interface IOptions {
    yargsInstance: typeof yargs;
  }
}
