#!/usr/bin/env node
'use strict';

import * as importLocal from 'import-local';
import * as semver from 'semver';

import run from '../index';

if (!importLocal(__filename)) {
  if (semver.lt(process.versions.node, '6.5.0')) {
    console.error(`Nowa@2 needs node@6.5+ but found ${process.versions.node}\nPlease upgrade your environment`);
    process.exit(1);
  }
  run().catch(console.error);
}
