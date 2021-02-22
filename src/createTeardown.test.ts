import { IFs } from 'memfs'
import { createTeardown, addFile, addDirectory } from './createTeardown'

const BASE_DIR = './tmp'

function getFileContent(fs: IFs, path: string): string {
  const content = fs.readFileSync(path, 'utf8').toString()

  try {
    const result = JSON.parse(content)
    return result
  } catch (error) {
    return content
  }
}

test('creates a single empty file', async () => {
  const { fs, prepare, cleanup, getPath } = createTeardown(
    BASE_DIR,
    addFile('file.txt'),
  )
  await prepare()

  expect(fs.existsSync(getPath('file.txt'))).toBe(true)
  expect(getFileContent(fs, getPath('file.txt'))).toBe('')

  cleanup()
})

test('creates a single file with a text content', async () => {
  const { fs, prepare, cleanup, getPath } = createTeardown(
    BASE_DIR,
    addFile('example.txt', 'text-content'),
  )
  await prepare()

  expect(fs.existsSync(getPath('example.txt'))).toBe(true)
  expect(getFileContent(fs, getPath('example.txt'))).toEqual('text-content')

  cleanup()
})

test('creates a single file with a JSON content', async () => {
  const { fs, prepare, cleanup, getPath } = createTeardown(
    BASE_DIR,
    addFile('example.json', { key: 'value' }),
  )
  await prepare()

  expect(fs.existsSync(getPath('example.json'))).toBe(true)
  expect(getFileContent(fs, getPath('example.json'))).toEqual({ key: 'value' })

  cleanup()
})

test('creates multiple files', async () => {
  const { fs, prepare, cleanup, getPath } = createTeardown(
    BASE_DIR,
    addFile('first.txt', 'first-content'),
    addFile('second.txt', 'second-content'),
  )
  await prepare()

  expect(fs.existsSync(getPath('first.txt'))).toBe(true)
  expect(fs.existsSync(getPath('second.txt'))).toBe(true)
  expect(getFileContent(fs, getPath('first.txt'))).toEqual('first-content')
  expect(getFileContent(fs, getPath('second.txt'))).toEqual('second-content')

  cleanup()
})

test('creates an empty directory', async () => {
  const { fs, prepare, cleanup, getPath } = createTeardown(
    BASE_DIR,
    addDirectory('dir'),
  )
  await prepare()

  expect(fs.existsSync(getPath('.'))).toBe(true)

  cleanup()
})

test('creates a directory with files in it', async () => {
  const { fs, prepare, cleanup, getPath } = createTeardown(
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
  expect(getFileContent(fs, getPath('dir/empty.txt'))).toBe('')
  expect(getFileContent(fs, getPath('dir/with-content.txt'))).toBe('content')

  cleanup()
})

test('creates a nested directory with files', async () => {
  const { fs, prepare, cleanup, getPath } = createTeardown(
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
  expect(getFileContent(fs, getPath('nested/dir/example/empty.txt'))).toBe('')
  expect(
    getFileContent(fs, getPath('nested/dir/example/with-content.txt')),
  ).toBe('content')

  cleanup()
})

test('edits a given file', async () => {
  const { fs, prepare, cleanup, getPath, editFile } = createTeardown(
    BASE_DIR,
    addDirectory('edit', addFile('list.txt')),
  )
  await prepare()

  editFile('edit/list.txt', 'buy milk')
  expect(getFileContent(fs, getPath('edit/list.txt'))).toBe('buy milk')

  cleanup()
})

test('removes a given file', async () => {
  const { fs, prepare, cleanup, getPath, removeFile } = createTeardown(
    BASE_DIR,
    addDirectory('remove-file', addFile('one.txt'), addFile('two.txt')),
  )
  await prepare()

  removeFile('remove-file/two.txt')
  expect(fs.existsSync(getPath('remove-file/two.txt'))).toBe(false)
  expect(fs.existsSync(getPath('remove-file/one.txt'))).toBe(true)

  cleanup()
})
