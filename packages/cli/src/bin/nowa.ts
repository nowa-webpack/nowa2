#!/usr/bin/env node
'use strict';

import run from '../index';

if (Number.parseInt(process.versions.node) < 6) {
  console.error(new Error('Nowa command needs node 6, please upgrade your environment'));
  process.exit(1);
}

run().then(
  () => {
    console.log('Nowa Command Finished');
  },
  error => {
    console.error(error);
  },
);
