import { Module } from './lib/core/module';
import { Runner } from './lib/runner';
import { Plugin } from './lib/types/plugin';

import { LoadConfigPlugin } from './lib/plugins/loadConfig';
import { LoadModulesPlugin } from './lib/plugins/loadModules';
import { LoadPluginsPlugin } from './lib/plugins/loadPlugins';
import { LoadSolutionPlugin } from './lib/plugins/loadSolution';
import { ParseConfigPlugin } from './lib/plugins/parseConfig';
import { ParseSolutionPlugin } from './lib/plugins/parseSolution';

export const createRunner = async (plugins: Array<Plugin<Runner>>) => {
  const runner = new Runner();
  for (const plugin of plugins) {
    await plugin.apply(runner);
  }
  return runner;
};

export const createDefaultRunner = async (plugins: Array<Plugin<Runner>>) => {
  const allPlugins = [new LoadConfigPlugin(), new LoadModulesPlugin(), new LoadPluginsPlugin(), new LoadSolutionPlugin(), new ParseConfigPlugin(), new ParseSolutionPlugin(), ...plugins];
  return createRunner(allPlugins);
};

export { Runner, Module };
