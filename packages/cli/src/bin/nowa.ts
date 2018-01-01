#!/usr/bin/env node
'use strict';

import run from '../index';

if (Number(/^\d+\.\d+/.exec(process.versions.node)) < 6.5) {
  console.error(`Nowa command needs node@6.5+ but found ${process.versions.node}\nplease upgrade your environment`);
  process.exit(1);
}

run().catch(console.error);
