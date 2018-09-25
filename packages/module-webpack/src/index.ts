import { Module, utils } from '@nowa/core';
import { AddressInfo, Server } from 'net';
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
    const { logger } = this.$utils;
    // from webpack-dev-server
    // https://github.com/webpack/webpack-dev-server/blob/master/bin/webpack-dev-server.js
    // 2.11.1
    const fs = require('fs');
    const net = require('net');
    const open = require('opn'); // tslint:disable-line
    const portfinder = require('portfinder'); // tslint:disable-line
    let addDevServerEntrypoints: any;
    try {
      addDevServerEntrypoints = require('webpack-dev-server/lib/util/addDevServerEntrypoints'); // tslint:disable-line
    } catch (e) {
      addDevServerEntrypoints = require('webpack-dev-server/lib/util/addEntries'); // tslint:disable-line
    }
    const createDomain = require('webpack-dev-server/lib/util/createDomain'); // tslint:disable-line
    function colorInfo(useColor: boolean, msg: string) {
      if (useColor) {
        // Make text blue and bold, so it *pops*
        return `\u001b[1m\u001b[34m${msg}\u001b[39m\u001b[22m`;
      }
      return msg;
    }
    function colorError(useColor: boolean, msg: string) {
      if (useColor) {
        // Make text red and bold, so it *pops*
        return `\u001b[1m\u001b[31m${msg}\u001b[39m\u001b[22m`;
      }
      return msg;
    }
    function reportReadiness(options: any, listeningApp: Server, suffix: string) {
      const { address, family, port } = listeningApp.address() as AddressInfo;
      if (family !== 'IPv4') {
        console.warn(`[Network] Using family ${family}`);
      }
      const protocol = options.https ? 'https:' : 'http:';
      const localhostURI = `${protocol}//127.0.0.1:${port}${suffix}`;
      const useColor = isSupportColor;
      const contentBase = Array.isArray(options.contentBase) ? options.contentBase.join(', ') : options.contentBase;
      if (!options.quiet) {
        let startSentence =
          address === '127.0.0.1' // 当 host 设置为 127.0.0.1 和 localhost，都为 127.0.0.1
            ? `Project is running at\n\n\t- ${colorInfo(useColor, localhostURI)}\n`
            : `Project is running at\n\n\t- ${colorInfo(useColor, localhostURI)}\n\t- ${colorInfo(
                useColor,
                createDomain(
                  {
                    ...options,
                    useLocalIp: true,
                  },
                  listeningApp,
                ) + suffix,
              )}\n`;
        if (options.socket) {
          startSentence = `Listening to socket at ${colorInfo(useColor, options.socket)}`;
        }
        logger.info((options.progress ? '\n' : '') + startSentence);
        logger.debug(`webpack output is served from ${colorInfo(useColor, options.publicPath)}`);
        if (contentBase) {
          logger.debug(`Content not from webpack is served from ${colorInfo(useColor, contentBase)}`);
        }
        if (options.historyApiFallback) {
          logger.debug(`404s will fallback to ${colorInfo(useColor, options.historyApiFallback.index || '/index.html')}`);
        }
        if (options.bonjour) {
          logger.debug('Broadcasting "http" with subtype of "webpack" via ZeroConf DNS (Bonjour)');
        }
      }
      if (options.open) {
        let openOptions = {};
        let openMessage = 'Unable to open browser';
        if (typeof options.open === 'string') {
          openOptions = { app: options.open };
          openMessage += `: ${options.open}`;
        }
        open(localhostURI + (options.openPage || ''), openOptions).catch(() => {
          logger.info(`${openMessage}. If you are running in a headless environment, please do not use the open flag.`);
        });
      }
    }

    function broadcastZeroconf(options: any) {
      const bonjour = require('bonjour')(); // tslint:disable-line
      bonjour.publish({
        name: 'Webpack Dev Server',
        port: options.port,
        subtypes: ['webpack'],
        type: 'http',
      });
      process.on('exit', () => {
        bonjour.unpublishAll(() => {
          bonjour.destroy();
        });
      });
    }
    const DEFAULT_PORT = 8080;
    const webpackOptions = this.config!;
    const options = this.firstConfig!.devServer || {};
    if (!options.publicPath) {
      // eslint-disable-next-line
      options.publicPath = (this.firstConfig!.output && this.firstConfig!.output!.publicPath) || '';
      if (!/^(https?:)?\/\//.test(options.publicPath) && options.publicPath[0] !== '/') {
        options.publicPath = `/${options.publicPath}`;
      }
    }
    if (!options.filename) {
      options.filename = this.firstConfig!.output && this.firstConfig!.output!.filename;
    }
    if (!options.watchOptions) {
      options.watchOptions = this.firstConfig!.watchOptions;
    }
    if (!options.stats) {
      (options.stats as any) = {
        cached: false,
        cachedAssets: false,
      };
    }
    if (typeof options.stats === 'object' && typeof (options.stats as any).colors === 'undefined') {
      (options.stats as any) = { ...options.stats, colors: isSupportColor };
    }
    if (options.open && !options.openPage) {
      options.openPage = '';
    }
    if (!options.port) {
      await new Promise(resolve => {
        portfinder.basePort = DEFAULT_PORT;
        portfinder.getPort((err: any, port: number) => {
          if (err) {
            throw err;
          }
          options.port = port;
          resolve();
        });
      });
    }
    // defaults from yargs
    if (options.inline == null) {
      options.inline = true;
    }
    if (options.host == null) {
      options.host = 'localhost';
    }
    this.startDevServer = async (done: () => void) => {
      addDevServerEntrypoints(webpackOptions, options);
      await this._initWebpack();
      if ((options as any).progress) {
        this.compiler!.apply(new Webpack.ProgressPlugin());
      }
      const donePromise = new Promise(resolve => {
        this.compiler!.plugin('done', () => {
          if (!this.alreadyOpen) {
            reportReadiness(options, (this.server as any).listeningApp, suffix);
            this.alreadyOpen = true;
          }
          done();
          resolve();
        });
      });
      const suffix = options.inline !== false || options.lazy === true ? '/' : '/webpack-dev-server/';
      try {
        this.server = new WebpackDevServer(this.compiler!, options);
      } catch (e) {
        if (e.name === 'WebpackDevServerOptionsValidationError') {
          console.error(colorError(isSupportColor, e.message));
        }
        throw e;
      }
      ['SIGINT', 'SIGTERM'].forEach(sig => {
        process.on(sig as 'SIGINT' | 'SIGTERM', () => {
          this.server!.close(() => {
            process.exit();
          });
        });
      });
      if (options.socket) {
        (this.server as any).listeningApp.on('error', (e: any) => {
          if (e.code === 'EADDRINUSE') {
            const clientSocket = new net.Socket();
            clientSocket.on('error', (clientError: any) => {
              if (clientError.code === 'ECONNREFUSED') {
                // No other server listening on this socket so it can be safely removed
                fs.unlinkSync(options.socket);
                this.server!.listen(options.socket as any, options.host as any, err => {
                  if (err) {
                    throw err;
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
        this.server.listen(options.socket as any, options.host as any, err => {
          if (err) {
            throw err;
          }
          // chmod 666 (rw rw rw)
          const READ_WRITE = 438;
          fs.chmod(options.socket, READ_WRITE, (fsError: any) => {
            if (fsError) {
              throw fsError;
            }
          });
        });
      } else {
        this.server.listen(options.port as any, options.host as any, err => {
          if (err) {
            throw err;
          }
          if (options.bonjour) {
            broadcastZeroconf(options);
          }
        });
      }
      await donePromise;
    };
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
