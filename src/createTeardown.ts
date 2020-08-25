import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import * as fsExtra from 'fs-extra'

export interface TeardownControls {
  getPath: (...segments: string[]) => string
  prepare: () => Promise<string[] | void>
  cleanup: () => Promise<void>
}

export interface TeardownOperation {
  (ctx: string): Promise<string>
}

function runOperationsInCtx(
  operations: TeardownOperation[],
  ctx: string,
): Promise<string[]> {
  return Promise.all(operations.map((operation) => operation(ctx)))
}

/**
 * Creates a file at the given relative path with an optional content.
 */
export function addFile(
  filePath: string,
  content?: string | Record<string, any>,
): TeardownOperation {
  return async (ctx) => {
    const absoluteFilePath = path.resolve(ctx, filePath)
    await fsExtra.createFile(absoluteFilePath)

    if (content) {
      const writeContent =
        typeof content === 'string'
          ? util.promisify(fs.writeFile)
          : fsExtra.writeJSON

      await writeContent(absoluteFilePath, content)
    }

    return absoluteFilePath
  }
}

/**
 * Creates a directory at the given path with optional list of operations
 * to perform in the newly created directory.
 */
export function addDirectory(
  dirPath: string,
  ...operations: TeardownOperation[]
): TeardownOperation {
  return async (ctx) => {
    const nextCtx = path.resolve(ctx, dirPath)
    await fsExtra.mkdirp(nextCtx).catch(console.error)

    if (operations) {
      await runOperationsInCtx(operations, nextCtx)
    }

    return nextCtx
  }
}

export function createTeardown(
  baseDir: string,
  ...operations: TeardownOperation[]
): TeardownControls {
  const absoluteBaseDir = path.resolve(process.cwd(), baseDir)

  return {
    getPath(...segments) {
      return path.resolve(absoluteBaseDir, ...segments)
    },
    prepare() {
      return runOperationsInCtx(operations, absoluteBaseDir)
    },
    cleanup() {
      return fsExtra.remove(absoluteBaseDir)
    },
  }
}
