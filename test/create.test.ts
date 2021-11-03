import { fsTeardown } from '../src'
import { isDirectory } from './helpers/fs'

const api = fsTeardown({
  rootDir: 'create',
})

beforeAll(async () => {
  await api.prepare()
})

afterAll(async () => {
  await api.cleanup()
})

it('creates an empty file', async () => {
  await api.create({ 'empty-file.txt': null })

  expect(await api.read('empty-file.txt', 'utf8')).toEqual('')
})

it('creates a dot-file', async () => {
  await api.create({ '.eslintrc': null })

  expect(isDirectory(api.resolve('.eslintrc'))).toEqual(false)
  expect(await api.read('.eslintrc', 'utf8')).toEqual('')
})

it('creates a file with content', async () => {
  await api.create({
    'inject-file.txt': 'arbitrary content',
  })

  expect(await api.read('inject-file.txt', 'utf8')).toEqual('arbitrary content')
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
  expect(await api.read('inject-nested/1.txt', 'utf8')).toEqual('one')
  expect(await api.read('inject-nested/2.txt', 'utf8')).toEqual('two')
})
