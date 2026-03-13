import fs from 'fs'
import path from 'path'

function getConfigRoots(): string[] {
  return [
    path.resolve(process.cwd(), 'config'),
    path.resolve(process.cwd(), 'apps/server/config'),
    path.resolve(__dirname, '../../config'),
  ]
}

export function getConfigCandidatePaths(fileName: string): string[] {
  const parsed = path.parse(fileName)
  const localName = `${parsed.name}.local${parsed.ext}`

  return getConfigRoots().flatMap((root) => [
    path.join(root, localName),
    path.join(root, fileName),
  ])
}

export function resolveFirstExistingConfigPath(fileName: string): string | null {
  for (const candidate of getConfigCandidatePaths(fileName)) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return null
}