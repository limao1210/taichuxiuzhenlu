const fs = require('fs')
const path = require('path')

const VERSION_FILE = path.join(__dirname, 'files', 'app', 'version.json')
const APK_DIR = path.join(__dirname, 'files', 'app')
const APK_NAME = 'xiuxian-release.apk'
const APK_PATH = path.join(APK_DIR, APK_NAME)

// ===== 帮助 =====
function showHelp() {
  console.log(`
用法:
  node release.js                     交互模式（一步步输入）
  node release.js <code> <name> <log> 快速更新版本
  node release.js <code> <name> <log> <apk路径>  更新版本 + 导入APK

示例:
  node release.js 2026060301 2.4.0 "修复闪避率\\n丹药重做"
  node release.js 2026060301 2.4.0 "修复闪避率" D:/build/app-release.apk
`)
}

// ===== 读取当前版本 =====
function readCurrentVersion() {
  if (!fs.existsSync(VERSION_FILE)) return null
  try { return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8')) } catch { return null }
}

// ===== 写入 version.json =====
function writeVersion(code, name, log) {
  const port = 12101
  const current = readCurrentVersion()
  const downloadUrl = current?.downloadUrl || `http://你的IP:${port}/app/${APK_NAME}`

  const json = {
    versionCode: Number(code),
    versionName: String(name),
    downloadUrl,
    updateLog: String(log).replace(/\\n/g, '\n'),
    forceUpdate: current?.forceUpdate || false
  }

  // 确保目录存在
  if (!fs.existsSync(APK_DIR)) fs.mkdirSync(APK_DIR, { recursive: true })

  fs.writeFileSync(VERSION_FILE, JSON.stringify(json, null, 2), 'utf-8')
  console.log(`\n[OK] version.json 已更新:`)
  console.log(`  versionCode: ${json.versionCode}`)
  console.log(`  versionName: ${json.versionName}`)
  console.log(`  downloadUrl: ${json.downloadUrl}`)
  console.log(`  updateLog: ${json.updateLog.replace(/\n/g, '\\n')}`)
}

// ===== 复制 APK =====
function copyApk(sourcePath) {
  const resolved = path.resolve(sourcePath)

  if (!fs.existsSync(resolved)) {
    console.log(`\n[错误] APK 文件不存在: ${resolved}`)
    console.log('请确认路径正确。')
    return false
  }

  if (!fs.existsSync(APK_DIR)) fs.mkdirSync(APK_DIR, { recursive: true })

  // 如果目标已存在，备份旧文件
  if (fs.existsSync(APK_PATH)) {
    const backup = APK_PATH + '.' + Date.now() + '.bak'
    fs.renameSync(APK_PATH, backup)
    console.log(`[信息] 旧 APK 已备份为: ${path.basename(backup)}`)
  }

  fs.copyFileSync(resolved, APK_PATH)
  const stat = fs.statSync(APK_PATH)
  const sizeMB = (stat.size / 1024 / 1024).toFixed(1)
  console.log(`[OK] APK 已导入: ${APK_NAME} (${sizeMB} MB)`)
  return true
}

// ===== 检查 APK 是否存在 =====
function checkApkExists() {
  if (fs.existsSync(APK_PATH)) return true
  console.log(`\n[提醒] ${APK_DIR}\\${APK_NAME} 还没有 APK 文件。`)
  console.log('请手动将打包好的 APK 文件放到该目录，或使用以下命令导入:')
  console.log(`  node release.js <code> <name> <log> <apk路径>`)
  return false
}

// ===== 交互模式 =====
function interactive() {
  const readline = require('readline')
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const current = readCurrentVersion()
  if (current) {
    console.log('当前版本信息:')
    console.log(`  versionCode: ${current.versionCode}`)
    console.log(`  versionName: ${current.versionName}`)
    console.log(`  updateLog:   ${current.updateLog}`)
    console.log('')
  }

  const questions = [
    { q: `versionCode (当前 ${current?.versionCode || '无'}): `, key: 'code' },
    { q: `versionName (当前 ${current?.versionName || '无'}): `, key: 'name' },
    { q: '更新日志 (\\n 换行): ', key: 'log' },
    { q: 'APK 文件路径 (留空跳过): ', key: 'apk' }
  ]
  const answers = {}
  let idx = 0

  function ask() {
    if (idx >= questions.length) {
      rl.close()
      processAnswers()
      return
    }
    rl.question(questions[idx].q, (answer) => {
      answers[questions[idx].key] = answer
      idx++
      ask()
    })
  }

  function processAnswers() {
    if (!answers.code || !answers.name || !answers.log) {
      console.log('\n[错误] versionCode、versionName、updateLog 不能为空')
      process.exit(1)
    }
    writeVersion(answers.code, answers.name, answers.log)
    if (answers.apk) copyApk(answers.apk)
    checkApkExists()
    console.log('\n完成！确保 App.vue 里的 UPDATE_URL 指向正确的地址。')
  }

  ask()
}

// ===== 主入口 =====
const args = process.argv.slice(2)

if (args.length === 0) {
  interactive()
} else if (args.length === 1 && (args[0] === '-h' || args[0] === '--help')) {
  showHelp()
} else if (args.length >= 3) {
  writeVersion(args[0], args[1], args[2])
  if (args[3]) copyApk(args[3])
  checkApkExists()
  console.log('\n完成！确保 App.vue 里的 UPDATE_URL 指向正确的地址。')
} else {
  showHelp()
}
