# `fs-teardown`

Teardown API for testing file system-dependent code.

## Getting started

```sh
$ npm install fs-teardown -D
# or
$ yan add fs-teardown -D
```

## API

### `createTeardown(options: CreateTeardownOptions): TeardownAPI`

Calling the `createTeardown` function returns you the API to create the specified file system structure and clean it up on demand.

```js
const api = createTeardown({
  rootDir: './example',
})
```

You can specify an optional `paths` property to describe an initial directory/file tree.

```js
createTeardown({
  rootDir: './example',
  paths: {
    'empty.txt': null,
    'file.txt': 'hello world',
    'src/hooks': {
      'useField.js': null,
    },
  },
})
```

> Providing a relative path to the `rootDir` creates the given path at the system's default directory for temporary files ([`os.tmpdir`](https://nodejs.org/api/os.html#ostmpdir)). Absolute paths are used as-is.

### `prepare(): Promise<string>`

Creates files and directories specified in the `operations` of the teardown. Returns a `Promise` that resolves once all the operations have been executed.

### `create(tree: FileTree): Promise<void>`

Creates a file tree relative to the root directory after the initial setup.

```js
const api = createTeardown({
  rootDir: './example',
})

await api.create({
  'file.txt': 'hello world',
  'directory/another-file.txt': 'hello to you',
})
```

### `resolve(...segments: string[]): string`

Returns an absolute path to the given file or directory relative to the `rootDir` of the teardown. Useful to reference a certain file or directory in the created file structure.

```js
const api = createTeardown({
  rootDir: './example',
  paths: {
    'file.txt': 'hello world',
  },
})

const filePath = api.resolve('file.txt')
// "/Users/admin/example/file.txt"
```

### `readFile(filePath: string, encoding?: BufferEncoding): Promise<Buffer | string>`

Reads a file at the given path.

By default, returns the `Buffer` of the read file. Provide the second `encoding` argument to convert the buffer to the given encoding.

```js
const api = createTeardown({
  rootDir: './example',
  paths: {
    'file.txt': 'hello world'
  }
})

// Read the "file.txt" content as Buffer.
const buffer = await api.readFile('file.txt')

// Read the "file.txt" content as text.
const text = await api.readFile('file.txt', 'utf8)
```

### `edit(filePath: string): Promise<void>`

Edits a file at the given path. Throws an error if the given file doesn't exist.

```js
const api = createTeardown({
  rootDir: './example',
  paths: {
    'file.txt': 'hello world',
  },
})

await api.edit('file.txt', 'welcome to the jungle')
```

### `exec(command: string, options: ExecOptions?): Promise<{ stdout, stderr }>`

Executes the given command in the mocked directory.

```js
const api = createTeardown({
  rootDir: 'exec',
})

// Initiates a new Git repository at the mocked directory.
await api.exec('git init')
```

### `reset(): Promise<void>`

Resets the root directory to its initial state.

```js
const api = createTeardown({
  rootDir: './example',
  paths: {
    'file.txt': 'hello world',
    'dir/nested.txt': null,
  },
})

// Runtime actions.
await api.edit('file.txt', 'welcome to the jungle')
await api.remove('dir')

await api.restore()
// - "file.txt" was restored to "hello world";
// - "dir" and "dir/nested.txt" were restored.
```

### `cleanup(): Promise<void>`

Removes the root directory of the teardown. Returns a `Promise` that resolves once the directory is removed.

```js
await api.cleanup()
```

## Recipes

### Empty file

```js
fsMocks.create({
  'filename.ext': null,
})
```

### Text file

```js
api.create({
  'file.txt': 'hello world',
})
```

### JSON file

```js
api.create({
  'file.json': JSON.stringify({ a: 1 }, null, 2),
})
```

> Note that the JSON file's content must be a string. Object values are treated as [nested files](#directory-with-multiple-files).

### Empty directory

```js
api.create({
  'empty-dir': null,
})
```

> Keys without extensions are treated as directories.

### Nested directories

```js
api.create({
  'one/to/three': null,
})
```

### Directory with multiple files

```js
api.create({
  'deeply/nested/directory': {
    'one.txt': 'first file',
    'two.txt': 'second file',
  },
})
```
