import * as fs from 'fs-extra'
import { fsTeardown } from './fsTeardown'

function read(filePath: string) {
  return fs.readFileSync(filePath).toString('utf8')
}

function isDirectory(path: string): boolean {
  return fs.statSync(path).isDirectory()
}

const api = fsTeardown({
  rootDir: 'tmp',
  paths: {
    'empty.txt': null,
    'text.txt': 'hello world',
    'dir-empty': null,
    'dir-nested': {
      'one.txt': 'first',
      'two.txt': 'second',
    },
    'dir-deeply/nested/directory': {
      'with-file.txt': 'yes',
    },
    'dir-deeply/nested/file.txt': 'yes',
  },
})

beforeAll(async () => {
  await api.prepare()
})

afterAll(async () => {
  await api.cleanup()
})

it('creates an empty file', async () => {
  expect(read(api.resolve('empty.txt'))).toEqual('')
})

it('creates a text file', async () => {
  expect(read(api.resolve('text.txt'))).toEqual('hello world')
})

it('creates an empty directory', async () => {
  expect(isDirectory(api.resolve('dir-empty'))).toEqual(true)
})

it('creates directory with files', async () => {
  expect(isDirectory(api.resolve('dir-nested'))).toEqual(true)

  expect(read(api.resolve('dir-nested/one.txt'))).toEqual('first')
  expect(read(api.resolve('dir-nested/two.txt'))).toEqual('second')
})

it('creates a deeply nested directory with files', async () => {
  expect(isDirectory(api.resolve('dir-deeply/nested/directory'))).toEqual(true)
  expect(
    read(api.resolve('dir-deeply/nested/directory/with-file.txt')),
  ).toEqual('yes')
})

it('creates a deeply nested file', async () => {
  expect(isDirectory(api.resolve('dir-deeply/nested'))).toEqual(true)
  expect(read(api.resolve('dir-deeply/nested/file.txt'))).toEqual('yes')
})

/**
 * Create files/directories on runtime.
 */
describe('.create()', () => {
  it('can inject a file on runtime', async () => {
    await api.create({
      'inject-file.txt': 'arbitrary content',
    })

    expect(read(api.resolve('inject-file.txt'))).toEqual('arbitrary content')
  })

  it('can inject an empty directory on runtime', async () => {
    await api.create({
      'inject-dir': null,
    })

    expect(isDirectory(api.resolve('inject-dir'))).toEqual(true)
  })

  it('can inject a directory with files on runtime', async () => {
    await api.create({
      'inject-nested': {
        '1.txt': 'one',
        '2.txt': 'two',
      },
    })

    expect(isDirectory(api.resolve('inject-nested'))).toEqual(true)
    expect(read(api.resolve('inject-nested/1.txt'))).toEqual('one')
    expect(read(api.resolve('inject-nested/2.txt'))).toEqual('two')
  })
})

describe('.edit()', () => {
  it('edits a given file', async () => {
    await api.create({ 'edit-me.txt': 'some' })
    await api.edit('edit-me.txt', 'another')
    expect(read(api.resolve('edit-me.txt'))).toEqual('another')
  })

  it('throws an exception when editing a non-existing file', async () => {
    await expect(api.edit('non-existing.txt', 'no-op')).rejects.toThrowError(
      'Failed to edit the file at "non-existing.txt": file does not exist. Did you forget to call "create"?',
    )
  })
})

describe('.remove()', () => {
  it('removes a given file', async () => {
    await api.create({ 'remove-me.txt': 'yes' })
    expect(read(api.resolve('remove-me.txt'))).toEqual('yes')

    await api.remove('remove-me.txt')
    expect(fs.existsSync(api.resolve('remove-me.txt'))).toEqual(false)
  })

  it('throws an exception when removing a non-existing file', async () => {
    await expect(api.remove('non-existing.txt')).rejects.toThrowError(
      'Failed to remove the file at "non-existing.txt": file does not exist. Did you forget to call "create"?',
    )
  })
})
