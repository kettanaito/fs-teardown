# `fs-teardown`

Tear down a directory structure written to disk. Clean up afterwards.

## Getting started

```bash
npm install fs-teardown --save-dev
```

## API

### `createTeardown(baseDir: string, ...operations: TeardownOperation[]): TeardownControls`

Running the `createTeardown` function returns you a control API to create the specified file system structure and clean it up on demand.

#### `prepare(): Promise<string[]>`

Creates files and directories specified in the `operations` of the teardown. Returns a `Promise` that resolves once all the operations have been executed.

#### `getPath(...segments: string[]): string`

Returns an absolute path to the given file or directory relative to the `baseDir` of the teardown. Useful to reference a certain file or directory in the created setup.

```js
const { getPath } = createTeardown('base-dir', withFile('my-file.json'))

const jsonFilePath = getPath('my-file.json')
// "/Users/admin/base-dir/my-file.json"
```

#### `cleanup(): Promise<void>`

Removes the `baseDir` of the teardown. Returns a `Promise` that resolves once the directory is removed.

### `addFile(filePath: string, content?: string | Record<string, any>): Promise<string>`

Creates a file at the given path with optional content.

### `addDirectory(path: string, ...operations: TeardownOperation[]): Promise<string>`

Created a directory with optional operations to execute in it (i.e. create nested directories and files).

## Recipes

### Create empty file

```js
import { createTeardown, addFile } from 'fs-teardown'

const { prepare } = createTeardown('.', addFile('filename.ext'))

prepare()
```

### Create file with text content

```js
import { createTeardown, addFile } from 'fs-teardown'

const { prepare } = createTeardown('.', addFile('example.txt', 'text-content'))

prepare()
```

### Create file with JSON content

```js
import { createTeardown, addFile } from 'fs-teardown'

const { prepare } = createTeardown(
  '.',
  addFile('example.json', { key: 'value' }),
)

prepare()
```

### Create empty directory

```js
import { createTeardown, addDirectory } from 'fs-teardown'

const { prepare } = createTeardown('.', addDirectory('dirname'))

prepare()
```

### Create nested directories

```js
import { createTeardown, addDirectory } from 'fs-teardown'

const { prepare } = createTeardown(
  '.',
  addDirectory('parent/child/another-child'),
)

prepare()
```

### Create directory with files

```js
import { createTeardown, addDirectory } from 'fs-teardown'

const { prepare } = createTeardown(
  '.',
  addDirectory(
    'dirname',
    addFile('child-file.txt', 'content'),
    addFile('another-child.json', { key: 'value' }),
  ),
)

prepare()
```

### Clean up

```js
import { createTeardown } from 'fs-teardown'

const { prepare, cleanup } = createTeardown('.', operations)

prepare()

// Cleans up everything that has been created.
cleanup()
```
