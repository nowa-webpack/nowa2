/* tslint:disable */

// TODO
import { Solution } from './solution';

export namespace Config {
  export namespace _Nowa {
    export type _Plugin = string | [string, object];
    export interface User {
      plugins?: _Plugin[];
    }
    export interface Parsed {
      plugins: _Plugin[];
    }
  }

  export namespace _Commands {
    export type _Command = string | [string, object | Function];
    export type _Commands = _Command[] | undefined;
    export interface User {
      [commandName: string]: _Commands | { [subCommandName: string]: _Commands };
    }
  }

  export namespace _Config {
    export type _Config = any;
    export type _ConfigWrapper = [_Config] | undefined;
    export interface User {
      [commandName: string]: _ConfigWrapper | { [subCommandName: string]: _ConfigWrapper };
    }
    export interface Parsed {
      [commandName: string]: [_Config] | { [subCommandName: string]: [_Config] };
    }
  }

  export interface User {
    config: _Config.User;
    nowa?: _Nowa.User;
    solution?: string | Solution.User;
  }

  export interface Parsed {
    nowa: _Nowa.Parsed;
    config: _Config.Parsed;
  }
}
