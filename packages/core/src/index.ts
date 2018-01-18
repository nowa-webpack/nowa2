import { Module } from './lib/core/module';
import { Runner } from './lib/runner';
import { IPlugin } from './lib/types';
import * as utils from './lib/utils';

import { InitErrorPlugin } from './lib/plugins/initError';
import { LoadConfigPlugin } from './lib/plugins/loadConfig';
import { LoadModulesPlugin } from './lib/plugins/loadModules';
import { LoadPluginsPlugin } from './lib/plugins/loadPlugins';
import { LoadSolutionPlugin } from './lib/plugins/loadSolution';
import { ParseConfigPlugin } from './lib/plugins/parseConfig';
import { ParseSolutionPlugin } from './lib/plugins/parseSolution';
import { RunErrorPlugin } from './lib/plugins/runError';

export const createRunner = async (createUtils: Runner.UtilsCreator, plugins: Array<IPlugin<Runner>>) => {
  const runner = new Runner(createUtils);
  for (const plugin of plugins) {
    await plugin.apply(runner, createUtils(plugin.name));
  }
  return runner;
};

export const createDefaultRunner = async (createUtils: Runner.UtilsCreator, plugins: Array<IPlugin<Runner>>) => {
  const allPlugins = [
    new InitErrorPlugin(),
    new LoadConfigPlugin(),
    new LoadModulesPlugin(),
    new LoadPluginsPlugin(),
    new LoadSolutionPlugin(),
    new ParseConfigPlugin(),
    new ParseSolutionPlugin(),
    new RunErrorPlugin(),
    ...plugins,
  ];
  return createRunner(createUtils, allPlugins);
};

export { Runner, Module, utils };
