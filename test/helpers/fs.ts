import * as fs from 'fs-extra'

export function isDirectory(path: string): boolean {
  return fs.statSync(path).isDirectory()
}

export function read(filePath: string): string {
  return fs.readFileSync(filePath).toString('utf8')
}
