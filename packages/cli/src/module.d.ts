declare module 'yargs-parser' {
  import { Arguments } from 'yargs';
  const parser: (args: string[]) => Arguments;
  export = parser;
}
