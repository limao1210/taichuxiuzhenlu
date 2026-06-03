const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 8080
const ROOT = path.join(__dirname, 'files')

// 确保 files 目录存在
if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true })

const MIME = {
  '.json': 'application/json',
  '.apk': 'application/vnd.android.package-archive',
  '.html': 'text/html',
  '.txt': 'text/plain'
}

const server = http.createServer((req, res) => {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  // 去掉 query string
  const urlPath = req.url.split('?')[0]
  // 路径安全：防止 ../ 目录穿越
  const safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '')
  const filePath = path.join(ROOT, safePath)

  // 禁止访问根目录以外的文件
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403)
    return res.end('Forbidden')
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404)
    return res.end('Not Found')
  }

  const ext = path.extname(filePath).toLowerCase()
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream')
  // APK 不缓存
  if (ext === '.apk') {
    res.setHeader('Cache-Control', 'no-cache')
  }

  const stream = fs.createReadStream(filePath)
  stream.pipe(res)
  stream.on('error', () => {
    res.writeHead(500)
    res.end('Error')
  })
})

server.listen(PORT, () => {
  console.log(`更新服务器已启动: http://localhost:${PORT}`)
  console.log(`文件目录: ${ROOT}`)
  console.log('')
  console.log('使用说明:')
  console.log('  1. 把 version.json 和 APK 放到 files 目录')
  console.log('  2. 测试: 浏览器访问 http://localhost:8080/app/version.json')
  console.log('  3. App 端 UPDATE_URL = "http://你的IP:8080/app/version.json"')
  console.log('')
  console.log('按 Ctrl+C 停止服务器')
})
