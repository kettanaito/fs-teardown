import * as path from 'path'
import { createFsFromVolume, IFs, Volume } from 'memfs'

const memfs = createFsFromVolume(new Volume())

export type FileContent = string | Record<string, any>

export interface TeardownControls {
  fs: IFs
  prepare: () => Promise<string[] | void>
  cleanup: () => void
  getPath: (...segments: string[]) => string
  editFile: (filePath: string, nextContents: FileContent) => void
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

function resolveFileContent(content?: FileContent): string {
  if (!content) {
    return ''
  }

  if (typeof content === 'string') {
    return content
  }

  return JSON.stringify(content, null, 2)
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
    const resolvedContent = resolveFileContent(content)
    memfs.writeFileSync(absoluteFilePath, resolvedContent, { encoding: 'utf8' })

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
    memfs.mkdirpSync(nextCtx)

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
  memfs.mkdirpSync(absoluteBaseDir)

  const api: TeardownControls = {
    fs: memfs,
    prepare() {
      return runOperationsInCtx(operations, absoluteBaseDir)
    },
    cleanup() {
      memfs.rmdirSync(absoluteBaseDir, { recursive: true })
    },
    getPath(...segments) {
      return path.resolve(absoluteBaseDir, ...segments)
    },
    editFile(filePath, nextContents) {
      const absolutePath = api.getPath(filePath)
      memfs.readFileSync(absolutePath)
      memfs.writeFileSync(absolutePath, resolveFileContent(nextContents))
    },
    removeFile(filePath) {
      const absolutePath = api.getPath(filePath)

      if (!memfs.existsSync(absolutePath)) {
        throw new Error(
          `Failed to remove path: ${absolutePath}. The given path does not exist.`,
        )
      }

      memfs.unlinkSync(absolutePath)
    },
  }

  return api
}
