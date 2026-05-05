import axios from 'axios'

// ─── 统一 Base URL ───────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8080/api/v1'

// ─── Axios 客户端（用于普通 REST 请求）─────────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})
// 自动附加 X-User-Id 请求头
apiClient.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId')
  if (userId) config.headers['X-User-Id'] = userId
  return config
})
// ─── SSE 公共流式处理器 ───────────────────────────────────────────────────────
async function ssePost(url, body, onData, onError, onComplete) {
  const userId = localStorage.getItem('userId') || ''
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(userId ? { 'X-User-Id': userId } : {})
      },
      credentials: 'include',
      body: JSON.stringify(body)
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const jsonStr = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed
        if (!jsonStr) continue
        try {
          const chunk = JSON.parse(jsonStr)
          if (chunk.content) {
            fullText += chunk.content
            onData(chunk)
          }
        } catch { /* 非 JSON 行忽略 */ }
      }
    }

    onComplete(fullText)
  } catch (error) {
    onError(error)
  }
}

// ─── 聊天接口 ─────────────────────────────────────────────────────────────────

/**
 * 持久化结构化流式聊天（带 sessionId + 数据库存储）
 * POST /api/v1/chat/structured/stream/persistent
 */
export const persistentStreamChat = (chatRequest, onData, onError, onComplete) => {
  const body = {
    message: chatRequest.message,
    sessionId: chatRequest.sessionId || undefined,
    userId: chatRequest.userId || localStorage.getItem('userId') || undefined,
    model: chatRequest.model ?? undefined,
    stream: true,
    systemMessage: chatRequest.systemMessage,
    temperature: chatRequest.temperature ?? 0.7,
    maxTokens: chatRequest.maxTokens ?? 4096,
    attachmentFileIds: chatRequest.attachmentFileIds?.length ? chatRequest.attachmentFileIds : undefined
  }
  return ssePost(`${BASE}/chat/structured/stream/persistent`, body, onData, onError, onComplete)
}

// ─── 会话管理接口 ────────────────────────────────────────────────────────────

export const getUserSessions = async (userId) => {
  const res = await apiClient.get(`/sessions/user/${userId}`)
  return res.data
}

export const getSessionChatHistory = async (sessionId) => {
  const res = await apiClient.get(`/chat/history/${sessionId}`)
  return res.data
}

export const renameSession = async (sessionId, name) => {
  const res = await apiClient.put(`/sessions/${sessionId}/rename`, null, { params: { name } })
  return res.data
}

export const deleteSession = async (sessionId) => {
  const res = await apiClient.delete(`/sessions/${sessionId}`)
  return res.data
}

export default apiClient
