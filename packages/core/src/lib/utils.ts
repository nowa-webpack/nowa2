import { constants } from 'fs';

import { access } from 'fs-extra';

import { IConfigConfigRegistry, IConfigConfigValues, ISolutionCommandDescription, ISolutionCommandRegistry } from './types';

export function parser(
  target: 'config.config',
  commands: string[],
  debug: (...args: any[]) => void,
  source: IConfigConfigRegistry | undefined,
): { actualCommands: string[]; result: IConfigConfigValues } | undefined;
export function parser(
  target: 'solution.commands' | 'config.commands',
  commands: string[],
  debug: (...args: any[]) => void,
  source: ISolutionCommandRegistry | undefined,
): { actualCommands: string[]; result: ISolutionCommandDescription } | undefined;
export function parser(
  target: 'solution.commands' | 'config.commands' | 'config.config',
  commands: string[],
  debug: (...args: any[]) => void,
  source: ISolutionCommandRegistry | IConfigConfigRegistry | undefined,
): { actualCommands: string[]; result: IConfigConfigValues | ISolutionCommandDescription } | undefined;
export function parser(
  target: string,
  commands: string[],
  debug: (...args: any[]) => void,
  source: any,
): { actualCommands: string[]; result: any } | undefined;
export function parser(
  target: string,
  commands: string[],
  debug: (...args: any[]) => void,
  source: any,
): { actualCommands: string[]; result: any } | undefined {
  if (!source) {
    debug(`${target} is falsy`);
    return undefined;
  }
  let cursor = source;
  let index = 0;
  do {
    // commands ['{command1}', '{command2}']
    const currentCommandPart = commands[index] || 'default';
    const currentCommand = commands.slice(0, index + 1);
    const currentPath = currentCommand.join('.');
    let next = cursor[currentCommandPart];
    if (typeof next === 'string') {
      next = cursor[next];
    }
    if (Array.isArray(next)) {
      debug(`find ${target} @ ${target}.${currentPath}`);
      return { result: next as IConfigConfigValues | ISolutionCommandDescription, actualCommands: currentCommand };
    } else if (next !== undefined) {
      cursor = next;
      index += 1;
      debug(`continue on ${target}.${currentPath}`);
    } else {
      if (cursor.default) {
        debug(`find and try to fallback to ${target}.${commands.slice(0, index).join('.')}.default`);
        if (Array.isArray(cursor.default)) {
          return { result: cursor.default as IConfigConfigValues | ISolutionCommandDescription, actualCommands: currentCommand };
        } else {
          debug(`default config should be an array`);
          return undefined;
        }
      }
      break;
    }
  } while (cursor);
  debug(`can not retrieve from ${target}.${commands.join('.')}`);
  return undefined;
}

export const handleESModuleDefault = <T extends any>(moduleExport: T): T => {
  if (moduleExport.__esModule) {
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

export const requireFile = async (filePath: string) => {
  try {
    await access(filePath, constants.R_OK);
  } catch {
    return undefined;
  }
  return handleESModuleDefault(require(filePath));
};

// tslint:disable-next-line:variable-name
export const captureStack = (message: string, Constructor: ErrorConstructor = Error) => {
  const error = new Constructor(message);
  return error.stack;
};
