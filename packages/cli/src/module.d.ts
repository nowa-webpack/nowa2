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
