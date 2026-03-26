const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const MAX_ATTEMPTS = 4
const DELAYS_MS = [0, 800, 1600, 2500]
const serverRoot = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(serverRoot, '..', '..')
const prismaClientDir = (function findPrismaClient() {
  const localPath = path.join(serverRoot, 'node_modules', '.prisma', 'client')
  if (fs.existsSync(path.join(localPath, 'index.js'))) return localPath
  
  const rootPath = path.join(workspaceRoot, 'node_modules', '.prisma', 'client')
  return rootPath
})()

const prismaCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function cleanupTemporaryEngineFiles() {
  if (!fs.existsSync(prismaClientDir)) {
    return
  }

  try {
    for (const fileName of fs.readdirSync(prismaClientDir)) {
      if (/query_engine-.*\.node\.tmp\d+$/i.test(fileName)) {
        const filePath = path.join(prismaClientDir, fileName)
        try {
          fs.rmSync(filePath, { force: true })
        } catch {
          // Best-effort cleanup
        }
      }
    }
  } catch {
    // Best-effort
  }
}

function hasUsableGeneratedClient() {
  const indexExists = fs.existsSync(path.join(prismaClientDir, 'index.js'))
  if (!indexExists) return false
  
  // On Linux/Railway, we look for .so.node files. On Windows, .dll.node.
  // We just check if any engine file exists.
  try {
    const files = fs.readdirSync(prismaClientDir)
    return files.some(f => f.includes('query_engine-') && f.endsWith('.node'))
  } catch {
    return false
  }
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  cleanupTemporaryEngineFiles()

  if (DELAYS_MS[attempt - 1] > 0) {
    sleep(DELAYS_MS[attempt - 1])
  }

  const result = spawnSync(prismaCommand, ['run', 'prisma:generate:direct'], {
    cwd: serverRoot,
    stdio: 'inherit',
    env: process.env,
    shell: true,
  })

  if (result.status === 0 || hasUsableGeneratedClient()) {
    process.exit(0)
  }

  if (attempt < MAX_ATTEMPTS) {
    console.warn(`[prisma-generate-retry] prisma generate failed on attempt ${attempt}/${MAX_ATTEMPTS}, retrying...`)
    continue
  }

  process.exit(result.status || 1)
}