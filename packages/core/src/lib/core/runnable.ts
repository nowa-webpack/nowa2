import { Hookable } from './hookable';

export namespace Runnable {
  export interface IBase {
    $type: 'callback' | 'async';
    run(done?: (error?: Error) => void): void | Promise<void>;
  }

  export abstract class Callback<HookGroup extends Hookable.IHookGroup> extends Hookable<HookGroup> implements IBase {
    public $type: 'callback' = 'callback';
    public abstract run(done: (error?: Error) => void): void;
  }

  export abstract class Async<HookGroup extends Hookable.IHookGroup> extends Hookable<HookGroup> implements IBase {
    public $type: 'async' = 'async';
    public abstract async run(): Promise<void>;
  }

  export type InstanceType<HookGroup extends Hookable.IHookGroup> = Callback<HookGroup> | Async<HookGroup>;
}
