export abstract class Hookable<HookGroup extends Hookable.IHookGroup> {
  public $hooks: Hookable.Registry<this> = {};

  public $register<HookName extends keyof HookGroup>(hookName: HookName, handler: Hookable.Handler<HookGroup[HookName][0], HookGroup[HookName][1], this>): void {
    this.$hooks[hookName] || (this.$hooks[hookName] = []);
    this.$hooks[hookName]!.push(handler);
  }

  public async $applyHook<HookName extends keyof HookGroup>(hookName: HookName, param?: HookGroup[HookName][0]): Promise<void> {
    const plugins = this.$hooks[hookName];
    if (plugins) {
      await Promise.all(plugins.map(handler => handler.call(null, param)));
    }
    return;
  }

  public async $applyHookBail<HookName extends keyof HookGroup>(hookName: HookName, param?: HookGroup[HookName][0], FIFO: boolean = false): Promise<HookGroup[HookName][1]> {
    const plugins = this.$hooks[hookName] && (FIFO ? this.$hooks[hookName] : Array.from(this.$hooks[hookName]!).reverse());
    if (plugins) {
      for (const handler of plugins) {
        const result = await handler.call(null, param);
        if (result !== undefined) {
          return result;
        }
      }
    }
    throw new Error(`All ${hookName} hooks returns undefined`);
  }

  public async $applyHookWaterfall<HookName extends keyof HookGroup>(hookName: HookName, initial: HookGroup[HookName][0], FIFO: boolean = false): Promise<HookGroup[HookName][1]> {
    const plugins = this.$hooks[hookName] && (FIFO ? this.$hooks[hookName] : Array.from(this.$hooks[hookName]!).reverse());
    let prevResult = initial;
    if (plugins) {
      for (const func of plugins) {
        const result = await func.call(null, prevResult);
        if (result !== undefined) {
          prevResult = result;
        }
      }
    }
    return prevResult as HookGroup[HookName][1];
  }
}

export namespace Hookable {
  export type Handler<Param, Expected, This> = (this: This, param: Param) => Promise<Expected | undefined> | Expected | undefined;

  export interface IHookGroup {
    [hookName: string]: [any, any]; // hook-name: [param-pass-to-hook, expected-result-from-hook]
  }

  export type Registry<This> = { [hookName in keyof IHookGroup]: Array<Hookable.Handler<IHookGroup[hookName][0], IHookGroup[hookName][1], This>> | undefined };
}
