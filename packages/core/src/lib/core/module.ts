import { Info } from '../types/info';
import { Hookable } from './hookable';
import { Runnable } from './runnable';

export namespace Module {
  export interface IBase {
    init(): Promise<void>;
  }

  export interface IRuntime {
    info: Info;
    commandOptions: object; // TODO
    moduleOptions: object; // TODO
  }
  export abstract class Async<HookGroup extends Hookable.IHookGroup> extends Runnable.Async<HookGroup> implements IBase {
    constructor(public $name: string, public $runtime: IRuntime) {
      super();
    }
    public abstract async init(): Promise<void>;
  }

  export abstract class Callback<HookGroup extends Hookable.IHookGroup> extends Runnable.Callback<HookGroup> implements IBase {
    constructor(public $name: string, public $runtime: IRuntime) {
      super();
    }
    public abstract async init(): Promise<void>;
  }

  export type Type<HookGroup extends Hookable.IHookGroup> = Async<HookGroup> | Callback<HookGroup>;
}
