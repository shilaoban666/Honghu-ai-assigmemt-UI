/**
 * RAG 文件上传 API
 * 基础路径: /api/v1/rag
 *
 * 上传流程:
 *   1. POST /api/v1/rag/{userId}/upload-url  → 获取预签名 URL
 *   2. PUT  <uploadUrl>                       → 直传文件到 S3
 */

const BASE = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8080/api/v1'

/**
 * 第一步：获取 S3 预签名上传 URL
 *
 * @param {string} userId  - 当前用户名（路径参数）
 * @param {object} params
 * @param {string} params.sessionId  - 会话 ID
 * @param {string} params.fileType   - 文件扩展名，如 "pdf"、"jpg"
 * @param {string} params.fileName   - 原始文件名
 * @param {number} params.fileSize   - 文件字节数
 * @returns {Promise<{uploadUrl,objectKey,contentType,fileType,expirationMinutes,fileId}>}
 */
export const getUploadUrl = async (userId, { sessionId, fileType, fileName, fileSize }) => {
  const response = await fetch(`${BASE}/rag/${userId}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    credentials: 'include',
    body: JSON.stringify({ sessionId, fileType, fileName, fileSize })
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`获取上传地址失败 (${response.status})${errText ? ': ' + errText : ''}`)
  }

  const json = await response.json()
  // 接口直接返回 { uploadUrl, objectKey, contentType, fileType, expirationMinutes, fileId }
  if (!json.uploadUrl) {
    throw new Error(`接口返回数据格式错误: ${JSON.stringify(json)}`)
  }
  return json
}

/**
 * 第二步：将文件直传到 S3 预签名 URL
 *
 * @param {string}   uploadUrl    - 预签名 PUT URL
 * @param {File}     file         - 原始 File 对象
 * @param {string}   contentType  - 接口返回的 MIME 类型（必须完全一致）
 * @param {Function} [onProgress] - 进度回调 (percent: 0-100)
 * @returns {Promise<void>}
 */
export const uploadFileToS3 = (uploadUrl, file, contentType, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    // S3 预签名 URL 要求 Content-Type 与签名时完全一致
    xhr.setRequestHeader('Content-Type', contentType)

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })
    }

    xhr.onload = () => {
      // S3 直传成功状态码为 200 或 204
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`S3 上传失败，状态码: ${xhr.status}`))
      }
    }
    xhr.onerror = () => reject(new Error('网络错误，S3 上传失败'))
    xhr.onabort = () => reject(new Error('上传已取消'))

    xhr.send(file)
  })
}

/**
 * 第三步：告知后端文件已上传，创建 RECEIVED 状态记录
 *
 * @param {string} userId
 * @param {object} params
 * @param {string} params.objectKey  - S3 objectKey（预签名接口返回）
 * @param {string} [params.fileName] - 原始文件名
 * @returns {Promise<RagFileStatusResponse>}
 */
export const registerUploadedFile = async (userId, { objectKey, fileName }) => {
  const response = await fetch(`${BASE}/rag/files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId
    },
    credentials: 'include',
    body: JSON.stringify({ objectKey, fileName })
  })
  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`文件登记失败 (${response.status})${errText ? ': ' + errText : ''}`)
  }
  return response.json()
}

/**
 * 查询会话下全部文件状态列表
 *
 * @param {string} sessionId
 * @param {string} userId
 * @returns {Promise<RagFileStatusResponse[]>}
 */
export const getSessionFiles = async (sessionId, userId) => {
  const response = await fetch(`${BASE}/rag/sessions/${sessionId}/files`, {
    headers: { 'X-User-Id': userId },
    credentials: 'include'
  })
  if (!response.ok) throw new Error(`查询会话文件失败 (${response.status})`)
  return response.json()
}

/**
 * 查询单文件 RAG 状态（单次轮询）
 *
 * @param {string} fileId
 * @param {string} userId
 * @returns {Promise<RagFileStatusResponse>}
 */
export const getFileStatus = async (fileId, userId) => {
  const response = await fetch(`${BASE}/rag/files/${fileId}/status`, {
    headers: { 'X-User-Id': userId },
    credentials: 'include'
  })
  if (!response.ok) throw new Error(`查询文件状态失败 (${response.status})`)
  return response.json()
}

/**
 * 第七步：通过 fetch 实现 SSE 订阅（支持自定义 X-User-Id 请求头）
 *
 * @param {string}   fileId
 * @param {string}   userId
 * @param {object}   options
 * @param {Function} options.onStatus           - 收到 rag-status 事件时回调
 * @param {Function} [options.onTimeout]        - 收到 timeout 事件时回调
 * @param {Function} [options.onError]          - 连接/解析出错时回调
 * @param {number}   [options.timeoutSeconds]   - 最长等待秒数，默认 120
 * @param {number}   [options.pollIntervalMillis] - 后端轮询间隔，默认 1500
 * @returns {Function} close - 调用后立即断开 SSE 连接
 */
export const subscribeFileStatus = (fileId, userId, {
  onStatus,
  onTimeout,
  onError,
  timeoutSeconds = 120,
  pollIntervalMillis = 1500
}) => {
  const url = `${BASE}/rag/files/${fileId}/status/stream?timeoutSeconds=${timeoutSeconds}&pollIntervalMillis=${pollIntervalMillis}`
  const controller = new AbortController()
  let closed = false

  const close = () => {
    if (!closed) {
      closed = true
      controller.abort()
    }
  }

  fetch(url, {
    headers: {
      'Accept': 'text/event-stream',
      'X-User-Id': userId,
      'Cache-Control': 'no-cache'
    },
    credentials: 'include',
    signal: controller.signal
  }).then(async (response) => {
    if (!response.ok) {
      onError?.(new Error(`SSE 连接失败 (${response.status})`))
      return
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let currentEvent = ''

    const processLine = (line) => {
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        const dataStr = line.slice(5).trim()
        if (!dataStr) return
        try {
          const data = JSON.parse(dataStr)
          if (currentEvent === 'rag-status') {
            onStatus?.(data)
            if (data.completed) close()
          } else if (currentEvent === 'timeout') {
            onTimeout?.(data)
            close()
          }
        } catch { /* 非 JSON 行忽略 */ }
        currentEvent = ''
      }
    }

    const pump = async () => {
      while (!closed) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()
        lines.forEach(processLine)
      }
    }

    pump().catch((err) => {
      if (!closed) onError?.(err)
    })
  }).catch((err) => {
    if (!closed && err.name !== 'AbortError') onError?.(err)
  })

  return close
}

/**
 * 获取文件预签名下载 URL（用于跨会话预览，15 分钟有效）
 *
 * @param {string} fileId
 * @param {string} userId
 * @returns {Promise<string>} downloadUrl
 */
export const getFileDownloadUrl = async (fileId, userId) => {
  const response = await fetch(`${BASE}/rag/files/${fileId}/download-url`, {
    headers: { 'X-User-Id': userId },
    credentials: 'include'
  })
  if (!response.ok) throw new Error(`获取下载地址失败 (${response.status})`)
  const json = await response.json()
  return json.downloadUrl
}

/**
 * 从文件名提取扩展名（小写，无点号）
 * e.g. "report.pdf" → "pdf"，"image.JPEG" → "jpeg"
 *
 * @param {string} filename
 * @returns {string}
 */
export const getFileExtension = (filename) => {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot < 0 || lastDot === filename.length - 1) return 'bin'
  return filename.slice(lastDot + 1).toLowerCase()
}
