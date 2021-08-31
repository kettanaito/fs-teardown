import * as fs from 'fs-extra'
import { fsTeardown } from '../src'
import { read } from './helpers/fs'

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
  expect(read(api.resolve('file.txt'))).toEqual('hello world')
})

it('removes multiple runtime paths', async () => {
  await api.create({ 'abc.txt': null })
  expect(fs.existsSync(api.resolve('abc.txt'))).toEqual(true)

  await api.create({ 'def.txt': null })
  expect(fs.existsSync(api.resolve('def.txt'))).toEqual(true)

  await api.reset()
  expect(fs.existsSync(api.resolve('abc.txt'))).toEqual(false)
  expect(fs.existsSync(api.resolve('def.txt'))).toEqual(false)
  expect(read(api.resolve('file.txt'))).toEqual('hello world')
})