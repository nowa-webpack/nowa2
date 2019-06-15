import { Module, utils } from '@nowa/core';
import { resolve } from 'path';
import * as supportsColor from 'supports-color';
import * as Webpack from 'webpack';
import * as WebpackDevServer from 'webpack-dev-server';
import * as Stats from 'webpack/lib/Stats'; // tslint:disable-line:no-submodule-imports

const isSupportColor = supportsColor.stdout;

export default class ModuleWebpack extends Module.Callback<ModuleWebpack.Config> {
  public $name = 'webpack';
  public mode: ModuleWebpack.IOptions['mode'];
  public compiler?: Webpack.Compiler;
  public getCompilerCallback?: (done: (error?: any) => void) => (err: any, stats: any) => void;
  public lastHash?: string;
  public server?: WebpackDevServer;
  public startDevServer?: (done: () => void) => Promise<void>;
  public config?: Webpack.Configuration | Webpack.Configuration[];
  public firstConfig?: Webpack.Configuration;
  public alreadyRun = false;
  public alreadyOpen = false;

  public async init() {
    const { logger } = this.$utils;
    const [webpackConfigs, options] = this.$runtime.config;
    const userConfigs: ModuleWebpack.SingleConfig[] = ([] as ModuleWebpack.SingleConfig[]).concat(webpackConfigs);
    const configs: Array<Webpack.Configuration | Webpack.Configuration[]> = [];
    logger.debug(`find ${userConfigs.length} configs`);
    for (const config of userConfigs) {
      configs.push(await this._initConfig(config));
    }
    let finalConfigs = configs.reduce((p: Webpack.Configuration[], c) => p.concat(c), []);
    const overwriteConfigPath = resolve(this.$runtime.context, './webpack.overwrite.js');
    let overwriteConfig = await utils.requireFile(overwriteConfigPath);
    if (overwriteConfig && typeof overwriteConfig === 'object') {
      logger.debug(`find overwrite config is a object, send to parser`);
      const parserResult = utils.parser('webpack.config', this.$runtime.commands, logger.debug, overwriteConfig); // tslint:disable-line:no-empty
      overwriteConfig = (parserResult && parserResult.result && parserResult.result[0]) || overwriteConfig;
      if (typeof overwriteConfig === 'function') {
        logger.debug(`find overwrite config for this command`);
      }
    }
    if (typeof overwriteConfig === 'function') {
      logger.warn(`overwrite configs from ${overwriteConfigPath}`);
      finalConfigs = await finalConfigs.map(config => overwriteConfig(config, this.$runtime, Webpack));
    }
    logger.debug(`got ${finalConfigs.length} webpack configs`);
    logger.debug(finalConfigs);
    this.config = finalConfigs.length === 1 ? finalConfigs[0] : finalConfigs;
    this.firstConfig = finalConfigs[0];
    logger.debug(`use configs[0] as firstConfig`, this.firstConfig);

    const autoMode = async () => {
      if (this.firstConfig!.devServer) {
        this.mode = 'devServer';
        return this._initWebpackDevServer();
      } else if (this.firstConfig!.watch) {
        this.mode = 'watch';
      } else {
        this.mode = 'run';
      }
      return this._initWebpack();
    };

    if (options && options.mode) {
      this.mode = options.mode;
      switch (options.mode) {
        case 'devServer':
          await this._initWebpackDevServer();
          break;
        case 'run':
        case 'watch':
          await this._initWebpack();
          break;
        default:
          logger.error(`unknown mode ${options.mode}, ignored`);
          await autoMode();
      }
    } else {
      await autoMode();
    }
  }

  public run(done: () => void) {
    if (!this.alreadyRun) {
      if (this.mode === 'devServer') {
        this.startDevServer!(done);
      } else if (this.mode === 'watch') {
        const watchOptions = this.firstConfig!.watchOptions || this.firstConfig!.watch || {};
        if ((watchOptions as any).stdin) {
          process.stdin.on('end', () => {
            process.exit();
          });
          process.stdin.resume();
        }
        this.compiler!.watch(watchOptions as any, this.getCompilerCallback!(done));
      } else {
        this.compiler!.run(this.getCompilerCallback!(done));
      }
      this.alreadyRun = true;
    }
  }

  private async _initConfig(config: ModuleWebpack.SingleConfig): Promise<Webpack.Configuration | Webpack.Configuration[]> {
    const userConfig = typeof config === 'string' ? utils.handleESModuleDefault(require(config)) : config;
    if (typeof userConfig === 'function') {
      return userConfig({ context: this.$runtime.context, options: this.$runtime.options });
    } else {
      return userConfig;
    }
  }

  private async _initWebpack(): Promise<void> {
    // from webpack
    // https://github.com/webpack/webpack/blob/master/bin/webpack.js
    // 3.10.0
    const options = this.config!;
    const firstOptions: any = [].concat(options as any)[0];
    const statsPresetToOptions = Stats.presetToOptions;
    let outputOptions: any = (options as any).stats;
    if (typeof outputOptions === 'boolean' || typeof outputOptions === 'string') {
      outputOptions = statsPresetToOptions(outputOptions);
    } else if (!outputOptions) {
      outputOptions = {};
    }
    outputOptions = Object.create(outputOptions);
    if (Array.isArray(options) && !outputOptions.children) {
      outputOptions.children = options.map(o => o.stats);
    }
    if (typeof outputOptions.context === 'undefined') {
      outputOptions.context = firstOptions.context;
    }
    if (typeof outputOptions.colors === 'undefined') {
      outputOptions.colors = true;
    }
    if (!outputOptions.json) {
      if (typeof outputOptions.cached === 'undefined') {
        outputOptions.cached = false;
      }
      if (typeof outputOptions.cachedAssets === 'undefined') {
        outputOptions.cachedAssets = false;
      }
      if (!outputOptions.exclude) {
        outputOptions.exclude = ['node_modules', 'bower_components', 'components'];
      }
    }
    Error.stackTraceLimit = 30;
    try {
      this.compiler = Webpack(options as Webpack.Configuration);
    } catch (err) {
      if (err.name === 'WebpackOptionsValidationError') {
        if (isSupportColor) {
          console.error(`\u001b[1m\u001b[31m${err.message}\u001b[39m\u001b[22m`);
        } else {
          console.error(err.message);
        }
      }
      throw err;
    }
    this.getCompilerCallback = done => (err: any, stats: any) => {
      if (!firstOptions.watch || err) {
        // Do not keep cache anymore
        (this.compiler as any).purgeInputFileSystem();
      }
      if (err) {
        this.lastHash = undefined;
        console.error(err.stack || err);
        if (err.details) {
          console.error(err.details);
        }
        process.exit(1);
      }
      if (outputOptions.json) {
        process.stdout.write(JSON.stringify(stats.toJson(outputOptions), null, 2) + '\n');
      } else if (stats.hash !== this.lastHash) {
        this.lastHash = stats.hash;
        const statsString = stats.toString(outputOptions);
        if (statsString) {
          process.stdout.write(statsString + '\n');
        }
        done(); // only continue moduleQueue when hash changed
      }
      if (!firstOptions.watch && stats.hasErrors()) {
        process.exitCode = 2;
      }
    };
  }

  private async _initWebpackDevServer(): Promise<void> {
    // from webpack-dev-server
    // https://github.com/webpack/webpack-dev-server/blob/master/bin/webpack-dev-server.js
    // 3.7.1
    const fs = require('fs');
    const net = require('net');
    const webpack = require('webpack');
    const Server = require('webpack-dev-server');
    const setupExitSignals = require('webpack-dev-server/lib/utils/setupExitSignals');
    const colors = require('webpack-dev-server/lib/utils/colors');
    const createLogger = require('webpack-dev-server/lib/utils/createLogger');
    const findPort = require('webpack-dev-server/lib/utils/findPort');

    let server: any;

    setupExitSignals(server);

    function startDevServer(config: Webpack.Configuration | Webpack.Configuration[], options: WebpackDevServer.Configuration) {
      const log = createLogger(options);

      let compiler;

      try {
        compiler = webpack(config);
      } catch (err) {
        if (err instanceof webpack.WebpackOptionsValidationError) {
          log.error(colors.error(isSupportColor, err.message));
          process.exit(1);
        }

        throw err;
      }

      try {
        server = new Server(compiler, options, log);
      } catch (err) {
        if (err.name === 'ValidationError') {
          log.error(colors.error(isSupportColor, err.message));
          process.exit(1);
        }

        throw err;
      }

      if (options.socket) {
        server.listeningApp.on('error', (e: any) => {
          if (e.code === 'EADDRINUSE') {
            const clientSocket = new net.Socket();

            clientSocket.on('error', (err: any) => {
              if (err.code === 'ECONNREFUSED') {
                // No other server listening on this socket so it can be safely removed
                fs.unlinkSync(options.socket);

                server.listen(options.socket, options.host, (error: any) => {
                  if (error) {
                    throw error;
                  }
                });
              }
            });

            clientSocket.connect(
              { path: options.socket },
              () => {
                throw new Error('This socket is already used');
              },
            );
          }
        });

        server.listen(options.socket, options.host, (err: any) => {
          if (err) {
            throw err;
          }

          // chmod 666 (rw rw rw)
          const READ_WRITE = 438;

          fs.chmod(options.socket, READ_WRITE, (err: any) => {
            if (err) {
              throw err;
            }
          });
        });
      } else {
        findPort(options.port)
          .then((port: any) => {
            options.port = port;
            server.listen(options.port, options.host, (err: any) => {
              if (err) {
                throw err;
              }
            });
          })
          .catch((err: any) => {
            throw err;
          });
      }
    }
    const devServerOption: WebpackDevServer.Configuration = {
      port: 8080,
      ...(this.config && (Array.isArray(this.config) ? this.config[0].devServer : this.config.devServer)),
    };
    if (devServerOption.stats === undefined) {
      devServerOption.stats = {
        cached: false,
        cachedAssets: false,
        colors: isSupportColor,
      } as any;
    }
    startDevServer(this.config || {}, devServerOption);
  }
}

export namespace ModuleWebpack {
  export interface IOptions {
    mode?: 'run' | 'watch' | 'devServer';
  }
  export type ConfigFileContent =
    | ((
        { context, options }: { context: string; options: object },
      ) => Webpack.Configuration | Webpack.Configuration[] | Promise<Webpack.Configuration | Webpack.Configuration[]>)
    | Webpack.Configuration
    | Webpack.Configuration[];
  export type SingleConfig = /* path to configFile */ string | ConfigFileContent;
  export type Config = [SingleConfig | SingleConfig[], IOptions | undefined];
}
