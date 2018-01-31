# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

<a name="0.4.1"></a>
## [0.4.1](https://github.com/nowa-webpack/nowa2/compare/@nowa/core@0.4.0...@nowa/core@0.4.1) (2018-01-31)


### Bug Fixes

* **loadModules:** checkIsNowaModule always return false ([d2e692e](https://github.com/nowa-webpack/nowa2/commit/d2e692e))
* ctrl+c exits with code 1 ([e48a47f](https://github.com/nowa-webpack/nowa2/commit/e48a47f))
* logger output issue ([3901fdf](https://github.com/nowa-webpack/nowa2/commit/3901fdf))




<a name="0.4.0"></a>
# [0.4.0](https://github.com/nowa-webpack/nowa2/compare/@nowa/core@0.3.0...@nowa/core@0.4.0) (2018-01-18)


### Bug Fixes

* **types:** type errors ([dcc040f](https://github.com/nowa-webpack/nowa2/commit/dcc040f))


### Features

* **loadModules:** check if module is a nowa module before instantiate it ([7c62b24](https://github.com/nowa-webpack/nowa2/commit/7c62b24))
* **utils:** parser supports providing a string to set alias ([de8032c](https://github.com/nowa-webpack/nowa2/commit/de8032c))
* add utils definition ([5c75cc3](https://github.com/nowa-webpack/nowa2/commit/5c75cc3))
* export IUtils as Runner.Utils ([144d3be](https://github.com/nowa-webpack/nowa2/commit/144d3be))
* pass utils to modules / plugins ([7d3c0ed](https://github.com/nowa-webpack/nowa2/commit/7d3c0ed))
* support prompt option ([04a8b9c](https://github.com/nowa-webpack/nowa2/commit/04a8b9c))
* warn if nowa command is elevated ([d734a42](https://github.com/nowa-webpack/nowa2/commit/d734a42))




<a name="0.3.0"></a>
# [0.3.0](https://github.com/nowa-webpack/nowa2/compare/@nowa/core@0.2.0...@nowa/core@0.3.0) (2018-01-04)


### Bug Fixes

* **core:** ISolution should always contain a commands property ([13dc3bb](https://github.com/nowa-webpack/nowa2/commit/13dc3bb))
* **core/utils:** infinite loop issue on parser ([cd9991a](https://github.com/nowa-webpack/nowa2/commit/cd9991a))
* **core/utils:** parser doesn't continue traveling ([3e2eccf](https://github.com/nowa-webpack/nowa2/commit/3e2eccf))


### Features

* **core/utils:** add requireFile function ([6fa765d](https://github.com/nowa-webpack/nowa2/commit/6fa765d))
* **core/utils:** requireFile silently returns undefined when target file cannot be accessed ([5ab1253](https://github.com/nowa-webpack/nowa2/commit/5ab1253))
* **core/utils:** use __esModule to detect ES modules ([84fc39a](https://github.com/nowa-webpack/nowa2/commit/84fc39a))




<a name="0.2.0"></a>
# 0.2.0 (2018-01-01)


### Features

* **core:** [@nowa](https://github.com/nowa)/core @ 0.2.0 ([16bfb04](https://github.com/nowa-webpack/nowa2/commit/16bfb04))
* **core/module:** add moduleOption generics type ([a4d1436](https://github.com/nowa-webpack/nowa2/commit/a4d1436))
