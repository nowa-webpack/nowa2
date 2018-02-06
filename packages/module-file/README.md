# nowa-module-file

## Module Config

```ts
export interface IBaseAction {
  type: 'copy' | 'move' | 'remove' | 'empty' | 'ensure';
  from: string;
}
export interface ISingleArgAction extends IBaseAction {
  type: 'remove' | 'empty' | 'ensure';
}
export interface IDoubleArgAction extends IBaseAction {
  type: 'copy' | 'move';
  to: string;
}
export type SingleAction = ISingleArgAction | IDoubleArgAction;

export type Config = ['file', SingleAction | SingleAction[]];
```

## Usage

```js
const config1 = ['file', { type: 'copy', from: './src/lib/', to: './dist/' }]; // copy files
const config2 = ['file', { type: 'copy', from: './src/lib/*.js', to: './dist/' }]; // support glob
const config3 = ['file', { type: 'empty', from: './build/' }]; // empty a folder
const config4 = ['file', { type: 'ensure', from: './build/assets/js/' }]; // ensure a path
const config5 = ['file', { type: 'move', from: './build/index.js', to: './build/entry.js' }]; // move (rename) a file
const config6 = ['file', [{ type: 'remove', from: './build/' }, { type: 'remove', from: './dist/' }]]; // multiple actions
```

## Actions

`module-file` provides 5 kinds of actions

* `copy` copy files or folders
* `move` move files or folders
* `remove` delete files or folders
* `empty` empty folders
* `ensure` ensure a path is valid, create any folder if needed

some actions can have `to` property.

## Action.from

`from` can be a normal path or path with glob patterns, `module-webpack` uses [globby](https://www.npmjs.com/package/globby) to resolve them;

relative paths will be treated from `project root` (actually `context` in `nowa2`).

## Action.to

`to` can only be used in action `copy` & `move`.

**Caution, If you want to specify a folder, always add a slash `/` to the end. Or it will be treaded as a file**

### Example

if you have a project with a file `file.js`

```
└── file.js
```

with config `{ type: 'copy', from: './file.js', to: './dist' }`, it will be

```
├── dist          ---- file, content same as file.js
└── file.js
```

with config `{ type: 'copy', from: './file.js', to: './dist/' }`, it will be

```
├── dist          ---- folder
│   └── file.js   ---- file
└── file.js
```
