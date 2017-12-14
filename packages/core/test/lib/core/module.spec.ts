import * as assert from 'assert';
import 'mocha'; // tslint:disable-line

import { Module } from '../../../src/lib/core/module';
import { Runnable } from '../../../src/lib/core/runnable';

class AsyncModule extends Module.Async {
  public async init() {
    return;
  }
  public async run() {
    return;
  }
}

class CallbackModule extends Module.Callback {
  public async init() {
    return;
  }
  public run(done: () => void) {
    setTimeout(done, 0);
  }
}

describe('Module', () => {
  describe('Async', () => {
    let instance: AsyncModule;
    beforeEach(() => {
      instance = new AsyncModule('async module', {
        commandOptions: {},
        info: { command: 'default', subCommand: 'default', context: __dirname, nodeModules: __dirname + '/node_modules' },
        moduleOptions: {},
      });
    });

    it('correctly extends Runnable.Async', () => {
      assert(instance instanceof Runnable.Async);
    });

    it('all methods / properties exist', () => {
      assert(instance.$name === 'async module');
      assert(instance.$runtime);
      assert(instance.init);
    });
  });

  describe('Callback', () => {
    let instance: CallbackModule;
    beforeEach(() => {
      instance = new CallbackModule('callback module', {
        commandOptions: {},
        info: { command: 'default', subCommand: 'default', context: __dirname, nodeModules: __dirname + '/node_modules' },
        moduleOptions: {},
      });
    });

    it('correctly extends Runnable.Async', () => {
      assert(instance instanceof Runnable.Callback);
    });

    it('all methods / properties exist', () => {
      assert(instance.$name === 'callback module');
      assert(instance.$runtime);
      assert(instance.init);
    });
  });
});
