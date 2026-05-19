import { buildIdentityHeaders } from '@/api/identity'

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
    headers: { 'Content-Type': 'application/json', ...buildIdentityHeaders(userId) },
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
