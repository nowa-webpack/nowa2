import { format } from 'util';

import { createDefaultRunner, Runner } from '@nowa/core';
import chalk from 'chalk';
import * as inquirer from 'inquirer';
import * as ora from 'ora';
import * as yargs from 'yargs';

import { InitContextPlugin } from './lib/initContext';
import { LoadCommandsPlugin } from './lib/loadCommands';
import { LoadOptionsPlugin } from './lib/loadOptions';

const isDebug = !!process.env.NOWA_DEBUG;

const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  const colorArr = ['#'];
  for (let i = 0; i < 6; i++) {
    colorArr.push(letters[(Math.random() * 16) | 0]); // tslint:disable-line:no-bitwise
  }
  return colorArr.join('');
};

export const createUtils: Runner.UtilsCreator = (name: string = 'unknown') => {
  const color = getRandomColor();
  const oraInstance = ora();
  const spinner = {
    clear: () => {
      oraInstance.clear();
      return oraInstance;
    },
    fail: (text?: string) => {
      oraInstance.fail(text ? `${name} ${text}` : undefined);
      return oraInstance;
    },
    info: (text?: string) => {
      oraInstance.info(text ? `${name} ${text}` : undefined);
      return oraInstance;
    },
    promise: (promise: Promise<any>, text?: string) => {
      return (ora as any).promise(promise, text); // @types/ora is not compatible with ora@2
    },
    start: (text: string = 'N/A') => {
      oraInstance.start(`${name} ${text}`);
      return spinner;
    },
    stop: () => {
      oraInstance.stop();
      return spinner;
    },
    succeed: (text?: string) => {
      oraInstance.succeed(text ? `${name} ${text}` : undefined);
      return oraInstance;
    },
    warn: (text?: string) => {
      oraInstance.warn(text ? `${name} ${text}` : undefined);
      return oraInstance;
    },
  };
  const prompt = inquirer.createPromptModule();
  const prefix = chalk`{magenta nowa} {hex('${color}') ${name}}`;
  return {
    chalk,
    logger: {
      debug: isDebug ? (first: any, ...rest: any[]) => console.log(`${prefix} ${chalk`{gray ${format(first, ...rest)}}`}`) : () => {}, // tslint:disable-line:no-empty
      error: (first: any, ...rest: any[]) => console.error(`${prefix} ${chalk`{red ${format(first, ...rest)}}`}`),
      info: (first: any, ...rest: any[]) => console.log(`${prefix} ${chalk`{blueBright ${format(first, ...rest)}}`}`),
      log: console.log,
      warn: (first: any, ...rest: any[]) => console.warn(`${prefix} ${chalk`{yellow ${format(first, ...rest)}}`}`),
    },
    prompt: async (desc: string, options: object = {}) => {
      const question = { ...options, message: desc, name: `quick_prompt` };
      const { quick_prompt } = await prompt(question);
      return quick_prompt;
    },
    spinner,
  };
};

export const run = async () => {
  const runner = await createDefaultRunner(createUtils, [
    new InitContextPlugin(),
    new LoadCommandsPlugin(),
    new LoadOptionsPlugin({ yargs, inquirer }),
  ]);
  await runner.init();
  await runner.run();
};
