import { dirname, resolve } from 'path';

export interface ISolution {
  name: string;
  version: string;
}

export class SolutionConfiguration {
  private _name: string = '';
  private _version: string = '';

  constructor(configFilePath: string) {
    this.init(configFilePath);
  }

  public toJS(): ISolution {
    return {
      name: this._name,
      version: this._version,
    };
  }

  private init(configFilePath: string): void {
    const content = require(configFilePath);
    this._name = content.solution;
    const pkgJsonObj = require(resolve(dirname(configFilePath), `node_modules/${this._name}/package.json`));
    this._version = pkgJsonObj.version;
  }
}
