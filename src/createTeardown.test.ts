import * as fs from 'fs'
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
