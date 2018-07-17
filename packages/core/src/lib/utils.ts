import { constants } from 'fs';
import { access } from 'fs-extra';
import * as pathToRegexp from 'path-to-regexp';

import { IConfigConfigRegistry, IConfigConfigValues, ISolutionCommandDescription, ISolutionCommandRegistry } from './types';

export function parser(
  target: 'config.config',
  commands: string[],
  debug: (...args: any[]) => void,
  source: IConfigConfigRegistry | undefined,
): { params: { [paramName: string]: string }; result: IConfigConfigValues } | undefined;
export function parser(
  target: 'solution.commands' | 'config.commands',
  commands: string[],
  debug: (...args: any[]) => void,
  source: ISolutionCommandRegistry | undefined,
): { params: { [paramName: string]: string }; result: ISolutionCommandDescription } | undefined;
export function parser(
  target: 'solution.commands' | 'config.commands' | 'config.config',
  commands: string[],
  debug: (...args: any[]) => void,
  source: ISolutionCommandRegistry | IConfigConfigRegistry | undefined,
): { params: { [paramName: string]: string }; result: IConfigConfigValues | ISolutionCommandDescription | string } | undefined {
  // TODO: Stop this overload, remove parser
  if (!source) {
    debug(`${target} is falsy`);
    return undefined;
  }
  const commandPath = '/' + commands.join('/');
  const routes = Object.keys(source).map(path => {
    const keys: pathToRegexp.Key[] = [];
    const re = pathToRegexp(`/${path}`, keys);
    const test = (path: string): { [paramName: string]: string } | null => {
      const result = re.exec(path);
      if (!result || keys.length === 0) {
        return result ? {} : null;
      }
      const params: { [paramName: string]: string } = {};
      keys.forEach(({ name }, index) => {
        params[name] = result[index + 1];
      });
      return params;
    };
    return {
      result: source[path],
      test,
    };
  });
  for (const route of routes) {
    const { test, result } = route;
    const params = test(commandPath);
    if (params) {
      return { params, result };
    }
  }
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
