import * as assert from 'assert';
import 'mocha'; // tslint:disable-line

import { Hookable } from '../../../src/lib/core/hookable';
import { Runnable } from '../../../src/lib/core/runnable';

class AsyncRunnable extends Runnable.Async<{}> {
  public async run() {
    return;
  }
}

class CallbackRunnable extends Runnable.Callback<{}> {
  public run(done: () => void) {
    setTimeout(done, 0);
  }
}

describe('Module', () => {
  describe('Async', () => {
    let instance: AsyncRunnable;
    beforeEach(() => {
      instance = new AsyncRunnable();
    });

    it('correctly extends Hookable', () => {
      assert(instance instanceof Hookable);
    });

    it('all methods / properties exist', () => {
      assert(instance.$type === 'async');
      assert(instance.run);
    });
  });

  describe('Callback', () => {
    let instance: CallbackRunnable;
    beforeEach(() => {
      instance = new CallbackRunnable();
    });

    it('correctly extends Hookable', () => {
      assert(instance instanceof Hookable);
    });

    it('all methods / properties exist', () => {
      assert(instance.$type === 'callback');
      assert(instance.run);
    });
  });
});
