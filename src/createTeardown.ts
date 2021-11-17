import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs-extra'
import { invariant } from 'outvariant'

export interface TeardownApi {
  /**
   * Creates a root directory. Emits the initial file tree,
   * if provided.
   */
  prepare(): Promise<string>

  /**
   * Returns an absolute path to the file/directory.
   */
  resolve(...segments: string[]): string

  /**
   * Creates a file tree relative to the root directory.
   */
  create(tree: FileTree): Promise<void>

  /**
   * Reads a file at the given path.
   */
  readFile(filePath: string): Promise<Buffer>
  readFile(filePath: string, encoding?: BufferEncoding): Promise<string>

  /**
   * Edits a file at the given path.
   */
  edit(filePath: string, nextContent: string): Promise<void>

  /**
   * Removes a file/directory at the given path.
   */
  remove(filePath: string): Promise<void>

  /**
   * Resets the root directory to the initial state.
   * Reverts any runtime changes done to the file tree.
   */
  reset(): Promise<void>

  /**
   * Removes the root directory and all its files.
   */
  cleanup(): Promise<void>
}

export type FileContent = string

export interface FileTree {
  [path: string]: FileContent | FileTree | null
}

export interface CreateTeardownOptions {
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
    const isDirectory =
      // Treat dot-files as files, not directories.
      !filePath.startsWith('.') &&
      // Otherwise treat file paths with extensions as files.
      path.extname(filePath) === ''

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

export function createTeardown(options: CreateTeardownOptions): TeardownApi {
  const rootDir = path.isAbsolute(options.rootDir)
    ? options.rootDir
    : path.resolve(os.tmpdir(), options.rootDir)

  const api: TeardownApi = {
    async prepare() {
      if (options.paths) {
        await emitTree(options.paths, rootDir)
      } else {
        await fs.mkdirp(rootDir)
      }

      return rootDir
    },

    resolve(...segments): string {
      return path.resolve(rootDir, ...segments)
    },

    async create(tree) {
      await emitTree(tree, rootDir)
    },

    async readFile(...args: Parameters<TeardownApi['readFile']>) {
      const [filePath, encoding] = args
      const absolutePath = api.resolve(filePath)

      invariant(
        fs.existsSync(absolutePath),
        'Failed to read a file at "%s": given path does not exist.',
        filePath,
      )

      const stats = fs.statSync(absolutePath)

      invariant(
        stats.isFile(),
        'Failed to read a file at "%s": given path points to a directory.',
        filePath,
      )

      const buffer = await fs.readFile(absolutePath)
      return encoding ? buffer.toString(encoding) : (buffer as any)
    },

    async edit(filePath, content) {
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

    async remove(filePath) {
      const absolutePath = api.resolve(filePath)

      invariant(
        fs.existsSync(absolutePath),
        'Failed to remove the file at "%s": file does not exist. Did you forget to call "create"?',
        filePath,
      )

      return fs.remove(absolutePath)
    },

    async reset() {
      await api.cleanup()
      await api.prepare()
    },

    async cleanup() {
      return fs.remove(rootDir)
    },
  }

  return api
}
