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

export interface ISpinner extends ISpinnerInstance {
  promise(promise: Promise<any>, text?: string): ISpinnerInstance;
}
export interface ISpinnerInstance {
  start: (text?: string) => ISpinnerInstance;
  stop: () => ISpinnerInstance;
  succeed: (text?: string) => ISpinnerInstance;
  fail: (text?: string) => ISpinnerInstance;
  warn: (text?: string) => ISpinnerInstance;
  info: (text?: string) => ISpinnerInstance;
  clear: () => ISpinnerInstance;
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
  [commandPath: string]:
    | IConfigConfigValues
    | ((arg?: { params: { [paramName: string]: string }; context: string }) => IConfigConfigValues);
}

export type IConfigConfigValues = { [optionName: string]: any };

export interface ISolution {
  commands: ISolutionCommandRegistry;
  intro?: {
    [commandName: string]: ISolutionHelpRegistry;
  };
  nowa?: {
    plugins?: Array<string | [string, any]>;
  };
}
export interface ISolutionHelpRegistry {
  _label?: string;
  _default?: string;
  [commandName: string]: ISolutionHelpRegistry | string | undefined;
}

export type ISolutionCommandModuleDescription =
  | undefined
  | /* modulePath */ string
  | [/* modulePath */ string, ((arg?: { options: IConfigConfigValues[0]; context: string }) => /* moduleConfig */ any[] | Promise<any[]>)]
  | ISolutionCommandModuleDescriptionWithConfig;

export interface ISolutionCommandModuleDescriptionWithConfig extends Array<any> {
  '0': string;
}

export interface ISolutionCommandDescription {
  options: { [optionName: string]: IOptionDescription };
  actions: Array<
    | ISolutionCommandModuleDescription
    | ((
        arg?: { options: IConfigConfigValues[0]; context: string },
      ) => ISolutionCommandModuleDescription | Promise<ISolutionCommandModuleDescription>)
  >;
  description?: string | undefined;
}
export interface ISolutionCommandRegistry {
  [commandPath: string]:
    | ISolutionCommandDescription
    | ((arg?: { options: IConfigConfigValues[0]; context: string }) => ISolutionCommandDescription);
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
