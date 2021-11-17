import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import { createTeardown } from '../../src'

it('creates a root directory in the OS tmpdir given a relative path', async () => {
  const api = createTeardown({
    rootDir: 'test-dir',
    paths: {
      'file.txt': null,
    },
  })

  await api
    .prepare()
    .then(() => {
      const absoluteFilePath = path.resolve(os.tmpdir(), 'test-dir/file.txt')

      expect(api.resolve('file.txt')).toEqual(absoluteFilePath)
      expect(fs.existsSync(absoluteFilePath)).toEqual(true)
    })
    .finally(api.cleanup)
})

it('creates a root directory at the given absolute path', async () => {
  const api = createTeardown({
    rootDir: path.resolve(__dirname, 'tmp'),
    paths: {
      'file.txt': null,
    },
  })

  await api
    .prepare()
    .then(() => {
      const absoluteFilePath = path.resolve(__dirname, 'tmp/file.txt')

      expect(api.resolve('file.txt')).toEqual(absoluteFilePath)
      expect(fs.existsSync(absoluteFilePath)).toEqual(true)
    })
    .finally(api.cleanup)
})
