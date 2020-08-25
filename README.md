# `fs-teardown`

Tear down a directory structure written to disk. Clean up afterwards.

## Getting started

```bash
npm install fs-teardown --save-dev
```

## API

### `createTeardown(baseDir, ...operations)`

#### `prepare()`

Creates files and directories specified in the `operations` of the teardown. Returns a `Promise` that resolves once all the operations have been executed.

#### `getPath(...segments)`

Returns an absolute path to the given file or directory relative to the `baseDir` of the teardown.

#### `cleanup()`

Removes the `baseDir` of the teardown. Returns a `Promise` that resolves ones the directory is removed.

### `addFile(filePath, content)`

Creates a file at the given path with optional content.

### `addDirectory(path, ...operations)`

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
