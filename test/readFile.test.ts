import * as fs from 'fs'
import { fsTeardown } from '../src'

const api = fsTeardown({
  rootDir: 'read',
  paths: {
    'file.txt': 'hello world',
    directory: null,
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

it('returns the buffer of the given file', async () => {
  expect(await api.readFile('file.txt')).toEqual(
    fs.readFileSync(api.resolve('file.txt')),
  )
})

it('returns the stringified buffer given "encoding" argument', async () => {
  expect(await api.readFile('file.txt', 'utf8')).toEqual('hello world')
})

it('throws an exception when provided a directory path', async () => {
  await expect(() => api.readFile('directory')).rejects.toThrow(
    'Failed to read a file at "directory": given path points to a directory.',
  )
})
