import * as fs from 'fs-extra'
import { fsTeardown } from '../src'

const api = fsTeardown({
  rootDir: 'reset',
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

it('removes the runtime paths', async () => {
  await api.create({ 'one.txt': null, 'two.txt': null })
  expect(fs.existsSync(api.resolve('one.txt'))).toEqual(true)
  expect(fs.existsSync(api.resolve('two.txt'))).toEqual(true)

  await api.reset()
  expect(fs.existsSync(api.resolve('one.txt'))).toEqual(false)
  expect(fs.existsSync(api.resolve('two.txt'))).toEqual(false)
  expect(await api.read('file.txt', 'utf8')).toEqual('hello world')
})

it('removes multiple runtime paths', async () => {
  await api.create({ 'abc.txt': null })
  expect(fs.existsSync(api.resolve('abc.txt'))).toEqual(true)

  await api.create({ 'def.txt': null })
  expect(fs.existsSync(api.resolve('def.txt'))).toEqual(true)

  await api.reset()
  expect(fs.existsSync(api.resolve('abc.txt'))).toEqual(false)
  expect(fs.existsSync(api.resolve('def.txt'))).toEqual(false)
  expect(await api.read('file.txt', 'utf8')).toEqual('hello world')
})

it('restores the initial paths edited on runtime', async () => {
  await api.edit('file.txt', 'welcome to the jungle')
  expect(await api.read('file.txt', 'utf8')).toEqual('welcome to the jungle')

  await api.reset()
  expect(await api.read('file.txt', 'utf8')).toEqual('hello world')
})

it('restores the initial paths removed on runtime', async () => {
  await api.remove('file.txt')
  expect(fs.existsSync(api.resolve('file.txt'))).toEqual(false)

  await api.reset()
  expect(await api.read('file.txt', 'utf8')).toEqual('hello world')
})
