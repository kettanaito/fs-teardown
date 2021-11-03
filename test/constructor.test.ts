import { fsTeardown } from '../src'
import { isDirectory } from '../test/helpers/fs'

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
  expect(await api.read('empty.txt', 'utf8')).toEqual('')
})

it('creates a text file', async () => {
  expect(await api.read('text.txt', 'utf8')).toEqual('hello world')
})

it('creates an empty directory', async () => {
  expect(isDirectory(api.resolve('dir-empty'))).toEqual(true)
})

it('creates directory with files', async () => {
  expect(isDirectory(api.resolve('dir-nested'))).toEqual(true)

  expect(await api.read('dir-nested/one.txt', 'utf8')).toEqual('first')
  expect(await api.read('dir-nested/two.txt', 'utf8')).toEqual('second')
})

it('creates a deeply nested directory with files', async () => {
  expect(isDirectory(api.resolve('dir-deeply/nested/directory'))).toEqual(true)
  expect(
    await api.read('dir-deeply/nested/directory/with-file.txt', 'utf8'),
  ).toEqual('yes')
})

it('creates a deeply nested file', async () => {
  expect(isDirectory(api.resolve('dir-deeply/nested'))).toEqual(true)
  expect(await api.read('dir-deeply/nested/file.txt', 'utf8')).toEqual('yes')
})
