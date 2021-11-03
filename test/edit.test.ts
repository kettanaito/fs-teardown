import { fsTeardown } from '../src'

const api = fsTeardown({
  rootDir: 'edit',
  paths: {
    'file.txt': 'hello world',
  },
})

beforeAll(async () => {
  await api.prepare()
})

afterEach(async () => {
  await api.reset()
})

afterAll(async () => {
  await api.cleanup()
})

it('edits an existing file', async () => {
  expect(await api.read('file.txt', 'utf8')).toEqual('hello world')

  await api.edit('file.txt', 'hello universe')
  expect(await api.read('file.txt', 'utf8')).toEqual('hello universe')
})

it('edits a newly created file', async () => {
  await api.create({ 'edit-me.txt': 'some' })
  await api.edit('edit-me.txt', 'another')
  expect(await api.read('edit-me.txt', 'utf8')).toEqual('another')
})

it('throws an exception when editing a non-existing file', async () => {
  await expect(api.edit('non-existing.txt', 'no-op')).rejects.toThrow(
    'Failed to edit the file at "non-existing.txt": file does not exist. Did you forget to call "create"?',
  )
})

it('throws an exception when given a directory', async () => {
  await api.create({ dir: null })
  await expect(api.edit('dir', 'no-op')).rejects.toThrow(
    'Failed to edit the file at "dir": given path is a directory.',
  )
})
