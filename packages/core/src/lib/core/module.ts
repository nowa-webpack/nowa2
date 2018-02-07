import { IUtils } from '../types';
import { Hookable } from './hookable';
import { Runnable } from './runnable';

export namespace Module {
  export interface IBase<ModuleConfig extends any[] = any[]> {
    $name: string;
    $runtime: IRuntime<ModuleConfig>;
    $utils: IUtils;
    init(): Promise<void>;
  }

  export interface IConstructor<ModuleConfig extends any[] = any[]> extends Async {
    prototype: {
      init(): any;
      run(cb?: any): any;
    };
    new ($runtime: IRuntime<ModuleConfig>, $utils: IUtils): this;
  }

  export interface IRuntime<ModuleConfig extends any[] = any[]> {
    context: string;
    commands: string[];
    options: object;
    config: ModuleConfig;
  }

  export abstract class Async<ModuleConfig extends any[] = any[], HookGroup extends Hookable.IHookGroup = {}> extends Runnable.Async<
    HookGroup
  > implements IBase<ModuleConfig> {
    public abstract $name: string;
    constructor(public $runtime: IRuntime<ModuleConfig>, public $utils: IUtils) {
      super();
    }
    public abstract async init(): Promise<void>;
  }

  export abstract class Callback<ModuleConfig extends any[] = any[], HookGroup extends Hookable.IHookGroup = {}> extends Runnable.Callback<
    HookGroup
  > implements IBase<ModuleConfig> {
    public abstract $name: string;
    constructor(public $runtime: IRuntime<ModuleConfig>, public $utils: IUtils) {
      super();
    }
    public abstract async init(): Promise<void>;
  }

  export type InstanceType = Async | Callback;
}
