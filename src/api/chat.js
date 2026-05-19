import axios from 'axios'
import { attachIdentityHeaders, buildIdentityHeaders, getStoredUserId } from '@/api/identity'

// 统一 Base URL
const BASE = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8080/api/v1'

// Axios 客户端用于普通 REST 请求。所有需要用户上下文的接口统一注入 X-User-Id，
// 避免聊天流式请求能通过、历史消息/会话管理却因为缺少身份头被后端拦截。
const apiClient = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

apiClient.interceptors.request.use(config => attachIdentityHeaders(config))

// SSE 公共流式处理器
async function ssePost(url, body, onData, onError, onComplete) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...buildIdentityHeaders(body?.userId)
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
        } catch {
          // SSE 里可能混入心跳或非 JSON 行，跳过即可。
        }
      }
    }

    onComplete(fullText)
  } catch (error) {
    onError(error)
  }
}

/**
 * 持久化结构化流式聊天（带 sessionId + 数据库存储）。
 * POST /api/v1/chat/structured/stream/persistent
 */
export const persistentStreamChat = (chatRequest, onData, onError, onComplete) => {
  const body = {
    message: chatRequest.message,
    sessionId: chatRequest.sessionId || undefined,
    userId: chatRequest.userId || getStoredUserId() || undefined,
    model: chatRequest.model ?? undefined,
    stream: true,
    systemMessage: chatRequest.systemMessage,
    temperature: chatRequest.temperature ?? 0.7,
    maxTokens: chatRequest.maxTokens ?? 4096,
    attachmentFileIds: chatRequest.attachmentFileIds?.length ? chatRequest.attachmentFileIds : undefined
  }
  return ssePost(`${BASE}/chat/structured/stream/persistent`, body, onData, onError, onComplete)
}

export const getUserSessions = async (userId) => {
  const res = await apiClient.get(`/sessions/user/${userId}`, {
    headers: buildIdentityHeaders(userId)
  })
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
