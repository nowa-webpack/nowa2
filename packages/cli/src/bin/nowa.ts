#!/usr/bin/env node
'use strict';

import * as importLocal from 'import-local';

import run from '../index';

if (!importLocal(__filename)) {
  if (Number(/^\d+\.\d+/.exec(process.versions.node)) < 6.5) {
    console.error(`Nowa@2 needs node@6.5+ but found ${process.versions.node}\nPlease upgrade your environment`);
    process.exit(1);
  }
  run().catch(console.error);
}
