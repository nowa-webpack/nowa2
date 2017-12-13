import { Runner } from '../runner';

export namespace LoadModulesPlugin {
  export interface IOptions {}
}

export class LoadModulesPlugin {
  constructor(public options: LoadModulesPlugin.IOptions = {}) {}
  public apply(runner: Runner) {
    runner.$register('load-modules', async ({ options, info, parsedSolution }) => {
      const { command, subCommand } = info;
      const commands = parsedSolution.commands;
      let modules: any[] = [];
      if (!commands[command]) {
        throw new Error(`cannot find nowa ${command} command`);
      }
      if (subCommand !== 'default') {
        if (!(commands[command] as any)[subCommand]) {
          throw new Error(`cannot find nowa ${command} ${subCommand} command`);
        }
        if (!Array.isArray((commands[command] as any)[subCommand])) {
          throw new Error(`command.${command}.${subCommand} is not a array, check your solution `);
        }
        modules = (commands[command] as any)[subCommand];
      } else {
        if (!(commands[command] as any)[subCommand]) {
          if (!Array.isArray(commands[command] as any)) {
            throw new Error(`command.${command} is not a array, check your solution `);
          }
          modules = commands[command] as any[];
        } else {
          modules = (commands[command] as any)[subCommand] as any[];
        }
      }
      modules = modules.map(module => {
        if (typeof module === 'string') {
          const moduleClass = require(module);
          return new moduleClass(module, options, info, {});
        } else if (Array.isArray(module)) {
          const moduleClass = require(module[0]);
          const moduleOptions = typeof module[1] === 'function' ? module[1]() : module[1];
          return new moduleClass(module[0], options, info, moduleOptions);
        } else {
          throw new Error(`wrong type for ${module}`);
        }
      });
      return modules;
    });
  }
}
