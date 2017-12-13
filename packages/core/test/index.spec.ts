import * as assert from 'assert';
import 'mocha'; // tslint:disable-line

import { createDefaultRunner, createRunner, Runner } from '../src';

class TestPlugin {
  public apply(runner: Runner) {
    runner.$register('init-start', () => undefined);
  }
}

describe('Index', () => {
  it('createRunner returns Runner', async () => {
    const runner = await createRunner([]);
    assert(runner instanceof Runner);
  });

  it('createRunner applies plugins', async () => {
    let runner = await createRunner([]);
    assert(Object.keys(runner.$hooks).length === 0);
    runner = await createRunner([new TestPlugin()]);
    assert(Object.keys(runner.$hooks).length === 1);
    assert(runner.$hooks['init-start']!.length === 1);
  });

  it('createDefaultRunner returns Runner', async () => {
    const runner = await createDefaultRunner([]);
    assert(runner instanceof Runner);
  });

  it('createDefaultRunner applies plugins', async () => {
    const hookCount = 15; // number of hook in plugin
    let runner = await createDefaultRunner([]);
    assert(Object.keys(runner.$hooks).length === hookCount);
    runner = await createDefaultRunner([new TestPlugin()]);
    assert(Object.keys(runner.$hooks).length === hookCount + 1);
    assert(runner.$hooks['init-start']!.length === 2);
  });
});
