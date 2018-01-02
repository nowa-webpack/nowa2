export interface IPlugin<For> {
  apply(hookable: For): void | Promise<void>;
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
  [commandName: string]: IConfigConfigValues | IConfigConfigRegistry;
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
  [commandName: string]: ISolutionCommandDescription | ISolutionCommandRegistry;
}

export interface IBaseOptionDescription {
  type: 'string' | 'number' | 'array' | 'boolean' | 'choice';
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
  | IBooleanOptionDescription;

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
