# nowa-module-script

## Module Config

```ts
export type SingleScript = string | (() => void | Promise<void>);
export interface IOptions {
  // all default false
  parallel?: boolean;
  noWait?: boolean;
  noRetrigger?: boolean;
}
export type Config = ['script', SingleScript | SingleScript[], IOptions];
```

## Usage

```js
const config1 = ['script', 'echo start'];
const config2 = ['script', ['rm -rf dist', 'mkdir dist']]; // multiple scripts
const config3 = ['script', ['rm -rf dist', 'rm -rf build'], { parallel: true }]; // with options
// no guarantee on script running orders , but less time-consuming probably

// be careful, shell scripts are not cross-platform
// you'd better perform file system operations with @nowa/module-file

const config4 = [
  'script',
  () => {
    // js script
    console.log('done');
  },
];
```

## noWait noRetrigger

consider this workflow

1. script `start`: [`echo start`, `<some time-consuming script>`]
1. webpack watch
1. script `end`: [`echo end`]

the first-run output should be something like

1. 'start'
1. `<running time-consuming script>`
1. `<webpack related output>`
1. 'end'

and when you trigger a recompile (change source file), these are append to the output

1. `<webpack recompile output>`
1. 'end'

### noWait: true

with `noWait` option on `start` script, the first output should be

1. 'start' + `<running time-consuming script>` + `<webpack output>`
1. 'end'

the next module `module-webpack` won't wait for the script to finish

### noRetrigger: true

with `noRetrigger` option on `end` script the recompile output should be

1. `<webpack recompile output>`

no 'end' output since it won't `retrigger`
