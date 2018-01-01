import { createDefaultRunner } from '@nowa/core';
import * as yargs from 'yargs';

import { LoadCommandsPlugin } from './lib/loadCommands';
import { LoadOptionsPlugin } from './lib/loadOptions';

const yargsInstance = yargs;
export default async () => {
  const runner = await createDefaultRunner([new LoadCommandsPlugin(), new LoadOptionsPlugin({ yargsInstance })]);
  await runner.init();
  await runner.run();
};
