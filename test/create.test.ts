import { fsTeardown } from '../src'
import { isDirectory, read } from './helpers/fs'

const api = fsTeardown({
  rootDir: 'create',
})

beforeAll(async () => {
  await api.prepare()
})

afterAll(async () => {
  await api.cleanup()
})

it('creates a file with content', async () => {
  await api.create({
    'inject-file.txt': 'arbitrary content',
  })

  expect(read(api.resolve('inject-file.txt'))).toEqual('arbitrary content')
})

it('creates an empty directory', async () => {
  await api.create({
    'inject-dir': null,
  })

  expect(isDirectory(api.resolve('inject-dir'))).toEqual(true)
})

it('creates a directory with files', async () => {
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