import { Module, utils } from '@nowa/core';
import { resolve } from 'path';
import * as Webpack from 'webpack';
import * as WebpackDevServer from 'webpack-dev-server';

export default class ModuleWebpack extends Module.Callback<ModuleWebpack.Config> {
  public $name = 'webpack';
  public mode: ModuleWebpack.IOptions['mode'];
  public compiler?: Webpack.Compiler;
  public getCompilerCallback?: (done: (error?: any) => void) => (err: any, stats: any) => void;
  public lastHash?: string;
  public server?: WebpackDevServer;
  public startDevServer?: (done: () => void) => void;
  public config?: Webpack.Configuration | Webpack.Configuration[];
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
      logger.debug(`find overwrite config is a object, send it to parser`);
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
    const firstConfig = finalConfigs[0];

    const autoMode = async () => {
      if (firstConfig.devServer) {
        this.mode = 'devServer';
        return this._initWebpackDevServer();
      } else if (firstConfig.watch) {
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
      }
      if (this.mode === 'watch') {
        const options = this.config!;
        const firstOptions: Webpack.Configuration = ([] as Webpack.Configuration[]).concat(options)[0];
        const watchOptions =
          firstOptions.watchOptions || (options as any).watchOptions || firstOptions.watch || (options as any).watch || {};
        if (watchOptions.stdin) {
          process.stdin.on('end', function(_) {
            process.exit(); // eslint-disable-line
          });
          process.stdin.resume();
        }
        this.compiler!.watch(watchOptions, this.getCompilerCallback!(done));
      } else {
        this.compiler!.run((err, stats) => {
          if ((this.compiler as any).close) {
            (this.compiler as any).close((err2: any) => {
              this.getCompilerCallback!(done)(err || err2, stats);
            });
          } else {
            this.getCompilerCallback!(done)(err, stats);
          }
        });
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
    // from webpack-cli
    // https://github.com/webpack/webpack/blob/master/bin/webpack.js
    // 3.3.10

    require('v8-compile-cache');
    const options = this.config!;

    const firstOptions: Webpack.Configuration = ([] as Webpack.Configuration[]).concat(options)[0];
    const statsPresetToOptions = require('webpack').Stats.presetToOptions;

    let outputOptions = (options as any).stats;
    if (typeof outputOptions === 'boolean' || typeof outputOptions === 'string') {
      outputOptions = statsPresetToOptions(outputOptions);
    } else if (!outputOptions) {
      outputOptions = {};
    }

    outputOptions = Object.create(outputOptions);
    if (Array.isArray(options) && !outputOptions.children) {
      outputOptions.children = options.map(o => o.stats);
    }
    if (typeof outputOptions.context === 'undefined') outputOptions.context = firstOptions.context;

    if (typeof outputOptions.colors === 'undefined') outputOptions.colors = require('supports-color').stdout;

    if (!outputOptions.json) {
      if (typeof outputOptions.cached === 'undefined') outputOptions.cached = false;
      if (typeof outputOptions.cachedAssets === 'undefined') outputOptions.cachedAssets = false;

      if (!outputOptions.exclude) outputOptions.exclude = ['node_modules', 'bower_components', 'components'];
    }

    const webpack = require('webpack');

    let lastHash: string | null = null;

    try {
      this.compiler = webpack(options);
    } catch (err) {
      if (err.name === 'WebpackOptionsValidationError') {
        if (outputOptions.colors) console.error(`\u001b[1m\u001b[31m${err.message}\u001b[39m\u001b[22m`);
        else console.error(err.message);
        // eslint-disable-next-line no-process-exit
        process.exit(1);
      }

      throw err;
    }
    this.getCompilerCallback = done => {
      return (err, stats) => {
        if (this.mode !== 'watch' || err) {
          // Do not keep cache anymore
          (this.compiler! as any).purgeInputFileSystem();
        }
        if (err) {
          lastHash = null;
          console.error(err.stack || err);
          if (err.details) console.error(err.details);
          process.exitCode = 1;
          return;
        } else if (stats.hash && stats.hash !== lastHash) {
          done();
        }
        if (outputOptions.json) {
          process.stdout.write(JSON.stringify(stats.toJson(outputOptions), null, 2) + '\n');
        } else if (stats.hash !== lastHash) {
          lastHash = stats.hash;
          if (stats.compilation && stats.compilation.errors.length !== 0) {
            const errors = stats.compilation.errors;
            if (errors[0].name === 'EntryModuleNotFoundError') {
              console.error('\n\u001b[1m\u001b[31mInsufficient number of arguments or no entry found.');
            }
          }
          const statsString = stats.toString(outputOptions);
          const delimiter = outputOptions.buildDelimiter ? `${outputOptions.buildDelimiter}\n` : '';
          if (statsString) process.stdout.write(`${statsString}\n${delimiter}`);
        }
        if (this.mode !== 'watch' && stats.hasErrors()) {
          process.exitCode = 2;
        }
      };
    };
  }

  private async _initWebpackDevServer(): Promise<void> {
    // from webpack-dev-server
    // https://github.com/webpack/webpack-dev-server/blob/master/bin/webpack-dev-server.js
    // 3.10.0
    const fs = require('fs');
    const net = require('net');
    const webpack = require('webpack');
    const Server = require('webpack-dev-server/lib/Server');
    const setupExitSignals = require('webpack-dev-server/lib/utils/setupExitSignals');
    const colors = require('webpack-dev-server/lib/utils/colors');
    const processOptions = require('webpack-dev-server/lib/utils/processOptions');
    const createLogger = require('webpack-dev-server/lib/utils/createLogger');
    await this._initWebpack();
    const serverData = {
      server: null,
    };

    setupExitSignals(serverData);
    const setOutputFilename = (c: Webpack.Configuration) => {
      if (!c.output) {
        c.output = { filename: '/bundle.js' };
      } else {
        c.output.filename = '/bundle.js';
      }
    };
    if (Array.isArray(this.config)) {
      this.config.forEach(setOutputFilename);
    } else {
      setOutputFilename(this.config!);
    }
    const config = this.config!;

    const startDevServer = (config: any, options: any) => {
      const log = createLogger(options);

      let compiler;

      try {
        compiler = webpack(config);
      } catch (err) {
        if (err instanceof webpack.WebpackOptionsValidationError) {
          log.error(colors.error(options.stats.colors, err.message));
          // eslint-disable-next-line no-process-exit
          process.exit(1);
        }

        throw err;
      }

      try {
        this.server = new Server(compiler, options, log);
        serverData.server = this.server as any;
      } catch (err) {
        if (err.name === 'ValidationError') {
          log.error(colors.error(options.stats.colors, err.message));
          // eslint-disable-next-line no-process-exit
          process.exit(1);
        }

        throw err;
      }

      const server = this.server as any;

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
        server.listen(options.port, options.host, (err: any) => {
          if (err) {
            throw err;
          }
        });
      }
    };
    return new Promise((resolve, reject) => {
      try {
        processOptions(config, {}, (config: any, options: any) => {
          this.startDevServer = function _startDevServer(done) {
            // TODO: DONE ?
            startDevServer(config, options);
          };
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });
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
