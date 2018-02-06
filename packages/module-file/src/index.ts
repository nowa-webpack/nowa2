import { basename, dirname, resolve } from 'path';

import { Module } from '@nowa/core';
import { copy, emptyDir, ensureDir, move, remove } from 'fs-extra';
import * as globby from 'globby';
import * as isGlob from 'is-glob';

export default class ModuleFile extends Module.Async<ModuleFile.Config> {
  public $name = 'file';
  public actions?: ModuleFile.SingleAction[];

  public async init() {
    const { logger } = this.$utils;
    const [actions] = this.$runtime.config;
    this.actions = ([] as ModuleFile.SingleAction[]).concat(actions);
    logger.info(`got ${this.actions.length} file actions`);
  }

  public async run() {
    const { logger } = this.$utils;
    const { context } = this.$runtime;
    for (const [index, action] of this.actions!.entries()) {
      const files = (await this._getFiles(action.from)).map(file => resolve(context, file));
      logger.debug(`find ${files.length} paths in action ${index}`);
      logger.debug(files);
      switch (action.type) {
        case 'remove':
          await Promise.all(
            files.map(file => {
              logger.debug(`removing ${file}`);
              return remove(file);
            }),
          );
          logger.info(`emptied ${files.length} file(s) / folder(s)`);
          continue;
        case 'empty':
          await Promise.all(
            files.map(file => {
              logger.debug(`emptyDir ${file}`);
              return emptyDir(file);
            }),
          );
          logger.info(`emptied ${files.length} folder(s)`);
          continue;
        case 'ensure':
          await Promise.all(
            files.map(file => {
              logger.debug(`ensureDir ${file}`);
              return ensureDir(file);
            }),
          );
          logger.info(`ensured ${files.length} folder(s)`);
          continue;
        case 'move':
        case 'copy': {
          const target = resolve(context, action.to);
          const isDir = action.to.endsWith('/');
          if (!isDir && files.length > 1) {
            logger.error(`in`, action);
            logger.error(`${action.type} multiple files to a single file is not valid`);
            throw new Error(`${action.type} multiple to single file`);
          }
          if (isDir) {
            await ensureDir(target);
          } else {
            await ensureDir(dirname(target));
          }
          if (action.type === 'copy') {
            await Promise.all(
              files.map(file => {
                const dest = isDir ? resolve(target, basename(file)) : target;
                logger.debug(`copy ${file} to ${dest}`);
                return copy(file, dest, { overwrite: true });
              }),
            );
            logger.info(`copied ${files.length} file(s) / folder(s)`);
          } else if (action.type === 'move') {
            await Promise.all(
              files.map(file => {
                const dest = isDir ? resolve(target, basename(file)) : target;
                logger.debug(`copy ${file} to ${dest}`);
                return move(file, dest, { overwrite: true });
              }),
            );
            logger.info(`moved ${files.length} file(s) / folder(s)`);
          }
          continue;
        }
        default:
          logger.error(`find invalid type ${(action as ModuleFile.SingleAction).type} @ action ${index}`);
          throw new Error('invalid action type');
      }
    }
  }

  private async _getFiles(paths: string | string[]): Promise<string[]> {
    const normalPaths: string[] = [];
    const globPaths: string[] = [];
    ([] as string[]).concat(paths).forEach(filePath => {
      if (isGlob(filePath)) {
        globPaths.push(filePath);
      } else {
        normalPaths.push(resolve(this.$runtime.context, filePath));
      }
    });
    return [...normalPaths, ...(await globby(globPaths, { cwd: this.$runtime.context, nomount: false }))];
  }
}

export namespace ModuleFile {
  export interface IBaseAction {
    type: 'copy' | 'move' | 'remove' | 'empty' | 'ensure';
    from: string | string[];
  }
  export interface ISingleArgAction extends IBaseAction {
    type: 'remove' | 'empty' | 'ensure';
  }
  export interface IDoubleArgAction extends IBaseAction {
    type: 'copy' | 'move';
    to: string;
  }
  export type SingleAction = ISingleArgAction | IDoubleArgAction;

  export type Config = [SingleAction | SingleAction[]];
}
