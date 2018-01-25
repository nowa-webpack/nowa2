import { basename, resolve } from 'path';

import { Module } from '@nowa/core';
import { copy, emptyDir, ensureDir, move, remove } from 'fs-extra';
import * as globby from 'globby';

export default class ModuleFile extends Module.Async<ModuleFile.Options> {
  public $name = 'file';
  public actions: ModuleFile.Action[] = [];

  public async init() {
    const { logger } = this.$utils;
    const moduleOptions = this.$runtime.moduleOptions;
    this.actions = this.actions.concat(moduleOptions);
    logger.info(`find ${this.actions.length} file actions`);
  }

  public async run() {
    const { logger } = this.$utils;
    const { context } = this.$runtime;
    for (const [index, action] of this.actions.entries()) {
      const files = (await this._getFiles(action.from)).map(file => resolve(context, file));
      logger.debug(`find ${files.length} files in action ${index}`);
      switch (action.type) {
        case 'remove':
          await Promise.all(
            files.map(file => {
              logger.debug(`removing ${file}`);
              return remove(file);
            }),
          );
          continue;
        case 'empty':
          await Promise.all(
            files.map(file => {
              this._folderCheck(file, action);
              logger.debug(`emptyDir ${file}`);
              return emptyDir(file);
            }),
          );
          continue;
        case 'ensure':
          await Promise.all(
            files.map(file => {
              this._folderCheck(file, action);
              logger.debug(`ensureDir ${file}`);
              return ensureDir(file);
            }),
          );
          continue;
        case 'copy':
          if (!action.to.endsWith('/') && files.length > 1) {
            logger.error(`in ${action}`);
            logger.error('copy multiple files to a single file is not valid');
            throw new Error('copy multiple to single file');
          }
          await Promise.all(
            files.map(file => {
              const target = action.to.endsWith('/') ? resolve(action.to, basename(file)) : action.to;
              return copy(file, target);
            }),
          );
          continue;
        case 'move':
          if (!action.to.endsWith('/') && files.length > 1) {
            logger.error(`in ${action}`);
            logger.error('copy multiple files to a single file is not valid');
            throw new Error('move multiple to single file');
          }
          await Promise.all(
            files.map(file => {
              const target = action.to.endsWith('/') ? resolve(action.to, basename(file)) : action.to;
              return move(file, target);
            }),
          );
          continue;
        default:
          logger.error(`find invalid type ${(action as ModuleFile.Action).type} @ action ${index}`);
          throw new Error('invalid action type');
      }
    }
  }

  private async _getFiles(paths: string | string[]): Promise<string[]> {
    return globby(paths, { cwd: this.$runtime.context, mark: true, nomount: true, nodir: false });
  }

  private _folderCheck(path: string, action: ModuleFile.Action): void {
    const { logger } = this.$utils;
    if (!path.endsWith('/')) {
      logger.error(`in ${action}`);
      logger.error(`in ${path}`);
      logger.error(`${action.type} action can only be apply to a folder`);
      logger.error(`please try to add a "/" to action.o for forcing matching folders`);
      throw new Error(`${action.type} a file`);
    }
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
  export type Action = ISingleArgAction | IDoubleArgAction;

  export type Options = Action | Action[];
}
