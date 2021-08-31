import * as path from 'path'
import * as fs from 'fs-extra'
import { invariant } from 'outvariant'

export type FileContent = string

export interface FileTree {
  [path: string]: FileContent | FileTree | null
}

export interface TeardownOptions {
  rootDir: string
  paths?: FileTree
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
      await fs.writeFile(absoluteFilePath, content)
    }

    operations.push(fs.createFile(absoluteFilePath))
  }

  await Promise.all(operations)
  return paths
}

export function fsTeardown(options: TeardownOptions) {
  const rootDir = path.isAbsolute(options.rootDir)
    ? options.rootDir
    : path.relative(process.cwd(), options.rootDir)

  const api = {
    /**
     * Creates a root directory. Emits the initial file tree,
     * if provided.
     */
    async prepare(): Promise<string> {
      if (options.paths) {
        await emitTree(options.paths, rootDir)
      } else {
        await fs.mkdirp(rootDir)
      }

      return rootDir
    },
    /**
     * Returns an absolute path to the file/directory.
     */
    resolve(...segments: string[]): string {
      return path.resolve(rootDir, ...segments)
    },
    /**
     * Creates a file tree relative to the root directory.
     */
    async create(paths: FileTree): Promise<void> {
      await emitTree(paths, rootDir)
    },
    /**
     * Edits a file at the given path.
     */
    async edit(filePath: string, content: FileContent): Promise<void> {
      const absolutePath = api.resolve(filePath)

      invariant(
        fs.existsSync(absolutePath),
        'Failed to edit the file at "%s": file does not exist. Did you forget to call "create"?',
        filePath,
      )

      invariant(
        !fs.statSync(absolutePath).isDirectory(),
        'Failed to edit the file at "%s": given path is a directory.',
        filePath,
      )

      fs.readFileSync(absolutePath)
      await fs.writeFile(absolutePath, content)
    },
    /**
     * Removes a file/directory at the given path.
     */
    async remove(filePath: string): Promise<void> {
      const absolutePath = api.resolve(filePath)

      invariant(
        fs.existsSync(absolutePath),
        'Failed to remove the file at "%s": file does not exist. Did you forget to call "create"?',
        filePath,
      )

      return fs.remove(absolutePath)
    },
    /**
     * Resets the root directory to the initial state.
     * Reverts any runtime changes done to the file tree.
     */
    async reset(): Promise<void> {
      await api.cleanup()
      await api.prepare()
    },
    /**
     * Removes the root directory and all its files.
     */
    async cleanup(): Promise<void> {
      return fs.remove(rootDir)
    },
  }

  return api
}
