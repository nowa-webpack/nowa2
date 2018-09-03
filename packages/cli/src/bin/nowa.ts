#!/usr/bin/env node
'use strict';

import { resolve } from 'path';

import chalk from 'chalk';
import * as importLocal from 'import-local';
import * as isElevated from 'is-elevated';
import * as semver from 'semver';

import { run } from '../index';
import logo from '../lib/logo/small';
import { SolutionConfiguration } from '../lib/SolutionConfiguration';
const isDebug = !!process.env.NOWA_DEBUG;

if (isDebug || !importLocal(__filename)) {
  const { version: cliVersion } = require(resolve(__dirname, '../package.json')); // tslint:disable-line:no-var-requires
  const { version: coreVersion } = require(`@nowa/core/package.json`); // tslint:disable-line:no-var-requires no-submodule-imports
  const isWindows: boolean = process.platform === 'win32';
  const nodeVersion: string = process.versions.node;
  if (semver.lt(nodeVersion, '6.5.0')) {
    console.log(chalk`{red Nowa needs node @ {bold 6.5+} but found ${nodeVersion}\nPlease upgrade your environment}`);
    process.exit(1);
  }
  const solution = new SolutionConfiguration(resolve(process.cwd(), 'nowa.config.js'));
  console.log(`\n${logo(coreVersion, cliVersion, solution.toJS())}`);
  isElevated().then(e => {
    if (e) {
      console.log(
        chalk`{${isWindows ? 'yellow' : 'red'} Nowa is elevated ${
          isWindows ? '(administrator)' : '(root privilege)'
        }\nUse at your own risk}`,
      );
    }
    run().catch((e: any) => {
      console.log(chalk`{red ${e.stack ? e.stack : e}}`);
    });
  });
}
