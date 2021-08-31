import { fsTeardown } from '../src'
import { read } from './helpers/fs'

const api = fsTeardown({
  rootDir: 'edit',
  paths: {
    'file.txt': 'hello world',
  },
})

beforeAll(async () => {
  await api.prepare()
})

afterAll(async () => {
  await api.cleanup()
})

it('edits an existing file', async () => {
  expect(read(api.resolve('file.txt'))).toEqual('hello world')

  await api.edit('file.txt', 'hello universe')
  expect(read(api.resolve('file.txt'))).toEqual('hello universe')
})

it('edits a newly created file', async () => {
  await api.create({ 'edit-me.txt': 'some' })
  await api.edit('edit-me.txt', 'another')
  expect(read(api.resolve('edit-me.txt'))).toEqual('another')
})

it('throws an exception when editing a non-existing file', async () => {
  await expect(api.edit('non-existing.txt', 'no-op')).rejects.toThrowError(
    'Failed to edit the file at "non-existing.txt": file does not exist. Did you forget to call "create"?',
  )
})