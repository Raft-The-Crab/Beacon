const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const MAX_ATTEMPTS = 4
const DELAYS_MS = [0, 800, 1600, 2500]
const serverRoot = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(serverRoot, '..', '..')
const prismaClientDir = path.join(workspaceRoot, 'node_modules', '.prisma', 'client')
const prismaCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function cleanupTemporaryEngineFiles() {
  if (!fs.existsSync(prismaClientDir)) {
    return
  }

  for (const fileName of fs.readdirSync(prismaClientDir)) {
    if (/query_engine-.*\.dll\.node\.tmp\d+$/i.test(fileName)) {
      const filePath = path.join(prismaClientDir, fileName)
      try {
        fs.rmSync(filePath, { force: true })
      } catch {
        // Best-effort cleanup between retries.
      }
    }
  }
}

function hasUsableGeneratedClient() {
  return fs.existsSync(path.join(prismaClientDir, 'index.js'))
    && fs.existsSync(path.join(prismaClientDir, 'query_engine-windows.dll.node'))
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

  if (result.status === 0) {
    process.exit(0)
  }

  if (attempt < MAX_ATTEMPTS) {
    console.warn(`[prisma-generate-retry] prisma generate failed on attempt ${attempt}/${MAX_ATTEMPTS}, retrying...`)
    continue
  }

  if (process.platform === 'win32' && hasUsableGeneratedClient()) {
    console.warn('[prisma-generate-retry] Prisma engine is already present; continuing despite final Windows rename failure.')
    process.exit(0)
  }

  process.exit(result.status || 1)
}