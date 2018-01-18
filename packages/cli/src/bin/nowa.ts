#!/usr/bin/env node
'use strict';

import { resolve } from 'path';

import chalk from 'chalk';
import * as importLocal from 'import-local';
import * as isElevated from 'is-elevated';
import * as semver from 'semver';

import { run } from '../index';
import logo from '../lib/logo/small';

const { version: cliVersion } = require(resolve(__dirname, '../package.json')); // tslint:disable-line:no-var-requires
const { version: coreVersion } = require(`@nowa/core/package.json`); // tslint:disable-line:no-var-requires no-submodule-imports

const isWindows = process.platform === 'win32';

isElevated().then(e => {
  if (e) {
    console.log(
      chalk`{${isWindows ? 'yellow' : 'red'} Nowa is elevated ${isWindows ? '(administrator)' : '(root privilege)'}\nUse at your own risk}`,
    );
  }
  if (semver.lt(process.versions.node, '6.5.0')) {
    console.log(chalk`{red Nowa needs node @ {bold 6.5+} but found ${process.versions.node}\nPlease upgrade your environment}`);
    process.exitCode = 1;
  } else if (!importLocal(__filename)) {
    console.log(logo(coreVersion, cliVersion));
    run().catch((e: any) => {
      console.log(chalk`{red ${e.stack ? e.stack : e}}`);
    });
  }
});
