import { Info } from '../types/info';
import { Hookable } from './hookable';
import { Runnable } from './runnable';

export namespace Module {
  export interface IBase {
    init(): Promise<void>;
  }

  export interface IRuntime<ModuleOption> {
    info: Info;
    commandOptions: object; // TODO
    moduleOptions: ModuleOption;
  }

  export abstract class Async<ModuleOption = {}, HookGroup extends Hookable.IHookGroup = {}> extends Runnable.Async<HookGroup> implements IBase {
    constructor(public $name: string, public $runtime: IRuntime<ModuleOption>) {
      super();
    }
    public abstract async init(): Promise<void>;
  }

  export abstract class Callback<ModuleOption = {}, HookGroup extends Hookable.IHookGroup = {}> extends Runnable.Callback<HookGroup> implements IBase {
    constructor(public $name: string, public $runtime: IRuntime<ModuleOption>) {
      super();
    }
    public abstract async init(): Promise<void>;
  }

  export type Type<HookGroup extends Hookable.IHookGroup = {}> = Async<HookGroup> | Callback<HookGroup>;
}
