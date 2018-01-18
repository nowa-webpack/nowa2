import { Chalk } from 'chalk';

export interface IPlugin<For> {
  name?: string;
  apply(hookable: For, utils: IUtils): void | Promise<void>;
}

export interface ILogger {
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

export interface ISpinner {
  start: (text: string) => this;
  stop: () => this;
  succeed: (text?: string) => this;
  fail: (text?: string) => this;
  warn: (text?: string) => this;
  info: (text?: string) => this;
  clear: () => this;
  promise(promise: Promise<any>, text?: string): this;
}

export interface IUtils {
  chalk: Chalk;
  logger: ILogger;
  prompt: (desc: string, options?: Partial<IPromptOptionDescription>) => Promise<any>;
  spinner: ISpinner;
}

export interface IConfig {
  config?: IConfigConfigRegistry;
  commands?: ISolutionCommandRegistry;
  nowa?: {
    plugins?: Array<string | [string, any]>;
  };
  solution: string | object;
}

export interface IConfigConfigRegistry {
  [commandName: string]: string | IConfigConfigValues | IConfigConfigRegistry;
}

export type IConfigConfigValues = [{ [optionName: string]: any }];

export interface ISolution {
  commands: ISolutionCommandRegistry;
  help?: {
    [commandName: string]: string;
  };
  nowa?: {
    plugins?: Array<string | [string, any]>;
  };
}

export type ISolutionCommandDescription = [
  /* optionDescription */ { [optionName: string]: IOptionDescription },
  Array<
    /* modulePath */ | string
    | [/* modulePath */ string, /* moduleOptions */ object | ((arg: { options: object; context: string }) => object)]
  >,
  /* description */ string | undefined
];
export interface ISolutionCommandRegistry {
  [commandName: string]: string | ISolutionCommandDescription | ISolutionCommandRegistry;
}

export interface IBaseOptionDescription {
  type: 'string' | 'number' | 'array' | 'boolean' | 'choice' | 'prompt';
  description: string;
  default?: boolean | string | number | string[];
  alias?: string;
  group?: string;
  hidden?: boolean;
}

export type IOptionDescription =
  | IChoiceOptionDescription
  | IStringOptionDescription
  | INumberOptionDescription
  | IArrayOptionDescription
  | IBooleanOptionDescription
  | IPromptOptionDescription;

export type IPromptOptionDescription =
  | ITextPromptOptionDescription
  | IConfirmPromptOptionDescription
  | IListPromptOptionDescription
  | ICheckboxPromptOptionDescription;

export interface IChoiceOptionDescription extends IBaseOptionDescription {
  type: 'choice';
  choices: string[];
  default?: string;
}

export interface IStringOptionDescription extends IBaseOptionDescription {
  type: 'string';
  default?: string;
}

export interface INumberOptionDescription extends IBaseOptionDescription {
  type: 'number';
  default?: number;
}

export interface IBooleanOptionDescription extends IBaseOptionDescription {
  type: 'boolean';
  default?: boolean;
}

export interface IArrayOptionDescription extends IBaseOptionDescription {
  type: 'array';
  default?: string[];
}

export interface IBasePromptOptionDescription extends IBaseOptionDescription {
  type: 'prompt';
  prompt: 'input' | 'confirm' | 'list' | 'password' | 'checkbox';
  order: number;
  filter?: (input: any) => Promise<any> | any;
  validate?: (result: any) => Promise<any> | any;
  choices?: any[];
}

export interface ITextPromptOptionDescription extends IBasePromptOptionDescription {
  prompt: 'input' | 'password';
  default: string;
}

export interface IConfirmPromptOptionDescription extends IBasePromptOptionDescription {
  prompt: 'confirm';
  default: boolean;
}
export interface IListPromptOptionDescriptionChoices {
  name: string;
  value?: string;
  short?: string;
}

export interface IListPromptOptionDescription extends IBasePromptOptionDescription {
  prompt: 'list';
  choices: Array<IListPromptOptionDescriptionChoices | string>;
  default: string;
}

export interface ICheckboxPromptOptionDescriptionChoices {
  name: string;
  value?: string;
  checked?: boolean;
}

export interface ICheckboxPromptOptionDescription extends IBasePromptOptionDescription {
  prompt: 'checkbox';
  choices: Array<IListPromptOptionDescriptionChoices | string>;
  default: string[];
}
