export const emptyQuota = {
  tokenUsed: 0,
  tokenLimit: 0,
  tokenRemaining: 0,
  rawTokenUsed: 0,
  moneyUsed: 0,
  moneyLimit: 0,
  usagePercent: 0,
  unlimited: false
}

export const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export const formatToken = (value) => {
  const n = toNumber(value)
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(2)}B`
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${Math.round(n)}`
}

export const formatMoney = (value) => `¥${toNumber(value).toFixed(2)}`

export const quotaPercent = (quota = emptyQuota) => {
  if (!quota || quota.unlimited) return 0
  if (quota.usagePercent !== null && quota.usagePercent !== undefined) {
    return Math.min(100, Math.max(0, Math.round(toNumber(quota.usagePercent))))
  }
  const limit = toNumber(quota.tokenLimit)
  if (!limit) return 0
  return Math.min(100, Math.max(0, Math.round((toNumber(quota.tokenUsed) / limit) * 100)))
}

export const formatQuotaPair = (quota = emptyQuota) => {
  if (!quota || quota.unlimited) return `${formatToken(quota?.tokenUsed)} / 不限`
  return `${formatToken(quota.tokenUsed)} / ${formatToken(quota.tokenLimit)}`
}

export const buildLocalStats = (chats = [], availableModels = []) => {
  const messages = chats.flatMap(chat => chat.messages || [])
  const assistantMessages = messages.filter(message => message.role === 'assistant')
  const text = messages.map(message => message.content || '').join('')
  const byModel = new Map()
  const byTopic = new Map()
  const active = new Map()

  chats.forEach(chat => {
    byTopic.set(chat.title || '未命名话题', chat.messages?.length || 0)
    ;(chat.messages || []).forEach(message => {
      const date = new Date(message.timestamp || chat.createdAt || Date.now())
      const key = date.toISOString().slice(0, 10)
      active.set(key, (active.get(key) || 0) + 1)
      if (message.role === 'assistant') {
        const model = message.model || '默认模型'
        byModel.set(model, (byModel.get(model) || 0) + 1)
      }
    })
  })

  const activity = Array.from({ length: 365 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (364 - index))
    const key = date.toISOString().slice(0, 10)
    return { date: key, count: active.get(key) || 0 }
  })

  return {
    assistantCount: Math.max(1, availableModels.length ? 1 : 0),
    topicCount: chats.length,
    messageCount: messages.length,
    assistantMessageCount: assistantMessages.length,
    wordCount: text.length,
    activity,
    modelRows: Array.from(byModel.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    assistantRows: [{ name: 'Honghu AI', count: assistantMessages.length }],
    topicRows: Array.from(byTopic.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }
}

export const quotaLevel = (percent) => {
  if (percent >= 95) return 'danger'
  if (percent >= 80) return 'warn'
  return 'ok'
}
