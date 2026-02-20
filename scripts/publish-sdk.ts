import { execSync } from 'child_process'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'fs'

/**
 * Automates the "protected" publication of the Beacon SDK.
 * It pushes only the compiled dist folder, package.json, and docs to the public repo.
 */

const SDK_SOURCE = join(process.cwd(), 'packages', 'beacon-js')
const SDK_REPO_URL = 'https://github.com/Raft-The-Crab/Beacon-Sdk.git'
const TEMP_DIST_DIR = join(process.cwd(), 'tmp_sdk_dist')

function run(cmd: string, cwd = process.cwd()) {
    console.log(`> ${cmd}`)
    return execSync(cmd, { cwd, stdio: 'inherit' })
}

async function publish() {
    try {
        console.log('🚀 Preparing SDK Distribution...')

        // 1. Build the SDK
        console.log('📦 Building beacon-js...')
        run('pnpm build', SDK_SOURCE)

        // 2. Prepare temp repo
        if (existsSync(TEMP_DIST_DIR)) {
            rmSync(TEMP_DIST_DIR, { recursive: true, force: true })
        }
        mkdirSync(TEMP_DIST_DIR)

        // 3. Copy only necessary files
        const filesToCopy = ['package.json', 'README.md', 'LICENSE', 'CHANGELOG.md']
        filesToCopy.forEach(file => {
            const src = join(SDK_SOURCE, file)
            if (existsSync(src)) {
                copyFileSync(src, join(TEMP_DIST_DIR, file))
            }
        })

        // Copy dist folder
        const distSrc = join(SDK_SOURCE, 'dist')
        if (existsSync(distSrc)) {
            run(`cp -r "${distSrc}" "${TEMP_DIST_DIR}/"`)
        }

        // 4. Initialize and Push
        console.log('📡 Pushing to public SDK repo...')
        run('git init', TEMP_DIST_DIR)
        run('git add .', TEMP_DIST_DIR)
        run('git commit -m "Beacon SDK Build — Release v3.0.1"', TEMP_DIST_DIR)
        run('git branch -M main', TEMP_DIST_DIR)
        run(`git remote add origin ${SDK_REPO_URL}`, TEMP_DIST_DIR)

        console.log('\n⚠️  READY TO PUSH. Connect to remote and push manually if credentials are required.')
        console.log(`Cwd: ${TEMP_DIST_DIR}`)
        // run('git push -u origin main --force', TEMP_DIST_DIR)

        console.log('\n✅ SDK distribution prepared in tmp_sdk_dist')

    } catch (err) {
        console.error('❌ Failed to publish SDK:', err)
        process.exit(1)
    }
}

publish()
