import * as fs from 'fs'
import * as path from 'path'
import * as fsExtra from 'fs-extra'
import { invariant } from 'outvariant'

type FileContent = string | Record<string, unknown>

export interface TeardownControls {
  prepare: () => Promise<string[] | void>
  cleanup: () => Promise<void>
  getPath: (...segments: string[]) => string
  addFile: (filePath: string, contents?: FileContent) => Promise<string>
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
  content?: FileContent,
): TeardownOperation {
  return async (ctx) => {
    const absoluteFilePath = path.resolve(ctx, filePath)
    await fsExtra.createFile(absoluteFilePath)

    if (content) {
      if (typeof content === 'string') {
        await fs.promises.writeFile(absoluteFilePath, content)
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
  const absoluteBaseDir = path.isAbsolute(baseDir)
    ? baseDir
    : path.resolve(process.cwd(), baseDir)

  const api: TeardownControls = {
    prepare() {
      if (!fs.existsSync) {
        fs.mkdirSync(absoluteBaseDir)
      }

      return runOperationsInCtx(operations, absoluteBaseDir)
    },
    cleanup() {
      return fsExtra.remove(absoluteBaseDir)
    },
    getPath(...segments) {
      return path.resolve(absoluteBaseDir, ...segments)
    },
    addFile(filePath, content) {
      return addFile(filePath, content)(absoluteBaseDir)
    },
    editFile(filePath, nextContents) {
      const absolutePath = api.getPath(filePath)

      invariant(
        fs.existsSync(absolutePath),
        'Failed to edit file at "%s": file does not exist. Did you forget to run "addFile"?',
        path.relative(absoluteBaseDir, absolutePath),
      )

      fsExtra.readFileSync(absolutePath)
      fsExtra.writeFileSync(absolutePath, nextContents)
    },
    removeFile(filePath) {
      const absolutePath = api.getPath(filePath)

      invariant(
        fsExtra.existsSync(absolutePath),
        'Failed to remove file at "%s": file does not exist. Did you forget to run "addFile"?',
        path.relative(absoluteBaseDir, absolutePath),
      )

      fsExtra.removeSync(absolutePath)
    },
  }

  return api
}
