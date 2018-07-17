import { Runner, utils } from '@nowa/core';
import * as inquirer from 'inquirer';
import * as Yargs from 'yargs';

export class LoadOptionsPlugin {
  constructor(public options: LoadOptionsPlugin.IOptions) {}
  public apply(runner: Runner, pluginUtils: Runner.Utils) {
    const { logger } = pluginUtils;
    runner.$register('load-options', async ({ config, solution }) => {
      const yargs = this.options.yargs;
      const inquirer = this.options.inquirer;
      yargs
        .version(false)
        .help('help')
        .alias('h', 'help');
      const { options: optionDescriptions, description } = solution; // ignore moduleDescriptions
      const configDefaults = config;
      if (description) {
        yargs.usage(description);
      }
      const questions: { [order: number]: inquirer.Question[] } = {};
      Object.keys(optionDescriptions).forEach(name => {
        const desc = optionDescriptions[name];
        const yargOption: any = {
          alias: desc.alias,
          default: configDefaults[name] === undefined ? desc.default : configDefaults[name],
          description: desc.description,
          group: desc.group,
          hidden: desc.hidden,
        };
        switch (desc.type) {
          case 'string':
          case 'number':
          case 'array':
          case 'boolean':
            yargOption.type = desc.type;
            yargs.option(name, utils.deleteUndefined(yargOption));
            break;
          case 'choice':
            yargOption.choices = desc.choices;
            yargs.option(name, utils.deleteUndefined(yargOption));
            break;
          case 'prompt':
            const order = desc.order || 0;
            if (!questions[order]) {
              questions[order] = [];
            }
            const question: any = {
              default: configDefaults[name] === undefined ? desc.default : configDefaults[name],
              filter: desc.filter,
              message: desc.description,
              name,
              type: desc.prompt,
              validate: desc.validate,
            };
            switch (desc.prompt) {
              case 'list':
              case 'checkbox':
                question.choice = desc.choices;
              case 'input':
              case 'password':
              case 'confirm':
                questions[order].push(utils.deleteUndefined(question));
                break;
              default:
                logger.warn(`unknown prumpt option type ${(desc as any).prompt} for ${name}, ignored`);
            }
            break;
          default:
            logger.warn(`unknown option type ${(desc as any).type} for ${name}, ignored`);
        }
      });
      if (Object.keys(questions).length > 0) {
        const orderedQuestions: inquirer.Question[] = [];
        Object.keys(questions)
          .map(i => Number(i))
          .sort((a, b) => a - b)
          .forEach(order => {
            orderedQuestions.push(...questions[order]);
          });
        const prompt = inquirer.createPromptModule();
        const result = await prompt(orderedQuestions);
        return { ...yargs.argv, ...result };
      }
      return { ...yargs.argv };
    });
  }
}

export namespace LoadOptionsPlugin {
  export interface IOptions {
    yargs: typeof Yargs;
    inquirer: typeof inquirer;
  }
}
