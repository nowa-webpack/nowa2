import { Hookable } from './hookable';
import { Runnable } from './runnable';

export namespace Module {
  export interface IBase<ModuleOptions = {}> {
    $name: string;
    $runtime: IRuntime<ModuleOptions>;
    init(): Promise<void>;
  }

  export interface IConstructor<ModuleOptions = {}> extends Async {
    new ($runtime: IRuntime<ModuleOptions>): this;
  }

  export interface IRuntime<ModuleOptions = {}> {
    context: string;
    commands: string[];
    options: object;
    moduleOptions: ModuleOptions;
  }

  export abstract class Async<ModuleOptions = {}, HookGroup extends Hookable.IHookGroup = {}> extends Runnable.Async<HookGroup>
    implements IBase<ModuleOptions> {
    public abstract $name: string;
    constructor(public $runtime: IRuntime<ModuleOptions>) {
      super();
    }
    public abstract async init(): Promise<void>;
  }

  export abstract class Callback<ModuleOptions = {}, HookGroup extends Hookable.IHookGroup = {}> extends Runnable.Callback<HookGroup>
    implements IBase<ModuleOptions> {
    public abstract $name: string;
    constructor(public $runtime: IRuntime<ModuleOptions>) {
      super();
    }
    public abstract async init(): Promise<void>;
  }

  export type InstanceType<HookGroup extends Hookable.IHookGroup = {}> = Async<HookGroup> | Callback<HookGroup>;
}
