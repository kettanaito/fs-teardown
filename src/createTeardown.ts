import * as fs from 'fs'
import * as path from 'path'
import * as fsExtra from 'fs-extra'

export interface TeardownControls {
  prepare: () => Promise<string[] | void>
  cleanup: () => Promise<void>
  getPath: (...segments: string[]) => string
  editFile: (filePath: string, nextContents: string) => void
  removeFile: (filePath: string) => void
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
  content?: string | Record<string, unknown>,
): TeardownOperation {
  return async (ctx) => {
    const absoluteFilePath = path.resolve(ctx, filePath)
    await fsExtra.createFile(absoluteFilePath)

    if (content) {
      if (typeof content === 'string') {
        const normalizedContent = content.trim()
        await fs.promises.writeFile(absoluteFilePath, normalizedContent)
      } else {
        await fsExtra.writeJSON(absoluteFilePath, content)
      }
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

  const api: TeardownControls = {
    prepare() {
      return runOperationsInCtx(operations, absoluteBaseDir)
    },
    cleanup() {
      return fsExtra.remove(absoluteBaseDir)
    },
    getPath(...segments) {
      return path.resolve(absoluteBaseDir, ...segments)
    },
    editFile(filePath, nextContents) {
      const absolutePath = api.getPath(filePath)
      fsExtra.readFileSync(absolutePath)
      fsExtra.writeFileSync(absolutePath, nextContents)
    },
    removeFile(filePath) {
      const absolutePath = api.getPath(filePath)

      if (!fsExtra.existsSync(absolutePath)) {
        throw new Error(
          `Failed to remove path: ${absolutePath}. The given path does not exist.`,
        )
      }

      fsExtra.removeSync(absolutePath)
    },
  }

  return api
}
