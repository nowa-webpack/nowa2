/* tslint:disable */

// TODO

import { Config } from './config';

export namespace Solution {
  export namespace _Commands {
    export type _Command = string | [string, object | Function | undefined];
    export type _ParsedCommand = string | [string, object | undefined];
    export type _Commands = _Command[] | undefined;
    export interface User {
      [commandName: string]: _Commands | { [subCommandName: string]: _Commands };
    }
    export interface Parsed {
      [commandName: string]: _ParsedCommand | { [subCommandName: string]: _ParsedCommand };
    }
  }

  export namespace _CommandDescriptors {
    export interface _ParsedOptionDescriptor {
      type: 'string' | 'number' | 'array' | 'boolean';
      description: string;
      convert?: Function;
    }
    export type _UserOptionDescriptor = string | Partial<_ParsedOptionDescriptor>;
    export interface _DefaultValues {
      [optionName: string]: any;
    }
    export interface _UserDescriptor {
      [optionName: string]: _UserOptionDescriptor;
    }
    export interface _ParsedDescriptor {
      [optionName: string]: _ParsedOptionDescriptor;
    }
    export type _Description = string;
    export type _UserDescriptors = [_DefaultValues | undefined, _UserDescriptor | undefined, _Description | undefined] | undefined;
    export type _ParsedDescriptors = [_DefaultValues, _ParsedDescriptor, _Description | undefined];
    export interface User {
      [commandName: string]: _UserDescriptors | { [subCommandName: string]: _UserDescriptors };
    }
    export interface Parsed {
      [commandName: string]: [_ParsedOptionDescriptor] | { [subCommandName: string]: [_ParsedOptionDescriptor] };
    }
  }

  export interface User {
    commands: _Commands.User;
    nowa?: Config._Nowa.User;
    commandDescriptors?: _CommandDescriptors.User;
  }

  export interface Parsed {
    commands: _Commands.Parsed;
    nowa: Config._Nowa.Parsed;
    commandDescriptors: _CommandDescriptors.Parsed;
  }
}
