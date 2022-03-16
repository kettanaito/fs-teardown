import { createTeardown } from '../src'

const api = createTeardown({
  rootDir: 'exec',
})

beforeAll(async () => {
  await api.prepare()
})

afterAll(async () => {
  await api.cleanup()
})

it('executes the given command in the root directory', async () => {
  const { stdout, stderr } = await api.exec('echo $PWD')

  expect(stderr).toEqual('')
  expect(stdout).toEqual(`/private${api.resolve('.')}\n`)
})

it('allows creating files directly', async () => {
  const { stdout, stderr } = await api.exec('echo "hello world" > new-file.txt')

  expect(stderr).toEqual('')
  expect(stdout).toEqual('')

  expect(await api.readFile('new-file.txt', 'utf8')).toEqual('hello world\n')
})

it('supports custom options', async () => {
  const { stdout, stderr } = await api.exec('echo $SECRET', {
    env: { SECRET: 'abc-123' },
  })

  expect(stdout).toEqual('abc-123\n')
  expect(stderr).toEqual('')
})
