# `fs-teardown`

Tear down a file tree written to disk, clean up afterward.

## Getting started

```sh
$ npm install fs-teardown -D
# or
$ yan add fs-teardown -D
```

## API

### `fsTeardown(options: TeardownOptions): TeardownAPI`

Calling the `fsTeardown` function returns you a control API to create the specified file system structure and clean it up on demand.

```js
const fsMock = fsTeardown({ rootDir: './tmp' })
```

You can specify an optional `paths` property to create an initial file tree.

```js
fsTeardown({
  rootDir: './tmp',
  paths: {
    'empty.txt': null,
    'file.txt': 'hello world',
    'src/hooks': {
      'useField.js': null,
    },
  },
})
```

### `prepare(): Promise<string[]>`

Creates files and directories specified in the `operations` of the teardown. Returns a `Promise` that resolves once all the operations have been executed.

### `create(tree: FileTree): Promise<void>`

Creates a file tree relative to the root directory after the initial setup.

```js
const fsMock = fsTeardown({ rootDir: './tmp' })

await fsMock.create({
  'file.txt': 'hello world',
  'directory/another-file.txt': 'hello to you',
})
```

### `resolve(...segments: string[]): string`

Returns an absolute path to the given file or directory relative to the `rootDir` of the teardown. Useful to reference a certain file or directory in the created file structure.

```js
const fsMock = fsTeardown({
  rootDir: './root-dir',
  paths: {
    'file.txt': 'hello world',
  },
})

const filePath = fsMock.resolve('file.txt')
// "/Users/admin/root-dir/file.txt"
```

### `edit(filePath: string): Promise<void>`

Edits a file at the given path. Throws an error if the given file doesn't exist.

```js
const fsMock = fsTeardown({
  rootDir: './example',
  paths: {
    'file.txt': 'hello world',
  },
})

await fsMock.edit('file.txt', 'welcome to the jungle')
```

### `reset(): Promise<void>`

Resets the root directory to its initial state.

```js
const fsMock = fsTeardown({
  rootDir: './example',
  paths: {
    'file.txt': 'hello world',
    'dir/nested.txt': null,
  },
})

// Runtime actions.
await fsMock.edit('file.txt', 'welcome to the jungle')
await fsMock.remove('dir')

await fsMock.restore()
// - "file.txt" was restored to "hello world";
// - "dir" and "dir/nested.txt" were restored.
```

### `cleanup(): Promise<void>`

Removes the root directory of the teardown. Returns a `Promise` that resolves once the directory is removed.

```js
await fsMock.cleanup()
```

## Recipes

### Create empty file

```js
fsMocks.create({
  'filename.ext': null,
})
```

### Create file with text content

```js
fsMock.create({
  'file.txt': 'hello world',
})
```

### Create file with JSON content

```js
fsMock.create({
  'file.json': JSON.stringify({ a: 1 }, null, 2),
})
```

### Create empty directory

```js
fsMock.create({
  'empty-dir': null,
})
```

> Keys without extensions are treated as directories.

### Create nested directories

```js
fsMock.create({
  'one/to/three': null,
})
```

### Create directory with multiple files

```js
fsMock.create({
  'deeply/nested/directory': {
    'one.txt': 'first file',
    'two.txt': 'second file',
  },
})
```
