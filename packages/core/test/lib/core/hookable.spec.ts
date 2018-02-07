import * as assert from 'assert';
import 'mocha'; // tslint:disable-line

import { Hookable } from '../../../src/lib/core/hookable';

class TestHookable extends Hookable<{
  name1: [{ name: 'first' }, { name: string }];
  name2: [undefined, number];
  name3: [undefined, void];
}> {}

describe('Hookable', () => {
  let instance: TestHookable;
  beforeEach(() => {
    instance = new TestHookable();
  });

  it('all methods / properties exist', () => {
    assert(instance.$hooks);
    assert(instance.$register);
    assert(instance.$applyHook);
    assert(instance.$applyHookBail);
    assert(instance.$applyHookWaterfall);
  });

  it('#$register works', () => {
    instance.$register('name3', () => {}); // tslint:disable-line
    assert(instance.$hooks.name3!.length === 1);
    instance.$register('name3', () => {}); // tslint:disable-line
    assert(instance.$hooks.name3!.length === 2);
  });

  it('#$applyHook works', done => {
    instance.$register('name3', () => {
      done();
    });
    instance.$applyHook('name3');
  });

  it('#$applyHookBail works', async () => {
    instance.$register('name2', () => {
      return 1;
    });
    instance.$register('name2', () => {
      return 2;
    });
    instance.$register('name2', () => {
      return 3;
    });
    assert((await instance.$applyHookBail('name2')) === 3);
  });

  it('#$applyHookBail works in FIFO mode', async () => {
    instance.$register('name2', () => {
      return 1;
    });
    instance.$register('name2', () => {
      return 2;
    });
    instance.$register('name2', () => {
      return 3;
    });
    assert((await instance.$applyHookBail('name2', undefined, true)) === 1);
  });

  it('#$applyHookBail fails when no return found', async () => {
    instance.$register('name2', () => {
      return undefined as any;
    });
    instance.$register('name2', () => {
      return undefined as any;
    });
    instance.$register('name2', () => {
      return undefined as any;
    });
    try {
      await instance.$applyHookBail('name2');
    } catch (e) {
      assert(e instanceof Error);
      return;
    }
    assert.fail('No error thrown');
  });

  it('#$applyHookBail fails when no return found', async () => {
    instance.$register('name2', () => {
      return undefined as any;
    });
    instance.$register('name2', () => {
      return undefined as any;
    });
    instance.$register('name2', () => {
      return undefined as any;
    });
    try {
      await instance.$applyHookBail('name2');
    } catch (e) {
      assert(e instanceof Error);
      return;
    }
    assert.fail('No error thrown');
  });

  it('#$applyHookWaterfall works', async () => {
    instance.$register('name1', ({ name }) => {
      assert((name as string) === 'second');
      return { name: 'finish' };
    });
    instance.$register('name1', ({ name }) => {
      assert((name as string) === 'second');
      return undefined;
    });
    instance.$register('name1', ({ name }) => {
      assert(name === 'first');
      return { name: 'second' };
    });
    const data = await instance.$applyHookWaterfall('name1', { name: 'first' });
    assert(data.name === 'finish');
  });

  it('#$applyHookWaterfall works in FIFO mode', async () => {
    instance.$register('name1', ({ name }) => {
      assert(name === 'first');
      return { name: 'second' };
    });
    instance.$register('name1', ({ name }) => {
      assert((name as string) === 'second');
      return undefined;
    });
    instance.$register('name1', ({ name }) => {
      assert((name as string) === 'second');
      return { name: 'finish' };
    });
    assert.deepEqual(await instance.$applyHookWaterfall('name1', { name: 'first' }, true), { name: 'finish' });
  });

  it('no hook cases', async () => {
    assert((await instance.$applyHook('name3')) === undefined);
    assert.deepEqual(await instance.$applyHookWaterfall('name1', { name: 'first' }), { name: 'first' });
    try {
      await instance.$applyHookBail('name3');
    } catch (e) {
      assert(e instanceof Error);
      return;
    }
    assert.fail('No error thrown');
  });
});
