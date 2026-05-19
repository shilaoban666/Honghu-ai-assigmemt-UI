const toTimestamp = (value) => {
  if (Array.isArray(value)) {
    const [year, month = 1, day = 1, hour = 0, minute = 0, second = 0] = value
    return new Date(year, month - 1, day, hour, minute, second).getTime()
  }

  const timestamp = value ? new Date(value).getTime() : Date.now()
  return Number.isFinite(timestamp) ? timestamp : Date.now()
}

export const normalizeChatRole = (role) => {
  const value = String(role || '').trim().toLowerCase()
  if (value === 'assistant' || value === 'ai' || value === 'bot') return 'assistant'
  if (value === 'system') return 'system'
  return 'user'
}

export const extractHistoryList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.records)) return payload.records
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

export const normalizeHistoryMessage = (message = {}) => {
  const timestamp = toTimestamp(
    message.createdAt ??
    message.createdTime ??
    message.createTime ??
    message.timestamp
  )

  return {
    id: message.chatId ?? message.messageId ?? message.id ?? `${timestamp}-${message.chatRole || message.role || 'message'}`,
    role: normalizeChatRole(message.chatRole ?? message.role ?? message.messageRole ?? message.sender),
    content: String(message.content ?? message.message ?? message.text ?? message.chatContent ?? ''),
    timestamp,
    attachments: Array.isArray(message.attachments) ? message.attachments : []
  }
}

export const normalizeHistoryPayload = (payload) => (
  extractHistoryList(payload)
    .map(normalizeHistoryMessage)
    .filter(message => message.content || message.attachments.length > 0)
    .sort((a, b) => a.timestamp - b.timestamp)
)
