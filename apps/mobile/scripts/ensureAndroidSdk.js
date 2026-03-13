const fs = require('fs')
const path = require('path')

function normalizeForGradle(inputPath) {
  return inputPath.replace(/\\/g, '\\\\')
}

function resolveSdkPath() {
  const candidates = []

  if (process.env.ANDROID_HOME) candidates.push(process.env.ANDROID_HOME)
  if (process.env.ANDROID_SDK_ROOT) candidates.push(process.env.ANDROID_SDK_ROOT)

  if (process.env.LOCALAPPDATA) {
    candidates.push(path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'))
  }

  if (process.env.USERPROFILE) {
    candidates.push(path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Android', 'Sdk'))
  }

  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || null
}

function main() {
  const androidDir = path.resolve(__dirname, '..', 'android')
  const localPropertiesPath = path.join(androidDir, 'local.properties')

  if (!fs.existsSync(androidDir)) {
    console.error('[android] Missing android directory. Run "npx @capacitor/cli add android" first.')
    process.exit(1)
  }

  const sdkPath = resolveSdkPath()
  if (!sdkPath) {
    console.error('[android] Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT, or install Android SDK.')
    process.exit(1)
  }

  const localPropertiesContents = `sdk.dir=${normalizeForGradle(sdkPath)}\n`
  fs.writeFileSync(localPropertiesPath, localPropertiesContents, 'utf8')
  console.log(`[android] Wrote ${localPropertiesPath}`)
}

main()
