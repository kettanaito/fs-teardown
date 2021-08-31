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

async function emitTree(
  tree: FileTree,
  rootDir: string,
  initialPaths: string[] = [],
): Promise<string[]> {
  const paths: string[] = initialPaths
  const operations: Promise<unknown>[] = []

  for (const [filePath, content] of Object.entries(tree)) {
    const absoluteFilePath = path.resolve(rootDir, filePath)
    const isDirectory = path.extname(filePath) === ''
    paths.push(absoluteFilePath)

    if (isDirectory) {
      await fs.mkdirp(absoluteFilePath)

      if (content !== null && typeof content === 'object') {
        operations.push(emitTree(content, absoluteFilePath, paths))
      }

      continue
    }

    await fs.createFile(absoluteFilePath)

    if (content != null && typeof content !== 'object') {
      await writeFile(absoluteFilePath, content)
    }

    operations.push(fs.createFile(absoluteFilePath))
  }

  await Promise.all(operations)
  return paths
}

export function fsTeardown(options: TeardownOptions) {
  const rootDir = path.isAbsolute(options.rootDir)
    ? options.rootDir
    : path.relative(CWD, options.rootDir)
  const runtimePaths = new Set<string>()

  const api = {
    async prepare(): Promise<string> {
      if (options.paths) {
        await emitTree(options.paths, rootDir)
      } else {
        await fs.mkdirp(rootDir)
      }

      return rootDir
    },
    resolve(...segments: string[]): string {
      return path.resolve(rootDir, ...segments)
    },
    async create(paths: FileTree): Promise<void> {
      const newTree = await emitTree(paths, rootDir)
      newTree.forEach((path) => runtimePaths.add(path))
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
    async reset(): Promise<void> {
      const operations: Promise<unknown>[] = []

      for (const path of runtimePaths) {
        operations.push(
          api.remove(path).then(() => {
            runtimePaths.delete(path)
          }),
        )
      }

      await Promise.all(operations)
    },
    async cleanup(): Promise<void> {
      return fs.remove(rootDir)
    },
  }

  return api
}
