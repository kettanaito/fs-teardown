import * as path from 'path'
import * as fs from 'fs-extra'
import { invariant } from 'outvariant'

const CWD = process.cwd()

export type FileContent = string

export interface FileTree {
  [path: string]: FileContent | FileTree | null
}

export interface TeardownOptions {
  rootDir: string
  inMemory?: boolean
  paths?: FileTree
}

async function writeFile(path: string, content: FileContent): Promise<void> {
  return fs.writeFile(path, content)
}

async function emitTree(tree: FileTree, rootDir: string): Promise<any> {
  return Promise.all(
    Object.entries(tree).map(async ([filePath, content]) => {
      const absoluteFilePath = path.resolve(rootDir, filePath)
      const isDirectory = path.extname(filePath) === ''

      if (isDirectory) {
        await fs.mkdirp(absoluteFilePath)

        if (content !== null && typeof content === 'object') {
          return emitTree(content, absoluteFilePath)
        }

        return
      }

      await fs.createFile(absoluteFilePath)

      if (content === null || typeof content === 'object') {
        return
      }

      return writeFile(absoluteFilePath, content)
    }),
  )
}

export function fsTeardown(options: TeardownOptions) {
  const rootDir = path.isAbsolute(options.rootDir)
    ? options.rootDir
    : path.relative(CWD, options.rootDir)

  const api = {
    async prepare(): Promise<string> {
      if (options.paths) {
        await api.create(options.paths)
      }

      return rootDir
    },
    resolve(...segments: string[]): string {
      return path.resolve(rootDir, ...segments)
    },
    async create(paths: FileTree): Promise<void> {
      await emitTree(paths, rootDir)
    },
    async edit(filePath: string, content: FileContent) {
      const absolutePath = api.resolve(filePath)

      invariant(
        fs.existsSync(absolutePath),
        'Failed to edit the file at "%s": file does not exist. Did you forget to call "create"?',
        filePath,
      )

      fs.readFileSync(absolutePath)
      await writeFile(absolutePath, content)
    },
    async remove(filePath: string): Promise<void> {
      const absolutePath = api.resolve(filePath)

      invariant(
        fs.existsSync(absolutePath),
        'Failed to remove the file at "%s": file does not exist. Did you forget to call "create"?',
        filePath,
      )

      return fs.remove(absolutePath)
    },
    async cleanup(): Promise<void> {
      return fs.remove(rootDir)
    },
  }

  return api
}
