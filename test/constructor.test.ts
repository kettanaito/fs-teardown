import { fsTeardown } from '../src'
import { isDirectory, read } from '../test/helpers/fs'

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
