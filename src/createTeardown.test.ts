import * as fs from 'fs'
import * as path from 'path'
import { createTeardown, addFile, addDirectory } from './createTeardown'

const BASE_DIR = './tmp'

function getFileContent(path: string): string {
  const content = fs.readFileSync(path, 'utf8')

  try {
    const result = JSON.parse(content)
    return result
  } catch (error) {
    return content
  }
}

test('creates a single empty file', async () => {
  const { prepare, cleanup, getPath } = createTeardown(
    BASE_DIR,
    addFile('file.txt'),
  )
  await prepare()

  expect(fs.existsSync(getPath('file.txt'))).toBe(true)
  expect(getFileContent(getPath('file.txt'))).toBe('')

  await cleanup()
})

test('creates a single file with a text content', async () => {
  const { prepare, cleanup, getPath } = createTeardown(
    BASE_DIR,
    addFile('example.txt', 'text-content'),
  )
  await prepare()

  expect(fs.existsSync(getPath('example.txt'))).toBe(true)
  expect(getFileContent(getPath('example.txt'))).toEqual('text-content')

  await cleanup()
})

test('creates a single file with a JSON content', async () => {
  const { prepare, cleanup, getPath } = createTeardown(
    BASE_DIR,
    addFile('example.json', { key: 'value' }),
  )
  await prepare()

  expect(fs.existsSync(getPath('example.json'))).toBe(true)
  expect(getFileContent(getPath('example.json'))).toEqual({ key: 'value' })

  await cleanup()
})

test('creates a single file using the "addFile" API', async () => {
  const { prepare, addFile, getPath, cleanup } = createTeardown(BASE_DIR)
  await prepare()
  expect(fs.existsSync(getPath('file.txt'))).toBe(false)

  await addFile('file.txt')
  expect(fs.existsSync(getPath('file.txt'))).toBe(true)

  await cleanup()
})

test('creates multiple files', async () => {
  const { prepare, cleanup, getPath } = createTeardown(
    BASE_DIR,
    addFile('first.txt', 'first-content'),
    addFile('second.txt', 'second-content'),
  )
  await prepare()

  expect(fs.existsSync(getPath('first.txt'))).toBe(true)
  expect(fs.existsSync(getPath('second.txt'))).toBe(true)
  expect(getFileContent(getPath('first.txt'))).toEqual('first-content')
  expect(getFileContent(getPath('second.txt'))).toEqual('second-content')

  await cleanup()
})

test('creates an empty directory', async () => {
  const { prepare, cleanup, getPath } = createTeardown(
    BASE_DIR,
    addDirectory('dir'),
  )
  await prepare()

  expect(fs.existsSync(getPath('.'))).toBe(true)

  await cleanup()
})

test('creates a directory with files in it', async () => {
  const { prepare, cleanup, getPath } = createTeardown(
    BASE_DIR,
    addDirectory(
      'dir',
      addFile('empty.txt'),
      addFile('with-content.txt', 'content'),
    ),
  )
  await prepare()

  expect(fs.existsSync(getPath('.'))).toBe(true)
  expect(fs.existsSync(getPath('dir/empty.txt')))
  expect(fs.existsSync(getPath('dir/with-content.txt')))
  expect(getFileContent(getPath('dir/empty.txt'))).toBe('')
  expect(getFileContent(getPath('dir/with-content.txt'))).toBe('content')

  await cleanup()
})

test('creates a nested directory with files', async () => {
  const { prepare, cleanup, getPath } = createTeardown(
    BASE_DIR,
    addDirectory(
      'nested/dir/example',
      addFile('empty.txt'),
      addFile('with-content.txt', 'content'),
    ),
  )
  await prepare()

  expect(fs.existsSync(getPath('.'))).toBe(true)
  expect(fs.existsSync(getPath('nested/dir/example/empty.txt')))
  expect(fs.existsSync(getPath('nested/dir/example/with-content.txt')))
  expect(getFileContent(getPath('nested/dir/example/empty.txt'))).toBe('')
  expect(getFileContent(getPath('nested/dir/example/with-content.txt'))).toBe(
    'content',
  )

  await cleanup()
})

test('edits a given file', async () => {
  const { prepare, cleanup, getPath, editFile } = createTeardown(
    BASE_DIR,
    addDirectory('edit', addFile('list.txt')),
  )
  await prepare()

  editFile('edit/list.txt', 'buy milk')
  expect(getFileContent(getPath('edit/list.txt'))).toBe('buy milk')

  await cleanup()
})

test('removes a given file', async () => {
  const { prepare, cleanup, getPath, removeFile } = createTeardown(
    BASE_DIR,
    addDirectory('remove-file', addFile('one.txt'), addFile('two.txt')),
  )
  await prepare()

  removeFile('remove-file/two.txt')
  expect(fs.existsSync(getPath('remove-file/two.txt'))).toBe(false)
  expect(fs.existsSync(getPath('remove-file/one.txt'))).toBe(true)

  await cleanup()
})

test('supports absolute "baseDir" path', async () => {
  const absolutePath = path.resolve(__dirname, 'tmp')
  const { prepare, getPath, cleanup } = createTeardown(
    absolutePath,
    addFile('file.txt'),
  )
  await prepare()

  expect(fs.existsSync(getPath('file.txt'))).toBe(true)

  await cleanup()
})
