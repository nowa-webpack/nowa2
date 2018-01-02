import { constants } from 'fs';

import { access } from 'fs-extra';

import { IConfigConfigRegistry, IConfigConfigValues, ISolutionCommandDescription, ISolutionCommandRegistry } from './types';

export function parser(
  target: 'config.config',
  commands: string[],
  debug: (...args: any[]) => void,
  source?: IConfigConfigRegistry,
): { actualCommands: string[]; result: IConfigConfigValues } | undefined;
export function parser(
  target: 'solution.commands' | 'config.commands',
  commands: string[],
  debug: (...args: any[]) => void,
  source?: ISolutionCommandRegistry,
): { actualCommands: string[]; result: ISolutionCommandDescription } | undefined;
export function parser(
  target: 'solution.commands' | 'config.commands' | 'config.config',
  commands: string[],
  debug: (...args: any[]) => void,
  source?: ISolutionCommandRegistry | IConfigConfigRegistry,
): { actualCommands: string[]; result: IConfigConfigValues | ISolutionCommandDescription } | undefined {
  if (!source) {
    debug(`${target} is falsy`);
    return undefined;
  }
  let cursor = source;
  for (const [index, currentCommandPart] of commands.entries()) {
    // commands ['{command1}', '{command2}']
    const currentCommand = commands.slice(0, index + 1);
    const currentPath = currentCommand.join('.');
    const next = cursor[currentCommandPart];
    if (Array.isArray(next)) {
      debug(`find ${target} @ ${target}.${currentPath}`);
      return { result: next as IConfigConfigValues | ISolutionCommandDescription, actualCommands: currentCommand };
    }
    if (next === undefined) {
      debug(`can not retrieve from ${target}.${currentPath}`);
      if (cursor.default) {
        debug(`find and try to fallback to ${target}.${commands.slice(0, index).join('.')}.default`);
        if (Array.isArray(cursor.default)) {
          return { result: cursor.default as IConfigConfigValues | ISolutionCommandDescription, actualCommands: currentCommand };
        } else {
          debug(`default config should be an array`);
          return undefined;
        }
      }
    } else {
      cursor = next;
    }
  }
  debug(`can not retrieve from ${target}.${commands.join('.')}`);
  return undefined;
}

export const handleESModule = <T extends any>(moduleExport: T) => {
  if (moduleExport.default) {
    return (moduleExport.default as any) as T;
  } else {
    return moduleExport;
  }
};

export const deleteUndefined = <T extends object>(obj: T, recursive = false): T => {
  Object.keys(obj).forEach(key => {
    const value = (obj as any)[key];
    if (value === undefined) {
      delete (obj as any)[key];
    }
    if (recursive) {
      if (value && typeof value === 'object') {
        deleteUndefined(value, true);
      }
    }
  });
  return obj;
};

export const requireFile = async (filePath: string, isJSON: boolean = false) => {
  await access(filePath, constants.R_OK);
  if (isJSON || filePath.endsWith('.json')) {
    return handleESModule(require(filePath));
  }
  return require(filePath);
};
