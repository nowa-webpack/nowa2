declare module 'yargs-parser' {
  import { Arguments } from 'yargs';
  const parser: (args: string[]) => Arguments;
  export = parser;
}

declare module 'import-local' {
  const importLocal: (filename: string) => boolean;
  export = importLocal;
}

declare module 'is-elevated' {
  const isElevated: () => Promise<boolean>;
  export = isElevated;
}

declare module 'cliui' {
  interface IColumn {
    text?: string;
    width?: string;
    align?: 'right' | 'center';
    padding?: [number, number, number, number];
    border?: boolean;
  }
  type ICliUi = (arg?: { width?: number; wrap?: boolean }) => ICliUiInstance;
  interface ICliUiInstance {
    div(a1: string | IColumn, a2?: string | IColumn, a3?: string | IColumn): void;
    span(a1: string | IColumn, a2?: string | IColumn, a3?: string | IColumn): void;
    toString(): string;
  }
  const cliUi: ICliUi;
  export = cliUi;
}
