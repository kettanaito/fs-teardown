import * as fs from 'fs-extra'
import { fsTeardown } from '../src'

const api = fsTeardown({
  rootDir: 'remove',
  paths: {
    'file.txt': 'hello world',
    'empty-dir': null,
    'dir/nested.txt': null,
  },
})

beforeEach(async () => {
  await api.prepare()
})

afterEach(async () => {
  await api.cleanup()
})

it('removes an existing file', async () => {
  expect(fs.existsSync(api.resolve('file.txt'))).toEqual(true)

  await api.remove('file.txt')
  expect(fs.existsSync(api.resolve('file.txt'))).toEqual(false)
})

it('removes an existing empty directory', async () => {
  expect(fs.existsSync(api.resolve('empty-dir'))).toEqual(true)

  await api.remove('empty-dir')
  expect(fs.existsSync(api.resolve('empty-dir'))).toEqual(false)
})

it('removes an existing directory with files', async () => {
  expect(fs.existsSync(api.resolve('dir'))).toEqual(true)

  await api.remove('dir')
  expect(fs.existsSync(api.resolve('dir'))).toEqual(false)
})

it('throws an error when removing a non-existing file', async () => {
  await expect(api.remove('non-existing.txt')).rejects.toThrow(
    'Failed to remove the file at "non-existing.txt": file does not exist. Did you forget to call "create"?',
  )
})

it('throws an error when removing a non-existing directory', async () => {
  await expect(api.remove('non-existing')).rejects.toThrow(
    'Failed to remove the file at "non-existing": file does not exist. Did you forget to call "create"?',
  )
})
